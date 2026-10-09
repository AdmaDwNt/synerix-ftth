"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { TicketDetailData, TicketLogItem } from "@/lib/scraper/billingnesiaScraper";
import {
    ArrowLeft,
    Ticket,
    Clock,
    FileText,
    ExternalLink,
    RefreshCw,
    AlertCircle,
    User,
    Calendar,
    Image as ImageIcon,
    X,
    Send,
    CheckCircle2,
    Shield,
    Globe,
    Layers,
    ChevronRight,
} from "lucide-react";

function TicketDetailContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const rawTicketId = params?.ticketId as string;
    const ticketId = rawTicketId ? decodeURIComponent(rawTicketId).trim().toUpperCase() : "";
    const customerIdFromQuery = searchParams?.get("customer_id") || "";

    const [activeTab, setActiveTab] = useState<"info" | "log" | "input">("info");
    const [ticketData, setTicketData] = useState<TicketDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Lightbox image preview state
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Input Aktivitas simulation state
    const [inputKeterangan, setInputKeterangan] = useState("");
    const [inputPercent, setInputPercent] = useState("100");
    const [submittingInput, setSubmittingInput] = useState(false);
    const [inputSuccess, setInputSuccess] = useState(false);

    // Fetch ticket detail from scraper API
    const loadTicketDetail = useCallback(async (isRefresh = false) => {
        if (!ticketId) return;

        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const res = await fetch("/api/scraper/billingnesia/ticket-detail", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticket_id: ticketId }),
            });

            const json = await res.json();
            if (json.success && json.data) {
                setTicketData(json.data as TicketDetailData);
            } else {
                setError(json.error || "Gagal mengambil data detail tiket dari Billingnesia.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan koneksi saat memuat tiket.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [ticketId]);

    useEffect(() => {
        loadTicketDetail();
    }, [loadTicketDetail]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingInput(true);
        setTimeout(() => {
            setSubmittingInput(false);
            setInputSuccess(true);
            setTimeout(() => setInputSuccess(false), 4000);
        }, 800);
    };

    const targetCustomerId = ticketData?.customer_id || customerIdFromQuery;
    const backUrl = targetCustomerId ? `/dismantles/${targetCustomerId}` : "/dismantles";

    return (
        <div className="min-h-screen bg-slate-50/60 pb-16">
            {/* Top Navigation & Breadcrumb (Mobile-Sticky friendly) */}
            <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 transition-all">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => {
                                if (window.history.length > 1) {
                                    router.back();
                                } else {
                                    router.push(backUrl);
                                }
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-teal-700 bg-slate-100 hover:bg-teal-50 px-3 py-2 rounded-xl transition-colors active:scale-95 shrink-0"
                            title="Kembali"
                        >
                            <ArrowLeft className="w-4 h-4 text-slate-600" />
                            <span className="hidden sm:inline">Kembali</span>
                        </button>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                            <Link href="/dismantles" className="hover:text-teal-700 hover:underline shrink-0">
                                Dismantle
                            </Link>
                            <span className="text-slate-300">/</span>
                            {targetCustomerId ? (
                                <Link
                                    href={`/dismantles/${targetCustomerId}`}
                                    className="hover:text-teal-700 hover:underline truncate max-w-[120px] sm:max-w-none font-mono"
                                >
                                    Pelanggan {targetCustomerId}
                                </Link>
                            ) : (
                                <span className="text-slate-400">Pelanggan</span>
                            )}
                            <span className="text-slate-300">/</span>
                            <span className="font-bold text-slate-800 font-mono truncate">{ticketId}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => loadTicketDetail(true)}
                            disabled={refreshing || loading}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 px-3 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                            title="Sinkronkan data live dari Billingnesia"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-teal-600" : ""}`} />
                            <span className="hidden sm:inline">Refresh Scraper</span>
                        </button>

                        {ticketData?.billing_url && (
                            <a
                                href={ticketData.billing_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 px-3 py-2 rounded-xl transition-colors shadow-xs"
                                title="Buka detail tiket langsung di Billingnesia"
                            >
                                <span className="hidden sm:inline">Billingnesia</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-5 sm:pt-7 space-y-5">
                {/* Header Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 px-4 sm:px-6 py-5 text-white">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start sm:items-center gap-3.5">
                                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
                                    <Ticket className="w-6 h-6 text-teal-200" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h1 className="font-mono font-extrabold text-lg sm:text-2xl tracking-tight text-white">
                                            {ticketId}
                                        </h1>
                                        {ticketData?.progress_percent && (
                                            <span className="font-mono font-bold text-xs bg-amber-400/25 text-amber-200 border border-amber-300/40 px-2.5 py-0.5 rounded-full">
                                                {ticketData.progress_percent}
                                            </span>
                                        )}
                                        {ticketData?.badges?.map((badge, idx) => (
                                            <span
                                                key={idx}
                                                className="text-[11px] font-semibold bg-white/15 text-teal-50 border border-white/20 px-2.5 py-0.5 rounded-full"
                                            >
                                                {badge}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs sm:text-sm text-teal-100/90 mt-1 font-medium truncate">
                                        {ticketData?.customer_name
                                            ? `${ticketData.customer_id ? `${ticketData.customer_id} — ` : ""}${ticketData.customer_name}`
                                            : "Detail Tiket Pelanggan"}
                                    </p>
                                </div>
                            </div>

                            {/* Status & IP Pill */}
                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/15">
                                {ticketData?.ip_address && ticketData.ip_address !== "-" && (
                                    <a
                                        href={`http://${ticketData.ip_address}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-xs bg-white/15 hover:bg-white/25 text-white border border-white/20 px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1.5"
                                        title="Buka IP Address"
                                    >
                                        <Globe className="w-3.5 h-3.5 text-teal-200" />
                                        <span>{ticketData.ip_address}</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs (Info Tiket, Log Aktivitas, Input Aktivitas) */}
                    <div className="flex items-center gap-1 px-4 sm:px-6 bg-slate-50/90 border-b border-slate-200 overflow-x-auto scrollbar-none">
                        <button
                            type="button"
                            onClick={() => setActiveTab("info")}
                            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap active:scale-95 ${
                                activeTab === "info"
                                    ? "border-teal-600 text-teal-700 bg-white shadow-2xs font-extrabold"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <Ticket className="w-4 h-4" />
                            <span>Info Tiket</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("log")}
                            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap active:scale-95 ${
                                activeTab === "log"
                                    ? "border-teal-600 text-teal-700 bg-white shadow-2xs font-extrabold"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <Clock className="w-4 h-4" />
                            <span>Log Aktivitas</span>
                            {ticketData?.logs && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                                    {ticketData.logs.length}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("input")}
                            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap active:scale-95 ${
                                activeTab === "input"
                                    ? "border-teal-600 text-teal-700 bg-white shadow-2xs font-extrabold"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <FileText className="w-4 h-4" />
                            <span>Input Aktivitas</span>
                        </button>
                    </div>

                    {/* Main Content Area */}
                    <div className="p-4 sm:p-6">
                        {loading ? (
                            <div className="py-20 text-center space-y-3">
                                <RefreshCw className="w-9 h-9 animate-spin text-teal-600 mx-auto" />
                                <h3 className="text-sm font-bold text-slate-800">
                                    Mengambil data tiket #{ticketId} dari Billingnesia...
                                </h3>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                    Sedang menyinkronkan data Info Tiket dan riwayat Log Aktivitas secara live.
                                </p>
                            </div>
                        ) : error ? (
                            <div className="p-6 bg-rose-50 rounded-2xl border border-rose-200 text-center space-y-3 max-w-lg mx-auto my-8">
                                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                                <h4 className="text-sm font-bold text-rose-900">Gagal Memuat Detail Tiket</h4>
                                <p className="text-xs text-rose-700">{error}</p>
                                <button
                                    type="button"
                                    onClick={() => loadTicketDetail(false)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Coba Lagi
                                </button>
                            </div>
                        ) : !ticketData ? (
                            <div className="py-16 text-center text-slate-400 text-xs">
                                Data tiket tidak ditemukan.
                            </div>
                        ) : (
                            <>
                                {/* TAB 1: INFO TIKET */}
                                {activeTab === "info" && (
                                    <div className="space-y-5 animate-in fade-in-50">
                                        <div className="bg-slate-50/70 rounded-xl p-4 sm:p-6 border border-slate-200/80">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5 text-xs">
                                                {/* Field 1: User Pembuat */}
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                        User Pembuat
                                                    </span>
                                                    <span className="font-bold text-slate-800 text-sm">
                                                        {ticketData.creator || "-"}
                                                    </span>
                                                </div>

                                                {/* Field 2: Jenis Tiket */}
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                        Jenis Tiket
                                                    </span>
                                                    <span className="inline-block font-semibold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded border border-violet-100">
                                                        {ticketData.ticket_type || "-"}
                                                    </span>
                                                </div>

                                                {/* Field 3: Kategori Tiket */}
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                        Kategori Tiket
                                                    </span>
                                                    <span className="font-semibold text-slate-800">
                                                        {ticketData.category || "-"}
                                                    </span>
                                                </div>

                                                {/* Field 4: Pelanggan */}
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                        Pelanggan
                                                    </span>
                                                    {ticketData.customer_id ? (
                                                        <Link
                                                            href={`/dismantles/${ticketData.customer_id}`}
                                                            className="font-mono text-teal-700 hover:text-teal-900 hover:underline font-bold inline-flex items-center gap-1"
                                                            title="Buka profil pelanggan"
                                                        >
                                                            <span>{ticketData.customer_id}</span>
                                                            <ExternalLink className="w-3 h-3 text-teal-500" />
                                                        </Link>
                                                    ) : (
                                                        <span className="font-mono text-slate-600">-</span>
                                                    )}
                                                    <div className="text-slate-700 text-xs font-medium truncate mt-0.5">
                                                        {ticketData.customer_name || "-"}
                                                    </div>
                                                </div>

                                                {/* Field 5: IP Address */}
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                        IP Address
                                                    </span>
                                                    {ticketData.ip_address && ticketData.ip_address !== "-" ? (
                                                        <a
                                                            href={`http://${ticketData.ip_address}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-mono text-sky-700 hover:text-sky-900 hover:underline inline-flex items-center gap-1 font-semibold"
                                                        >
                                                            <span>{ticketData.ip_address}</span>
                                                            <ExternalLink className="w-3 h-3 text-sky-500" />
                                                        </a>
                                                    ) : (
                                                        <span className="font-mono text-slate-400">-</span>
                                                    )}
                                                </div>

                                                {/* Field 6: PJ Awal */}
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                        PJ Awal
                                                    </span>
                                                    <span className="font-semibold text-slate-800">
                                                        {ticketData.pic || "-"}
                                                    </span>
                                                </div>

                                                {/* Field 7: Tag Karyawan */}
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                        Tag Karyawan
                                                    </span>
                                                    <span className="text-slate-700">
                                                        {ticketData.tag || "—"}
                                                    </span>
                                                </div>

                                                {/* Field 8: Lampiran */}
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                        Lampiran
                                                    </span>
                                                    {ticketData.attachment &&
                                                    ticketData.attachment !== "-" &&
                                                    !ticketData.attachment.includes("Tidak ada lampiran") ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewImage(ticketData.attachment || "")}
                                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition-colors active:scale-95"
                                                        >
                                                            <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                                                            <span>Lihat Lampiran</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Tidak ada lampiran</span>
                                                    )}
                                                </div>

                                                {/* Field 9: Keterangan / Indikasi Awal (Full Width Card) */}
                                                <div className="sm:col-span-2 lg:col-span-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                                                        Keterangan / Indikasi Awal
                                                    </span>
                                                    <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                                                        {ticketData.indication || "-"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: LOG AKTIVITAS */}
                                {activeTab === "log" && (
                                    <div className="space-y-4 animate-in fade-in-50">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-teal-600" />
                                                <span>Daftar Riwayat Log Aktivitas</span>
                                            </h3>
                                            <span className="text-xs text-slate-500 font-medium">
                                                Total: <strong>{ticketData.logs?.length || 0}</strong> log
                                            </span>
                                        </div>

                                        {ticketData.logs && ticketData.logs.length > 0 ? (
                                            <>
                                                {/* Mobile Cards View (Android & iOS) */}
                                                <div className="block sm:hidden space-y-3">
                                                    {ticketData.logs.map((log, i) => (
                                                        <div
                                                            key={i}
                                                            className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5"
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                                                        #{log.no}
                                                                    </span>
                                                                    <span className="font-bold text-xs text-slate-800">
                                                                        {log.creator}
                                                                    </span>
                                                                </div>
                                                                <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                                    {log.progress}
                                                                </span>
                                                            </div>

                                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                                {log.description}
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-slate-100">
                                                                <div>
                                                                    <span className="text-slate-400 block text-[10px] font-semibold">PJ:</span>
                                                                    <span className="font-medium text-slate-700">{log.pic || "-"}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-400 block text-[10px] font-semibold">Karyawan:</span>
                                                                    <span className="font-medium text-slate-700">{log.employee || "-"}</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between pt-1">
                                                                <span className="font-mono text-[10px] text-slate-400">
                                                                    {log.log_date}
                                                                </span>
                                                                {log.attachment && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPreviewImage(log.attachment || "")}
                                                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors"
                                                                    >
                                                                        <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                                                                        <span>Lampiran Foto</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Desktop Table View */}
                                                <div className="hidden sm:block rounded-xl border border-slate-200 overflow-x-auto bg-white shadow-xs">
                                                    <table className="w-full text-left border-collapse text-xs">
                                                        <thead>
                                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                                                                <th className="py-3 px-3 text-center w-12">No</th>
                                                                <th className="py-3 px-3 min-w-[120px]">Pembuat</th>
                                                                <th className="py-3 px-3 min-w-[130px]">Tanggal Log</th>
                                                                <th className="py-3 px-4 min-w-[240px]">Keterangan</th>
                                                                <th className="py-3 px-2 text-center w-16">%</th>
                                                                <th className="py-3 px-3 text-center w-20">Lampiran</th>
                                                                <th className="py-3 px-3 min-w-[110px]">PJ</th>
                                                                <th className="py-3 px-3 min-w-[140px]">Karyawan</th>
                                                                <th className="py-3 px-3 text-center w-20">Aksi</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {ticketData.logs.map((log, i) => (
                                                                <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                                                                    <td className="py-3 px-3 text-center font-mono text-slate-400">
                                                                        {log.no}
                                                                    </td>
                                                                    <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                                                                        {log.creator}
                                                                    </td>
                                                                    <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                                                                        {log.log_date}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-slate-700 whitespace-pre-wrap leading-relaxed max-w-[280px]">
                                                                        {log.description}
                                                                    </td>
                                                                    <td className="py-3 px-2 text-center whitespace-nowrap">
                                                                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">
                                                                            {log.progress}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 px-3 text-center whitespace-nowrap">
                                                                        {log.attachment ? (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setPreviewImage(log.attachment || "")}
                                                                                className="w-7 h-7 rounded-lg bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white inline-flex items-center justify-center transition-colors border border-teal-200"
                                                                                title="Lihat Lampiran Foto"
                                                                            >
                                                                                <ImageIcon className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        ) : (
                                                                            <span className="text-slate-300 font-mono">-</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                                                                        {log.pic || "-"}
                                                                    </td>
                                                                    <td className="py-3 px-3 text-slate-600">
                                                                        {log.employee || "-"}
                                                                    </td>
                                                                    <td className="py-3 px-3 text-center whitespace-nowrap">
                                                                        <span className="text-[10px] font-mono text-slate-400">
                                                                            {log.action_id || "-"}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="p-8 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
                                                Tidak ada riwayat log aktivitas tercatat untuk tiket ini.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB 3: INPUT AKTIVITAS */}
                                {activeTab === "input" && (
                                    <div className="space-y-4 animate-in fade-in-50">
                                        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
                                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                                <div>
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                                        Input Aktivitas / Tindakan Tiket
                                                    </h3>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                        Perbarui progres penanganan dismantle / tiket ini langsung ke database.
                                                    </p>
                                                </div>
                                                {ticketData.billing_url && (
                                                    <a
                                                        href={ticketData.billing_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-teal-700 hover:underline font-semibold"
                                                    >
                                                        <span>Buka Form di Billingnesia</span>
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>

                                            {inputSuccess && (
                                                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                    <span>Aktivitas berhasil dicatat secara lokal. Silakan sinkronkan juga ke Billingnesia.</span>
                                                </div>
                                            )}

                                            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                                        Keterangan / Tindakan <span className="text-rose-500">*</span>
                                                    </label>
                                                    <textarea
                                                        rows={4}
                                                        required
                                                        value={inputKeterangan}
                                                        onChange={(e) => setInputKeterangan(e.target.value)}
                                                        placeholder="Input keterangan / detail tindakan dismantle yang dilakukan..."
                                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 focus:bg-white resize-y"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                                            Persentase Progres (%) <span className="text-rose-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                required
                                                                value={inputPercent}
                                                                onChange={(e) => setInputPercent(e.target.value)}
                                                                className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 focus:bg-white"
                                                            />
                                                            <span className="absolute right-3.5 top-2.5 font-bold text-slate-400 text-xs">
                                                                %
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                                            Lampiran Bukti (Opsional)
                                                        </label>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
                                                    <p className="text-[10px] text-slate-400">
                                                        * Aktivitas akan otomatis terhubung ke riwayat tiket Synerix & Billingnesia.
                                                    </p>
                                                    <button
                                                        type="submit"
                                                        disabled={submittingInput}
                                                        className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all active:scale-95 disabled:opacity-60"
                                                    >
                                                        {submittingInput ? (
                                                            <>
                                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                                <span>Menyimpan...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Send className="w-3.5 h-3.5" />
                                                                <span>Simpan Aktivitas</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox Image Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                    <div className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-white">
                            <span className="text-xs font-semibold flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-teal-400" />
                                Pratinjau Lampiran Foto Tiket
                            </span>
                            <div className="flex items-center gap-3">
                                <a
                                    href={previewImage}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-teal-300 hover:underline inline-flex items-center gap-1"
                                >
                                    <span>Buka Full</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setPreviewImage(null)}
                                    className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center"
                                    title="Tutup"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="p-3 flex items-center justify-center bg-black/50 overflow-auto">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={previewImage}
                                alt="Lampiran Foto Tiket"
                                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-md"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TicketDetailPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                    <div className="text-center space-y-3">
                        <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
                        <p className="text-xs text-slate-500 font-medium">Memuat halaman tiket...</p>
                    </div>
                </div>
            }
        >
            <TicketDetailContent />
        </Suspense>
    );
}

