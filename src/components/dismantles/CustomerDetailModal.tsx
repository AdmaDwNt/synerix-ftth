"use client";

import { useState } from "react";
import {
    User,
    X,
    Server,
    Ticket,
    Receipt,
    Shield,
    Calendar,
    Phone,
    MapPin,
    ExternalLink,
    Clock,
    FileText,
    CheckCircle2,
    AlertCircle,
    Info,
    Eye
} from "lucide-react";
import { getGoogleMapsUrl } from "@/lib/ftth/distance";

export interface ScrapedCustomerData {
    customer_id?: string;
    customer_name?: string;
    status_pelanggan?: string;
    badges?: string[];
    register_date?: string;
    id_card_number?: string;
    phone_number?: string;
    phone_number_2?: string;
    email?: string;
    region?: string;
    district?: string;
    village?: string;
    hamlet?: string;
    address?: string;
    marketer?: string;
    registration_note?: string;
    commitment?: string;

    // Data Instalasi
    server?: string;
    ip_address?: string;
    pppoe_username?: string;
    pppoe_password?: string;
    parent_odp?: string;
    cable_outdoor?: string;
    cable_indoor?: string;

    // Data Tiket
    ticket_id?: string;
    ticket_creator?: string;
    ticket_type?: string;
    category?: string;
    ticket_customer_summary?: string;
    ticket_indication?: string;
    ticket_pic?: string;
    ticket_tag?: string;
    ticket_attachment?: string;
    ticket_progress_percent?: string;

    // Teknis & Finansial
    latitude?: number;
    longitude?: number;
    unpaid_amount?: number;
    device_type?: string;
    billing_url?: string;
}

interface CustomerDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: ScrapedCustomerData | null;
}

type TabKey = "info_pribadi" | "layanan" | "invoice" | "tiket" | "isolir" | "log";

