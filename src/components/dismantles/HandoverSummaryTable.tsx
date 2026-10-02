"use client";

import { DismantleTask } from "@/lib/types/dismantle";
import {
    Printer,
    Box,
    FileSpreadsheet,
    CheckCircle2
} from "lucide-react";

interface HandoverSummaryTableProps {
    completedTasks: DismantleTask[];
    onToggleHandoverStatus: (taskId: string, current: boolean) => Promise<void>;
}

export default function HandoverSummaryTable({
    completedTasks,
    onToggleHandoverStatus,
}: HandoverSummaryTableProps) {
    // Ekspor ke CSV
    const exportToCSV = () => {
        if (completedTasks.length === 0) {
            alert("Belum ada data dismantle yang selesai untuk diekspor.");
            return;
        }

        const headers = [
            "No",
            "Customer ID",
            "Nama Pelanggan",
            "Cluster",
            "Tipe ONT",
            "Serial Number (SN)",
            "Aksesoris",
            "Teknisi",
            "Tanggal Selesai",
            "Status Gudang",
        ];

        const rows = completedTasks.map((t, index) => [
            index + 1,
            `"${t.customer_id}"`,
            `"${t.customer_name}"`,
            `"${t.cluster_name}"`,
            `"${t.device_type}"`,
            `"${t.serial_number || '-'}"`,
            `"${(t.accessories || []).join('; ')}"`,
            `"${t.technician_name || '-'}"`,
            `"${t.completed_at ? new Date(t.completed_at).toLocaleDateString('id-ID') : '-'}"`,
            `"${t.handover_status ? 'SUDAH SERAH TERIMA' : 'BELUM'}"`,
        ]);

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Rekap_Dismantle_Gudang_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Print Berita Acara
    const handlePrint = () => {
        window.print();
    };

    const totalHandedOver = completedTasks.filter((t) => t.handover_status).length;
    const totalPendingHandover = completedTasks.length - totalHandedOver;

    return (
        <div className="bg-white rounded-2xl border border-synerix-border shadow-sm p-4 sm:p-6 space-y-4">
            {/* Header & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                    <h3 className="text-base font-bold text-synerix-text flex items-center gap-2">
                        <Box className="h-5 w-5 text-teal-600" />
                        Rekapitulasi Serah Terima Perangkat ke Gudang
                    </h3>
                    <p className="text-xs text-synerix-subtext">
                        Daftar ONT/STB yang berhasil ditarik dari pelanggan dan siap diserahkan ke bagian logistik
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={exportToCSV}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs"
                    >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                        <span>Ekspor CSV / Excel</span>
                    </button>

                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-2xs"
                    >
                        <Printer className="h-4 w-4" />
                        <span>Cetak Surat Jalan</span>
                    </button>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] text-slate-500 font-semibold">Total Perangkat Ditarik</div>
                    <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                        {completedTasks.length} Unit
                    </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-[11px] text-amber-800 font-semibold">Belum Serah Terima</div>
                    <div className="text-xl font-bold text-amber-900 font-mono mt-0.5">
                        {totalPendingHandover} Unit
                    </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 col-span-2 sm:col-span-1">
                    <div className="text-[11px] text-emerald-800 font-semibold">Sudah di Gudang</div>
                    <div className="text-xl font-bold text-emerald-900 font-mono mt-0.5">
                        {totalHandedOver} Unit
                    </div>
                </div>
            </div>

            {/* Tabel Perangkat */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-3">Status Gudang</th>
                            <th className="py-2.5 px-3">Customer ID & Nama</th>
                            <th className="py-2.5 px-3">Merk / Tipe ONT</th>
                            <th className="py-2.5 px-3">Serial Number (SN)</th>
                            <th className="py-2.5 px-3">Aksesoris</th>
                            <th className="py-2.5 px-3">Teknisi</th>
                            <th className="py-2.5 px-3">Tgl Selesai</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {completedTasks.map((task) => (
                            <tr
                                key={task.id}
                                className={`hover:bg-slate-50/80 transition-colors ${
                                    task.handover_status ? "bg-emerald-50/20" : ""
                                }`}
                            >
                                <td className="py-3 px-3">
                                    <button
                                        type="button"
                                        onClick={() => onToggleHandoverStatus(task.id, !!task.handover_status)}
                                        className="flex items-center gap-1.5 text-xs font-semibold"
                                    >
                                        {task.handover_status ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                                                <CheckCircle2 className="h-3 w-3" /> Sudah Diterima
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium">
                                                Tandai Diterima
                                            </span>
                                        )}
                                    </button>
                                </td>

                                <td className="py-3 px-3">
                                    <div className="font-bold text-slate-900">{task.customer_name}</div>
                                    <div className="text-[10px] font-mono text-slate-500">
                                        {task.customer_id} • {task.cluster_name}
                                    </div>
                                </td>

                                <td className="py-3 px-3 font-semibold text-slate-800">
                                    {task.device_type}
                                </td>

                                <td className="py-3 px-3">
                                    <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-900">
                                        {task.serial_number || "Tidak Ada SN"}
                                    </span>
                                </td>

                                <td className="py-3 px-3 text-slate-600">
                                    {task.accessories && task.accessories.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {task.accessories.map((acc) => (
                                                <span
                                                    key={acc}
                                                    className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded"
                                                >
                                                    {acc}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        "-"
                                    )}
                                </td>

                                <td className="py-3 px-3 text-slate-700 font-medium">
                                    {task.technician_name || "Teknisi"}
                                </td>

                                <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                                    {task.completed_at
                                        ? new Date(task.completed_at).toLocaleDateString("id-ID", {
                                              day: "2-digit",
                                              month: "short",
                                              year: "numeric",
                                          })
                                        : "-"}
                                </td>
                            </tr>
                        ))}

                        {completedTasks.length === 0 && (
                            <tr>
                                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                                    Belum ada penarikan perangkat yang berstatus selesai (Completed).
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
