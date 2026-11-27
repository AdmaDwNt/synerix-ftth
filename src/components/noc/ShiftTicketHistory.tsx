/**
 * ============================================================================
 * MODUL       : Riwayat Laporan Tiket NOC
 * FILE        : src/components/noc/ShiftTicketHistory.tsx
 * DESKRIPSI   : Komponen arsip rekapitulasi penerimaan & penanganan tiket harian
 *               berdasarkan shift petugas NOC selaras dengan Screenshot 3.
 * ============================================================================
 */

"use client";

import React, { useState, useEffect } from "react";
import {
    History,
    FileSpreadsheet,
    FileText,
    Plus,
    Filter,
    RotateCcw,
    Copy,
    Edit2,
    Trash2,
    ChevronDown,
    ChevronUp,
    Calendar,
    Clock,
    User,
    CheckCircle2,
    Loader2,
    X,
} from "lucide-react";

export interface ShiftReportItem {
    id: string;
    staff_name: string;
    shift: string;
    report_date: string;
    report_time: string;
    tickets_received: number;
    tickets_handled: number;
    notes?: string;
    created_at?: string;
}

export default function ShiftTicketHistory() {
    const [reports, setReports] = useState<ShiftReportItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterStaff, setFilterStaff] = useState("");
    const [filterShift, setFilterShift] = useState("ALL");
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        staff_name: "Joko",
        shift: "SHIFT PAGI",
        tickets_received: 0,
        tickets_handled: 0,
        notes: "",
    });

    // Expand details state
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const loadReports = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filterStaff) params.set("staff", filterStaff);
            if (filterShift && filterShift !== "ALL") params.set("shift", filterShift);
            if (filterStartDate) params.set("startDate", filterStartDate);
            if (filterEndDate) params.set("endDate", filterEndDate);

            const res = await fetch(`/api/tickets/history?${params.toString()}`);
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
                setReports(json.data);
            }
        } catch (err) {
            console.error("Gagal memuat riwayat tiket:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const handleApplyFilter = () => {
        setCurrentPage(1);
        loadReports();
    };

    const handleResetFilter = () => {
        setFilterStaff("");
        setFilterShift("ALL");
        setFilterStartDate("");
        setFilterEndDate("");
        setCurrentPage(1);
        setTimeout(() => loadReports(), 50);
    };

    const toggleExpand = (id: string) => {
        const next = new Set(expandedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setExpandedIds(next);
    };

    const handleCopyReport = async (item: ShiftReportItem) => {
        const text = `*LAPORAN SHIFT NOC - SYNERIX FTTH*
Petugas : ${item.staff_name}
Shift   : ${item.shift}
Waktu   : ${item.report_date} (${item.report_time})
-----------------------------
Menerima  : ${item.tickets_received} Tiket
Menangani : ${item.tickets_handled} Tiket
Keterangan: ${item.notes || "-"}
-----------------------------
_Laporan digenerate dari Synerix NOC Console_`;

        try {
            await navigator.clipboard.writeText(text);
            setToastMessage(`Laporan shift ${item.staff_name} berhasil disalin!`);
            setTimeout(() => setToastMessage(null), 3000);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteReport = async (id: string) => {
        if (!confirm("Hapus laporan shift ini?")) return;
        try {
            await fetch(`/api/tickets/history?id=${id}`, { method: "DELETE" });
            setReports((prev) => prev.filter((r) => r.id !== id));
            setToastMessage("Laporan berhasil dihapus.");
            setTimeout(() => setToastMessage(null), 3000);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateReport = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/tickets/history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const json = await res.json();
            if (json.success && json.data) {
                setReports((prev) => [json.data, ...prev]);
                setIsCreateModalOpen(false);
                setFormData({
                    staff_name: "Joko",
                    shift: "SHIFT PAGI",
                    tickets_received: 0,
                    tickets_handled: 0,
                    notes: "",
                });
                setToastMessage("Laporan shift baru berhasil ditambahkan!");
                setTimeout(() => setToastMessage(null), 3000);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Export Excel / CSV
    const handleExportExcel = () => {
        const header = ["Staff,Shift,Tanggal,Jam,Menerima,Menangani,Catatan"];
        const rows = reports.map((r) =>
            `"${r.staff_name}","${r.shift}","${r.report_date}","${r.report_time}",${r.tickets_received},${r.tickets_handled},"${(r.notes || "").replace(/"/g, '""')}"`
        );
        const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Laporan_Tiket_NOC_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Export PDF print
    const handleExportPdf = () => {
        window.print();
    };

    // Pagination slice
    const totalItems = reports.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const paginatedReports = reports.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="space-y-4">
            {/* Dark Navy Hero Header (Matching Screenshot 3) */}
            <div className="bg-[#0f172a] rounded-2xl p-5 text-white shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <History className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                            Riwayat Laporan Tiket NOC
                        </h2>
                        <p className="text-xs text-slate-300">
                            Arsip rekapitulasi penerimaan dan penanganan tiket harian berdasarkan shift petugas NOC
                        </p>
                    </div>
                </div>

                {/* Top Action Buttons (Matching Screenshot 3: Ekspor Excel, Ekspor PDF, + Buat Laporan) */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={handleExportExcel}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Ekspor Excel</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleExportPdf}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ekspor PDF</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Buat Laporan</span>
                    </button>
                </div>
            </div>

            {/* Notification Toast */}
            {toastMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Filter Bar (Matching Screenshot 3) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-end gap-3">
                {/* Nama Staff */}
                <div className="flex-1 min-w-[160px]">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Nama Staff
                    </label>
                    <input
                        type="text"
                        placeholder="-- Semua Staff --"
                        value={filterStaff}
                        onChange={(e) => setFilterStaff(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                </div>

                {/* Shift */}
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Shift
                    </label>
                    <select
                        value={filterShift}
                        onChange={(e) => setFilterShift(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                        <option value="ALL">-- Semua Shift --</option>
                        <option value="SHIFT PAGI">SHIFT PAGI</option>
                        <option value="SHIFT SORE">SHIFT SORE</option>
                        <option value="SHIFT MALAM">SHIFT MALAM</option>
                        <option value="SOC">SOC</option>
                    </select>
                </div>

                {/* Dari Tanggal */}
                <div className="flex-1 min-w-[140px]">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Dari Tanggal
                    </label>
                    <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                </div>

                {/* Sampai Tanggal */}
                <div className="flex-1 min-w-[140px]">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Sampai Tanggal
                    </label>
                    <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                </div>

                {/* Filter & Reset Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleApplyFilter}
                        className="px-4 py-2 rounded-lg bg-[#1e293b] hover:bg-[#0f172a] text-white text-xs font-bold shadow-2xs active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                        <Filter className="w-3.5 h-3.5" />
                        <span>Filter</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleResetFilter}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                        title="Reset Filter"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* List Riwayat Laporan (Matching Screenshot 3) */}
            <div className="space-y-2">
                {loading ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 font-medium">Memuat riwayat laporan tiket...</p>
                    </div>
                ) : paginatedReports.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                        Tidak ada riwayat laporan tiket yang sesuai dengan filter.
                    </div>
                ) : (
                    paginatedReports.map((item) => {
                        const isExpanded = expandedIds.has(item.id);
                        const initialLetter = item.staff_name.charAt(0).toUpperCase();

                        return (
                            <div
                                key={item.id}
                                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-3.5 shadow-2xs transition-all space-y-3"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    {/* Left: Avatar + Staff Info + Timestamp */}
                                    <div className="flex items-center gap-3">
                                        {/* Avatar Initial (Matching Screenshot 3: Green circle) */}
                                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center shrink-0 border border-emerald-200">
                                            {initialLetter}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-sm text-slate-900">{item.staff_name}</h4>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                                    {item.shift}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                                <Calendar className="w-3 h-3" />
                                                <span>{item.report_date}</span>
                                                <span>&bull;</span>
                                                <Clock className="w-3 h-3" />
                                                <span>{item.report_time}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle: Metrics Badges (Matching Screenshot 3: Menerima: X, Menangani: Y) */}
                                    <div className="flex items-center gap-2">
                                        <div className="px-3 py-1 rounded-lg border border-teal-200 bg-teal-50 text-teal-900 font-bold text-xs">
                                            Menerima: {item.tickets_received} Tiket
                                        </div>
                                        <div className="px-3 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 font-bold text-xs">
                                            Menangani: {item.tickets_handled} Tiket
                                        </div>
                                    </div>

                                    {/* Right: Actions (Salin WA, Edit, Delete, Expand) */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => handleCopyReport(item)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                                            title="Salin Laporan ke WhatsApp"
                                        >
                                            <Copy className="w-3.5 h-3.5 text-amber-700" />
                                            <span>Salin ({item.tickets_received})</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteReport(item.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                            title="Hapus Laporan"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => toggleExpand(item.id)}
                                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                                            title="Detail Catatan"
                                        >
                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Notes Section */}
                                {isExpanded && (
                                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-700 bg-slate-50/80 p-3 rounded-lg animate-in fade-in">
                                        <p className="font-semibold text-slate-900 mb-1">Catatan Operasional:</p>
                                        <p className="whitespace-pre-line leading-relaxed">{item.notes || "Tidak ada catatan khusus pada shift ini."}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Bottom Pagination Bar (Matching Screenshot 3) */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
                <div>
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
                </div>

                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 border border-slate-200">
                    <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-2 py-1 rounded text-slate-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none font-bold"
                    >
                        &lt;
                    </button>

                    {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                        const pageNum = i + 1;
                        return (
                            <button
                                key={pageNum}
                                type="button"
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-2.5 py-1 rounded font-bold text-xs ${
                                    currentPage === pageNum ? "bg-[#1e293b] text-white" : "text-slate-600 hover:bg-white"
                                }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}

                    <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="px-2 py-1 rounded text-slate-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none font-bold"
                    >
                        &gt;
                    </button>
                </div>
            </div>

            {/* Modal Tambah Laporan */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-base text-slate-900">Buat Rekap Laporan Shift NOC</h3>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateReport} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Nama Staff</label>
                                <input
                                    type="text"
                                    value={formData.staff_name}
                                    onChange={(e) => setFormData({ ...formData, staff_name: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Shift Kerja</label>
                                <select
                                    value={formData.shift}
                                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                >
                                    <option value="SHIFT PAGI">SHIFT PAGI</option>
                                    <option value="SHIFT SORE">SHIFT SORE</option>
                                    <option value="SHIFT MALAM">SHIFT MALAM</option>
                                    <option value="SOC">SOC</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Tiket Diterima</label>
                                    <input
                                        type="number"
                                        value={formData.tickets_received}
                                        onChange={(e) =>
                                            setFormData({ ...formData, tickets_received: parseInt(e.target.value) || 0 })
                                        }
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Tiket Ditangani</label>
                                    <input
                                        type="number"
                                        value={formData.tickets_handled}
                                        onChange={(e) =>
                                            setFormData({ ...formData, tickets_handled: parseInt(e.target.value) || 0 })
                                        }
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Catatan Operasional</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                    placeholder="Contoh: Pemantauan OLT cluster aman, tidak ada kendala major..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-2xs"
                                >
                                    Simpan Laporan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
