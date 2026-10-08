/**
 * Utility untuk pembersihan dan resolusi nomor telepon / WhatsApp
 * Aman digunakan baik di Client Components maupun Server Components.
 */

/**
 * Pembersih dan validator nomor HP / WA
 */
export function cleanPhoneNumber(val?: string | null): string {
    if (!val) return "";
    const trimmed = String(val).trim();
    if (trimmed === "-" || trimmed === "1 -" || trimmed.toLowerCase() === "null") return "";
    const digitsOnly = trimmed.replace(/\D/g, "");
    if (digitsOnly.length < 8) return "";
    return trimmed;
}

/**
 * Aturan pemilihan nomor WA untuk kolom NO WA:
 * Jika No WA 1 ada nomornya tampilkan di kolom,
 * kalau WA 1 ini tidak ada nomornya tampilkan nomor WA 2,
 * dan jika ada keduanya tampilkan WA 1.
 */
export function resolveDisplayPhone(phone1?: string | null, phone2?: string | null): string {
    const p1 = cleanPhoneNumber(phone1);
    const p2 = cleanPhoneNumber(phone2);
    if (p1) return p1;
    if (p2) return p2;
    return "";
}
