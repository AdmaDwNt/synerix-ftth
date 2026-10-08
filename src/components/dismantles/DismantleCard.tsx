"use client";

import { useState, useRef, useEffect } from "react";
import { DismantleTask } from "@/lib/types/dismantle";
import { formatDistance, getGoogleMapsUrl, getWazeUrl } from "@/lib/ftth/distance";
import {
    MoreVertical,
    Pencil,
    Trash2,
    RefreshCw,
    ExternalLink,
    Phone,
    Navigation,
    CheckCircle2,
    Clock,
    XCircle,
    AlertTriangle,
    Receipt,
    Ticket,
    Zap
} from "lucide-react";

interface DismantleCardProps {
    task: DismantleTask;
    onOpenStatusModal: (task: DismantleTask) => void;
    onOpenEditModal: (task: DismantleTask) => void;
    onDeleteTask: (task: DismantleTask) => void;
    onOpenCustomerDetail?: (task: DismantleTask) => void;
}

export default function DismantleCard({
    task,
    onOpenStatusModal,
    onOpenEditModal,
    onDeleteTask,
    onOpenCustomerDetail,
}: DismantleCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Tutup menu dropdown saat klik di luar
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isCompleted = task.status === "COMPLETED";
    const isInProgress = task.status === "IN_PROGRESS";
    const isFailed = task.status === "FAILED";

    // Warna border accent kiri & dot sesuai gambar referensi user
    const accentBorderClass = isCompleted
        ? "border-l-emerald-600"
        : isInProgress
        ? "border-l-blue-600"
        : isFailed
        ? "border-l-slate-400"
        : "border-l-amber-500";

    const dotColorClass = isCompleted
        ? "text-emerald-600"
        : isInProgress
        ? "text-blue-600"
        : isFailed
        ? "text-slate-400"
        : "text-amber-500";

    // Inisial avatar teknisi / nama pelanggan
    const nameForAvatar = task.technician_name || task.customer_name || "Teknisi";
    const initials = nameForAvatar
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    // Format waktu
    const formattedTime = task.completed_at
        ? new Date(task.completed_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        : task.created_at
        ? new Date(task.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        : "Baru";

    return (
        <div
            className={`p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition-all border-l-[6px] ${accentBorderClass} flex flex-col justify-between relative`}
        >
            <div>
                {/* Row 1: Dot + Customer ID + Ticket ID + Category Badge + Auto Ingest Badge + Status Badge */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-base leading-none ${dotColorClass}`}>●</span>
                        <button
                            type="button"
                            onClick={() => onOpenCustomerDetail?.(task)}
                            className="font-bold text-xs sm:text-sm text-teal-800 hover:text-teal-950 hover:underline tracking-tight font-mono cursor-pointer"
                            title="Buka Detail Pelanggan"
                        >
                            #{task.customer_id}
                        </button>
                        {task.ticket_id && (
                            <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200/90 flex items-center gap-1"
                                title={`Nomor Tiket: ${task.ticket_id}`}
                            >
                                <Ticket className="w-3 h-3 text-amber-700" />
                                {task.ticket_id}
                            </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-800 border border-emerald-100">
                            {task.cluster_name || "CLUSTER"}
                        </span>
                        {task.auto_ingested && (
                            <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-cyan-50 text-cyan-800 border border-cyan-200 flex items-center gap-0.5"
                                title="Data di-input otomatis via Bookmarklet HP"
                            >
                                <Zap className="w-2.5 h-2.5 text-cyan-600" />
                                Auto
                            </span>
                        )}
                    </div>

                    {/* Status Pill Kanan */}
                    <div className="shrink-0">
                        {isCompleted && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/80 text-emerald-800">
                                Selesai
                            </span>
                        )}
                        {isInProgress && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                Menuju Lokasi
                            </span>
                        )}
                        {isFailed && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                                Gagal
                            </span>
                        )}
                        {!isCompleted && !isInProgress && !isFailed && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                                Antrean
                            </span>
                        )}
                    </div>
                </div>

                {/* Row 2: Title (Customer Name) */}
                <h3
                    onClick={() => onOpenCustomerDetail?.(task)}
                    className="font-extrabold text-sm sm:text-base text-slate-900 mt-2 tracking-tight uppercase leading-snug cursor-pointer hover:text-teal-700 transition-colors"
                    title="Buka Detail Pelanggan"
                >
                    {task.customer_name}
                </h3>

                {/* Row 3: Subtitle Segmen / ODP (Warna Hijau/Teal sesuai gambar) */}
                <div className="text-xs font-semibold text-emerald-700 mt-1 flex items-center gap-1 flex-wrap">
                    <span>{task.parent_odp_name ? `ODP: ${task.parent_odp_name}` : "Titik Pelanggan"}</span>
                    {task.distance_meters !== undefined && (
                        <>
                            <span>•</span>
                            <span className="text-teal-800 font-bold">
                                {formatDistance(task.distance_meters)} dari Anda
                            </span>
                        </>
                    )}
                </div>

                {/* Alert Tagihan Jatuh Tempo (Jika ada tunggakan) */}
                {task.unpaid_amount !== undefined && Number(task.unpaid_amount) > 0 && (
                    <div className="mt-2.5 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200/90 flex items-center justify-between shadow-2xs">
                        <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            Tunggakan Tagihan:
                        </span>
                        <span className="text-xs font-black text-rose-700 tracking-tight font-mono">
                            Rp {Number(task.unpaid_amount).toLocaleString("id-ID")}
                        </span>
                    </div>
                )}

                {/* Row 4: Description (Alamat / Perangkat / Catatan) */}
                <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-2">
                    {task.address}
                </p>

                {/* Info Perangkat & SN jika selesai */}
                <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                        {task.device_type}
                    </span>
                    {task.serial_number && (
                        <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                            SN: {task.serial_number}
                        </span>
                    )}
                    {task.failure_reason && (
                        <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded italic">
                            Kendala: {task.failure_reason}
                        </span>
                    )}
                    {task.billing_url && (
                        <a
                            href={task.billing_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded transition-colors"
                            title="Buka Halaman Tiket Billingnesia"
                        >
                            <Receipt className="w-3 h-3" />
                            <span>Billingnesia</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                    )}
                </div>
            </div>

            {/* Row 5: Footer (Avatar Inisial + Nama Teknisi + Titik Tiga Menu CRUD) */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                {/* Avatar Bulat + Nama */}
                <div className="flex items-center gap-2.5">
                    <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold shadow-2xs ${
                            isCompleted
                                ? "bg-emerald-600 text-white"
                                : isInProgress
                                ? "bg-blue-600 text-white"
                                : "bg-slate-200 text-slate-700"
                        }`}
                    >
                        {initials}
                    </div>
                    <span className="text-xs font-medium text-slate-700 truncate max-w-[160px] sm:max-w-[200px]">
                        {task.technician_name || "Teknisi"} <span className="text-slate-400">• {formattedTime}</span>
                    </span>
                </div>

                {/* Tombol Titik Tiga ⋮ dengan Menu Dropdown CRUD */}
                <div className="relative" ref={menuRef}>
                    <button
                        type="button"
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-95"
                        title="Opsi Tugas"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 bottom-full mb-1 w-44 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-30 animate-in fade-in zoom-in-95 text-xs">
                            {/* Ubah Status */}
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    onOpenStatusModal(task);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold"
                            >
                                <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                                <span>Ubah Status</span>
                            </button>

                            {/* Edit Data */}
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    onOpenEditModal(task);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold"
                            >
                                <Pencil className="w-3.5 h-3.5 text-blue-600" />
                                <span>Edit Tiket</span>
                            </button>

                            {/* Buka Billingnesia */}
                            {task.billing_url && (
                                <a
                                    href={task.billing_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setMenuOpen(false)}
                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-indigo-700 font-semibold"
                                >
                                    <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Buka Billingnesia</span>
                                </a>
                            )}

                            {/* Navigasi Maps */}
                            <a
                                href={getGoogleMapsUrl(task.latitude, task.longitude)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setMenuOpen(false)}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                            >
                                <Navigation className="w-3.5 h-3.5 text-blue-500" />
                                <span>Google Maps</span>
                            </a>

                            {/* Navigasi Waze */}
                            <a
                                href={getWazeUrl(task.latitude, task.longitude)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setMenuOpen(false)}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                            >
                                <ExternalLink className="w-3.5 h-3.5 text-cyan-600" />
                                <span>Waze</span>
                            </a>

                            {/* Hubungi Pelanggan WA */}
                            {task.phone_number && (
                                <a
                                    href={`https://wa.me/${task.phone_number.replace(/^0/, "62").replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setMenuOpen(false)}
                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-emerald-700 font-semibold"
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>Chat WhatsApp</span>
                                </a>
                            )}

                            <div className="my-1 border-t border-slate-100" />

                            {/* Hapus Tiket */}
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    onDeleteTask(task);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 font-bold"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus Tugas</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
