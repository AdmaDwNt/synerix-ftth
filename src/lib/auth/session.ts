/**
 * ============================================================================
 * MODUL       : Autentikasi & Manajemen Sesi Pengguna
 * FILE        : src/lib/auth/session.ts
 * DESKRIPSI   : Helper untuk membaca sesi aktif dari cookie HTTP-Only, validasi
 *               role (Superadmin vs Teknisi), audit trail senyap, dan hak akses rute.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BAGIAN 1: IMPORT & DEPENDENCIES
// ----------------------------------------------------------------------------
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// ----------------------------------------------------------------------------
// BAGIAN 2: DEFINISI TIPE & INTERFACE (TYPESCRIPT CONTRACT)
// ----------------------------------------------------------------------------
export type UserRole = "superadmin" | "technician" | "viewer";

export interface SynerixUser {
    id: string;
    username: string;
    full_name: string;
    role: UserRole;
    is_active: boolean;
    allowed_routes: string[];
    last_login_at?: string;
    created_at?: string;
    updated_at?: string;
}

export interface UserSessionRecord {
    id: string;
    user_id: string;
    session_token: string;
    billingnesia_cookie?: string;
    gudang_cookie?: string;
    cookie_expires_at?: string;
    created_at: string;
    last_active_at: string;
}

export interface AuthSessionResult {
    user: SynerixUser;
    sessionToken: string;
    billingnesiaCookie?: string;
    gudangCookie?: string;
}

// ----------------------------------------------------------------------------
// BAGIAN 3: KONSTANTA & KONFIGURASI
// ----------------------------------------------------------------------------
export const SESSION_COOKIE_NAME = "synerix_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 Hari

/**
 * Supabase client server-side khusus autentikasi
 */
function getSupabaseServerClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key, {
        auth: { persistSession: false },
    });
}

// ----------------------------------------------------------------------------
// BAGIAN 4: LOGIKA UTAMA (CORE BUSINESS LOGIC)
// ----------------------------------------------------------------------------

/**
 * Mengambil informasi user yang sedang login beserta cookie sesi scraper dari Supabase
 * Mendukung pembacaan dari next/headers cookies() atau manual token
 */
export async function getCurrentUser(explicitToken?: string): Promise<AuthSessionResult | null> {
    try {
        let token = explicitToken;

        if (!token) {
            const cookieStore = await cookies();
            token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
        }

        if (!token) {
            return null;
        }

        const supabase = getSupabaseServerClient();

        // 1. Cari data sesi aktif
        const { data: sessionData, error: sessionErr } = await supabase
            .from("user_sessions")
            .select("*, synerix_users(*)")
            .eq("session_token", token)
            .single();

        if (sessionErr || !sessionData) {
            return null;
        }

        const rawUser = sessionData.synerix_users;
        if (!rawUser || !rawUser.is_active) {
            return null;
        }

        const user: SynerixUser = {
            id: rawUser.id,
            username: rawUser.username,
            full_name: rawUser.full_name,
            role: rawUser.role as UserRole,
            is_active: rawUser.is_active,
            allowed_routes: rawUser.allowed_routes || [],
            last_login_at: rawUser.last_login_at,
            created_at: rawUser.created_at,
            updated_at: rawUser.updated_at,
        };

        // 2. Perbarui last_active_at secara asinkron
        Promise.resolve(
            supabase
                .from("user_sessions")
                .update({ last_active_at: new Date().toISOString() })
                .eq("id", sessionData.id)
        ).catch(() => {});

        return {
            user,
            sessionToken: token,
            billingnesiaCookie: sessionData.billingnesia_cookie || undefined,
            gudangCookie: sessionData.gudang_cookie || undefined,
        };
    } catch (err) {
        console.error("Error pada getCurrentUser:", err);
        return null;
    }
}

/**
 * Memastikan user telah login dan memiliki role yang diizinkan (Guarded Route Helper)
 */
export async function requireAuth(requiredRole?: UserRole): Promise<AuthSessionResult> {
    const auth = await getCurrentUser();

    if (!auth) {
        throw new Error("UNAUTHORIZED: Sesi login tidak ditemukan atau telah kedaluwarsa.");
    }

    if (requiredRole && requiredRole === "superadmin" && auth.user.role !== "superadmin") {
        throw new Error("FORBIDDEN: Anda tidak memiliki akses ke fitur ini (Hanya Superadmin).");
    }

    return auth;
}

// ----------------------------------------------------------------------------
// BAGIAN 5: HELPER / UTILITY FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * Memeriksa apakah user berhak membuka rute tertentu berdasarkan allowed_routes
 * (Superadmin selalu memiliki akses penuh ke seluruh rute)
 */
export function isRouteAllowed(user: SynerixUser, pathname: string): boolean {
    if (user.role === "superadmin") {
        return true;
    }

    // Rute publik / umum
    if (pathname === "/login" || pathname === "/" || pathname.startsWith("/api/auth")) {
        return true;
    }

    // Periksa apakah pathname diawali dengan salah satu allowed_routes
    return user.allowed_routes.some((allowed) => {
        const cleanAllowed = allowed.replace(/\/+$/, "");
        return pathname === cleanAllowed || pathname.startsWith(`${cleanAllowed}/`);
    });
}

/**
 * Stealth Audit Trail: Mencatat aktivitas rekan kerja secara senyap ke database
 * Tanpa memunculkan feedback atau indikator apapun di sisi UI teknisi
 */
export async function recordStealthAuditLog(params: {
    userId: string;
    username: string;
    actionType: string;
    targetId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}): Promise<void> {
    try {
        const supabase = getSupabaseServerClient();
        await supabase.from("user_activity_audit_logs").insert({
            user_id: params.userId,
            username: params.username,
            action_type: params.actionType,
            target_id: params.targetId || null,
            details: params.details || {},
            ip_address: params.ipAddress || null,
            user_agent: params.userAgent || null,
        });
    } catch (err) {
        console.error("Gagal mencatat stealth audit log:", err);
    }
}

// ----------------------------------------------------------------------------
// BAGIAN 6: EXPORT & PUBLIC API
// ----------------------------------------------------------------------------
// Seluruh helper diekspor sebagai named exports
