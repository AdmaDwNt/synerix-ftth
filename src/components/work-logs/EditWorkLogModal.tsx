"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Pencil, X, MapPin, Compass } from "lucide-react";
import CustomSelect from "@/components/ui/CustomSelect";

export interface WorkLogItem {
    id: string;
    title: string;
    category: "MAINTENANCE_RETAIL" | "MAINTENANCE_NETWORK" | "PROJECT" | "DISMANTLE" | "OTHER";
    case_description: string;
    resolution: string;
    optical_power_in: number | null;
    optical_power_out: number | null;
    status: "PENDING" | "IN_PROGRESS" | "DONE" | "ESCALATED";
    latitude: number | null;
    longitude: number | null;
    created_at: string;
}

interface EditWorkLogModalProps {
    log: WorkLogItem | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (updatedLog: WorkLogItem) => void;
}

export default function EditWorkLogModal({
    log,
    isOpen,
    onClose,
    onSuccess,
}: EditWorkLogModalProps) {
    const supabase = createClient();

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<WorkLogItem["category"]>("MAINTENANCE_RETAIL");
    const [caseDescription, setCaseDescription] = useState("");
    const [resolution, setResolution] = useState("");
    const [opticalPowerIn, setOpticalPowerIn] = useState<string>("");
    const [opticalPowerOut, setOpticalPowerOut] = useState<string>("");
    const [status, setStatus] = useState<WorkLogItem["status"]>("DONE");
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (log) {
            setTitle(log.title || "");
            setCategory(log.category || "MAINTENANCE_RETAIL");
            setCaseDescription(log.case_description || "");
            setResolution(log.resolution || "");
            setOpticalPowerIn(log.optical_power_in !== null ? String(log.optical_power_in) : "");
            setOpticalPowerOut(log.optical_power_out !== null ? String(log.optical_power_out) : "");
            setStatus(log.status || "DONE");
            setLatitude(log.latitude);
            setLongitude(log.longitude);
        }
    }, [log]);

    if (!isOpen || !log) return null;

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Browser Anda tidak mendukung Geolocation.");
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
                setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
                setGettingLocation(false);
            },
            (err) => {
                alert("Gagal membaca GPS: " + err.message);
                setGettingLocation(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !caseDescription.trim()) {
            alert("Judul pekerjaan dan deskripsi case wajib diisi!");
            return;
        }

        setSaving(true);
        try {
            const updated: WorkLogItem = {
                ...log,
                title: title.trim(),
                category,
                case_description: caseDescription.trim(),
                resolution: resolution.trim(),
                optical_power_in: opticalPowerIn ? parseFloat(opticalPowerIn) : null,
                optical_power_out: opticalPowerOut ? parseFloat(opticalPowerOut) : null,
                status,
                latitude,
                longitude,
            };

            const { error } = await supabase
                .from("work_logs")
                .update({
                    title: updated.title,
                    category: updated.category,
                    case_description: updated.case_description,
                    resolution: updated.resolution,
                    optical_power_in: updated.optical_power_in,
                    optical_power_out: updated.optical_power_out,
                    status: updated.status,
                    latitude: updated.latitude,
                    longitude: updated.longitude,
                })
                .eq("id", log.id);

            if (error) {
                console.error("Gagal update work_log:", error);
                throw new Error(error.message);
            }

            onSuccess(updated);
            onClose();
        } catch (err: unknown) {
            alert("Gagal menyimpan perubahan: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                            <Pencil className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-slate-900">
                                Edit Catatan Pekerjaan
                            </h3>
                            <p className="text-xs text-slate-500">
                                Ubah data tiket/kasus operasional lapangan
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                    {/* Judul & Kategori */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Judul / Nama Case *
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Contoh: Kabel Tertindih Pohon / ONU Loss"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Kategori Pekerjaan
                            </label>
                            <CustomSelect
                                value={category}
                                onChange={(val) => setCategory(val as any)}
                                options={[
                                    { value: "MAINTENANCE_NETWORK", label: "Maintenance Jaringan", colorDot: "bg-amber-500", description: "Gangguan / perbaikan jaringan" },
                                    { value: "MAINTENANCE_RETAIL", label: "Maintenance Retail", colorDot: "bg-sky-500", description: "Gangguan pelanggan / rumah" },
                                    { value: "PROJECT", label: "Project / Instalasi Baru", colorDot: "bg-blue-500", description: "Pemasangan baru" },
                                    { value: "DISMANTLE", label: "Dismantle / Pencabutan", colorDot: "bg-rose-500", description: "Penarikan perangkat" },
                                    { value: "OTHER", label: "Lainnya", colorDot: "bg-slate-400", description: "Kategori lain" },
                                ]}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Status Penyelesaian
                            </label>
                            <CustomSelect
                                value={status}
                                onChange={(val) => setStatus(val as any)}
                                options={[
                                    { value: "DONE", label: "Selesai (DONE)", colorDot: "bg-emerald-500", description: "Pekerjaan sudah selesai" },
                                    { value: "IN_PROGRESS", label: "Sedang Dikerjakan", colorDot: "bg-blue-500", description: "Dalam proses pengerjaan" },
                                    { value: "PENDING", label: "Menunggu / Pending", colorDot: "bg-amber-500", description: "Menunggu konfirmasi" },
                                    { value: "ESCALATED", label: "Eskalasi ke Vendor/NOC", colorDot: "bg-rose-500", description: "Butuh penanganan lanjut" },
                                ]}
                            />
                        </div>
                    </div>

                    {/* Deskripsi Case */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Deskripsi Masalah / Case *
                        </label>
                        <textarea
                            rows={2}
                            required
                            value={caseDescription}
                            onChange={(e) => setCaseDescription(e.target.value)}
                            placeholder="Detail temuan di lapangan..."
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                    </div>

                    {/* Solusi Perbaikan */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Tindakan / Solusi Perbaikan
                        </label>
                        <textarea
                            rows={2}
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            placeholder="Tindakan yang telah dieksekusi..."
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                    </div>

                    {/* Nilai Redaman (dBm) */}
                    <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Redaman di ODP (dBm)
                            </label>
                            <input
                                type="number"
                                step="any"
                                placeholder="-18.5"
                                value={opticalPowerIn}
                                onChange={(e) => setOpticalPowerIn(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Redaman di Rumah / ONT (dBm)
                            </label>
                            <input
                                type="number"
                                step="any"
                                placeholder="-19.8"
                                value={opticalPowerOut}
                                onChange={(e) => setOpticalPowerOut(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                            />
                        </div>
                    </div>

                    {/* Koordinat GPS */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 uppercase">
                                <MapPin className="w-3.5 h-3.5 text-teal-600" /> Koordinat Lokasi
                            </span>
                            <button
                                type="button"
                                onClick={handleGetCurrentLocation}
                                disabled={gettingLocation}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800 disabled:opacity-50"
                            >
                                <Compass className={`w-3.5 h-3.5 ${gettingLocation ? "animate-spin" : ""}`} />
                                <span>{gettingLocation ? "Membaca GPS..." : "Ambil Lokasi Saya"}</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] text-slate-500 font-semibold">Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={latitude ?? ""}
                                    onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : null)}
                                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-semibold">Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={longitude ?? ""}
                                    onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : null)}
                                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
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
                            className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs disabled:opacity-50 transition-all"
                        >
                            {saving ? "Menyimpan Perubahan..." : "Simpan Perubahan"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
