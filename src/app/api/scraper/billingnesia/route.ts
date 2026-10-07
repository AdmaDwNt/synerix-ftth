import { NextRequest, NextResponse } from "next/server";
import { scrapeBillingnesiaData } from "@/lib/scraper/billingnesiaScraper";

// Konfigurasi Vercel Serverless Function
// maxDuration: Maksimal waktu eksekusi (detik). Hobby plan = 10s, Pro = 60s.
export const maxDuration = 10;
export const dynamic = "force-dynamic";

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

        // Verifikasi kredensial tersedia di environment
        const username = process.env.BILLINGNESIA_USERNAME;
        const password = process.env.BILLINGNESIA_PASSWORD;
        if (!username || !password || username === "akun_username_anda") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Kredensial Billingnesia belum dikonfigurasi di server. Hubungi admin untuk mengatur Environment Variables.",
                },
                { status: 503 }
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

        // Berikan pesan error yang lebih informatif
        let errorMessage = "Terjadi kesalahan internal pada server scraper.";
        if (error instanceof Error) {
            if (error.message.includes("timeout")) {
                errorMessage = "Koneksi ke Billingnesia timeout. Server billing mungkin sedang lambat, coba lagi.";
            } else if (error.message.includes("ECONNREFUSED") || error.message.includes("ENOTFOUND")) {
                errorMessage = "Tidak dapat terhubung ke server Billingnesia. Pastikan server billing sedang aktif.";
            } else {
                errorMessage = error.message;
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
            },
            { status: 500 }
        );
    }
}
