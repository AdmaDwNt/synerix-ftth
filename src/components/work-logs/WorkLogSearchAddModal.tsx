"use client";

import { useState } from "react";
import {
    Search,
    Loader2,
    X,
    User,
    MapPin,
    Phone,
    Ticket,
    CheckCircle2,
    Clock,
    ArrowRight,
    Check,
    ChevronLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
    BillingnesiaCandidate,
    BillingnesiaScrapedData,
    CustomerTicketItem,
} from "@/lib/scraper/billingnesiaScraper";
import { WorkLogItem } from "./EditWorkLogModal";

interface WorkLogSearchAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newLog: WorkLogItem) => void;
}

export default function WorkLogSearchAddModal({
    isOpen,
    onClose,
    onSuccess,
}: WorkLogSearchAddModalProps) {
    const supabase = createClient();

    // 1. Search Query & States
    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // 2. Candidates (jika pencarian menghasilkan > 1 pelanggan)
    const [candidates, setCandidates] = useState<BillingnesiaCandidate[]>([]);
    const [candidateFilter, setCandidateFilter] = useState("");

    // 3. Selected Customer & Scraped Data
    const [selectedCandidate, setSelectedCandidate] = useState<BillingnesiaCandidate | null>(null);
    const [scrapedData, setScrapedData] = useState<BillingnesiaScrapedData | null>(null);

    // 4. Selected Ticket (dari tab tiket pelanggan atau dari pencarian tiket langsung)
    const [selectedTicket, setSelectedTicket] = useState<CustomerTicketItem | null>(null);

    if (!isOpen) return null;

    // Reset all state
    const handleReset = () => {
        setQuery("");
        setErrorMessage(null);
        setCandidates([]);
        setCandidateFilter("");
        setSelectedCandidate(null);
        setScrapedData(null);
        setSelectedTicket(null);
    };

    // 1. Eksekusi Pencarian ke Billingnesia
    const handleSearch = async () => {
        const cleanQuery = query.trim();
        if (!cleanQuery) {
            setErrorMessage("Masukkan Nama, ID Pelanggan, ID Tiket, No HP, atau Alamat singkat.");
            return;
        }

        setIsSearching(true);
        setErrorMessage(null);
        setCandidates([]);
        setSelectedCandidate(null);
        setScrapedData(null);
        setSelectedTicket(null);

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

            // A. Jika ditemukan beberapa kandidat (misal pencarian nama/alamat yang sama di awalan/tengah/akhiran)
            if (json.is_multiple && Array.isArray(json.candidates)) {
                setCandidates(json.candidates);
                return;
            }

            // B. Jika hasil tunggal langsung (misal via ID Tiket atau ID Pelanggan)
            if (json.data) {
                const singleData: BillingnesiaScrapedData = json.data;
                setScrapedData(singleData);

                const cand: BillingnesiaCandidate = {
                    customer_id: singleData.customer_id || cleanQuery,
                    customer_name: singleData.customer_name || "Pelanggan",
                    village: singleData.village || singleData.district || "",
                    hamlet: singleData.hamlet || "",
                    area: singleData.address || "",
                    phone_number: singleData.phone_number || "",
                    status: singleData.status_pelanggan || "AKTIF",
                };
                setSelectedCandidate(cand);

                // Jika query adalah tiket, set tiket terpilih
                if (singleData.ticket_id) {
                    setSelectedTicket({
                        ticket_id: singleData.ticket_id,
                        created_at: singleData.register_date || "-",
                        last_action: singleData.ticket_indication || "-",
                        progress: singleData.ticket_progress_percent || "100%",
                        status: "DONE",
                    });
                } else if (singleData.tickets && singleData.tickets.length > 0) {
                    // Pilih tiket pertama secara default
                    setSelectedTicket(singleData.tickets[0]);
                }
            }
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : "Gagal mencari data di Billingnesia.");
        } finally {
            setIsSearching(false);
        }
    };

    // 2. Pilih salah satu calon pelanggan dari daftar kandidat
    const handleSelectCandidate = async (cand: BillingnesiaCandidate) => {
        setIsSearching(true);
        setErrorMessage(null);
        setSelectedCandidate(cand);

        try {
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
            setScrapedData(fullData);

            if (fullData.tickets && fullData.tickets.length > 0) {
                setSelectedTicket(fullData.tickets[0]);
            } else {
                setSelectedTicket(null);
            }
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : "Gagal memuat detail pelanggan.");
        } finally {
            setIsSearching(false);
        }
    };

    // 3. Simpan Log Pekerjaan ke Supabase
    const handleSaveWorkLog = async () => {
        if (!selectedCandidate && !scrapedData) {
            setErrorMessage("Silakan pilih data pelanggan atau tiket terlebih dahulu.");
            return;
        }

        setIsSaving(true);
        setErrorMessage(null);

        try {
            const finalCustomerId = (scrapedData?.customer_id || selectedCandidate?.customer_id || "").trim();
            const finalCustomerName = (scrapedData?.customer_name || selectedCandidate?.customer_name || "Pelanggan").trim();
            const finalAddress = (scrapedData?.address || selectedCandidate?.area || "-").trim();
            const finalPhone = (scrapedData?.phone_number || selectedCandidate?.phone_number || "-").trim();

            const finalTicketId = selectedTicket?.ticket_id || scrapedData?.ticket_id || `TKT${Date.now().toString(36).toUpperCase()}`;
            const finalProgress = selectedTicket?.progress || scrapedData?.ticket_progress_percent || "100%";
            const pctNum = parseInt(finalProgress.replace("%", ""), 10) || 0;

            let defaultStatus: WorkLogItem["status"] = "DONE";
            if (pctNum >= 100) defaultStatus = "DONE";
            else if (pctNum >= 50) defaultStatus = "IN_PROGRESS";
            else defaultStatus = "PENDING";

            const finalLastAction = selectedTicket?.last_action || scrapedData?.ticket_indication || "Penanganan teknisi selesai.";

            // PJ Teknisi murni dari hasil scraping: ticket_pic -> [PJ] di last_action -> log user terbaru
            let finalPic = scrapedData?.ticket_pic && scrapedData.ticket_pic !== "-" ? scrapedData.ticket_pic : "";
            if (!finalPic) {
                const matchAction = finalLastAction.match(/\[(.*?)\]/);
                if (matchAction && matchAction[1] && matchAction[1].trim() !== "-") {
                    finalPic = matchAction[1].trim();
                }
            }
            if (!finalPic && scrapedData?.logs && scrapedData.logs.length > 0) {
                const latestUser = scrapedData.logs[0].user;
                if (latestUser && !latestUser.toLowerCase().includes("system")) {
                    finalPic = latestUser.split("dengan catatan")[0].trim();
                }
            }
            if (!finalPic) finalPic = "-";

            // Deteksi Kategori
            let defaultCategory: WorkLogItem["category"] = "MAINTENANCE_RETAIL";
            const rawCat = (scrapedData?.category || "").toLowerCase();
            if (rawCat.includes("network") || rawCat.includes("jaringan")) {
                defaultCategory = "MAINTENANCE_NETWORK";
            } else if (rawCat.includes("project")) {
                defaultCategory = "PROJECT";
            } else if (rawCat.includes("dismantle")) {
                defaultCategory = "DISMANTLE";
            } else if (rawCat.includes("lainnya") || rawCat.includes("other")) {
                defaultCategory = "OTHER";
            }

            // Simpan snapshot metadata JSON lengkap agar terbaca sempurna oleh tabel
            const metadataPayload = {
                ticket_id: finalTicketId,
                customer_id: finalCustomerId,
                customer_name: finalCustomerName,
                ticket_type: scrapedData?.ticket_type || "TEKNIS",
                ticket_category: scrapedData?.category || defaultCategory.replace(/_/g, " "),
                title_category: scrapedData?.category || "MAINTENANCE PELANGGAN RETAIL",
                ticket_created_at: selectedTicket?.created_at || scrapedData?.register_date || new Date().toISOString(),
                pic: finalPic,
                last_action: finalLastAction,
                last_action_pic: finalPic,
                last_action_date: selectedTicket?.created_at?.slice(0, 16) || "",
                last_action_text: finalLastAction,
                progress_percent: finalProgress.includes("%") ? finalProgress : `${finalProgress}%`,
                address: finalAddress,
                phone_number: finalPhone,
                coordinates: {
                    latitude: scrapedData?.latitude || null,
                    longitude: scrapedData?.longitude || null,
                },
            };

            const caseDescription = `Alamat: ${finalAddress} | WhatsApp/HP: ${finalPhone}\n\nMETADATA:${JSON.stringify(metadataPayload)}`;

            const payload: WorkLogItem = {
                id: crypto.randomUUID(),
                title: finalCustomerName,
                category: defaultCategory,
                case_description: caseDescription,
                resolution: finalLastAction,
                optical_power_in: null,
                optical_power_out: null,
                status: defaultStatus,
                latitude: scrapedData?.latitude || null,
                longitude: scrapedData?.longitude || null,
                created_at: new Date().toISOString(),
            };

            const { error } = await supabase.from("work_logs").insert([payload]);

            if (error) {
                throw new Error(error.message);
            }

            onSuccess(payload);
            onClose();
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : "Gagal menyimpan log pekerjaan.");
        } finally {
            setIsSaving(false);
        }
    };

    // Filter kandidat di frontend
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col overflow-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {/* Header Modal */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                            <Ticket className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-slate-900 leading-tight">
                                Tambah Log Pekerjaan FTTH
                            </h3>
                            <p className="text-xs text-slate-500">
                                Cari via Nama, ID Pelanggan, ID Tiket, Alamat Singkat, atau No HP
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

                {/* Body Konten */}
                <div className="flex-1 overflow-y-auto pr-0 py-3 space-y-4 min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {/* 1. Kotak Pencarian Utama */}
                    <div className="space-y-1.5 shrink-0">
                        <label className="block text-xs font-bold text-slate-700">
                            Cari ID, Judul, Pelanggan, No Tiket, atau No HP:
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    autoFocus
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        if (errorMessage) setErrorMessage(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleSearch();
                                        }
                                    }}
                                    disabled={isSearching || isSaving}
                                    placeholder="Contoh: WINARNI, 0101010402102, TKT2026..., 085604..."
                                    className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white placeholder:text-slate-400 shadow-2xs font-sans"
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
                            💡 Masukkan nama (awalan, tengah, atau akhiran), sistem akan menampilkan daftar jika ada beberapa orang.
                        </p>
                    </div>

                    {/* Feedback Pesan Error */}
                    {errorMessage && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
                            <span className="font-bold text-rose-800">⚠️</span>
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Loading State */}
                    {isSearching && (
                        <div className="p-8 text-center space-y-2 rounded-xl bg-teal-50/50 border border-teal-100">
                            <Loader2 className="w-7 h-7 text-teal-600 animate-spin mx-auto" />
                            <h4 className="font-bold text-xs text-teal-900">
                                Mengambil data dari Billingnesia...
                            </h4>
                            <p className="text-[11px] text-teal-700">
                                Mencocokkan query &quot;{query}&quot;
                            </p>
                        </div>
                    )}

                    {/* 2. DAFTAR KANDIDAT PELANGGAN (Jika hasil pencarian > 1 orang) */}
                    {candidates.length > 0 && !isSearching && !selectedCandidate && (
                        <div className="space-y-2.5 animate-in fade-in">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                <span className="text-xs font-bold text-slate-700">
                                    Ditemukan {candidates.length} Pelanggan (Pilih salah satu):
                                </span>
                                {candidates.length > 4 && (
                                    <input
                                        type="text"
                                        placeholder="Saring nama..."
                                        value={candidateFilter}
                                        onChange={(e) => setCandidateFilter(e.target.value)}
                                        className="text-[11px] px-2 py-1 rounded-lg border border-slate-200"
                                    />
                                )}
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {filteredCandidates.map((cand) => (
                                    <div
                                        key={cand.customer_id}
                                        onClick={() => handleSelectCandidate(cand)}
                                        className="p-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 bg-white transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs group"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-xs text-slate-900 group-hover:text-teal-900">
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
                                            className="self-end sm:self-center shrink-0 bg-teal-50 group-hover:bg-teal-600 text-teal-700 group-hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition-all pointer-events-none"
                                        >
                                            <span>Pilih</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}

                                {filteredCandidates.length === 0 && (
                                    <div className="text-center py-4 text-xs text-slate-400">
                                        Tidak ada nama yang cocok dengan penyaringan &quot;{candidateFilter}&quot;.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 3. PELANGGAN TERPILIH & DETAIL TIKET */}
                    {selectedCandidate && !isSearching && (
                        <div className="space-y-3 animate-in fade-in">
                            {/* Card Pelanggan Terpilih */}
                            <div className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200 space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-700 text-white px-1.5 py-0.5 rounded">
                                            Pelanggan Terpilih
                                        </span>
                                        <span className="font-bold text-xs text-slate-900">
                                            {selectedCandidate.customer_name}
                                        </span>
                                        <span className="font-mono text-xs text-slate-600">
                                            #{selectedCandidate.customer_id}
                                        </span>
                                    </div>

                                    {candidates.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedCandidate(null);
                                                setScrapedData(null);
                                                setSelectedTicket(null);
                                            }}
                                            className="text-[11px] text-teal-700 hover:text-teal-900 font-bold underline shrink-0 cursor-pointer flex items-center gap-1"
                                        >
                                            <ChevronLeft className="w-3 h-3" />
                                            <span>Ganti Pelanggan</span>
                                        </button>
                                    )}
                                </div>

                                <div className="text-[11px] text-slate-600 flex items-center gap-3 flex-wrap">
                                    {selectedCandidate.area && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-teal-600" />
                                            {selectedCandidate.area}
                                        </span>
                                    )}
                                    {selectedCandidate.phone_number && (
                                        <span className="flex items-center gap-1 font-mono">
                                            <Phone className="w-3 h-3 text-teal-600" />
                                            {selectedCandidate.phone_number}
                                        </span>
                                    )}
                                </div>

                                {scrapedData?.ticket_pic && (
                                    <div className="text-[11px] text-slate-700 pt-0.5">
                                        <span className="font-bold">PJ Teknisi (Scraping):</span>{" "}
                                        <span className="bg-white px-1.5 py-0.5 rounded border border-teal-200 font-semibold text-slate-900">
                                            {scrapedData.ticket_pic}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Daftar Tiket Pelanggan (Jika pelanggan memiliki riwayat tiket di Billingnesia) */}
                            {scrapedData?.tickets && scrapedData.tickets.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                                        <span>Daftar Tiket Terkait ({scrapedData.tickets.length} tiket):</span>
                                        <span className="text-[11px] text-slate-500 font-normal">
                                            Pilih tiket pekerjaan yang dikerjakan
                                        </span>
                                    </div>

                                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                        {scrapedData.tickets.map((tkt) => {
                                            const isTicketSelected = selectedTicket?.ticket_id === tkt.ticket_id;
                                            return (
                                                <div
                                                    key={tkt.ticket_id}
                                                    onClick={() => setSelectedTicket(tkt)}
                                                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs ${
                                                        isTicketSelected
                                                            ? "bg-teal-50 border-teal-500 ring-1 ring-teal-500"
                                                            : "bg-white border-slate-200 hover:border-teal-300"
                                                    }`}
                                                >
                                                    <div className="space-y-0.5 min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-bold text-xs text-slate-900">
                                                                {tkt.ticket_id}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500 font-mono">
                                                                {tkt.created_at}
                                                            </span>
                                                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
                                                                {tkt.progress || tkt.status}
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] text-slate-600 truncate">
                                                            {tkt.last_action || "Penanganan teknisi"}
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0">
                                                        {isTicketSelected ? (
                                                            <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                                                                <Check className="w-3 h-3" />
                                                            </span>
                                                        ) : (
                                                            <span className="w-5 h-5 rounded-full border border-slate-300 inline-block" />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                                    <span>
                                        Pelanggan ini siap ditambahkan ke daftar pekerjaan. Klik &quot;Simpan Log Pekerjaan&quot; untuk menyimpan.
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Modal */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="text-xs font-semibold text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        Batal
                    </button>

                    <button
                        type="button"
                        onClick={handleSaveWorkLog}
                        disabled={(!selectedCandidate && !scrapedData) || isSaving}
                        className="bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Simpan Log Pekerjaan</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
