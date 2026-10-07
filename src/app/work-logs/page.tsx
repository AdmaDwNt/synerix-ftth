"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
    Plus,
    Search,
    Filter,
    FileText,
    RefreshCw,
    MapPin,
    Home,
    Wifi,
    Briefcase,
    Megaphone,
    Calendar,
    Radio,
    ClipboardPaste,
    Sparkles
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import WorkLogCard from "@/components/work-logs/WorkLogCard";
import WorkLogTable from "@/components/work-logs/WorkLogTable";
import DataTablePagination from "@/components/layout/DataTablePagination";
import SummaryMetricsStrip from "@/components/layout/SummaryMetricsStrip";
import EditWorkLogModal, { WorkLogItem } from "@/components/work-logs/EditWorkLogModal";
import CustomSelect from "@/components/ui/CustomSelect";
import BillingnesiaAutofillBanner from "@/components/ui/BillingnesiaAutofillBanner";
import ToastNotification, { ToastItem } from "@/components/ui/ToastNotification";
import { BillingnesiaScrapedData } from "@/lib/scraper/billingnesiaScraper";

export default function WorkLogsPage() {
    const supabase = createClient();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [logs, setLogs] = useState<WorkLogItem[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeLogForEdit, setActiveLogForEdit] = useState<WorkLogItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [pasteText, setPasteText] = useState("");
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

    // Pagination (Pilihan 10, 25, 50, 100 sesuai permintaan pengguna)
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // State Form Input Baru
    const [formData, setFormData] = useState({
        title: "",
        category: "MAINTENANCE_RETAIL" as WorkLogItem["category"],
        case_description: "",
        resolution: "",
        optical_power_in: "",
        optical_power_out: "",
        status: "DONE" as WorkLogItem["status"],
        latitude: null as number | null,
        longitude: null as number | null,
    });

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

    // Ambil Koordinat GPS HP Saat Ini
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Browser/HP Anda tidak mendukung Geolocation");
            return;
        }
        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData((prev) => ({
                    ...prev,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                }));
                setGettingLocation(false);
            },
            (error) => {
                alert("Gagal mengambil lokasi: " + error.message);
                setGettingLocation(false);
            },
            { enableHighAccuracy: true }
        );
    };

    // Parser teks tiket dari billing.at-in.net
    const parseTicketText = (text: string) => {
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

        const getValueAfterLabel = (label: string): string => {
            const idx = lines.findIndex((l) => l.toLowerCase() === label.toLowerCase());
            if (idx !== -1 && idx + 1 < lines.length) {
                return lines[idx + 1];
            }
            return "";
        };

        const title = getValueAfterLabel("Judul");
        const kategori = getValueAfterLabel("Kategori Tiket");
        const caseDesc = getValueAfterLabel("Keterangan / Indikasi Awal");

        // Map kategori text to enum value
        let category: WorkLogItem["category"] = "MAINTENANCE_RETAIL";
        const k = kategori.toUpperCase();
        if (k.includes("JARINGAN") || k.includes("NETWORK")) category = "MAINTENANCE_NETWORK";
        else if (k.includes("RETAIL") || k.includes("PELANGGAN")) category = "MAINTENANCE_RETAIL";
        else if (k.includes("PROJECT") || k.includes("INSTALASI")) category = "PROJECT";
        else if (k.includes("DISMANTLE") || k.includes("CABUT")) category = "DISMANTLE";
        else if (k) category = "OTHER";

        // Extract percentage for status
        let status: WorkLogItem["status"] = "IN_PROGRESS";
        const percentMatch = text.match(/(\d+)%/);
        if (percentMatch) {
            const pct = parseInt(percentMatch[1]);
            if (pct === 100) status = "DONE";
            else if (pct >= 50) status = "IN_PROGRESS";
            else status = "PENDING";
        }

        return { title, category, case_description: caseDesc, status };
    };

    const handlePasteAutofill = (text: string) => {
        setPasteText(text);
        if (!text.trim()) return;

        const parsed = parseTicketText(text);
        setFormData((prev) => ({
            ...prev,
            title: parsed.title || prev.title,
            category: parsed.category || prev.category,
            case_description: parsed.case_description || prev.case_description,
            status: parsed.status || prev.status,
        }));
    };

    // Handler data autofill dari On-Demand Scraper Billingnesia
    const handleScraperAutofill = (data: BillingnesiaScrapedData) => {
        let cat: WorkLogItem["category"] = "MAINTENANCE_RETAIL";
        const k = (data.category || "").toUpperCase();
        if (k.includes("JARINGAN") || k.includes("NETWORK")) cat = "MAINTENANCE_NETWORK";
        else if (k.includes("RETAIL") || k.includes("PELANGGAN")) cat = "MAINTENANCE_RETAIL";
        else if (k.includes("PROJECT") || k.includes("INSTALASI")) cat = "PROJECT";
        else if (k.includes("DISMANTLE") || k.includes("CABUT")) cat = "DISMANTLE";
        else if (k) cat = "OTHER";

        const titleText = data.ticket_id
            ? `[${data.ticket_id}] ${data.customer_name || "Tiket Lapangan"}`
            : data.customer_name || formData.title;

        const infoLines = [
            data.address ? `Alamat: ${data.address}` : "",
            data.phone_number ? `WhatsApp/HP: ${data.phone_number}` : "",
            data.unpaid_amount > 0 ? `Tunggakan: Rp ${data.unpaid_amount.toLocaleString("id-ID")}` : "",
            data.device_type ? `ONT: ${data.device_type}` : "",
        ].filter(Boolean).join(" | ");

        setFormData((prev) => ({
            ...prev,
            title: titleText || prev.title,
            category: cat,
            case_description: prev.case_description ? `${prev.case_description}\n(${infoLines})` : infoLines,
            latitude: data.latitude ?? prev.latitude,
            longitude: data.longitude ?? prev.longitude,
        }));
    };

    // Submit Log Pekerjaan Baru (CREATE)
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            id: crypto.randomUUID(),
            title: formData.title.trim(),
            category: formData.category,
            case_description: formData.case_description.trim(),
            resolution: formData.resolution.trim(),
            optical_power_in: formData.optical_power_in ? parseFloat(formData.optical_power_in) : null,
            optical_power_out: formData.optical_power_out ? parseFloat(formData.optical_power_out) : null,
            status: formData.status,
            latitude: formData.latitude,
            longitude: formData.longitude,
            created_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("work_logs").insert([payload]);

        if (error) {
            alert("Gagal menyimpan data: " + error.message);
        } else {
            setIsCreateModalOpen(false);
            setPasteText("");
            setFormData({
                title: "",
                category: "MAINTENANCE_RETAIL",
                case_description: "",
                resolution: "",
                optical_power_in: "",
                optical_power_out: "",
                status: "DONE",
                latitude: null,
                longitude: null,
            });
            setLogs((prev) => [payload as WorkLogItem, ...prev]);
        }
        setLoading(false);
    };

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
                {/* 1. Top 4 Metric Cards (Matching Image 1) */}
                <SummaryMetricsStrip
                    items={[
                        {
                            id: "maint_retail",
                            label: "MAINTENANCE RETAIL",
                            value: logs.filter((l) => l.category === "MAINTENANCE_RETAIL").length,
                            icon: <Home className="w-5 h-5 sm:w-6 sm:h-6" />,
                            colorScheme: "amber",
                            filterValue: "MAINTENANCE_RETAIL",
                        },
                        {
                            id: "maint_network",
                            label: "MAINTENANCE JARINGAN",
                            value: logs.filter((l) => l.category === "MAINTENANCE_NETWORK").length,
                            icon: <Wifi className="w-5 h-5 sm:w-6 sm:h-6" />,
                            colorScheme: "amber",
                            filterValue: "MAINTENANCE_NETWORK",
                        },
                        {
                            id: "project",
                            label: "PROJECT",
                            value: logs.filter((l) => l.category === "PROJECT").length,
                            icon: <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />,
                            colorScheme: "amber",
                            filterValue: "PROJECT",
                        },
                        {
                            id: "other",
                            label: "KEGIATAN LAINNYA",
                            value: logs.filter((l) => l.category === "OTHER").length,
                            icon: <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" />,
                            colorScheme: "amber",
                            filterValue: "OTHER",
                        },
                    ]}
                    activeId={selectedCategory !== "ALL" ? {
                        MAINTENANCE_RETAIL: "maint_retail",
                        MAINTENANCE_NETWORK: "maint_network",
                        PROJECT: "project",
                        OTHER: "other",
                    }[selectedCategory] || null : null}
                    onItemClick={(filterValue, itemId) => {
                        setSelectedCategory((prev) =>
                            prev === filterValue ? "ALL" : filterValue
                        );
                    }}
                />

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

            {/* Modal Catat Pekerjaan Baru (CREATE) */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="font-bold text-base text-slate-900">Catat Pekerjaan Baru</h3>
                                <p className="text-xs text-slate-500">Input case operasional, maintenance atau project</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Banner Tarik Data Otomatis dari Billingnesia (On-Demand Scraper) */}
                        <div className="mt-4">
                            <BillingnesiaAutofillBanner
                                onDataFetched={handleScraperAutofill}
                                placeholder="Masukkan No. Tiket (TKT...) atau ID Pelanggan"
                            />
                        </div>

                        {/* Quick Paste Box (Metode Manual / Cadangan) */}
                        <div className="mt-3 p-3 bg-slate-50/90 rounded-xl border border-slate-200/80">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <ClipboardPaste className="h-3.5 w-3.5 text-teal-700" />
                                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wide">Quick Paste — Import dari Billing</span>
                            </div>
                            <p className="text-[10px] text-teal-600/90 mb-2">
                                Paste teks detail tiket dari <span className="font-bold">billing.at-in.net</span> untuk auto-fill form di bawah.
                            </p>
                            <textarea
                                rows={3}
                                placeholder={`Paste teks tiket di sini...\n\nContoh:\nJudul\nKABEL TERTINDIH POHON\nKategori Tiket\nMAINTENANCE JARINGAN`}
                                value={pasteText}
                                onChange={(e) => handlePasteAutofill(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-lg border border-teal-300/80 bg-white/90 focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono text-slate-700 placeholder:text-slate-400 resize-none"
                            />
                            {pasteText.trim() && (
                                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                                    <Sparkles className="h-3 w-3" />
                                    Form berhasil di-autofill dari teks tiket
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleCreateSubmit} className="mt-3 space-y-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Judul / Nama Case *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Kabel Tertindih Pohon / ONU Loss"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Kategori Pekerjaan
                                    </label>
                                    <CustomSelect
                                        value={formData.category}
                                        onChange={(val) =>
                                            setFormData({ ...formData, category: val as any })
                                        }
                                        options={[
                                            { value: "MAINTENANCE_NETWORK", label: "Maintenance Jaringan", colorDot: "bg-amber-500", description: "Gangguan / perbaikan jaringan" },
                                            { value: "MAINTENANCE_RETAIL", label: "Maintenance Retail", colorDot: "bg-sky-500", description: "Gangguan pelanggan / rumah" },
                                            { value: "PROJECT", label: "Project / Instalasi Baru", colorDot: "bg-blue-500", description: "Pemasangan baru" },
                                            { value: "DISMANTLE", label: "Dismantle / Pencabutan", colorDot: "bg-rose-500", description: "Penarikan perangkat" },
                                            { value: "OTHER", label: "Lainnya", colorDot: "bg-slate-400", description: "Kategori lain" },
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Status
                                    </label>
                                    <CustomSelect
                                        value={formData.status}
                                        onChange={(val) =>
                                            setFormData({ ...formData, status: val as any })
                                        }
                                        options={[
                                            { value: "DONE", label: "Selesai (DONE)", colorDot: "bg-emerald-500", description: "Pekerjaan sudah selesai" },
                                            { value: "IN_PROGRESS", label: "Sedang Dikerjakan", colorDot: "bg-blue-500", description: "Dalam proses pengerjaan" },
                                            { value: "PENDING", label: "Menunggu / Pending", colorDot: "bg-amber-500", description: "Menunggu konfirmasi" },
                                            { value: "ESCALATED", label: "Eskalasi", colorDot: "bg-rose-500", description: "Butuh penanganan lanjut" },
                                        ]}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Deskripsi Masalah / Case *
                                </label>
                                <textarea
                                    rows={2}
                                    required
                                    placeholder="Detail temuan di lapangan..."
                                    value={formData.case_description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, case_description: e.target.value })
                                    }
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Tindakan / Solusi
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Tindakan yang telah dieksekusi..."
                                    value={formData.resolution}
                                    onChange={(e) =>
                                        setFormData({ ...formData, resolution: e.target.value })
                                    }
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        Redaman ODP (dBm)
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="-18.5"
                                        value={formData.optical_power_in}
                                        onChange={(e) =>
                                            setFormData({ ...formData, optical_power_in: e.target.value })
                                        }
                                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        Redaman Rumah (dBm)
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="-19.8"
                                        value={formData.optical_power_out}
                                        onChange={(e) =>
                                            setFormData({ ...formData, optical_power_out: e.target.value })
                                        }
                                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                                    />
                                </div>
                            </div>

                            {/* Koordinat GPS */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 uppercase">
                                        <MapPin className="w-3.5 h-3.5 text-teal-600" /> Koordinat GPS
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleGetCurrentLocation}
                                        disabled={gettingLocation}
                                        className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 disabled:opacity-50"
                                    >
                                        {gettingLocation ? "Membaca GPS..." : "Ambil Lokasi Saya"}
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-semibold">Latitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={formData.latitude ?? ""}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    latitude: e.target.value ? parseFloat(e.target.value) : null,
                                                })
                                            }
                                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-semibold">Longitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={formData.longitude ?? ""}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    longitude: e.target.value ? parseFloat(e.target.value) : null,
                                                })
                                            }
                                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs disabled:opacity-50"
                                >
                                    {loading ? "Menyimpan..." : "Simpan Pekerjaan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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