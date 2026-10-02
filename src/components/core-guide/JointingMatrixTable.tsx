"use client";

import { useState } from "react";
import { JointBox, JointBoxSplice, CoreStatus } from "@/lib/types/coreGuide";
import { getFiberColor } from "@/lib/ftth/tia598";
import {
    ShieldAlert,
    CheckCircle2,
    AlertTriangle,
    Plus,
    Lock,
    Trash2,
    SlidersHorizontal
} from "lucide-react";

interface JointingMatrixTableProps {
    jointBox: JointBox;
    splices: JointBoxSplice[];
    onAddSplice: (newSplice: Omit<JointBoxSplice, "id">) => Promise<void>;
    onUpdateSpliceStatus: (id: string, newStatus: CoreStatus) => Promise<void>;
    onDeleteSplice: (id: string) => Promise<void>;
}

export default function JointingMatrixTable({
    jointBox,
    splices,
    onAddSplice,
    onUpdateSpliceStatus,
    onDeleteSplice,
}: JointingMatrixTableProps) {
    const [selectedTray, setSelectedTray] = useState<number | "ALL">("ALL");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [dangerConfirmModal, setDangerConfirmModal] = useState<{
        spliceId: string;
        currentStatus: CoreStatus;
        targetStatus: CoreStatus;
    } | null>(null);

    // State form tambah splice
    const [formSplice, setFormSplice] = useState({
        tray_number: 1,
        in_cable_name: "Feeder Utama POP (48c)",
        in_tube_num: 1,
        in_core_num: 1,
        out_cable_name: "Distribusi Cluster (24c)",
        out_tube_num: 1,
        out_core_num: 1,
        splice_type: "FUSION_SPLICE" as JointBoxSplice["splice_type"],
        status: "ACTIVE" as CoreStatus,
        destination_target: "ODP-MHS-01 Port 1",
        optical_loss_db: 0.02,
        technician_notes: "",
    });

    const [saving, setSaving] = useState(false);

    // Filter per tray
    const filteredSplices = splices.filter(
        (s) => selectedTray === "ALL" || s.tray_number === selectedTray
    );

    // Handler change status with security guard for ACTIVE
    const handleStatusChangeRequest = (splice: JointBoxSplice, newStatus: CoreStatus) => {
        if (splice.status === "ACTIVE" && newStatus !== "ACTIVE") {
            // Memerlukan konfirmasi ganda karena memutus live traffic
            setDangerConfirmModal({
                spliceId: splice.id,
                currentStatus: splice.status,
                targetStatus: newStatus,
            });
        } else {
            onUpdateSpliceStatus(splice.id, newStatus);
        }
    };

    const confirmStatusChange = async () => {
        if (!dangerConfirmModal) return;
        await onUpdateSpliceStatus(dangerConfirmModal.spliceId, dangerConfirmModal.targetStatus);
        setDangerConfirmModal(null);
    };

    const handleCreateSplice = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const in_core_global = (formSplice.in_tube_num - 1) * 12 + formSplice.in_core_num;
            const out_core_global = (formSplice.out_tube_num - 1) * 12 + formSplice.out_core_num;

            await onAddSplice({
                joint_box_id: jointBox.id,
                tray_number: formSplice.tray_number,
                in_cable_name: formSplice.in_cable_name,
                in_tube_num: formSplice.in_tube_num,
                in_core_num: formSplice.in_core_num,
                in_core_global,
                out_cable_name: formSplice.out_cable_name,
                out_tube_num: formSplice.out_tube_num,
                out_core_num: formSplice.out_core_num,
                out_core_global,
                splice_type: formSplice.splice_type,
                status: formSplice.status,
                destination_target: formSplice.destination_target,
                optical_loss_db: formSplice.optical_loss_db,
                technician_notes: formSplice.technician_notes,
            });

            setIsAddModalOpen(false);
        } catch (err: unknown) {
            alert("Gagal menambahkan sambungan trakea: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Action Bar & Tray Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-synerix-border shadow-xs">
                {/* Tray Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                        <SlidersHorizontal className="h-3.5 w-3.5" /> Baki:
                    </span>
                    <button
                        type="button"
                        onClick={() => setSelectedTray("ALL")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            selectedTray === "ALL"
                                ? "bg-teal-700 text-white shadow-xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                        Semua Baki ({splices.length})
                    </button>

                    {Array.from({ length: jointBox.tray_count || 4 }, (_, i) => i + 1).map((trayNum) => {
                        const countInTray = splices.filter((s) => s.tray_number === trayNum).length;
                        return (
                            <button
                                key={trayNum}
                                type="button"
                                onClick={() => setSelectedTray(trayNum)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    selectedTray === trayNum
                                        ? "bg-teal-700 text-white shadow-xs"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                Tray #{trayNum} ({countInTray})
                            </button>
                        );
                    })}
                </div>

                {/* Tombol Tambah Splicing */}
                <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 shrink-0"
                >
                    <Plus className="h-4 w-4" />
                    Catat Splicing Baru
                </button>
            </div>

            {/* TABEL DIGITAL JOINTING MATRIX */}
            <div className="bg-white rounded-2xl border border-synerix-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                                <th className="py-3 px-3 sm:px-4">Baki</th>
                                <th className="py-3 px-3 sm:px-4">Kabel Masuk (In-Cable)</th>
                                <th className="py-3 px-2 sm:px-3 text-center">Arah</th>
                                <th className="py-3 px-3 sm:px-4">Kabel Keluar (Out-Cable)</th>
                                <th className="py-3 px-3 sm:px-4">Tipe & Redaman</th>
                                <th className="py-3 px-3 sm:px-4">Status & Proteksi</th>
                                <th className="py-3 px-2 sm:px-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredSplices.map((splice) => {
                                const inTubeColor = getFiberColor(splice.in_tube_num);
                                const inCoreColor = getFiberColor(splice.in_core_num);
                                const outTubeColor = getFiberColor(splice.out_tube_num);
                                const outCoreColor = getFiberColor(splice.out_core_num);

                                return (
                                    <tr
                                        key={splice.id}
                                        className={`hover:bg-slate-50/70 transition-colors ${
                                            splice.status === "ACTIVE"
                                                ? "bg-emerald-50/30"
                                                : splice.status === "DAMAGED"
                                                ? "bg-red-50/20"
                                                : ""
                                        }`}
                                    >
                                        {/* Baki */}
                                        <td className="py-3.5 px-3 sm:px-4 font-mono font-bold text-slate-700">
                                            Tray #{splice.tray_number}
                                        </td>

                                        {/* Kabel Masuk */}
                                        <td className="py-3.5 px-3 sm:px-4">
                                            <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                                                {splice.in_cable_name}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                {/* Chip Tube In */}
                                                <span
                                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold shadow-2xs"
                                                    style={{
                                                        backgroundColor: inTubeColor.hex,
                                                        color: inTubeColor.hex === "#F8FAFC" ? "#0F172A" : "#FFFFFF"
                                                    }}
                                                >
                                                    T-{splice.in_tube_num}
                                                </span>
                                                {/* Chip Core In */}
                                                <span
                                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold shadow-2xs"
                                                    style={{
                                                        backgroundColor: inCoreColor.hex,
                                                        color: inCoreColor.hex === "#F8FAFC" ? "#0F172A" : "#FFFFFF"
                                                    }}
                                                >
                                                    Core {splice.in_core_num} ({inCoreColor.nameId})
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-400">
                                                    (Glob: {splice.in_core_global})
                                                </span>
                                            </div>
                                        </td>

                                        {/* Arrow Splicing */}
                                        <td className="py-3.5 px-2 sm:px-3 text-center text-teal-600 font-bold">
                                            ➔
                                        </td>

                                        {/* Kabel Keluar */}
                                        <td className="py-3.5 px-3 sm:px-4">
                                            <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                                                {splice.out_cable_name}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                {/* Chip Tube Out */}
                                                <span
                                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold shadow-2xs"
                                                    style={{
                                                        backgroundColor: outTubeColor.hex,
                                                        color: outTubeColor.hex === "#F8FAFC" ? "#0F172A" : "#FFFFFF"
                                                    }}
                                                >
                                                    T-{splice.out_tube_num}
                                                </span>
                                                {/* Chip Core Out */}
                                                <span
                                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold shadow-2xs"
                                                    style={{
                                                        backgroundColor: outCoreColor.hex,
                                                        color: outCoreColor.hex === "#F8FAFC" ? "#0F172A" : "#FFFFFF"
                                                    }}
                                                >
                                                    Core {splice.out_core_num} ({outCoreColor.nameId})
                                                </span>
                                            </div>
                                            {splice.destination_target && (
                                                <div className="text-[11px] text-teal-700 font-medium mt-0.5">
                                                    Tujuan: {splice.destination_target}
                                                </div>
                                            )}
                                        </td>

                                        {/* Tipe & Loss */}
                                        <td className="py-3.5 px-3 sm:px-4">
                                            <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                                {splice.splice_type}
                                            </span>
                                            <div className="text-xs text-slate-500 font-mono mt-1">
                                                Loss: <strong>{splice.optical_loss_db ?? 0.02} dB</strong>
                                            </div>
                                        </td>

                                        {/* Status & Guard */}
                                        <td className="py-3.5 px-3 sm:px-4">
                                            {splice.status === "ACTIVE" && (
                                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100/90 text-emerald-900 text-xs font-bold border border-emerald-300">
                                                    <Lock className="h-3 w-3 text-emerald-700" />
                                                    <span>ACTIVE (Live Traffic)</span>
                                                </div>
                                            )}
                                            {splice.status === "SPARE" && (
                                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                                                    <CheckCircle2 className="h-3 w-3 text-slate-500" />
                                                    <span>SPARE (Cadangan)</span>
                                                </div>
                                            )}
                                            {splice.status === "DAMAGED" && (
                                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 text-red-800 text-xs font-bold border border-red-200">
                                                    <AlertTriangle className="h-3 w-3 text-red-600" />
                                                    <span>DAMAGED (Rusak)</span>
                                                </div>
                                            )}

                                            {/* Selector Cepat Ubah Status */}
                                            <div className="mt-1.5">
                                                <select
                                                    value={splice.status}
                                                    onChange={(e) =>
                                                        handleStatusChangeRequest(splice, e.target.value as CoreStatus)
                                                    }
                                                    className="text-[11px] font-semibold py-0.5 px-1.5 rounded border border-slate-200 bg-white text-slate-700 cursor-pointer focus:ring-1 focus:ring-teal-500"
                                                >
                                                    <option value="ACTIVE">Set: ACTIVE</option>
                                                    <option value="SPARE">Set: SPARE</option>
                                                    <option value="DAMAGED">Set: DAMAGED</option>
                                                </select>
                                            </div>
                                        </td>

                                        {/* Aksi Hapus */}
                                        <td className="py-3.5 px-2 sm:px-3 text-right">
                                            <button
                                                type="button"
                                                title="Hapus data sambungan ini"
                                                onClick={() => {
                                                    if (splice.status === "ACTIVE") {
                                                        alert("PERINGATAN: Splicing berstatus ACTIVE tidak boleh dihapus sembarangan karena ada pelanggan aktif!");
                                                        return;
                                                    }
                                                    if (confirm("Apakah Anda yakin ingin menghapus data sambungan trakea ini?")) {
                                                        onDeleteSplice(splice.id);
                                                    }
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}

                            {filteredSplices.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-12 px-4 text-center">
                                        <div className="max-w-md mx-auto">
                                            <div className="h-10 w-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mx-auto mb-2">
                                                <Plus className="h-5 w-5" />
                                            </div>
                                            <p className="text-xs font-bold text-slate-700">Belum Ada Sambungan Core di Baki Ini</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                Catat trakea splicing serat optik baru untuk mendokumentasikan jalur kabel masuk dan keluar.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setIsAddModalOpen(true)}
                                                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                <span>Catat Splicing Baru</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL KONFIRMASI BAHAYA (DOUBLE CHECK JIKA EDIT STATUS ACTIVE) */}
            {dangerConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border-2 border-red-500 animate-in fade-in zoom-in-95">
                        <div className="flex items-center gap-3 text-red-600 mb-3">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                <ShieldAlert className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-slate-900">
                                    PERINGATAN RISIKO OPERASIONAL
                                </h3>
                                <p className="text-xs text-red-600 font-semibold">
                                    Mengubah Core Berstatus LIVE TRAFFIC (ACTIVE)
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed">
                            Core ini saat ini tercatat sebagai <strong>ACTIVE</strong> (membawa sinyal optik pelanggan/layanan aktif). Mengubahnya menjadi <strong>{dangerConfirmModal.targetStatus}</strong> dapat menyebabkan pemutusan layanan jika ada salah identifikasi di lapangan.
                        </p>

                        <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-200 text-[11px] text-red-800">
                            Pastikan Anda telah melakukan verifikasi dengan OPM (Optical Power Meter) atau konfirmasi dengan tim NOC sebelum melakukan pemutusan!
                        </div>

                        <div className="mt-5 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDangerConfirmModal(null)}
                                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                            >
                                Batalkan (Amankan Core)
                            </button>
                            <button
                                type="button"
                                onClick={confirmStatusChange}
                                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
                            >
                                Ya, Saya Mengerti Risikonya
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL TAMBAH SPLICING BARU */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto no-scrollbar">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-base text-slate-900">
                                Catat Splicing Trakea Baru ({jointBox.name})
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateSplice} className="mt-4 space-y-3.5">
                            {/* Pilihan Tray */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Nomor Baki (Tray Splicing)
                                </label>
                                <select
                                    value={formSplice.tray_number}
                                    onChange={(e) =>
                                        setFormSplice({ ...formSplice, tray_number: parseInt(e.target.value) || 1 })
                                    }
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white"
                                >
                                    {Array.from({ length: jointBox.tray_count || 4 }, (_, i) => i + 1).map((n) => (
                                        <option key={n} value={n}>
                                            Baki / Tray #{n}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Section Kabel Masuk */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                                    1. Kabel Masuk (In-Cable / Feeder)
                                </span>
                                <div className="mt-2 space-y-2">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Nama Kabel Masuk (contoh: Feeder A 48c)"
                                        value={formSplice.in_cable_name}
                                        onChange={(e) =>
                                            setFormSplice({ ...formSplice, in_cable_name: e.target.value })
                                        }
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold">Tube Masuk (1-12)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="12"
                                                value={formSplice.in_tube_num}
                                                onChange={(e) =>
                                                    setFormSplice({ ...formSplice, in_tube_num: parseInt(e.target.value) || 1 })
                                                }
                                                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold">Core Masuk (1-12)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="12"
                                                value={formSplice.in_core_num}
                                                onChange={(e) =>
                                                    setFormSplice({ ...formSplice, in_core_num: parseInt(e.target.value) || 1 })
                                                }
                                                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section Kabel Keluar */}
                            <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200">
                                <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wide">
                                    2. Kabel Keluar (Out-Cable / Distribusi)
                                </span>
                                <div className="mt-2 space-y-2">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Nama Kabel Keluar (contoh: Distribusi B 24c)"
                                        value={formSplice.out_cable_name}
                                        onChange={(e) =>
                                            setFormSplice({ ...formSplice, out_cable_name: e.target.value })
                                        }
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-teal-300 focus:ring-1 focus:ring-teal-500"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] text-teal-800 font-semibold">Tube Keluar (1-12)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="12"
                                                value={formSplice.out_tube_num}
                                                onChange={(e) =>
                                                    setFormSplice({ ...formSplice, out_tube_num: parseInt(e.target.value) || 1 })
                                                }
                                                className="w-full px-2 py-1.5 text-xs rounded-lg border border-teal-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-teal-800 font-semibold">Core Keluar (1-12)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="12"
                                                value={formSplice.out_core_num}
                                                onChange={(e) =>
                                                    setFormSplice({ ...formSplice, out_core_num: parseInt(e.target.value) || 1 })
                                                }
                                                className="w-full px-2 py-1.5 text-xs rounded-lg border border-teal-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status & Tujuan */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Status Core
                                    </label>
                                    <select
                                        value={formSplice.status}
                                        onChange={(e) =>
                                            setFormSplice({ ...formSplice, status: e.target.value as CoreStatus })
                                        }
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white"
                                    >
                                        <option value="ACTIVE">ACTIVE (Live Traffic)</option>
                                        <option value="SPARE">SPARE (Cadangan)</option>
                                        <option value="DAMAGED">DAMAGED (Rusak)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Nilai Loss (dB)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formSplice.optical_loss_db}
                                        onChange={(e) =>
                                            setFormSplice({ ...formSplice, optical_loss_db: parseFloat(e.target.value) || 0.02 })
                                        }
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Tujuan / Port Target (Opsional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: ODP-MHS-04 Port 1 atau Backbone POP"
                                    value={formSplice.destination_target}
                                    onChange={(e) =>
                                        setFormSplice({ ...formSplice, destination_target: e.target.value })
                                    }
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs disabled:opacity-50"
                                >
                                    {saving ? "Menyimpan..." : "Simpan Splicing"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
