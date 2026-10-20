/**
 * ============================================================================
 * MODUL       : Scraper Detail Tiket (Ticket Detail & Logs)
 * FILE        : src/app/api/scraper/billingnesia/ticket-detail/route.ts
 * DESKRIPSI   : API Route untuk menarik detail tiket dan tabel log aktivitas
 *               dari Billingnesia dengan sesi pengguna aktif.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BAGIAN 1: IMPORT & DEPENDENCIES
// ----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { scrapeTicketDetail } from "@/lib/scraper/billingnesiaScraper";
import { getCurrentUser } from "@/lib/auth/session";

// ----------------------------------------------------------------------------
// BAGIAN 2: DEFINISI TIPE & INTERFACE (TYPESCRIPT CONTRACT)
// ----------------------------------------------------------------------------
interface TicketDetailRequestBody {
    ticket_id?: string;
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
        const body: TicketDetailRequestBody = await req.json();
        const { ticket_id } = body;

        const cleanTicketId = (ticket_id || "").trim();
        if (!cleanTicketId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Parameter ticket_id wajib disertakan.",
                },
                { status: 400 }
            );
        }

        // Ambil sesi user aktif jika ada
        const auth = await getCurrentUser();
        const userCookie = auth?.billingnesiaCookie;

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

        const detail = await scrapeTicketDetail(cleanTicketId, userCookie);

        return NextResponse.json(
            {
                success: true,
                data: detail,
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("API /api/scraper/billingnesia/ticket-detail error:", error);

        let errorMessage = "Terjadi kesalahan saat mengambil detail tiket dari Billingnesia.";
        if (error instanceof Error) {
            if (error.message.includes("timeout")) {
                errorMessage = "Koneksi ke Billingnesia timeout saat mengambil detail tiket. Coba lagi.";
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
