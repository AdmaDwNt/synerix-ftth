"use client";

import { useState } from "react";
import {
    Sparkles,
    Search,
    Loader2,
    CheckCircle2,
    AlertCircle,
    UserCheck,
    MapPin,
    Phone,
    X,
    Users,
    ArrowRight
} from "lucide-react";
import {
    BillingnesiaScrapedData,
    BillingnesiaCandidate
} from "@/lib/scraper/billingnesiaScraper";

interface BillingnesiaAutofillBannerProps {
    onDataFetched: (data: BillingnesiaScrapedData) => void;
    placeholder?: string;
    className?: string;
}

export default function BillingnesiaAutofillBanner({
    onDataFetched,
    placeholder = "Cari No. Tiket, ID Pelanggan, Nama, atau Daerah...",
    className = "",
}: BillingnesiaAutofillBannerProps) {
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    // State untuk Multi-Kandidat (Pencarian Nama / Daerah)
    const [candidates, setCandidates] = useState<BillingnesiaCandidate[]>([]);
    const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
    const [candidateFilter, setCandidateFilter] = useState("");
    const [selectingId, setSelectingId] = useState<string | null>(null);

    const handleFetchBillingnesia = async () => {
        const cleanQuery = query.trim();
        if (!cleanQuery) {
            setStatusMessage({
                type: "error",
                text: "Silakan masukkan Nomor Tiket, ID Pelanggan, Nama, atau Daerah.",
            });
            return;
        }

        setIsLoading(true);
        setStatusMessage(null);
        setCandidates([]);

        try {
            const res = await fetch("/api/scraper/billingnesia", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: cleanQuery }),
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.error || "Gagal menarik data dari Billingnesia.");
            }

            // Kasus 1: Ditemukan beberapa kandidat (pencarian nama/daerah)
            if (json.is_multiple && Array.isArray(json.candidates)) {
                setCandidates(json.candidates);
                setIsCandidateModalOpen(true);
                return;
            }

            // Kasus 2: Hasil tunggal langsung (tiket atau ID unik)
            const data: BillingnesiaScrapedData = json.data;
            applyDataToForm(data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menarik data.";
            setStatusMessage({
                type: "error",
                text: msg,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Fungsi menerapkan data yang ditarik ke form
    const applyDataToForm = (data: BillingnesiaScrapedData) => {
        onDataFetched(data);

        const custInfo = data.customer_name ? `(${data.customer_name})` : "";
        const gpsInfo = data.coordinates_found
            ? "📍 Koordinat GPS akurat ditemukan"
            : "⚠️ Menggunakan fallback GPS Kediri";

        setStatusMessage({
            type: "success",
            text: `Data berhasil ditarik ${custInfo}! ${gpsInfo}`,
        });
    };

    // Handler ketika pengguna memilih 1 pelanggan dari daftar kandidat
    const handleSelectCandidate = async (candidate: BillingnesiaCandidate) => {
        setSelectingId(candidate.customer_id);

        try {
            const res = await fetch("/api/scraper/billingnesia", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customer_id: candidate.customer_id }),
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.error || `Gagal menarik detail data untuk ${candidate.customer_name}.`);
            }

            const fullData: BillingnesiaScrapedData = json.data;

            // Tutup modal kandidat dan terapkan data
            setIsCandidateModalOpen(false);
            setCandidateFilter("");
            applyDataToForm(fullData);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Gagal mengambil data detail kandidat.";
            alert(msg);
        } finally {
            setSelectingId(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleFetchBillingnesia();
        }
    };

    // Filter lokal di dalam daftar kandidat jika hasil banyak
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
        <>
            <div
                className={`bg-gradient-to-r from-teal-50 via-emerald-50/60 to-teal-50 p-3.5 sm:p-4 rounded-xl border border-teal-200/90 shadow-2xs ${className}`}
            >
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                        <span className="text-teal-600 font-bold text-sm">⚡</span>
                        <label className="text-[11px] sm:text-xs font-bold text-teal-900 uppercase tracking-wider">
                            Autofill Otomatis dari Billingnesia
                        </label>
                    </div>
                    <span className="hidden sm:inline-block text-[10px] font-semibold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-full">
                        Tiket • ID • Nama • Daerah
                    </span>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                if (statusMessage) setStatusMessage(null);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            disabled={isLoading}
                            className="w-full text-xs px-3 py-2 sm:py-2.5 rounded-lg border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white placeholder:text-slate-400 font-mono sm:font-sans transition-all disabled:bg-slate-100"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleFetchBillingnesia}
                        disabled={isLoading}
                        className="bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-semibold text-xs px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap shadow-xs transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Mencari...</span>
                            </>
                        ) : (
                            <>
                                <Search className="w-3.5 h-3.5" />
                                <span>Tarik Data</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Status Feedback (Sukses / Error) */}
                {statusMessage && (
                    <div
                        className={`mt-2 flex items-start gap-1.5 text-[11px] p-2 rounded-lg font-medium transition-all ${
                            statusMessage.type === "success"
                                ? "bg-emerald-100/80 text-emerald-800 border border-emerald-300/70"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                    >
                        {statusMessage.type === "success" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        )}
                        <span className="leading-tight">{statusMessage.text}</span>
                    </div>
                )}

                {!statusMessage && (
                    <p className="text-[11px] text-teal-700/80 mt-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-teal-600 shrink-0" />
                        <span>
                            Bisa cari via <span className="font-semibold text-teal-900">No. Tiket</span>,{" "}
                            <span className="font-semibold text-teal-900">ID Pelanggan</span>,{" "}
                            <span className="font-semibold text-teal-900">Nama</span>, atau{" "}
                            <span className="font-semibold text-teal-900">Daerah/Desa</span>.
                        </span>
                    </p>
                )}
            </div>

            {/* MODAL / PANEL SELEKSI MULTI-KANDIDAT */}
            {isCandidateModalOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-5 shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
                        {/* Header Modal Kandidat */}
                        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <h4 className="font-bold text-sm sm:text-base text-slate-900">
                                        Pilih Pelanggan dari Billingnesia
                                    </h4>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Ditemukan <span className="font-bold text-teal-700">{candidates.length}</span> pelanggan dengan kata kunci &ldquo;<span className="font-medium text-slate-800">{query}</span>&rdquo;. Pilih 1 pelanggan yang ingin ditarik.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCandidateModalOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Search Filter dalam list jika ada banyak kandidat */}
                        {candidates.length > 3 && (
                            <div className="mt-3">
                                <input
                                    type="text"
                                    value={candidateFilter}
                                    onChange={(e) => setCandidateFilter(e.target.value)}
                                    placeholder="Saring nama, dusun, atau no WA..."
                                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                />
                            </div>
                        )}

                        {/* Daftar Kartu Kandidat */}
                        <div className="mt-3 overflow-y-auto space-y-2 pr-1 flex-1">
                            {filteredCandidates.map((c) => {
                                const isThisSelecting = selectingId === c.customer_id;
                                const isAnySelecting = selectingId !== null;

                                return (
                                    <div
                                        key={c.customer_id}
                                        className="p-3 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-xs sm:text-sm text-slate-900">
                                                    {c.customer_name}
                                                </span>
                                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                                                    #{c.customer_id}
                                                </span>
                                                <span
                                                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                                        c.status === "AKTIF"
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : "bg-slate-100 text-slate-600"
                                                    }`}
                                                >
                                                    {c.status}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 text-slate-500 text-[11px] flex-wrap">
                                                {c.area && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                                                        {c.area}
                                                    </span>
                                                )}
                                                {c.phone_number && (
                                                    <span className="flex items-center gap-1 font-mono">
                                                        <Phone className="w-3 h-3 text-teal-600 shrink-0" />
                                                        {c.phone_number}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleSelectCandidate(c)}
                                            disabled={isAnySelecting}
                                            className="self-end sm:self-center shrink-0 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                                        >
                                            {isThisSelecting ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    <span>Menarik Data...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Pilih & Tarik Data</span>
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}

                            {filteredCandidates.length === 0 && (
                                <div className="text-center py-6 text-xs text-slate-400">
                                    Tidak ada kandidat yang cocok dengan penyaringan &ldquo;{candidateFilter}&rdquo;.
                                </div>
                            )}
                        </div>

                        {/* Footer Modal */}
                        <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                            <span>*Hanya 1 data yang akan ditarik ke dalam form</span>
                            <button
                                type="button"
                                onClick={() => setIsCandidateModalOpen(false)}
                                className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
