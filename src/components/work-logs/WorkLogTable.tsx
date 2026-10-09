"use client";

import React from "react";
import Link from "next/link";
import { WorkLogItem } from "./EditWorkLogModal";
import { getGoogleMapsUrl } from "@/lib/ftth/distance";
import { parseWorkLogRow } from "@/lib/utils/workLogHelper";
import {
    Pencil,
    Trash2,
    ExternalLink,
    Eye
} from "lucide-react";

interface WorkLogTableProps {
    logs: WorkLogItem[];
    startIndex: number;
    onOpenEditModal: (log: WorkLogItem) => void;
    onDeleteLog: (log: WorkLogItem) => void;
}

export default function WorkLogTable({
    logs,
    startIndex,
    onOpenEditModal,
    onDeleteLog,
}: WorkLogTableProps) {
    if (logs.length === 0) {
        return null;
    }

    return (
        <div className="w-full rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
            <table className="w-full table-fixed text-left border-collapse text-xs">
                <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-2.5 px-1.5 text-center w-[3%]">NO</th>
                        <th className="py-2.5 px-1.5 w-[11%]"># ID</th>
                        <th className="py-2.5 px-1.5 w-[10%]">TGL PEMBUATAN</th>
                        <th className="py-2.5 px-1 text-center w-[6%]">JENIS</th>
                        <th className="py-2.5 px-1.5 w-[11%]">KATEGORI</th>
                        <th className="py-2.5 px-1.5 w-[22%]">JUDUL</th>
                        <th className="py-2.5 px-1.5 w-[10%]">PJ TERAKHIR</th>
                        <th className="py-2.5 px-1.5 w-[15%]">TINDAKAN TERAKHIR</th>
                        <th className="py-2.5 px-1 text-center w-[5%]">%</th>
                        <th className="py-2.5 px-1 text-center w-[7%]">AKSI</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {logs.map((log, idx) => {
                        const rowNumber = startIndex + idx;
                        const parsed = parseWorkLogRow(log);

                        const isProject = log.category === "PROJECT";
                        const isDone = log.status === "DONE";
                        const isPending = log.status === "PENDING";

                        // Status dot color
                        const dotColor = isDone
                            ? "text-emerald-500"
                            : isPending
                            ? "text-amber-500"
                            : isProject
                            ? "text-blue-500"
                            : "text-rose-500";

                        // Category styling
                        const isDismantle = log.category === "DISMANTLE" || parsed.category_label.toUpperCase().includes("DISMANTLE");
                        const categoryBadgeClass = isDismantle
                            ? "bg-slate-100 text-slate-800 border-slate-300"
                            : isProject
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200";

                        // URL link detail tiket
                        const ticketDetailUrl = `/dismantles/tickets/${encodeURIComponent(parsed.ticket_id)}${
                            parsed.customer_id ? `?customer_id=${encodeURIComponent(parsed.customer_id)}` : ""
                        }`;

                        // URL link detail pelanggan lengkap dari hasil scraping
                        const customerDetailUrl = parsed.customer_id
                            ? `/customers/${encodeURIComponent(parsed.customer_id)}`
                            : `/work-logs?q=${encodeURIComponent(parsed.customer_name)}`;

                        // Maps URL
                        const mapsUrl =
                            log.latitude && log.longitude
                                ? getGoogleMapsUrl(log.latitude, log.longitude)
                                : null;

                        return (
                            <tr
                                key={log.id}
                                className="hover:bg-teal-50/20 transition-colors group"
                            >
                                {/* 1. NO */}
                                <td className="py-2.5 px-1.5 text-center text-slate-500 font-semibold overflow-hidden truncate">
                                    {rowNumber}
                                </td>

                                {/* 2. # ID (Klik nomor tiket -> lihat detail tiket) */}
                                <td className="py-2.5 px-1.5 overflow-hidden">
                                    <div className="flex items-center gap-1 min-w-0" title={`Buka Detail Tiket #${parsed.ticket_id}`}>
                                        <span className={`text-base leading-none shrink-0 ${dotColor}`}>●</span>
                                        <Link
                                            href={ticketDetailUrl}
                                            className="font-mono font-bold text-slate-800 hover:text-teal-600 hover:underline tracking-tight text-xs truncate transition-colors cursor-pointer"
                                        >
                                            {parsed.ticket_id}
                                        </Link>
                                    </div>
                                </td>

                                {/* 3. TGL PEMBUATAN */}
                                <td className="py-2.5 px-1.5 font-mono text-[11px] text-slate-600 overflow-hidden truncate" title={parsed.created_at_display}>
                                    {parsed.created_at_display}
                                </td>

                                {/* 4. JENIS */}
                                <td className="py-2.5 px-1 text-center overflow-hidden">
                                    <span className="inline-block px-1 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-teal-50 text-teal-800 border border-teal-200">
                                        {parsed.ticket_type}
                                    </span>
                                </td>

                                {/* 5. KATEGORI */}
                                <td className="py-2.5 px-1.5 overflow-hidden" title={parsed.category_label}>
                                    <span
                                        className={`block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border truncate ${categoryBadgeClass}`}
                                    >
                                        {parsed.category_label}
                                    </span>
                                </td>

                                {/* 6. JUDUL */}
                                <td className="py-2.5 px-1.5 overflow-hidden">
                                    <div className="font-bold text-slate-800 text-xs truncate" title={parsed.title_header}>
                                        {parsed.title_header}
                                    </div>
                                    <div
                                        className="text-teal-700 font-medium text-[11px] truncate"
                                        title={parsed.customer_display}
                                    >
                                        {parsed.customer_display || "-"}
                                    </div>
                                </td>

                                {/* 7. PJ TERAKHIR */}
                                <td className="py-2.5 px-1.5 font-medium text-slate-700 overflow-hidden truncate" title={parsed.pic}>
                                    {parsed.pic}
                                </td>

                                {/* 8. TINDAKAN TERAKHIR */}
                                <td className="py-2.5 px-1.5 text-[11px] overflow-hidden">
                                    <div
                                        className="text-emerald-700 font-semibold font-mono truncate"
                                        title={`${parsed.last_action_date} [${parsed.last_action_pic}]`}
                                    >
                                        {parsed.last_action_date}{" "}
                                        <span className="text-slate-700 font-sans font-bold">
                                            [{parsed.last_action_pic}]
                                        </span>
                                    </div>
                                    <div
                                        className="text-slate-600 truncate"
                                        title={parsed.last_action_text}
                                    >
                                        {parsed.last_action_text}
                                    </div>
                                </td>

                                {/* 9. % */}
                                <td className="py-2.5 px-1 text-center overflow-hidden">
                                    <span
                                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black border font-mono ${parsed.progress_color.text} ${parsed.progress_color.bg} ${parsed.progress_color.border}`}
                                    >
                                        {parsed.progress_percent}
                                    </span>
                                    {(log.optical_power_in !== null || log.optical_power_out !== null) && (
                                        <div className="text-[9px] font-mono text-slate-500 font-semibold truncate">
                                            {log.optical_power_out || log.optical_power_in}dB
                                        </div>
                                    )}
                                </td>

                                {/* 10. AKSI (Mata untuk detail pelanggan, Pensil untuk edit, Trash untuk hapus) */}
                                <td className="py-2.5 px-1 text-center overflow-hidden">
                                    <div className="flex items-center justify-center gap-0.5">
                                        {/* Lihat Detail Pelanggan (Mata) */}
                                        <Link
                                            href={customerDetailUrl}
                                            className="p-1 rounded text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors shrink-0"
                                            title={parsed.customer_id ? `Lihat Detail Pelanggan #${parsed.customer_id}` : "Lihat Detail Pelanggan"}
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                        </Link>

                                        {/* Edit Ticket Modal */}
                                        <button
                                            type="button"
                                            onClick={() => onOpenEditModal(log)}
                                            className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors shrink-0"
                                            title="Edit Catatan Pekerjaan"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>

                                        {/* Map Location */}
                                        {mapsUrl && (
                                            <a
                                                href={mapsUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1 rounded text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors shrink-0"
                                                title="Buka Titik Lokasi di Google Maps"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        )}

                                        {/* Delete Ticket */}
                                        <button
                                            type="button"
                                            onClick={() => onDeleteLog(log)}
                                            className="p-1 rounded text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors shrink-0"
                                            title="Hapus Catatan"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
