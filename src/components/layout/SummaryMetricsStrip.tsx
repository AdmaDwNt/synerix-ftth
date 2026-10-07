"use client";

import React, { ReactNode } from "react";

export interface MetricItem {
    id: string;
    label: string;
    value: number | string;
    icon: ReactNode;
    colorScheme?: "amber" | "teal" | "blue" | "emerald" | "rose" | "purple";
    /** Kategori/filter value yang akan di-trigger saat card diklik */
    filterValue?: string;
}

interface SummaryMetricsStripProps {
    items: MetricItem[];
    /** ID dari card yang sedang aktif (dipilih sebagai filter) */
    activeId?: string | null;
    /** Callback saat card diklik, menerima filterValue dari MetricItem */
    onItemClick?: (filterValue: string, itemId: string) => void;
}

export default function SummaryMetricsStrip({ items, activeId, onItemClick }: SummaryMetricsStripProps) {
    const colorStyles = {
        amber: {
            bg: "bg-amber-50",
            icon: "text-amber-600",
            border: "border-amber-100",
            activeBg: "bg-amber-50",
            activeRing: "ring-amber-400",
        },
        teal: {
            bg: "bg-teal-50",
            icon: "text-teal-700",
            border: "border-teal-100",
            activeBg: "bg-teal-50",
            activeRing: "ring-teal-400",
        },
        blue: {
            bg: "bg-blue-50",
            icon: "text-blue-600",
            border: "border-blue-100",
            activeBg: "bg-blue-50",
            activeRing: "ring-blue-400",
        },
        emerald: {
            bg: "bg-emerald-50",
            icon: "text-emerald-600",
            border: "border-emerald-100",
            activeBg: "bg-emerald-50",
            activeRing: "ring-emerald-400",
        },
        rose: {
            bg: "bg-rose-50",
            icon: "text-rose-600",
            border: "border-rose-100",
            activeBg: "bg-rose-50",
            activeRing: "ring-rose-400",
        },
        purple: {
            bg: "bg-purple-50",
            icon: "text-purple-600",
            border: "border-purple-100",
            activeBg: "bg-purple-50",
            activeRing: "ring-purple-400",
        },
    };

    const isClickable = Boolean(onItemClick);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
            {items.map((item) => {
                const style = colorStyles[item.colorScheme || "amber"];
                const isActive = activeId === item.id;

                return (
                    <div
                        key={item.id}
                        onClick={() => {
                            if (onItemClick && item.filterValue !== undefined) {
                                onItemClick(item.filterValue, item.id);
                            }
                        }}
                        className={`bg-white rounded-2xl border p-4 sm:p-5 flex items-center gap-3.5 sm:gap-4 shadow-2xs transition-all ${
                            isClickable ? "cursor-pointer active:scale-[0.97]" : ""
                        } ${
                            isActive
                                ? `ring-2 ${style.activeRing} border-transparent ${style.activeBg} shadow-xs`
                                : "border-slate-200/80 hover:shadow-xs"
                        }`}
                    >
                        {/* Icon Box */}
                        <div
                            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 border ${style.bg} ${style.icon} ${style.border}`}
                        >
                            {item.icon}
                        </div>

                        {/* Text Info */}
                        <div className="min-w-0">
                            <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none font-mono">
                                {item.value}
                            </div>
                            <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1 truncate">
                                {item.label}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
