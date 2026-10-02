"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
    MoreHorizontal
} from "lucide-react";

const navigation = [
    { name: "Overview", href: "/", icon: Activity },
    { name: "Pekerjaan", href: "/work-logs", icon: Wrench },
    { name: "Mapping GIS", href: "/mapping", icon: MapPin },
    { name: "Dismantle", href: "/dismantles", icon: Truck },
    { name: "Shift & Cuti", href: "/shifts", icon: Calendar },
    { name: "Lembur", href: "/overtime", icon: Clock },
    { name: "Guide Core", href: "/core-guide", icon: Layers },
];

// 4 Menu Utama untuk Mobile Bottom Navigation Bar
const mobileBottomNav = [
    { name: "Overview", href: "/", icon: Activity },
    { name: "Pekerjaan", href: "/work-logs", icon: Wrench },
    { name: "Mapping", href: "/mapping", icon: MapPin },
    { name: "Dismantle", href: "/dismantles", icon: Truck },
];

export default function Topbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    // Tutup mobile menu saat berpindah halaman
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

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

    return (
        <>
            {/* TOPBAR HEADER (DESKTOP & MOBILE) */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-synerix-border shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
                {/* Top Accent Gradient Line */}
                <div className="h-[2px] w-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-500" />

                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 sm:h-16 gap-2 xl:gap-3">

                        {/* Section Kiri: Logo Partner Sejajar (Responsif Skala Mobile s/d Desktop) */}
                        <div className="flex items-center shrink-0">
                            <Link
                                href="/"
                                className="flex items-center gap-1.5 sm:gap-2.5 py-1 group"
                                title="Beranda FTTH Operations"
                            >
                                {/* Logo Asterix */}
                                <Image
                                    src="/images/logo-asterix.png"
                                    alt="Asterix Inovasi Teknologi"
                                    width={75}
                                    height={20}
                                    className="h-3.5 sm:h-4.5 md:h-5 w-auto object-contain transition-transform duration-150 group-hover:scale-[1.02]"
                                    priority
                                />

                                <div className="h-3 sm:h-4 w-px bg-slate-200" />

                                {/* Logo Fibermaxs */}
                                <Image
                                    src="/images/logo-fibermaxs.png"
                                    alt="Fibermaxs"
                                    width={65}
                                    height={18}
                                    className="h-3 sm:h-4 md:h-4.5 w-auto object-contain transition-transform duration-150 group-hover:scale-[1.02]"
                                    priority
                                />

                                <div className="h-3 sm:h-4 w-px bg-slate-200" />

                                {/* Logo Digimaxs */}
                                <Image
                                    src="/images/logo-digimaxs.png"
                                    alt="Digimaxs"
                                    width={65}
                                    height={18}
                                    className="h-3 sm:h-4 md:h-4.5 w-auto object-contain transition-transform duration-150 group-hover:scale-[1.02]"
                                    priority
                                />
                            </Link>
                        </div>

                        {/* Section Tengah: Navigasi Desktop (Hanya muncul di Layar Desktop lg ke atas) */}
                        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 overflow-x-auto no-scrollbar py-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center gap-1.5 px-2 xl:px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 ${
                                            isActive
                                                ? "bg-teal-50 text-teal-800 border border-teal-200/90 shadow-2xs font-bold"
                                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                                        }`}
                                    >
                                        <Icon className={`w-3.5 h-3.5 ${isActive ? "text-teal-700" : "text-slate-400"}`} />
                                        <span>{item.name}</span>
                                        {isActive && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Section Kanan: Status Teknisi & User Profile */}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {/* Status Role Badge dengan Live Pulse Indicator (Tablet & Desktop) */}
                            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800 shadow-2xs">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span>Teknisi FTTH</span>
                            </div>

                            {/* User Profile Button */}
                            <button
                                title="Akun Teknisi"
                                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
                            >
                                <User className="w-4 h-4" />
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
                        {/* Backdrop Blur Overlay */}
                        <div
                            className="fixed inset-0 top-14 sm:top-16 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
                            onClick={() => setMobileMenuOpen(false)}
                        />

                        {/* Drawer Dropdown */}
                        <div className="fixed top-14 sm:top-16 left-0 right-0 max-h-[calc(100vh-4rem)] overflow-y-auto bg-white/98 backdrop-blur-md border-b border-synerix-border px-4 py-4 space-y-3 shadow-2xl z-50 lg:hidden animate-in slide-in-from-top-2 duration-200">
                            {/* Profile Info Card for Mobile Techs */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                                        FT
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">Teknisi FTTH Lapangan</p>
                                        <p className="text-[10px] text-slate-400">Shift Pagi • Area Kediri</p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                                </span>
                            </div>

                            {/* Menu Links with Finger-Friendly Touch Targets (min 44px) */}
                            <div className="space-y-1">
                                {navigation.map((item) => {
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
                                            {isActive && (
                                                <span className="w-2 h-2 rounded-full bg-teal-600" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Partner Info Footer on Drawer */}
                            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                                Integrated ISP Network: Asterix, Fibermaxs & Digimaxs
                            </div>
                        </div>
                    </>
                )}
            </header>

            {/* MOBILE BOTTOM NAVIGATION BAR (Navigasi jempol mudah untuk teknisi di lapangan) */}
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
                                    isActive
                                        ? "text-teal-700 font-bold"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? "text-teal-600 scale-105" : "text-slate-400"}`} />
                                <span className="text-[10px] tracking-tight">{item.name}</span>
                            </Link>
                        );
                    })}

                    {/* Tombol 'Menu' / Lebih Banyak di Bottom Bar */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                            mobileMenuOpen
                                ? "text-teal-700 font-bold"
                                : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        {mobileMenuOpen ? (
                            <X className="w-5 h-5 text-teal-600 scale-105" />
                        ) : (
                            <MoreHorizontal className="w-5 h-5 text-slate-400" />
                        )}
                        <span className="text-[10px] tracking-tight">Menu</span>
                    </button>
                </div>
            </div>
        </>
    );
}