"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
    Plus,
    Search,
    FileText,
    RefreshCw,
    Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import WorkLogCard from "@/components/work-logs/WorkLogCard";
import WorkLogTable from "@/components/work-logs/WorkLogTable";
import DataTablePagination from "@/components/layout/DataTablePagination";

import EditWorkLogModal, { WorkLogItem } from "@/components/work-logs/EditWorkLogModal";
import WorkLogSearchAddModal from "@/components/work-logs/WorkLogSearchAddModal";
import CustomSelect from "@/components/ui/CustomSelect";
import ToastNotification, { ToastItem } from "@/components/ui/ToastNotification";

export default function WorkLogsPage() {
    const supabase = createClient();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [logs, setLogs] = useState<WorkLogItem[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeLogForEdit, setActiveLogForEdit] = useState<WorkLogItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const addToast = (item: Omit<ToastItem, "id">) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { ...item, id }]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    // Shortcut '/' untuk fokus ke kotak pencarian
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInputActive =
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.tagName === "SELECT" ||
                target.isContentEditable;

            if (e.key === "/" && !isInputActive) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Fetch Data Pekerjaan murni dari Supabase
    const fetchWorkLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("work_logs")
                .select("*")
                .order("created_at", { ascending: false });

            if (!error && data) {
                setLogs(data as WorkLogItem[]);
            }
        } catch (e) {
            console.error("Error fetching work logs:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkLogs();
    }, []);

    // Reset pagination saat filter berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, searchQuery]);



    // Hapus Log Pekerjaan langsung dengan Toast Notification (non-blocking)
    const handleDirectDeleteLog = async (log: WorkLogItem) => {
        const logId = log.id;

        // 1. Optimistic removal dari UI
        setLogs((prev) => prev.filter((l) => l.id !== logId));

        // 2. Tampilkan Toast Notification mengambang dengan aksi Urungkan
        addToast({
            type: "success",
            title: "Catatan Dihapus",
            message: `Catatan "${log.title}" telah dihapus.`,
            actionLabel: "Urungkan",
            durationMs: 5000,
            onAction: async () => {
                try {
                    await supabase.from("work_logs").insert([log]);
                    setLogs((prev) => [log, ...prev]);
                    addToast({
                        type: "info",
                        title: "Dibatalkan",
                        message: `Catatan "${log.title}" berhasil dipulihkan.`,
                    });
                } catch (e: any) {
                    console.error("Gagal mengurungkan:", e);
                }
            },
        });

        // 3. Eksekusi DELETE ke Supabase di background
        try {
            const { error } = await supabase.from("work_logs").delete().eq("id", logId);
            if (error) {
                setLogs((prev) => [log, ...prev]);
                addToast({
                    type: "error",
                    title: "Gagal Menghapus dari Database",
                    message: error.message,
                });
            }
        } catch (err: unknown) {
            setLogs((prev) => [log, ...prev]);
            addToast({
                type: "error",
                title: "Error Tak Terduga",
                message: err instanceof Error ? err.message : String(err),
            });
        }
    };

    // Callback saat edit sukses (UPDATE)
    const handleEditSuccess = (updatedLog: WorkLogItem) => {
        setLogs((prev) => prev.map((l) => (l.id === updatedLog.id ? updatedLog : l)));
    };

    // Filter Data
    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const matchesCategory = selectedCategory === "ALL" || log.category === selectedCategory;
            const matchesSearch =
                log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.case_description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [logs, selectedCategory, searchQuery]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredLogs.slice(start, start + pageSize);
    }, [filteredLogs, currentPage]);

    return (
        <main className="min-h-screen bg-synerix-bg pb-24">
            {/* Top Header Banner */}
            <div className="bg-white border-b border-synerix-border">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                            Riwayat & Case Log Pekerjaan
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                            Dokumentasikan seluruh case teknis, maintenance jaringan, instalasi project, dan analisis redaman FTTH.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Area (Fluid full-width: w-full px-4 sm:px-6 lg:px-8) */}
            <div className="w-full px-4 sm:px-6 lg:px-8 pt-5 space-y-5">


                {/* 2. Main White Container (Matching Image 1) */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                    {/* Panel Header */}
                    <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-teal-700" />
                                    Daftar Tiket Pekerjaan &bull;{" "}
                                    {new Date().toLocaleDateString("id-ID", {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </h3>
                            </div>
                            {filteredLogs.length > 0 && (
                                <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-medium">
                                    <span className="flex items-center gap-1">
                                        <span className="text-emerald-500 font-black">●</span> &le; 2 jam
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="text-amber-500 font-black">●</span> 2-9 jam
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="text-rose-500 font-black">●</span> &gt; 8 jam
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Header Right: + Tambah Data */}
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs active:scale-95 transition-all self-start sm:self-auto"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Tambah Data</span>
                        </button>
                    </div>

                    {/* Table Controls Bar (Matching Image 1: Left = Tampilkan [25] data, Right = Category Filter + Search) */}
                    <div className="p-4 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Left: Page Size Selector (10, 25, 50, 100) */}
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <span>Tampilkan</span>
                            <CustomSelect
                                options={[
                                    { value: "10", label: "10" },
                                    { value: "25", label: "25" },
                                    { value: "50", label: "50" },
                                    { value: "100", label: "100" },
                                ]}
                                value={String(pageSize)}
                                onChange={(val) => {
                                    setPageSize(Number(val));
                                    setCurrentPage(1);
                                }}
                                size="sm"
                                className="w-16"
                                dropdownWidthClass="w-20 min-w-[70px]"
                            />
                            <span>data</span>
                        </div>

                        {/* Right: Category Filter Pills + Search Input */}
                        <div className="flex flex-wrap items-center gap-2 flex-1 md:justify-end">
                            {/* Search Input Box */}
                            <div className="relative min-w-[210px] flex-1 sm:flex-initial">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Cari ID, Judul, pelanggan..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-3 pr-14 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-slate-50/50 shadow-2xs"
                                />
                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
                                        /
                                    </kbd>
                                    <Search className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Views: Desktop Table & Mobile Cards */}
                    <div className="p-4">
                        {loading && logs.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-teal-600" />
                                <span className="text-xs font-medium">Memuat data pekerjaan dari Supabase...</span>
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="p-8 rounded-xl bg-slate-50/50 border border-dashed border-slate-200 text-center text-slate-500">
                                <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                <h4 className="text-sm font-bold text-slate-800">Belum Ada Catatan Pekerjaan</h4>
                                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                    Klik tombol "Tambah Data" untuk mendokumentasikan case atau perbaikan teknis pertama Anda.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View (hidden on mobile, visible on md and up) */}
                                <div className="hidden md:block">
                                    <WorkLogTable
                                        logs={paginatedLogs}
                                        startIndex={(currentPage - 1) * pageSize + 1}
                                        onOpenEditModal={(l) => setActiveLogForEdit(l)}
                                        onDeleteLog={handleDirectDeleteLog}
                                    />
                                </div>

                                {/* Mobile Card View (visible on mobile, hidden on md and up) */}
                                <div className="block md:hidden">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        {paginatedLogs.map((log) => (
                                            <WorkLogCard
                                                key={log.id}
                                                log={log}
                                                onOpenEditModal={(l) => setActiveLogForEdit(l)}
                                                onDeleteLog={handleDirectDeleteLog}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Pagination Footer Component (Matching Image 1 & Image 2) */}
                                <DataTablePagination
                                    currentPage={currentPage}
                                    pageSize={pageSize}
                                    totalItems={filteredLogs.length}
                                    onPageChange={setCurrentPage}
                                    showPageSizeSelector={false}
                                    itemName="tiket aktif"
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Tambah Pekerjaan via Scraper Billingnesia & Pilih Tiket */}
            <WorkLogSearchAddModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={(newLog) => {
                    setLogs((prev) => [newLog, ...prev]);
                    addToast({
                        type: "success",
                        title: "Log Pekerjaan Disimpan",
                        message: `Catatan pekerjaan "${newLog.title}" berhasil ditambahkan ke riwayat.`,
                        durationMs: 4000,
                    });
                }}
            />

            {/* Modal Edit Pekerjaan (UPDATE) */}
            <EditWorkLogModal
                log={activeLogForEdit}
                isOpen={!!activeLogForEdit}
                onClose={() => setActiveLogForEdit(null)}
                onSuccess={handleEditSuccess}
            />

            {/* Toast Notification Mengambang (Non-Blocking) */}
            <ToastNotification toasts={toasts} onDismiss={removeToast} />
        </main>
    );
}