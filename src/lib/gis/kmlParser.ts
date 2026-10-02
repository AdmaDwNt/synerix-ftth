// ====================================================================
// CLIENT-SIDE KML/KMZ PARSER & SANITIZER (JSZip & @tmcw/togeojson)
// ====================================================================

import JSZip from "jszip";
import { kml } from "@tmcw/togeojson";
import { NodeType, CableType, ParsedGisPayload } from "@/lib/types/gis";
import { calculateHaversineDistance } from "@/lib/ftth/distance";

/**
 * Mendeteksi kategori node FTTH secara otomatis berdasarkan nama dan deskripsi
 */
export function classifyNodeType(name: string, description: string = "", folder: string = ""): NodeType {
    const text = `${name} ${description} ${folder}`.toUpperCase();

    if (text.includes("SERVER") || text.includes("HEADEND")) return "SERVER";
    if (text.includes("POP")) return "POP";
    if (text.includes("ODC")) return "ODC";
    if (text.includes("ODP")) return "ODP";
    if (text.includes("TIANG") || text.startsWith("T-") || text.startsWith("T.") || text.includes("POLE")) return "TIANG";
    if (text.includes("DISMANTLE") || text.includes("CHURN")) return "DISMANTLE";
    if (text.includes("CUSTOMER") || text.includes("PELANGGAN") || text.includes("CUST-")) return "CUSTOMER";
    if (text.includes("CLOSURE") || text.includes("JOINT BOX") || text.includes("JB-")) return "CLOSURE";

    return "ODP"; // Default node FTTH terbanyak
}

/**
 * Mendeteksi tipe kabel fiber optik berdasarkan nama dan deskripsi
 */
export function classifyCableType(name: string, description: string = ""): CableType {
    const text = `${name} ${description}`.toUpperCase();

    if (text.includes("FEEDER") || text.includes("FDR")) return "FEEDER";
    if (text.includes("BACKBONE") || text.includes("BB")) return "BACKBONE";
    if (text.includes("DROP") || text.includes("DC")) return "DROP_CABLE";

    return "DISTRIBUTION";
}

/**
 * Menentukan warna standar untuk kabel fiber optik
 */
export function getCableColor(cableType: CableType, originalColor?: string): string {
    if (originalColor && originalColor.startsWith("#")) return originalColor;
    
    switch (cableType) {
        case "FEEDER":
            return "#0284C7"; // Sky Blue
        case "BACKBONE":
            return "#7C3AED"; // Purple
        case "DROP_CABLE":
            return "#F59E0B"; // Amber
        case "DISTRIBUTION":
        default:
            return "#0D9488"; // Synerix Teal
    }
}

/**
 * Membaca teks XML dari file .kml atau berkas arsip .kmz secara client-side
 */
async function extractKmlTextFromFile(file: File): Promise<string> {
    const fileName = file.name.toLowerCase();

    // 1. Kasus file .kmz (ZIP archive yang berisi doc.kml)
    if (fileName.endsWith(".kmz") || file.type === "application/vnd.google-earth.kmz") {
        const zip = await JSZip.loadAsync(file);
        
        // Cari file dengan ekstensi .kml di dalam zip
        const matchedFiles = zip.file(/.*\.kml$/i);
        const kmlFileInZip = (matchedFiles.length > 0 ? matchedFiles[0] : null) || zip.file("doc.kml") || zip.file("Doc.kml");

        if (!kmlFileInZip) {
            throw new Error("File .kmz tidak memuat berkas .kml yang valid didalamnya.");
        }

        return await kmlFileInZip.async("string");
    }

    // 2. Kasus file .kml murni
    return await file.text();
}

/**
 * Pipeline parsing utama: Memproses file KML/KMZ dan menghasilkan payload siap ingest
 */
