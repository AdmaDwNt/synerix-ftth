"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { DismantleTask, DismantleStatus } from "@/lib/types/dismantle";
import { calculateHaversineDistance } from "@/lib/ftth/distance";
import { createClient } from "@/lib/supabase/client";
import DismantleCard from "@/components/dismantles/DismantleCard";
import DismantleTable from "@/components/dismantles/DismantleTable";
import DataTablePagination from "@/components/layout/DataTablePagination";
import SummaryMetricsStrip, { MetricItem } from "@/components/layout/SummaryMetricsStrip";
import DismantleClusterFilter from "@/components/dismantles/DismantleClusterFilter";
import DismantleStatusModal from "@/components/dismantles/DismantleStatusModal";
import AddDismantleModal from "@/components/dismantles/AddDismantleModal";
import EditDismantleModal from "@/components/dismantles/EditDismantleModal";
import ImportDismantleModal from "@/components/dismantles/ImportDismantleModal";
import InstallBookmarkletModal from "@/components/dismantles/InstallBookmarkletModal";
import HandoverSummaryTable from "@/components/dismantles/HandoverSummaryTable";
import CustomSelect, { SelectOption } from "@/components/ui/CustomSelect";
import ToastNotification, { ToastItem } from "@/components/ui/ToastNotification";
import {
    Truck,
    ListFilter,
    MapPin,
    PackageCheck,
    Plus,
    Smartphone,
    Zap,
    RefreshCw,
    Compass,
    AlertCircle,
    FileSpreadsheet,
    Inbox,
    CheckCircle2,
    Calendar,
    Search,
    Filter
} from "lucide-react";

// Dynamic Import Peta Leaflet (No-SSR)
const DismantleMap = dynamic(() => import("@/components/dismantles/DismantleMap"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[500px] rounded-2xl bg-slate-100 border border-synerix-border flex items-center justify-center text-xs text-slate-500 font-medium">
            <RefreshCw className="h-5 w-5 animate-spin mr-2 text-teal-600" />
            Memuat Peta Sebaran Dismantle...
        </div>
    ),
});

