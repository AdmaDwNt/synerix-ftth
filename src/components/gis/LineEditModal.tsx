"use client";

import { useState } from "react";
import {
    Activity,
    X,
    Save,
    Trash2,
    Loader2,
    Layers,
    Share2,
    Network,
} from "lucide-react";
import { NetworkLine, CableType, LineStatus, InstallationType, KmlLayer } from "@/lib/types/gis";
import CustomSelect, { SelectOption } from "@/components/ui/CustomSelect";
import { SupabaseClient } from "@supabase/supabase-js";
import { formatDistance } from "@/lib/ftth/distance";

interface LineEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    line: NetworkLine | null;
    layers: KmlLayer[];
    supabase: SupabaseClient;
    onSaved: (updatedLine: NetworkLine) => void;
    onDeleted: (lineId: string) => void;
}

export default function LineEditModal({
    isOpen,
    onClose,
    line,
    layers,
    supabase,
    onSaved,
    onDeleted,
}: LineEditModalProps) {
    if (!isOpen || !line) return null;

    const [name, setName] = useState(line.name || "");
    const [cableType, setCableType] = useState<CableType>(line.cable_type || "DISTRIBUTION");
    const [installationType, setInstallationType] = useState<InstallationType>(
        line.installation_type || "AERIAL"
    );
    const [status, setStatus] = useState<LineStatus>(line.status || "NORMAL");
    const [coreCapacity, setCoreCapacity] = useState<number>(line.core_capacity || 24);
    const [color, setColor] = useState<string>(line.color || "#0D9488");
    const [layerId, setLayerId] = useState<string>(line.layer_id || "");

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const cableTypeOptions: SelectOption[] = [
        { value: "FEEDER", label: "Kabel Feeder (Kapasitas Besar)", colorDot: "bg-sky-600" },
        { value: "DISTRIBUTION", label: "Kabel Distribusi", colorDot: "bg-teal-600" },
        { value: "BACKBONE", label: "Kabel Backbone Ring", colorDot: "bg-purple-600" },
        { value: "DROP_CABLE", label: "Drop Core Pelanggan", colorDot: "bg-amber-600" },
    ];

    const installationOptions: SelectOption[] = [
        { value: "AERIAL", label: "Udara (Kabel Tiang / Aerial)", colorDot: "bg-blue-500" },
        { value: "UNDERGROUND", label: "Tanam Langsung (Direct Buried)", colorDot: "bg-amber-700" },
        { value: "DUCT", label: "Ducting Subduct Sub-surface", colorDot: "bg-emerald-600" },
    ];

    const statusOptions: SelectOption[] = [
        { value: "NORMAL", label: "Kondisi Baik / Normal", colorDot: "bg-emerald-500" },
        { value: "HIGH_ATTENUATION", label: "Redaman Tinggi (Bending)", colorDot: "bg-amber-500" },
        { value: "CUT", label: "Kabel Putus (Fiber Cut)", colorDot: "bg-red-500" },
        { value: "MAINTENANCE", label: "Dalam Pemeliharaan", colorDot: "bg-blue-500" },
    ];

    const layerOptions: SelectOption[] = [
        { value: "", label: "-- Tanpa Layer (Global) --" },
        ...layers.map((l) => ({
            value: l.id,
            label: l.name,
            colorDot: "bg-teal-600",
        })),
    ];

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setErrorMsg("Nama jalur kabel tidak boleh kosong.");
            return;
        }

        setSaving(true);
        setErrorMsg(null);

        const updatedData = {
            name: name.trim(),
            cable_type: cableType,
            installation_type: installationType,
            status,
            core_capacity: Number(coreCapacity) || 24,
            color,
            layer_id: layerId || null,
            updated_at: new Date().toISOString(),
        };

        try {
            const { data, error } = await supabase
                .from("network_lines")
                .update(updatedData)
                .eq("id", line.id)
                .select()
                .single();

            if (error) throw error;

            // Catat audit log
            await supabase.from("gis_audit_logs").insert({
                entity_type: "LINE",
                entity_id: line.id,
                entity_name: name.trim(),
                action: "UPDATE",
                changes_summary: updatedData,
            });

            onSaved(data as NetworkLine);
            onClose();
        } catch (err: any) {
            console.error("Gagal update kabel:", err);
            setErrorMsg(err?.message || "Gagal menyimpan perubahan jalur kabel.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Hapus segmen jalur kabel "${line.name}" secara permanen?`)) {
            return;
        }

        setDeleting(true);
        try {
            const { error } = await supabase.from("network_lines").delete().eq("id", line.id);
            if (error) throw error;

            await supabase.from("gis_audit_logs").insert({
                entity_type: "LINE",
                entity_id: line.id,
                entity_name: line.name,
                action: "DELETE",
            });

            onDeleted(line.id);
            onClose();
        } catch (err: any) {
            alert("Gagal menghapus kabel: " + err.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-synerix-border w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-5 py-4 border-b border-synerix-border flex items-center justify-between bg-slate-50/90">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
                            <Network className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-synerix-text">Edit Jalur Kabel Fiber</h3>
                            <p className="text-xs text-synerix-subtext">
                                Panjang: {line.length_meters ? formatDistance(line.length_meters) : "-"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-3.5 text-xs">
                    {errorMsg && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                            {errorMsg}
                        </div>
                    )}

                    {/* Nama Kabel */}
                    <div>
                        <label className="block text-slate-700 font-bold mb-1">
                            Nama Segmen Jalur Kabel <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: CABLE-FEEDER-ODC01-TO-ODP02"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                        />
                    </div>

                    {/* Tipe Kabel & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-700 font-bold mb-1">Klasifikasi Kabel</label>
                            <CustomSelect
                                options={cableTypeOptions}
                                value={cableType}
                                onChange={(val) => setCableType(val as CableType)}
                            />
                        </div>
                        <div>
                            <label className="block text-slate-700 font-bold mb-1">Status Fisik</label>
                            <CustomSelect
                                options={statusOptions}
                                value={status}
                                onChange={(val) => setStatus(val as LineStatus)}
                            />
                        </div>
                    </div>

                    {/* Kapasitas Core & Warna Jalur */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-700 font-bold mb-1">Kapasitas Core</label>
                            <input
                                type="number"
                                min={1}
                                max={288}
                                value={coreCapacity}
                                onChange={(e) => setCoreCapacity(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-slate-700 font-bold mb-1">Warna Garis di Peta</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="h-8 w-12 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                                />
                                <span className="font-mono text-[11px] text-slate-600 uppercase font-bold">
                                    {color}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tipe Instalasi & Layer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-700 font-bold mb-1">Tipe Penarikan Kabel</label>
                            <CustomSelect
                                options={installationOptions}
                                value={installationType}
                                onChange={(val) => setInstallationType(val as InstallationType)}
                            />
                        </div>
                        <div>
                            <label className="block text-slate-700 font-bold mb-1">Layer Asosiasi</label>
                            <CustomSelect
                                options={layerOptions}
                                value={layerId}
                                onChange={setLayerId}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting || saving}
                            className="px-3.5 py-2 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span>{deleting ? "Menghapus..." : "Hapus Jalur"}</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        <span>Simpan Perubahan</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
