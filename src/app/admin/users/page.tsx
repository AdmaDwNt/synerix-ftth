/**
 * ============================================================================
 * MODUL       : Manajemen Pengguna & Hak Akses (Superadmin UI)
 * FILE        : src/app/admin/users/page.tsx
 * DESKRIPSI   : Halaman dashboard kontrol pengguna untuk Superadmin.
 *               Mendukung tambah teknisi baru, ubah role, atur izin modul rute,
 *               toggle status aktif/non-aktif, dan reset password terenkripsi.
 *               Dilengkapi SynerixConfirmModal & SynerixNotify (Toast+Snackbar+Banner).
 * ============================================================================
 */

"use client";

// ----------------------------------------------------------------------------
// BAGIAN 1: IMPORT & DEPENDENCIES
// ----------------------------------------------------------------------------
import { useState, useEffect, useMemo } from "react";
import {
    Users,
    UserPlus,
    Shield,
    CheckCircle2,
    Search,
    Edit3,
    Trash2,
    Key,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    X,
    Layers,
    Wrench,
    Truck,
    MapPin,
    Calendar,
    Clock,
} from "lucide-react";
import SynerixConfirmModal from "@/components/ui/SynerixConfirmModal";
import SynerixNotify, { useNotify } from "@/components/ui/SynerixNotify";

// ----------------------------------------------------------------------------
// BAGIAN 2: DEFINISI TIPE & INTERFACE (TYPESCRIPT CONTRACT)
// ----------------------------------------------------------------------------
export interface ManagedUser {
    id: string;
    username: string;
    full_name: string;
    role: "superadmin" | "technician" | "viewer";
    is_active: boolean;
    allowed_routes: string[];
    last_login_at?: string;
    created_at: string;
    updated_at: string;
}

interface RouteOption {
    label: string;
    route: string;
    icon: typeof Wrench;
}

// ----------------------------------------------------------------------------
// BAGIAN 3: KONSTANTA & KONFIGURASI
// ----------------------------------------------------------------------------
const AVAILABLE_ROUTES: RouteOption[] = [
    { label: "Pekerjaan (Work Logs)", route: "/work-logs", icon: Wrench },
    { label: "Dismantle", route: "/dismantles", icon: Truck },
    { label: "Mapping GIS", route: "/mapping", icon: MapPin },
    { label: "Shift & Cuti", route: "/shifts", icon: Calendar },
    { label: "Lembur", route: "/overtime", icon: Clock },
    { label: "Guide Core", route: "/core-guide", icon: Layers },
];

