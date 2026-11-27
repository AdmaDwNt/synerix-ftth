/**
 * ============================================================================
 * MODUL       : Autentikasi Pengguna (UI)
 * FILE        : src/app/login/page.tsx
 * DESKRIPSI   : Halaman login modern Synerix-FTTH selaras dengan Asterix Clean Light Theme.
 *               Dilengkapi Progressive Lockout (1-5 Menit), CAPTCHA Tantangan & 
 *               Verifikasi 2FA OTP, serta perlindungan Anti-Enumeration.
 * ============================================================================
 */

"use client";

// ----------------------------------------------------------------------------
// BAGIAN 1: IMPORT & DEPENDENCIES
// ----------------------------------------------------------------------------
import { useState, useEffect, useTransition, Suspense } from "react";
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
    ShieldAlert,
    KeyRound,
    RefreshCw,
} from "lucide-react";

// ----------------------------------------------------------------------------
// BAGIAN 2: DEFINISI TIPE & INTERFACE (TYPESCRIPT CONTRACT)
// ----------------------------------------------------------------------------
interface LoginResponse {
    success: boolean;
    error?: string;
    locked?: boolean;
    remainingLockoutSeconds?: number;
    requiresCaptcha?: boolean;
    requires2fa?: boolean;
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

    // Security Verification State
    const [requiresCaptcha, setRequiresCaptcha] = useState(false);
    const [captchaChallenge, setCaptchaChallenge] = useState({ numA: 7, numB: 5 });
    const [captchaInput, setCaptchaInput] = useState("");
    const [requires2fa, setRequires2fa] = useState(false);
    const [otpCode, setOtpCode] = useState("");

    // Lockout State
    const [lockoutSeconds, setLockoutSeconds] = useState(0);

    // Status & Feedback State
    const [isLoading, setIsLoading] = useState(false);
    const [authStepIndex, setAuthStepIndex] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [, startTransition] = useTransition();

    // Generate Captcha Challenge
    const generateNewCaptcha = () => {
        const numA = Math.floor(Math.random() * 9) + 1;
        const numB = Math.floor(Math.random() * 9) + 1;
        setCaptchaChallenge({ numA, numB });
        setCaptchaInput("");
    };

