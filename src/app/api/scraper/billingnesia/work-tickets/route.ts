/**
 * ============================================================================
 * MODUL       : Scraper Tiket Pekerjaan (Work Tickets)
 * FILE        : src/app/api/scraper/billingnesia/work-tickets/route.ts
 * DESKRIPSI   : API Route untuk menarik daftar tiket dari Billingnesia
 *               tableTiket dengan isolasi sesi pengguna aktif.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BAGIAN 1: IMPORT & DEPENDENCIES
// ----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { scrapeWorkTicketsTable } from "@/lib/scraper/billingnesiaScraper";
import { getCurrentUser } from "@/lib/auth/session";

// ----------------------------------------------------------------------------
// BAGIAN 2: DEFINISI TIPE & INTERFACE (TYPESCRIPT CONTRACT)
// ----------------------------------------------------------------------------
interface WorkTicketsRequestBody {
    date?: string;
    jenis?: string;
    page?: number;
    perPage?: number;
    search?: string;
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
        const body: WorkTicketsRequestBody = await req.json().catch(() => ({}));
        const { date, jenis, page, perPage, search } = body;

        // Ambil sesi user aktif jika ada
        const auth = await getCurrentUser();
        const userCookie = auth?.billingnesiaCookie;

        const result = await scrapeWorkTicketsTable({
            date,
            jenis: jenis || "TEKNIS",
            page: page ? Number(page) : 1,
            perPage: perPage ? Number(perPage) : 25,
            search,
            userSessionCookie: userCookie,
        });

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (err: unknown) {
        console.error("API /api/scraper/billingnesia/work-tickets error:", err);
        return NextResponse.json(
            {
                success: false,
                error: err instanceof Error ? err.message : "Gagal mengambil daftar tiket pekerjaan dari Billingnesia.",
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
