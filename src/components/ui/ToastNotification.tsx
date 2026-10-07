"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X, Trash2, RotateCcw } from "lucide-react";

export interface ToastItem {
    id: string;
    type: "success" | "error" | "info" | "warning";
    title?: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    durationMs?: number;
}

interface ToastNotificationProps {
    toasts: ToastItem[];
    onDismiss: (id: string) => void;
}

export default function ToastNotification({ toasts, onDismiss }: ToastNotificationProps) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0">
            {toasts.map((toast) => (
                <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
            ))}
        </div>
    );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
    const duration = toast.durationMs ?? 4500;
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
            if (remaining <= 0) {
                clearInterval(interval);
                onDismiss();
            }
        }, 50);

        return () => clearInterval(interval);
    }, [duration, onDismiss]);

    const typeConfig = {
        success: {
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
            badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            bar: "bg-emerald-500",
        },
        error: {
            icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
            badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
            bar: "bg-rose-500",
        },
        warning: {
            icon: <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />,
            badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            bar: "bg-amber-500",
        },
        info: {
            icon: <Info className="w-5 h-5 text-teal-400 shrink-0" />,
            badge: "bg-teal-500/10 text-teal-400 border-teal-500/20",
            bar: "bg-teal-500",
        },
    }[toast.type];

    return (
        <div className="pointer-events-auto relative overflow-hidden bg-slate-900/95 backdrop-blur-md text-white rounded-2xl border border-slate-800 shadow-2xl p-3.5 sm:p-4 flex items-start gap-3 animate-in slide-in-from-bottom-3 fade-in duration-200">
            {/* Type Icon */}
            <div className="pt-0.5">{typeConfig.icon}</div>

            {/* Message Body */}
            <div className="flex-1 min-w-0 pr-1">
                {toast.title && (
                    <div className="text-xs font-bold text-slate-100 tracking-tight mb-0.5">
                        {toast.title}
                    </div>
                )}
                <div className="text-xs text-slate-300 leading-relaxed break-words">
                    {toast.message}
                </div>

                {toast.actionLabel && toast.onAction && (
                    <button
                        type="button"
                        onClick={() => {
                            toast.onAction?.();
                            onDismiss();
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold shadow-xs transition-all active:scale-95"
                    >
                        <RotateCcw className="w-3 h-3" />
                        <span>{toast.actionLabel}</span>
                    </button>
                )}
            </div>

            {/* Close Button */}
            <button
                type="button"
                onClick={onDismiss}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                title="Tutup notifikasi"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Progress Bar Timer */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800">
                <div
                    className={`h-full transition-all duration-75 ${typeConfig.bar}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
