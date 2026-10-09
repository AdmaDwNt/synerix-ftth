"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getGoogleMapsUrl } from "@/lib/ftth/distance";
import { resolveDisplayPhone } from "@/lib/utils/phoneHelper";
import type {
    BillingnesiaScrapedData,
    CustomerServiceItem,
    CustomerInvoiceItem,
    CustomerTicketItem,
    CustomerIsolirItem,
    CustomerLogItem,
    CustomerTabCounts,
} from "@/lib/scraper/billingnesiaScraper";
import {
    ArrowLeft,
    User,
    Server,
    Receipt,
    Ticket,
    Shield,
    Clock,
    Phone,
    MapPin,
    AlertCircle,
    RefreshCw,
    Eye,
} from "lucide-react";

type TabKey = "info_pribadi" | "layanan" | "invoice" | "tiket" | "isolir" | "log";

interface CustomerFullData {
    customer_id: string;
    customer_name: string;
    status_pelanggan: string;
    badges: string[];
    register_date: string;
    id_card_number: string;
    phone_number: string;
    phone_number_1: string;
    phone_number_2: string;
    email: string;
    region: string;
    district: string;
    village: string;
    hamlet: string;
    address: string;
    marketer: string;
    registration_note: string;
    commitment: string;

    server: string;
    ip_address: string;
    pppoe_username: string;
    pppoe_password: string;
    parent_odp: string;
    cable_outdoor: string;
    cable_indoor: string;
    device_type: string;
    latitude: number;
    longitude: number;

    ticket_id: string;
    ticket_creator: string;
    ticket_type: string;
    category: string;
    ticket_indication: string;
    ticket_pic: string;
    ticket_tag: string;
    ticket_progress_percent: string;

    unpaid_amount: number;
    billing_url: string;

