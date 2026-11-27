/**
 * ============================================================================
 * MODUL       : Pengaturan Sistem (Settings)
 * FILE        : src/app/settings/page.tsx
 * DESKRIPSI   : Halaman manajemen konfigurasi Synerix FTTH:
 *               1. Konfigurasi Billingnesia (Dynamic Scraper URL & Test Connection)
 *               2. Billingnesia Scraper & Staging (Rule-based parsing & selective dispatch)
 *               3. Feature Flags (Beta Toggles untuk fitur-fitur baru)
 * ============================================================================
 */

"use client";

import React, { useState, useEffect } from "react";
import {
    Settings,
    Server,
    Layers,
    ToggleLeft,
    ToggleRight,
    Play,
    CheckCircle2,
    AlertCircle,
    Copy,
    Send,
    Loader2,
    RefreshCw,
    Database,
    Lock,
    ExternalLink,
    Filter,
    Trash2,
} from "lucide-react";

interface ScraperConfig {
    baseUrl: string;
    authEndpoint: string;
    requestTimeoutMs: number;
    autoSyncEnabled: boolean;
    autoSyncIntervalMinutes: number;
    updatedBy?: string;
    updatedAt?: string;
}

interface StagingItem {
    id: string;
    ticket_no?: string;
    customer_id?: string;
    customer_name: string;
    address?: string;
    phone?: string;
    status: string;
    staged_at: string;
    duplication_status: "BARU" | "DUPLIKAT";
    duplication_reason?: string;
}

interface FeatureFlag {
    key: string;
    name: string;
    description: string;
    category: string;
    is_enabled: boolean;
    is_beta: boolean;
    updated_at?: string;
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<"SCRAPER_CONFIG" | "STAGING" | "FLAGS">("SCRAPER_CONFIG");

    // 1. Scraper Config State
    const [scraperConfig, setScraperConfig] = useState<ScraperConfig>({
        baseUrl: "https://billing.at-in.net",
        authEndpoint: "/login",
        requestTimeoutMs: 15000,
        autoSyncEnabled: false,
        autoSyncIntervalMinutes: 30,
    });
    const [configLoading, setConfigLoading] = useState(true);
    const [configSaving, setConfigSaving] = useState(false);
    const [testResult, setTestResult] = useState<{ testing: boolean; success?: boolean; message?: string; latency?: number } | null>(null);

    // 2. Staging State
    const [rawBillingText, setRawBillingText] = useState("");
    const [parsing, setParsing] = useState(false);
    const [stagingItems, setStagingItems] = useState<StagingItem[]>([]);
    const [stagingLoading, setStagingLoading] = useState(true);
    const [selectedStagingIds, setSelectedStagingIds] = useState<Set<string>>(new Set());
    const [dispatching, setDispatching] = useState(false);
    const [stagingFilter, setStagingFilter] = useState<"ALL" | "BARU" | "DUPLIKAT">("ALL");

    // 3. Feature Flags State
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [flagsLoading, setFlagsLoading] = useState(true);
    const [updatingFlagKey, setUpdatingFlagKey] = useState<string | null>(null);

    // Toast Feedback
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const showToast = (type: "success" | "error", message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    // Load Initial Data
    useEffect(() => {
        // Load Scraper Config
        fetch("/api/settings/scraper")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.data) {
                    setScraperConfig({
                        baseUrl: data.data.base_url || data.data.baseUrl || "https://billing.at-in.net",
                        authEndpoint: data.data.authEndpoint || "/login",
                        requestTimeoutMs: data.data.timeout_ms || data.data.requestTimeoutMs || 15000,
                        autoSyncEnabled: data.data.autoSyncEnabled || false,
                        autoSyncIntervalMinutes: data.data.autoSyncIntervalMinutes || 30,
                    });
                }
            })
            .catch(console.error)
            .finally(() => setConfigLoading(false));

        // Load Staging Items
        loadStaging();

