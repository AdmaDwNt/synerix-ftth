"use client";

import { useState, useEffect } from "react";
import { DismantleTask } from "@/lib/types/dismantle";
import { createClient } from "@/lib/supabase/client";
import {
    Pencil,
    X,
    MapPin,
    Phone,
    Cpu,
    Home,
    Layers,
    Compass
} from "lucide-react";

interface EditDismantleModalProps {
    task: DismantleTask | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (updatedTask: DismantleTask) => void;
}

export default function EditDismantleModal({
    task,
    isOpen,
    onClose,
    onSuccess,
}: EditDismantleModalProps) {
    const supabase = createClient();

    const [customerId, setCustomerId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [address, setAddress] = useState("");
    const [clusterName, setClusterName] = useState("Mojoroto");
    const [parentOdpName, setParentOdpName] = useState("");
    const [deviceType, setDeviceType] = useState("ZTE F609");
    const [latitude, setLatitude] = useState<number>(-7.8231);
    const [longitude, setLongitude] = useState<number>(111.9174);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (task) {
            setCustomerId(task.customer_id || "");
            setCustomerName(task.customer_name || "");
            setPhoneNumber(task.phone_number || "");
            setAddress(task.address || "");
            setClusterName(task.cluster_name || "Mojoroto");
            setParentOdpName(task.parent_odp_name || "");
            setDeviceType(task.device_type || "ZTE F609");
            setLatitude(task.latitude ?? -7.8231);
            setLongitude(task.longitude ?? 111.9174);
        }
    }, [task]);

    if (!isOpen || !task) return null;

    // Ambil koordinat GPS saat ini
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Perangkat Anda tidak mendukung fitur Geolocation.");
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
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!customerName.trim() || !address.trim()) {
            alert("Nama Pelanggan dan Alamat Rumah wajib diisi!");
            return;
        }

        setSaving(true);
        try {
            const updated: DismantleTask = {
                ...task,
                customer_id: customerId.trim() || task.customer_id,
                customer_name: customerName.trim(),
                phone_number: phoneNumber.trim() || null,
                address: address.trim(),
                cluster_name: clusterName.trim() || "Umum",
                parent_odp_name: parentOdpName.trim() || null,
                device_type: deviceType.trim() || "ONT ZTE F609",
                latitude,
                longitude,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from("dismantle_tasks")
                .update({
                    customer_id: updated.customer_id,
                    customer_name: updated.customer_name,
                    phone_number: updated.phone_number,
                    address: updated.address,
                    cluster_name: updated.cluster_name,
                    parent_odp_name: updated.parent_odp_name,
                    device_type: updated.device_type,
                    latitude: updated.latitude,
                    longitude: updated.longitude,
                    updated_at: updated.updated_at,
                })
                .eq("id", task.id);

            if (error) {
                console.error("Gagal update data di Supabase:", error);
                throw new Error(error.message);
            }

            onSuccess(updated);
            onClose();
        } catch (err: unknown) {
            alert("Terjadi kesalahan: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                {/* Header Modal */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                            <Pencil className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-slate-900">
                                Edit Data Tugas Dismantle
                            </h3>
                            <p className="text-xs text-slate-500">
                                Ubah rincian informasi tiket pelanggan {task.customer_id}
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
                    {/* ID & Nama */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                ID Pelanggan
                            </label>
                            <input
                                type="text"
                                required
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Nama Lengkap Pelanggan *
                            </label>
                            <input
                                type="text"
                                required
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* No WA & Tipe Perangkat */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-teal-600" /> No. WhatsApp / HP
                            </label>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                <Cpu className="w-3.5 h-3.5 text-teal-600" /> Tipe / Merk ONT
                            </label>
                            <input
                                type="text"
                                value={deviceType}
                                onChange={(e) => setDeviceType(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Alamat */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                            <Home className="w-3.5 h-3.5 text-teal-600" /> Alamat Rumah Lengkap *
                        </label>
                        <textarea
                            rows={2}
                            required
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                    </div>

                    {/* Cluster & Parent ODP */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Nama Area / Cluster *
                            </label>
                            <input
                                type="text"
                                required
                                value={clusterName}
                                onChange={(e) => setClusterName(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                <Layers className="w-3.5 h-3.5 text-teal-600" /> Parent ODP
                            </label>
                            <input
                                type="text"
                                value={parentOdpName}
                                onChange={(e) => setParentOdpName(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Titik Koordinat GPS */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 uppercase">
                                <MapPin className="w-3.5 h-3.5 text-teal-600" /> Titik Koordinat Pelanggan
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
                                    required
                                    value={latitude}
                                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-semibold">Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    required
                                    value={longitude}
                                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tombol Aksi */}
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
