/**
 * ============================================================================
 * MODUL       : Synerix Confirm Modal (Premium Confirm Dialog)
 * FILE        : src/components/ui/SynerixConfirmModal.tsx
 * DESKRIPSI   : Modal konfirmasi premium yang menggantikan EnterpriseConfirmModal.
 *               Fitur: glassmorphism backdrop, ripple animation, detail item card,
 *               dual-action buttons dengan loading state, dan auto-close timer.
 * ============================================================================
 */

"use client";

// ----------------------------------------------------------------------------
// BAGIAN 1: IMPORT & DEPENDENCIES
// ----------------------------------------------------------------------------
import React, { ReactNode, useEffect, useRef, useState } from "react";
import {
    Trash2,
    X,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    Info,
    ShieldAlert,
    Zap,
} from "lucide-react";

// ----------------------------------------------------------------------------
// BAGIAN 2: DEFINISI TIPE & INTERFACE (TYPESCRIPT CONTRACT)
// ----------------------------------------------------------------------------
export type ConfirmVariant = "danger" | "warning" | "info" | "success";

export interface SynerixConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    description?: ReactNode | string;
    itemName?: string;
    itemBadge?: string;
    itemMeta?: string; // Info tambahan (misal: "Teknisi Lapangan")
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmVariant;
    loading?: boolean;
    icon?: React.ReactNode; // Custom icon override
}

// ----------------------------------------------------------------------------
// BAGIAN 3: KONSTANTA & KONFIGURASI
// ----------------------------------------------------------------------------
const VARIANT_MAP = {
    danger: {
        icon: <Trash2 className="w-6 h-6" />,
        iconBg: "bg-rose-500",
        iconRing: "ring-rose-500/20",
        iconGlow: "shadow-rose-500/30",
        accentBar: "bg-gradient-to-r from-rose-500 via-red-500 to-rose-600",
        badge: "bg-rose-100 text-rose-800 border-rose-200",
        confirmBtn: "bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500",
        confirmBtnShadow: "shadow-rose-600/25",
        pulseColor: "bg-rose-400",
    },
    warning: {
        icon: <AlertTriangle className="w-6 h-6" />,
        iconBg: "bg-amber-500",
        iconRing: "ring-amber-500/20",
        iconGlow: "shadow-amber-500/30",
        accentBar: "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500",
        badge: "bg-amber-100 text-amber-800 border-amber-200",
        confirmBtn: "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500",
        confirmBtnShadow: "shadow-amber-600/25",
        pulseColor: "bg-amber-400",
    },
    info: {
        icon: <Info className="w-6 h-6" />,
        iconBg: "bg-teal-600",
        iconRing: "ring-teal-500/20",
        iconGlow: "shadow-teal-500/30",
        accentBar: "bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600",
        badge: "bg-teal-100 text-teal-800 border-teal-200",
        confirmBtn: "bg-teal-700 hover:bg-teal-800 focus-visible:ring-teal-500",
        confirmBtnShadow: "shadow-teal-700/25",
        pulseColor: "bg-teal-400",
    },
    success: {
        icon: <CheckCircle2 className="w-6 h-6" />,
        iconBg: "bg-emerald-600",
        iconRing: "ring-emerald-500/20",
        iconGlow: "shadow-emerald-500/30",
        accentBar: "bg-gradient-to-r from-emerald-500 to-teal-600",
        badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
        confirmBtn: "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500",
        confirmBtnShadow: "shadow-emerald-600/25",
        pulseColor: "bg-emerald-400",
    },
};

// ----------------------------------------------------------------------------
// BAGIAN 4: LOGIKA UTAMA (CORE COMPONENT)
// ----------------------------------------------------------------------------
export default function SynerixConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    itemName,
    itemBadge,
    itemMeta,
    confirmText = "Konfirmasi",
    cancelText = "Batal",
    variant = "danger",
    loading = false,
    icon,
}: SynerixConfirmModalProps) {
    const [isClosing, setIsClosing] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const cfg = VARIANT_MAP[variant];

    // Lock body scroll saat modal terbuka
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            setIsClosing(false);
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Close handler dengan exit animation
    const handleClose = () => {
        if (loading) return;
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 180);
    };

    // Handle Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen && !loading) handleClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, loading]);

    if (!isOpen && !isClosing) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop — Glassmorphism */}
            <div
                className={`fixed inset-0 bg-slate-950/50 backdrop-blur-md transition-opacity duration-200 ${
                    isClosing ? "opacity-0" : "opacity-100"
                }`}
                onClick={handleClose}
            />

            {/* Modal Card */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                className={`relative w-full max-w-[440px] bg-white rounded-[20px] shadow-2xl border border-slate-200/60 overflow-hidden z-10 transition-all duration-200 ${
                    isClosing
                        ? "opacity-0 scale-95 translate-y-2"
                        : "opacity-100 scale-100 translate-y-0 animate-in fade-in zoom-in-95 duration-250"
                }`}
            >
                {/* Top Accent Bar */}
                <div className={`h-1 w-full ${cfg.accentBar}`} />

                <div className="p-6">
                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-40 cursor-pointer"
                        title="Tutup"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Icon Container — Floating with glow */}
                    <div className="flex items-center gap-4 mb-5">
                        <div
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ring-4 shadow-lg shrink-0 ${cfg.iconBg} ${cfg.iconRing} ${cfg.iconGlow}`}
                        >
                            {icon || cfg.icon}
                        </div>
                        <div className="flex-1 pr-6">
                            <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                                {title}
                            </h3>
                            {description && (
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Item Detail Card (jika ada) */}
                    {(itemName || itemBadge) && (
                        <div className="mb-5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                            {itemName && (
                                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="truncate">{itemName}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                                {itemBadge && (
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${cfg.badge}`}>
                                        {itemBadge}
                                    </span>
                                )}
                                {itemMeta && (
                                    <span className="text-[11px] text-slate-400 font-medium">
                                        {itemMeta}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 ${cfg.confirmBtn} ${cfg.confirmBtnShadow}`}
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <span>{confirmText}</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// BAGIAN 5: HELPER / UTILITY FUNCTIONS
// ----------------------------------------------------------------------------
// Terintegrasi dalam komponen di atas

// ----------------------------------------------------------------------------
// BAGIAN 6: EXPORT & PUBLIC API
// ----------------------------------------------------------------------------
// Default export di atas
