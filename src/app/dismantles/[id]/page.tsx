"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { DismantleTask } from "@/lib/types/dismantle";
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
    ExternalLink,
    AlertCircle,
    RefreshCw,
    Globe,
    FileText,
    Activity,
    Eye,
    ChevronRight,
} from "lucide-react";

type TabKey = "info_pribadi" | "layanan" | "invoice" | "tiket" | "isolir" | "log";

interface CustomerFullData {
    // Basic identity
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

    // Installation
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

    // Ticket
    ticket_id: string;
    ticket_creator: string;
    ticket_type: string;
    category: string;
    ticket_indication: string;
    ticket_pic: string;
    ticket_tag: string;
    ticket_progress_percent: string;

    // Financials
    unpaid_amount: number;
    billing_url: string;

    // Tab data
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

    // Build customer data from task + metadata + live scrape
    const buildCustomerData = useCallback(
        (task: DismantleTask, scrapedData?: BillingnesiaScrapedData | null): CustomerFullData => {
            let metadata: Record<string, unknown> = {};
            const metaStr = task.accessories?.find((a: string) => a.startsWith("METADATA:"));
            if (metaStr) {
                try {
                    metadata = JSON.parse(metaStr.replace("METADATA:", ""));
                } catch {
                    metadata = {};
                }
            }

            const phone1 = (scrapedData?.phone_number_1 || metadata.phone_number_1 || task.phone_number || "") as string;
            const phone2 = (scrapedData?.phone_number_2 || metadata.phone_number_2 || "") as string;
            const resolvedPhone = resolveDisplayPhone(phone1, phone2) || task.phone_number || "";

            return {
                customer_id: task.customer_id || customerId,
                customer_name: scrapedData?.customer_name || task.customer_name || "Pelanggan",
                status_pelanggan: scrapedData?.status_pelanggan || (metadata.status_pelanggan as string) || "PELANGGAN AKTIF",
                badges: scrapedData?.badges || (metadata.badges as string[]) || ["ITN ON", "PJK OFF", "PELANGGAN AKTIF"],
                register_date: scrapedData?.register_date || (metadata.register_date as string) || "-",
                id_card_number: scrapedData?.id_card_number || (metadata.id_card_number as string) || "-",
                phone_number: resolvedPhone,
                phone_number_1: phone1,
                phone_number_2: phone2,
                email: scrapedData?.email || (metadata.email as string) || "-",
                region: scrapedData?.region || (metadata.region as string) || "Kabupaten Kediri",
                district: scrapedData?.district || (metadata.district as string) || "-",
                village: scrapedData?.village || (metadata.village as string) || task.cluster_name || "-",
                hamlet: scrapedData?.hamlet || (metadata.hamlet as string) || "-",
                address: scrapedData?.address || task.address || "-",
                marketer: scrapedData?.marketer || (metadata.marketer as string) || "-",
                registration_note: scrapedData?.registration_note || (metadata.registration_note as string) || "-",
                commitment: scrapedData?.commitment || (metadata.commitment as string) || "-",
                server: scrapedData?.server || (metadata.server as string) || task.cluster_name || "-",
                ip_address: scrapedData?.ip_address || (metadata.ip_address as string) || "-",
                pppoe_username: scrapedData?.pppoe_username || (metadata.pppoe_username as string) || "-",
                pppoe_password: scrapedData?.pppoe_password || (metadata.pppoe_password as string) || "-",
                parent_odp: scrapedData?.parent_odp || task.parent_odp_name || (metadata.parent_odp as string) || "-",
                cable_outdoor: scrapedData?.cable_outdoor || (metadata.cable_outdoor as string) || "-",
                cable_indoor: scrapedData?.cable_indoor || (metadata.cable_indoor as string) || "-",
                device_type: scrapedData?.device_type || task.device_type || "ONT ZTE F609",
                latitude: scrapedData?.latitude || task.latitude || -7.8231,
                longitude: scrapedData?.longitude || task.longitude || 111.9174,
                ticket_id: scrapedData?.ticket_id || task.ticket_id || "",
                ticket_creator: scrapedData?.ticket_creator || (metadata.ticket_creator as string) || "-",
                ticket_type: scrapedData?.ticket_type || (metadata.ticket_type as string) || "TEKNIS",
                category: scrapedData?.category || (metadata.category as string) || "MAINTENANCE RETAIL",
                ticket_indication: scrapedData?.ticket_indication || (metadata.ticket_indication as string) || "-",
                ticket_pic: scrapedData?.ticket_pic || (metadata.ticket_pic as string) || "-",
                ticket_tag: scrapedData?.ticket_tag || (metadata.ticket_tag as string) || "-",
                ticket_progress_percent: scrapedData?.ticket_progress_percent || (metadata.ticket_progress_percent as string) || "100%",
                unpaid_amount: scrapedData?.unpaid_amount || task.unpaid_amount || 0,
                billing_url: scrapedData?.billing_url || task.billing_url || "",
                tab_counts: scrapedData?.tab_counts || (metadata.tab_counts as CustomerTabCounts) || {
                    services: (scrapedData?.services || (metadata.services as CustomerServiceItem[]) || []).length,
                    invoices: (scrapedData?.invoices || (metadata.invoices as CustomerInvoiceItem[]) || []).length,
                    tickets: (scrapedData?.tickets || (metadata.tickets as CustomerTicketItem[]) || []).length,
                    isolirs: (scrapedData?.isolirs || (metadata.isolirs as CustomerIsolirItem[]) || []).length,
                    logs: (scrapedData?.logs || (metadata.logs as CustomerLogItem[]) || []).length,
                },
                services: scrapedData?.services || (metadata.services as CustomerServiceItem[]) || [],
                invoices: scrapedData?.invoices || (metadata.invoices as CustomerInvoiceItem[]) || [],
                tickets: scrapedData?.tickets || (metadata.tickets as CustomerTicketItem[]) || [],
                isolirs: scrapedData?.isolirs || (metadata.isolirs as CustomerIsolirItem[]) || [],
                logs: scrapedData?.logs || (metadata.logs as CustomerLogItem[]) || [],
            };
        },
        [customerId]
    );

