/**
 * ============================================================================
 * MODUL       : Autentikasi & Keamanan (Kriptografi)
 * FILE        : src/lib/auth/crypto.ts
 * DESKRIPSI   : Helper kriptografi untuk enkripsi simetris kredensial Billingnesia
 *               (AES-256-GCM), pembuatan session token acak, dan hashing.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BAGIAN 1: IMPORT & DEPENDENCIES
// ----------------------------------------------------------------------------
import crypto from "node:crypto";

// ----------------------------------------------------------------------------
// BAGIAN 2: DEFINISI TIPE & INTERFACE (TYPESCRIPT CONTRACT)
// ----------------------------------------------------------------------------
export interface EncryptedPayload {
    iv: string;
    tag: string;
    data: string;
}

// ----------------------------------------------------------------------------
// BAGIAN 3: KONSTANTA & KONFIGURASI
// ----------------------------------------------------------------------------
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV standar untuk GCM
const DEFAULT_FALLBACK_SALT = "synerix-ftth-auth-secure-encryption-salt-2026";

/**
 * Mendapatkan derived 32-byte key untuk AES-256 dari environment variable
 */
function getEncryptionKey(): Buffer {
    const rawKey = process.env.AUTH_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_FALLBACK_SALT;
    // Turunkan key 32-byte menggunakan SHA-256 hash agar panjangnya selalu tepat 256 bit
    return crypto.createHash("sha256").update(rawKey).digest();
}

// ----------------------------------------------------------------------------
// BAGIAN 4: LOGIKA UTAMA (CORE BUSINESS LOGIC)
// ----------------------------------------------------------------------------

/**
 * Mengenkripsi teks string (misal: password Billingnesia) menggunakan AES-256-GCM
 * Output berupa string terformat: iv_hex:auth_tag_hex:ciphertext_hex
 */
export function encryptPassword(plainText: string): string {
    if (!plainText) return "";

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Format kemasan: iv:tag:data
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Mendekripsi string hasil enkripsi AES-256-GCM kembali menjadi plain text
 */
export function decryptPassword(cipherPayload: string): string {
    if (!cipherPayload) return "";

    try {
        const parts = cipherPayload.split(":");
        if (parts.length !== 3) {
            // Jika format tidak sesuai (atau teks warisan lama), kembalikan kosong atau fallback
            return "";
        }

        const [ivHex, tagHex, encryptedHex] = parts;
        const key = getEncryptionKey();
        const iv = Buffer.from(ivHex, "hex");
        const tag = Buffer.from(tagHex, "hex");

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encryptedHex, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (err) {
        console.error("Gagal mendekripsi password:", err);
        return "";
    }
}

// ----------------------------------------------------------------------------
// BAGIAN 5: HELPER / UTILITY FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * Menghasilkan token acak yang aman secara kriptografis (default 32 bytes = 64 hex chars)
 */
export function generateSessionToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Menghasilkan hash SHA-256 satu arah (berguna untuk pencarian cepat/token lookup)
 */
export function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}

// ----------------------------------------------------------------------------
// BAGIAN 6: EXPORT & PUBLIC API
// ----------------------------------------------------------------------------
// Seluruh fungsi diekspor secara named exports di atas untuk kemudahan tree-shaking
