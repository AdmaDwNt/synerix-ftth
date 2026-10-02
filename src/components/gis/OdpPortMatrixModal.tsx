"use client";

import { useState, useEffect } from "react";
import {
    Cpu,
    X,
    Save,
    CheckCircle2,
    AlertCircle,
    User,
    Activity,
    Loader2,
    Plus,
    RefreshCw,
} from "lucide-react";
import { NetworkNode, OdpPort, PortStatus } from "@/lib/types/gis";
import { SupabaseClient } from "@supabase/supabase-js";
import CustomSelect, { SelectOption } from "@/components/ui/CustomSelect";

interface OdpPortMatrixModalProps {
    isOpen: boolean;
    onClose: () => void;
    node: NetworkNode | null;
    supabase: SupabaseClient;
    onPortsUpdated?: () => void;
}

export default function OdpPortMatrixModal({
    isOpen,
    onClose,
    node,
    supabase,
    onPortsUpdated,
}: OdpPortMatrixModalProps) {
    if (!isOpen || !node) return null;

    const [ports, setPorts] = useState<OdpPort[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedPort, setSelectedPort] = useState<OdpPort | null>(null);

    // Form edit single port
    const [portStatus, setPortStatus] = useState<PortStatus>("IDLE");
    const [customerId, setCustomerId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [opticalPower, setOpticalPower] = useState<string>("");
    const [notes, setNotes] = useState("");

    const totalCapacity = node.capacity || 8;

    const portStatusOptions: SelectOption[] = [
        { value: "IDLE", label: "Tersedia / Kosong (Idle)", colorDot: "bg-slate-400" },
        { value: "OCCUPIED", label: "Terpasang Pelanggan Aktif", colorDot: "bg-emerald-500" },
        { value: "RESERVED", label: "Dipesan / Booking Sales", colorDot: "bg-amber-500" },
        { value: "DAMAGED", label: "Port Rusak / Redaman Drop", colorDot: "bg-red-500" },
    ];

    // Fetch daftar port untuk node ini
    const fetchPorts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("odp_ports")
                .select("*")
                .eq("node_id", node.id)
                .order("port_number", { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                setPorts(data);
            } else {
                // Jika belum ada port di database, inisialisasi default 1..N
                const defaultPorts: OdpPort[] = Array.from({ length: totalCapacity }, (_, i) => ({
                    id: `temp-${i + 1}`,
                    node_id: node.id,
                    port_number: i + 1,
                    status: "IDLE",
                    customer_id: null,
                    customer_name: null,
                    optical_power_dbm: null,
                    notes: null,
                }));
                setPorts(defaultPorts);
            }
        } catch (err: any) {
            console.error("Gagal fetch port ODP:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPorts();
    }, [node.id]);

    const handleSelectPort = (p: OdpPort) => {
        setSelectedPort(p);
        setPortStatus(p.status || "IDLE");
        setCustomerId(p.customer_id || "");
        setCustomerName(p.customer_name || "");
        setOpticalPower(p.optical_power_dbm !== null && p.optical_power_dbm !== undefined ? String(p.optical_power_dbm) : "");
        setNotes(p.notes || "");
    };

    const handleSavePort = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPort) return;

        setSaving(true);
        const payload = {
            node_id: node.id,
            port_number: selectedPort.port_number,
            status: portStatus,
            customer_id: customerId.trim() || null,
            customer_name: customerName.trim() || null,
            optical_power_dbm: opticalPower.trim() ? parseFloat(opticalPower) : null,
            notes: notes.trim() || null,
            updated_at: new Date().toISOString(),
        };

        try {
            const { data, error } = await supabase
                .from("odp_ports")
                .upsert(payload, { onConflict: "node_id,port_number" })
                .select()
                .single();

            if (error) throw error;

            // Hitung ulang port terpakai di network_nodes
            const updatedPorts = ports.map((p) =>
                p.port_number === selectedPort.port_number ? (data as OdpPort) : p
            );
            setPorts(updatedPorts);

            const occupiedCount = updatedPorts.filter((p) => p.status === "OCCUPIED").length;
            await supabase
                .from("network_nodes")
                .update({ used_ports: occupiedCount, updated_at: new Date().toISOString() })
                .eq("id", node.id);

            setSelectedPort(null);
            if (onPortsUpdated) onPortsUpdated();
        } catch (err: any) {
            alert("Gagal menyimpan data port: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const occupiedCount = ports.filter((p) => p.status === "OCCUPIED").length;
    const idleCount = ports.filter((p) => p.status === "IDLE" || !p.status).length;
    const damagedCount = ports.filter((p) => p.status === "DAMAGED").length;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-synerix-border w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="px-5 py-4 border-b border-synerix-border flex items-center justify-between bg-slate-50/90">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                            <Cpu className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-synerix-text">
                                Matriks Port Fisik: {node.name}
                            </h3>
                            <p className="text-xs text-synerix-subtext">
                                Kapasitas: {totalCapacity} Port &bull; Terpakai: {occupiedCount} &bull; Sedia: {idleCount}
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

                {/* Body Content */}
                <div className="p-5 overflow-y-auto space-y-4 text-xs">
                    {/* Ringkasan Okupansi Port */}
                    <div className="grid grid-cols-3 gap-2.5 text-center">
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <span className="text-[10px] text-emerald-700 font-semibold block">Terpasang</span>
                            <span className="text-base font-bold text-emerald-900">{occupiedCount} Port</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                            <span className="text-[10px] text-slate-500 font-semibold block">Tersedia (Idle)</span>
                            <span className="text-base font-bold text-slate-800">{idleCount} Port</span>
                        </div>
                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl">
                            <span className="text-[10px] text-red-700 font-semibold block">Rusak / Loss</span>
                            <span className="text-base font-bold text-red-900">{damagedCount} Port</span>
                        </div>
                    </div>

                    {/* Grid Port Visualizer (ODP Baki Port) */}
                    <div>
                        <h4 className="font-bold text-slate-700 mb-2">Pilih Port untuk Mengisi / Edit:</h4>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                            {ports.map((p) => {
                                const isSelected = selectedPort?.port_number === p.port_number;
                                return (
                                    <button
                                        key={p.port_number}
                                        type="button"
                                        onClick={() => handleSelectPort(p)}
                                        className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                                            isSelected
                                                ? "ring-2 ring-teal-600 border-teal-500 shadow-md scale-105"
                                                : "hover:border-teal-400 shadow-2xs"
                                        } ${
                                            p.status === "OCCUPIED"
                                                ? "bg-emerald-500 text-white border-emerald-600"
                                                : p.status === "DAMAGED"
                                                ? "bg-red-500 text-white border-red-600"
                                                : p.status === "RESERVED"
                                                ? "bg-amber-500 text-white border-amber-600"
                                                : "bg-slate-100 text-slate-700 border-slate-300"
                                        }`}
                                    >
                                        <span className="text-[9px] uppercase font-bold opacity-80">Port</span>
                                        <span className="text-sm font-black font-mono">{p.port_number}</span>
                                        <span className="text-[8px] truncate max-w-full px-1 mt-0.5 font-medium">
                                            {p.status === "OCCUPIED"
                                                ? p.customer_name || "Pelanggan"
                                                : p.status === "DAMAGED"
                                                ? "Rusak"
                                                : p.status === "RESERVED"
                                                ? "Booking"
                                                : "Kosong"}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Form Edit Port Terpilih */}
                    {selectedPort && (
                        <form
                            onSubmit={handleSavePort}
                            className="p-4 bg-slate-50 border border-synerix-border rounded-2xl space-y-3 animate-in fade-in duration-150"
                        >
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                    <Cpu className="h-4 w-4 text-teal-600" />
                                    Konfigurasi Port {selectedPort.port_number}
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => setSelectedPort(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">Status Port</label>
                                    <CustomSelect
                                        options={portStatusOptions}
                                        value={portStatus}
                                        onChange={(val) => setPortStatus(val as PortStatus)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">Redaman Optik (dBm)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={opticalPower}
                                        onChange={(e) => setOpticalPower(e.target.value)}
                                        placeholder="Contoh: -18.5"
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                            </div>

                            {portStatus === "OCCUPIED" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1">ID Pelanggan</label>
                                        <input
                                            type="text"
                                            value={customerId}
                                            onChange={(e) => setCustomerId(e.target.value)}
                                            placeholder="Contoh: CUST-KDR-081"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1">Nama Pelanggan</label>
                                        <input
                                            type="text"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            placeholder="Contoh: Bpk. Hendra Pratama"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-slate-700 font-bold mb-1">Catatan Tambahan</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Warna patchcord, adapter, catatan teknisi..."
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setSelectedPort(null)}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                                >
                                    Tutup
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                    <span>Simpan Port {selectedPort.port_number}</span>
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
