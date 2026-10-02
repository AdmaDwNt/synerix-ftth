"use client";

import { useState } from "react";
import { DismantleTask, DismantleStatus } from "@/lib/types/dismantle";
import {
    CheckCircle2,
    Clock,
    Navigation,
    XCircle,
    Camera,
    Cpu,
    AlertCircle,
    X
} from "lucide-react";

interface DismantleStatusModalProps {
    task: DismantleTask;
    isOpen: boolean;
    onClose: () => void;
    onSaveStatus: (updatedTask: DismantleTask) => Promise<void>;
}

export default function DismantleStatusModal({
    task,
    isOpen,
    onClose,
    onSaveStatus,
}: DismantleStatusModalProps) {
    const [targetStatus, setTargetStatus] = useState<DismantleStatus>(task.status);
    const [deviceType, setDeviceType] = useState(task.device_type || "ZTE F609");
    const [serialNumber, setSerialNumber] = useState(task.serial_number || "");
    const [macAddress, setMacAddress] = useState(task.mac_address || "");
    const [accessories, setAccessories] = useState<string[]>(
        task.accessories || ["ADAPTOR", "PATCHCORD"]
    );
    const [failureReason, setFailureReason] = useState(task.failure_reason || "");
    const [technicianName, setTechnicianName] = useState(task.technician_name || "Teknisi Lapangan");
    const [evidencePhoto, setEvidencePhoto] = useState<string | null>(task.evidence_photo_url || null);
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const toggleAccessory = (item: string) => {
        if (accessories.includes(item)) {
            setAccessories(accessories.filter((a) => a !== item));
        } else {
            setAccessories([...accessories, item]);
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const preview = URL.createObjectURL(file);
            setEvidencePhoto(preview);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (targetStatus === "COMPLETED" && !serialNumber.trim()) {
            alert("Nomor Serial Number (SN) perangkat wajib dicatat sebelum menyelesaikan dismantle!");
            return;
        }

        if (targetStatus === "FAILED" && !failureReason.trim()) {
            alert("Alasan penarikan gagal/batal wajib diisi.");
            return;
        }

        setSaving(true);
        try {
            const updated: DismantleTask = {
                ...task,
                status: targetStatus,
                device_type: deviceType,
                serial_number: targetStatus === "COMPLETED" ? serialNumber : task.serial_number,
                mac_address: macAddress,
                accessories,
                failure_reason: targetStatus === "FAILED" ? failureReason : null,
                technician_name: technicianName,
                evidence_photo_url: evidencePhoto,
                completed_at: targetStatus === "COMPLETED" ? new Date().toISOString() : task.completed_at,
            };

            await onSaveStatus(updated);
            onClose();
        } catch (err: unknown) {
            alert("Gagal memperbarui status: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                {/* Header Modal */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                        <span className="text-[10px] font-bold font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                            {task.customer_id}
                        </span>
                        <h3 className="font-bold text-base text-slate-900 mt-1">
                            Pembaruan Tugas: {task.customer_name}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {/* Pilih Status Transisi */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Pilih Status Tindakan:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                                type="button"
                                onClick={() => setTargetStatus("QUEUE")}
                                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                                    targetStatus === "QUEUE"
                                        ? "border-red-500 bg-red-50 text-red-700 font-bold ring-2 ring-red-400/20"
                                        : "border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                                }`}
                            >
                                <Clock className="h-4 w-4 text-red-500" />
                                <span className="text-xs">Antrean</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setTargetStatus("IN_PROGRESS")}
                                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                                    targetStatus === "IN_PROGRESS"
                                        ? "border-amber-500 bg-amber-50 text-amber-800 font-bold ring-2 ring-amber-400/20"
                                        : "border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                                }`}
                            >
                                <Navigation className="h-4 w-4 text-amber-600" />
                                <span className="text-xs">Menuju Lokasi</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setTargetStatus("COMPLETED")}
                                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                                    targetStatus === "COMPLETED"
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold ring-2 ring-emerald-400/20"
                                        : "border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                                }`}
                            >
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                <span className="text-xs">Selesai Tarik</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setTargetStatus("FAILED")}
                                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                                    targetStatus === "FAILED"
                                        ? "border-slate-700 bg-slate-100 text-slate-800 font-bold ring-2 ring-slate-400/20"
                                        : "border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                                }`}
                            >
                                <XCircle className="h-4 w-4 text-slate-600" />
                                <span className="text-xs">Gagal/Batal</span>
                            </button>
                        </div>
                    </div>

                    {/* JIKA STATUS COMPLETED: FORM INPUT PERANGKAT & SN */}
                    {targetStatus === "COMPLETED" && (
                        <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3 animate-in fade-in">
                            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1">
                                <Cpu className="h-3.5 w-3.5" /> Pendataan Perangkat yang Ditarik
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[11px] font-semibold text-emerald-950 mb-1">
                                        Merk / Tipe ONT *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="ZTE F609 / Huawei HG8245H5"
                                        value={deviceType}
                                        onChange={(e) => setDeviceType(e.target.value)}
                                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-emerald-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-emerald-950 mb-1">
                                        Nomor Serial Number (SN) *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: ZTEGC9812A45"
                                        value={serialNumber}
                                        onChange={(e) => setSerialNumber(e.target.value)}
                                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-emerald-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold"
                                    />
                                </div>
                            </div>

                            {/* MAC Address (Opsional) */}
                            <div>
                                <label className="block text-[11px] font-semibold text-emerald-950 mb-1">
                                    MAC Address ONT (Opsional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: A4:7E:39:XX:XX:XX"
                                    value={macAddress}
                                    onChange={(e) => setMacAddress(e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-emerald-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                                />
                            </div>

                            {/* Checklist Aksesoris */}
                            <div>
                                <label className="block text-[11px] font-semibold text-emerald-950 mb-1">
                                    Kelengkapan Aksesoris:
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {["ADAPTOR", "PATCHCORD", "STB TV", "REMOTE", "KABEL LAN"].map((item) => {
                                        const isChecked = accessories.includes(item);
                                        return (
                                            <button
                                                key={item}
                                                type="button"
                                                onClick={() => toggleAccessory(item)}
                                                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                                                    isChecked
                                                        ? "bg-emerald-700 text-white border-emerald-700 font-semibold"
                                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                                }`}
                                            >
                                                {isChecked ? `✓ ${item}` : `+ ${item}`}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Upload Bukti Foto */}
                            <div>
                                <label className="block text-[11px] font-semibold text-emerald-950 mb-1">
                                    Foto Bukti Pencabutan Perangkat
                                </label>
                                <div className="flex items-center gap-2">
                                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer shadow-xs active:scale-95">
                                        <Camera className="h-3.5 w-3.5" />
                                        <span>Ambil / Upload Foto</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handlePhotoChange}
                                            className="hidden"
                                        />
                                    </label>
                                    {evidencePhoto && (
                                        <span className="text-[11px] text-emerald-800 font-semibold">
                                            ✓ Foto terlampir
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* JIKA STATUS FAILED: FORM ALASAN KENDALA */}
                    {targetStatus === "FAILED" && (
                        <div className="p-3.5 bg-red-50/60 rounded-xl border border-red-200 space-y-3 animate-in fade-in">
                            <span className="text-xs font-bold text-red-900 uppercase tracking-wide flex items-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5" /> Catatan Kendala Lapangan
                            </span>

                            {/* Presets Alasan */}
                            <div className="flex flex-wrap gap-1">
                                {[
                                    "Rumah Kosong / Pagar Dikunci",
                                    "Pelanggan Menolak Dicabut",
                                    "Alamat Salah / Pindah Luar Kota",
                                    "Perangkat Hilang / Rusak Fisik",
                                ].map((reason) => (
                                    <button
                                        key={reason}
                                        type="button"
                                        onClick={() => setFailureReason(reason)}
                                        className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-red-200 text-red-800 hover:bg-red-100"
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                rows={2}
                                required
                                placeholder="Jelaskan detail kendala (contoh: rumah kosong, sudah didatangi 2x dan dihubungi tidak merespons)..."
                                value={failureReason}
                                onChange={(e) => setFailureReason(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-red-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                        </div>
                    )}

                    {/* Nama Teknisi Pelaksana */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Nama Teknisi Pelaksana:
                        </label>
                        <input
                            type="text"
                            value={technicianName}
                            onChange={(e) => setTechnicianName(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                        />
                    </div>

                    {/* Footer Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs disabled:opacity-50"
                        >
                            {saving ? "Menyimpan..." : "Simpan Status"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
