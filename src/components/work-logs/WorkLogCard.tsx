"use client";

import { useState, useRef, useEffect } from "react";
import { WorkLogItem } from "./EditWorkLogModal";
import {
    MoreVertical,
    Pencil,
    Trash2,
    Navigation,
    ExternalLink,
    Zap,
    MapPin
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

    // Warna border accent kiri sesuai gambar referensi pengguna
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

    // Generate formatted ticket code
    const ticketCode = `TKT${log.id.replace(/-/g, "").slice(0, 14).toUpperCase()}`;

    // Nama & inisial avatar
    const authorName = "Fariellio Andreano"; // Teknisi pelaksana
    const initials = authorName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    // Format waktu
    const formattedTime = new Date(log.created_at).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div
            className={`p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition-all border-l-[6px] ${accentBorderClass} flex flex-col justify-between relative`}
        >
            <div>
                {/* Row 1: Dot + Ticket ID + Category Badge + Status Badge (Kanan) */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-base leading-none ${dotColorClass}`}>●</span>
                        <span className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight font-mono">
                            {ticketCode}
                        </span>
                        <span
                            className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold tracking-wide uppercase border ${
                                isProject
                                    ? "bg-blue-50 text-blue-800 border-blue-100"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-100"
                            }`}
                        >
                            {log.category.replace("_", " ")}
                        </span>
                    </div>

                    {/* Status Badges di Pojok Kanan */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        {isDone ? (
                            <>
                                <span className="text-[10px] font-semibold text-emerald-800">Normal</span>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    Selesai
                                </span>
                            </>
                        ) : log.status === "IN_PROGRESS" ? (
                            <>
                                <span className="text-[10px] font-semibold text-blue-800">Progress</span>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                    Dikerjakan
                                </span>
                            </>
                        ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                                {log.status}
                            </span>
                        )}
                    </div>
                </div>

                {/* Row 2: Title (Nama Pekerjaan / Case) */}
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 mt-2 tracking-tight uppercase leading-snug">
                    {log.title}
                </h3>

                {/* Row 3: Subtitle / Segmen (Warna Hijau/Biru sesuai gambar) */}
                <div
                    className={`text-xs font-semibold mt-1 flex items-center gap-2 flex-wrap ${
                        isProject ? "text-blue-700" : "text-emerald-700"
                    }`}
                >
                    <span>
                        {log.optical_power_in !== null || log.optical_power_out !== null
                            ? `Redaman ODP: ${log.optical_power_in ?? "-"} dBm • Home: ${log.optical_power_out ?? "-"} dBm`
                            : "Titik Jaringan FTTH"}
                    </span>
                </div>

                {/* Row 4: Description (Case & Solusi) */}
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
                    {log.case_description}
                </p>

                {log.resolution && (
                    <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-150 text-[11px] text-slate-700">
                        <span className="font-bold text-emerald-800">Solusi:</span> {log.resolution}
                    </div>
                )}
            </div>

            {/* Row 5: Footer (Avatar Inisial + Nama Teknisi + Titik Tiga Menu CRUD) */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                {/* Avatar Bulat + Nama */}
                <div className="flex items-center gap-2.5">
                    <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold shadow-2xs ${
                            isProject
                                ? "bg-blue-600 text-white"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                    >
                        {initials}
                    </div>
                    <span className="text-xs font-medium text-slate-700 truncate max-w-[160px] sm:max-w-[200px]">
                        {authorName} <span className="text-slate-400">• {formattedTime}</span>
                    </span>
                </div>

                {/* Titik Tiga Menu Dropdown */}
                <div className="relative" ref={menuRef}>
                    <button
                        type="button"
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-95"
                        title="Opsi Pekerjaan"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 bottom-full mb-1 w-44 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-30 animate-in fade-in zoom-in-95 text-xs">
                            {/* Edit */}
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    onOpenEditModal(log);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold"
                            >
                                <Pencil className="w-3.5 h-3.5 text-blue-600" />
                                <span>Edit Pekerjaan</span>
                            </button>

                            {/* Buka Lokasi GPS jika ada */}
                            {log.latitude && log.longitude && (
                                <a
                                    href={`https://maps.google.com/?q=${log.latitude},${log.longitude}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setMenuOpen(false)}
                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                                >
                                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                                    <span>Buka Koordinat</span>
                                </a>
                            )}

                            <div className="my-1 border-t border-slate-100" />

                            {/* Hapus */}
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    onDeleteLog(log);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 font-bold"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus Pekerjaan</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