    // Load from Supabase then scrape live data
    useEffect(() => {
        if (!customerId) return;

        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                // 1. Fetch from Supabase jika ada di dismantle_tasks
                const { data: tasks } = await supabase
                    .from("dismantle_tasks")
                    .select("*")
                    .eq("customer_id", customerId)
                    .order("created_at", { ascending: false })
                    .limit(1);

                const task = tasks && tasks.length > 0
                    ? (tasks[0] as DismantleTask)
                    : ({
                        id: customerId,
                        customer_id: customerId,
                        customer_name: "Pelanggan",
                        phone_number: null,
                        address: "-",
                        cluster_name: "Umum",
                        parent_odp_name: null,
                        device_type: "ONT ZTE F609",
                        latitude: -7.8231,
                        longitude: 111.9174,
                        distance_meters: 0,
                        status: "QUEUE",
                        ticket_id: null,
                        unpaid_amount: 0,
                        billing_url: `https://billing.at-in.net/admin/data/detailpelanggan/${customerId}`,
                        accessories: [],
                        handover_status: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    } as DismantleTask);

                const initialData = buildCustomerData(task, null);
                setCustomer(initialData);
                setLoading(false);

                // 2. Live scrape from Billingnesia for full tab data
                setScraping(true);
                try {
                    const res = await fetch("/api/scraper/billingnesia", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ customer_id: customerId }),
                    });

