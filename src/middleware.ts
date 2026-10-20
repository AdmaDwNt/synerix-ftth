/**
 * ============================================================================
 * MODUL       : Next.js Security Middleware & Route Guard
 * FILE        : src/middleware.ts
 * DESKRIPSI   : Menjaga akses seluruh aplikasi Synerix-FTTH. Mengalihkan pengguna
 *               yang belum login ke /login, melindungi rute internal, dan
 *               mengizinkan akses publik untuk aset statis serta endpoint auth.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BAGIAN 1: IMPORT & DEPENDENCIES
// ----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ----------------------------------------------------------------------------
// BAGIAN 2: DEFINISI TIPE & INTERFACE (TYPESCRIPT CONTRACT)
// ----------------------------------------------------------------------------
// Tipe bawaan NextRequest dan NextResponse

// ----------------------------------------------------------------------------
// BAGIAN 3: KONSTANTA & KONFIGURASI
// ----------------------------------------------------------------------------
const SESSION_COOKIE_NAME = "synerix_session";

// Daftar rute publik yang dapat diakses tanpa login
const PUBLIC_PATHS = [
    "/login",
    "/api/auth/login",
    "/api/auth/logout",
    "/favicon.ico",
    "/icon.png",
    "/apple-icon.png",
];

// ----------------------------------------------------------------------------
// BAGIAN 4: LOGIKA UTAMA (CORE BUSINESS LOGIC - MIDDLEWARE)
// ----------------------------------------------------------------------------
export function middleware(req: NextRequest) {
    const { pathname, search } = req.nextUrl;

    // 1. Lewati pengecekan untuk aset internal Next.js, file statis gambar, kml, dll.
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/images") ||
        pathname.startsWith("/static") ||
        pathname.includes(".") // file statis berekstensi (misal .png, .jpg, .svg, .ico, .kml)
    ) {
        return NextResponse.next();
    }

    // 2. Periksa apakah rute saat ini termasuk dalam whitelist publik
    const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

    // 3. Baca cookie sesi Synerix
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const isAuthenticated = Boolean(sessionToken && sessionToken.trim().length > 0);

    // 4. Kasus A: Pengguna SUDAH login tetapi membuka halaman /login
    if (isAuthenticated && pathname === "/login") {
        const destination = req.nextUrl.searchParams.get("from") || "/";
        const redirectUrl = new URL(destination, req.url);
        return NextResponse.redirect(redirectUrl);
    }

    // 5. Kasus B: Pengguna BELUM login mencoba membuka rute internal terproteksi
    if (!isAuthenticated && !isPublicPath) {
        // Jika request ditujukan ke API route, kembalikan respon JSON 401 Unauthorized
        if (pathname.startsWith("/api/")) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Sesi login tidak ditemukan. Silakan login terlebih dahulu.",
                },
                { status: 401 }
            );
        }

        // Jika request ditujukan ke halaman UI, alihkan ke /login dengan parameter 'from'
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("from", `${pathname}${search}`);
        return NextResponse.redirect(loginUrl);
    }

    // 6. Teruskan request secara normal
    return NextResponse.next();
}

// ----------------------------------------------------------------------------
// BAGIAN 5: HELPER / UTILITY FUNCTIONS
// ----------------------------------------------------------------------------
// Tidak ada helper tambahan pada middleware ini

// ----------------------------------------------------------------------------
// BAGIAN 6: EXPORT & PUBLIC API (MATCHER CONFIG)
// ----------------------------------------------------------------------------
export const config = {
    matcher: [
        /*
         * Cocokkan semua path request kecuali:
         * - api/auth/login, api/auth/logout (ditangani di dalam middleware)
         * - _next/static (file statis kompilasi)
         * - _next/image (optimasi gambar Next.js)
         * - favicon.ico, sitemap.xml, robots.txt
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