export default function CustomerDetailModal({
    isOpen,
    onClose,
    customer,
}: CustomerDetailModalProps) {
    const [activeTab, setActiveTab] = useState<TabKey>("info_pribadi");
    const [selectedTicketDetail, setSelectedTicketDetail] = useState<boolean>(false);

    if (!isOpen || !customer) return null;

    const custName = customer.customer_name || "Pelanggan";
    const custId = customer.customer_id || "-";
    const badges = customer.badges || [];
    const isItnOn = badges.some((b) => b.toUpperCase().includes("ITN ON"));
    const isPjkOn = badges.some((b) => b.toUpperCase().includes("PJK ON"));
    const statusText = customer.status_pelanggan || (badges.find((b) => b.includes("AKTIF")) || "PELANGGAN AKTIF");

    const mapsUrl = customer.latitude && customer.longitude
        ? getGoogleMapsUrl(customer.latitude, customer.longitude)
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
                {/* Header Modal (Sesuai Gambar 1 Billingnesia) */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg shadow-2xs shrink-0">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                                    {custName}
                                </h3>
                            </div>
                            <p className="font-mono text-xs text-slate-500 font-semibold mt-0.5">
                                #{custId}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Badges di kanan atas (Gambar 1: ITN ON, PJK OFF, PELANGGAN AKTIF) */}
                        <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
                            <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isItnOn
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300/70"
                                        : "bg-slate-100 text-slate-600 border border-slate-300/60"
                                }`}
                            >
                                • {isItnOn ? "ITN ON" : "ITN OFF"}
                            </span>
                            <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isPjkOn
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300/70"
                                        : "bg-rose-100 text-rose-800 border border-rose-300/70"
                                }`}
                            >
                                • {isPjkOn ? "PJK ON" : "PJK OFF"}
                            </span>
                            <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                    statusText.includes("AKTIF") && !statusText.includes("TIDAK")
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300/70"
                                        : "bg-slate-200 text-slate-700"
                                }`}
                            >
                                {statusText}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Tab Navigation (Sesuai Gambar 1: Info Pribadi, Layanan, Invoice, Tiket, ISOLIR, Log) */}
                <div className="flex items-center gap-1.5 pt-3 pb-2 border-b border-slate-200 overflow-x-auto text-xs font-semibold shrink-0">
                    <button
                        type="button"
                        onClick={() => setActiveTab("info_pribadi")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                            activeTab === "info_pribadi"
                                ? "bg-teal-50 text-teal-800 border border-teal-300/80 font-bold"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <User className="w-3.5 h-3.5" />
                        <span>Info Pribadi</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("layanan")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                            activeTab === "layanan"
                                ? "bg-teal-50 text-teal-800 border border-teal-300/80 font-bold"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <Server className="w-3.5 h-3.5" />
                        <span>Layanan</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("invoice")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                            activeTab === "invoice"
                                ? "bg-teal-50 text-teal-800 border border-teal-300/80 font-bold"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Invoice</span>
                        {customer.unpaid_amount && customer.unpaid_amount > 0 ? (
                            <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full font-bold">
                                1
                            </span>
                        ) : null}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("tiket")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                            activeTab === "tiket"
                                ? "bg-teal-50 text-teal-800 border border-teal-300/80 font-bold"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Tiket</span>
                        {customer.ticket_id && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-bold">
                                1
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("isolir")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                            activeTab === "isolir"
                                ? "bg-teal-50 text-teal-800 border border-teal-300/80 font-bold"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <Shield className="w-3.5 h-3.5" />
                        <span>ISOLIR</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("log")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                            activeTab === "log"
                                ? "bg-teal-50 text-teal-800 border border-teal-300/80 font-bold"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Log</span>
                    </button>
                </div>

                {/* Konten Tab Modal */}
                <div className="overflow-y-auto pr-1 flex-1 py-3 space-y-4">
                    {/* TAB 1: INFO PRIBADI (Sesuai Gambar 1: Data Pribadi & Data Instalasi) */}
                    {activeTab === "info_pribadi" && (
                        <div className="space-y-4 animate-in fade-in-50">
                            {/* Section: Data Pribadi */}
                            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
                                <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-200">
                                    <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5" />
                                    </div>
                                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                                        Data Pribadi
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3.5 gap-x-4 text-xs">
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">#ID PELANGGAN</span>
                                        <span className="font-mono font-bold text-slate-900">{customer.customer_id || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">TGL DAFTAR</span>
                                        <span className="font-mono text-slate-800">{customer.register_date || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">STATUS</span>
                                        <span className="font-bold text-emerald-700">{statusText}</span>
                                    </div>

                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">NO KTP</span>
                                        <span className="font-mono text-slate-800">{customer.id_card_number || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">NAMA PELANGGAN</span>
                                        <span className="font-bold text-slate-900">{customer.customer_name || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">NO WA 1</span>
                                        {customer.phone_number ? (
                                            <a
                                                href={`https://wa.me/${customer.phone_number.replace(/^0/, "62").replace(/\D/g, "")}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-mono text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                                            >
                                                <Phone className="w-3 h-3 text-emerald-600" />
                                                {customer.phone_number}
                                            </a>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </div>

                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">NO WA 2 / TELP</span>
                                        <span className="font-mono text-slate-800">{customer.phone_number_2 || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">EMAIL</span>
                                        <span className="text-slate-800">{customer.email || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">WILAYAH</span>
                                        <span className="text-slate-800">{customer.region || "Kabupaten Kediri"}</span>
                                    </div>

                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">KECAMATAN</span>
                                        <span className="text-slate-800">{customer.district || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">DESA</span>
                                        <span className="text-slate-800">{customer.village || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">DUSUN</span>
                                        <span className="text-slate-800">{customer.hamlet || "-"}</span>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <span className="text-[11px] font-semibold text-slate-500 block">ALAMAT LENGKAP</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="font-medium text-slate-900">{customer.address || "-"}</span>
                                            {mapsUrl && (
                                                <a
                                                    href={mapsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="Buka Sharelok Google Maps"
                                                    className="inline-flex items-center text-teal-600 hover:text-teal-800 p-1 hover:bg-teal-50 rounded"
                                                >
                                                    <MapPin className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">MARKETER</span>
                                        <span className="text-slate-800 font-semibold">{customer.marketer || "ASTERIX"}</span>
                                    </div>

                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">CATATAN DAFTAR</span>
                                        <span className="text-slate-600">{customer.registration_note || "-"}</span>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <span className="text-[11px] font-semibold text-slate-500 block">KOMITMEN</span>
                                        <span className="text-slate-600">{customer.commitment || "-"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Data Instalasi (Gambar 1) */}
                            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
                                <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-200">
                                    <div className="w-6 h-6 rounded bg-sky-100 text-sky-800 flex items-center justify-center">
                                        <Server className="w-3.5 h-3.5" />
                                    </div>
                                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                                        Data Instalasi
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3.5 gap-x-4 text-xs">
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">SERVER</span>
                                        <span className="font-bold text-slate-900 uppercase">{customer.server || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">IP ADDRESS</span>
                                        <span className="font-mono font-semibold text-sky-700">{customer.ip_address || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">USERNAME PPPOE</span>
                                        <span className="font-mono text-slate-800">{customer.pppoe_username || "-"}</span>
                                    </div>

                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">PASSWORD PPPOE</span>
                                        <span className="font-mono text-slate-800">{customer.pppoe_password || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">ODP</span>
                                        <span className="font-mono font-bold text-slate-900">{customer.parent_odp || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">KABEL OUTDOOR</span>
                                        <span className="font-mono text-slate-800">{customer.cable_outdoor || "-"}</span>
                                    </div>

                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">KABEL INDOOR</span>
                                        <span className="font-mono text-slate-800">{customer.cable_indoor || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">TIPE PERANGKAT</span>
                                        <span className="font-semibold text-teal-800">{customer.device_type || "ONT ZTE F609"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block">TITIK KOORDINAT GPS</span>
                                        <span className="font-mono text-slate-700 text-[11px]">
                                            {customer.latitude ? `${customer.latitude.toFixed(6)}, ${customer.longitude?.toFixed(6)}` : "-"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: TIKET (Sesuai Poin 8: Tabel Tiket Pelanggan) */}
                    {activeTab === "tiket" && (
                        <div className="space-y-3 animate-in fade-in-50">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                    <Ticket className="w-4 h-4 text-amber-600" />
                                    Daftar Tiket Pelanggan
                                </h4>
                                <span className="text-xs text-slate-500">
                                    Total Tiket: <strong>{customer.ticket_id ? 1 : 0}</strong>
                                </span>
                            </div>

                            {customer.ticket_id ? (
                                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                                                <th className="py-2.5 px-3">#ID</th>
                                                <th className="py-2.5 px-3">TGL DIBUAT</th>
                                                <th className="py-2.5 px-3">TINDAKAN TERAKHIR</th>
                                                <th className="py-2.5 px-2 text-center">%</th>
                                                <th className="py-2.5 px-3 text-center">STATUS</th>
                                                <th className="py-2.5 px-3 text-center">AKSI</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-sans">
                                            <tr className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3 px-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedTicketDetail(true)}
                                                        className="font-mono font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer flex items-center gap-1"
                                                    >
                                                        <span>{customer.ticket_id}</span>
                                                    </button>
                                                </td>
                                                <td className="py-3 px-3 font-mono text-slate-600">
                                                    {customer.register_date || "2026-10-01"}
                                                </td>
                                                <td className="py-3 px-3 text-slate-800">
                                                    <span className="font-medium line-clamp-1">
                                                        {customer.ticket_indication || "Dismantle total / Churn"}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 block">
                                                        PJ: {customer.ticket_pic || customer.ticket_creator || "Teknisi Lapangan"}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-center">
                                                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">
                                                        {customer.ticket_progress_percent || "100%"}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                                        {customer.category || "MAINTENANCE RETAIL"}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedTicketDetail(true)}
                                                        title="Lihat Detail Tiket"
                                                        className="p-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 cursor-pointer inline-flex items-center gap-1 font-semibold text-[11px]"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>Detail</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                                    Tidak ada riwayat tiket tercatat untuk pelanggan ini.
                                </div>
                            )}

                            {/* Sub-modal Detail Tiket (Sesuai Gambar 3 Billingnesia) */}
                            {selectedTicketDetail && (
                                <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-amber-50/70 to-orange-50/40 border border-amber-200 animate-in fade-in-50">
                                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-amber-200">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-xs uppercase tracking-wider text-amber-900">
                                                Detail Tiket #{customer.ticket_id}
                                            </span>
                                            <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                                                {customer.ticket_type || "TEKNIS"}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedTicketDetail(false)}
                                            className="text-xs text-amber-800 hover:text-amber-950 font-bold cursor-pointer"
                                        >
                                            ✕ Tutup Detail
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                        <div>
                                            <span className="text-[10px] font-semibold text-slate-500 block">USER PEMBUAT</span>
                                            <span className="font-semibold text-slate-900">{customer.ticket_creator || "-"}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-semibold text-slate-500 block">JENIS TIKET</span>
                                            <span className="font-semibold text-slate-900">{customer.ticket_type || "TEKNIS"}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-semibold text-slate-500 block">KATEGORI TIKET</span>
                                            <span className="font-bold text-teal-800">{customer.category || "MAINTENANCE RETAIL"}</span>
                                        </div>

                                        <div>
                                            <span className="text-[10px] font-semibold text-slate-500 block">IP ADDRESS</span>
                                            <span className="font-mono text-sky-700 font-semibold">{customer.ip_address || "-"}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-semibold text-slate-500 block">PJ AWAL</span>
                                            <span className="font-semibold text-slate-900">{customer.ticket_pic || customer.ticket_creator || "-"}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-semibold text-slate-500 block">TAG KARYAWAN</span>
                                            <span className="text-slate-600">{customer.ticket_tag || "-"}</span>
                                        </div>

                                        <div className="sm:col-span-3 bg-white p-3 rounded-lg border border-amber-200/80">
                                            <span className="text-[10px] font-bold text-slate-500 block uppercase">
                                                Keterangan / Indikasi Awal:
                                            </span>
                                            <p className="font-medium text-slate-800 mt-0.5 whitespace-pre-wrap">
                                                {customer.ticket_indication || "down / penarikan perangkat"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB INVOICE */}
                    {activeTab === "invoice" && (
                        <div className="space-y-3 animate-in fade-in-50">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
                                    <Receipt className="w-4 h-4 text-rose-600" />
                                    Informasi Tagihan & Tunggakan
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                                        <span className="text-slate-500 block text-[11px]">Total Tagihan Tertunggak:</span>
                                        <span className="font-extrabold text-base text-rose-600 font-mono block mt-1">
                                            Rp {(customer.unpaid_amount || 0).toLocaleString("id-ID")}
                                        </span>
                                        <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            (customer.unpaid_amount || 0) > 0
                                                ? "bg-rose-100 text-rose-800"
                                                : "bg-emerald-100 text-emerald-800"
                                        }`}>
                                            {(customer.unpaid_amount || 0) > 0 ? "Jatuh Tempo (Tertunggak)" : "Lunas / Tidak Ada Tunggakan"}
                                        </span>
                                    </div>

                                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                                        <span className="text-slate-500 block text-[11px]">Status Pembayaran Billingnesia:</span>
                                        <p className="text-slate-700 text-xs mt-1">
                                            {(customer.unpaid_amount || 0) > 0
                                                ? "Wajib divalidasi ke pelanggan saat proses dismantle penarikan perangkat."
                                                : "Pelanggan tidak memiliki tagihan aktif saat ini."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB LAYANAN, ISOLIR, LOG (Placeholder Ringkas) */}
                    {(activeTab === "layanan" || activeTab === "isolir" || activeTab === "log") && (
                        <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-200">
                            <Info className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                            <span>Informasi {activeTab.toUpperCase()} terintegrasi langsung dengan Billingnesia.</span>
                        </div>
                    )}
                </div>

                {/* Footer Modal */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
                    {mapsUrl ? (
                        <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline"
                        >
                            <MapPin className="w-4 h-4 text-teal-600" />
                            <span>Buka Lokasi di Google Maps</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                    ) : (
                        <div />
                    )}

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl cursor-pointer transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
