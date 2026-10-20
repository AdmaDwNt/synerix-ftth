/**
 * ============================================================================
 * MODUL       : Unified Notification System (Synerix Notify)
 * FILE        : src/components/ui/SynerixNotify.tsx
 * DESKRIPSI   : Sistem notifikasi terpadu yang menggabungkan konsep Toast,
 *               Snackbar, dan Alert Banner ke dalam satu komponen premium.
 *               Mendukung 3 mode tampilan:
 *               - TOAST: Panel kanan bawah dengan detail lengkap
 *               - SNACKBAR: Bar minimalis bawah tengah untuk feedback cepat
 *               - BANNER: Strip penuh atas halaman untuk alert penting
 * ============================================================================
 */

"use client";

// ----------------------------------------------------------------------------
// BAGIAN 1: IMPORT & DEPENDENCIES
// ----------------------------------------------------------------------------
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Info,
    X,
    RotateCcw,
    Zap,
    ChevronRight,
    Bell,
    ShieldCheck,
    ExternalLink,
} from "lucide-react";

// ----------------------------------------------------------------------------
// BAGIAN 2: DEFINISI TIPE & INTERFACE (TYPESCRIPT CONTRACT)
// ----------------------------------------------------------------------------
export type NotifyVariant = "success" | "error" | "warning" | "info";
export type NotifyMode = "toast" | "snackbar" | "banner";

export interface NotifyItem {
    id: string;
    mode: NotifyMode;
    variant: NotifyVariant;
    title?: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    linkLabel?: string;
    linkHref?: string;
    durationMs?: number;
    persistent?: boolean; // Banner mode: tidak auto-dismiss
    icon?: React.ReactNode; // Custom icon override
}

export interface SynerixNotifyProps {
    items: NotifyItem[];
    onDismiss: (id: string) => void;
}

