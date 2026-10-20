/**
 * ============================================================================
 * MODUL       : Layout Aplikasi (Footer)
 * FILE        : src/components/layout/Footer.tsx
 * DESKRIPSI   : Komponen footer Synerix FTTH yang disembunyikan otomatis
 *               ketika pengguna berada di halaman /login.
 * ============================================================================
 */

"use client";

// ----------------------------------------------------------------------------
// BAGIAN 1: IMPORT & DEPENDENCIES
// ----------------------------------------------------------------------------
import Image from "next/image";
import { usePathname } from "next/navigation";

// ----------------------------------------------------------------------------
// BAGIAN 2: DEFINISI TIPE & INTERFACE (TYPESCRIPT CONTRACT)
// ----------------------------------------------------------------------------
// Komponen standar tanpa props eksternal

// ----------------------------------------------------------------------------
// BAGIAN 3: KONSTANTA & KONFIGURASI
// ----------------------------------------------------------------------------
// Tidak ada konstanta khusus

// ----------------------------------------------------------------------------
// BAGIAN 4: LOGIKA UTAMA (CORE BUSINESS LOGIC)
// ----------------------------------------------------------------------------
export default function Footer() {
    const pathname = usePathname();

    // Sembunyikan footer di halaman login
    if (pathname === "/login") {
        return null;
    }

    return (
        <footer className="border-t border-synerix-border bg-white/80 backdrop-blur-xs py-4 mb-16 lg:mb-0 text-xs text-synerix-subtext">
            <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div>
                    <p className="font-semibold text-slate-700">FTTH Operations & Field Engineering Platform</p>
                    <p className="text-[11px] text-slate-400">Integrated Network Management System</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Developed & Powered by</span>
                    <div className="flex items-center px-2.5 py-1 rounded-lg bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-2xs">
                        <Image
                            src="/images/logo-synerix.png"
                            alt="Synerix Technology Solution"
                            width={95}
                            height={22}
                            className="h-4.5 w-auto object-contain brightness-105"
                        />
                    </div>
                </div>
            </div>
        </footer>
    );
}

// ----------------------------------------------------------------------------
// BAGIAN 5: HELPER / UTILITY FUNCTIONS
// ----------------------------------------------------------------------------
// Tidak ada helper tambahan pada komponen ini

// ----------------------------------------------------------------------------
// BAGIAN 6: EXPORT & PUBLIC API
// ----------------------------------------------------------------------------
// Default export di atas
