// ====================================================================
// GIS BULK INGEST SERVICE (Chunked Ingestion & Supabase Persistence)
// ====================================================================

import { SupabaseClient } from "@supabase/supabase-js";
import { ParsedGisPayload, KmlLayer } from "@/lib/types/gis";

export interface IngestProgress {
    percent: number;
    message: string;
    stage: "LAYER" | "NODES" | "LINES" | "DONE" | "ERROR";
}

export interface IngestResult {
    success: boolean;
    layer: KmlLayer;
    totalNodesInserted: number;
    totalLinesInserted: number;
}

/**
 * Memecah array menjadi potongan batch (chunks)
 */
function chunkArray<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}

/**
 * Menyimpan data hasil parse KML/KMZ ke Supabase dengan chunking agar tidak timeout
 */
export async function bulkIngestGisData(
    supabase: SupabaseClient,
    payload: ParsedGisPayload,
    onProgress?: (progress: IngestProgress) => void
): Promise<IngestResult> {
    const updateProgress = (percent: number, message: string, stage: IngestProgress["stage"]) => {
        if (onProgress) {
            onProgress({ percent, message, stage });
        }
    };

    try {
        // 1. Simpan Metadata Layer di tabel kml_layers
        updateProgress(5, "Membuat layer infrastruktur baru...", "LAYER");

        const { data: layerData, error: layerError } = await supabase
            .from("kml_layers")
            .insert({
                name: payload.layerMeta.name,
                filename: payload.layerMeta.filename,
                file_size_bytes: payload.layerMeta.fileSizeBytes,
                total_nodes: payload.nodes.length,
                total_lines: payload.lines.length,
                color: payload.layerMeta.color,
                is_visible: true,
                description: payload.layerMeta.description || null,
            })
            .select()
            .single();

        if (layerError || !layerData) {
            throw new Error(`Gagal menyimpan layer: ${layerError?.message || "Unknown error"}`);
        }

        const layerId = layerData.id;
        let nodesInserted = 0;
        let linesInserted = 0;

        // 2. Batch Insert Network Nodes (Chunking 100 item per request)
        if (payload.nodes.length > 0) {
            const nodeChunks = chunkArray(payload.nodes, 100);
            const totalNodeChunks = nodeChunks.length;

            for (let i = 0; i < totalNodeChunks; i++) {
                const chunk = nodeChunks[i];
                const nodeRows = chunk.map((n) => ({
                    layer_id: layerId,
                    name: n.name,
                    type: n.type,
                    description: n.description || null,
                    latitude: n.latitude,
                    longitude: n.longitude,
                    capacity: n.capacity || (n.type === "ODC" ? 144 : n.type === "ODP" ? 8 : 0),
                    used_ports: 0,
                    raw_properties: n.raw_properties || {},
                }));

                const { error: nodeError } = await supabase.from("network_nodes").insert(nodeRows);

                if (nodeError) {
                    console.error("Error inserting node chunk:", nodeError);
                    throw new Error(`Gagal menyimpan data titik node: ${nodeError.message}`);
                }

                nodesInserted += nodeRows.length;
                const percent = 10 + Math.round(((i + 1) / totalNodeChunks) * 45); // 10% - 55%
                updateProgress(
                    percent,
                    `Menyimpan titik perangkat (${nodesInserted}/${payload.nodes.length})...`,
                    "NODES"
                );
            }
        }

        // 3. Batch Insert Network Lines (Chunking 50 item per request)
        if (payload.lines.length > 0) {
            const lineChunks = chunkArray(payload.lines, 50);
            const totalLineChunks = lineChunks.length;

            for (let j = 0; j < totalLineChunks; j++) {
                const chunk = lineChunks[j];
                const lineRows = chunk.map((l) => ({
                    layer_id: layerId,
                    name: l.name,
                    cable_type: l.cable_type,
                    core_capacity: l.core_capacity,
                    color: l.color,
                    coordinates: l.coordinates,
                    length_meters: l.length_meters,
                    raw_properties: l.raw_properties || {},
                }));

                const { error: lineError } = await supabase.from("network_lines").insert(lineRows);

                if (lineError) {
                    console.error("Error inserting line chunk:", lineError);
                    throw new Error(`Gagal menyimpan data jalur kabel: ${lineError.message}`);
                }

                linesInserted += lineRows.length;
                const percent = 55 + Math.round(((j + 1) / totalLineChunks) * 40); // 55% - 95%
                updateProgress(
                    percent,
                    `Menyimpan jalur kabel fiber (${linesInserted}/${payload.lines.length})...`,
                    "LINES"
                );
            }
        }

        updateProgress(100, "Import GIS Infrastruktur Berhasil!", "DONE");

        return {
            success: true,
            layer: layerData as KmlLayer,
            totalNodesInserted: nodesInserted,
            totalLinesInserted: linesInserted,
        };
    } catch (err: any) {
        updateProgress(0, err?.message || "Terjadi kesalahan saat menyimpan data", "ERROR");
        throw err;
    }
}

/**
 * Menghapus layer beserta seluruh nodes dan kabelnya (cascade via foreign key)
 */
export async function deleteGisLayer(supabase: SupabaseClient, layerId: string): Promise<boolean> {
    const { error } = await supabase.from("kml_layers").delete().eq("id", layerId);
    if (error) {
        throw new Error(`Gagal menghapus layer: ${error.message}`);
    }
    return true;
}

/**
 * Mengubah visibilitas layer (ON / OFF)
 */
export async function toggleGisLayerVisibility(
    supabase: SupabaseClient,
    layerId: string,
    isVisible: boolean
): Promise<boolean> {
    const { error } = await supabase
        .from("kml_layers")
        .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
        .eq("id", layerId);

    if (error) {
        throw new Error(`Gagal memperbarui status visibilitas: ${error.message}`);
    }
    return true;
}
