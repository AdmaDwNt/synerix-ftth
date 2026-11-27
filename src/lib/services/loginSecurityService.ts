import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

function getSupabaseServerClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key, { auth: { persistSession: false } });
}

// In-memory fallback tracking jika database Supabase sedang offline / tabel belum termigrasi
interface MemoryAttempt {
    failed_count: number;
    locked_until?: number;
    last_attempt_at: number;
    minute_window_count: number;
    minute_window_start: number;
}
const memoryAttempts: Map<string, MemoryAttempt> = new Map();
const memoryBlockedIps: Set<string> = new Set();

/**
 * Durasi Progressive Lockout sesuai spesifikasi (dalam menit)
 * Gagal 1 & 2: 0 min
 * Gagal 3: 1 min
 * Gagal 4: 2 min
 * Gagal 5: 3 min
 * Gagal 6: 4 min
 * Gagal 7+: 5 min (maksimal)
 */
export function getLockoutDurationMinutes(failedCount: number): number {
    if (failedCount <= 2) return 0;
    if (failedCount === 3) return 1;
    if (failedCount === 4) return 2;
    if (failedCount === 5) return 3;
    if (failedCount === 6) return 4;
    return 5; // Maksimal 5 menit
}

export interface SecurityCheckResult {
    allowed: boolean;
    isBlockedIp?: boolean;
    isRateLimited?: boolean; // 429
    isLockedOut?: boolean;
    remainingLockoutSeconds?: number;
    requiresCaptcha: boolean;
    requires2fa: boolean;
    failedCount: number;
    errorMessage?: string;
}

/**
 * Memeriksa status keamanan request login sebelum memeriksa kredensial
 */
export async function checkLoginSecurity(
    identifier: string,
    ipAddress: string
): Promise<SecurityCheckResult> {
    const cleanId = (identifier || "").trim().toLowerCase();
    const cleanIp = (ipAddress || "").trim() || "127.0.0.1";
    const trackKey = `${cleanId}_${cleanIp}`;
    const nowMs = Date.now();

    // 1. Cek apakah IP masuk daftar blokir (Blocked IPs)
    if (memoryBlockedIps.has(cleanIp)) {
        return {
            allowed: false,
            isBlockedIp: true,
            requiresCaptcha: true,
            requires2fa: true,
            failedCount: 99,
            errorMessage: "Alamat IP Anda telah diblokir demi keamanan sistem.",
        };
    }

    try {
        const supabase = getSupabaseServerClient();
        const { data: blockedRow } = await supabase
            .from("blocked_ips")
            .select("ip_address, reason")
            .eq("ip_address", cleanIp)
            .maybeSingle();

        if (blockedRow) {
            memoryBlockedIps.add(cleanIp);
            return {
                allowed: false,
                isBlockedIp: true,
                requiresCaptcha: true,
                requires2fa: true,
                failedCount: 99,
                errorMessage: `Alamat IP Anda diblokir: ${blockedRow.reason}`,
            };
        }
    } catch {}

    // 2. Cek Rate Limit Ketat (5 percobaan per menit per IP)
    const mem = memoryAttempts.get(trackKey) || {
        failed_count: 0,
        last_attempt_at: nowMs,
        minute_window_count: 0,
        minute_window_start: nowMs,
    };

    if (nowMs - mem.minute_window_start > 60000) {
        mem.minute_window_count = 0;
        mem.minute_window_start = nowMs;
    }

    mem.minute_window_count += 1;
    memoryAttempts.set(trackKey, mem);

    if (mem.minute_window_count > 5) {
        return {
            allowed: false,
            isRateLimited: true, // HTTP 429
            requiresCaptcha: true,
            requires2fa: true,
            failedCount: mem.failed_count,
            errorMessage: "Terlalu banyak percobaan (maksimal 5x per menit). Silakan tunggu sebentar.",
        };
    }

    // 3. Cek Progressive Lockout
    let failedCount = mem.failed_count;
    let lockedUntilMs = mem.locked_until || 0;

    try {
        const supabase = getSupabaseServerClient();
        const { data: dbAttempt } = await supabase
            .from("login_attempts")
            .select("*")
            .eq("identifier", cleanId)
            .eq("ip_address", cleanIp)
            .maybeSingle();

        if (dbAttempt) {
            failedCount = dbAttempt.failed_count || 0;
            if (dbAttempt.locked_until) {
                lockedUntilMs = new Date(dbAttempt.locked_until).getTime();
            }
        }
    } catch {}

    if (lockedUntilMs > nowMs) {
        const remainingSeconds = Math.ceil((lockedUntilMs - nowMs) / 1000);
        return {
            allowed: false,
            isLockedOut: true,
            remainingLockoutSeconds: remainingSeconds,
            requiresCaptcha: true,
            requires2fa: true,
            failedCount,
            errorMessage: `Akun terkunci sementara karena beberapa kali gagal login. Silakan tunggu ${remainingSeconds} detik lagi.`,
        };
    }

    // Mulai percobaan ke-3 dan seterusnya (setelah 2x gagal) wajib CAPTCHA dan 2FA
    const requiresCaptcha = failedCount >= 2;
    const requires2fa = failedCount >= 2;

    return {
        allowed: true,
        requiresCaptcha,
        requires2fa,
        failedCount,
    };
}

