"use client";

import { useState } from "react";
import { DismantleTask, DismantleStatus } from "@/lib/types/dismantle";
import { createClient } from "@/lib/supabase/client";
import BillingnesiaAutofillBanner from "@/components/ui/BillingnesiaAutofillBanner";
import { BillingnesiaScrapedData } from "@/lib/scraper/billingnesiaScraper";
import { syncDismantleToWorkLogs } from "@/lib/services/dismantleWorkLogSync";
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
    Receipt,
    User,
    Server,
    Ticket,
    Activity,
    CheckCircle2,
    Clock,
    FileText,
    Shield,
    Wifi,
    Barcode,
    Hash,
    Calendar,
    Mail,
    Send
} from "lucide-react";

interface AddDismantleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newTask: DismantleTask) => void;
}

type TabKey = "pribadi" | "instalasi" | "perangkat" | "tiket" | "gps";

export default function AddDismantleModal({
    isOpen,
    onClose,
    onSuccess,
}: AddDismantleModalProps) {
    const supabase = createClient();

    // Active Internal Tab
    const [activeTab, setActiveTab] = useState<TabKey>("pribadi");

    // 1. Identitas Pokok & Badges (Gambar 1)
    const [customerId, setCustomerId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [statusPelanggan, setStatusPelanggan] = useState("PELANGGAN AKTIF");
    const [badges, setBadges] = useState<string[]>([]);

    // 2. Data Pribadi (Gambar 1)
    const [registerDate, setRegisterDate] = useState("");
    const [idCardNumber, setIdCardNumber] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [phoneNumber2, setPhoneNumber2] = useState("");
    const [email, setEmail] = useState("");
    const [region, setRegion] = useState("Kabupaten Kediri");
    const [district, setDistrict] = useState("");
    const [village, setVillage] = useState("");
    const [hamlet, setHamlet] = useState("");
    const [address, setAddress] = useState("");
    const [marketer, setMarketer] = useState("");
    const [registrationNote, setRegistrationNote] = useState("");
    const [commitment, setCommitment] = useState("");

    // 3. Data Instalasi (Gambar 1)
    const [server, setServer] = useState("");
    const [ipAddress, setIpAddress] = useState("");
    const [pppoeUsername, setPppoeUsername] = useState("");
    const [pppoePassword, setPppoePassword] = useState("");
    const [parentOdpName, setParentOdpName] = useState("");
    const [cableOutdoor, setCableOutdoor] = useState("");
    const [cableIndoor, setCableIndoor] = useState("");
    const [clusterName, setClusterName] = useState("Mojoroto");

    // 4. Data Tiket (Gambar 3 - jika dari tiket)
    const [ticketId, setTicketId] = useState("");
    const [ticketCreator, setTicketCreator] = useState("");
    const [ticketType, setTicketType] = useState("TEKNIS");
    const [category, setCategory] = useState("MAINTENANCE RETAIL");
    const [ticketIndication, setTicketIndication] = useState("");
    const [ticketPic, setTicketPic] = useState("");
    const [ticketTag, setTicketTag] = useState("");

    // 5. Perangkat Dismantle & Finansial
    const [deviceType, setDeviceType] = useState("ONT ZTE F609");
    const [serialNumber, setSerialNumber] = useState("");
    const [macAddress, setMacAddress] = useState("");
    const [unpaidAmount, setUnpaidAmount] = useState<number>(0);
    const [billingUrl, setBillingUrl] = useState<string>("");

    // 6. Koordinat & Status Penugasan
    const [latitude, setLatitude] = useState<number>(-7.8231);
    const [longitude, setLongitude] = useState<number>(111.9174);
    const [taskStatus, setTaskStatus] = useState<DismantleStatus>("QUEUE");

    const [gettingLocation, setGettingLocation] = useState(false);
    const [saving, setSaving] = useState(false);

    // Handler data autofill dari On-Demand Scraper Billingnesia (Gambar 1 & Gambar 3)
    const handleAutofillData = (data: BillingnesiaScrapedData) => {
        // Identitas Pokok & Badges
        if (data.customer_id) setCustomerId(data.customer_id);
        if (data.customer_name) setCustomerName(data.customer_name);
        if (data.status_pelanggan) setStatusPelanggan(data.status_pelanggan);
        if (data.badges && data.badges.length > 0) setBadges(data.badges);

        // Data Pribadi (Gambar 1)
        if (data.register_date) setRegisterDate(data.register_date);
        if (data.id_card_number) setIdCardNumber(data.id_card_number);
        if (data.phone_number) setPhoneNumber(data.phone_number);
        if (data.phone_number_2) setPhoneNumber2(data.phone_number_2);
        if (data.email) setEmail(data.email);
        if (data.region) setRegion(data.region);
        if (data.district) setDistrict(data.district);
        if (data.village) setVillage(data.village);
        if (data.hamlet) setHamlet(data.hamlet);
        if (data.address) setAddress(data.address);
        if (data.marketer) setMarketer(data.marketer);
        if (data.registration_note) setRegistrationNote(data.registration_note);
        if (data.commitment) setCommitment(data.commitment);

        // Data Instalasi (Gambar 1)
        if (data.server) setServer(data.server);
        if (data.ip_address) setIpAddress(data.ip_address);
        if (data.pppoe_username) setPppoeUsername(data.pppoe_username);
        if (data.pppoe_password) setPppoePassword(data.pppoe_password);
        if (data.parent_odp) setParentOdpName(data.parent_odp);
        if (data.cable_outdoor) setCableOutdoor(data.cable_outdoor);
        if (data.cable_indoor) setCableIndoor(data.cable_indoor);

        // Auto deteksi nama cluster dari desa / server / alamat
        const locString = `${data.village || ""} ${data.server || ""} ${data.district || ""} ${data.address || ""}`.toLowerCase();
        if (locString.includes("pesantren")) setClusterName("Pesantren");
        else if (locString.includes("mojoroto")) setClusterName("Mojoroto");
        else if (locString.includes("kota")) setClusterName("Kota");
        else if (locString.includes("ngadiluwih") || locString.includes("banjarejo")) setClusterName("Ngadiluwih");
        else if (locString.includes("semen")) setClusterName("Semen");
        else if (locString.includes("gurah")) setClusterName("Gurah");
        else if (data.village) setClusterName(data.village);

        // Data Tiket (Gambar 3)
        if (data.ticket_id) setTicketId(data.ticket_id);
        if (data.ticket_creator) setTicketCreator(data.ticket_creator);
        if (data.ticket_type) setTicketType(data.ticket_type);
        if (data.category) setCategory(data.category);
        if (data.ticket_indication) setTicketIndication(data.ticket_indication);
        if (data.ticket_pic) setTicketPic(data.ticket_pic);
        if (data.ticket_tag) setTicketTag(data.ticket_tag);

        // Perangkat & Koordinat
        if (data.device_type) setDeviceType(data.device_type);
        if (data.latitude) setLatitude(data.latitude);
        if (data.longitude) setLongitude(data.longitude);
        if (data.unpaid_amount !== undefined) setUnpaidAmount(data.unpaid_amount);
        if (data.billing_url) setBillingUrl(data.billing_url);
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
            alert("Nama Pelanggan dan Alamat Rumah Lengkap wajib diisi!");
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
                serial_number: serialNumber.trim() || null,
                mac_address: macAddress.trim() || null,
                latitude,
                longitude,
                ticket_id: ticketId.trim() || null,
                unpaid_amount: unpaidAmount || 0,
                billing_url: billingUrl || null,
                status: taskStatus,
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

            // SINKRONISASI OTOMATIS KE DAFTAR PEKERJAAN (WORK LOGS):
            // "di bagian dismantle jika sudah scraping dan sudah ada progresnya juga otomatis masuk ke daftar pekerjaan
            //  kalau belum ada progre ya ngga usah dimasukan ke pekerjaan dulu."
            if (taskStatus !== "QUEUE") {
                await syncDismantleToWorkLogs(payload as DismantleTask, supabase);
            }

            onSuccess(payload as DismantleTask);
            onClose();

            // Reset form
            setCustomerId("");
            setCustomerName("");
            setPhoneNumber("");
            setPhoneNumber2("");
            setAddress("");
            setClusterName("Mojoroto");
            setParentOdpName("");
            setTicketId("");
            setUnpaidAmount(0);
            setBillingUrl("");
            setSerialNumber("");
            setMacAddress("");
            setTaskStatus("QUEUE");
            setActiveTab("pribadi");
        } catch (err: unknown) {
            alert("Terjadi kesalahan: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
                {/* Header Modal */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                            <Plus className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-slate-900 leading-tight">
                                Tambah Tugas Dismantle Baru
                            </h3>
                            <p className="text-xs text-slate-500">
                                Sesuai format data asli Billingnesia (Dapat diedit manual)
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-y-auto pr-1 flex-1 mt-3 space-y-3.5">
                    {/* Banner Tarik Data Otomatis dari Billingnesia */}
                    <BillingnesiaAutofillBanner
                        onDataFetched={handleAutofillData}
                        placeholder="Cari No. Tiket, ID Pelanggan, Nama, atau Desa..."
                    />

                    {/* Header Ringkasan Pelanggan Jika Terisi */}
                    {customerName && (
                        <div className="p-3 bg-gradient-to-r from-teal-50/70 via-slate-50 to-emerald-50/50 rounded-xl border border-teal-200/70 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm shrink-0">
                                    <User className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-sm text-slate-900">{customerName}</h4>
                                        {customerId && (
                                            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 font-semibold">
                                                {customerId}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 line-clamp-1">
                                        {address || "Alamat belum diisi"}
                                    </p>
                                </div>
                            </div>

                            {/* Badges dari Billingnesia (Gambar 1: ITN ON, PJK OFF, PELANGGAN AKTIF) */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {badges.map((b, idx) => (
                                    <span
                                        key={idx}
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            b.includes("ON")
                                                ? "bg-teal-100 text-teal-800 border border-teal-300/60"
                                                : b.includes("OFF")
                                                ? "bg-rose-100 text-rose-800 border border-rose-300/60"
                                                : "bg-emerald-100 text-emerald-800 border border-emerald-300/60"
                                        }`}
                                    >
                                        • {b}
                                    </span>
                                ))}
                                {ticketId && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300/60 font-mono">
                                        🎫 {ticketId}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Navigasi Tab Internal Form */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setActiveTab("pribadi")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                                activeTab === "pribadi"
                                    ? "bg-white text-teal-700 shadow-2xs font-bold"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <User className="w-3.5 h-3.5" />
                            <span>1. Data Pribadi</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("instalasi")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                                activeTab === "instalasi"
                                    ? "bg-white text-teal-700 shadow-2xs font-bold"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <Server className="w-3.5 h-3.5" />
                            <span>2. Data Instalasi</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("perangkat")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                                activeTab === "perangkat"
                                    ? "bg-white text-teal-700 shadow-2xs font-bold"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <Cpu className="w-3.5 h-3.5" />
                            <span>3. Perangkat & Tagihan</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("tiket")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                                activeTab === "tiket"
                                    ? "bg-white text-teal-700 shadow-2xs font-bold"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <Ticket className="w-3.5 h-3.5" />
                            <span>4. Info Tiket</span>
                            {ticketId && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("gps")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                                activeTab === "gps"
                                    ? "bg-white text-teal-700 shadow-2xs font-bold"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>5. GPS & Status</span>
                        </button>
                    </div>

                    <form id="add-dismantle-form" onSubmit={handleSubmit} className="space-y-3.5">
                        {/* TAB 1: DATA PRIBADI (Sesuai Gambar 1) */}
                        {activeTab === "pribadi" && (
                            <div className="space-y-3 animate-in fade-in-50">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            #ID Pelanggan (Wajib Unik)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: 0101010402102"
                                            value={customerId}
                                            onChange={(e) => setCustomerId(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Nama Lengkap Pelanggan *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Contoh: WINARNI"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Status Pelanggan
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="PELANGGAN AKTIF / TIDAK AKTIF"
                                            value={statusPelanggan}
                                            onChange={(e) => setStatusPelanggan(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Tanggal Daftar (Tgl Registrasi)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: 2026-09-29 10:58:19"
                                            value={registerDate}
                                            onChange={(e) => setRegisterDate(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            No. KTP (NIK)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: 3506044403560001"
                                            value={idCardNumber}
                                            onChange={(e) => setIdCardNumber(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            No. WA 1 (Kontak Utama)
                                        </label>
                                        <input
                                            type="tel"
                                            placeholder="085604994332"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            No. WA 2 / Telp Alternatif
                                        </label>
                                        <input
                                            type="tel"
                                            placeholder="085604994332"
                                            value={phoneNumber2}
                                            onChange={(e) => setPhoneNumber2(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Wilayah (Kabupaten/Kota)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Kabupaten Kediri"
                                            value={region}
                                            onChange={(e) => setRegion(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Kecamatan
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Kecamatan Ngadiluwih"
                                            value={district}
                                            onChange={(e) => setDistrict(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Desa / Kelurahan
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Banjarejo"
                                            value={village}
                                            onChange={(e) => setVillage(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Dusun / Lingkungan
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Kendaldoyong"
                                            value={hamlet}
                                            onChange={(e) => setHamlet(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Marketer / Sales
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="ASTERIX"
                                            value={marketer}
                                            onChange={(e) => setMarketer(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        Alamat Rumah Lengkap (Beserta RT/RW) *
                                    </label>
                                    <textarea
                                        rows={2}
                                        required
                                        placeholder="RT 01 RW 01, Dsn. Kendaldoyong, Ds. Banjarejo, Kec. Ngadiluwih"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none leading-relaxed"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Catatan Daftar
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Catatan saat registrasi"
                                            value={registrationNote}
                                            onChange={(e) => setRegistrationNote(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Komitmen
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Komitmen pelanggan"
                                            value={commitment}
                                            onChange={(e) => setCommitment(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: DATA INSTALASI & JARINGAN (Sesuai Gambar 1) */}
                        {activeTab === "instalasi" && (
                            <div className="space-y-3 animate-in fade-in-50">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Server POP Jaringan
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: BANJAREJO"
                                            value={server}
                                            onChange={(e) => setServer(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            IP Address Pelanggan
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: 192.168.127.26"
                                            value={ipAddress}
                                            onChange={(e) => setIpAddress(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Username PPPoE
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: 0101010402102"
                                            value={pppoeUsername}
                                            onChange={(e) => setPppoeUsername(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Password PPPoE
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: 02102026"
                                            value={pppoePassword}
                                            onChange={(e) => setPppoePassword(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            ODP (Parent ODP)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: ODP RIJAL"
                                            value={parentOdpName}
                                            onChange={(e) => setParentOdpName(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Kabel Outdoor
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: 25 m"
                                            value={cableOutdoor}
                                            onChange={(e) => setCableOutdoor(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Kabel Indoor
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: 7 m"
                                            value={cableIndoor}
                                            onChange={(e) => setCableIndoor(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        Nama Area / Cluster Operasional *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: Banjarejo / Mojoroto / Pesantren"
                                        value={clusterName}
                                        onChange={(e) => setClusterName(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB 3: SPESIFIKASI PERANGKAT & FINANSIAL */}
                        {activeTab === "perangkat" && (
                            <div className="space-y-3 animate-in fade-in-50">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                            <Cpu className="w-3.5 h-3.5 text-teal-600" /> Tipe / Merk ONT
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="ONT ZTE F609 / Huawei HG8245H5"
                                            value={deviceType}
                                            onChange={(e) => setDeviceType(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                            <Receipt className="w-3.5 h-3.5 text-rose-600" /> Total Tunggakan (Rp)
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={unpaidAmount}
                                            onChange={(e) => setUnpaidAmount(parseInt(e.target.value, 10) || 0)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Serial Number Perangkat (SN)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: ZTEGC9812A45"
                                            value={serialNumber}
                                            onChange={(e) => setSerialNumber(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            MAC Address
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: 00:1A:2B:3C:4D:5E"
                                            value={macAddress}
                                            onChange={(e) => setMacAddress(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none uppercase"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        URL Billingnesia Asli
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://billing.at-in.net/admin/..."
                                        value={billingUrl}
                                        onChange={(e) => setBillingUrl(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono text-slate-500 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB 4: INFO TIKET (Sesuai Gambar 3) */}
                        {activeTab === "tiket" && (
                            <div className="space-y-3 animate-in fade-in-50">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Nomor Tiket
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: TKT202609541217"
                                            value={ticketId}
                                            onChange={(e) => setTicketId(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            User Pembuat Tiket
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Fariellilrio Andreano"
                                            value={ticketCreator}
                                            onChange={(e) => setTicketCreator(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Jenis Tiket
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="TEKNIS"
                                            value={ticketType}
                                            onChange={(e) => setTicketType(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Kategori Tiket
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="MAINTENANCE RETAIL"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none uppercase"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        Keterangan / Indikasi Awal Tiket
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="down / kendala pelanggan"
                                        value={ticketIndication}
                                        onChange={(e) => setTicketIndication(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            PJ Awal (Penanggung Jawab)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Fariellilrio Andreano"
                                            value={ticketPic}
                                            onChange={(e) => setTicketPic(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            TAG Karyawan
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Tag karyawan"
                                            value={ticketTag}
                                            onChange={(e) => setTicketTag(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 5: GPS KOORDINAT & STATUS PENUGASAN */}
                        {activeTab === "gps" && (
                            <div className="space-y-3.5 animate-in fade-in-50">
                                {/* Pilihan Status Penugasan Awal (Aturan Sinkronisasi Pekerjaan) */}
                                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200">
                                    <label className="block text-xs font-bold text-teal-900 mb-1.5 flex items-center gap-1.5">
                                        <Activity className="w-4 h-4 text-teal-700" />
                                        Status Awal Tugas Dismantle
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setTaskStatus("QUEUE")}
                                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                                taskStatus === "QUEUE"
                                                    ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                                                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                                            }`}
                                        >
                                            <div className="font-bold text-xs flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" /> Antrean (Queue)
                                            </div>
                                            <div className={`text-[10px] mt-0.5 ${taskStatus === "QUEUE" ? "text-amber-100" : "text-slate-400"}`}>
                                                Belum ada progres (Tidak masuk pekerjaan)
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setTaskStatus("IN_PROGRESS")}
                                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                                taskStatus === "IN_PROGRESS"
                                                    ? "bg-teal-600 text-white border-teal-700 shadow-xs"
                                                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                                            }`}
                                        >
                                            <div className="font-bold text-xs flex items-center gap-1">
                                                <Activity className="w-3.5 h-3.5" /> Dikerjakan
                                            </div>
                                            <div className={`text-[10px] mt-0.5 ${taskStatus === "IN_PROGRESS" ? "text-teal-100" : "text-slate-400"}`}>
                                                Ada progres (Otomatis masuk pekerjaan)
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setTaskStatus("COMPLETED")}
                                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                                taskStatus === "COMPLETED"
                                                    ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                                                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                                            }`}
                                        >
                                            <div className="font-bold text-xs flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                                            </div>
                                            <div className={`text-[10px] mt-0.5 ${taskStatus === "COMPLETED" ? "text-emerald-100" : "text-slate-400"}`}>
                                                Dicabut (Otomatis masuk pekerjaan)
                                            </div>
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-teal-800/80 mt-2">
                                        💡 <span className="font-semibold">Aturan Otomatis:</span> Jika status dipilih <strong>Dikerjakan</strong> atau <strong>Selesai</strong>, tugas ini otomatis dicatat ke modul <strong>Pekerjaan Lapangan</strong>.
                                    </p>
                                </div>

                                {/* Koordinat GPS */}
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 uppercase">
                                            <MapPin className="w-3.5 h-3.5 text-teal-600" /> Titik Koordinat Pelanggan
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleGetCurrentLocation}
                                            disabled={gettingLocation}
                                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800 disabled:opacity-50 cursor-pointer"
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
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer Modal Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0 mt-3">
                    <div className="text-xs text-slate-500 hidden sm:block">
                        Status: <span className="font-bold text-teal-800">{taskStatus}</span>
                        {taskStatus !== "QUEUE" && " (Otomatis Sync ke Pekerjaan)"}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="add-dismantle-form"
                            disabled={saving}
                            className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-98 rounded-xl shadow-xs disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                            <Send className="w-3.5 h-3.5" />
                            <span>{saving ? "Menyimpan ke Supabase..." : "Simpan Tugas Dismantle"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
