"use client";

import React from "react";
import { DismantleTask } from "@/lib/types/dismantle";
import { getGoogleMapsUrl } from "@/lib/ftth/distance";
import {
    Eye,
    MapPin,
    Trash2,
    RefreshCw,
    Phone,
    ExternalLink,
    Clock
} from "lucide-react";

interface DismantleTableProps {
    tasks: DismantleTask[];
    startIndex: number;
    onOpenStatusModal: (task: DismantleTask) => void;
    onOpenEditModal?: (task: DismantleTask) => void;
    onDeleteTask: (task: DismantleTask) => void;
    onOpenCustomerDetail: (task: DismantleTask) => void;
}

export default function DismantleTable({
    tasks,
    startIndex,
    onOpenStatusModal,
    onDeleteTask,
    onOpenCustomerDetail,
}: DismantleTableProps) {
    if (tasks.length === 0) {
        return null;
    }

    return (
        <div className="w-full rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        {/* Header Tabel Sesuai Poin 6 di pengembangan.md */}
                        <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                            <th className="py-3 px-3 w-[12%]">#ID</th>
                            <th className="py-3 px-3 w-[18%]">NAMA PELANGGAN</th>
                            <th className="py-3 px-3 w-[14%]">DESA / DUSUN</th>
                            <th className="py-3 px-3 w-[12%]">NO WA</th>
                            <th className="py-3 px-3 w-[12%]">TGL DAFTAR</th>
                            <th className="py-3 px-2 text-center w-[10%]">STATUS</th>
                            <th className="py-3 px-2 text-center w-[6%]">ITN</th>
                            <th className="py-3 px-2 text-center w-[6%]">PJK</th>
                            <th className="py-3 px-3 text-center w-[10%]">AKSI</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                        {tasks.map((task, idx) => {
                            // Ekstrak metadata scraping jika tersimpan di accessories
                            let metadata: any = {};
                            const metaStr = task.accessories?.find((a) => a.startsWith("METADATA:"));
                            if (metaStr) {
                                try {
                                    metadata = JSON.parse(metaStr.replace("METADATA:", ""));
                                } catch (e) {
                                    metadata = {};
                                }
                            }

                            // Tgl Daftar
                            const tglDaftar = metadata.register_date || (task.created_at
                                ? new Date(task.created_at).toISOString().split("T")[0]
                                : "-");

                            // Desa / Dusun
                            const desaDusun = [
                                metadata.village || task.cluster_name,
                                metadata.hamlet,
                            ].filter(Boolean).join(" - ") || task.cluster_name || "-";

                            // Badges ITN & PJK
                            const badges: string[] = metadata.badges || [];
                            const isItnOn = badges.some((b) => b.toUpperCase().includes("ITN ON"));
                            const isPjkOn = badges.some((b) => b.toUpperCase().includes("PJK ON"));

                            // Status Pelanggan
                            const custStatus = metadata.status_pelanggan || (task.status === "COMPLETED" ? "SELESAI CABUT" : "PELANGGAN AKTIF");

                            // Link Sharelok Maps
                            const mapsUrl = getGoogleMapsUrl(task.latitude, task.longitude);

                            return (
                                <tr
                                    key={task.id}
                                    className="hover:bg-teal-50/30 transition-colors group"
                                >
                                    {/* 1. #ID (Berupa link yang membuka detail pelanggan) */}
                                    <td className="py-3 px-3">
                                        <button
                                            type="button"
                                            onClick={() => onOpenCustomerDetail(task)}
                                            className="font-mono font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer flex items-center gap-1 group-hover:text-teal-800"
                                            title="Klik untuk membuka Detail Pelanggan"
                                        >
                                            <span>#{task.customer_id}</span>
                                        </button>
                                        {task.ticket_id && (
                                            <span className="font-mono text-[10px] text-amber-800 bg-amber-50 px-1 rounded block mt-0.5 w-fit">
                                                {task.ticket_id}
                                            </span>
                                        )}
                                    </td>

                                    {/* 2. NAMA PELANGGAN */}
                                    <td className="py-3 px-3">
                                        <div
                                            onClick={() => onOpenCustomerDetail(task)}
                                            className="font-bold text-slate-900 hover:text-teal-700 cursor-pointer line-clamp-1"
                                            title={task.customer_name}
                                        >
                                            {task.customer_name}
                                        </div>
                                        <span className="text-[10px] text-slate-400 line-clamp-1 block">
                                            {task.address}
                                        </span>
                                    </td>

                                    {/* 3. DESA / DUSUN */}
                                    <td className="py-3 px-3 text-slate-700 font-medium">
                                        <span className="line-clamp-1" title={desaDusun}>
                                            {desaDusun}
                                        </span>
                                    </td>

                                    {/* 4. NO WA */}
                                    <td className="py-3 px-3">
                                        {task.phone_number ? (
                                            <a
                                                href={`https://wa.me/${task.phone_number.replace(/^0/, "62").replace(/\D/g, "")}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-mono font-medium text-emerald-700 hover:underline inline-flex items-center gap-1"
                                                title="Chat via WhatsApp"
                                            >
                                                <Phone className="w-3 h-3 text-emerald-600" />
                                                <span>{task.phone_number}</span>
                                            </a>
                                        ) : (
                                            <span className="text-slate-400 font-mono">-</span>
                                        )}
                                    </td>

                                    {/* 5. TGL DAFTAR */}
                                    <td className="py-3 px-3 font-mono text-slate-600">
                                        {tglDaftar}
                                    </td>

                                    {/* 6. STATUS */}
                                    <td className="py-3 px-2 text-center">
                                        <span
                                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                task.status === "COMPLETED"
                                                    ? "bg-slate-100 text-slate-700 border border-slate-300"
                                                    : custStatus.includes("AKTIF") && !custStatus.includes("TIDAK")
                                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                                    : "bg-rose-100 text-rose-800 border border-rose-300"
                                            }`}
                                        >
                                            {task.status === "COMPLETED" ? "DICABUT" : custStatus}
                                        </span>
                                    </td>

                                    {/* 7. ITN */}
                                    <td className="py-3 px-2 text-center">
                                        <span
                                            className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                                isItnOn
                                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                                            }`}
                                        >
                                            {isItnOn ? "ON" : "OFF"}
                                        </span>
                                    </td>

                                    {/* 8. PJK */}
                                    <td className="py-3 px-2 text-center">
                                        <span
                                            className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                                isPjkOn
                                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                                    : "bg-rose-100 text-rose-800 border border-rose-200"
                                            }`}
                                        >
                                            {isPjkOn ? "ON" : "OFF"}
                                        </span>
                                    </td>

                                    {/* 9. AKSI (Ikon Mata + Ikon Lokasi Sharelok + Status + Hapus) */}
                                    <td className="py-3 px-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            {/* Ikon Mata: Buka Detail Pelanggan */}
                                            <button
                                                type="button"
                                                onClick={() => onOpenCustomerDetail(task)}
                                                title="Lihat Detail Pelanggan & Tiket"
                                                className="p-1.5 rounded-lg text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>

                                            {/* Ikon Lokasi: Buka Sharelok Scraping Google Maps */}
                                            <a
                                                href={mapsUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Buka Sharelok Lokasi di Google Maps"
                                                className="p-1.5 rounded-lg text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors inline-flex items-center"
                                            >
                                                <MapPin className="w-3.5 h-3.5" />
                                            </a>

                                            {/* Ikon Status Dismantle */}
                                            <button
                                                type="button"
                                                onClick={() => onOpenStatusModal(task)}
                                                title={`Ubah Status Tugas (Saat ini: ${task.status})`}
                                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                    task.status === "COMPLETED"
                                                        ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                                        : task.status === "IN_PROGRESS"
                                                        ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                                                        : "text-slate-600 bg-slate-100 hover:bg-slate-200"
                                                }`}
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                            </button>

                                            {/* Ikon Hapus */}
                                            <button
                                                type="button"
                                                onClick={() => onDeleteTask(task)}
                                                title="Hapus Tugas Dismantle"
                                                className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
