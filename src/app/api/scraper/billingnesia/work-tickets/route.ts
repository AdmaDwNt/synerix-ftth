import { NextRequest, NextResponse } from "next/server";
import { scrapeWorkTicketsTable } from "@/lib/scraper/billingnesiaScraper";

export const maxDuration = 10;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { date, jenis, page, perPage, search } = body;

        const result = await scrapeWorkTicketsTable({
            date,
            jenis: jenis || "TEKNIS",
            page: page ? Number(page) : 1,
            perPage: perPage ? Number(perPage) : 25,
            search,
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
