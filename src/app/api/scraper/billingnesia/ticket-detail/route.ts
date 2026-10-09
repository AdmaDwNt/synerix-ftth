import { NextRequest, NextResponse } from "next/server";
import { scrapeTicketDetail } from "@/lib/scraper/billingnesiaScraper";

export const maxDuration = 10;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
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

        const username = process.env.BILLINGNESIA_USERNAME;
        const password = process.env.BILLINGNESIA_PASSWORD;
        if (!username || !password || username === "akun_username_anda") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Kredensial Billingnesia belum dikonfigurasi di server.",
                },
                { status: 503 }
            );
        }

        const detail = await scrapeTicketDetail(cleanTicketId);

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
