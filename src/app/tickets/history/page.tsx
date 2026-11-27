/**
 * ============================================================================
 * MODUL       : Halaman Riwayat Laporan Tiket NOC
 * FILE        : src/app/tickets/history/page.tsx
 * DESKRIPSI   : Halaman arsip rekapitulasi penerimaan dan penanganan tiket harian
 *               shift petugas NOC.
 * ============================================================================
 */

import ShiftTicketHistory from "@/components/noc/ShiftTicketHistory";

export const metadata = {
    title: "Riwayat Laporan Tiket NOC - Synerix FTTH",
    description: "Arsip rekapitulasi tiket harian berdasarkan shift petugas NOC",
};

export default function TicketHistoryPage() {
    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <ShiftTicketHistory />
        </div>
    );
}
