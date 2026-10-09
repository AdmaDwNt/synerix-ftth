"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { WorkLogItem } from "./EditWorkLogModal";
import { parseWorkLogRow } from "@/lib/utils/workLogHelper";
import { getGoogleMapsUrl } from "@/lib/ftth/distance";
import {
    MoreVertical,
    Pencil,
    Trash2,
    ExternalLink,
    MapPin,
    Eye,
    Ticket
} from "lucide-react";

interface WorkLogCardProps {
    log: WorkLogItem;
    onOpenEditModal: (log: WorkLogItem) => void;
    onDeleteLog: (log: WorkLogItem) => void;
}

export default function WorkLogCard({
    log,
    onOpenEditModal,
    onDeleteLog,
}: WorkLogCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const parsed = parseWorkLogRow(log);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isProject = log.category === "PROJECT";
    const isMaintenanceNetwork = log.category === "MAINTENANCE_NETWORK";
    const isDone = log.status === "DONE";

    // Warna border accent kiri sesuai kategori
    const accentBorderClass = isProject
        ? "border-l-blue-600"
        : isMaintenanceNetwork || isDone
        ? "border-l-emerald-600"
        : "border-l-teal-600";

    const dotColorClass = isProject
        ? "text-blue-600"
        : isMaintenanceNetwork || isDone
        ? "text-emerald-600"
        : "text-teal-600";

    // URL detail tiket
    const ticketDetailUrl = `/dismantles/tickets/${encodeURIComponent(parsed.ticket_id)}${
        parsed.customer_id ? `?customer_id=${encodeURIComponent(parsed.customer_id)}` : ""
    }`;

    // URL detail pelanggan lengkap hasil scraping
    const customerDetailUrl = parsed.customer_id
        ? `/customers/${encodeURIComponent(parsed.customer_id)}`
        : `/work-logs?q=${encodeURIComponent(parsed.customer_name)}`;

    // Nama & inisial avatar
    const authorName = parsed.pic;
    const initials = authorName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    // Maps URL
    const mapsUrl =
        log.latitude && log.longitude
            ? getGoogleMapsUrl(log.latitude, log.longitude)
            : null;

    return (
        <div
            className={`p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition-all border-l-[6px] ${accentBorderClass} flex flex-col justify-between relative`}
        >
            <div>
                {/* Row 1: Dot + Ticket ID (Link) + Category Badge + % Progress */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-base leading-none ${dotColorClass}`}>●</span>
                        <Link
                            href={ticketDetailUrl}
                            className="font-bold text-xs sm:text-sm text-slate-800 hover:text-teal-600 hover:underline tracking-tight font-mono transition-colors"
                            title={`Lihat Detail Tiket #${parsed.ticket_id}`}
                        >
                            {parsed.ticket_id}
                        </Link>
                        <span
                            className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold tracking-wide uppercase border ${
                                isProject
                                    ? "bg-blue-50 text-blue-800 border-blue-100"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-100"
                            }`}
                        >
                            {parsed.category_label}
                        </span>
                    </div>

                    {/* Progress Badge */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono border ${parsed.progress_color.text} ${parsed.progress_color.bg} ${parsed.progress_color.border}`}
                        >
                            {parsed.progress_percent}
                        </span>
                    </div>
                </div>

                {/* Row 2: Title (Nama Pelanggan / Case) */}
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 mt-2 tracking-tight uppercase leading-snug">
                    {parsed.clean_title}
                </h3>

                {/* Row 3: Subtitle / Redaman */}
                <div className="text-xs font-semibold mt-1 flex items-center gap-2 flex-wrap text-emerald-700">
                    <span>
                        {log.optical_power_in !== null || log.optical_power_out !== null
                            ? `Redaman ODP: ${log.optical_power_in ?? "-"} dBm • Home: ${log.optical_power_out ?? "-"} dBm`
                            : "Titik Jaringan FTTH"}
                    </span>
                    {parsed.ticket_type && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-teal-50 border border-teal-200 text-teal-800 rounded font-bold">
                            {parsed.ticket_type}
                        </span>
                    )}
                </div>

                {/* Row 4: Description (Alamat & Detail) */}
                {parsed.clean_description && (
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
                        {parsed.clean_description}
                    </p>
                )}

                {/* Tindakan Terakhir */}
                {parsed.last_action_text && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-150 text-[11px] text-slate-700">
                        <div className="font-mono text-[10px] text-emerald-700 font-bold mb-0.5">
                            {parsed.last_action_date} [{parsed.last_action_pic}]
                        </div>
                        <div className="text-slate-600 line-clamp-2">
                            {parsed.last_action_text}
                        </div>
                    </div>
                )}
            </div>

            {/* Row 5: Footer (Avatar Inisial + Nama Teknisi + Action Buttons) */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {/* Avatar Bulat + Nama */}
                <div className="flex items-center gap-2 min-w-0">
                    <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 shadow-2xs ${
                            isProject
                                ? "bg-blue-600 text-white"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                    >
                        {initials}
                    </div>
                    <span className="text-xs font-medium text-slate-700 truncate">
                        {authorName}
                    </span>
                </div>

                {/* Action Buttons: Mata (Detail Pelanggan) + Tiket + Menu Opsi */}
                <div className="flex items-center gap-1 shrink-0">
                    {/* Tombol Mata (Lihat Pelanggan) */}
                    <Link
                        href={customerDetailUrl}
                        className="p-1.5 rounded-lg text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors flex items-center gap-1 text-[11px] font-bold"
                        title="Lihat Detail Pelanggan"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">Pelanggan</span>
                    </Link>

                    {/* Titik Tiga Menu Dropdown */}
                    <div className="relative" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                            title="Opsi Pekerjaan"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 bottom-full mb-1 w-44 rounded-xl bg-white border border-slate-200 shadow-xl z-20 py-1 text-xs">
                                <Link
                                    href={ticketDetailUrl}
                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                                >
                                    <Ticket className="w-3.5 h-3.5 text-teal-600" />
                                    <span>Detail Tiket</span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onOpenEditModal(log);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                                >
                                    <Pencil className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Edit Catatan</span>
                                </button>

                                {mapsUrl && (
                                    <a
                                        href={mapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Buka Maps</span>
                                    </a>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onDeleteLog(log);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-medium"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Hapus Catatan</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
