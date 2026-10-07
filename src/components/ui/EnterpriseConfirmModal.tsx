"use client";

import React, { ReactNode } from "react";
import { AlertTriangle, Trash2, X, RefreshCw, Info, CheckCircle2 } from "lucide-react";

export interface EnterpriseConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    description?: ReactNode | string;
    itemName?: string;
    itemBadge?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info" | "success";
    loading?: boolean;
}

export default function EnterpriseConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    itemName,
    itemBadge,
    confirmText = "Hapus Permanen",
    cancelText = "Batal",
    variant = "danger",
    loading = false,
}: EnterpriseConfirmModalProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            iconBg: "bg-rose-50 text-rose-600 border-rose-200 ring-rose-100",
            icon: <Trash2 className="w-6 h-6 text-rose-600 animate-in zoom-in-50 duration-200" />,
            badge: "bg-rose-100/80 text-rose-800 border-rose-200 font-mono",
            confirmBtn: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 shadow-md",
        },
        warning: {
            iconBg: "bg-amber-50 text-amber-600 border-amber-200 ring-amber-100",
            icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
            badge: "bg-amber-100/80 text-amber-800 border-amber-200 font-mono",
            confirmBtn: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 shadow-md",
        },
        info: {
            iconBg: "bg-teal-50 text-teal-700 border-teal-200 ring-teal-100",
            icon: <Info className="w-6 h-6 text-teal-700" />,
            badge: "bg-teal-100/80 text-teal-800 border-teal-200 font-mono",
            confirmBtn: "bg-teal-700 hover:bg-teal-800 text-white shadow-teal-700/20 shadow-md",
        },
        success: {
            iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200 ring-emerald-100",
            icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
            badge: "bg-emerald-100/80 text-emerald-800 border-emerald-200 font-mono",
            confirmBtn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 shadow-md",
        },
    }[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop dengan Blur Mewah */}
            <div
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={loading ? undefined : onClose}
            />

            {/* Modal Dialog Card */}
            <div
                role="dialog"
                aria-modal="true"
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header Pattern / Accent Bar */}
                <div
                    className={`h-1.5 w-full ${
                        variant === "danger"
                            ? "bg-gradient-to-r from-rose-500 via-red-500 to-rose-600"
                            : variant === "warning"
                            ? "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500"
                            : "bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600"
                    }`}
                />

                <div className="p-6">
                    {/* Close Button Top Right */}
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                        title="Tutup dialog"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Icon + Title Section */}
                    <div className="flex items-start gap-4">
                        <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ring-4 shadow-xs ${variantStyles.iconBg}`}
                        >
                            {variantStyles.icon}
                        </div>

                        <div className="flex-1 pr-4">
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                                {title}
                            </h3>

                            {/* Item highlight badge jika ada */}
                            {(itemName || itemBadge) && (
                                <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col gap-1">
                                    {itemName && (
                                        <div className="text-xs font-bold text-slate-900 truncate">
                                            {itemName}
                                        </div>
                                    )}
                                    {itemBadge && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                                ID / Tiket:
                                            </span>
                                            <span
                                                className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${variantStyles.badge}`}
                                            >
                                                {itemBadge}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Description text */}
                            {description && (
                                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {cancelText}
                        </button>

                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 ${variantStyles.confirmBtn}`}
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
