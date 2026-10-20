/**
 * ============================================================================
 * MODUL       : Audit Trail Senyap (Superadmin UI)
 * FILE        : src/app/admin/audit-logs/page.tsx
 * DESKRIPSI   : Halaman Stealth Activity Monitoring khusus Superadmin.
 *               Memantau seluruh aktivitas personil (kapan login, membuka tiket
 *               mana, submit aktivitas, dll.) tanpa disadari oleh teknisi.
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
    details?: Record<string, unknown>;
    ip_address?: string;
    user_agent?: string;
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
    const [logs, setLogs] = useState<AuditLogItem[]>([]);
    const [users, setUsers] = useState<FilterUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<string>("ALL");
    const [selectedAction, setSelectedAction] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
    const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

    /**
     * Memuat audit logs dari server
     */
    const loadAuditLogs = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedUser !== "ALL") params.append("username", selectedUser);
            if (selectedAction !== "ALL") params.append("action", selectedAction);
            params.append("limit", "100");

            const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
            const json = await res.json();

            if (json.success) {
                setLogs(json.logs || []);
                setUsers(json.users || []);
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
    }, [selectedUser, selectedAction]);

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
                                        Stealth Activity Monitoring
                                    </h1>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-900 text-teal-300 border border-slate-800 shadow-2xs">
                                        God Mode
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                    Rekam jejak aktivitas rekan kerja secara senyap tanpa memunculkan indikator apapun di sisi pengguna.
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                {/* FILTER TOOLBAR */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 mb-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
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
                            <span className="text-slate-500 font-medium">Teknisi:</span>
                            <select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-teal-500"
                            >
                                <option value="ALL">Semua Anggota</option>
                                {users.map((u) => (
                                    <option key={u.username} value={u.username}>
                                        @{u.username} ({u.full_name})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filter Aksi */}
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-500 font-medium">Aksi:</span>
                            <select
                                value={selectedAction}
                                onChange={(e) => setSelectedAction(e.target.value)}
                                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-teal-500"
                            >
                                <option value="ALL">Semua Aktivitas</option>
                                <option value="LOGIN">LOGIN</option>
                                <option value="LOGOUT">LOGOUT</option>
                                <option value="ADD_USER">TAMBAH USER</option>
                                <option value="UPDATE_USER">UPDATE USER</option>
                                <option value="DELETE_USER">DELETE USER</option>
                                <option value="SCRAPE_TICKET">LIHAT TIKET</option>
                                <option value="SUBMIT_ACTIVITY">INPUT AKTIVITAS</option>
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
                            <p className="text-sm font-semibold text-slate-600">Belum ada aktivitas tercatat</p>
                            <p className="text-xs text-slate-400">Aktivitas login dan scraping tiket akan muncul di sini secara otomatis.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                                        <th className="py-3 px-4">Waktu</th>
                                        <th className="py-3 px-4">Teknisi</th>
                                        <th className="py-3 px-4">Jenis Aksi</th>
                                        <th className="py-3 px-4">Target / Objek</th>
                                        <th className="py-3 px-4">Alamat IP &amp; Client</th>
                                        <th className="py-3 px-4 text-right">Detail</th>
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

                                                {/* Teknisi */}
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
                                                <td className="py-3 px-4 text-slate-500 text-[11px]">
                                                    <div className="flex items-center gap-1.5">
                                                        <Globe className="w-3 h-3 text-slate-400" />
                                                        <span className="font-mono">{log.ip_address || "127.0.0.1"}</span>
                                                    </div>
                                                </td>

                                                {/* Toggle Detail Button */}
                                                <td className="py-3 px-4 text-right">
                                                    {log.details && Object.keys(log.details).length > 0 ? (
                                                        <button
                                                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 cursor-pointer"
                                                        >
                                                            <span>{isExpanded ? "Tutup" : "Payload"}</span>
                                                            {isExpanded ? (
                                                                <ChevronUp className="w-3 h-3" />
                                                            ) : (
                                                                <ChevronDown className="w-3 h-3" />
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-300 text-[11px]">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* EXPANDABLE JSON DETAIL MODAL / DRAWER */}
                {expandedLogId && (
                    <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 shadow-xl animate-in fade-in">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-bold text-teal-400">
                            <span className="flex items-center gap-2">
                                <Terminal className="w-4 h-4" />
                                Payload Raw Data: Log #{expandedLogId}
                            </span>
                            <button
                                onClick={() => setExpandedLogId(null)}
                                className="text-slate-400 hover:text-white"
                            >
                                Tutup Panel
                            </button>
                        </div>
                        <pre className="text-[11px] font-mono overflow-x-auto text-emerald-300 leading-relaxed p-2">
                            {JSON.stringify(
                                logs.find((l) => l.id === expandedLogId)?.details || {},
                                null,
                                2
                            )}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// BAGIAN 5: HELPER / UTILITY FUNCTIONS
// ----------------------------------------------------------------------------
// Helper internal terintegrasi di komponen utama di atas

// ----------------------------------------------------------------------------
// BAGIAN 6: EXPORT & PUBLIC API
// ----------------------------------------------------------------------------
// Default export di atas untuk Next.js App Router
