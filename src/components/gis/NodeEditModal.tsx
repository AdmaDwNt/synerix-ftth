"use client";

import { useState, useEffect } from "react";
import {
    Edit3,
    X,
    Save,
    Trash2,
    MapPin,
    Layers,
    CheckCircle2,
    Loader2,
    Activity,
    Navigation,
} from "lucide-react";
import { NetworkNode, NodeType, NodeStatus, KmlLayer } from "@/lib/types/gis";
import CustomSelect, { SelectOption } from "@/components/ui/CustomSelect";
import { SupabaseClient } from "@supabase/supabase-js";

interface NodeEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    node: NetworkNode | null;
    layers: KmlLayer[];
    supabase: SupabaseClient;
    onSaved: (updatedNode: NetworkNode) => void;
    onDeleted: (nodeId: string) => void;
}

export default function NodeEditModal({
    isOpen,
    onClose,
    node,
    layers,
    supabase,
    onSaved,
    onDeleted,
}: NodeEditModalProps) {
    if (!isOpen || !node) return null;

    const [name, setName] = useState(node.name || "");
    const [type, setType] = useState<NodeType>(node.type || "ODP");
    const [status, setStatus] = useState<NodeStatus>(node.status || "ACTIVE");
    const [capacity, setCapacity] = useState<number>(node.capacity || 8);
    const [usedPorts, setUsedPorts] = useState<number>(node.used_ports || 0);
    const [poleNumber, setPoleNumber] = useState(node.pole_number || "");
    const [address, setAddress] = useState(node.address || "");
    const [notes, setNotes] = useState(node.notes || "");
    const [description, setDescription] = useState(node.description || "");
    const [latitude, setLatitude] = useState<number>(node.latitude);
    const [longitude, setLongitude] = useState<number>(node.longitude);
    const [layerId, setLayerId] = useState<string>(node.layer_id || "");

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const nodeTypeOptions: SelectOption[] = [
        { value: "ODP", label: "ODP (Optical Distribution Point)", colorDot: "bg-emerald-500" },
        { value: "ODC", label: "ODC (Optical Distribution Cabinet)", colorDot: "bg-amber-500" },
        { value: "POP", label: "POP (Point of Presence)", colorDot: "bg-teal-700" },
        { value: "SERVER", label: "SERVER / Headend", colorDot: "bg-cyan-500" },
        { value: "TIANG", label: "Tiang Fiber / Pole", colorDot: "bg-slate-500" },
        { value: "CUSTOMER", label: "Rumah Pelanggan", colorDot: "bg-blue-500" },
        { value: "DISMANTLE", label: "Titik Dismantle", colorDot: "bg-red-500" },
        { value: "CLOSURE", label: "Joint Box / Closure", colorDot: "bg-indigo-500" },
    ];

    const statusOptions: SelectOption[] = [
        { value: "ACTIVE", label: "Normal / Aktif", colorDot: "bg-emerald-500" },
        { value: "MAINTENANCE", label: "Dalam Pemeliharaan", colorDot: "bg-amber-500" },
        { value: "FULL", label: "Penuh (Full Port)", colorDot: "bg-purple-500" },
        { value: "PLANNING", label: "Tahap Perencanaan", colorDot: "bg-blue-500" },
        { value: "DAMAGED", label: "Rusak / Butuh Perbaikan", colorDot: "bg-red-500" },
    ];

    const layerOptions: SelectOption[] = [
        { value: "", label: "-- Tanpa Layer (Global) --" },
        ...layers.map((l) => ({
            value: l.id,
            label: l.name,
            colorDot: "bg-teal-600",
        })),
    ];

    // Ambil GPS terkini jika ingin update posisi
    const handleUpdateToCurrentGps = () => {
        if (!navigator.geolocation) {
            alert("Perangkat Anda tidak mendukung fitur Geolocation.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLatitude(pos.coords.latitude);
                setLongitude(pos.coords.longitude);
            },
            (err) => alert("Gagal mengambil GPS: " + err.message),
            { enableHighAccuracy: true }
        );
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setErrorMsg("Nama perangkat tidak boleh kosong.");
            return;
        }

        setSaving(true);
        setErrorMsg(null);

        const updatedData = {
            name: name.trim(),
            type,
            status,
            capacity: Number(capacity) || 0,
            used_ports: Number(usedPorts) || 0,
            pole_number: poleNumber.trim() || null,
            address: address.trim() || null,
            notes: notes.trim() || null,
            description: description.trim() || null,
            latitude: Number(latitude),
            longitude: Number(longitude),
            layer_id: layerId || null,
            updated_at: new Date().toISOString(),
        };

        try {
            const { data, error } = await supabase
                .from("network_nodes")
                .update(updatedData)
                .eq("id", node.id)
                .select()
                .single();

            if (error) throw error;

            // Catat audit log
            await supabase.from("gis_audit_logs").insert({
                entity_type: "NODE",
                entity_id: node.id,
                entity_name: name.trim(),
                action: "UPDATE",
                changes_summary: updatedData,
            });

            onSaved(data as NetworkNode);
            onClose();
        } catch (err: any) {
            console.error("Gagal update node:", err);
            setErrorMsg(err?.message || "Gagal menyimpan perubahan node.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Apakah Anda yakin ingin menghapus node "${node.name}" secara permanen?`)) {
            return;
        }

        setDeleting(true);
        try {
            const { error } = await supabase.from("network_nodes").delete().eq("id", node.id);
            if (error) throw error;

            // Catat audit log
            await supabase.from("gis_audit_logs").insert({
                entity_type: "NODE",
                entity_id: node.id,
                entity_name: node.name,
                action: "DELETE",
            });

            onDeleted(node.id);
            onClose();
        } catch (err: any) {
            alert("Gagal menghapus node: " + err.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-synerix-border w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="px-5 py-4 border-b border-synerix-border flex items-center justify-between bg-slate-50/90">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                            <Edit3 className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-synerix-text">Edit Perangkat Jaringan</h3>
                            <p className="text-xs text-synerix-subtext">ID: {node.id.substring(0, 8)}...</p>
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

                    {/* Nama Node */}
                    <div>
                        <label className="block text-slate-700 font-bold mb-1">
                            Nama Titik / ID Perangkat <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: ODP-MHS-01"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                        />
                    </div>

                    {/* Tipe & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-700 font-bold mb-1">Tipe Node</label>
                            <CustomSelect
                                options={nodeTypeOptions}
                                value={type}
                                onChange={(val) => setType(val as NodeType)}
                            />
                        </div>
                        <div>
                            <label className="block text-slate-700 font-bold mb-1">Status Operasional</label>
                            <CustomSelect
                                options={statusOptions}
                                value={status}
                                onChange={(val) => setStatus(val as NodeStatus)}
                            />
                        </div>
                    </div>

                    {/* Kapasitas Port & Port Terpakai */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-700 font-bold mb-1">Total Kapasitas (Core/Port)</label>
                            <input
                                type="number"
                                min={0}
                                max={288}
                                value={capacity}
                                onChange={(e) => setCapacity(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-slate-700 font-bold mb-1">Port Terpakai</label>
                            <input
                                type="number"
                                min={0}
                                max={capacity}
                                value={usedPorts}
                                onChange={(e) => setUsedPorts(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                            />
                        </div>
                    </div>

                    {/* Nomor Tiang & Layer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-700 font-bold mb-1">Nomor / Kode Tiang</label>
                            <input
                                type="text"
                                value={poleNumber}
                                onChange={(e) => setPoleNumber(e.target.value)}
                                placeholder="Contoh: T-PLN-MHS-44"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
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

                    {/* Koordinat GPS */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-teal-600" />
                                Koordinat Geografis
                            </span>
                            <button
                                type="button"
                                onClick={handleUpdateToCurrentGps}
                                className="text-[10px] text-teal-700 hover:text-teal-800 font-semibold underline flex items-center gap-1"
                            >
                                <Navigation className="h-3 w-3" />
                                <span>Gunakan GPS Sekarang</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[10px] text-slate-500 mb-0.5">Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    required
                                    value={latitude}
                                    onChange={(e) => setLatitude(Number(e.target.value))}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-500 mb-0.5">Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    required
                                    value={longitude}
                                    onChange={(e) => setLongitude(Number(e.target.value))}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Alamat & Catatan */}
                    <div>
                        <label className="block text-slate-700 font-bold mb-1">Alamat / Patokan Jalan</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Contoh: Jl. KH. Wachid Hasyim No. 12, Mojoroto"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-700 font-bold mb-1">Catatan Tambahan Teknisi</label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Catatan kondisi fisik boks, kunci gembok, redaman, dll..."
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                        />
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
                            <span>{deleting ? "Menghapus..." : "Hapus Titik"}</span>
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
