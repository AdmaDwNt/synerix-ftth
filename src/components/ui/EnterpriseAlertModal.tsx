"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Copy, Check, X, ShieldAlert, Database } from "lucide-react";

export interface EnterpriseAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    sqlSnippet?: string;
    type?: "error" | "warning" | "success" | "info";
    buttonText?: string;
}

export default function EnterpriseAlertModal({
    isOpen,
    onClose,
    title,
    message,
    sqlSnippet,
    type = "warning",
    buttonText = "Saya Mengerti",
}: EnterpriseAlertModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopySql = () => {
        if (!sqlSnippet) return;
        navigator.clipboard.writeText(sqlSnippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const typeConfig = {
        error: {
            bar: "bg-gradient-to-r from-rose-500 to-red-600",
            icon: <AlertCircle className="w-6 h-6 text-rose-600" />,
            iconBg: "bg-rose-50 border-rose-200 ring-rose-100",
            btn: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 shadow-md",
        },
        warning: {
            bar: "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500",
            icon: <ShieldAlert className="w-6 h-6 text-amber-600" />,
            iconBg: "bg-amber-50 border-amber-200 ring-amber-100",
            btn: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 shadow-md",
        },
        success: {
            bar: "bg-gradient-to-r from-emerald-500 to-teal-600",
            icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
            iconBg: "bg-emerald-50 border-emerald-200 ring-emerald-100",
            btn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 shadow-md",
        },
        info: {
            bar: "bg-gradient-to-r from-teal-500 to-cyan-600",
            icon: <Database className="w-6 h-6 text-teal-700" />,
            iconBg: "bg-teal-50 border-teal-200 ring-teal-100",
            btn: "bg-teal-700 hover:bg-teal-800 text-white shadow-teal-700/20 shadow-md",
        },
    }[type];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Dialog Card */}
            <div
                role="dialog"
                aria-modal="true"
                className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200"
            >
                <div className={`h-1.5 w-full ${typeConfig.bar}`} />

                <div className="p-6">
                    {/* Close Button Top Right */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Tutup dialog"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Icon + Title */}
                    <div className="flex items-start gap-4">
                        <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ring-4 shadow-xs ${typeConfig.iconBg}`}
                        >
                            {typeConfig.icon}
                        </div>

                        <div className="flex-1 pr-4">
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                                {title}
                            </h3>
                            <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                                {message}
                            </p>
                        </div>
                    </div>

                    {/* SQL Box if provided */}
                    {sqlSnippet && (
                        <div className="mt-4 p-3.5 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 text-xs font-mono">
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
                                <span>SQL Query (Supabase Editor)</span>
                                <button
                                    type="button"
                                    onClick={handleCopySql}
                                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-3 h-3 text-emerald-400" />
                                            <span className="text-emerald-400 font-sans font-bold text-[10px]">Tersalin!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3 text-slate-400" />
                                            <span className="font-sans font-medium text-[10px]">Salin SQL</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <pre className="text-[11px] leading-relaxed text-teal-300 overflow-x-auto p-1 font-mono">
                                {sqlSnippet}
                            </pre>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${typeConfig.btn}`}
                        >
                            {buttonText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