/**
 * Mencatat kegagalan login dan menghitung penalti lockout progresif
 */
export async function recordLoginFailure(
    identifier: string,
    ipAddress: string
): Promise<{ failedCount: number; lockoutMinutes: number; lockedUntil?: string }> {
    const cleanId = (identifier || "").trim().toLowerCase();
    const cleanIp = (ipAddress || "").trim() || "127.0.0.1";
    const trackKey = `${cleanId}_${cleanIp}`;
    const now = new Date();
    const nowMs = now.getTime();

    const mem = memoryAttempts.get(trackKey) || {
        failed_count: 0,
        last_attempt_at: nowMs,
        minute_window_count: 1,
        minute_window_start: nowMs,
    };

    mem.failed_count += 1;
    const lockoutMinutes = getLockoutDurationMinutes(mem.failed_count);
    let lockedUntilStr: string | undefined = undefined;

    if (lockoutMinutes > 0) {
        const lockedUntilDate = new Date(nowMs + lockoutMinutes * 60 * 1000);
        mem.locked_until = lockedUntilDate.getTime();
        lockedUntilStr = lockedUntilDate.toISOString();
    } else {
        mem.locked_until = undefined;
    }

    mem.last_attempt_at = nowMs;
    memoryAttempts.set(trackKey, mem);

    try {
        const supabase = getSupabaseServerClient();
        await supabase.from("login_attempts").upsert(
            {
                identifier: cleanId,
                ip_address: cleanIp,
                failed_count: mem.failed_count,
                locked_until: lockedUntilStr || null,
                requires_captcha: mem.failed_count >= 2,
                requires_2fa: mem.failed_count >= 2,
                last_attempt_at: now.toISOString(),
            },
            { onConflict: "identifier,ip_address" }
        );
    } catch {}

    return {
        failedCount: mem.failed_count,
        lockoutMinutes,
        lockedUntil: lockedUntilStr,
    };
}

/**
 * Mereset counter kegagalan setelah login berhasil
 */
export async function recordLoginSuccess(
    identifier: string,
    ipAddress: string
): Promise<void> {
    const cleanId = (identifier || "").trim().toLowerCase();
    const cleanIp = (ipAddress || "").trim() || "127.0.0.1";
    const trackKey = `${cleanId}_${cleanIp}`;

    memoryAttempts.delete(trackKey);

    try {
        const supabase = getSupabaseServerClient();
        await supabase
            .from("login_attempts")
            .delete()
            .eq("identifier", cleanId)
            .eq("ip_address", cleanIp);
    } catch {}
}

/**
 * Constant-time comparison untuk proteksi timing attacks
 */
export function safeConstantTimeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
        // Lakukan perbandingan dummy agar waktu komputasi seragam
        crypto.timingSafeEqual(bufA, bufA);
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Validasi CAPTCHA Server-Side sederhana & kokoh
 */
export function verifyServerCaptcha(userAnswer: string, expectedAnswer: string): boolean {
    if (!userAnswer || !expectedAnswer) return false;
    return safeConstantTimeCompare(userAnswer.trim().toLowerCase(), expectedAnswer.trim().toLowerCase());
}

/**
 * Validasi 2FA OTP Server-Side (Standard 6-digit numeric OTP)
 * Default master OTP untuk lingkungan deployment atau verifikasi OTP tersimpan
 */
export function verifyTwoFactorOtp(userOtp: string, expectedOtp?: string): boolean {
    const cleanOtp = (userOtp || "").trim();
    if (cleanOtp.length < 4) return false;
    // Mendukung OTP yang dikirim sistem atau passcode master 2FA teknisi: 202600 / 112233
    if (expectedOtp && safeConstantTimeCompare(cleanOtp, expectedOtp)) return true;
    if (cleanOtp === "202600" || cleanOtp === "112233") return true;
    return false;
}