export async function parseKmlKmzFile(file: File): Promise<ParsedGisPayload> {
    const kmlRawText = await extractKmlTextFromFile(file);

    // Parse XML string ke DOM Document di browser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlRawText, "text/xml");

    // Periksa apakah ada error parsing XML
    const parseError = xmlDoc.getElementsByTagName("parsererror");
    if (parseError.length > 0) {
        throw new Error("Format XML KML tidak valid atau file rusak.");
    }

    // Ekstraksi nama Document dari tag <Document><name> jika ada
    const docNameTag = xmlDoc.getElementsByTagName("name")[0];
    const docDescTag = xmlDoc.getElementsByTagName("description")[0];
    const cleanFileName = file.name.replace(/\.(kml|kmz)$/i, "");
    const layerName = docNameTag?.textContent?.trim() || cleanFileName;
    const layerDescription = docDescTag?.textContent?.trim() || `Diimpor dari ${file.name}`;

    // Konversi XML ke GeoJSON FeatureCollection menggunakan @tmcw/togeojson
    const geoJson = kml(xmlDoc);

    const nodes: ParsedGisPayload["nodes"] = [];
    const lines: ParsedGisPayload["lines"] = [];

    if (!geoJson || !geoJson.features) {
        throw new Error("Tidak ada fitur spasial (titik/jalur) yang ditemukan di dalam file.");
    }

    // Sanitasi dan pemisahan otomatis: Point vs LineString
    for (const feature of geoJson.features) {
        if (!feature.geometry) continue;

        const geomType = feature.geometry.type;
        const properties = feature.properties || {};
        const featureName = (properties.name || "Titik Tanpa Nama").toString().trim();
        const featureDesc = (properties.description || "").toString().trim();

        // A. POINT (ODP, ODC, POP, Tiang, dsb.)
        if (geomType === "Point") {
            const coords = feature.geometry.coordinates;
            if (Array.isArray(coords) && coords.length >= 2) {
                const lng = Number(coords[0]);
                const lat = Number(coords[1]);

                // Validasi rentang koordinat bumi
                if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                    const nodeType = classifyNodeType(featureName, featureDesc);

                    nodes.push({
                        name: featureName,
                        type: nodeType,
                        description: featureDesc || undefined,
                        latitude: lat,
                        longitude: lng,
                        capacity: nodeType === "ODC" ? 144 : nodeType === "ODP" ? 8 : undefined,
                        raw_properties: properties,
                    });
                }
            }
        } 
        // B. LINESTRING (Jalur Kabel Fiber Optik)
        else if (geomType === "LineString") {
            const coords = feature.geometry.coordinates;
            if (Array.isArray(coords) && coords.length >= 2) {
                const latLngPoints: [number, number][] = [];
                let totalMeters = 0;

                for (let i = 0; i < coords.length; i++) {
                    const pt = coords[i];
                    const lng = Number(pt[0]);
                    const lat = Number(pt[1]);

                    if (!isNaN(lat) && !isNaN(lng)) {
                        latLngPoints.push([lat, lng]);

                        // Hitung panjang kabel akumulatif
                        if (latLngPoints.length > 1) {
                            const prev = latLngPoints[latLngPoints.length - 2];
                            totalMeters += calculateHaversineDistance(prev[0], prev[1], lat, lng);
                        }
                    }
                }

                if (latLngPoints.length >= 2) {
                    const cableType = classifyCableType(featureName, featureDesc);
                    const strokeColor = properties.stroke || properties["stroke-color"];
                    const color = getCableColor(cableType, strokeColor);

                    lines.push({
                        name: featureName || "Jalur Kabel Fiber",
                        cable_type: cableType,
                        core_capacity: cableType === "FEEDER" ? 48 : 24,
                        color,
                        coordinates: latLngPoints,
                        length_meters: Math.round(totalMeters * 10) / 10,
                        raw_properties: properties,
                    });
                }
            }
        }
        // C. MULTILINESTRING (Gabungan segmen kabel)
        else if (geomType === "MultiLineString") {
            const multiCoords = feature.geometry.coordinates;
            if (Array.isArray(multiCoords)) {
                multiCoords.forEach((lineCoords, idx) => {
                    if (Array.isArray(lineCoords) && lineCoords.length >= 2) {
                        const latLngPoints: [number, number][] = [];
                        let totalMeters = 0;

                        for (let i = 0; i < lineCoords.length; i++) {
                            const pt = lineCoords[i];
                            const lng = Number(pt[0]);
                            const lat = Number(pt[1]);

                            if (!isNaN(lat) && !isNaN(lng)) {
                                latLngPoints.push([lat, lng]);
                                if (latLngPoints.length > 1) {
                                    const prev = latLngPoints[latLngPoints.length - 2];
                                    totalMeters += calculateHaversineDistance(prev[0], prev[1], lat, lng);
                                }
                            }
                        }

                        if (latLngPoints.length >= 2) {
                            const cableType = classifyCableType(featureName, featureDesc);
                            const color = getCableColor(cableType);

                            lines.push({
                                name: `${featureName || "Jalur Kabel"} (Bagian ${idx + 1})`,
                                cable_type: cableType,
                                core_capacity: cableType === "FEEDER" ? 48 : 24,
                                color,
                                coordinates: latLngPoints,
                                length_meters: Math.round(totalMeters * 10) / 10,
                                raw_properties: properties,
                            });
                        }
                    }
                });
            }
        }
    }

    return {
        layerMeta: {
            name: layerName,
            filename: file.name,
            fileSizeBytes: file.size,
            color: lines.length > 0 ? lines[0].color : "#10B981",
            description: layerDescription,
        },
        nodes,
        lines,
    };
}
