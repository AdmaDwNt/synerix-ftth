import { NextRequest, NextResponse } from "next/server";
import { scrapeBillingnesiaData } from "@/lib/scraper/billingnesiaScraper";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { query, customer_id } = body;

        const effectiveQuery = (customer_id || query || "").trim();

        if (!effectiveQuery) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Parameter pencarian (Nomor Tiket, ID Pelanggan, Nama, atau Daerah) wajib disertakan.",
                },
                { status: 400 }
            );
        }

        const result = await scrapeBillingnesiaData(effectiveQuery, customer_id);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || "Gagal memproses pencarian data dari Billingnesia.",
                },
                { status: 422 }
            );
        }

        // Jika ada beberapa kandidat yang cocok (misal pencarian nama "Bambang" atau daerah "Banjarejo")
        if (result.is_multiple && result.candidates) {
            return NextResponse.json(
                {
                    success: true,
                    is_multiple: true,
                    query: result.query || effectiveQuery,
                    candidates: result.candidates,
                    total: result.candidates.length,
                },
                { status: 200 }
            );
        }

        // Jika data tunggal (detail tiket atau profil pelanggan spesifik)
        return NextResponse.json(
            {
                success: true,
                is_multiple: false,
                data: result.data,
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("API /api/scraper/billingnesia error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Terjadi kesalahan internal pada server scraper.",
            },
            { status: 500 }
        );
    }
}
