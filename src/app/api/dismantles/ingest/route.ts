import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Helper headers untuk Cross-Origin Resource Sharing (CORS)
// Diperlukan agar Bookmarklet browser HP di domain Billingnesia dapat melakukan POST ke API Synerix
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-synerix-ingest-secret",
};

// Handler untuk Preflight Request CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
    });
}

// Helper untuk generate kode cluster otomatis berbasis tanggal hari ini (e.g. O-04 untuk 4 Oktober)
function generateAutoClusterTag(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = now.getMonth() + 1; // 1 - 12

    // Inisial bulan: J, F, M, A, MEI, JUN, JUL, AG, S, O, N, D
    const monthPrefixes: Record<number, string> = {
        1: "J",
        2: "F",
        3: "M",
        4: "A",
        5: "MEI",
        6: "JUN",
        7: "JUL",
        8: "AG",
        9: "S",
        10: "O",
        11: "N",
        12: "D",
    };

    const prefix = monthPrefixes[month] || "CL";
    return `${prefix}-${day}`;
}

export async function POST(req: NextRequest) {
    try {
        // 1. Validasi Secret Token (Opsional, untuk keamanan ingest)
        const expectedSecret = process.env.DISMANTLE_INGEST_SECRET || "synerix-ftth-secret-2026";
        const providedSecret = req.headers.get("x-synerix-ingest-secret");

        if (providedSecret && providedSecret !== expectedSecret) {
            return NextResponse.json(
                { success: false, error: "Invalid Ingest Secret Token" },
                { status: 401, headers: corsHeaders }
            );
        }

        // 2. Parse JSON Payload
        const body = await req.json();
        const {
            ticket_id,
            customer_id,
            customer_name,
            phone_number,
            address,
            latitude,
            longitude,
            unpaid_amount,
            billing_url,
            device_type,
            cluster_name,
            notes,
        } = body;

        // Validasi minimal: Wajib memiliki nomor tiket atau ID pelanggan
        if (!ticket_id && !customer_id) {
            return NextResponse.json(
                { success: false, error: "ticket_id atau customer_id wajib disertakan" },
                { status: 400, headers: corsHeaders }
            );
        }

        // Inisialisasi Supabase Client Server
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
        const supabaseKey =
            process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
            "";

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json(
                { success: false, error: "Konfigurasi database server belum lengkap" },
                { status: 500, headers: corsHeaders }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 3. Normalisasi Nilai Default
        const cleanTicketId = ticket_id ? String(ticket_id).trim().toUpperCase() : null;
        const cleanCustomerId = customer_id ? String(customer_id).trim() : cleanTicketId || "UNKNOWN-CID";
        const cleanCustomerName = customer_name ? String(customer_name).trim() : "Pelanggan " + cleanCustomerId;
        const cleanAddress = address ? String(address).trim() : "Alamat belum tercatat di Billingnesia";
        const cleanCluster = cluster_name && cluster_name.trim() !== "" ? cluster_name.trim() : generateAutoClusterTag();
        const cleanUnpaid = typeof unpaid_amount === "number" ? unpaid_amount : Number(unpaid_amount) || 0;

        // Koordinat default (Area Operasional Banyumas / Purwokerto) jika GPS belum disetel
        const parsedLat = typeof latitude === "number" ? latitude : parseFloat(latitude);
        const parsedLng = typeof longitude === "number" ? longitude : parseFloat(longitude);
        const finalLat = !isNaN(parsedLat) && parsedLat !== 0 ? parsedLat : -7.4243;
        const finalLng = !isNaN(parsedLng) && parsedLng !== 0 ? parsedLng : 109.2301;

        // 4. Cek apakah tiket sudah pernah ada di database (Idempotent UPSERT)
        let existingTask = null;
        if (cleanTicketId) {
            const { data } = await supabase
                .from("dismantle_tasks")
                .select("id, status, ticket_id, cluster_name")
                .eq("ticket_id", cleanTicketId)
                .maybeSingle();

            existingTask = data;
        }

        if (existingTask) {
            // Update data yang ada tanpa menimpa progres status pengerjaan teknisi
            const updatePayload: Record<string, unknown> = {
                customer_name: cleanCustomerName,
                address: cleanAddress,
                unpaid_amount: cleanUnpaid,
                billing_url: billing_url || undefined,
                updated_at: new Date().toISOString(),
            };

            if (phone_number) updatePayload.phone_number = phone_number;
            if (finalLat !== -7.4243) updatePayload.latitude = finalLat;
            if (finalLng !== 109.2301) updatePayload.longitude = finalLng;

            const { data: updated, error: updateError } = await supabase
                .from("dismantle_tasks")
                .update(updatePayload)
                .eq("id", existingTask.id)
                .select()
                .single();

            if (updateError) {
                return NextResponse.json(
                    { success: false, error: updateError.message },
                    { status: 500, headers: corsHeaders }
                );
            }

            return NextResponse.json(
                {
                    success: true,
                    message: "Data dismantle berhasil diperbarui (UPSERT)",
                    data: {
                        id: updated.id,
                        ticket_id: updated.ticket_id,
                        customer_name: updated.customer_name,
                        cluster_name: updated.cluster_name,
                        unpaid_amount: updated.unpaid_amount,
                        status: updated.status,
                    },
                },
                { status: 200, headers: corsHeaders }
            );
        }

        // 5. Jika data baru, lakukan INSERT
        const insertPayload = {
            ticket_id: cleanTicketId,
            customer_id: cleanCustomerId,
            customer_name: cleanCustomerName,
            phone_number: phone_number || null,
            address: cleanAddress,
            cluster_name: cleanCluster,
            latitude: finalLat,
            longitude: finalLng,
            status: "QUEUE",
            device_type: device_type || "ONT ZTE F609",
            accessories: ["ADAPTOR", "PATCHCORD"],
            unpaid_amount: cleanUnpaid,
            billing_url: billing_url || null,
            auto_ingested: true,
            failure_reason: notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data: inserted, error: insertError } = await supabase
            .from("dismantle_tasks")
            .insert([insertPayload])
            .select()
            .single();

        if (insertError) {
            return NextResponse.json(
                { success: false, error: insertError.message },
                { status: 500, headers: corsHeaders }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Tugas dismantle baru berhasil ditambahkan",
                data: {
                    id: inserted.id,
                    ticket_id: inserted.ticket_id,
                    customer_name: inserted.customer_name,
                    cluster_name: inserted.cluster_name,
                    unpaid_amount: inserted.unpaid_amount,
                    status: inserted.status,
                },
            },
            { status: 200, headers: corsHeaders }
        );
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan internal server";
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500, headers: corsHeaders }
        );
    }
}
