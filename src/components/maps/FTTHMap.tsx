"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import {
    MapContainer,
    TileLayer,
    Polyline,
    Marker,
    Popup,
    Circle,
    useMap,
    useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import L from "leaflet";
import "leaflet.markercluster";
import { Trash2, MapPin, ExternalLink, Activity, Network, Layers, ShieldCheck } from "lucide-react";
import { getGoogleMapsUrl, formatDistance } from "@/lib/ftth/distance";
import { NetworkNode, NetworkLine, NodeType, GisCategoryFilter, BasemapType } from "@/lib/types/gis";
import { BASEMAP_CONFIGS } from "@/components/gis/BasemapSwitcher";

// ====================================================================
// 1. MICRO-DOT VECTOR SVG GENERATOR (12 - 16px HIGH-PERFORMANCE)
// ====================================================================

const NODE_COLORS: Record<NodeType, { bg: string; border: string; glow: string }> = {
    ODP: { bg: "#10B981", border: "#FFFFFF", glow: "rgba(16, 185, 129, 0.45)" },      // Emerald
    ODC: { bg: "#F59E0B", border: "#FFFFFF", glow: "rgba(245, 158, 11, 0.45)" },      // Amber
    POP: { bg: "#0F766E", border: "#FFFFFF", glow: "rgba(15, 118, 110, 0.45)" },      // Deep Teal
    SERVER: { bg: "#06B6D4", border: "#FFFFFF", glow: "rgba(6, 182, 212, 0.45)" },    // Cyan
    TIANG: { bg: "#64748B", border: "#F1F5F9", glow: "rgba(100, 116, 139, 0.35)" },   // Slate
    DISMANTLE: { bg: "#EF4444", border: "#FFFFFF", glow: "rgba(239, 68, 68, 0.45)" }, // Red
    CUSTOMER: { bg: "#3B82F6", border: "#FFFFFF", glow: "rgba(59, 130, 246, 0.45)" }, // Blue
    CLOSURE: { bg: "#6366F1", border: "#FFFFFF", glow: "rgba(99, 102, 241, 0.45)" },  // Indigo
    OTHER: { bg: "#94A3B8", border: "#FFFFFF", glow: "rgba(148, 163, 184, 0.3)" },     // Gray
};

export const createMicroDotIcon = (type: NodeType) => {
    const color = NODE_COLORS[type] || NODE_COLORS.ODP;
    const isSpecial = type === "ODC" || type === "SERVER";
    const size = isSpecial ? 16 : 14;
    const anchor = size / 2;

    const svg = `
    <div class="micro-dot-pin" style="width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
      <svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="7" fill="${color.bg}" stroke="${color.border}" stroke-width="1.8" filter="drop-shadow(0 2px 4px ${color.glow})"/>
        <circle cx="8" cy="8" r="2.5" fill="#FFFFFF"/>
      </svg>
    </div>`;

    return L.divIcon({
        className: "ftth-micro-dot-icon",
        html: svg,
        iconSize: [size, size],
        iconAnchor: [anchor, anchor],
        popupAnchor: [0, -anchor - 4],
    });
};

// Temp Pin Pulsing Icon saat Teknisi klik peta
const createTempPinIcon = () => {
    const svgMarker = `
    <div class="relative flex items-center justify-center">
      <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-teal-400 opacity-75"></span>
      <div class="h-5 w-5 rounded-full bg-teal-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
        <div class="h-2 w-2 rounded-full bg-white"></div>
      </div>
    </div>`;
    return L.divIcon({
        className: "temp-leaflet-pin",
        html: svgMarker,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16],
    });
};

// ====================================================================
// 2. DYNAMIC CLUSTERING & SPIDERFY LAYER (MarkerClusterGroup)
// ====================================================================

interface MarkerClusterLayerProps {
    nodes: NetworkNode[];
    currentZoom: number;
    onSelectNode?: (node: NetworkNode) => void;
    onDeleteNode?: (id: string) => void;
}

