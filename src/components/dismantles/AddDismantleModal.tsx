"use client";

import { useState } from "react";
import { DismantleTask } from "@/lib/types/dismantle";
import { createClient } from "@/lib/supabase/client";
import BillingnesiaAutofillBanner from "@/components/ui/BillingnesiaAutofillBanner";
import { BillingnesiaScrapedData } from "@/lib/scraper/billingnesiaScraper";
import {
    Plus,
    X,
    MapPin,
    Navigation,
    Phone,
    Cpu,
    Home,
    Layers,
    Compass,
    Receipt
} from "lucide-react";

interface AddDismantleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newTask: DismantleTask) => void;
}

export default function AddDismantleModal({
    isOpen,
    onClose,
    onSuccess,
}: AddDismantleModalProps) {
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
    const [ticketId, setTicketId] = useState<string>("");
    const [unpaidAmount, setUnpaidAmount] = useState<number>(0);
    const [billingUrl, setBillingUrl] = useState<string>("");
    const [gettingLocation, setGettingLocation] = useState(false);
    const [saving, setSaving] = useState(false);

    // Handler data autofill dari On-Demand Scraper Billingnesia
    const handleAutofillData = (data: BillingnesiaScrapedData) => {
        if (data.customer_id) setCustomerId(data.customer_id);
        if (data.customer_name) setCustomerName(data.customer_name);
        if (data.phone_number) setPhoneNumber(data.phone_number);
        if (data.address) setAddress(data.address);
        if (data.device_type) setDeviceType(data.device_type);
        if (data.latitude) setLatitude(data.latitude);
        if (data.longitude) setLongitude(data.longitude);
        if (data.ticket_id) setTicketId(data.ticket_id);
        if (data.unpaid_amount) setUnpaidAmount(data.unpaid_amount);
        if (data.billing_url) setBillingUrl(data.billing_url);

        // Auto deteksi nama cluster dari alamat jika memungkinkan
        const addrLower = (data.address || "").toLowerCase();
        if (addrLower.includes("pesantren")) setClusterName("Pesantren");
        else if (addrLower.includes("mojoroto")) setClusterName("Mojoroto");
        else if (addrLower.includes("kota")) setClusterName("Kota");
        else if (addrLower.includes("semen")) setClusterName("Semen");
        else if (addrLower.includes("gurah")) setClusterName("Gurah");
    };

    if (!isOpen) return null;

    // Ambil GPS lokasi saat ini
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
            const finalCustomerId =
                customerId.trim() ||
                `CUST-KDR-${Math.floor(100 + Math.random() * 900)}`;

            const payload: Omit<DismantleTask, "distance_meters"> = {
                id: crypto.randomUUID(),
                customer_id: finalCustomerId,
                customer_name: customerName.trim(),
                phone_number: phoneNumber.trim() || null,
                address: address.trim(),
                cluster_name: clusterName.trim() || "Umum",
                parent_odp_name: parentOdpName.trim() || null,
                device_type: deviceType.trim() || "ONT ZTE F609",
                latitude,
                longitude,
                ticket_id: ticketId.trim() || null,
                unpaid_amount: unpaidAmount || 0,
                billing_url: billingUrl || null,
                status: "QUEUE",
                accessories: ["ADAPTOR", "PATCHCORD"],
                handover_status: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from("dismantle_tasks").insert([payload]);

            if (error) {
                console.error("Gagal simpan ke Supabase:", error);
                throw new Error(error.message);
            }

            onSuccess(payload as DismantleTask);
            onClose();

            // Reset form
            setCustomerId("");
            setCustomerName("");
            setPhoneNumber("");
            setAddress("");
            setClusterName("Mojoroto");
            setParentOdpName("");
            setTicketId("");
            setUnpaidAmount(0);
            setBillingUrl("");
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
                            <Plus className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-slate-900">
                                Tambah Tugas Dismantle Baru
                            </h3>
                            <p className="text-xs text-slate-500">
                                Input data penarikan ONT/STB dari pelanggan churn
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                    {/* Banner Tarik Data Otomatis dari Billingnesia */}
                    <BillingnesiaAutofillBanner
                        onDataFetched={handleAutofillData}
                        placeholder="Contoh: TKT202610014768 atau 0101010602040"
                    />

                    {/* Badge Info Tiket & Tunggakan (Jika ada dari Billingnesia) */}
                    {(ticketId || unpaidAmount > 0) && (
                        <div className="flex items-center justify-between p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-amber-800">
                                    {ticketId ? `Tiket: ${ticketId}` : "Terhubung ke Billingnesia"}
                                </span>
                            </div>
                            {unpaidAmount > 0 && (
                                <span className="font-semibold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-md text-[11px]">
                                    Tunggakan: Rp {unpaidAmount.toLocaleString("id-ID")}
                                </span>
                            )}
                        </div>
                    )}

                    {/* ID Pelanggan & Nama */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                ID Pelanggan (Opsional)
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: CUST-KDR-108"
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-400">
                                Kosongkan jika ingin digenerate otomatis
                            </span>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Nama Lengkap Pelanggan *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Bpk. Bambang / Ibu Siti"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* No. WhatsApp & Tipe Perangkat */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-teal-600" /> No. WhatsApp / HP
                            </label>
                            <input
                                type="tel"
                                placeholder="Contoh: 081234567890"
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
                                placeholder="ZTE F609 / Huawei HG8245H5"
                                value={deviceType}
                                onChange={(e) => setDeviceType(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Alamat Lengkap */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                            <Home className="w-3.5 h-3.5 text-teal-600" /> Alamat Rumah Lengkap *
                        </label>
                        <textarea
                            rows={2}
                            required
                            placeholder="Jl. Merbabu No. 14, Perum Mojoroto Indah Blok B"
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
                                placeholder="Mojoroto / Pesantren / Kota"
                                value={clusterName}
                                onChange={(e) => setClusterName(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                <Layers className="w-3.5 h-3.5 text-teal-600" /> Parent ODP (Opsional)
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: ODP-MHS-01"
                                value={parentOdpName}
                                onChange={(e) => setParentOdpName(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Koordinat GPS & Tombol Ambil Lokasi */}
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
                            {saving ? "Menyimpan ke Supabase..." : "Simpan Tugas"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
