/**
 * ============================================================================
 * MODUL       : Autentikasi Pengguna
 * FILE        : src/app/api/auth/me/route.ts
 * DESKRIPSI   : API Route untuk memverifikasi sesi login aktif pengguna,
 *               mengembalikan data profil, role (Superadmin vs Teknisi),
 *               dan daftar rute yang diizinkan untuk UI navigation guard.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BAGIAN 1: IMPORT & DEPENDENCIES
// ----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

// ----------------------------------------------------------------------------
// BAGIAN 2: DEFINISI TIPE & INTERFACE (TYPESCRIPT CONTRACT)
// ----------------------------------------------------------------------------
// Tipe diambil langsung dari contract src/lib/auth/session.ts

// ----------------------------------------------------------------------------
// BAGIAN 3: KONSTANTA & KONFIGURASI
// ----------------------------------------------------------------------------
export const dynamic = "force-dynamic";

// ----------------------------------------------------------------------------
// BAGIAN 4: LOGIKA UTAMA (CORE BUSINESS LOGIC - GET)
// ----------------------------------------------------------------------------
export async function GET() {
    try {
        const auth = await getCurrentUser();

        if (!auth) {
            return NextResponse.json(
                {
                    success: false,
                    authenticated: false,
                    user: null,
                },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            authenticated: true,
            user: auth.user,
        });
    } catch (err) {
        console.error("Error pada /api/auth/me:", err);
        return NextResponse.json(
            { success: false, authenticated: false, error: "Gagal memeriksa status login." },
            { status: 500 }
        );
    }
}

// ----------------------------------------------------------------------------
// BAGIAN 5: HELPER / UTILITY FUNCTIONS
// ----------------------------------------------------------------------------
// Tidak ada helper tambahan pada route ini

// ----------------------------------------------------------------------------
// BAGIAN 6: EXPORT & PUBLIC API
// ----------------------------------------------------------------------------
// GET Handler diekspor untuk Next.js App Router
