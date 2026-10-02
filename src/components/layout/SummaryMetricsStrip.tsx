"use client";

import React, { ReactNode } from "react";

export interface MetricItem {
    id: string;
    label: string;
    value: number | string;
    icon: ReactNode;
    colorScheme?: "amber" | "teal" | "blue" | "emerald" | "rose" | "purple";
}

interface SummaryMetricsStripProps {
    items: MetricItem[];
}

export default function SummaryMetricsStrip({ items }: SummaryMetricsStripProps) {
    const colorStyles = {
        amber: {
            bg: "bg-amber-50",
            icon: "text-amber-600",
            border: "border-amber-100",
        },
        teal: {
            bg: "bg-teal-50",
            icon: "text-teal-700",
            border: "border-teal-100",
        },
        blue: {
            bg: "bg-blue-50",
            icon: "text-blue-600",
            border: "border-blue-100",
        },
        emerald: {
            bg: "bg-emerald-50",
            icon: "text-emerald-600",
            border: "border-emerald-100",
        },
        rose: {
            bg: "bg-rose-50",
            icon: "text-rose-600",
            border: "border-rose-100",
        },
        purple: {
            bg: "bg-purple-50",
            icon: "text-purple-600",
            border: "border-purple-100",
        },
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
            {items.map((item) => {
                const style = colorStyles[item.colorScheme || "amber"];
                return (
                    <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 flex items-center gap-3.5 sm:gap-4 shadow-2xs hover:shadow-xs transition-shadow"
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