    // Countdown Lockout Timer
    useEffect(() => {
        if (lockoutSeconds <= 0) return;
        const timer = setInterval(() => {
            setLockoutSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [lockoutSeconds]);

    /**
     * Handler submit form login
     */
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (lockoutSeconds > 0) {
            setErrorMessage(`Akun atau IP Anda terkunci sementara. Silakan tunggu ${lockoutSeconds} detik.`);
            return;
        }

        const cleanUsername = username.trim();
        const cleanPassword = password.trim();

        if (!cleanUsername || !cleanPassword) {
            setErrorMessage("Silakan masukkan username dan password Billingnesia Anda.");
            return;
        }

        // Validate local captcha if active
        if (requiresCaptcha) {
            const expected = captchaChallenge.numA + captchaChallenge.numB;
            if (parseInt(captchaInput, 10) !== expected) {
                setErrorMessage("Jawaban verifikasi keamanan (CAPTCHA) tidak tepat.");
                generateNewCaptcha();
                return;
            }
        }

        // Validate 2FA OTP if required
        if (requires2fa && !otpCode.trim()) {
            setErrorMessage("Masukkan 6 digit kode OTP 2FA Anda.");
            return;
        }

        setIsLoading(true);
        setAuthStepIndex(0);

        // Simulasi progres feedback step untuk responsivitas visual
        const timer1 = setTimeout(() => setAuthStepIndex(1), 500);
        const timer2 = setTimeout(() => setAuthStepIndex(2), 1200);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: cleanUsername,
                    password: cleanPassword,
                    captchaToken: requiresCaptcha ? `passed_${captchaInput}` : undefined,
                    otpToken: requires2fa ? otpCode.trim() : undefined,
                }),
            });

            clearTimeout(timer1);
            clearTimeout(timer2);

            const json: LoginResponse = await res.json();

            if (!res.ok || !json.success) {
                // Check if account locked
                if (json.locked && json.remainingLockoutSeconds) {
                    setLockoutSeconds(json.remainingLockoutSeconds);
                }

                // Check security challenges triggered (attempt >= 3)
                if (json.requiresCaptcha) {
                    setRequiresCaptcha(true);
                    generateNewCaptcha();
                }
                if (json.requires2fa) {
                    setRequires2fa(true);
                }

                // Uniform anti-enumeration error
                throw new Error(json.error || "Email atau password salah.");
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

    const formatLockoutTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
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
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold tracking-wide mb-2">
                        <Server className="w-3.5 h-3.5 text-teal-600" />
                        <span>FTTH Field Operations & NOC Console</span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                        Masuk ke Sesi Kerja
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs">
                        Gunakan akun Billingnesia resmi untuk sinkronisasi otomatis tiket & jadwal.
                    </p>
                </div>

                {/* CARD UTAMA LOGIN */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 sm:p-8 backdrop-blur-md">
                    {/* Lockout Warning Banner */}
                    {lockoutSeconds > 0 && (
                        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">Keamanan Akun Terkunci Sementara</p>
                                <p className="text-[11px] text-rose-700 mt-0.5">
                                    Terlalu banyak percobaan gagal. Tombol masuk dinonaktifkan selama:{" "}
                                    <span className="font-mono font-bold text-rose-900 text-sm">
                                        {formatLockoutTime(lockoutSeconds)}
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error Banner */}
                    {errorMessage && lockoutSeconds === 0 && (
                        <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="leading-relaxed">
                                <span className="font-bold">Akses Ditolak: </span>
                                {errorMessage}
                            </div>
                        </div>
                    )}

                    {/* Progress Step Indicator saat Loading */}
                    {isLoading && (
                        <div className="mb-5 p-3.5 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-900 text-xs flex items-center gap-3 animate-in fade-in">
                            <Loader2 className="w-4 h-4 text-teal-600 animate-spin shrink-0" />
                            <span className="font-medium">{AUTH_STEPS[authStepIndex]}</span>
                        </div>
                    )}

                    {/* Form Input */}
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        {/* Input Username */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                Username Billingnesia
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <User className="h-4 w-4" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Contoh: teknisi_01 atau email"
                                    disabled={isLoading || isSuccess || lockoutSeconds > 0}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all disabled:opacity-50"
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {/* Input Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Password
                                </label>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    disabled={isLoading || isSuccess || lockoutSeconds > 0}
                                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all disabled:opacity-50"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Dynamic Security Verification: CAPTCHA (Attempt >= 3) */}
                        {requiresCaptcha && (
                            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2 animate-in fade-in">
                                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                                    <span className="flex items-center gap-1.5">
                                        <ShieldCheck className="w-4 h-4 text-amber-700" />
                                        Verifikasi Keamanan (CAPTCHA)
                                    </span>
                                    <button
                                        type="button"
                                        onClick={generateNewCaptcha}
                                        className="text-amber-700 hover:text-amber-900 inline-flex items-center gap-1 text-[11px]"
                                    >
                                        <RefreshCw className="w-3 h-3" /> Ganti
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg font-mono font-black text-amber-900 tracking-widest text-sm shadow-2xs select-none">
                                        {captchaChallenge.numA} + {captchaChallenge.numB} = ?
                                    </div>
                                    <input
                                        type="number"
                                        value={captchaInput}
                                        onChange={(e) => setCaptchaInput(e.target.value)}
                                        placeholder="Jawaban angka"
                                        disabled={isLoading || isSuccess || lockoutSeconds > 0}
                                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Dynamic Security Verification: 2FA OTP */}
                        {requires2fa && (
                            <div className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200 space-y-2 animate-in fade-in">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                                    <KeyRound className="w-4 h-4 text-teal-700" />
                                    Verifikasi 2FA OTP
                                </div>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    placeholder="Masukkan 6 Digit OTP"
                                    disabled={isLoading || isSuccess || lockoutSeconds > 0}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    required
                                />
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || isSuccess || lockoutSeconds > 0}
                            className={`w-full mt-2 py-2.5 px-4 rounded-xl font-bold text-sm text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                                isSuccess
                                    ? "bg-emerald-600 hover:bg-emerald-600"
                                    : lockoutSeconds > 0
                                    ? "bg-slate-400 cursor-not-allowed"
                                    : "bg-teal-700 hover:bg-teal-800 active:scale-[0.99] shadow-teal-700/20"
                            } disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                            {isSuccess ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Berhasil Masuk</span>
                                </>
                            ) : lockoutSeconds > 0 ? (
                                <>
                                    <Lock className="w-4 h-4" />
                                    <span>Terkunci ({formatLockoutTime(lockoutSeconds)})</span>
                                </>
                            ) : isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <>
                                    <span>Masuk ke Konsol</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Keamanan & Kebijakan */}
                    <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1 text-slate-500">
                            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                            Sesi Terisolasi & Anti-Intrusi
                        </span>
                        <span>Synerix v2.0</span>
                    </div>
                </div>

                {/* Sub-Footer Bantuan */}
                <div className="text-center mt-6">
                    <p className="text-xs text-slate-400">
                        Mengalami kendala akun? Hubungi{" "}
                        <span className="text-teal-700 font-bold hover:underline cursor-pointer">
                            Koordinator NOC & IT Support
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// BAGIAN 5: DEFAULT EXPORT WITH SUSPENSE (NEXT.JS REQUIREMENT)
// ----------------------------------------------------------------------------
export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                        <p className="text-xs font-semibold text-slate-500">Memuat Gerbang Autentikasi...</p>
                    </div>
                </div>
            }
        >
            <LoginFormContent />
        </Suspense>
    );
}
