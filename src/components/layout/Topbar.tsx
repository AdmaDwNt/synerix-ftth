/**
 * ============================================================================
 * MODUL       : Layout Aplikasi (Topbar & Navigation)
 * FILE        : src/components/layout/Topbar.tsx
 * DESKRIPSI   : Komponen navigasi atas dan bawah untuk Synerix-FTTH.
 *               Mendukung profil teknisi/superadmin aktif, logout, menu mobile,
 *               dan disembunyikan secara otomatis saat berada di /login.
 * ============================================================================
 */

"use client";

// ----------------------------------------------------------------------------
// BAGIAN 1: IMPORT & DEPENDENCIES
// ----------------------------------------------------------------------------
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
    Activity,
    Wrench,
    MapPin,
    Truck,
    Calendar,
    Clock,
    Layers,
    Menu,
    X,
    User,
    LogOut,
    Shield,
    Users,
    FileText,
    ChevronDown,
    Sparkles,
    FileSpreadsheet,
    History,
    MessageSquare,
    Wifi,
    Settings,
} from "lucide-react";
import WhatsAppTemplateModal from "@/components/noc/WhatsAppTemplateModal";
import WifiGuideModal from "@/components/noc/WifiGuideModal";

// ----------------------------------------------------------------------------
// BAGIAN 2: DEFINISI TIPE & INTERFACE (TYPESCRIPT CONTRACT)
// ----------------------------------------------------------------------------
interface ActiveUser {
    id: string;
    username: string;
    full_name: string;
    role: "superadmin" | "technician" | "viewer";
    allowed_routes: string[];
}

// ----------------------------------------------------------------------------
// BAGIAN 3: KONSTANTA & KONFIGURASI
// ----------------------------------------------------------------------------
const primaryNavBefore = [
    { name: "Overview", href: "/", icon: Activity },
    { name: "Pekerjaan", href: "/work-logs", icon: Wrench },
    { name: "Mapping GIS", href: "/mapping", icon: MapPin },
    { name: "Dismantle", href: "/dismantles", icon: Truck },
];

const primaryNavAfter = [
    { name: "Guide Core", href: "/core-guide", icon: Layers },
];

const mobileBottomNav = [
    { name: "Overview", href: "/", icon: Activity },
    { name: "Pekerjaan", href: "/work-logs", icon: Wrench },
    { name: "Mapping", href: "/mapping", icon: MapPin },
    { name: "Dismantle", href: "/dismantles", icon: Truck },
];