function MarkerClusterLayer({
    nodes,
    currentZoom,
    onSelectNode,
    onDeleteNode,
}: MarkerClusterLayerProps) {
    const map = useMap();
    const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

    useEffect(() => {
        if (!map) return;

        // Inisialisasi Leaflet MarkerClusterGroup dengan aturan zoom
        const clusterGroup = L.markerClusterGroup({
            maxClusterRadius: (zoom) => (zoom <= 13 ? 80 : 45),
            disableClusteringAtZoom: 17,
            spiderfyOnMaxZoom: true,
            spiderfyDistanceMultiplier: 1.6,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            iconCreateFunction: (cluster) => {
                const count = cluster.getChildCount();
                let sizeClass = "synerix-cluster-small";
                let size = 32;

                if (count > 50) {
                    sizeClass = "synerix-cluster-large";
                    size = 48;
                } else if (count > 10) {
                    sizeClass = "synerix-cluster-medium";
                    size = 40;
                }

                return L.divIcon({
                    html: `<div class="synerix-cluster ${sizeClass}"><span>${count}</span></div>`,
                    className: "synerix-cluster-wrap",
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size / 2],
                });
            },
        });

        // Tambahkan setiap node ke dalam clusterGroup
        nodes.forEach((node) => {
            const marker = L.marker([node.latitude, node.longitude], {
                icon: createMicroDotIcon(node.type),
            });

            // Smart Label: Muncul saat Zoom >= 17
            if (currentZoom >= 17) {
                marker.bindTooltip(node.name, {
                    permanent: true,
                    direction: "bottom",
                    className: "ftth-smart-label",
                    offset: [0, 8],
                });
            }

            marker.on("click", () => {
                if (onSelectNode) onSelectNode(node);
            });

            clusterGroup.addLayer(marker);
        });

        map.addLayer(clusterGroup);
        clusterGroupRef.current = clusterGroup;

        return () => {
            if (clusterGroupRef.current) {
                map.removeLayer(clusterGroupRef.current);
            }
        };
    }, [nodes, currentZoom, map, onSelectNode, onDeleteNode]);

    return null;
}

// ====================================================================
// 3. MAP EVENT CONTROLLER & ZOOM DETECTOR
// ====================================================================

function MapEventsHandler({
    onMapClick,
    onZoomChange,
    isDrawingLine,
    isMeasuring,
}: {
    onMapClick?: (lat: number, lng: number) => void;
    onZoomChange: (zoom: number) => void;
    isDrawingLine?: boolean;
    isMeasuring?: boolean;
}) {
    const map = useMapEvents({
        click(e) {
            if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
        },
        zoomend(e) {
            onZoomChange(e.target.getZoom());
        },
    });

    useEffect(() => {
        const container = map.getContainer();
        if (isDrawingLine || isMeasuring) {
            container.style.cursor = "crosshair";
        } else {
            container.style.cursor = "";
        }
    }, [isDrawingLine, isMeasuring, map]);

    return null;
}

// ====================================================================
// 4. FLY-TO CONTROLLER (Animasi Geser Halus ke Titik Target)
// ====================================================================

function FlyToController({
    target,
}: {
    target: { lat: number; lng: number; zoom?: number } | null;
}) {
    const map = useMap();
    useEffect(() => {
        if (!target || !map) return;
        map.flyTo([target.lat, target.lng], target.zoom || 18, {
            duration: 1.2,
            easeLinearity: 0.25,
        });
    }, [target, map]);
    return null;
}

// Auto-resizer for Leaflet on container dimension changes (Fullscreen / Mobile orientation)
function MapResizer() {
    const map = useMap();
    useEffect(() => {
        const handleResize = () => {
            map.invalidateSize();
        };
        window.addEventListener("resize", handleResize);

        const container = map.getContainer();
        let ro: ResizeObserver | null = null;
        if (typeof ResizeObserver !== "undefined" && container) {
            ro = new ResizeObserver(() => {
                map.invalidateSize();
            });
            ro.observe(container);
        }

        map.invalidateSize();
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 150);

        return () => {
            window.removeEventListener("resize", handleResize);
            ro?.disconnect();
            clearTimeout(timer);
        };
    }, [map]);

    return null;
}

// ====================================================================
// 5. KOMPONEN UTAMA FTTHMAP
// ====================================================================

export interface FTTHMapProps {
    nodes: NetworkNode[];
    lines?: NetworkLine[];
    selectedLocation?: { lat: number; lng: number } | null;
    onMapClick?: (lat: number, lng: number) => void;
    onSelectNode?: (node: NetworkNode) => void;
    onSelectLine?: (line: NetworkLine) => void;
    onDeleteNode?: (id: string) => void;
    center?: [number, number];
    zoom?: number;
    activeCategory?: GisCategoryFilter;
    basemap?: BasemapType;
    showCoverageRadius?: boolean;
    isDrawingLine?: boolean;
    drawingPoints?: [number, number][];
    isMeasuring?: boolean;
    measuringPoints?: [number, number][];
    flyToTarget?: { lat: number; lng: number; zoom?: number } | null;
}

