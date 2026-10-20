/**
 * ============================================================================
 * MODUL       : Scraper Billingnesia On-Demand
 * FILE        : src/app/api/scraper/billingnesia/route.ts
 * DESKRIPSI   : API Route untuk pencarian data pelanggan & tiket dari Billingnesia.
 *               Mendukung multi-user session cookie dari user yang sedang login
 *               dengan fallback ke kredensial environment.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BAGIAN 1: IMPORT & DEPENDENCIES
// ----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { scrapeBillingnesiaData } from "@/lib/scraper/billingnesiaScraper";
import { getCurrentUser } from "@/lib/auth/session";

// ----------------------------------------------------------------------------
// BAGIAN 2: DEFINISI TIPE & INTERFACE (TYPESCRIPT CONTRACT)
// ----------------------------------------------------------------------------
interface ScraperRequestBody {
    query?: string;
    customer_id?: string;
}

// ----------------------------------------------------------------------------
// BAGIAN 3: KONSTANTA & KONFIGURASI
// ----------------------------------------------------------------------------
export const maxDuration = 10;
export const dynamic = "force-dynamic";

// ----------------------------------------------------------------------------
// BAGIAN 4: LOGIKA UTAMA (CORE BUSINESS LOGIC - POST)
// ----------------------------------------------------------------------------
export async function POST(req: NextRequest) {
    try {
        const body: ScraperRequestBody = await req.json();
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

        // 1. Ambil cookie sesi dari user yang sedang login (Multi-User Session Isolation)
        const auth = await getCurrentUser();
        const userCookie = auth?.billingnesiaCookie;

        // 2. Jika tidak ada user login aktif, pastikan kredensial fallback di env tersedia
        if (!userCookie) {
            const username = process.env.BILLINGNESIA_USERNAME;
            const password = process.env.BILLINGNESIA_PASSWORD;
            if (!username || !password || username === "akun_username_anda") {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Kredensial Billingnesia belum dikonfigurasi di server. Silakan login terlebih dahulu.",
                    },
                    { status: 401 }
                );
            }
        }

        // 3. Jalankan scraper dengan cookie sesi user aktif
        const result = await scrapeBillingnesiaData(effectiveQuery, customer_id, userCookie);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || "Gagal memproses pencarian data dari Billingnesia.",
                },
                { status: 422 }
            );
        }

        // 4. Jika ada beberapa kandidat (pencarian nama/daerah)
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

        // 5. Kembalikan data lengkap satu pelanggan/tiket
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

        let errorMessage = "Terjadi kesalahan internal saat mengambil data dari Billingnesia.";
        if (error instanceof Error) {
            if (error.message.includes("timeout")) {
                errorMessage = "Koneksi ke Billingnesia mengalami timeout. Silakan coba lagi dalam beberapa saat.";
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

// ----------------------------------------------------------------------------
// BAGIAN 5: HELPER / UTILITY FUNCTIONS
// ----------------------------------------------------------------------------
// Tidak ada helper tambahan pada route ini

// ----------------------------------------------------------------------------
// BAGIAN 6: EXPORT & PUBLIC API
// ----------------------------------------------------------------------------
// POST Handler diekspor untuk Next.js Route Handler
