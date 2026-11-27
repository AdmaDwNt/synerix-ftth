/**
 * ============================================================================
 * MODUL       : Audit Trail Senyap (Superadmin UI)
 * FILE        : src/app/admin/audit-logs/page.tsx
 * DESKRIPSI   : Halaman Stealth Activity Monitoring & Firewall khusus Superadmin.
 *               Terbagi dalam 3 Tab:
 *               1. Data Activity (mutasi data tiket, dismantle, scraper)
 *               2. Auth & Session Log (login, logout, tantangan 2FA/CAPTCHA, lockout)
 *               3. Bot & Intrusion Detection (percobaan bot, rate limit 429, 1-click blokir IP)
 * ============================================================================
 */

"use client";

// ----------------------------------------------------------------------------
// BAGIAN 1: IMPORT & DEPENDENCIES
// ----------------------------------------------------------------------------
import { useState, useEffect, useMemo } from "react";
import {
    ShieldAlert,
    RefreshCw,
    Search,
    Clock,
    User,
    Globe,
    FileText,
    Terminal,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    LogOut,
    Eye,
    Key,
    Database,
    Shield,
    Lock,
    Unlock,
    AlertTriangle,
    Loader2,
    CheckCircle2,
} from "lucide-react";

// ----------------------------------------------------------------------------
// BAGIAN 2: DEFINISI TIPE & INTERFACE (TYPESCRIPT CONTRACT)
// ----------------------------------------------------------------------------
interface AuditLogItem {
    id: string;
    user_id: string;
    username: string;
    action_type: string;
    target_id?: string;
    category?: "DATA_ACTIVITY" | "AUTH_SESSION" | "BOT_INTRUSION";
    risk_level?: "INFO" | "WARNING" | "CRITICAL";
    flagged_bot?: boolean;
    details?: Record<string, unknown>;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
}

interface BlockedIpItem {
    ip_address: string;
    reason: string;
    risk_level?: string;
    blocked_by: string;
    created_at: string;
}

interface FilterUser {
    username: string;
    full_name: string;
    role: string;
}

// ----------------------------------------------------------------------------
// BAGIAN 3: KONSTANTA & KONFIGURASI
// ----------------------------------------------------------------------------
const ACTION_BADGES: Record<
    string,
    { label: string; bg: string; text: string; border: string; icon: typeof Eye }
