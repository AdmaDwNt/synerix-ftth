import { createClient } from "@supabase/supabase-js";
import { logStealthAudit } from "./auditLogService";

export interface StagingItem {
    id?: string;
    ticket_id?: string;
    customer_id: string;
    customer_name: string;
    phone_number?: string;
    address?: string;
    cluster_name?: string;
    device_type?: string;
    notes?: string;
    staging_status: "NEW" | "DUPLICATE";
    target_destination?: "DISMANTLE" | "WORK_LOG";
    is_dispatched?: boolean;
    dispatched_at?: string;
    raw_payload?: Record<string, any>;
    created_at?: string;
}

function getSupabaseServerClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Standard Rule-Based Parser (Regex & String Parser tanpa AI)
 * Mengekstrak data pelanggan & tiket dari teks Billingnesia, format tabel, atau teks bebas
 */
export function parseRawBillingnesiaText(text: string): Omit<StagingItem, "id" | "staging_status">[] {
    const trimmed = (text || "").trim();
    if (!trimmed) return [];

    const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const results: Omit<StagingItem, "id" | "staging_status">[] = [];

    const ticketRegex = /(?:TKT|TIKET|TICKET)[-_:\s]*([A-Z0-9]{5,20})/i;
    const phoneRegex = /(?:08\d{8,12}|628\d{8,12}|\+628\d{8,12})/;
    const custIdRegex = /(?:ID|CID|CUST)[-_:\s]*([0-9]{6,16})/i;
    const odpRegex = /ODP[-_/\s]*[A-Z0-9-]+/i;

    // Pola 1: Baris-baris terpisah Tab / Pipe (Tabel Billingnesia copas)
    for (const line of lines) {
        if (/^(#|no|nomor|id tiket|pelanggan|nama)/i.test(line)) continue; // Header tabel

        if (line.includes("\t") || line.includes("|")) {
            const parts = line.split(/[\t|]/).map((p) => p.trim()).filter(Boolean);
            if (parts.length >= 2) {
                const tktMatch = line.match(ticketRegex);
                const phoneMatch = line.match(phoneRegex);
                const custIdMatch = line.match(custIdRegex);
                const odpMatch = line.match(odpRegex);

                const ticketId = tktMatch ? tktMatch[0].toUpperCase() : undefined;
                const custId = custIdMatch ? custIdMatch[1] : (phoneMatch ? phoneMatch[0].slice(-8) : parts[0]);
                const custName = parts.find((p) => p !== ticketId && p !== custId && isNaN(Number(p))) || parts[1] || "Pelanggan";
                const notes = parts.length > 2 ? parts[parts.length - 1] : "Penarikan Perangkat";

                results.push({
                    ticket_id: ticketId,
                    customer_id: custId,
                    customer_name: custName.replace(/^\d+[\s.-]*/, ""),
                    phone_number: phoneMatch ? phoneMatch[0] : undefined,
                    address: parts.length > 3 ? parts[2] : "Area Operasional",
                    cluster_name: odpMatch ? odpMatch[0].toUpperCase() : "AREA-OPERASIONAL",
                    device_type: "ONT + Adaptor",
                    notes,
                    raw_payload: { raw_line: line },
                });
                continue;
            }
        }
    }

    // Pola 2: Format blok terstruktur (1. ..., 2. ...) atau Chat WA
    if (results.length === 0) {
        const blocks = trimmed.split(/(?=(?:^\s*\d+[\.\)]|^\s*[-*•]\s*TKT|^\s*Tiket\s*:))/gim);
        for (const block of blocks) {
            const blockTrim = block.trim();
            if (blockTrim.length < 5) continue;

            const tktMatch = blockTrim.match(ticketRegex);
            const phoneMatch = blockTrim.match(phoneRegex);
            const custIdMatch = blockTrim.match(custIdRegex);
            const odpMatch = blockTrim.match(odpRegex);

            // Ekstrak nama
            let name = "";
            const nameMatch = blockTrim.match(/(?:Nama|Pelanggan|Cust)\s*[:=-]\s*([^\n\r,;|]+)/i);
            if (nameMatch) {
                name = nameMatch[1].trim();
            } else {
                const firstLine = blockTrim.split("\n")[0].replace(/^\d+[\.\)]\s*/, "").replace(/[-*•]/g, "").trim();
                name = firstLine.split(/[-|–,]/)[0]?.trim() || "Pelanggan";
            }

            // Ekstrak alamat
            let address = "";
            const addrMatch = blockTrim.match(/(?:Alamat|Lokasi|Almt)\s*[:=-]\s*([^\n\r;|]+)/i);
            if (addrMatch) {
                address = addrMatch[1].trim();
            } else {
                const addrLine = blockTrim.split("\n").find((l) => /(?:jl|jalan|rt|rw|desa|ds\.|dusun|blok|perum)/i.test(l));
                if (addrLine) address = addrLine.trim().replace(/^(?:alamat|lokasi)\s*[:=-]\s*/i, "");
            }

            // Ekstrak kendala/catatan
            let notes = "Penarikan Perangkat / Selesai Langganan";
            const notesMatch = blockTrim.match(/(?:Ket|Keterangan|Alasan|Kendala)\s*[:=-]\s*([^\n\r]+)/i);
            if (notesMatch) notes = notesMatch[1].trim();

            const cleanPhone = phoneMatch ? phoneMatch[0].replace(/[^0-9]/g, "") : undefined;
            const cleanTicket = tktMatch ? tktMatch[0].toUpperCase() : undefined;
            const cleanCustId = custIdMatch ? custIdMatch[1] : (cleanPhone ? cleanPhone.slice(-8) : `CID-${Date.now().toString().slice(-6)}`);

            results.push({
                ticket_id: cleanTicket,
                customer_id: cleanCustId,
                customer_name: name || `Pelanggan ${cleanCustId}`,
                phone_number: cleanPhone,
                address: address || "Alamat belum ditentukan",
                cluster_name: odpMatch ? odpMatch[0].toUpperCase() : "AREA-OPERASIONAL",
                device_type: /stb/i.test(blockTrim) ? "STB" : "ONT + Adaptor",
                notes,
                raw_payload: { raw_block: blockTrim },
            });
        }
    }

    return results;
}