// Hook helper untuk consumer pages
export function useNotify() {
    const [items, setItems] = useState<NotifyItem[]>([]);

    const push = useCallback((item: Omit<NotifyItem, "id">) => {
        const id = `notify-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setItems((prev) => [...prev, { ...item, id }]);
        return id;
    }, []);

    const dismiss = useCallback((id: string) => {
        setItems((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setItems([]);
    }, []);

    // Shorthand helpers
    const toast = useCallback(
        (variant: NotifyVariant, message: string, opts?: Partial<Omit<NotifyItem, "id" | "mode" | "variant" | "message">>) =>
            push({ mode: "toast", variant, message, ...opts }),
        [push]
    );

    const snackbar = useCallback(
        (variant: NotifyVariant, message: string, opts?: Partial<Omit<NotifyItem, "id" | "mode" | "variant" | "message">>) =>
            push({ mode: "snackbar", variant, message, ...opts }),
        [push]
    );

    const banner = useCallback(
        (variant: NotifyVariant, message: string, opts?: Partial<Omit<NotifyItem, "id" | "mode" | "variant" | "message">>) =>
            push({ mode: "banner", variant, message, persistent: true, ...opts }),
        [push]
    );

    return { items, push, dismiss, clearAll, toast, snackbar, banner };
}

// ----------------------------------------------------------------------------
// BAGIAN 3: KONSTANTA & KONFIGURASI
// ----------------------------------------------------------------------------
const VARIANT_CONFIG = {
    success: {
        icon: <CheckCircle2 className="w-[18px] h-[18px]" />,
        // Toast mode (dark glass)
        toastBg: "bg-gradient-to-r from-slate-900/98 via-slate-900/98 to-emerald-950/60",
        toastBorder: "border-emerald-500/25",
        toastIconColor: "text-emerald-400",
        toastAccent: "bg-emerald-500",
        toastGlow: "shadow-emerald-500/10",
        // Snackbar mode (pill style)
        snackBg: "bg-emerald-600",
        snackText: "text-white",
        snackIcon: "text-emerald-200",
        // Banner mode (full width strip)
        bannerBg: "bg-gradient-to-r from-emerald-50 via-emerald-50 to-teal-50",
        bannerBorder: "border-emerald-200",
        bannerText: "text-emerald-900",
        bannerIcon: "text-emerald-600",
        bannerAccent: "bg-emerald-500",
    },
    error: {
        icon: <AlertCircle className="w-[18px] h-[18px]" />,
        toastBg: "bg-gradient-to-r from-slate-900/98 via-slate-900/98 to-rose-950/60",
        toastBorder: "border-rose-500/25",
        toastIconColor: "text-rose-400",
        toastAccent: "bg-rose-500",
        toastGlow: "shadow-rose-500/10",
        snackBg: "bg-rose-600",
        snackText: "text-white",
        snackIcon: "text-rose-200",
        bannerBg: "bg-gradient-to-r from-rose-50 via-rose-50 to-red-50",
        bannerBorder: "border-rose-200",
        bannerText: "text-rose-900",
        bannerIcon: "text-rose-600",
        bannerAccent: "bg-rose-500",
    },
    warning: {
        icon: <AlertTriangle className="w-[18px] h-[18px]" />,
        toastBg: "bg-gradient-to-r from-slate-900/98 via-slate-900/98 to-amber-950/60",
        toastBorder: "border-amber-500/25",
        toastIconColor: "text-amber-400",
        toastAccent: "bg-amber-500",
        toastGlow: "shadow-amber-500/10",
        snackBg: "bg-amber-600",
        snackText: "text-white",
        snackIcon: "text-amber-200",
        bannerBg: "bg-gradient-to-r from-amber-50 via-amber-50 to-yellow-50",
        bannerBorder: "border-amber-200",
        bannerText: "text-amber-900",
        bannerIcon: "text-amber-600",
        bannerAccent: "bg-amber-500",
    },
    info: {
        icon: <Info className="w-[18px] h-[18px]" />,
        toastBg: "bg-gradient-to-r from-slate-900/98 via-slate-900/98 to-teal-950/60",
        toastBorder: "border-teal-500/25",
        toastIconColor: "text-teal-400",
        toastAccent: "bg-teal-500",
        toastGlow: "shadow-teal-500/10",
        snackBg: "bg-teal-600",
        snackText: "text-white",
        snackIcon: "text-teal-200",
        bannerBg: "bg-gradient-to-r from-teal-50 via-teal-50 to-cyan-50",
        bannerBorder: "border-teal-200",
        bannerText: "text-teal-900",
        bannerIcon: "text-teal-600",
        bannerAccent: "bg-teal-500",
    },
};

// ----------------------------------------------------------------------------
// BAGIAN 4: LOGIKA UTAMA — KOMPONEN RENDER
// ----------------------------------------------------------------------------

/**
 * Komponen utama SynerixNotify
 * Memisahkan rendering berdasarkan mode (toast, snackbar, banner)
 */
export default function SynerixNotify({ items, onDismiss }: SynerixNotifyProps) {
    const banners = items.filter((n) => n.mode === "banner");
    const toasts = items.filter((n) => n.mode === "toast");
    const snackbars = items.filter((n) => n.mode === "snackbar");

    return (
        <>
            {/* ─── BANNER LAYER: Fixed top-level full-width alerts ─── */}
            {banners.length > 0 && (
                <div className="fixed top-0 left-0 right-0 z-[60] flex flex-col">
                    {banners.map((item) => (
                        <BannerCard key={item.id} item={item} onDismiss={() => onDismiss(item.id)} />
                    ))}
                </div>
            )}

            {/* ─── TOAST LAYER: Bottom-right panel stack ─── */}
            {toasts.length > 0 && (
                <div className="fixed bottom-4 right-4 z-[60] flex flex-col-reverse gap-2.5 max-w-sm w-full pointer-events-none sm:max-w-md px-2 sm:px-0">
                    {toasts.slice(-4).map((item) => (
                        <ToastCard key={item.id} item={item} onDismiss={() => onDismiss(item.id)} />
                    ))}
                </div>
            )}

            {/* ─── SNACKBAR LAYER: Bottom-center minimal pill ─── */}
            {snackbars.length > 0 && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col-reverse gap-2 pointer-events-none max-w-lg w-[calc(100%-2rem)]">
                    {snackbars.slice(-3).map((item) => (
                        <SnackbarCard key={item.id} item={item} onDismiss={() => onDismiss(item.id)} />
                    ))}
                </div>
            )}
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-KOMPONEN: ToastCard (Rich Notification Panel)
// ─────────────────────────────────────────────────────────────────────────────
function ToastCard({ item, onDismiss }: { item: NotifyItem; onDismiss: () => void }) {
    const cfg = VARIANT_CONFIG[item.variant];
    const duration = item.durationMs ?? 5000;
    const [progress, setProgress] = useState(100);
    const [isExiting, setIsExiting] = useState(false);
    const startRef = useRef(Date.now());

    useEffect(() => {
        if (item.persistent) return;
        const interval = setInterval(() => {
            const elapsed = Date.now() - startRef.current;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
            if (remaining <= 0) {
                clearInterval(interval);
                handleDismiss();
            }
        }, 40);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration, item.persistent]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(onDismiss, 200);
    };

    return (
        <div
            className={`pointer-events-auto relative overflow-hidden rounded-2xl border backdrop-blur-xl shadow-2xl ${cfg.toastBg} ${cfg.toastBorder} ${cfg.toastGlow} ${
                isExiting
                    ? "animate-out fade-out slide-out-to-right-3 duration-200"
                    : "animate-in fade-in slide-in-from-right-5 duration-300"
            }`}
        >
            {/* Left accent stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${cfg.toastAccent} rounded-l-2xl`} />

            <div className="pl-4 pr-3 py-3.5 flex items-start gap-3">
                {/* Icon */}
                <div className={`mt-0.5 shrink-0 ${cfg.toastIconColor}`}>
                    {item.icon || cfg.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {item.title && (
                        <div className="text-[13px] font-bold text-white/95 tracking-tight leading-tight mb-0.5">
                            {item.title}
                        </div>
                    )}
                    <div className="text-xs text-slate-300 leading-relaxed break-words">
                        {item.message}
                    </div>

                    {/* Action Row */}
                    {(item.actionLabel || item.linkLabel) && (
                        <div className="flex items-center gap-2 mt-2.5">
                            {item.actionLabel && item.onAction && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        item.onAction?.();
                                        handleDismiss();
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold transition-all active:scale-95 border border-white/10"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>{item.actionLabel}</span>
                                </button>
                            )}
                            {item.linkLabel && item.linkHref && (
                                <a
                                    href={item.linkHref}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-400 hover:text-teal-300 transition-colors"
                                >
                                    <span>{item.linkLabel}</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {/* Close */}
                <button
                    type="button"
                    onClick={handleDismiss}
                    className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all shrink-0"
                    title="Tutup"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Progress bar */}
            {!item.persistent && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
                    <div
                        className={`h-full transition-[width] duration-75 ease-linear ${cfg.toastAccent} opacity-80`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-KOMPONEN: SnackbarCard (Minimal Bottom Pill)
// ─────────────────────────────────────────────────────────────────────────────
function SnackbarCard({ item, onDismiss }: { item: NotifyItem; onDismiss: () => void }) {
    const cfg = VARIANT_CONFIG[item.variant];
    const duration = item.durationMs ?? 3500;
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);
    const startRef = useRef(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            const elapsed = Date.now() - startRef.current;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
            if (remaining <= 0) {
                clearInterval(interval);
                handleDismiss();
            }
        }, 40);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(onDismiss, 200);
    };

    return (
        <div
            className={`pointer-events-auto relative overflow-hidden rounded-2xl ${cfg.snackBg} ${cfg.snackText} shadow-2xl shadow-slate-900/20 ${
                isExiting
                    ? "animate-out fade-out slide-out-to-bottom-2 duration-200"
                    : "animate-in fade-in slide-in-from-bottom-3 duration-300"
            }`}
        >
            <div className="px-4 py-3 flex items-center gap-3">
                {/* Icon */}
                <div className={`shrink-0 ${cfg.snackIcon}`}>
                    {item.icon || cfg.icon}
                </div>

                {/* Message */}
                <div className="flex-1 min-w-0 text-[13px] font-semibold leading-snug truncate">
                    {item.message}
                </div>

                {/* Action */}
                {item.actionLabel && item.onAction && (
                    <button
                        type="button"
                        onClick={() => {
                            item.onAction?.();
                            handleDismiss();
                        }}
                        className="shrink-0 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold transition-all active:scale-95 backdrop-blur-sm"
                    >
                        {item.actionLabel}
                    </button>
                )}

                {/* Close */}
                <button
                    type="button"
                    onClick={handleDismiss}
                    className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/15 transition-all shrink-0"
                    title="Tutup"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/10">
                <div
                    className="h-full transition-[width] duration-75 ease-linear bg-white/40"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-KOMPONEN: BannerCard (Full-Width Top Alert Strip)
// ─────────────────────────────────────────────────────────────────────────────
function BannerCard({ item, onDismiss }: { item: NotifyItem; onDismiss: () => void }) {
    const cfg = VARIANT_CONFIG[item.variant];
    const duration = item.durationMs ?? 8000;
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);
    const startRef = useRef(Date.now());

    useEffect(() => {
        if (item.persistent) return;
        const interval = setInterval(() => {
            const elapsed = Date.now() - startRef.current;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
            if (remaining <= 0) {
                clearInterval(interval);
                handleDismiss();
            }
        }, 40);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration, item.persistent]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(onDismiss, 200);
    };

    return (
        <div
            className={`relative overflow-hidden border-b ${cfg.bannerBg} ${cfg.bannerBorder} ${
                isExiting
                    ? "animate-out fade-out slide-out-to-top-1 duration-200"
                    : "animate-in fade-in slide-in-from-top-2 duration-300"
            }`}
        >
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
                {/* Left accent dot + Icon */}
                <div className={`shrink-0 flex items-center gap-2 ${cfg.bannerIcon}`}>
                    <div className={`w-2 h-2 rounded-full ${cfg.bannerAccent} animate-pulse`} />
                    {item.icon || cfg.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {item.title && (
                        <span className={`text-xs font-bold ${cfg.bannerText} mr-1.5`}>
                            {item.title}
                        </span>
                    )}
                    <span className={`text-xs ${cfg.bannerText} opacity-80`}>
                        {item.message}
                    </span>
                </div>

                {/* Action buttons */}
                {item.actionLabel && item.onAction && (
                    <button
                        type="button"
                        onClick={() => {
                            item.onAction?.();
                            handleDismiss();
                        }}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${cfg.bannerAccent} text-white shadow-sm`}
                    >
                        <span>{item.actionLabel}</span>
                        <ChevronRight className="w-3 h-3" />
                    </button>
                )}

                {item.linkLabel && item.linkHref && (
                    <a
                        href={item.linkHref}
                        className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-bold ${cfg.bannerIcon} hover:opacity-80 transition-opacity`}
                    >
                        <span>{item.linkLabel}</span>
                        <ExternalLink className="w-3 h-3" />
                    </a>
                )}

                {/* Close */}
                <button
                    type="button"
                    onClick={handleDismiss}
                    className={`p-1 rounded-lg ${cfg.bannerText} opacity-50 hover:opacity-100 transition-opacity shrink-0`}
                    title="Tutup"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Progress bar */}
            {!item.persistent && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/5">
                    <div
                        className={`h-full transition-[width] duration-75 ease-linear ${cfg.bannerAccent} opacity-60`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
}

// ----------------------------------------------------------------------------
// BAGIAN 5: HELPER / UTILITY FUNCTIONS
// ----------------------------------------------------------------------------
// useNotify hook exported di atas

// ----------------------------------------------------------------------------
// BAGIAN 6: EXPORT & PUBLIC API
// ----------------------------------------------------------------------------
// Default export: SynerixNotify component
// Named exports: useNotify hook, NotifyItem type, etc.
