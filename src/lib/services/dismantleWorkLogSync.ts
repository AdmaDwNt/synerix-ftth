import { SupabaseClient } from "@supabase/supabase-js";
import { DismantleTask } from "@/lib/types/dismantle";

/**
 * Service Sinkronisasi Otomatis Antara Tugas Dismantle dan Daftar Pekerjaan (Work Logs)
 * Aturan Bisnis:
 * - Jika status tugas masih "QUEUE" (belum ada progres): TIDAK dimasukkan ke daftar pekerjaan.
 * - Jika status tugas adalah "IN_PROGRESS" atau "COMPLETED" (sudah ada progres):
 *   OTOMATIS masuk ke tabel `work_logs` (kategori: DISMANTLE).
 * - Mencegah duplikasi data pekerjaan dengan mencari existing log berdasarkan dismantle_id atau customer_id.
 */
export async function syncDismantleToWorkLogs(
    task: DismantleTask,
    supabase: SupabaseClient
): Promise<{ synced: boolean; action?: "created" | "updated" | "skipped"; error?: string }> {
    try {
        // 1. Jika belum ada progres (status masih QUEUE), jangan masukkan ke pekerjaan
        if (task.status === "QUEUE") {
            return { synced: false, action: "skipped" };
        }

        // 2. Siapkan data judul & deskripsi terstruktur
        const logTitle = `[DISMANTLE] ${task.customer_name} (${task.customer_id})`;
        const searchPattern = `%${task.customer_id}%`;

        // Format deskripsi lengkap dari atribut dismantle & instalasi
        const details: string[] = [
            `Penarikan ONT/STB dari pelanggan churn.`,
            `Alamat: ${task.address}`,
            `Cluster: ${task.cluster_name}`,
            task.parent_odp_name ? `Parent ODP: ${task.parent_odp_name}` : "",
            task.phone_number ? `WhatsApp/HP: ${task.phone_number}` : "",
            `Tipe Perangkat: ${task.device_type}`,
            task.serial_number ? `Serial Number: ${task.serial_number}` : "",
            task.mac_address ? `MAC: ${task.mac_address}` : "",
            task.ticket_id ? `Nomor Tiket: ${task.ticket_id}` : "",
            task.unpaid_amount && task.unpaid_amount > 0
                ? `Total Tunggakan: Rp ${task.unpaid_amount.toLocaleString("id-ID")}`
                : "",
        ].filter(Boolean);

        const caseDescription = details.join("\n");

        // Format resolusi berdasarkan status
        let resolution = "";
        let workLogStatus: "IN_PROGRESS" | "DONE" = "IN_PROGRESS";

        if (task.status === "COMPLETED") {
            workLogStatus = "DONE";
            resolution = `Perangkat ${task.device_type}${task.serial_number ? ` (SN: ${task.serial_number})` : ""} berhasil dicabut dan diamankan${task.technician_name ? ` oleh teknisi ${task.technician_name}` : ""}.${task.completed_at ? ` Waktu: ${new Date(task.completed_at).toLocaleString("id-ID")}` : ""}`;
        } else {
            workLogStatus = "IN_PROGRESS";
            resolution = `Teknisi${task.technician_name ? ` ${task.technician_name}` : ""} sedang dalam perjalanan atau proses penarikan di lokasi.`;
        }

        // 3. Cek apakah log untuk pelanggan ini sudah pernah dicatat di work_logs
        const { data: existingLogs, error: searchErr } = await supabase
            .from("work_logs")
            .select("id, title, status")
            .ilike("title", searchPattern)
            .eq("category", "DISMANTLE")
            .limit(1);

        if (searchErr) {
            console.warn("Gagal mengecek existing work_log:", searchErr);
        }

        if (existingLogs && existingLogs.length > 0 && existingLogs[0]) {
            // Log sudah ada -> Update status & resolusi
            const existingId = existingLogs[0].id;
            const { error: updateErr } = await supabase
                .from("work_logs")
                .update({
                    status: workLogStatus,
                    resolution,
                    case_description: caseDescription,
                    latitude: task.latitude,
                    longitude: task.longitude,
                })
                .eq("id", existingId);

            if (updateErr) {
                console.error("Gagal mengupdate work_logs:", updateErr);
                return { synced: false, error: updateErr.message };
            }

            return { synced: true, action: "updated" };
        } else {
            // Log belum ada -> Insert pekerjaan baru
            const newLogPayload = {
                id: crypto.randomUUID(),
                title: logTitle,
                category: "DISMANTLE",
                case_description: caseDescription,
                resolution,
                optical_power_in: null,
                optical_power_out: null,
                status: workLogStatus,
                latitude: task.latitude,
                longitude: task.longitude,
                created_at: new Date().toISOString(),
            };

            const { error: insertErr } = await supabase
                .from("work_logs")
                .insert([newLogPayload]);

            if (insertErr) {
                console.error("Gagal insert ke work_logs:", insertErr);
                return { synced: false, error: insertErr.message };
            }

            return { synced: true, action: "created" };
        }
    } catch (err: unknown) {
        console.error("Error pada syncDismantleToWorkLogs:", err);
        return {
            synced: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