> = {
    LOGIN: { label: "LOGIN", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle },
    LOGOUT: { label: "LOGOUT", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", icon: LogOut },
    LOGIN_FAILED: { label: "LOGIN GAGAL", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", icon: ShieldAlert },
    ACCOUNT_LOCKED: { label: "LOCKOUT SEMENTARA", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", icon: Lock },
    RATE_LIMIT_429: { label: "RATE LIMIT 429", bg: "bg-rose-100", text: "text-rose-900", border: "border-rose-300", icon: ShieldAlert },
    BLOCK_IP: { label: "BLOKIR IP", bg: "bg-red-50", text: "text-red-800", border: "border-red-200", icon: Lock },
    UNBLOCK_IP: { label: "BUKA BLOKIR IP", bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", icon: Unlock },
    ADD_USER: { label: "TAMBAH USER", bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", icon: Key },
    UPDATE_USER: { label: "UPDATE USER", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: Key },
    DELETE_USER: { label: "HAPUS USER", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: ShieldAlert },
    SCRAPE_TICKET: { label: "LIHAT TIKET", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: Eye },
    SUBMIT_ACTIVITY: { label: "INPUT AKTIVITAS", bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200", icon: Database },
};

// ----------------------------------------------------------------------------
// BAGIAN 4: LOGIKA UTAMA (CORE COMPONENT & STATE)
// ----------------------------------------------------------------------------
export default function AdminAuditLogsPage() {
    const [currentTab, setCurrentTab] = useState<"DATA_ACTIVITY" | "AUTH_SESSION" | "BOT_INTRUSION">("DATA_ACTIVITY");
    const [logs, setLogs] = useState<AuditLogItem[]>([]);
    const [blockedIps, setBlockedIps] = useState<BlockedIpItem[]>([]);
    const [users, setUsers] = useState<FilterUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
    const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [actionLoadingIp, setActionLoadingIp] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    /**
     * Memuat audit logs dari server
     */
    const loadAuditLogs = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedUser !== "ALL") params.append("username", selectedUser);
            params.append("category", currentTab);
            params.append("limit", "150");

            const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
            const json = await res.json();

            if (json.success) {
                setLogs(json.logs || []);
                setUsers(json.users || []);
                setBlockedIps(json.blockedIps || []);
                setLastRefreshedAt(new Date());
            }
        } catch (err) {
            console.error("Gagal memuat audit logs:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAuditLogs();
    }, [currentTab, selectedUser]);

    /**
     * 1-Click Blokir Alamat IP
     */
    const handleBlockIp = async (ipAddress: string) => {
        const reason = prompt(`Masukkan alasan memblokir IP ${ipAddress}:`, "Terdeteksi brute-force / serangan bot");
        if (!reason) return;

        setActionLoadingIp(ipAddress);
        try {
            const res = await fetch("/api/admin/audit-logs/block-ip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ipAddress, reason, action: "BLOCK" }),
            });
            const json = await res.json();
            if (json.success) {
                showToast(`Alamat IP ${ipAddress} berhasil diblokir!`);
                loadAuditLogs();
            } else {
                alert(json.error || "Gagal memblokir IP.");
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setActionLoadingIp(null);
        }
    };

    /**
     * Buka Blokir Alamat IP
     */
    const handleUnblockIp = async (ipAddress: string) => {
        if (!confirm(`Buka blokir untuk alamat IP ${ipAddress}?`)) return;

        setActionLoadingIp(ipAddress);
        try {
            const res = await fetch("/api/admin/audit-logs/block-ip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ipAddress, action: "UNBLOCK" }),
            });
            const json = await res.json();
            if (json.success) {
                showToast(`Blokir IP ${ipAddress} telah dibuka.`);
                loadAuditLogs();
            } else {
                alert(json.error || "Gagal membuka blokir IP.");
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setActionLoadingIp(null);
        }
    };

    const isIpBlocked = (ip?: string) => {
        if (!ip) return false;
        return blockedIps.some((b) => b.ip_address === ip.trim());
    };

    // Filter pencarian teks
    const filteredLogs = useMemo(() => {
        if (!searchQuery.trim()) return logs;
        const q = searchQuery.toLowerCase();
        return logs.filter(
            (log) =>
                log.username.toLowerCase().includes(q) ||
                log.action_type.toLowerCase().includes(q) ||
                (log.target_id && log.target_id.toLowerCase().includes(q)) ||
                (log.ip_address && log.ip_address.includes(q))
        );
    }, [logs, searchQuery]);

    return (
        <div className="w-full min-h-screen bg-slate-50/50 pb-16">
            {/* TOP HEADER SECTION */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="p-2.5 rounded-2xl bg-slate-900 text-teal-400 border border-slate-800 shadow-md">
                                <Terminal className="w-5 h-5" />
                            </span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                                        Stealth Activity &amp; Intrusion Firewall
                                    </h1>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-900 text-teal-300 border border-slate-800 shadow-2xs">
                                        God Mode
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                    Rekam jejak audit senyap, pemantauan auth session, dan sistem pertahanan bot firewall 1-click IP blocking.
                                </p>
                            </div>
                        </div>

                        {/* TOMBOL REFRESH */}
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400 hidden sm:block">
                                Diperbarui: {lastRefreshedAt.toLocaleTimeString("id-ID")}
                            </span>
                            <button
                                onClick={loadAuditLogs}
                                disabled={isLoading}
                                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-teal-600" : ""}`} />
                                <span>Segarkan</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT CONTAINER */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-4">
                {/* Toast Notification */}
                {toastMessage && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* 3 TABS HEADER */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setCurrentTab("DATA_ACTIVITY")}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentTab === "DATA_ACTIVITY"
                                ? "bg-teal-700 text-white shadow-2xs"
                                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                    >
                        <Database className="w-4 h-4" />
                        <span>Aktivitas Data (Tiket &amp; Scraper)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setCurrentTab("AUTH_SESSION")}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentTab === "AUTH_SESSION"
                                ? "bg-teal-700 text-white shadow-2xs"
                                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                    >
                        <User className="w-4 h-4" />
                        <span>Sesi &amp; Autentikasi Pengguna</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setCurrentTab("BOT_INTRUSION")}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentTab === "BOT_INTRUSION"
                                ? "bg-rose-700 text-white shadow-2xs"
                                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                    >
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                        <span>Deteksi Bot &amp; Firewall IP ({blockedIps.length} Terblokir)</span>
                    </button>
                </div>

                {/* TAB 3 EXTRA: Blocked IPs Summary Strip */}
                {currentTab === "BOT_INTRUSION" && blockedIps.length > 0 && (
                    <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-rose-950">
                            <span className="flex items-center gap-1.5">
                                <Lock className="w-4 h-4 text-rose-600" />
                                Daftar IP yang Sedang Diblokir Firewall ({blockedIps.length})
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {blockedIps.map((b) => (
                                <div
                                    key={b.ip_address}
                                    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-xs font-mono font-bold text-rose-900 shadow-2xs"
                                >
                                    <span>{b.ip_address}</span>
                                    <span className="text-[10px] text-slate-400 font-sans font-normal">
                                        ({b.reason})
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleUnblockIp(b.ip_address)}
                                        className="text-emerald-700 hover:text-emerald-900 text-[10px] underline font-bold"
                                    >
                                        Buka Blokir
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* FILTER TOOLBAR */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
                    {/* Search Input */}
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari username, target ID, atau IP..."
                            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                        {/* Filter Teknisi */}
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-500 font-medium">Pengguna:</span>
                            <select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-teal-500"
                            >
                                <option value="ALL">Semua Pengguna</option>
                                {users.map((u) => (
                                    <option key={u.username} value={u.username}>
                                        @{u.username} ({u.full_name})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* TIMELINE ACTIVITY STREAM TABLE */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                            <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
                            <p className="text-xs">Memuat rekam jejak aktivitas...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                            <FileText className="w-10 h-10 stroke-[1.5]" />
                            <p className="text-sm font-semibold text-slate-600">Belum ada aktivitas pada kategori ini</p>
                            <p className="text-xs text-slate-400">Aktivitas baru akan dicatat secara otomatis.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                                        <th className="py-3 px-4">Waktu</th>
                                        <th className="py-3 px-4">Pengguna</th>
                                        <th className="py-3 px-4">Jenis Aksi</th>
                                        <th className="py-3 px-4">Target / Objek</th>
                                        <th className="py-3 px-4">Alamat IP &amp; Client</th>
                                        <th className="py-3 px-4 text-right">Tindakan Keamanan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredLogs.map((log) => {
                                        const badge = ACTION_BADGES[log.action_type] || {
                                            label: log.action_type,
                                            bg: "bg-slate-100",
                                            text: "text-slate-700",
                                            border: "border-slate-200",
                                            icon: Eye,
                                        };
                                        const Icon = badge.icon;
                                        const isExpanded = expandedLogId === log.id;
                                        const blocked = isIpBlocked(log.ip_address);

                                        return (
                                            <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                                                {/* Waktu */}
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>
                                                            {new Date(log.created_at).toLocaleTimeString("id-ID", {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                                second: "2-digit",
                                                            })}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        {new Date(log.created_at).toLocaleDateString("id-ID", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </p>
                                                </td>

                                                {/* Pengguna */}
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] border border-slate-200">
                                                            <User className="w-3 h-3" />
                                                        </div>
                                                        <span className="font-bold text-slate-800">
                                                            @{log.username}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Jenis Aksi */}
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                                                    >
                                                        <Icon className="w-3 h-3" />
                                                        <span>{badge.label}</span>
                                                    </span>
                                                </td>

                                                {/* Target Objek */}
                                                <td className="py-3 px-4">
                                                    {log.target_id ? (
                                                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                                                            {log.target_id}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic text-[11px]">-</span>
                                                    )}
                                                </td>

                                                {/* IP & Client */}
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 font-semibold">
                                                        <Globe className="w-3 h-3 text-slate-400" />
                                                        <span>{log.ip_address || "127.0.0.1"}</span>
                                                        {blocked && (
                                                            <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[9px] font-bold">
                                                                BLOCKED
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 max-w-xs truncate mt-0.5">
                                                        {log.user_agent || "Billingnesia Client"}
                                                    </p>
                                                </td>

                                                {/* Tindakan Keamanan / 1-Click Blokir */}
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {log.ip_address && log.ip_address !== "127.0.0.1" && (
                                                            blocked ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUnblockIp(log.ip_address!)}
                                                                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                                                                >
                                                                    Buka Blokir
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleBlockIp(log.ip_address!)}
                                                                    className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                                                                >
                                                                    <Lock className="w-2.5 h-2.5" />
                                                                    <span>Blokir IP</span>
                                                                </button>
                                                            )
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                                            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                                        >
                                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
