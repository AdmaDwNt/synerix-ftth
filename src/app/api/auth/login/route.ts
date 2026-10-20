/**
 * ============================================================================
 * MODUL       : Autentikasi Pengguna
 * FILE        : src/app/api/auth/login/route.ts
 * DESKRIPSI   : API Route untuk login per-user. Memverifikasi kredensial langsung
 *               ke Billingnesia, mendaftarkan/memperbarui pengguna di Supabase,
 *               membuat sesi terisolasi, dan menyematkan HTTP-Only cookie.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BAGIAN 1: IMPORT & DEPENDENCIES
// ----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { loginToBillingnesia } from "@/lib/scraper/billingnesiaScraper";
import { encryptPassword, generateSessionToken } from "@/lib/auth/crypto";
import {
    SESSION_COOKIE_NAME,
    SESSION_MAX_AGE_SECONDS,
    recordStealthAuditLog,
    UserRole,
} from "@/lib/auth/session";

// ----------------------------------------------------------------------------
// BAGIAN 2: DEFINISI TIPE & INTERFACE (TYPESCRIPT CONTRACT)
// ----------------------------------------------------------------------------
interface LoginRequestBody {
    username?: string;
    password?: string;
}

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
        const body: LoginRequestBody = await req.json();
        const rawUsername = (body.username || "").trim();
        const rawPassword = (body.password || "").trim();

        if (!rawUsername || !rawPassword) {
            return NextResponse.json(
                { success: false, error: "Username dan password wajib diisi." },
                { status: 400 }
            );
        }

        const normalizedUsername = rawUsername.toLowerCase();
        const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
        const userAgent = req.headers.get("user-agent") || "unknown";

        // 1. Verifikasi kredensial langsung ke Billingnesia
        let sessionCookie: string;
        let responseBody = "";

        try {
            const loginResult = await loginToBillingnesia(rawUsername, rawPassword);
            sessionCookie = loginResult.sessionCookie;
            responseBody = loginResult.body;
        } catch (authErr) {
            return NextResponse.json(
                {
                    success: false,
                    error: authErr instanceof Error ? authErr.message : "Username atau password Billingnesia tidak valid.",
                },
                { status: 401 }
            );
        }

        const supabase = getSupabaseServerClient();

        // 2. Periksa apakah user sudah terdaftar di database Synerix
        const { data: existingUser, error: findErr } = await supabase
            .from("synerix_users")
            .select("*")
            .eq("username", normalizedUsername)
            .maybeSingle();

        if (findErr) {
            console.error("Gagal memeriksa user di Supabase:", findErr);
        }

        let userRecord = existingUser;

        // 3. Jika user sudah ada, cek status aktif & perbarui password terenkripsi
        if (userRecord) {
            if (!userRecord.is_active) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Akun Anda dinonaktifkan oleh Administrator. Silakan hubungi Superadmin.",
                    },
                    { status: 403 }
                );
            }

            // Perbarui password terenkripsi & waktu login terakhir
            const { data: updatedUser, error: updateErr } = await supabase
                .from("synerix_users")
                .update({
                    encrypted_billing_password: encryptPassword(rawPassword),
                    last_login_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", userRecord.id)
                .select()
                .single();

            if (!updateErr && updatedUser) {
                userRecord = updatedUser;
            }
        } else {
            // 4. Jika user belum ada di Synerix, daftarkan secara otomatis
            // Tentukan Role: Superadmin jika username sama dengan BILLINGNESIA_USERNAME di .env
            // atau jika belum ada user sama sekali di database
            let assignedRole: UserRole = "technician";

            const envAdmin = (process.env.BILLINGNESIA_USERNAME || "").trim().toLowerCase();
            if (envAdmin && normalizedUsername === envAdmin) {
                assignedRole = "superadmin";
            } else {
                const { count } = await supabase.from("synerix_users").select("*", { count: "exact", head: true });
                if (count === 0) {
                    assignedRole = "superadmin";
                }
            }

            // Ekstraksi nama lengkap atau default nama berhuruf kapital
            const detectedName = extractFullNameFromBillingHtml(responseBody, rawUsername);

            const { data: newUser, error: insertErr } = await supabase
                .from("synerix_users")
                .insert({
                    username: normalizedUsername,
                    encrypted_billing_password: encryptPassword(rawPassword),
                    full_name: detectedName,
                    role: assignedRole,
                    is_active: true,
                    allowed_routes: assignedRole === "superadmin"
                        ? ["/work-logs", "/dismantles", "/mapping", "/core-guide", "/shifts", "/admin/users", "/admin/audit-logs"]
                        : ["/work-logs", "/dismantles", "/mapping", "/core-guide", "/shifts"],
                    last_login_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (insertErr || !newUser) {
                console.error("Gagal mendaftarkan user baru:", insertErr);
                return NextResponse.json(
                    { success: false, error: "Gagal menyimpan akun ke database lokal." },
                    { status: 500 }
                );
            }

            userRecord = newUser;
        }

        // 5. Buat Sesi Baru di Tabel user_sessions
        const sessionToken = generateSessionToken(32);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 Jam

        const { error: sessionInsertErr } = await supabase.from("user_sessions").insert({
            user_id: userRecord.id,
            session_token: sessionToken,
            billingnesia_cookie: sessionCookie,
            cookie_expires_at: expiresAt,
            created_at: new Date().toISOString(),
            last_active_at: new Date().toISOString(),
        });

        if (sessionInsertErr) {
            console.error("Gagal menyimpan sesi login:", sessionInsertErr);
            return NextResponse.json(
                { success: false, error: "Gagal menginisialisasi sesi login." },
                { status: 500 }
            );
        }

        // 6. Catat Stealth Audit Log
        recordStealthAuditLog({
            userId: userRecord.id,
            username: userRecord.username,
            actionType: "LOGIN",
            details: {
                role: userRecord.role,
                login_method: "billingnesia_direct",
            },
            ipAddress,
            userAgent,
        }).catch(() => {});

        // 7. Siapkan Response dengan HTTP-Only Cookie
        const response = NextResponse.json({
            success: true,
            user: {
                id: userRecord.id,
                username: userRecord.username,
                full_name: userRecord.full_name,
                role: userRecord.role,
                allowed_routes: userRecord.allowed_routes || [],
            },
        });

        response.cookies.set({
            name: SESSION_COOKIE_NAME,
            value: sessionToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: SESSION_MAX_AGE_SECONDS,
        });

        return response;
    } catch (err) {
        console.error("Fatal error pada API Login:", err);
        return NextResponse.json(
            { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan internal pada server." },
            { status: 500 }
        );
    }
}

// ----------------------------------------------------------------------------
// BAGIAN 5: HELPER / UTILITY FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * Mencoba mengekstrak nama pengguna dari respon HTML dashboard Billingnesia
 */
function extractFullNameFromBillingHtml(html: string, fallbackUsername: string): string {
    if (!html) return formatFallbackName(fallbackUsername);

    // Cari pola nama pada profil header
    const profileMatch =
        html.match(/<span[^>]*class="[^"]*(?:user-name|profile-name|font-semibold)[^"]*"[^>]*>([^<]+)<\/span>/i) ||
        html.match(/<div[^>]*class="[^"]*user-info[^"]*"[^>]*>[\s\S]*?<h[4-6][^>]*>([^<]+)<\/h[4-6]>/i);

    if (profileMatch && profileMatch[1]) {
        const cleaned = profileMatch[1].trim();
        if (cleaned.length > 2 && cleaned.length < 50 && !/billingnesia|dashboard|admin/i.test(cleaned)) {
            return cleaned;
        }
    }

    return formatFallbackName(fallbackUsername);
}

function formatFallbackName(username: string): string {
    return username
        .split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}

// ----------------------------------------------------------------------------
// BAGIAN 6: EXPORT & PUBLIC API
// ----------------------------------------------------------------------------
// Handler POST diekspor untuk Next.js Route Handler
