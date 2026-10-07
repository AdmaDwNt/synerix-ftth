"use client";

import React from "react";
import { WorkLogItem } from "./EditWorkLogModal";
import { getGoogleMapsUrl } from "@/lib/ftth/distance";
import {
    Pencil,
    Trash2,
    ExternalLink
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
                        <th className="py-2.5 px-1.5 w-[10%]"># ID</th>
                        <th className="py-2.5 px-1.5 w-[10%]">TGL PEMBUATAN</th>
                        <th className="py-2.5 px-1 text-center w-[6%]">JENIS</th>
                        <th className="py-2.5 px-1.5 w-[10%]">KATEGORI</th>
                        <th className="py-2.5 px-1.5 w-[24%]">JUDUL</th>
                        <th className="py-2.5 px-1.5 w-[10%]">PJ TERAKHIR</th>
                        <th className="py-2.5 px-1.5 w-[15%]">TINDAKAN TERAKHIR</th>
                        <th className="py-2.5 px-1 text-center w-[5%]">%</th>
                        <th className="py-2.5 px-1 text-center w-[7%]">AKSI</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {logs.map((log, idx) => {
                        const rowNumber = startIndex + idx;
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

                        // Ticket code
                        const ticketCode = `TKT${log.id.replace(/-/g, "").slice(0, 14).toUpperCase()}`;

                        // Created date
                        const createdDate = log.created_at
                            ? new Date(log.created_at).toISOString().replace("T", " ").slice(0, 19)
                            : "-";

                        // PIC
                        const pjName = "Fariellio Andreano";

                        // Percentage or Optical power
                        const percentProgress = isDone
                            ? { label: "100%", color: "text-emerald-700 bg-emerald-50 border-emerald-200" }
                            : isPending
                            ? { label: "50%", color: "text-amber-700 bg-amber-50 border-amber-200" }
                            : { label: "0%", color: "text-rose-700 bg-rose-50 border-rose-200" };

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

                                {/* 2. # ID */}
                                <td className="py-2.5 px-1.5 overflow-hidden">
                                    <div className="flex items-center gap-1 min-w-0" title={ticketCode}>
                                        <span className={`text-base leading-none shrink-0 ${dotColor}`}>●</span>
                                        <span className="font-mono font-bold text-slate-800 tracking-tight text-xs truncate">
                                            {ticketCode}
                                        </span>
                                    </div>
                                </td>

                                {/* 3. TGL PEMBUATAN */}
                                <td className="py-2.5 px-1.5 font-mono text-[11px] text-slate-600 overflow-hidden truncate" title={createdDate}>
                                    {createdDate}
                                </td>

                                {/* 4. JENIS */}
                                <td className="py-2.5 px-1 text-center overflow-hidden">
                                    <span className="inline-block px-1 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-teal-50 text-teal-800 border border-teal-200">
                                        TEKNIS
                                    </span>
                                </td>

                                {/* 5. KATEGORI */}
                                <td className="py-2.5 px-1.5 overflow-hidden" title={log.category.replace(/_/g, " ")}>
                                    <span
                                        className={`block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border truncate ${
                                            isProject
                                                ? "bg-blue-50 text-blue-800 border-blue-200"
                                                : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                        }`}
                                    >
                                        {log.category.replace(/_/g, " ")}
                                    </span>
                                </td>

                                {/* 6. JUDUL */}
                                <td className="py-2.5 px-1.5 overflow-hidden">
                                    <div className="font-bold text-slate-800 text-xs truncate" title={log.title}>
                                        {log.title}
                                    </div>
                                    <div
                                        className="text-teal-700 font-medium text-[11px] truncate"
                                        title={log.case_description}
                                    >
                                        {log.case_description}
                                    </div>
                                </td>

                                {/* 7. PJ TERAKHIR */}
                                <td className="py-2.5 px-1.5 font-medium text-slate-700 overflow-hidden truncate" title={pjName}>
                                    {pjName}
                                </td>

                                {/* 8. TINDAKAN TERAKHIR */}
                                <td className="py-2.5 px-1.5 text-[11px] overflow-hidden">
                                    <div
                                        className="text-emerald-700 font-semibold font-mono truncate"
                                        title={`${createdDate} [${pjName}]`}
                                    >
                                        {createdDate.slice(5, 16)}{" "}
                                        <span className="text-slate-700 font-sans font-bold">
                                            [{pjName}]
                                        </span>
                                    </div>
                                    <div
                                        className="text-slate-600 truncate"
                                        title={log.resolution || "Dalam proses penanganan teknisi..."}
                                    >
                                        {log.resolution || "Dalam proses penanganan teknisi..."}
                                    </div>
                                </td>

                                {/* 9. % */}
                                <td className="py-2.5 px-1 text-center overflow-hidden">
                                    <span
                                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black border font-mono ${percentProgress.color}`}
                                    >
                                        {percentProgress.label}
                                    </span>
                                    {(log.optical_power_in !== null || log.optical_power_out !== null) && (
                                        <div className="text-[9px] font-mono text-slate-500 font-semibold truncate">
                                            {log.optical_power_out || log.optical_power_in}dB
                                        </div>
                                    )}
                                </td>

                                {/* 10. AKSI */}
                                <td className="py-2.5 px-1 text-center overflow-hidden">
                                    <div className="flex items-center justify-center gap-0.5">
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