/**
 * Pengecekan Duplikasi terhadap Database (dismantle_tasks & work_logs)
 */
export async function checkDuplicationAndStage(
    items: Omit<StagingItem, "id" | "staging_status">[]
): Promise<StagingItem[]> {
    if (items.length === 0) return [];

    const supabase = getSupabaseServerClient();
    const customerIds = items.map((i) => i.customer_id).filter(Boolean);
    const ticketIds = items.map((i) => i.ticket_id).filter(Boolean) as string[];

    // 1. Cek di dismantle_tasks
    let existingDismantleCustIds = new Set<string>();
    let existingDismantleTicketIds = new Set<string>();

    try {
        if (customerIds.length > 0) {
            const { data } = await supabase
                .from("dismantle_tasks")
                .select("customer_id, ticket_id")
                .in("customer_id", customerIds);
            if (data) {
                data.forEach((r) => {
                    if (r.customer_id) existingDismantleCustIds.add(String(r.customer_id).trim());
                    if (r.ticket_id) existingDismantleTicketIds.add(String(r.ticket_id).trim().toUpperCase());
                });
            }
        }

        if (ticketIds.length > 0) {
            const { data } = await supabase
                .from("dismantle_tasks")
                .select("customer_id, ticket_id")
                .in("ticket_id", ticketIds);
            if (data) {
                data.forEach((r) => {
                    if (r.customer_id) existingDismantleCustIds.add(String(r.customer_id).trim());
                    if (r.ticket_id) existingDismantleTicketIds.add(String(r.ticket_id).trim().toUpperCase());
                });
            }
        }
    } catch (e) {
        console.warn("Gagal cek duplikasi dismantle:", e);
    }

    // 2. Beri label NEW vs DUPLICATE
    const stagedResults: StagingItem[] = items.map((item) => {
        const isDupeCust = existingDismantleCustIds.has(String(item.customer_id).trim());
        const isDupeTkt = item.ticket_id ? existingDismantleTicketIds.has(String(item.ticket_id).trim().toUpperCase()) : false;
        const isDuplicate = isDupeCust || isDupeTkt;

        return {
            ...item,
            staging_status: isDuplicate ? "DUPLICATE" : "NEW",
            is_dispatched: false,
        };
    });

    // 3. Simpan ke tabel scraper_staging
    try {
        const { data, error } = await supabase.from("scraper_staging").insert(stagedResults).select();
        if (data && !error) {
            return data as StagingItem[];
        }
    } catch (err) {
        console.warn("Gagal simpan ke scraper_staging DB:", err);
    }

    return stagedResults;
}

