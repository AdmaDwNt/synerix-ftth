"use client";

import { useState } from "react";
import {
    Search,
    Loader2,
    X,
    User,
    MapPin,
    Phone,
    ArrowRight,
    CheckCircle2,
    Sparkles,
    Ticket,
    Shield,
    Send
} from "lucide-react";
import { DismantleTask } from "@/lib/types/dismantle";
import { createClient } from "@/lib/supabase/client";
import {
    BillingnesiaCandidate,
    BillingnesiaScrapedData
} from "@/lib/scraper/billingnesiaScraper";

interface DismantleSearchAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newTask: DismantleTask) => void;
}

export default function DismantleSearchAddModal({
    isOpen,
    onClose,
    onSuccess,
}: DismantleSearchAddModalProps) {
    const supabase = createClient();

    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Daftar kandidat jika hasil pencarian > 1 orang
    const [candidates, setCandidates] = useState<BillingnesiaCandidate[]>([]);
    const [selectedCandidate, setSelectedCandidate] = useState<BillingnesiaCandidate | null>(null);
    const [candidateFilter, setCandidateFilter] = useState("");

    if (!isOpen) return null;

    // 1. Eksekusi Pencarian ke Billingnesia
    const handleSearch = async () => {
        const cleanQuery = query.trim();
        if (!cleanQuery) {
            setErrorMessage("Masukkan Nama Pelanggan, ID Pelanggan, ID Tiket, No HP, atau Alamat singkat.");
            return;
        }

        setIsSearching(true);
        setErrorMessage(null);
        setCandidates([]);
        setSelectedCandidate(null);

        try {
            const res = await fetch("/api/scraper/billingnesia", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: cleanQuery }),
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.error || "Data tidak ditemukan di Billingnesia.");
            }

            // Jika ditemukan beberapa kandidat (pencarian nama/alamat/daerah)
            if (json.is_multiple && Array.isArray(json.candidates)) {
                setCandidates(json.candidates);
                // Jika hanya 1 kandidat persis
                if (json.candidates.length === 1 && json.candidates[0]) {
                    setSelectedCandidate(json.candidates[0]);
                }
                return;
            }

            // Jika hasil tunggal langsung (misal via ID Tiket atau ID Pelanggan langsung)
            if (json.data) {
                const singleData: BillingnesiaScrapedData = json.data;
                const candidateFromSingle: BillingnesiaCandidate = {
                    customer_id: singleData.customer_id || singleData.ticket_id || cleanQuery,
                    customer_name: singleData.customer_name || "Pelanggan",
                    village: singleData.village || singleData.district || "",
                    hamlet: singleData.hamlet || "",
                    area: singleData.address || "",
                    phone_number: singleData.phone_number || "",
                    status: singleData.status_pelanggan || "AKTIF",
                };
                setSelectedCandidate(candidateFromSingle);
                // Langsung simpan tugas dismantle jika hasil tunggal
                await saveDismantleDirect(singleData);
            }
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : "Gagal mencari data.");
        } finally {
            setIsSearching(false);
        }
    };

    // 2. Fungsi Eksekusi Simpan Tugas Dismantle ke Supabase
    const saveDismantleDirect = async (scraped: BillingnesiaScrapedData) => {
        setIsSaving(true);
        setErrorMessage(null);

        try {
            // Sesuai Poin 5: Jika pencarian via ID tiket, kolom pelanggan HARUS ID Pelanggan (bukan tiket)
            const finalCustomerId = (scraped.customer_id || query).trim();
            const finalCustomerName = (scraped.customer_name || "Pelanggan").trim();
            const finalAddress = (scraped.address || "Alamat belum diatur").trim();

            let clusterName = "Umum";
            if (scraped.village) clusterName = scraped.village;
            else if (scraped.district) clusterName = scraped.district;
            else if (scraped.server) clusterName = scraped.server;

            // Simpan snapshot data lengkap ke accessories agar halaman detail dan tabel bisa baca full data
            const metadataSnapshot = JSON.stringify({
                register_date: scraped.register_date,
                id_card_number: scraped.id_card_number,
                phone_number_1: scraped.phone_number_1 || scraped.phone_number,
                phone_number_2: scraped.phone_number_2,
                email: scraped.email,
                region: scraped.region,
                district: scraped.district,
                village: scraped.village,
                hamlet: scraped.hamlet,
                server: scraped.server,
                ip_address: scraped.ip_address,
                pppoe_username: scraped.pppoe_username,
                pppoe_password: scraped.pppoe_password,
                parent_odp: scraped.parent_odp,
                cable_outdoor: scraped.cable_outdoor,
                cable_indoor: scraped.cable_indoor,
                marketer: scraped.marketer,
                badges: scraped.badges,
                status_pelanggan: scraped.status_pelanggan,
                ticket_id: scraped.ticket_id,
                ticket_creator: scraped.ticket_creator,
                ticket_type: scraped.ticket_type,
                ticket_indication: scraped.ticket_indication,
                ticket_pic: scraped.ticket_pic,
                ticket_tag: scraped.ticket_tag,
                ticket_progress_percent: scraped.ticket_progress_percent,
                services: scraped.services || [],
                invoices: scraped.invoices || [],
                tickets: scraped.tickets || [],
                isolirs: scraped.isolirs || [],
                logs: scraped.logs || [],
                tab_counts: scraped.tab_counts || {},
                // Daftar penanda dismantle apa saja yang diambil (ONT, Kabel, Tagihan)
                dismantle_items: {
                    ont_taken: false,
                    cable_taken: false,
                    bill_paid: (scraped.unpaid_amount || 0) <= 0,
                    bill_amount: scraped.unpaid_amount || 0,
                    ticket_indication: scraped.ticket_indication || "",
                },
            });

            const payload: Omit<DismantleTask, "distance_meters"> = {
                id: crypto.randomUUID(),
                customer_id: finalCustomerId,
                customer_name: finalCustomerName,
                phone_number: scraped.phone_number || null,
                address: finalAddress,
                cluster_name: clusterName,
                parent_odp_name: scraped.parent_odp || null,
                device_type: scraped.device_type || "ONT ZTE F609",
                latitude: scraped.latitude || -7.8231,
                longitude: scraped.longitude || 111.9174,
                status: "QUEUE", // Antrean awal
                ticket_id: scraped.ticket_id || null,
                unpaid_amount: scraped.unpaid_amount || 0,
                billing_url: scraped.billing_url || null,
                accessories: ["ADAPTOR", "PATCHCORD", `METADATA:${metadataSnapshot}`],
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
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : "Gagal menyimpan tugas dismantle.");
        } finally {
            setIsSaving(false);
        }
    };

    // 3. Handler saat pengguna mengklik salah satu calon pelanggan terpilih lalu klik "Simpan Tugas Dismantle"
    const handleConfirmSelectedCandidate = async (cand: BillingnesiaCandidate) => {
        setIsSaving(true);
        setErrorMessage(null);

        try {
            // Ambil data full pelanggan terpilih via scraping
            const res = await fetch("/api/scraper/billingnesia", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customer_id: cand.customer_id }),
            });

            const json = await res.json();

            if (!res.ok || !json.success || !json.data) {
                throw new Error(json.error || `Gagal mengambil data lengkap untuk ${cand.customer_name}.`);
            }

            const fullData: BillingnesiaScrapedData = json.data;
            await saveDismantleDirect(fullData);
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : "Gagal mengambil data detail pelanggan.");
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
        }
    };

    // Saring kandidat secara lokal jika hasil pencarian banyak
    const filteredCandidates = candidates.filter((c) => {
        if (!candidateFilter.trim()) return true;
        const q = candidateFilter.toLowerCase();
        return (
            c.customer_name.toLowerCase().includes(q) ||
            c.customer_id.includes(q) ||
            c.area.toLowerCase().includes(q) ||
            c.phone_number.includes(q)
        );
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
                {/* Header Modal Pencarian */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                            <Search className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-slate-900 leading-tight">
                                Tambah Tugas Dismantle Baru
                            </h3>
                            <p className="text-xs text-slate-500">
                                Cari via Nama, ID Pelanggan, ID Tiket, No HP, atau Alamat
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

                {/* Body Pencarian */}
                <div className="overflow-y-auto pr-1 flex-1 mt-4 space-y-4">
                    {/* Search Bar Input */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                            Cari ID, Judul, Pelanggan, No Tiket, atau No HP:
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    autoFocus
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        if (errorMessage) setErrorMessage(null);
                                    }}
                                    onKeyDown={handleKeyDown}
                                    disabled={isSearching || isSaving}
                                    placeholder="Contoh: WINARNI, 0101010402102, TKT2026..., 085604..."
                                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white placeholder:text-slate-400 font-sans shadow-2xs"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleSearch}
                                disabled={isSearching || isSaving || !query.trim()}
                                className="bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap shadow-xs transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                            >
                                {isSearching ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Mencari...</span>
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-3.5 h-3.5" />
                                        <span>Cari</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-400">
                            💡 Ketik nama awalan, tengah, atau akhiran. Sistem akan menampilkan daftar kandidat.
                        </p>
                    </div>

                    {/* Feedback Pesan Error */}
                    {errorMessage && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
                            <span className="font-bold text-rose-800">⚠️</span>
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Loading State saat sedang menyimpan */}
                    {isSaving && (
                        <div className="p-6 bg-teal-50/70 border border-teal-200 rounded-xl text-center space-y-2 animate-in fade-in">
                            <Loader2 className="w-7 h-7 text-teal-600 animate-spin mx-auto" />
                            <h4 className="font-bold text-xs text-teal-900">
                                Menarik Data & Menyimpan Tugas Dismantle...
                            </h4>
                            <p className="text-[11px] text-teal-700">
                                Mengambil data koordinat GPS, status ITN/PJK, dan detail pelanggan dari Billingnesia.
                            </p>
                        </div>
                    )}

                    {/* DAFTAR PILIHAN KANDIDAT PELANGGAN (Jika > 1) */}
                    {candidates.length > 0 && !isSaving && (
                        <div className="space-y-2.5 animate-in fade-in">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                <span className="text-xs font-bold text-slate-700">
                                    Ditemukan {candidates.length} Pelanggan (Pilih 1):
                                </span>
                                {candidates.length > 4 && (
                                    <input
                                        type="text"
                                        placeholder="Saring daftar..."
                                        value={candidateFilter}
                                        onChange={(e) => setCandidateFilter(e.target.value)}
                                        className="text-[11px] px-2 py-1 rounded-lg border border-slate-200"
                                    />
                                )}
                            </div>

                            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                                {filteredCandidates.map((cand) => {
                                    const isSelected = selectedCandidate?.customer_id === cand.customer_id;

                                    return (
                                        <div
                                            key={cand.customer_id}
                                            onClick={() => setSelectedCandidate(cand)}
                                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                                                isSelected
                                                    ? "bg-teal-50/70 border-teal-500 shadow-2xs ring-1 ring-teal-500"
                                                    : "bg-white border-slate-200 hover:border-teal-300 hover:bg-slate-50/80"
                                            }`}
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-xs text-slate-900">
                                                        {cand.customer_name}
                                                    </span>
                                                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold">
                                                        #{cand.customer_id}
                                                    </span>
                                                    <span
                                                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                                            cand.status.includes("AKTIF")
                                                                ? "bg-emerald-100 text-emerald-800"
                                                                : "bg-slate-100 text-slate-600"
                                                        }`}
                                                    >
                                                        {cand.status}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3 text-slate-500 text-[11px] flex-wrap">
                                                    {cand.area && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                                                            {cand.area}
                                                        </span>
                                                    )}
                                                    {cand.phone_number && (
                                                        <span className="flex items-center gap-1 font-mono">
                                                            <Phone className="w-3 h-3 text-teal-600 shrink-0" />
                                                            {cand.phone_number}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleConfirmSelectedCandidate(cand);
                                                }}
                                                disabled={isSaving}
                                                className="self-end sm:self-center shrink-0 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                                            >
                                                <span>Pilih & Simpan</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}

                                {filteredCandidates.length === 0 && (
                                    <div className="text-center py-4 text-xs text-slate-400">
                                        Tidak ada nama yang cocok dengan penyaringan &quot;{candidateFilter}&quot;.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Modal: Tombol Simpan Tugas Dismantle */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0 mt-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                        Batal
                    </button>

                    {selectedCandidate && (
                        <button
                            type="button"
                            onClick={() => handleConfirmSelectedCandidate(selectedCandidate)}
                            disabled={isSaving}
                            className="bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Simpan Tugas Dismantle</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