// ----------------------------------------------------------------------------
// BAGIAN 4: LOGIKA UTAMA (CORE BUSINESS LOGIC)
// ----------------------------------------------------------------------------
export default function Topbar() {
    const pathname = usePathname();
    const router = useRouter();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [shiftDropdownOpen, setShiftDropdownOpen] = useState(false);
    const [layananDropdownOpen, setLayananDropdownOpen] = useState(false);
    const [isWaModalOpen, setIsWaModalOpen] = useState(false);
    const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<ActiveUser | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const shiftDropdownRef = useRef<HTMLDivElement>(null);
    const layananDropdownRef = useRef<HTMLDivElement>(null);

    // Ambil data user aktif saat navigasi berubah
    useEffect(() => {
        setMobileMenuOpen(false);
        setUserDropdownOpen(false);
        setShiftDropdownOpen(false);
        setLayananDropdownOpen(false);

        if (pathname === "/login") return;

        fetch("/api/auth/me")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data?.authenticated && data?.user) {
                    setCurrentUser(data.user);
                }
            })
            .catch(() => {});
    }, [pathname]);

    // Tutup dropdown jika klik di luar
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setUserDropdownOpen(false);
            }
            if (shiftDropdownRef.current && !shiftDropdownRef.current.contains(e.target as Node)) {
                setShiftDropdownOpen(false);
            }
            if (layananDropdownRef.current && !layananDropdownRef.current.contains(e.target as Node)) {
                setLayananDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Kunci scroll body saat mobile menu drawer terbuka
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [mobileMenuOpen]);

    /**
     * Handler logout pengguna
     */
    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            setCurrentUser(null);
            router.push("/login");
            router.refresh();
        } catch (err) {
            console.error("Gagal logout:", err);
            router.push("/login");
        }
    };

    // Sembunyikan Topbar sepenuhnya di halaman login
    if (pathname === "/login") {
        return null;
    }

    const isShiftActive = pathname === "/shifts" || pathname === "/overtime";

    const initials = currentUser?.full_name
        ? currentUser.full_name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((n) => n[0].toUpperCase())
              .join("")
        : "FT";

    return (
        <>
            {/* TOPBAR HEADER (DESKTOP & MOBILE) */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-synerix-border shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
                {/* Top Accent Gradient Line */}
                <div className="h-[2px] w-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-500" />

                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 sm:h-16 gap-2 xl:gap-3">
                        {/* Section Kiri: Logo Partner Sejajar */}
                        <div className="flex items-center shrink-0">
                            <Link
                                href="/"
                                className="flex items-center gap-1.5 sm:gap-2.5 py-1 group"
                                title="Beranda FTTH Operations"
                            >
                                <Image
                                    src="/images/logo-asterix.png"
                                    alt="Asterix Inovasi Teknologi"
                                    width={75}
                                    height={20}
                                    className="h-3.5 sm:h-4.5 md:h-5 w-auto object-contain transition-transform duration-150 group-hover:scale-[1.02]"
                                    priority
                                />
                                <div className="h-3 sm:h-4 w-[1px] bg-slate-300/80 mx-0.5 sm:mx-1" />
                                <Image
                                    src="/images/logo-fibermaxs.png"
                                    alt="Fibermaxs Partner"
                                    width={70}
                                    height={18}
                                    className="h-3 sm:h-3.5 md:h-4 w-auto object-contain opacity-90 transition-opacity hover:opacity-100"
                                />
                                <div className="h-3 sm:h-4 w-[1px] bg-slate-300/80 mx-0.5 sm:mx-1" />
                                <Image
                                    src="/images/logo-digimaxs.png"
                                    alt="Digimaxs Partner"
                                    width={70}
                                    height={18}
                                    className="h-3 sm:h-3.5 md:h-4 w-auto object-contain opacity-90 transition-opacity hover:opacity-100"
                                />
                            </Link>
                        </div>

                        {/* Section Tengah: Navigasi Desktop Menu Links */}
                        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">
                            {primaryNavBefore.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                                            isActive
                                                ? "bg-teal-50 text-teal-800 border border-teal-200/90 shadow-2xs font-bold"
                                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                        }`}
                                    >
                                        <Icon
                                            className={`w-3.5 h-3.5 ${
                                                isActive ? "text-teal-700" : "text-slate-400 group-hover:text-slate-600"
                                            }`}
                                        />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}

                            {/* Dropdown Menu Gabungan: Shift & Lembur */}
                            <div className="relative" ref={shiftDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setShiftDropdownOpen(!shiftDropdownOpen)}
                                    className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                                        shiftDropdownOpen || isShiftActive
                                            ? "bg-teal-50 text-teal-800 border border-teal-200/90 shadow-2xs font-bold"
                                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                    }`}
                                >
                                    <Calendar className={`w-3.5 h-3.5 ${isShiftActive ? "text-teal-700" : "text-slate-400"}`} />
                                    <span>Shift &amp; Lembur</span>
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                </button>

                                {shiftDropdownOpen && (
                                    <div className="absolute left-0 mt-2 w-60 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1">
                                        <div className="px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                            Manajemen Jadwal &amp; Jam Kerja
                                        </div>
                                        <Link
                                            href="/shifts"
                                            onClick={() => setShiftDropdownOpen(false)}
                                            className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                                                pathname === "/shifts"
                                                    ? "bg-teal-50 text-teal-800 font-bold"
                                                    : "text-slate-700 hover:bg-slate-50 hover:text-teal-700"
                                            }`}
                                        >
                                            <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                                            <div>
                                                <div>Shift &amp; Cuti</div>
                                                <div className="text-[10px] font-normal text-slate-400">Jadwal giliran kerja &amp; cuti teknisi</div>
                                            </div>
                                        </Link>
                                        <Link
                                            href="/overtime"
                                            onClick={() => setShiftDropdownOpen(false)}
                                            className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                                                pathname === "/overtime"
                                                    ? "bg-teal-50 text-teal-800 font-bold"
                                                    : "text-slate-700 hover:bg-slate-50 hover:text-teal-700"
                                            }`}
                                        >
                                            <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                                            <div>
                                                <div>Lembur (Overtime)</div>
                                                <div className="text-[10px] font-normal text-slate-400">Pengajuan tugas lembur &amp; rekap</div>
                                            </div>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {primaryNavAfter.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                                            isActive
                                                ? "bg-teal-50 text-teal-800 border border-teal-200/90 shadow-2xs font-bold"
                                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                        }`}
                                    >
                                        <Icon
                                            className={`w-3.5 h-3.5 ${
                                                isActive ? "text-teal-700" : "text-slate-400 group-hover:text-slate-600"
                                            }`}
                                        />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}

                            {/* Dropdown Menu Layanan (Modul Tambahan / Beta) */}
                            <div className="relative" ref={layananDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setLayananDropdownOpen(!layananDropdownOpen)}
                                    className={`flex items-center gap-1 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                                        layananDropdownOpen || pathname.startsWith("/notes") || pathname.startsWith("/tickets")
                                            ? "bg-teal-50 text-teal-800 border border-teal-200/90 shadow-2xs font-bold"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                    }`}
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                                    <span>Layanan</span>
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                </button>

                                {layananDropdownOpen && (
                                    <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1">
                                        <div className="px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                            Layanan NOC &amp; Operasional
                                        </div>
                                        <Link
                                            href="/notes"
                                            onClick={() => setLayananDropdownOpen(false)}
                                            className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-700"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Catatan Sheet NOC</span>
                                            </div>
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800">
                                                BETA
                                            </span>
                                        </Link>
                                        <Link
                                            href="/tickets/history"
                                            onClick={() => setLayananDropdownOpen(false)}
                                            className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-700"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <History className="w-3.5 h-3.5 text-teal-600" />
                                                <span>Riwayat Tiket Shift</span>
                                            </div>
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800">
                                                BETA
                                            </span>
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLayananDropdownOpen(false);
                                                setIsWaModalOpen(true);
                                            }}
                                            className="w-full text-left flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-700 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Template Chat WA</span>
                                            </div>
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800">
                                                BETA
                                            </span>
                                        </button>

                                        <div className="my-1.5 border-t border-slate-100" />

                                        <div className="px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                            Edukasi Pelanggan
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLayananDropdownOpen(false);
                                                setIsWifiModalOpen(true);
                                            }}
                                            className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-700 cursor-pointer"
                                        >
                                            <Wifi className="w-3.5 h-3.5 text-teal-600" />
                                            <span>Panduan Wi-Fi Modem</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </nav>

                        {/* Section Kanan: Status Teknisi & User Profile Menu */}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {/* Tombol Cepat Template WA (Desktop) */}
                            <button
                                type="button"
                                onClick={() => setIsWaModalOpen(true)}
                                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-teal-50 border border-slate-200/80 hover:border-teal-200 text-[11px] font-semibold text-slate-700 hover:text-teal-800 transition-colors shadow-2xs cursor-pointer"
                                title="Buka Template Pesan WhatsApp"
                            >
                                <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                                <span>Template WA</span>
                            </button>
                            {/* Role Badge (Desktop) */}
                            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-700 shadow-2xs">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span>{currentUser?.role === "superadmin" ? "Superadmin" : "Teknisi FTTH"}</span>
                            </div>

                            {/* User Profile Dropdown Menu */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                    title="Menu Pengguna"
                                    className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 transition-colors shadow-2xs cursor-pointer"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                                        {initials}
                                    </div>
                                    <span className="hidden md:block text-xs font-semibold max-w-[100px] truncate text-slate-800">
                                        {currentUser?.full_name || currentUser?.username || "Teknisi"}
                                    </span>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                                </button>

                                {/* Dropdown Menu Content */}
                                {userDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                        {/* User Info Header */}
                                        <div className="px-3.5 py-2.5 border-b border-slate-100">
                                            <p className="text-xs font-bold text-slate-800 truncate">
                                                {currentUser?.full_name || "Akun Lapangan"}
                                            </p>
                                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                                @{currentUser?.username || "billingnesia"}
                                            </p>
                                            <div className="mt-2">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        currentUser?.role === "superadmin"
                                                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                                                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                    }`}
                                                >
                                                    <Shield className="w-2.5 h-2.5" />
                                                    {currentUser?.role === "superadmin" ? "SUPERADMIN" : "TEKNISI LAPANGAN"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Menu Links Khusus Superadmin */}
                                        {currentUser?.role === "superadmin" && (
                                            <div className="py-1">
                                                <Link
                                                    href="/settings"
                                                    onClick={() => setUserDropdownOpen(false)}
                                                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                                                >
                                                    <Settings className="w-4 h-4 text-slate-400" />
                                                    <span>Pengaturan &amp; Scraper</span>
                                                </Link>
                                                <Link
                                                    href="/admin/users"
                                                    onClick={() => setUserDropdownOpen(false)}
                                                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                                                >
                                                    <Users className="w-4 h-4 text-slate-400" />
                                                    <span>Manajemen Pengguna</span>
                                                </Link>
                                                <Link
                                                    href="/admin/audit-logs"
                                                    onClick={() => setUserDropdownOpen(false)}
                                                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                                                >
                                                    <FileText className="w-4 h-4 text-slate-400" />
                                                    <span>Stealth Audit Log</span>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Tombol Logout (Standalone di Topbar) */}
                            <button
                                onClick={handleLogout}
                                title="Keluar dari Akun"
                                className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-50 hover:bg-red-50 border border-slate-200/80 hover:border-red-200 text-slate-500 hover:text-red-600 transition-all shadow-2xs cursor-pointer group"
                            >
                                <LogOut className="w-4 h-4 transition-colors" />
                                <span className="hidden sm:block text-xs font-semibold">Keluar</span>
                            </button>

                            {/* Mobile Hamburger Button */}
                            <div className="flex lg:hidden">
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    aria-label="Toggle navigation menu"
                                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Backdrop & Drawer */}
                {mobileMenuOpen && (
                    <>
                        <div
                            className="fixed inset-0 top-14 sm:top-16 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
                            onClick={() => setMobileMenuOpen(false)}
                        />

                        <div className="fixed top-14 sm:top-16 left-0 right-0 max-h-[calc(100vh-4rem)] overflow-y-auto bg-white/98 backdrop-blur-md border-b border-synerix-border px-4 py-4 space-y-3 shadow-2xl z-50 lg:hidden animate-in slide-in-from-top-2 duration-200">
                            {/* Profile Info Card Mobile */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                                        {initials}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">
                                            {currentUser?.full_name || "Teknisi FTTH"}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            @{currentUser?.username || "billingnesia"} • {currentUser?.role === "superadmin" ? "Superadmin" : "Teknisi"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    title="Keluar"
                                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 text-xs font-semibold flex items-center gap-1"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span>Keluar</span>
                                </button>
                            </div>

                            {/* Menu Links */}
                            <div className="space-y-1">
                                {[...primaryNavBefore, ...primaryNavAfter].map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                                                isActive
                                                    ? "bg-teal-50 text-teal-800 border border-teal-200/90 font-bold shadow-2xs"
                                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className={`w-4 h-4 ${isActive ? "text-teal-700" : "text-slate-400"}`} />
                                                <span>{item.name}</span>
                                            </div>
                                            {isActive && <span className="w-2 h-2 rounded-full bg-teal-600" />}
                                        </Link>
                                    );
                                })}

                                <div className="pt-2 border-t border-slate-100">
                                    <p className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        Shift &amp; Lembur
                                    </p>
                                    <Link
                                        href="/shifts"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                            pathname === "/shifts"
                                                ? "bg-teal-50 text-teal-800 border border-teal-200/90 font-bold"
                                                : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-4 h-4 text-teal-600" />
                                            <span>Shift &amp; Cuti</span>
                                        </div>
                                        {pathname === "/shifts" && <span className="w-2 h-2 rounded-full bg-teal-600" />}
                                    </Link>
                                    <Link
                                        href="/overtime"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                            pathname === "/overtime"
                                                ? "bg-teal-50 text-teal-800 border border-teal-200/90 font-bold"
                                                : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-4 h-4 text-teal-600" />
                                            <span>Lembur (Overtime)</span>
                                        </div>
                                        {pathname === "/overtime" && <span className="w-2 h-2 rounded-full bg-teal-600" />}
                                    </Link>
                                </div>

                                <div className="pt-2 border-t border-slate-100">
                                    <p className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        Layanan Tambahan
                                    </p>
                                    <Link
                                        href="/notes"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                        <span>Catatan Sheet NOC (BETA)</span>
                                    </Link>
                                    <Link
                                        href="/tickets/history"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        <History className="w-4 h-4 text-teal-600" />
                                        <span>Riwayat Tiket Shift (BETA)</span>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            setIsWaModalOpen(true);
                                        }}
                                        className="w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                    >
                                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                                        <span>Template Chat WA (BETA)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            setIsWifiModalOpen(true);
                                        }}
                                        className="w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                    >
                                        <Wifi className="w-4 h-4 text-teal-600" />
                                        <span>Panduan Wi-Fi Modem</span>
                                    </button>
                                </div>

                                {currentUser?.role === "superadmin" && (
                                    <div className="pt-2 border-t border-slate-100">
                                        <p className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                            Superadmin
                                        </p>
                                        <Link
                                            href="/settings"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            <Settings className="w-4 h-4 text-slate-500" />
                                            <span>Pengaturan &amp; Scraper</span>
                                        </Link>
                                        <Link
                                            href="/admin/users"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            <Users className="w-4 h-4 text-slate-500" />
                                            <span>Manajemen Pengguna</span>
                                        </Link>
                                        <Link
                                            href="/admin/audit-logs"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            <FileText className="w-4 h-4 text-slate-500" />
                                            <span>Stealth Audit Log</span>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                                Integrated ISP Network: Asterix, Fibermaxs &amp; Digimaxs
                            </div>
                        </div>
                    </>
                )}
            </header>

            {/* MOBILE BOTTOM NAVIGATION BAR */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] lg:hidden">
                <div className="grid grid-cols-5 h-15 max-w-md mx-auto px-1">
                    {mobileBottomNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                                    isActive ? "text-teal-700 font-bold" : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-[10px] tracking-tight">{item.name}</span>
                            </Link>
                        );
                    })}
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                            mobileMenuOpen ? "text-teal-700 font-bold" : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        <Menu className="w-5 h-5" />
                        <span className="text-[10px] tracking-tight">Lainnya</span>
                    </button>
                </div>
            </div>

            {/* Global Modals */}
            <WhatsAppTemplateModal isOpen={isWaModalOpen} onClose={() => setIsWaModalOpen(false)} />
            <WifiGuideModal isOpen={isWifiModalOpen} onClose={() => setIsWifiModalOpen(false)} />
        </>
    );
}

// ----------------------------------------------------------------------------
// BAGIAN 5: HELPER / UTILITY FUNCTIONS
// ----------------------------------------------------------------------------
// Tidak ada helper eksternal

// ----------------------------------------------------------------------------
// BAGIAN 6: EXPORT & PUBLIC API
// ----------------------------------------------------------------------------
// Default export di atas