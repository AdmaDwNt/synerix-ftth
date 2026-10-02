"use client";

import React from "react";
import { DismantleTask } from "@/lib/types/dismantle";
import { getGoogleMapsUrl } from "@/lib/ftth/distance";
import {
    Pencil,
    Trash2,
    RefreshCw,
    ExternalLink
} from "lucide-react";

interface DismantleTableProps {
    tasks: DismantleTask[];
    startIndex: number;
    onOpenStatusModal: (task: DismantleTask) => void;
    onOpenEditModal: (task: DismantleTask) => void;
    onDeleteTask: (taskId: string) => void;
}

export default function DismantleTable({
    tasks,
    startIndex,
    onOpenStatusModal,
    onOpenEditModal,
    onDeleteTask,
}: DismantleTableProps) {
    if (tasks.length === 0) {
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
                        <th className="py-2.5 px-1.5 w-[23%]">JUDUL</th>
                        <th className="py-2.5 px-1.5 w-[10%]">PJ TERAKHIR</th>
                        <th className="py-2.5 px-1.5 w-[16%]">TINDAKAN TERAKHIR</th>
                        <th className="py-2.5 px-1 text-center w-[5%]">%</th>
                        <th className="py-2.5 px-1 text-center w-[7%]">AKSI</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {tasks.map((task, idx) => {
                        const rowNumber = startIndex + idx;
                        const isCompleted = task.status === "COMPLETED";
                        const isInProgress = task.status === "IN_PROGRESS";
                        const isFailed = task.status === "FAILED";

                        // Status dot color
                        const dotColor = isCompleted
                            ? "text-emerald-500"
                            : isInProgress
                            ? "text-blue-500"
                            : isFailed
                            ? "text-rose-500"
                            : "text-amber-500";

                        // Percentage progress
                        const percentProgress = isCompleted
                            ? { label: "100%", color: "text-emerald-700 bg-emerald-50 border-emerald-200" }
                            : isInProgress
                            ? { label: "50%", color: "text-blue-700 bg-blue-50 border-blue-200" }
                            : isFailed
                            ? { label: "0%", color: "text-rose-700 bg-rose-50 border-rose-200" }
                            : { label: "0%", color: "text-amber-700 bg-amber-50 border-amber-200" };

                        // Format created_at date and time
                        const createdDate = task.created_at
                            ? new Date(task.created_at).toISOString().replace("T", " ").slice(0, 19)
                            : "-";

                        // Tindakan terakhir
                        const actionTime = task.completed_at
                            ? new Date(task.completed_at).toISOString().replace("T", " ").slice(0, 19)
                            : createdDate;
                        const actionPj = task.technician_name || "Teknisi Lapangan";

                        let actionSummary = "Menunggu teknisi lapangan menuju lokasi pelanggan";
                        if (isCompleted) {
                            actionSummary = `Penarikan selesai (${task.device_type || "ONT"} - SN: ${
                                task.serial_number || "N/A"
                            })`;
                        } else if (isInProgress) {
                            actionSummary = "Teknisi sedang dalam perjalanan / proses penarikan di lokasi";
                        } else if (isFailed) {
                            actionSummary = `Gagal: ${task.failure_reason || "Rumah tutup / ditolak"}`;
                        }

                        // Google Maps URL
                        const mapsUrl =
                            task.latitude && task.longitude
                                ? getGoogleMapsUrl(task.latitude, task.longitude)
                                : null;

                        return (
                            <tr
                                key={task.id}
                                className="hover:bg-teal-50/20 transition-colors group"
                            >
                                {/* 1. NO */}
                                <td className="py-2.5 px-1.5 text-center text-slate-500 font-semibold overflow-hidden truncate">
                                    {rowNumber}
                                </td>

                                {/* 2. # ID */}
                                <td className="py-2.5 px-1.5 overflow-hidden">
                                    <div className="flex items-center gap-1 min-w-0" title={task.customer_id}>
                                        <span className={`text-base leading-none shrink-0 ${dotColor}`}>●</span>
                                        <span className="font-mono font-bold text-slate-800 tracking-tight text-xs truncate">
                                            {task.customer_id}
                                        </span>
                                    </div>
                                    {task.parent_odp_name && (
                                        <div
                                            className="text-[10px] text-slate-500 font-mono truncate pl-3"
                                            title={`ODP: ${task.parent_odp_name}`}
                                        >
                                            ODP: {task.parent_odp_name}
                                        </div>
                                    )}
                                </td>

                                {/* 3. TGL PEMBUATAN */}
                                <td className="py-2.5 px-1.5 font-mono text-[11px] text-slate-600 overflow-hidden truncate" title={createdDate}>
                                    {createdDate}
                                </td>

                                {/* 4. JENIS */}
                                <td className="py-2.5 px-1 text-center overflow-hidden">
                                    <span className="inline-block px-1 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-teal-50 text-teal-800 border border-teal-200">
                                        DISMANTLE
                                    </span>
                                </td>

                                {/* 5. KATEGORI */}
                                <td className="py-2.5 px-1.5 overflow-hidden truncate" title={task.cluster_name || "CLUSTER UMUM"}>
                                    <span className="font-bold text-slate-700 uppercase tracking-tight text-[11px]">
                                        {task.cluster_name || "CLUSTER UMUM"}
                                    </span>
                                </td>

                                {/* 6. JUDUL */}
                                <td className="py-2.5 px-1.5 overflow-hidden">
                                    <div
                                        className="font-bold text-slate-800 truncate"
                                        title={`PENARIKAN PERANGKAT ${task.device_type ? `(${task.device_type})` : ""}`}
                                    >
                                        PENARIKAN PERANGKAT {task.device_type ? `(${task.device_type})` : ""}
                                    </div>
                                    <div
                                        className="text-teal-700 font-medium text-[11px] truncate"
                                        title={`${task.customer_name} — ${task.address}`}
                                    >
                                        {task.customer_name} —{" "}
                                        <span className="text-slate-500">{task.address}</span>
                                    </div>
                                </td>

                                {/* 7. PJ TERAKHIR */}
                                <td
                                    className="py-2.5 px-1.5 font-medium text-slate-700 overflow-hidden truncate"
                                    title={task.technician_name || "Belum Ditugaskan"}
                                >
                                    {task.technician_name || "Belum Ditugaskan"}
                                </td>

                                {/* 8. TINDAKAN TERAKHIR */}
                                <td className="py-2.5 px-1.5 text-[11px] overflow-hidden">
                                    <div
                                        className="text-emerald-700 font-semibold font-mono truncate"
                                        title={`${actionTime} [${actionPj}]`}
                                    >
                                        {actionTime.slice(5, 16)}{" "}
                                        <span className="text-slate-700 font-sans font-bold">[{actionPj}]</span>
                                    </div>
                                    <div className="text-slate-600 truncate" title={actionSummary}>
                                        {actionSummary}
                                    </div>
                                </td>

                                {/* 9. % */}
                                <td className="py-2.5 px-1 text-center overflow-hidden">
                                    <span
                                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black border font-mono ${percentProgress.color}`}
                                    >
                                        {percentProgress.label}
                                    </span>
                                </td>

                                {/* 10. AKSI */}
                                <td className="py-2.5 px-1 text-center overflow-hidden">
                                    <div className="flex items-center justify-center gap-0.5">
                                        {/* Status Update Modal */}
                                        <button
                                            type="button"
                                            onClick={() => onOpenStatusModal(task)}
                                            className="p-1 rounded text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors shrink-0"
                                            title="Update Status / Detail Penarikan"
                                        >
                                            <RefreshCw className="h-3.5 w-3.5" />
                                        </button>

                                        {/* Edit Ticket Modal */}
                                        <button
                                            type="button"
                                            onClick={() => onOpenEditModal(task)}
                                            className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors shrink-0"
                                            title="Edit Data Tugas"
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
                                                title="Buka Navigasi Google Maps"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        )}

                                        {/* Delete Ticket */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        `Yakin ingin menghapus tugas dismantle pelanggan ${task.customer_name} (${task.customer_id})?`
                                                    )
                                                ) {
                                                    onDeleteTask(task.id);
                                                }
                                            }}
                                            className="p-1 rounded text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors shrink-0"
                                            title="Hapus Data Tugas"
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