/**
 * Mengirimkan data terpilih dari Staging ke Tujuan (DISMANTLE atau WORK_LOG)
 */
export async function dispatchStagingItems(
    stagingIds: string[],
    destination: "DISMANTLE" | "WORK_LOG",
    username: string = "SUPERADMIN"
): Promise<{ success: boolean; dispatchedCount: number; error?: string }> {
    if (stagingIds.length === 0) return { success: true, dispatchedCount: 0 };

    const supabase = getSupabaseServerClient();
    try {
        // Ambil data staging
        const { data: stagedItems, error: fetchErr } = await supabase
            .from("scraper_staging")
            .select("*")
            .in("id", stagingIds);

        if (fetchErr || !stagedItems || stagedItems.length === 0) {
            return { success: false, dispatchedCount: 0, error: "Data staging tidak ditemukan." };
        }

        let dispatchedCount = 0;

        if (destination === "DISMANTLE") {
            for (const item of stagedItems) {
                await supabase.from("dismantle_tasks").upsert(
                    {
                        ticket_id: item.ticket_id || `TKT${Date.now().toString().slice(-8)}`,
                        customer_id: item.customer_id,
                        customer_name: item.customer_name,
                        phone_number: item.phone_number,
                        address: item.address || "Area Pelanggan",
                        cluster_name: item.cluster_name || "AREA-OPERASIONAL",
                        device_type: item.device_type || "ONT + Adaptor",
                        status: "QUEUE",
                        failure_reason: item.notes,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "customer_id" }
                );
                dispatchedCount++;
            }
        } else if (destination === "WORK_LOG") {
            for (const item of stagedItems) {
                await supabase.from("work_logs").insert([
                    {
                        ticket_id: item.ticket_id || `WL-${Date.now().toString().slice(-6)}`,
                        customer_name: item.customer_name,
                        work_type: "DISMANTLE / PERBAIKAN",
                        description: item.notes || `Penarikan perangkat pelanggan ID ${item.customer_id}`,
                        status: "SELESAI",
                        created_by_username: username,
                        created_at: new Date().toISOString(),
                    },
                ]);
                dispatchedCount++;
            }
        }

        // Tandai sebagai dispatched di tabel scraper_staging
        await supabase
            .from("scraper_staging")
            .update({
                is_dispatched: true,
                dispatched_at: new Date().toISOString(),
                target_destination: destination,
            })
            .in("id", stagingIds);

        // Catat Audit Trail
        await logStealthAudit({
            username,
            action_type: "DISPATCH_STAGING",
            target_id: destination,
            category: "DATA_ACTIVITY",
            risk_level: "INFO",
            details: {
                destination,
                stagingIds,
                count: dispatchedCount,
            },
        });

        return { success: true, dispatchedCount };
    } catch (err: any) {
        console.error("Gagal mendistribusikan data staging:", err);
        return { success: false, dispatchedCount: 0, error: err?.message || "Gagal proses staging." };
    }
}

/**
 * Mengambil daftar data antrean staging yang belum di-dispatch
 */
export async function getStagingItems(statusFilter: "ALL" | "BARU" | "DUPLIKAT" = "ALL") {
    try {
        const supabase = getSupabaseServerClient();
        let query = supabase
            .from("scraper_staging")
            .select("*")
            .eq("is_dispatched", false)
            .order("staged_at", { ascending: false });

        if (statusFilter !== "ALL") {
            query = query.eq("staging_status", statusFilter);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map((row: any) => ({
            id: row.id,
            ticket_no: row.ticket_id,
            customer_id: row.customer_id,
            customer_name: row.customer_name,
            address: row.address,
            phone: row.phone_number,
            status: row.staging_status || "BARU",
            staged_at: row.staged_at || row.created_at,
            duplication_status: row.staging_status || "BARU",
            duplication_reason: row.duplication_reason,
        }));
    } catch (err) {
        console.warn("Gagal memuat staging items dari db:", err);
        return [];
    }
}

/**
 * Menghapus data dari antrean staging
 */
export async function deleteStagingItem(id: string) {
    try {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase.from("scraper_staging").delete().eq("id", id);
        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err?.message || "Gagal menghapus item staging." };
    }
}
