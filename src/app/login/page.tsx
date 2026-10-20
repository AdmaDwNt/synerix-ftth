/**
 * ============================================================================
 * MODUL       : Autentikasi Pengguna (UI)
 * FILE        : src/app/login/page.tsx
 * DESKRIPSI   : Halaman login modern Synerix-FTTH selaras dengan Asterix Clean Light Theme.
 *               Mengotentikasi username & password personil langsung ke Billingnesia,
 *               menginisialisasi sesi terisolasi, dan mengarahkan pengguna ke dashboard.
 * ============================================================================
 */

"use client";

// ----------------------------------------------------------------------------
// BAGIAN 1: IMPORT & DEPENDENCIES
// ----------------------------------------------------------------------------
import { useState, useTransition, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Lock,
    User,
    Eye,
    EyeOff,
    ShieldCheck,
    AlertCircle,
    Loader2,
    ArrowRight,
    CheckCircle2,
    Server,
} from "lucide-react";

// ----------------------------------------------------------------------------
// BAGIAN 2: DEFINISI TIPE & INTERFACE (TYPESCRIPT CONTRACT)
// ----------------------------------------------------------------------------
interface LoginResponse {
    success: boolean;
    error?: string;
    user?: {
        id: string;
        username: string;
        full_name: string;
        role: "superadmin" | "technician" | "viewer";
        allowed_routes: string[];
    };
}

// ----------------------------------------------------------------------------
// BAGIAN 3: KONSTANTA & KONFIGURASI
// ----------------------------------------------------------------------------
const AUTH_STEPS = [
    "Menghubungkan ke server Billingnesia...",
    "Memverifikasi kredensial akun...",
    "Mempersiapkan sesi kerja terisolasi...",
    "Berhasil! Mengalihkan ke sistem...",
];

