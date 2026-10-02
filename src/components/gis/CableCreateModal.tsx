"use client";

import { useState } from "react";
import { Plus, X, Network, Loader2, Save } from "lucide-react";
import { CableType, InstallationType, KmlLayer, NetworkLine } from "@/lib/types/gis";
import CustomSelect, { SelectOption } from "@/components/ui/CustomSelect";
import { SupabaseClient } from "@supabase/supabase-js";
import { formatDistance } from "@/lib/ftth/distance";

interface CableCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    coordinates: [number, number][];
    totalLengthMeters: number;
    layers: KmlLayer[];
    supabase: SupabaseClient;
    onCreated: (newLine: NetworkLine) => void;
}

export default function CableCreateModal({
    isOpen,
    onClose,
    coordinates,
    totalLengthMeters,
    layers,
    supabase,
    onCreated,
}: CableCreateModalProps) {
    if (!isOpen) return null;

    const [name, setName] = useState("");
    const [cableType, setCableType] = useState<CableType>("DISTRIBUTION");
    const [installationType, setInstallationType] = useState<InstallationType>("AERIAL");
    const [coreCapacity, setCoreCapacity] = useState<number>(24);
    const [color, setColor] = useState<string>("#0D9488");
    const [layerId, setLayerId] = useState<string>("");

    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const cableTypeOptions: SelectOption[] = [
        { value: "DISTRIBUTION", label: "Kabel Distribusi", colorDot: "bg-teal-600" },
        { value: "FEEDER", label: "Kabel Feeder (Kapasitas Besar)", colorDot: "bg-sky-600" },
        { value: "BACKBONE", label: "Kabel Backbone Ring", colorDot: "bg-purple-600" },
        { value: "DROP_CABLE", label: "Drop Core Pelanggan", colorDot: "bg-amber-600" },
    ];

    const installationOptions: SelectOption[] = [
        { value: "AERIAL", label: "Udara (Kabel Tiang / Aerial)", colorDot: "bg-blue-500" },
        { value: "UNDERGROUND", label: "Tanam Langsung (Direct Buried)", colorDot: "bg-amber-700" },
        { value: "DUCT", label: "Ducting Subduct", colorDot: "bg-emerald-600" },
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
            setErrorMsg("Nama jalur kabel wajib diisi.");
            return;
        }

        setSaving(true);
        setErrorMsg(null);

        const newRow = {
            name: name.trim(),
            cable_type: cableType,
            installation_type: installationType,
            status: "NORMAL",
            core_capacity: Number(coreCapacity) || 24,
            color,
            coordinates,
            length_meters: Math.round(totalLengthMeters * 10) / 10,
            layer_id: layerId || null,
        };

        try {
            const { data, error } = await supabase
                .from("network_lines")
                .insert(newRow)
                .select()
                .single();

            if (error) throw error;

            // Catat audit
            await supabase.from("gis_audit_logs").insert({
                entity_type: "LINE",
                entity_id: data.id,
                entity_name: name.trim(),
                action: "CREATE",
                changes_summary: newRow,
            });

            onCreated(data as NetworkLine);
            onClose();
        } catch (err: any) {
            console.error("Gagal simpan kabel baru:", err);
            setErrorMsg(err?.message || "Gagal menyimpan jalur kabel baru.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-synerix-border w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-5 py-4 border-b border-synerix-border flex items-center justify-between bg-slate-50/90">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                            <Network className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-synerix-text">Simpan Jalur Kabel Baru</h3>
                            <p className="text-xs text-synerix-subtext">
                                {coordinates.length} Titik Waypoint &bull; {formatDistance(totalLengthMeters)}
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

                    <div>
                        <label className="block text-slate-700 font-bold mb-1">
                            Nama Jalur Kabel <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: CABLE-DISTRIBUSI-RW04"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-700 font-bold mb-1">Klasifikasi Kabel</label>
                            <CustomSelect
                                options={cableTypeOptions}
                                value={cableType}
                                onChange={(val) => setCableType(val as CableType)}
                            />
                        </div>
                        <div>
                            <label className="block text-slate-700 font-bold mb-1">Kapasitas Core</label>
                            <input
                                type="number"
                                min={1}
                                max={288}
                                value={coreCapacity}
                                onChange={(e) => setCoreCapacity(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-700 font-bold mb-1">Tipe Penarikan</label>
                            <CustomSelect
                                options={installationOptions}
                                value={installationType}
                                onChange={(val) => setInstallationType(val as InstallationType)}
                            />
                        </div>
                        <div>
                            <label className="block text-slate-700 font-bold mb-1">Warna Garis</label>
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

                    <div>
                        <label className="block text-slate-700 font-bold mb-1">Layer Asosiasi</label>
                        <CustomSelect
                            options={layerOptions}
                            value={layerId}
                            onChange={setLayerId}
                        />
                    </div>

                    <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between text-[11px] font-semibold text-teal-900">
                        <span>Total Panjang Jalur Terukur:</span>
                        <span className="font-mono text-sm font-bold text-teal-800">
                            {formatDistance(totalLengthMeters)}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
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
                            className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    <span>Simpan Jalur Kabel</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