        // Load Feature Flags
        fetch("/api/feature-flags")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && Array.isArray(data.data)) setFlags(data.data);
            })
            .catch(console.error)
            .finally(() => setFlagsLoading(false));
    }, []);

    const loadStaging = () => {
        setStagingLoading(true);
        fetch("/api/scraper/staging")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && Array.isArray(data.data)) setStagingItems(data.data);
            })
            .catch(console.error)
            .finally(() => setStagingLoading(false));
    };

    // Handler: Test Connection
    const handleTestConnection = async () => {
        setTestResult({ testing: true });
        try {
            const res = await fetch("/api/settings/scraper/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ baseUrl: scraperConfig.baseUrl }),
            });
            const json = await res.json();
            setTestResult({
                testing: false,
                success: json.reachable,
                message: json.reachable
                    ? `Koneksi berhasil! Status: ${json.status || 200} OK, Latensi: ${json.latencyMs || 0} ms`
                    : `Gagal terhubung: ${json.error || "Server tidak merespons"}`,
                latency: json.latencyMs,
            });
        } catch (e: any) {
            setTestResult({
                testing: false,
                success: false,
                message: e.message || "Gagal melakukan pengujian koneksi.",
            });
        }
    };

    // Handler: Save Scraper Config
    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setConfigSaving(true);
        try {
            const payload = {
                base_url: scraperConfig.baseUrl,
                timeout_ms: scraperConfig.requestTimeoutMs,
                is_active: true,
            };
            const res = await fetch("/api/settings/scraper", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (json.success) {
                showToast("success", "Konfigurasi Billingnesia berhasil disimpan!");
            } else {
                showToast("error", json.error || "Gagal menyimpan konfigurasi.");
            }
        } catch (e: any) {
            showToast("error", e.message);
        } finally {
            setConfigSaving(false);
        }
    };

    // Handler: Parse Raw Text to Staging (Rule-Based, Non-AI)
    const handleParseAndStage = async () => {
        if (!rawBillingText.trim()) {
            showToast("error", "Tempelkan teks data Billingnesia terlebih dahulu.");
            return;
        }

        setParsing(true);
        try {
            const res = await fetch("/api/scraper/staging", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rawText: rawBillingText }),
            });
            const json = await res.json();
            if (json.success) {
                showToast("success", json.message || "Data berhasil diproses ke Staging!");
                setRawBillingText("");
                loadStaging();
            } else {
                showToast("error", json.error || "Gagal memproses data.");
            }
        } catch (e: any) {
            showToast("error", e.message);
        } finally {
            setParsing(false);
        }
    };

    // Handler: Dispatch Staged Items
    const handleDispatch = async (destination: "DISMANTLE" | "WORK_LOG") => {
        if (selectedStagingIds.size === 0) {
            showToast("error", "Pilih minimal 1 data di tabel staging.");
            return;
        }

        setDispatching(true);
        try {
            const res = await fetch("/api/scraper/staging/dispatch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    stagingIds: Array.from(selectedStagingIds),
                    destination,
                }),
            });
            const json = await res.json();
            if (json.success) {
                showToast("success", json.message || "Data berhasil dikirim!");
                setSelectedStagingIds(new Set());
                loadStaging();
            } else {
                showToast("error", json.error || "Gagal mengirim data.");
            }
        } catch (e: any) {
            showToast("error", e.message);
        } finally {
            setDispatching(false);
        }
    };

    // Handler: Toggle Feature Flag
    const handleToggleFlag = async (flag: FeatureFlag) => {
        if (!flag.is_beta) {
            showToast("error", "Fitur ini bersifat permanen dan tidak dapat dinonaktifkan.");
            return;
        }

        setUpdatingFlagKey(flag.key);
        try {
            const res = await fetch("/api/feature-flags", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    key: flag.key,
                    isEnabled: !flag.is_enabled,
                }),
            });
            const json = await res.json();
            if (json.success) {
                setFlags((prev) =>
                    prev.map((f) => (f.key === flag.key ? { ...f, is_enabled: !f.is_enabled } : f))
                );
                showToast("success", `Fitur ${flag.name} berhasil diubah.`);
            } else {
                showToast("error", json.error || "Gagal memperbarui flag.");
            }
        } catch (e: any) {
            showToast("error", e.message);
        } finally {
            setUpdatingFlagKey(null);
        }
    };

    const filteredStaging = stagingItems.filter((item) => {
        if (stagingFilter === "ALL") return true;
        return item.duplication_status === stagingFilter;
    });

    const isAllStagingSelected =
        filteredStaging.length > 0 && selectedStagingIds.size === filteredStaging.length;

    const toggleSelectAllStaging = () => {
        if (isAllStagingSelected) {
            setSelectedStagingIds(new Set());
        } else {
            setSelectedStagingIds(new Set(filteredStaging.map((i) => i.id)));
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Header Hero */}
            <div className="bg-[#0f172a] rounded-2xl p-5 text-white shadow-md border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-400">
                        <Settings className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-black tracking-tight">
                            Pengaturan Sistem &amp; Integrasi
                        </h2>
                        <p className="text-xs text-slate-300">
                            Konfigurasi scraper dinamis Billingnesia, antrean staging non-AI, dan kontrol Feature Flags (Beta)
                        </p>
                    </div>
                </div>
            </div>

            {/* Toast Feedback */}
            {toast && (
                <div
                    className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                        toast.type === "success"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}
                >
                    {toast.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
                <button
                    type="button"
                    onClick={() => setActiveTab("SCRAPER_CONFIG")}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "SCRAPER_CONFIG"
                            ? "bg-teal-700 text-white shadow-2xs"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                >
                    <Server className="w-4 h-4" />
                    <span>Konfigurasi Billingnesia</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("STAGING")}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "STAGING"
                            ? "bg-teal-700 text-white shadow-2xs"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                >
                    <Database className="w-4 h-4" />
                    <span>Scraper &amp; Staging Table</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("FLAGS")}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "FLAGS"
                            ? "bg-teal-700 text-white shadow-2xs"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                >
                    <Layers className="w-4 h-4" />
                    <span>Feature Flags (Beta Toggles)</span>
                </button>
            </div>

            {/* TAB 1: KONFIGURASI BILLINGNESIA */}
            {activeTab === "SCRAPER_CONFIG" && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs max-w-3xl space-y-5">
                    <div>
                        <h3 className="font-bold text-sm text-slate-900">
                            Konfigurasi Dinamis Billingnesia
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Menggantikan URL hardcode agar sistem fleksibel saat terjadi migrasi domain atau ganti IP server.
                        </p>
                    </div>

                    <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
                        <div>
                            <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                Base URL Billingnesia
                            </label>
                            <input
                                type="url"
                                value={scraperConfig.baseUrl}
                                onChange={(e) =>
                                    setScraperConfig({ ...scraperConfig, baseUrl: e.target.value })
                                }
                                placeholder="https://billing.at-in.net"
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Endpoint Login
                                </label>
                                <input
                                    type="text"
                                    value={scraperConfig.authEndpoint}
                                    onChange={(e) =>
                                        setScraperConfig({ ...scraperConfig, authEndpoint: e.target.value })
                                    }
                                    placeholder="/login"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Request Timeout (Milidetik)
                                </label>
                                <input
                                    type="number"
                                    value={scraperConfig.requestTimeoutMs}
                                    onChange={(e) =>
                                        setScraperConfig({
                                            ...scraperConfig,
                                            requestTimeoutMs: parseInt(e.target.value) || 15000,
                                        })
                                    }
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    required
                                />
                            </div>
                        </div>

                        {/* Test Connection Banner */}
                        {testResult && (
                            <div
                                className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                                    testResult.success
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                        : "bg-rose-50 border-rose-200 text-rose-800"
                                }`}
                            >
                                {testResult.success ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                )}
                                <span>{testResult.message}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={handleTestConnection}
                                disabled={testResult?.testing}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-teal-600 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs shadow-2xs active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                            >
                                {testResult?.testing ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                                ) : (
                                    <Play className="w-4 h-4 text-teal-600" />
                                )}
                                <span>Uji Koneksi Server</span>
                            </button>

                            <button
                                type="submit"
                                disabled={configSaving}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-2xs active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                            >
                                {configSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                <span>Simpan Konfigurasi</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* TAB 2: SCRAPER & STAGING TABLE */}
            {activeTab === "STAGING" && (
                <div className="space-y-5">
                    {/* Raw Text Input Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-sm text-slate-900">
                                    Input / Ingest Teks Mentah Billingnesia
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Tempelkan teks tiket/pelanggan yang disalin dari Billingnesia. Sistem akan mem-parsing secara rule-based (tanpa AI) dan mengecek duplikasi ke database.
                                </p>
                            </div>
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Rule-Based Non-AI
                            </span>
                        </div>

                        <textarea
                            value={rawBillingText}
                            onChange={(e) => setRawBillingText(e.target.value)}
                            placeholder="Tempel teks atau baris data Billingnesia di sini... (Contoh: ID: 0101010401089, Tiket: TKT2026111359717, Nama: NIDA HANI AMMARIA, Alamat: IRSA BANJAR, HP: 08123456789)"
                            rows={4}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleParseAndStage}
                                disabled={parsing}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-2xs active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                            >
                                {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                <span>Parse &amp; Masukkan ke Antrean Staging</span>
                            </button>
                        </div>
                    </div>

                    {/* Staging Queue Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                                    Daftar Antrean Staging ({stagingItems.length} Data)
                                </h4>
                                <select
                                    value={stagingFilter}
                                    onChange={(e) => setStagingFilter(e.target.value as any)}
                                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                                >
                                    <option value="ALL">Semua Status</option>
                                    <option value="BARU">Hanya BARU</option>
                                    <option value="DUPLIKAT">Hanya DUPLIKAT</option>
                                </select>
                            </div>

                            {/* Dispatch Action Buttons */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => handleDispatch("DISMANTLE")}
                                    disabled={dispatching || selectedStagingIds.size === 0}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Kirim ke /dismantles ({selectedStagingIds.size})</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDispatch("WORK_LOG")}
                                    disabled={dispatching || selectedStagingIds.size === 0}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-2xs active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Kirim ke /pekerjaan ({selectedStagingIds.size})</span>
                                </button>
                            </div>
                        </div>

                        {/* Staging Data Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                        <th className="py-2.5 px-3 w-10 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isAllStagingSelected}
                                                onChange={toggleSelectAllStaging}
                                                className="rounded text-teal-600"
                                            />
                                        </th>
                                        <th className="py-2.5 px-3">Status</th>
                                        <th className="py-2.5 px-3">No. Tiket / ID</th>
                                        <th className="py-2.5 px-3">Nama Pelanggan</th>
                                        <th className="py-2.5 px-3">Alamat</th>
                                        <th className="py-2.5 px-3">No. HP</th>
                                        <th className="py-2.5 px-3 text-right">Waktu Staged</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {stagingLoading ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-slate-400">
                                                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-teal-600" />
                                                <span>Memuat antrean staging...</span>
                                            </td>
                                        </tr>
                                    ) : filteredStaging.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-slate-400">
                                                Tidak ada data di antrean staging.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStaging.map((item) => {
                                            const isSelected = selectedStagingIds.has(item.id);
                                            return (
                                                <tr
                                                    key={item.id}
                                                    onClick={() => {
                                                        const next = new Set(selectedStagingIds);
                                                        if (next.has(item.id)) next.delete(item.id);
                                                        else next.add(item.id);
                                                        setSelectedStagingIds(next);
                                                    }}
                                                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                                                        isSelected ? "bg-teal-50/70" : ""
                                                    }`}
                                                >
                                                    <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => {
                                                                const next = new Set(selectedStagingIds);
                                                                if (next.has(item.id)) next.delete(item.id);
                                                                else next.add(item.id);
                                                                setSelectedStagingIds(next);
                                                            }}
                                                            className="rounded text-teal-600"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <span
                                                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider ${
                                                                item.duplication_status === "BARU"
                                                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                                                    : "bg-amber-100 text-amber-800 border border-amber-200"
                                                            }`}
                                                            title={item.duplication_reason}
                                                        >
                                                            {item.duplication_status}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 font-mono font-bold text-slate-800">
                                                        {item.ticket_no || item.customer_id || "-"}
                                                    </td>
                                                    <td className="py-2 px-3 font-bold text-slate-900">
                                                        {item.customer_name}
                                                    </td>
                                                    <td className="py-2 px-3 text-slate-600 max-w-xs truncate">
                                                        {item.address || "-"}
                                                    </td>
                                                    <td className="py-2 px-3 font-mono text-slate-700">
                                                        {item.phone || "-"}
                                                    </td>
                                                    <td className="py-2 px-3 text-right text-[11px] text-slate-400">
                                                        {new Date(item.staged_at).toLocaleTimeString("id-ID")}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: FEATURE FLAGS (BETA TOGGLES) */}
            {activeTab === "FLAGS" && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
                    <div>
                        <h3 className="font-bold text-sm text-slate-900">
                            Feature Flags &amp; Modul Beta
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Kontrol visibilitas modul baru di navigasi Topbar. Fitur dengan label Beta dapat diaktifkan atau dinonaktifkan sesuai kebutuhan operasional.
                        </p>
                    </div>

                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                        {flagsLoading ? (
                            <div className="p-8 text-center text-slate-400 text-xs">
                                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-teal-600" />
                                <span>Memuat Feature Flags...</span>
                            </div>
                        ) : (
                            flags.map((flag) => {
                                const isUpdating = updatingFlagKey === flag.key;

                                return (
                                    <div
                                        key={flag.key}
                                        className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-xs text-slate-900">
                                                    {flag.name}
                                                </h4>
                                                {flag.is_beta ? (
                                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                                                        BETA
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                                                        <Lock className="w-2.5 h-2.5" />
                                                        PERMANEN
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 max-w-xl">
                                                {flag.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {flag.is_beta ? (
                                                <button
                                                    type="button"
                                                    disabled={isUpdating}
                                                    onClick={() => handleToggleFlag(flag)}
                                                    className={`p-1 transition-transform active:scale-95 cursor-pointer ${
                                                        flag.is_enabled ? "text-teal-600" : "text-slate-300"
                                                    }`}
                                                    title={flag.is_enabled ? "Klik untuk menonaktifkan" : "Klik untuk mengaktifkan"}
                                                >
                                                    {isUpdating ? (
                                                        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                                                    ) : flag.is_enabled ? (
                                                        <ToggleRight className="w-8 h-8" />
                                                    ) : (
                                                        <ToggleLeft className="w-8 h-8" />
                                                    )}
                                                </button>
                                            ) : (
                                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                                    Selalu Aktif
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