                    if (res.ok) {
                        const json = await res.json();
                        if (json.success && json.data) {
                            const enrichedData = buildCustomerData(task, json.data as BillingnesiaScrapedData);
                            setCustomer(enrichedData);
                        }
                    }
                } catch (scrapeErr) {
                    console.warn("[Detail Page] Live scrape gagal:", scrapeErr);
                } finally {
                    setScraping(false);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Gagal memuat data pelanggan.");
                setLoading(false);
            }
        };

        load();
    }, [customerId, supabase, buildCustomerData]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
                    <p className="text-sm text-slate-600 font-medium">Memuat data pelanggan...</p>
                </div>
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4 max-w-md px-6">
                    <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
                    <h2 className="text-lg font-bold text-slate-800">Data Tidak Ditemukan</h2>
                    <p className="text-sm text-slate-500">{error || "Pelanggan tidak ditemukan."}</p>
                    <button
                        onClick={() => router.push("/dismantles")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Daftar Dismantle
                    </button>
                </div>
            </div>
        );
    }

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
            {/* Navigation & Live Sync Pill */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <button
                        onClick={() => router.push("/dismantles")}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 sm:px-3 py-2 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali</span>
                    </button>
                    <div className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">
                        Dismantle / <span className="text-slate-700 font-bold">Detail Pelanggan</span>
                    </div>
                </div>
                {scraping && (
                    <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs text-teal-700 bg-teal-50 px-2.5 py-1.5 rounded-lg animate-pulse shrink-0">
                        <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                        <span className="font-medium hidden xs:inline">Sinkronisasi data...</span>
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

                {/* Tab Navigation (Touch-friendly & Smooth horizontal scrolling for iOS/Android) */}
                <div
                    className="flex items-center gap-1 px-3 sm:px-6 py-2 overflow-x-auto text-xs font-semibold border-b border-slate-100 bg-white"
                    style={{ WebkitOverflowScrolling: "touch" }}
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
                    {/* TAB: INFO PRIBADI */}
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
                                                    title="Buka di Google Maps"
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

                    {/* TAB: LAYANAN */}
                    {activeTab === "layanan" && (
                        <div className="animate-in fade-in-50">
                            <TabTableHeader icon={<Server className="w-4 h-4 text-teal-600" />} title="Daftar Layanan Pelanggan" count={customer.services.length} />
                            {customer.services.length > 0 ? (
                                <>
                                    {/* Mobile Cards View (Android & iOS) */}
                                    <div className="block sm:hidden space-y-2.5">
                                        {customer.services.map((s, i) => (
                                            <div key={i} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="font-bold text-slate-900 text-xs leading-snug">{s.name}</h4>
                                                    <StatusBadge status={s.status} />
                                                </div>
                                                <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 block font-semibold">HARGA</span>
                                                        <span className="font-mono font-bold text-teal-800 text-sm">Rp {s.price}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] text-slate-400 block font-semibold">SIKLUS / TERBIT</span>
                                                        <span className="text-slate-600 text-[11px]">{s.cycle} · {s.issue_period}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="hidden sm:block rounded-xl border border-slate-200 overflow-x-auto bg-white shadow-xs">
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
                                </>
                            ) : (
                                <EmptyTabState label="layanan" scraping={scraping} />
                            )}
                        </div>
                    )}

                    {/* TAB: INVOICE */}
                    {activeTab === "invoice" && (
                        <div className="animate-in fade-in-50 space-y-3.5 sm:space-y-4">
                            {/* Summary cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="bg-gradient-to-br from-white to-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
                                    <span className="text-[11px] font-semibold text-slate-500 block">Total Tunggakan Aktif</span>
                                    <span className="font-extrabold text-lg sm:text-xl text-rose-600 font-mono block mt-1">
                                        Rp {customer.unpaid_amount.toLocaleString("id-ID")}
                                    </span>
                                    <span
                                        className={`inline-block mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                            customer.unpaid_amount > 0
                                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                        }`}
                                    >
                                        {customer.unpaid_amount > 0 ? "Ada Tunggakan" : "Lunas"}
                                    </span>
                                </div>
                                <div className="bg-gradient-to-br from-white to-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
                                    <span className="text-[11px] font-semibold text-slate-500 block">Total Invoice Tercatat</span>
                                    <span className="font-extrabold text-lg sm:text-xl text-slate-800 font-mono block mt-1">
                                        {customer.invoices.length}
                                    </span>
                                    <span className="text-[10px] text-slate-400 mt-1 block">
                                        Lunas: {customer.invoices.filter((v) => v.status.includes("LUNAS")).length} · Unpaid: {customer.invoices.filter((v) => !v.status.includes("LUNAS")).length}
                                    </span>
                                </div>
                            </div>

                            <TabTableHeader icon={<Receipt className="w-4 h-4 text-rose-600" />} title="Riwayat Invoice" count={customer.invoices.length} />
                            {customer.invoices.length > 0 ? (
                                <>
                                    {/* Mobile Cards View (Android & iOS) */}
                                    <div className="block sm:hidden space-y-2.5">
                                        {customer.invoices.map((inv, i) => (
                                            <div key={i} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                                        {inv.invoice_no}
                                                    </span>
                                                    <StatusBadge status={inv.status} />
                                                </div>
                                                <p className="text-xs text-slate-600 leading-snug font-medium line-clamp-2">
                                                    {inv.period}
                                                </p>
                                                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 block font-semibold">TAGIHAN</span>
                                                        <span className="font-mono font-extrabold text-slate-900 text-sm">{inv.amount}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] text-slate-400 block font-semibold">JATUH TEMPO</span>
                                                        <span className="font-mono text-slate-600 text-[11px]">{inv.due_date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="hidden sm:block rounded-xl border border-slate-200 overflow-x-auto bg-white shadow-xs">
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
                                </>
                            ) : (
                                <EmptyTabState label="invoice" scraping={scraping} />
                            )}
                        </div>
                    )}

                    {/* TAB: TIKET */}
                    {activeTab === "tiket" && (
                        <div className="animate-in fade-in-50">
                            <TabTableHeader icon={<Ticket className="w-4 h-4 text-amber-600" />} title="Riwayat Tiket Pelanggan" count={customer.tickets.length} />
                            {customer.tickets.length > 0 ? (
                                <>
                                    {/* Mobile Cards View (Android & iOS) */}
                                    <div className="block sm:hidden space-y-3">
                                        {customer.tickets.map((t, i) => (
                                            <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <Link
                                                        href={`/dismantles/tickets/${encodeURIComponent(t.ticket_id)}?customer_id=${encodeURIComponent(customerId)}`}
                                                        className="font-mono font-bold text-xs text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg inline-block transition-colors"
                                                        title="Buka Halaman Detail Tiket"
                                                    >
                                                        {t.ticket_id}
                                                    </Link>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">
                                                            {t.progress}
                                                        </span>
                                                        <StatusBadge status={t.status} />
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed">
                                                    <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">TINDAKAN TERAKHIR:</span>
                                                    {t.last_action}
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                                                    <span className="font-mono text-slate-400">Dibuat: {t.created_at}</span>
                                                    <Link
                                                        href={`/dismantles/tickets/${encodeURIComponent(t.ticket_id)}?customer_id=${encodeURIComponent(customerId)}`}
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors active:scale-95"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>Detail Tiket</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="hidden sm:block rounded-xl border border-slate-200 overflow-x-auto bg-white shadow-xs">
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
                                                                className="font-mono font-bold text-teal-700 hover:text-teal-900 hover:underline block"
                                                                title="Buka Halaman Detail Tiket"
                                                            >
                                                                {t.ticket_id}
                                                            </Link>
                                                        </td>
                                                        <td className="py-3 px-3 font-mono text-slate-600">{t.created_at}</td>
                                                        <td className="py-3 px-3 text-slate-800 font-medium">{t.last_action}</td>
                                                        <td className="py-3 px-2 text-center">
                                                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">
                                                                {t.progress}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3 text-center">
                                                            <StatusBadge status={t.status} />
                                                        </td>
                                                        <td className="py-3 px-3 text-center">
                                                            <Link
                                                                href={`/dismantles/tickets/${encodeURIComponent(t.ticket_id)}?customer_id=${encodeURIComponent(customerId)}`}
                                                                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-teal-600 hover:text-white inline-flex items-center justify-center transition-colors shadow-xs"
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
                                </>
                            ) : (
                                <EmptyTabState label="tiket" scraping={scraping} />
                            )}
                        </div>
                    )}

                    {/* TAB: ISOLIR */}
                    {activeTab === "isolir" && (
                        <div className="animate-in fade-in-50">
                            <TabTableHeader icon={<Shield className="w-4 h-4 text-rose-600" />} title="Riwayat Isolir Pelanggan" count={customer.isolirs.length} />
                            {customer.isolirs.length > 0 ? (
                                <>
                                    {/* Mobile Cards View (Android & iOS) */}
                                    <div className="block sm:hidden space-y-2.5">
                                        {customer.isolirs.map((iso, i) => (
                                            <div key={i} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-mono text-xs text-slate-800 font-bold">
                                                        {iso.isolated_date}
                                                    </span>
                                                    <StatusBadge status={iso.status} />
                                                </div>
                                                <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                    <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">KETERANGAN / TINDAKAN:</span>
                                                    {iso.reason || "-"}
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                                    <span>Tgl Buka Kembali:</span>
                                                    <span className="font-mono font-medium text-slate-700">{iso.reopened_date || "-"}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="hidden sm:block rounded-xl border border-slate-200 overflow-x-auto bg-white shadow-xs">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                                                    <th className="py-3 px-4">TGL ISOLIR</th>
                                                    <th className="py-3 px-3">TGL BUKA</th>
                                                    <th className="py-3 px-3">KETERANGAN</th>
                                                    <th className="py-3 px-3 text-center">STATUS</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {customer.isolirs.map((iso, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                                                        <td className="py-3 px-4 font-mono text-slate-800">{iso.isolated_date}</td>
                                                        <td className="py-3 px-3 font-mono text-slate-600">{iso.reopened_date || "-"}</td>
                                                        <td className="py-3 px-3 text-slate-700">{iso.reason || "-"}</td>
                                                        <td className="py-3 px-3 text-center">
                                                            <StatusBadge status={iso.status} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <EmptyTabState label="isolir" scraping={scraping} />
                            )}
                        </div>
                    )}

                    {/* TAB: LOG */}
                    {activeTab === "log" && (
                        <div className="animate-in fade-in-50">
                            <TabTableHeader icon={<Activity className="w-4 h-4 text-indigo-600" />} title="Log Aktivitas Pelanggan" count={customer.logs.length} />
                            {customer.logs.length > 0 ? (
                                <>
                                    {/* Mobile Cards View (Android & iOS) */}
                                    <div className="block sm:hidden space-y-2">
                                        {customer.logs.map((log, i) => (
                                            <div key={i} className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-mono text-[11px] text-slate-400">{log.date}</span>
                                                    <span className="font-semibold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                                        {log.user}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-800 font-medium leading-relaxed">{log.activity}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="hidden sm:block rounded-xl border border-slate-200 overflow-x-auto bg-white shadow-xs">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                                                    <th className="py-3 px-4">TANGGAL</th>
                                                    <th className="py-3 px-3">USER</th>
                                                    <th className="py-3 px-3">AKTIVITAS</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {customer.logs.map((log, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                                                        <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">{log.date}</td>
                                                        <td className="py-3 px-3 font-semibold text-slate-800">{log.user}</td>
                                                        <td className="py-3 px-3 text-slate-700">{log.activity}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <EmptyTabState label="log aktivitas" scraping={scraping} />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer actions (Responsive Pill Buttons for Touch Devices) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1 pb-3">
                {mapsUrl ? (
                    <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50/80 hover:bg-teal-100/80 sm:bg-transparent px-3 py-2.5 sm:py-1 rounded-xl transition-colors active:scale-95"
                    >
                        <MapPin className="w-4 h-4 text-teal-600" />
                        <span>Buka Lokasi di Google Maps</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                ) : (
                    <div />
                )}
                {customer.billing_url && (
                    <a
                        href={customer.billing_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-sky-700 bg-sky-50/80 hover:bg-sky-100/80 sm:bg-transparent px-3 py-2.5 sm:py-1 rounded-xl transition-colors active:scale-95"
                    >
                        <Globe className="w-4 h-4 text-sky-600" />
                        <span>Buka di Billingnesia</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                )}
            </div>
        </div>
    );
}

/* ── Helper Components ──────────────────────────────────────────────── */

function FieldItem({
    label,
    value,
    mono,
    bold,
    color,
}: {
    label: string;
    value: string;
    mono?: boolean;
    bold?: boolean;
    color?: "emerald" | "rose" | "sky" | "teal";
}) {
    const colorClass = color
        ? {
              emerald: "text-emerald-700",
              rose: "text-rose-700",
              sky: "text-sky-700",
              teal: "text-teal-800",
          }[color]
        : "text-slate-800";

    return (
        <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">{label}</span>
            <span
                className={`${mono ? "font-mono" : ""} ${bold ? "font-bold" : "font-medium"} ${colorClass}`}
            >
                {value || "-"}
            </span>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const upper = status.toUpperCase();
    let cls = "bg-slate-100 text-slate-700 border-slate-200";

    if (upper.includes("AKTIF") || upper.includes("LUNAS") || upper.includes("SELESAI") || upper.includes("BUKA")) {
        cls = "bg-emerald-100 text-emerald-800 border-emerald-300";
    } else if (upper.includes("JATUH") || upper.includes("UNPAID") || upper.includes("ISOLIR") || upper.includes("TERISOLIR")) {
        cls = "bg-rose-100 text-rose-800 border-rose-300";
    } else if (upper.includes("PROSES") || upper.includes("PENDING") || upper.includes("OPEN")) {
        cls = "bg-amber-100 text-amber-800 border-amber-300";
    }

    return (
        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
            {status}
        </span>
    );
}

function TabTableHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
    return (
        <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                {icon}
                {title}
            </h3>
            <span className="text-xs text-slate-500">
                Total: <strong>{count}</strong>
            </span>
        </div>
    );
}

function EmptyTabState({ label, scraping }: { label: string; scraping: boolean }) {
    return (
        <div className="p-8 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-dashed border-slate-200">
            {scraping ? (
                <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-teal-500" />
                    <span className="font-medium">Mengambil data {label} dari Billingnesia...</span>
                </div>
            ) : (
                <div>
                    <FileText className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <span>Tidak ada data {label} tercatat untuk pelanggan ini.</span>
                </div>
            )}
        </div>
    );
}