export default function DismantlesPage() {
    const supabase = createClient();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [tasks, setTasks] = useState<DismantleTask[]>([]);
    const [activeTab, setActiveTab] = useState<"LIST" | "MAP" | "HANDOVER">("LIST");
    const [loading, setLoading] = useState(true);

    // Filter states
    const [selectedCluster, setSelectedCluster] = useState("ALL");
    const [selectedOdp, setSelectedOdp] = useState("ALL");
    const [selectedStatus, setSelectedStatus] = useState<DismantleStatus | "ALL">("ALL");
    const [searchQuery, setSearchQuery] = useState("");

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

    // Modal states
    const [activeTaskForModal, setActiveTaskForModal] = useState<DismantleTask | null>(null);
    const [activeTaskForEdit, setActiveTaskForEdit] = useState<DismantleTask | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isBookmarkletModalOpen, setIsBookmarkletModalOpen] = useState(false);

    // Floating Toast Notifications state (non-blocking)
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const addToast = (item: Omit<ToastItem, "id">) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { ...item, id }]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    // Pagination state (Pilihan 10, 25, 50, 100 sesuai permintaan pengguna)
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Live Geolocation state
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationActive, setLocationActive] = useState(false);

    // Ambil data murni 100% dari Supabase
    const fetchDismantleTasks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("dismantle_tasks")
                .select("*")
                .order("created_at", { ascending: false });

            if (data) {
                setTasks(data as DismantleTask[]);
            } else if (error) {
                console.error("Gagal mengambil data dismantle dari Supabase:", error.message);
                setTasks([]);
            }
        } catch (e) {
            console.error("Error fetching dismantles:", e);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDismantleTasks();
    }, []);

    // Reset pagination ke halaman 1 saat filter berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCluster, selectedOdp, selectedStatus, searchQuery]);

    // Ambil GPS Live Teknisi
    const handleGetLiveLocation = () => {
        if (!navigator.geolocation) {
            alert("Perangkat Anda tidak mendukung fitur Geolocation.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
                setLocationActive(true);
            },
            (err) => {
                alert("Gagal membaca GPS: " + err.message);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Callback saat input manual berhasil
    const handleAddSuccess = (newTask: DismantleTask) => {
        setTasks((prev) => [newTask, ...prev]);
    };

    // Callback saat edit berhasil
    const handleEditSuccess = (updatedTask: DismantleTask) => {
        setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    };

    // Callback saat import batch berhasil
    const handleImportSuccess = (newTasks: DismantleTask[]) => {
        setTasks((prev) => [...newTasks, ...prev]);
    };

    // Hapus tugas dismantle langsung dengan Toast Notification (non-blocking)
    const handleDirectDelete = async (task: DismantleTask) => {
        const taskId = task.id;

        // 1. Optimistic removal dari UI
        setTasks((prev) => prev.filter((t) => t.id !== taskId));

        // 2. Notifikasi Toast Mengambang dengan Opsi Urungkan (Undo)
        addToast({
            type: "success",
            title: "Tugas Dismantle Dihapus",
            message: `Tugas pelanggan ${task.customer_name} (${task.customer_id}) telah dihapus.`,
            actionLabel: "Urungkan",
            durationMs: 5000,
            onAction: async () => {
                // Kembalikan ke UI & database jika di-undo
                try {
                    await supabase.from("dismantle_tasks").insert([task]);
                    setTasks((prev) => [task, ...prev]);
                    addToast({
                        type: "info",
                        title: "Dibatalkan",
                        message: `Tugas ${task.customer_name} berhasil dipulihkan.`,
                    });
                } catch (e: any) {
                    console.error("Gagal mengurungkan:", e);
                }
            },
        });

        // 3. Eksekusi DELETE ke Supabase di background
        try {
            const { data, error } = await supabase
                .from("dismantle_tasks")
                .delete()
                .eq("id", taskId)
                .select();

            if (error || !data || data.length === 0) {
                // Coba via server API
                const res = await fetch(`/api/dismantles/${taskId}`, { method: "DELETE" });
                const json = await res.json();

                if (!res.ok || !json.success) {
                    // Jika gagal hapus permanen karena RLS, kembalikan data dan beri notifikasi
                    setTasks((prev) => [task, ...prev]);
                    addToast({
                        type: "error",
                        title: "Gagal Hapus dari Database",
                        message: "Izin RLS DELETE belum aktif di Supabase. Jalankan skrip fix_dismantle_delete_policy.sql di SQL Editor.",
                        durationMs: 7000,
                    });
                }
            }
        } catch (err: any) {
            setTasks((prev) => [task, ...prev]);
            addToast({
                type: "error",
                title: "Gagal Menghapus Data",
                message: err?.message || "Terjadi kesalahan saat menghapus data.",
            });
        }
    };

    // Update status di Supabase & local state
    const handleSaveStatus = async (updatedTask: DismantleTask) => {
        try {
            await supabase
                .from("dismantle_tasks")
                .update({
                    status: updatedTask.status,
                    device_type: updatedTask.device_type,
                    serial_number: updatedTask.serial_number,
                    mac_address: updatedTask.mac_address,
                    accessories: updatedTask.accessories,
                    failure_reason: updatedTask.failure_reason,
                    technician_name: updatedTask.technician_name,
                    evidence_photo_url: updatedTask.evidence_photo_url,
                    completed_at: updatedTask.completed_at,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", updatedTask.id);
        } catch (err) {
            console.warn("Gagal update ke Supabase, menyimpan ke local state:", err);
        }

        setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    };

    // Toggle status serah terima gudang
    const handleToggleHandoverStatus = async (taskId: string, current: boolean) => {
        const nextState = !current;
        try {
            await supabase
                .from("dismantle_tasks")
                .update({ handover_status: nextState, updated_at: new Date().toISOString() })
                .eq("id", taskId);
        } catch (err) {
            console.warn(err);
        }

        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, handover_status: nextState } : t))
        );
    };

    // Unique clusters & ODPs
    const clusters = useMemo(() => {
        return Array.from(new Set(tasks.map((t) => t.cluster_name).filter(Boolean)));
    }, [tasks]);

    const parentOdps = useMemo(() => {
        return Array.from(new Set(tasks.map((t) => t.parent_odp_name).filter(Boolean) as string[]));
    }, [tasks]);

    // Tasks dengan perhitungan jarak GPS & filter
    const processedTasks = useMemo(() => {
        let list = tasks.map((task) => {
            if (userLocation) {
                const dist = calculateHaversineDistance(
                    userLocation.lat,
                    userLocation.lng,
                    task.latitude,
                    task.longitude
                );
                return { ...task, distance_meters: dist };
            }
            return task;
        });

        // Urutkan jarak jika GPS aktif
        if (locationActive && userLocation) {
            list.sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));
        }

        // Terapkan filter
        return list.filter((task) => {
            const matchesCluster = selectedCluster === "ALL" || task.cluster_name === selectedCluster;
            const matchesOdp = selectedOdp === "ALL" || task.parent_odp_name === selectedOdp;
            const matchesStatus = selectedStatus === "ALL" || task.status === selectedStatus;
            const matchesQuery =
                task.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.customer_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (task.serial_number && task.serial_number.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesCluster && matchesOdp && matchesStatus && matchesQuery;
        });
    }, [tasks, userLocation, locationActive, selectedCluster, selectedOdp, selectedStatus, searchQuery]);

    // Pagination calculations
    const totalPages = Math.ceil(processedTasks.length / pageSize) || 1;
    const paginatedTasks = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return processedTasks.slice(start, start + pageSize);
    }, [processedTasks, currentPage]);

    // Counters
    const counts = {
        all: tasks.length,
        queue: tasks.filter((t) => t.status === "QUEUE").length,
        inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
        completed: tasks.filter((t) => t.status === "COMPLETED").length,
        failed: tasks.filter((t) => t.status === "FAILED").length,
    };

    const completedTasks = useMemo(() => {
        return tasks.filter((t) => t.status === "COMPLETED");
    }, [tasks]);

    return (
        <main className="min-h-screen bg-synerix-bg pb-24">
            {/* Top Header Banner */}
            <div className="bg-white border-b border-synerix-border">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-synerix-text tracking-tight">
                            Manajemen Penarikan Perangkat (ONT/STB)
                        </h1>
                        <p className="text-xs sm:text-sm text-synerix-subtext mt-1 max-w-2xl">
                            Pengelompokan daftar tugas per cluster perumahan & parent ODP, rute navigasi terdekat dari GPS teknisi, dan rekapitulasi serah terima logistik gudang.
                        </p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
                        <button
                            type="button"
                            onClick={() => setActiveTab("LIST")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                                activeTab === "LIST"
                                    ? "bg-teal-700 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                        >
                            <ListFilter className="h-4 w-4" />
                            <span>Daftar Tugas ({processedTasks.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("MAP")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                                activeTab === "MAP"
                                    ? "bg-teal-700 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                        >
                            <MapPin className="h-4 w-4" />
                            <span>Peta Cluster GIS</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("HANDOVER")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                                activeTab === "HANDOVER"
                                    ? "bg-teal-700 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                        >
                            <PackageCheck className="h-4 w-4" />
                            <span>Rekap Gudang ({completedTasks.length})</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area (Fluid full-width: w-full px-4 sm:px-6 lg:px-8) */}
            <div className="w-full px-4 sm:px-6 lg:px-8 pt-5 space-y-5">
                {activeTab === "LIST" && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {/* 1. Top 4 Metric Cards (Clickable Status Filters) */}
                        <SummaryMetricsStrip
                            activeId={selectedStatus === "ALL" ? undefined : selectedStatus.toLowerCase()}
                            onItemClick={(filterValue) => {
                                const targetStatus = filterValue as DismantleStatus;
                                setSelectedStatus((prev) => (prev === targetStatus ? "ALL" : targetStatus));
                                setCurrentPage(1);
                            }}
                            items={[
                                {
                                    id: "queue",
                                    label: "ANTREAN DISMANTLE",
                                    value: counts.queue,
                                    icon: <Inbox className="w-5 h-5 sm:w-6 sm:h-6" />,
                                    colorScheme: "amber",
                                    filterValue: "QUEUE",
                                },
                                {
                                    id: "in_progress",
                                    label: "DALAM PROSES / OTW",
                                    value: counts.inProgress,
                                    icon: <Truck className="w-5 h-5 sm:w-6 sm:h-6" />,
                                    colorScheme: "blue",
                                    filterValue: "IN_PROGRESS",
                                },
                                {
                                    id: "completed",
                                    label: "SELESAI PENARIKAN",
                                    value: counts.completed,
                                    icon: <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />,
                                    colorScheme: "emerald",
                                    filterValue: "COMPLETED",
                                },
                                {
                                    id: "failed",
                                    label: "TERKENDALA / GAGAL",
                                    value: counts.failed,
                                    icon: <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />,
                                    colorScheme: "rose",
                                    filterValue: "FAILED",
                                },
                            ]}
                        />

                        {/* 2. Main White Container (Matching Image 1) */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                            {/* Panel Header */}
                            <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-teal-700" />
                                            Daftar Tiket Dismantle &bull;{" "}
                                            {new Date().toLocaleDateString("id-ID", {
                                                day: "2-digit",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </h3>
                                    </div>
                                    {!loading && processedTasks.length > 0 && (
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

                                {/* Header Right: + Tambah Data, Import, & Bookmarklet HP */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => setIsBookmarkletModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-teal-200/90 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs shadow-2xs active:scale-95 transition-all"
                                        title="Pasang Bookmarklet Ingest HP untuk impor 1-tap langsung dari Billingnesia"
                                    >
                                        <Smartphone className="h-4 w-4 text-teal-700" />
                                        <span>📱 Ingest HP (1-Tap)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs active:scale-95 transition-all"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>Tambah Data</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsImportModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs active:scale-95 transition-all"
                                    >
                                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                        <span>Import Excel</span>
                                    </button>
                                </div>
                            </div>

                            {/* Table Controls Bar (Matching Image 1: Left = Tampilkan [25] data, Right = Filters + Search) */}
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

                                {/* Right: Filter Cluster, ODP, GPS Live, & Search Input */}
                                <div className="flex flex-wrap items-center gap-2 flex-1 md:justify-end">
                                    {/* Filter Cluster */}
                                    <CustomSelect
                                        options={[
                                            { value: "ALL", label: "Semua Cluster" },
                                            ...clusters.map((c) => ({ value: c, label: c })),
                                        ]}
                                        value={selectedCluster}
                                        onChange={(val) => setSelectedCluster(val)}
                                        size="sm"
                                        className="w-36"
                                        dropdownWidthClass="w-44 min-w-[150px]"
                                    />

                                    {/* Filter Status */}
                                    <CustomSelect
                                        options={[
                                            { value: "ALL", label: "Semua Status" },
                                            { value: "QUEUE", label: "Antrean", colorDot: "bg-amber-500" },
                                            { value: "IN_PROGRESS", label: "Dalam Proses", colorDot: "bg-blue-500" },
                                            { value: "COMPLETED", label: "Selesai", colorDot: "bg-emerald-500" },
                                            { value: "FAILED", label: "Gagal", colorDot: "bg-rose-500" },
                                        ]}
                                        value={selectedStatus}
                                        onChange={(val) => setSelectedStatus(val as DismantleStatus | "ALL")}
                                        size="sm"
                                        className="w-36"
                                        dropdownWidthClass="w-44 min-w-[150px]"
                                    />

                                    {/* Tombol GPS Proximity */}
                                    <button
                                        type="button"
                                        onClick={handleGetLiveLocation}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-2xs ${
                                            locationActive
                                                ? "bg-teal-700 text-white"
                                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                        }`}
                                        title="Urutkan jarak terdekat dari lokasi teknisi saat ini"
                                    >
                                        <Compass
                                            className={`h-3.5 w-3.5 ${
                                                locationActive ? "animate-spin text-teal-300" : ""
                                            }`}
                                        />
                                        <span className="hidden sm:inline">
                                            {locationActive ? "GPS Aktif" : "GPS Terdekat"}
                                        </span>
                                    </button>

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
                                {loading && (
                                    <div className="py-12 text-center text-slate-400">
                                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-teal-600" />
                                        <span className="text-xs font-medium">
                                            Memuat data dari database Supabase...
                                        </span>
                                    </div>
                                )}

                                {!loading && processedTasks.length === 0 && (
                                    <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6">
                                        <AlertCircle className="h-10 w-10 mx-auto mb-2.5 text-slate-300" />
                                        {tasks.length === 0 ? (
                                            <>
                                                <h4 className="font-bold text-slate-800 text-sm">
                                                    Belum Ada Tugas Dismantle di Database Supabase
                                                </h4>
                                                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                                                    Mulai tambahkan tugas penarikan perangkat baru secara manual
                                                    atau impor daftar tugas dari file spreadsheet Excel / CSV.
                                                </p>
                                                <div className="mt-4 flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsAddModalOpen(true)}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        <span>Tambah Tugas Baru</span>
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <h4 className="font-semibold text-slate-700 text-sm">
                                                    Tidak Ada Tugas yang Cocok dengan Filter
                                                </h4>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Coba sesuaikan kata kunci pencarian atau ubah filter area/status.
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}

                                {!loading && processedTasks.length > 0 && (
                                    <>
                                        {/* Desktop Table View (hidden on mobile, visible on md and up) */}
                                        <div className="hidden md:block">
                                            <DismantleTable
                                                tasks={paginatedTasks}
                                                startIndex={(currentPage - 1) * pageSize + 1}
                                                onOpenStatusModal={(t) => setActiveTaskForModal(t)}
                                                onOpenEditModal={(t) => setActiveTaskForEdit(t)}
                                                onDeleteTask={handleDirectDelete}
                                            />
                                        </div>

                                        {/* Mobile Card View (visible on mobile, hidden on md and up) */}
                                        <div className="block md:hidden">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                                {paginatedTasks.map((task) => (
                                                    <DismantleCard
                                                        key={task.id}
                                                        task={task}
                                                        onOpenStatusModal={(t) => setActiveTaskForModal(t)}
                                                        onOpenEditModal={(t) => setActiveTaskForEdit(t)}
                                                        onDeleteTask={handleDirectDelete}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Pagination Footer Component (Matching Image 1 & Image 2) */}
                                        <DataTablePagination
                                            currentPage={currentPage}
                                            pageSize={pageSize}
                                            totalItems={processedTasks.length}
                                            onPageChange={setCurrentPage}
                                            showPageSizeSelector={false}
                                            itemName="tiket aktif"
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "MAP" && (
                    <div className="animate-in fade-in duration-200 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-synerix-border shadow-xs">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Compass className="h-4 w-4 text-teal-600" />
                                    Peta Visual Rute & Sebaran Tugas Dismantle
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Klik marker untuk melihat detail pelanggan, jarak, dan langsung luncurkan navigasi Google Maps atau Waze.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleGetLiveLocation}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 text-white text-xs font-semibold shadow-xs self-start sm:self-auto"
                            >
                                <Compass className="h-4 w-4" />
                                {locationActive ? "Perbarui GPS Saya" : "Tampilkan Lokasi Saya di Peta"}
                            </button>
                        </div>

                        <DismantleMap
                            tasks={processedTasks}
                            onOpenStatusModal={(t: DismantleTask) => setActiveTaskForModal(t)}
                            userLocation={userLocation}
                        />
                    </div>
                )}

                {activeTab === "HANDOVER" && (
                    <div className="animate-in fade-in duration-200">
                        <HandoverSummaryTable
                            completedTasks={completedTasks}
                            onToggleHandoverStatus={handleToggleHandoverStatus}
                        />
                    </div>
                )}
            </div>

            {/* Modal Tambah Tugas Manual */}
            <AddDismantleModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleAddSuccess}
            />

            {/* Modal Edit Tugas */}
            <EditDismantleModal
                task={activeTaskForEdit}
                isOpen={!!activeTaskForEdit}
                onClose={() => setActiveTaskForEdit(null)}
                onSuccess={handleEditSuccess}
            />

            {/* Modal Import Excel/CSV */}
            <ImportDismantleModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={handleImportSuccess}
            />

            {/* Modal Panduan Pasang Bookmarklet HP */}
            <InstallBookmarkletModal
                isOpen={isBookmarkletModalOpen}
                onClose={() => setIsBookmarkletModalOpen(false)}
            />

            {/* Modal Transisi Status Dismantle */}
            {activeTaskForModal && (
                <DismantleStatusModal
                    task={activeTaskForModal}
                    isOpen={!!activeTaskForModal}
                    onClose={() => setActiveTaskForModal(null)}
                    onSaveStatus={handleSaveStatus}
                />
            )}

            {/* Toast Notification Mengambang (Non-Blocking) */}
            <ToastNotification toasts={toasts} onDismiss={removeToast} />
        </main>
    );
}