    tab_counts: CustomerTabCounts;
    services: CustomerServiceItem[];
    invoices: CustomerInvoiceItem[];
    tickets: CustomerTicketItem[];
    isolirs: CustomerIsolirItem[];
    logs: CustomerLogItem[];
}

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const customerId = params?.id as string;

    const [activeTab, setActiveTab] = useState<TabKey>("info_pribadi");
    const [customer, setCustomer] = useState<CustomerFullData | null>(null);
    const [loading, setLoading] = useState(true);
    const [scraping, setScraping] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    // Bangun struktur CustomerFullData dari hasil scraping Billingnesia
    const buildFromScrapedData = useCallback(
        (scraped: BillingnesiaScrapedData): CustomerFullData => {
            const phone1 = scraped.phone_number_1 || scraped.phone_number || "";
            const phone2 = scraped.phone_number_2 || "";
            const resolvedPhone = resolveDisplayPhone(phone1, phone2) || scraped.phone_number || "";

            return {
                customer_id: scraped.customer_id || customerId,
                customer_name: scraped.customer_name || "Pelanggan",
                status_pelanggan: scraped.status_pelanggan || "PELANGGAN AKTIF",
                badges: scraped.badges || ["ITN ON", "PJK OFF", "PELANGGAN AKTIF"],
                register_date: scraped.register_date || "-",
                id_card_number: scraped.id_card_number || "-",
                phone_number: resolvedPhone,
                phone_number_1: phone1,
                phone_number_2: phone2,
                email: scraped.email || "-",
                region: scraped.region || "Kabupaten Kediri",
                district: scraped.district || "-",
                village: scraped.village || "-",
                hamlet: scraped.hamlet || "-",
                address: scraped.address || "-",
                marketer: scraped.marketer || "-",
                registration_note: scraped.registration_note || "-",
                commitment: scraped.commitment || "-",
                server: scraped.server || "-",
                ip_address: scraped.ip_address || "-",
                pppoe_username: scraped.pppoe_username || "-",
                pppoe_password: scraped.pppoe_password || "-",
                parent_odp: scraped.parent_odp || "-",
                cable_outdoor: scraped.cable_outdoor || "-",
                cable_indoor: scraped.cable_indoor || "-",
                device_type: scraped.device_type || "ONT ZTE F609",
                latitude: scraped.latitude || -7.8231,
                longitude: scraped.longitude || 111.9174,
                ticket_id: scraped.ticket_id || "",
                ticket_creator: scraped.ticket_creator || "-",
                ticket_type: scraped.ticket_type || "TEKNIS",
                category: scraped.category || "MAINTENANCE RETAIL",
                ticket_indication: scraped.ticket_indication || "-",
                ticket_pic: scraped.ticket_pic || "-",
                ticket_tag: scraped.ticket_tag || "-",
                ticket_progress_percent: scraped.ticket_progress_percent || "100%",
                unpaid_amount: scraped.unpaid_amount || 0,
                billing_url: scraped.billing_url || `https://billing.at-in.net/admin/data/detailpelanggan/${customerId}`,
                tab_counts: scraped.tab_counts || {
                    services: (scraped.services || []).length,
                    invoices: (scraped.invoices || []).length,
                    tickets: (scraped.tickets || []).length,
                    isolirs: (scraped.isolirs || []).length,
                    logs: (scraped.logs || []).length,
                },
                services: scraped.services || [],
                invoices: scraped.invoices || [],
                tickets: scraped.tickets || [],
                isolirs: scraped.isolirs || [],
                logs: scraped.logs || [],
            };
        },
        [customerId]
    );

    // Load data detail pelanggan dari live scraping Billingnesia
    useEffect(() => {
        if (!customerId) return;

        const load = async () => {
            setLoading(true);
            setError(null);

            // 1. Cek cache lokal di work_logs atau dismantle_tasks jika ada
            try {
                const { data: workLogRows } = await supabase
                    .from("work_logs")
                    .select("*")
                    .ilike("case_description", `%${customerId}%`)
                    .limit(1);

                if (workLogRows && workLogRows.length > 0) {
                    const row = workLogRows[0];
                    const metaIdx = row.case_description.indexOf("METADATA:");
                    if (metaIdx !== -1) {
                        try {
                            const meta = JSON.parse(row.case_description.slice(metaIdx + 9));
                            const fallbackData: BillingnesiaScrapedData = {
                                customer_id: meta.customer_id || customerId,
                                customer_name: meta.customer_name || row.title,
                                address: meta.address || "",
                                phone_number: meta.phone_number || "",
                                latitude: row.latitude || -7.8231,
                                longitude: row.longitude || 111.9174,
                                coordinates_found: Boolean(row.latitude),
                                unpaid_amount: 0,
                                device_type: "ONT ZTE F609",
                                billing_url: `https://billing.at-in.net/admin/data/detailpelanggan/${customerId}`,
                            };
                            setCustomer(buildFromScrapedData(fallbackData));
                            setLoading(false);
                        } catch {
                            // ignore json error
                        }
                    }
                }
            } catch {
                // ignore
            }

            // 2. Live Scrape Langsung dari Billingnesia (LENGKAP: Info Pribadi, Layanan, Invoice, Tiket, ISOLIR, Log)
            setScraping(true);
            try {
                const res = await fetch("/api/scraper/billingnesia", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ customer_id: customerId }),
                });

                const json = await res.json();

                if (!res.ok || !json.success || !json.data) {
                    throw new Error(json.error || `Data detail pelanggan ${customerId} tidak ditemukan di Billingnesia.`);
                }

                const fullData = json.data as BillingnesiaScrapedData;
                const enriched = buildFromScrapedData(fullData);
                setCustomer(enriched);
            } catch (err: unknown) {
                if (!customer) {
                    setError(err instanceof Error ? err.message : "Gagal memuat data pelanggan.");
                }
            } finally {
                setLoading(false);
                setScraping(false);
            }
        };

        load();
    }, [customerId, supabase, buildFromScrapedData]);

    if (loading && !customer) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
                    <p className="text-sm text-slate-600 font-medium">
                        Memuat data detail pelanggan #{customerId} dari Billingnesia...
                    </p>
                </div>
            </div>
        );
    }

    if (error && !customer) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4 max-w-md px-6">
                    <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
                    <h2 className="text-lg font-bold text-slate-800">Data Tidak Ditemukan</h2>
                    <p className="text-sm text-slate-500">{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali</span>
                    </button>
                </div>
            </div>
        );
    }

    if (!customer) return null;

    const isItnOn = customer.badges.some((b) => b.toUpperCase().includes("ITN ON"));
    const isPjkOn = customer.badges.some((b) => b.toUpperCase().includes("PJK ON"));
    const statusText = customer.status_pelanggan;
    const isAktif = statusText.includes("AKTIF") && !statusText.includes("TIDAK");
    const mapsUrl = customer.latitude && customer.longitude ? getGoogleMapsUrl(customer.latitude, customer.longitude) : null;

    const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
        { key: "info_pribadi", label: "Info Pribadi", icon: <User className="w-3.5 h-3.5" /> },
        { key: "layanan", label: "Layanan", icon: <Server className="w-3.5 h-3.5" />, count: customer.tab_counts.services },
        { key: "invoice", label: "Invoice", icon: <Receipt className="w-3.5 h-3.5" />, count: customer.tab_counts.invoices },
        { key: "tiket", label: "Tiket", icon: <Ticket className="w-3.5 h-3.5" />, count: customer.tab_counts.tickets },
        { key: "isolir", label: "ISOLIR", icon: <Shield className="w-3.5 h-3.5" />, count: customer.tab_counts.isolirs },
        { key: "log", label: "Log", icon: <Clock className="w-3.5 h-3.5" />, count: customer.tab_counts.logs },
    ];

    return (
        <div className="w-full px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-3.5 sm:space-y-5 max-w-7xl mx-auto">
            {/* Top Navigation & Live Sync Pill */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 sm:px-3 py-2 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali</span>
                    </button>
                    <div className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">
                        Pekerjaan / <span className="text-slate-700 font-bold">Detail Pelanggan Lengkap</span>
                    </div>
                </div>
                {scraping && (
                    <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs text-teal-700 bg-teal-50 px-2.5 py-1.5 rounded-lg animate-pulse shrink-0">
                        <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                        <span className="font-medium hidden xs:inline">Sinkronisasi data Billingnesia...</span>
                    </div>
                )}
            </div>

            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-teal-50/30 p-4 sm:p-6 border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shadow-teal-200/50 shrink-0">
                                <User className="w-5 h-5 sm:w-7 sm:h-7" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="font-extrabold text-base sm:text-xl text-slate-900 leading-tight break-words">
                                    {customer.customer_name}
                                </h1>
                                <div className="font-mono text-[11px] sm:text-xs text-slate-500 font-semibold mt-1 flex items-center flex-wrap gap-1.5">
                                    <span>#{customer.customer_id}</span>
                                    {customer.ticket_id && (
                                        <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-200">
                                            🎫 {customer.ticket_id}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-center">
                            <span
                                className={`text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full ${
                                    isItnOn
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300/70"
                                        : "bg-slate-100 text-slate-600 border border-slate-300/60"
                                }`}
                            >
                                ITN {isItnOn ? "ON" : "OFF"}
                            </span>
                            <span
                                className={`text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full ${
                                    isPjkOn
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300/70"
                                        : "bg-rose-100 text-rose-800 border border-rose-300/70"
                                }`}
                            >
                                PJK {isPjkOn ? "ON" : "OFF"}
                            </span>
                            <span
                                className={`text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full ${
                                    isAktif
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300/70"
                                        : "bg-slate-200 text-slate-700 border border-slate-300"
                                }`}
                            >
                                {statusText}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div
                    className="flex items-center gap-1 px-3 sm:px-6 py-2 overflow-x-auto text-xs font-semibold border-b border-slate-100 bg-white [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap shrink-0 transition-all cursor-pointer active:scale-95 ${
                                activeTab === tab.key
                                    ? "bg-teal-50 text-teal-800 border border-teal-300/80 font-bold shadow-xs"
                                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                            {tab.count != null && tab.count > 0 && (
                                <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                        activeTab === tab.key
                                            ? "bg-teal-200 text-teal-900"
                                            : "bg-slate-200 text-slate-600"
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-3.5 sm:p-6">
                    {/* TAB 1: INFO PRIBADI */}
                    {activeTab === "info_pribadi" && (
                        <div className="space-y-4 sm:space-y-5 animate-in fade-in-50">
                            {/* Data Pribadi */}
                            <div className="bg-slate-50/70 rounded-xl p-4 sm:p-5 border border-slate-200/80">
                                <div className="flex items-center gap-2 pb-2.5 mb-3.5 border-b border-slate-200">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-800">Data Pribadi</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3.5 gap-x-5 text-xs">
                                    <FieldItem label="#ID PELANGGAN" value={customer.customer_id} mono bold />
                                    <FieldItem label="TGL DAFTAR" value={customer.register_date} mono />
                                    <FieldItem label="STATUS" value={statusText} color={isAktif ? "emerald" : "rose"} bold />
                                    <FieldItem label="NO KTP" value={customer.id_card_number} mono />
                                    <FieldItem label="NAMA PELANGGAN" value={customer.customer_name} bold />
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">NO WA 1</span>
                                        {customer.phone_number_1 ? (
                                            <a
                                                href={`https://wa.me/${customer.phone_number_1.replace(/^0/, "62").replace(/\D/g, "")}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-mono text-emerald-700 hover:underline inline-flex items-center gap-1 font-semibold py-0.5"
                                            >
                                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>{customer.phone_number_1}</span>
                                            </a>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">NO WA 2 / TELP</span>
                                        {customer.phone_number_2 ? (
                                            <a
                                                href={`https://wa.me/${customer.phone_number_2.replace(/^0/, "62").replace(/\D/g, "")}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-mono text-sky-700 hover:underline inline-flex items-center gap-1 font-semibold py-0.5"
                                            >
                                                <Phone className="w-3.5 h-3.5 text-sky-600" />
                                                <span>{customer.phone_number_2}</span>
                                            </a>
                                        ) : (
                                            <span className="text-slate-400 font-mono">-</span>
                                        )}
                                    </div>
                                    <FieldItem label="EMAIL" value={customer.email} />
                                    <FieldItem label="WILAYAH" value={customer.region} />
                                    <FieldItem label="KECAMATAN" value={customer.district} />
                                    <FieldItem label="DESA" value={customer.village} />
                                    <FieldItem label="DUSUN" value={customer.hamlet} />
                                    <div className="sm:col-span-2">
                                        <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">ALAMAT LENGKAP</span>
                                        <div className="flex items-start gap-2">
                                            <span className="font-medium text-slate-900 leading-relaxed">{customer.address}</span>
                                            {mapsUrl && (
                                                <a
                                                    href={mapsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="Buka Titik Sharelok di Google Maps"
                                                    className="text-teal-600 hover:text-teal-800 p-1 hover:bg-teal-50 rounded shrink-0"
                                                >
                                                    <MapPin className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <FieldItem label="MARKETER" value={customer.marketer} bold />
                                    <FieldItem label="CATATAN DAFTAR" value={customer.registration_note} />
                                    <div className="sm:col-span-2">
                                        <FieldItem label="KOMITMEN" value={customer.commitment} />
                                    </div>
                                </div>
                            </div>

                            {/* Data Instalasi */}
                            <div className="bg-slate-50/70 rounded-xl p-4 sm:p-5 border border-slate-200/80">
                                <div className="flex items-center gap-2 pb-2.5 mb-3.5 border-b border-slate-200">
                                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                                        <Server className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-800">Data Instalasi</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3.5 gap-x-5 text-xs">
                                    <FieldItem label="SERVER" value={customer.server} bold />
                                    <FieldItem label="IP ADDRESS" value={customer.ip_address} mono color="sky" />
                                    <FieldItem label="USERNAME PPPOE" value={customer.pppoe_username} mono />
                                    <FieldItem label="PASSWORD PPPOE" value={customer.pppoe_password} mono />
                                    <FieldItem label="ODP" value={customer.parent_odp} mono bold />
                                    <FieldItem label="KABEL OUTDOOR" value={customer.cable_outdoor} mono />
                                    <FieldItem label="KABEL INDOOR" value={customer.cable_indoor} mono />
                                    <FieldItem label="TIPE PERANGKAT" value={customer.device_type} color="teal" bold />
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">TITIK KOORDINAT GPS</span>
                                        <span className="font-mono text-slate-700 text-[11px]">
                                            {customer.latitude ? `${customer.latitude.toFixed(6)}, ${customer.longitude?.toFixed(6)}` : "-"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: LAYANAN */}
                    {activeTab === "layanan" && (
                        <div className="animate-in fade-in-50">
                            <TabTableHeader icon={<Server className="w-4 h-4 text-teal-600" />} title="Daftar Layanan Pelanggan" count={customer.services.length} />
                            {customer.services.length > 0 ? (
                                <div className="rounded-xl border border-slate-200 overflow-x-auto bg-white shadow-xs">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                                                <th className="py-3 px-4">NAMA LAYANAN</th>
                                                <th className="py-3 px-3">HARGA</th>
                                                <th className="py-3 px-3">SIKLUS</th>
                                                <th className="py-3 px-3">PENERBITAN</th>
                                                <th className="py-3 px-3 text-center">STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {customer.services.map((s, i) => (
                                                <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="py-3 px-4 font-semibold text-slate-900">{s.name}</td>
                                                    <td className="py-3 px-3 font-mono text-slate-800">{s.price}</td>
                                                    <td className="py-3 px-3 text-slate-600">{s.cycle}</td>
                                                    <td className="py-3 px-3 text-slate-600">{s.issue_period}</td>
                                                    <td className="py-3 px-3 text-center">
                                                        <StatusBadge status={s.status} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <EmptyTabState label="layanan" scraping={scraping} />
                            )}
                        </div>
                    )}

                    {/* TAB 3: INVOICE */}
                    {activeTab === "invoice" && (
                        <div className="animate-in fade-in-50 space-y-3.5 sm:space-y-4">
                            <TabTableHeader icon={<Receipt className="w-4 h-4 text-rose-600" />} title="Riwayat Invoice" count={customer.invoices.length} />
                            {customer.invoices.length > 0 ? (
                                <div className="rounded-xl border border-slate-200 overflow-x-auto bg-white shadow-xs">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                                                <th className="py-3 px-4">NO INVOICE</th>
                                                <th className="py-3 px-3">PERIODE / LAYANAN</th>
                                                <th className="py-3 px-3">NOMINAL</th>
                                                <th className="py-3 px-3">JATUH TEMPO</th>
                                                <th className="py-3 px-3 text-center">STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {customer.invoices.map((inv, i) => (
                                                <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">{inv.invoice_no}</td>
                                                    <td className="py-3 px-3 text-slate-700">{inv.period}</td>
                                                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">{inv.amount}</td>
                                                    <td className="py-3 px-3 font-mono text-slate-600">{inv.due_date}</td>
                                                    <td className="py-3 px-3 text-center">
                                                        <StatusBadge status={inv.status} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <EmptyTabState label="invoice" scraping={scraping} />
                            )}
                        </div>
                    )}

                    {/* TAB 4: TIKET (Sesuai Poin 8 Pengembangan.md: #ID, TGL DIBUAT, TINDAKAN TERAKHIR, %, STATUS, AKSI) */}
                    {activeTab === "tiket" && (
                        <div className="animate-in fade-in-50">
                            <TabTableHeader icon={<Ticket className="w-4 h-4 text-amber-600" />} title="Riwayat Tiket Pelanggan" count={customer.tickets.length} />
                            {customer.tickets.length > 0 ? (
                                <div className="rounded-xl border border-slate-200 overflow-x-auto bg-white shadow-xs">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                                                <th className="py-3 px-4">#ID</th>
                                                <th className="py-3 px-3">TGL DIBUAT</th>
                                                <th className="py-3 px-3">TINDAKAN TERAKHIR</th>
                                                <th className="py-3 px-2 text-center">%</th>
                                                <th className="py-3 px-3 text-center">STATUS</th>
                                                <th className="py-3 px-3 text-center">AKSI</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {customer.tickets.map((t, i) => (
                                                <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <Link
                                                            href={`/dismantles/tickets/${encodeURIComponent(t.ticket_id)}?customer_id=${encodeURIComponent(customerId)}`}
                                                            className="font-mono font-bold text-teal-700 hover:text-teal-900 hover:underline"
                                                            title="Buka Detail Tiket"
                                                        >
                                                            {t.ticket_id}
                                                        </Link>
                                                    </td>
                                                    <td className="py-3 px-3 font-mono text-slate-600">{t.created_at}</td>
                                                    <td className="py-3 px-3 text-slate-700 max-w-[260px] truncate" title={t.last_action}>
                                                        {t.last_action}
                                                    </td>
                                                    <td className="py-3 px-2 text-center">
                                                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">
                                                            {t.progress}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-center">
                                                        <StatusBadge status={t.status} />
                                                    </td>
                                                    <td className="py-3 px-3 text-center">
                                                        <Link
                                                            href={`/dismantles/tickets/${encodeURIComponent(t.ticket_id)}?customer_id=${encodeURIComponent(customerId)}`}
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors inline-block"
                                                            title="Lihat Detail Tiket"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <EmptyTabState label="tiket" scraping={scraping} />
                            )}
                        </div>
                    )}

                    {/* TAB 5: ISOLIR */}
                    {activeTab === "isolir" && (
                        <div className="animate-in fade-in-50">
                            <TabTableHeader icon={<Shield className="w-4 h-4 text-rose-600" />} title="Riwayat Isolir" count={customer.isolirs.length} />
                            {customer.isolirs.length > 0 ? (
                                <div className="rounded-xl border border-slate-200 overflow-x-auto bg-white shadow-xs">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                                                <th className="py-3 px-4">TGL DIISOLIR</th>
                                                <th className="py-3 px-3">TGL DIBUKA</th>
                                                <th className="py-3 px-3">ALASAN / TINDAKAN</th>
                                                <th className="py-3 px-3 text-center">STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {customer.isolirs.map((iso, i) => (
                                                <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="py-3 px-4 font-mono text-slate-600">{iso.isolated_date}</td>
                                                    <td className="py-3 px-3 font-mono text-slate-600">{iso.reopened_date}</td>
                                                    <td className="py-3 px-3 text-slate-700">{iso.reason}</td>
                                                    <td className="py-3 px-3 text-center">
                                                        <StatusBadge status={iso.status} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <EmptyTabState label="isolir" scraping={scraping} />
                            )}
                        </div>
                    )}

                    {/* TAB 6: LOG */}
                    {activeTab === "log" && (
                        <div className="animate-in fade-in-50">
                            <TabTableHeader icon={<Clock className="w-4 h-4 text-slate-600" />} title="Log Aktivitas Pelanggan" count={customer.logs.length} />
                            {customer.logs.length > 0 ? (
                                <div className="rounded-xl border border-slate-200 overflow-x-auto bg-white shadow-xs">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                                                <th className="py-3 px-4 w-[160px]">TANGGAL</th>
                                                <th className="py-3 px-3 w-[180px]">USER / SISTEM</th>
                                                <th className="py-3 px-3">AKTIVITAS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {customer.logs.map((log, i) => (
                                                <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="py-3 px-4 font-mono text-slate-600">{log.date}</td>
                                                    <td className="py-3 px-3 font-semibold text-slate-800">{log.user}</td>
                                                    <td className="py-3 px-3 text-slate-700 leading-relaxed">{log.activity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <EmptyTabState label="log" scraping={scraping} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Sub-components
function FieldItem({
    label,
    value,
    mono,
    bold,
    color,
}: {
    label: string;
    value?: string | number | null;
    mono?: boolean;
    bold?: boolean;
    color?: "emerald" | "rose" | "sky" | "teal";
}) {
    const val = value != null && String(value).trim() !== "" ? String(value) : "-";
    const colorClasses = {
        emerald: "text-emerald-700 font-bold",
        rose: "text-rose-700 font-bold",
        sky: "text-sky-700 font-semibold",
        teal: "text-teal-700 font-semibold",
    };

    return (
        <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">{label}</span>
            <span
                className={`text-slate-900 block ${mono ? "font-mono" : ""} ${bold ? "font-bold" : "font-medium"} ${
                    color ? colorClasses[color] : ""
                }`}
            >
                {val}
            </span>
        </div>
    );
}

function TabTableHeader({
    icon,
    title,
    count,
}: {
    icon: React.ReactNode;
    title: string;
    count?: number;
}) {
    return (
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
                {icon}
                <h3 className="font-bold text-xs sm:text-sm text-slate-800">{title}</h3>
                {count != null && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                        {count} data
                    </span>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = (status || "").toUpperCase();
    let bg = "bg-slate-100 text-slate-700 border-slate-200";

    if (s.includes("AKTIF") || s.includes("LUNAS") || s.includes("SELESAI") || s.includes("DONE") || s.includes("ACTIVE")) {
        bg = "bg-emerald-50 text-emerald-800 border-emerald-200";
    } else if (s.includes("JATUH") || s.includes("TEMPO") || s.includes("UNPAID") || s.includes("ISOLIR") || s.includes("SUSPEND")) {
        bg = "bg-rose-50 text-rose-800 border-rose-200";
    } else if (s.includes("PROGRESS") || s.includes("PENDING") || s.includes("SURVEI")) {
        bg = "bg-amber-50 text-amber-800 border-amber-200";
    }

    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono ${bg}`}>
            {status || "-"}
        </span>
    );
}

function EmptyTabState({ label, scraping }: { label: string; scraping: boolean }) {
    return (
        <div className="text-center py-8 text-slate-400 space-y-2">
            {scraping ? (
                <>
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-600" />
                    <p className="text-xs">Menyinkronkan data {label} dari Billingnesia...</p>
                </>
            ) : (
                <p className="text-xs">Belum ada data {label} tercatat untuk pelanggan ini di Billingnesia.</p>
            )}
        </div>
    );
}