// ----------------------------------------------------------------------------
// BAGIAN 4: LOGIKA UTAMA (CORE COMPONENT & STATE)
// ----------------------------------------------------------------------------
function LoginFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const destination = searchParams.get("from") || "/work-logs";

    // Form State
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Status & Feedback State
    const [isLoading, setIsLoading] = useState(false);
    const [authStepIndex, setAuthStepIndex] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [, startTransition] = useTransition();

    /**
     * Handler submit form login
     */
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        const cleanUsername = username.trim();
        const cleanPassword = password.trim();

        if (!cleanUsername || !cleanPassword) {
            setErrorMessage("Silakan masukkan username dan password Billingnesia Anda.");
            return;
        }

        setIsLoading(true);
        setAuthStepIndex(0);

        // Simulasi progres feedback step untuk responsivitas visual
        const timer1 = setTimeout(() => setAuthStepIndex(1), 600);
        const timer2 = setTimeout(() => setAuthStepIndex(2), 1400);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: cleanUsername,
                    password: cleanPassword,
                }),
            });

            clearTimeout(timer1);
            clearTimeout(timer2);

            const json: LoginResponse = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.error || "Gagal masuk. Periksa kembali username dan password Anda.");
            }

            // Login Sukses
            setAuthStepIndex(3);
            setIsSuccess(true);

            // Beri jeda animasi sukses sejenak lalu arahkan ke halaman tujuan
            setTimeout(() => {
                startTransition(() => {
                    router.push(destination);
                    router.refresh();
                });
            }, 800);
        } catch (err) {
            clearTimeout(timer1);
            clearTimeout(timer2);
            setIsLoading(false);
            setAuthStepIndex(0);
            setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan saat menghubungi server.");
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F8FAFC] text-slate-900 relative overflow-hidden select-none">
            {/* Ambient Soft Glow Background Elements */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* HEADER LOGO PARTNER & BRANDING */}
                <div className="flex flex-col items-center text-center mb-6">
                    {/* Synerix Product Logo */}
                    <div className="mb-4 px-6 py-3 rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 shadow-lg shadow-slate-900/20 border border-slate-700/50">
                        <Image
                            src="/images/logo-synerix.png"
                            alt="Synerix FTTH"
                            width={180}
                            height={45}
                            className="h-9 sm:h-11 w-auto object-contain"
                            priority
                        />
                    </div>

                    {/* Badge Slogan */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-[11px] font-bold text-teal-800 mb-4 shadow-2xs">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>FTTH Operations &amp; Network Management</span>
                    </div>

                    {/* Partner Logo Strip (Asterix + Fibermaxs + Digimaxs) */}
                    <div className="flex items-center justify-center gap-3 sm:gap-4 py-2.5 px-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs mb-5">
                        <Image
                            src="/images/logo-asterix.png"
                            alt="Asterix Inovasi Teknologi"
                            width={85}
                            height={22}
                            className="h-4.5 sm:h-5 w-auto object-contain"
                            priority
                        />
                        <div className="h-3.5 w-[1px] bg-slate-200" />
                        <Image
                            src="/images/logo-fibermaxs.png"
                            alt="Fibermaxs Partner"
                            width={80}
                            height={20}
                            className="h-4 sm:h-4.5 w-auto object-contain opacity-95"
                            priority
                        />
                        <div className="h-3.5 w-[1px] bg-slate-200" />
                        <Image
                            src="/images/logo-digimaxs.png"
                            alt="Digimaxs Partner"
                            width={80}
                            height={20}
                            className="h-4 sm:h-4.5 w-auto object-contain opacity-95"
                            priority
                        />
                    </div>

                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                        Masuk ke Synerix FTTH
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs leading-relaxed">
                        Gunakan akun <span className="text-teal-700 font-bold">Billingnesia</span> Anda untuk memulai sesi kerja terisolasi.
                    </p>
                </div>

                {/* LOGIN CARD */}
                <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden relative">
                    {/* Top Decorative Gradient Accent Bar */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-500" />

                    <div className="p-6 sm:p-8">
                        {/* ALERT ERROR */}
                        {errorMessage && (
                            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                <div className="flex-1 leading-relaxed">
                                    <p className="font-bold text-rose-900">Autentikasi Gagal</p>
                                    <p className="text-rose-700 mt-0.5">{errorMessage}</p>
                                </div>
                            </div>
                        )}

                        {/* ALERT SUKSES */}
                        {isSuccess && (
                            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <div className="flex-1 font-bold text-emerald-900">
                                    Verifikasi berhasil! Mengalihkan ke dashboard...
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleLoginSubmit} className="space-y-4 sm:space-y-4.5">
                            {/* INPUT USERNAME */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">
                                    Username Billingnesia
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        disabled={isLoading || isSuccess}
                                        placeholder="Contoh: duwianto"
                                        autoComplete="username"
                                        autoFocus
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50/70 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-medium focus:bg-white focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* INPUT PASSWORD */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Password Billingnesia
                                    </label>
                                    <span className="text-[11px] text-slate-400">
                                        Sesuai akun lapangan
                                    </span>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading || isSuccess}
                                        placeholder="••••••••••••"
                                        autoComplete="current-password"
                                        required
                                        className="w-full pl-10 pr-11 py-2.5 sm:py-3 rounded-xl bg-slate-50/70 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-medium focus:bg-white focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all disabled:opacity-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isLoading || isSuccess}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-hidden cursor-pointer"
                                        title={showPassword ? "Sembunyikan password" : "Lihat password"}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* STATUS STEP FEEDBACK SAAT LOADING */}
                            {isLoading && (
                                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center gap-2.5 animate-pulse">
                                    <Loader2 className="w-4 h-4 text-teal-600 animate-spin shrink-0" />
                                    <span className="font-bold">{AUTH_STEPS[authStepIndex]}</span>
                                </div>
                            )}

                            {/* TOMBOL SUBMIT */}
                            <button
                                type="submit"
                                disabled={isLoading || isSuccess}
                                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer mt-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Memverifikasi Akun...</span>
                                    </>
                                ) : isSuccess ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                        <span>Berhasil Masuk!</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Masuk ke Synerix FTTH</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* KEAMANAN & PRIVASI INFO FOOTER */}
                        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <div className="flex items-center gap-1.5" title="Kredensial disimpan dengan enkripsi AES-256">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="font-semibold">AES-256 Encrypted</span>
                            </div>
                            <div className="flex items-center gap-1.5" title="Sesi mandiri per teknisi">
                                <Server className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                <span className="font-semibold">Multi-Tenant Session</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM LEGAL & COMPLIANCE TEXT */}
                <p className="text-center text-[11px] text-slate-400 mt-6 leading-relaxed">
                    <span className="font-bold text-slate-500">Synerix FTTH</span> — Integrated ISP Operations Platform
                    <br />
                    Powered by Asterix, Fibermaxs &amp; Digimaxs Network
                </p>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// BAGIAN 5: HELPER / UTILITY FUNCTIONS
// ----------------------------------------------------------------------------
// Formatted utilities terintegrasi di komponen utama di atas

// ----------------------------------------------------------------------------
// BAGIAN 6: EXPORT & PUBLIC API (DENGAN SUSPENSE BOUNDARY)
// ----------------------------------------------------------------------------
export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] text-teal-600">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            }
        >
            <LoginFormContent />
        </Suspense>
    );
}
