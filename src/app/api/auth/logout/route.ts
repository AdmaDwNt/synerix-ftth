/**
 * ============================================================================
 * MODUL       : Autentikasi Pengguna
 * FILE        : src/app/api/auth/logout/route.ts
 * DESKRIPSI   : API Route untuk menghapus sesi pengguna di database Supabase
 *               dan membersihkan HTTP-Only cookie pada browser.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BAGIAN 1: IMPORT & DEPENDENCIES
// ----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SESSION_COOKIE_NAME, recordStealthAuditLog, getCurrentUser } from "@/lib/auth/session";

// ----------------------------------------------------------------------------
// BAGIAN 2: DEFINISI TIPE & INTERFACE (TYPESCRIPT CONTRACT)
// ----------------------------------------------------------------------------
// Tipe standar Next.js Route Handler

// ----------------------------------------------------------------------------
// BAGIAN 3: KONSTANTA & KONFIGURASI
// ----------------------------------------------------------------------------
function getSupabaseServerClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key, { auth: { persistSession: false } });
}

// ----------------------------------------------------------------------------
// BAGIAN 4: LOGIKA UTAMA (CORE BUSINESS LOGIC - POST)
// ----------------------------------------------------------------------------
export async function POST(req: NextRequest) {
    try {
        const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
        const auth = await getCurrentUser();

        if (sessionToken) {
            const supabase = getSupabaseServerClient();

            // 1. Catat Stealth Audit Log sebelum sesi dimatikan jika user terdeteksi
            if (auth?.user) {
                const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
                const userAgent = req.headers.get("user-agent") || "unknown";

                await recordStealthAuditLog({
                    userId: auth.user.id,
                    username: auth.user.username,
                    actionType: "LOGOUT",
                    details: { reason: "user_initiated" },
                    ipAddress,
                    userAgent,
                });
            }

            // 2. Hapus row sesi dari tabel user_sessions
            await supabase.from("user_sessions").delete().eq("session_token", sessionToken);
        }

        // 3. Bersihkan cookie dari browser
        const response = NextResponse.json({
            success: true,
            message: "Berhasil keluar dari sistem.",
        });

        response.cookies.set({
            name: SESSION_COOKIE_NAME,
            value: "",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 0,
        });

        return response;
    } catch (err) {
        console.error("Error pada route logout:", err);
        return NextResponse.json(
            { success: false, error: "Terjadi kesalahan saat logout." },
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
// Handler POST diekspor untuk Next.js Route Handler