// ----------------------------------------------------------------------------
// BAGIAN 4: LOGIKA UTAMA (CORE COMPONENT & STATE)
// ----------------------------------------------------------------------------
export default function AdminUsersPage() {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState<string>("ALL");

    // Synerix Unified Notification System (Toast + Snackbar + Banner)
    const notify = useNotify();

    // Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal Konfirmasi Hapus User
    const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form Tambah User
    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newFullName, setNewFullName] = useState("");
    const [newRole, setNewRole] = useState<"superadmin" | "technician">("technician");
    const [newRoutes, setNewRoutes] = useState<string[]>([
        "/work-logs",
        "/dismantles",
        "/mapping",
        "/core-guide",
        "/shifts",
    ]);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Form Edit User
    const [editFullName, setEditFullName] = useState("");
    const [editRole, setEditRole] = useState<"superadmin" | "technician" | "viewer">("technician");
    const [editIsActive, setEditIsActive] = useState(true);
    const [editRoutes, setEditRoutes] = useState<string[]>([]);
    const [editNewPassword, setEditNewPassword] = useState("");
    const [showEditPassword, setShowEditPassword] = useState(false);

    // Load data pengguna dari API
    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/users");
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || "Gagal memuat daftar pengguna.");
            }
            setUsers(json.users || []);
        } catch (err) {
            notify.toast("error", err instanceof Error ? err.message : "Terjadi kesalahan saat memuat daftar pengguna.", {
                title: "Gagal Memuat Data",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // Filter daftar pengguna
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const matchSearch =
                u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.full_name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchRole = filterRole === "ALL" || u.role === filterRole;
            return matchSearch && matchRole;
        });
    }, [users, searchQuery, filterRole]);

    // Summary Metrics
    const metrics = useMemo(() => {
        const total = users.length;
        const active = users.filter((u) => u.is_active).length;
        const superadmins = users.filter((u) => u.role === "superadmin").length;
        const technicians = users.filter((u) => u.role === "technician").length;
        return { total, active, superadmins, technicians };
    }, [users]);

    // Handle Buka Modal Edit
    const handleOpenEdit = (user: ManagedUser) => {
        setSelectedUser(user);
        setEditFullName(user.full_name);
        setEditRole(user.role);
        setEditIsActive(user.is_active);
        setEditRoutes(user.allowed_routes || []);
        setEditNewPassword("");
        setShowEditPassword(false);
        setIsEditModalOpen(true);
    };

    // Handle Submit Tambah User Baru
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: newUsername.trim(),
                    password: newPassword,
                    full_name: newFullName.trim(),
                    role: newRole,
                    allowed_routes: newRoutes,
                }),
            });

            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || "Gagal menambahkan pengguna.");
            }

            notify.snackbar("success", `Akun @${newUsername} (${newFullName}) berhasil didaftarkan ke sistem.`, {
                title: "Pengguna Ditambahkan",
            });

            setIsAddModalOpen(false);
            setNewUsername("");
            setNewPassword("");
            setNewFullName("");
            loadUsers();
        } catch (err) {
            notify.toast("error", err instanceof Error ? err.message : "Terjadi kesalahan sistem.", {
                title: "Gagal Menambah Pengguna",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Submit Edit User
    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: selectedUser.id,
                    full_name: editFullName.trim(),
                    role: editRole,
                    is_active: editIsActive,
                    allowed_routes: editRoutes,
                    new_password: editNewPassword.trim() || undefined,
                }),
            });

            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || "Gagal memperbarui pengguna.");
            }

            notify.snackbar("success", `Pengaturan akun @${selectedUser.username} berhasil disimpan.`, {
                title: "Data Diperbarui",
            });

            setIsEditModalOpen(false);
            loadUsers();
        } catch (err) {
            notify.toast("error", err instanceof Error ? err.message : "Terjadi kesalahan sistem.", {
                title: "Gagal Memperbarui Pengguna",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Toggle Status Cepat (Aktif / Non-Aktif)
    const handleToggleActive = async (user: ManagedUser) => {
        const targetStatus = !user.is_active;
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: user.id,
                    is_active: targetStatus,
                }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || "Gagal mengubah status aktif.");
            }

            notify.snackbar(targetStatus ? "success" : "warning", `Akun @${user.username} kini berstatus ${targetStatus ? "Aktif" : "Nonaktif"}.`);

            loadUsers();
        } catch (err) {
            notify.toast("error", err instanceof Error ? err.message : "Terjadi kendala jaringan.", {
                title: "Gagal Mengubah Status",
            });
        }
    };

    // Eksekusi Hapus User via EnterpriseConfirmModal
    const handleConfirmDeleteUser = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/admin/users?id=${userToDelete.id}`, { method: "DELETE" });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || "Gagal menghapus pengguna.");
            }

            notify.snackbar("success", `Akun @${userToDelete.username} (${userToDelete.full_name}) telah dihapus secara permanen.`, {
                title: "Pengguna Dihapus",
            });

            setUserToDelete(null);
            loadUsers();
        } catch (err) {
            notify.toast("error", err instanceof Error ? err.message : "Terjadi kendala sistem.", {
                title: "Gagal Menghapus Akun",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="w-full min-h-screen bg-slate-50/50 pb-16 font-sans">
            {/* SYNERIX UNIFIED NOTIFICATION (Toast + Snackbar + Banner) */}
            <SynerixNotify items={notify.items} onDismiss={notify.dismiss} />

            {/* TOP HEADER SECTION */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs">
                                <Shield className="w-5 h-5 text-teal-700" />
                            </span>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                    Manajemen Pengguna &amp; Hak Akses
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
                                    Kontrol akun rekan kerja, peran hak akses, izin modul, dan sinkronisasi kredensial Billingnesia.
                                </p>
                            </div>
                        </div>

                        {/* TOMBOL TAMBAH USER */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>Tambah Teknisi Baru</span>
                            </button>
                        </div>
                    </div>

                    {/* METRIC CARDS STRIP */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
                        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs transition-all hover:border-slate-300">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Akun</p>
                            <p className="text-2xl font-extrabold text-slate-900 mt-1">{metrics.total}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/90 shadow-2xs transition-all hover:border-emerald-300">
                            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Akun Aktif</p>
                            <p className="text-2xl font-extrabold text-emerald-900 mt-1">{metrics.active}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xs text-white transition-all">
                            <p className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">Superadmin</p>
                            <p className="text-2xl font-extrabold text-white mt-1">{metrics.superadmins}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/90 shadow-2xs transition-all hover:border-teal-300">
                            <p className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">Teknisi Lapangan</p>
                            <p className="text-2xl font-extrabold text-teal-950 mt-1">{metrics.technicians}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT CONTAINER */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                {/* FILTER & PENCARIAN BAR */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama atau @username..."
                            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Filter Role:</span>
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-teal-500"
                        >
                            <option value="ALL">Semua Role</option>
                            <option value="superadmin">Superadmin</option>
                            <option value="technician">Teknisi</option>
                            <option value="viewer">Viewer</option>
                        </select>
                    </div>
                </div>

                {/* TABEL PENGGUNA */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                            <p className="text-xs font-medium">Memuat daftar pengguna...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                            <Users className="w-10 h-10 stroke-[1.5]" />
                            <p className="text-sm font-bold text-slate-700">Tidak ada pengguna ditemukan</p>
                            <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter role.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                                        <th className="py-3 px-4">Pengguna</th>
                                        <th className="py-3 px-4">Role</th>
                                        <th className="py-3 px-4">Hak Akses Modul</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Login Terakhir</th>
                                        <th className="py-3 px-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                                            {/* Nama & Username */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-inner shrink-0">
                                                        {user.full_name ? user.full_name.slice(0, 2).toUpperCase() : "FT"}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{user.full_name}</p>
                                                        <p className="text-[11px] text-slate-400 font-mono">@{user.username}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role Badge */}
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-tight ${
                                                        user.role === "superadmin"
                                                            ? "bg-slate-900 text-teal-300 border border-slate-800"
                                                            : user.role === "technician"
                                                            ? "bg-teal-50 text-teal-800 border border-teal-200"
                                                            : "bg-slate-100 text-slate-600 border border-slate-200"
                                                    }`}
                                                >
                                                    {user.role === "superadmin" && <Shield className="w-2.5 h-2.5 text-teal-400" />}
                                                    {user.role.toUpperCase()}
                                                </span>
                                            </td>

                                            {/* Allowed Routes Badges */}
                                            <td className="py-3 px-4">
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {user.role === "superadmin" ? (
                                                        <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200">
                                                            Semua Modul (God Mode)
                                                        </span>
                                                    ) : user.allowed_routes && user.allowed_routes.length > 0 ? (
                                                        user.allowed_routes.map((route) => (
                                                            <span
                                                                key={route}
                                                                className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200"
                                                            >
                                                                {route.replace("/", "")}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 italic">
                                                            Belum diatur
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status Keaktifan */}
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => handleToggleActive(user)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 cursor-pointer ${
                                                        user.is_active
                                                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                                                            : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                                                    }`}
                                                    title="Klik untuk mengubah status aktif"
                                                >
                                                    {user.is_active ? (
                                                        <>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span>Aktif</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                                            <span>Nonaktif</span>
                                                        </>
                                                    )}
                                                </button>
                                            </td>

                                            {/* Last Login Time */}
                                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                                                {user.last_login_at
                                                    ? new Date(user.last_login_at).toLocaleString("id-ID", {
                                                          dateStyle: "medium",
                                                          timeStyle: "short",
                                                      })
                                                    : "Belum pernah"}
                                            </td>

                                            {/* Action Buttons */}
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleOpenEdit(user)}
                                                        className="p-2 rounded-xl text-slate-500 hover:text-teal-700 hover:bg-teal-50 active:scale-95 transition-all cursor-pointer"
                                                        title="Edit Hak Akses / Reset Password"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setUserToDelete(user)}
                                                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all cursor-pointer"
                                                        title="Hapus Pengguna"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL KONFIRMASI HAPUS (SYNERIX CONFIRM MODAL) */}
            <SynerixConfirmModal
                isOpen={!!userToDelete}
                onClose={() => !isDeleting && setUserToDelete(null)}
                onConfirm={handleConfirmDeleteUser}
                title="Hapus Akun Pengguna"
                description="Tindakan ini akan menghapus akun teknisi secara permanen dari sistem Synerix-FTTH dan mencabut seluruh sesi otentikasinya. Tindakan ini tidak dapat dibatalkan."
                itemName={userToDelete ? `@${userToDelete.username} (${userToDelete.full_name})` : undefined}
                itemBadge={userToDelete ? userToDelete.role.toUpperCase() : undefined}
                itemMeta={userToDelete?.role === "superadmin" ? "Superadmin" : "Teknisi Lapangan"}
                confirmText="Hapus Pengguna"
                cancelText="Batal"
                variant="danger"
                loading={isDeleting}
            />

            {/* MODAL TAMBAH TEKNISI BARU */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in"
                        onClick={() => !isSubmitting && setIsAddModalOpen(false)}
                    />
                    <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
                        {/* Header Gradient Accent Bar */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600" />

                        <div className="p-6">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <span className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs">
                                        <UserPlus className="w-5 h-5 text-teal-700" />
                                    </span>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900 tracking-tight">Tambah Teknisi Baru</h2>
                                        <p className="text-xs text-slate-400">Daftarkan rekan kerja dengan akun Billingnesia</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    disabled={isSubmitting}
                                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                    title="Tutup dialog"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateUser} className="space-y-4 mt-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Username Billingnesia
                                    </label>
                                    <input
                                        type="text"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        placeholder="Contoh: rizal.teknisi"
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Password Akun Billingnesia
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            required
                                            className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Nama Lengkap Teknisi
                                    </label>
                                    <input
                                        type="text"
                                        value={newFullName}
                                        onChange={(e) => setNewFullName(e.target.value)}
                                        placeholder="Contoh: Rizal Pratama"
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Peran (Role)
                                    </label>
                                    <select
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value as "superadmin" | "technician")}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                                    >
                                        <option value="technician">Teknisi Lapangan (Hanya melihat data miliknya)</option>
                                        <option value="superadmin">Superadmin (Akses penuh + Monitoring)</option>
                                    </select>
                                </div>

                                {/* Checklist Izin Modul */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Izin Akses Menu Modul
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                                        {AVAILABLE_ROUTES.map((item) => {
                                            const isChecked = newRoutes.includes(item.route);
                                            return (
                                                <label
                                                    key={item.route}
                                                    className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setNewRoutes([...newRoutes, item.route]);
                                                            } else {
                                                                setNewRoutes(newRoutes.filter((r) => r !== item.route));
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                                                    />
                                                    <span>{item.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        disabled={isSubmitting}
                                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-teal-600/20 shadow-md flex items-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        <span>Simpan Pengguna</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EDIT PENGGUNA & RESET PASSWORD */}
            {isEditModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in"
                        onClick={() => !isSubmitting && setIsEditModalOpen(false)}
                    />
                    <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
                        {/* Header Gradient Accent Bar */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600" />

                        <div className="p-6">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <span className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs">
                                        <Edit3 className="w-5 h-5 text-teal-700" />
                                    </span>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                                            Edit Pengguna: @{selectedUser.username}
                                        </h2>
                                        <p className="text-xs text-slate-400">Ubah peran, status keaktifan, atau reset password</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    disabled={isSubmitting}
                                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                    title="Tutup dialog"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateUser} className="space-y-4 mt-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Nama Lengkap
                                    </label>
                                    <input
                                        type="text"
                                        value={editFullName}
                                        onChange={(e) => setEditFullName(e.target.value)}
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Role Akun
                                        </label>
                                        <select
                                            value={editRole}
                                            onChange={(e) =>
                                                setEditRole(e.target.value as "superadmin" | "technician" | "viewer")
                                            }
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                                        >
                                            <option value="technician">Teknisi Lapangan</option>
                                            <option value="superadmin">Superadmin</option>
                                            <option value="viewer">Viewer (Hanya Pantau)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Status Keaktifan
                                        </label>
                                        <select
                                            value={editIsActive ? "ACTIVE" : "INACTIVE"}
                                            onChange={(e) => setEditIsActive(e.target.value === "ACTIVE")}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                                        >
                                            <option value="ACTIVE">Aktif (Dapat Login)</option>
                                            <option value="INACTIVE">Nonaktif (Akses Ditolak)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Reset Password Opsional */}
                                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/90 shadow-2xs">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <Key className="w-3.5 h-3.5 text-amber-700" />
                                        <span className="text-xs font-bold text-amber-900">
                                            Ganti / Reset Password (Opsional)
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-amber-800/80 mb-2.5">
                                        Kosongkan jika tidak ingin mengganti password akun Billingnesia teknisi ini.
                                    </p>
                                    <div className="relative">
                                        <input
                                            type={showEditPassword ? "text" : "password"}
                                            value={editNewPassword}
                                            onChange={(e) => setEditNewPassword(e.target.value)}
                                            placeholder="Ketik password baru jika ingin diubah..."
                                            className="w-full px-3 py-2 pr-10 rounded-xl border border-amber-300/90 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowEditPassword(!showEditPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                        >
                                            {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Checklist Izin Modul */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Izin Akses Menu Modul
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                                        {AVAILABLE_ROUTES.map((item) => {
                                            const isChecked = editRoutes.includes(item.route);
                                            return (
                                                <label
                                                    key={item.route}
                                                    className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setEditRoutes([...editRoutes, item.route]);
                                                            } else {
                                                                setEditRoutes(editRoutes.filter((r) => r !== item.route));
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                                                    />
                                                    <span>{item.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        disabled={isSubmitting}
                                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-teal-600/20 shadow-md flex items-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        <span>Simpan Perubahan</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ----------------------------------------------------------------------------
// BAGIAN 5: HELPER / UTILITY FUNCTIONS
// ----------------------------------------------------------------------------
// Seluruh helper modular terintegrasi di komponen utama di atas

// ----------------------------------------------------------------------------
// BAGIAN 6: EXPORT & PUBLIC API
// ----------------------------------------------------------------------------
// Default export diekspor langsung pada deklarasi komponen utama di atas