export default function FTTHMap({
    nodes = [],
    lines = [],
    selectedLocation,
    onMapClick,
    onSelectNode,
    onSelectLine,
    onDeleteNode,
    center,
    zoom = 14,
    activeCategory = "ALL",
    basemap = "OSM",
    showCoverageRadius = false,
    isDrawingLine = false,
    drawingPoints = [],
    isMeasuring = false,
    measuringPoints = [],
    flyToTarget = null,
}: FTTHMapProps) {
    const [currentZoom, setCurrentZoom] = useState(zoom);

    // Filter nodes berdasarkan activeCategory jika diset
    const filteredNodes = useMemo(() => {
        if (!activeCategory || activeCategory === "ALL") return nodes;
        if (activeCategory === "SERVER_POP") {
            return nodes.filter((n) => n.type === "SERVER" || n.type === "POP");
        }
        return nodes.filter((n) => n.type === activeCategory);
    }, [nodes, activeCategory]);

    const activeBasemapConfig = BASEMAP_CONFIGS[basemap] || BASEMAP_CONFIGS.OSM;

    // Koordinat Default Kediri / Jawa Timur (-7.8231, 111.9174)
    const mapCenter: [number, number] = center
        ? center
        : nodes.length > 0 && nodes[0].latitude
        ? [nodes[0].latitude, nodes[0].longitude]
        : [-7.8231, 111.9174];

    return (
        <MapContainer
            center={mapCenter}
            zoom={zoom}
            scrollWheelZoom={true}
            preferCanvas={true} // High-FPS Canvas Renderer untuk jalur kabel
            className="w-full h-full rounded-2xl z-10"
        >
            <TileLayer
                key={basemap}
                attribution={activeBasemapConfig.attribution}
                url={activeBasemapConfig.url}
                maxZoom={activeBasemapConfig.maxZoom}
            />

            {/* Listener zoom, klik & cursor crosshair */}
            <MapEventsHandler
                onMapClick={onMapClick}
                onZoomChange={setCurrentZoom}
                isDrawingLine={isDrawingLine}
                isMeasuring={isMeasuring}
            />

            {/* Invalidate size on resize/fullscreen change */}
            <MapResizer />

            {/* Fly-to animation controller */}
            <FlyToController target={flyToTarget} />

            {/* ODP Coverage Radius Circles (150m Dropcore limit) */}
            {showCoverageRadius &&
                filteredNodes
                    .filter((n) => n.type === "ODP")
                    .map((odp) => (
                        <Circle
                            key={`cov-${odp.id}`}
                            center={[odp.latitude, odp.longitude]}
                            radius={150}
                            pathOptions={{
                                color: "#10B981",
                                fillColor: "#10B981",
                                fillOpacity: 0.08,
                                weight: 1.2,
                                dashArray: "4, 4",
                            }}
                        />
                    ))}

            {/* A. Jalur Kabel Fiber Optik (Rendered via HTML5 Canvas for 60 FPS) */}
            {lines.map((line) => (
                <Polyline
                    key={line.id}
                    positions={line.coordinates}
                    pathOptions={{
                        color: line.color || "#0D9488",
                        weight: line.cable_type === "FEEDER" ? 4 : 3,
                        opacity: 0.85,
                        dashArray: line.cable_type === "DROP_CABLE" ? "4, 6" : undefined,
                        lineCap: "round",
                        lineJoin: "round",
                    }}
                    eventHandlers={{
                        click: () => {
                            if (onSelectLine) onSelectLine(line);
                        },
                    }}
                />
            ))}

            {/* B. Live Drawing Polyline Preview (Saat mode gambar kabel aktif) */}
            {drawingPoints.length > 0 && (
                <Polyline
                    positions={drawingPoints}
                    pathOptions={{
                        color: "#0D9488",
                        weight: 4,
                        dashArray: "6, 6",
                        lineCap: "round",
                        lineJoin: "round",
                    }}
                />
            )}

            {/* C. Live Measuring Ruler Polyline Preview (Saat mode ukur jarak aktif) */}
            {measuringPoints.length > 0 && (
                <Polyline
                    positions={measuringPoints}
                    pathOptions={{
                        color: "#E11D48",
                        weight: 3.5,
                        dashArray: "4, 4",
                        lineCap: "round",
                        lineJoin: "round",
                    }}
                />
            )}

            {/* D. Dynamic Marker Clustering dengan Micro-Dot SVG & Smart Label */}
            <MarkerClusterLayer
                nodes={filteredNodes}
                currentZoom={currentZoom}
                onSelectNode={onSelectNode}
                onDeleteNode={onDeleteNode}
            />

            {/* E. Temporary Pin Marker saat Teknisi Klik Peta untuk Tagging Manual */}
            {selectedLocation && !isDrawingLine && !isMeasuring && (
                <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={createTempPinIcon()}>
                    <Popup>
                        <div className="p-1 text-center">
                            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                                Titik Baru
                            </span>
                            <p className="text-xs font-bold text-slate-800 mt-1">Koordinat Terpilih</p>
                            <p className="text-[10px] font-mono text-slate-500">
                                {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            )}
        </MapContainer>
    );
}