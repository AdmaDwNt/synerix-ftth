"use client";

import { TIA598_COLORS } from "@/lib/ftth/tia598";
import { Info, Check } from "lucide-react";

export default function ColorReferenceTable() {
    return (
        <div className="bg-white rounded-2xl border border-synerix-border shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div>
                    <h3 className="text-base font-bold text-synerix-text flex items-center gap-2">
                        Tabel Acuan Visual 12 Warna TIA-598
                    </h3>
                    <p className="text-xs text-synerix-subtext">
                        Standar internasional urutan pewarnaan serat optik & loose tube
                    </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    <Info className="h-3.5 w-3.5 text-teal-600" />
                    <span>12 Core per Tube</span>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {TIA598_COLORS.map((color) => (
                    <div
                        key={color.number}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-xs transition-all bg-slate-50/50"
                    >
                        <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-sm shrink-0 shadow-xs ${color.textClass} ${color.borderClass || ""}`}
                            style={{ backgroundColor: color.hex }}
                        >
                            {color.number}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 truncate">
                                {color.nameId}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
                                <span>{color.nameEn}</span>
                                <span className="text-[10px] text-slate-400">{color.hex}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Catatan Standar Lapangan */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>
                        Jika kabel memiliki lebih dari 12 tube (e.g. 144c / 288c), siklus 12 warna diulang dengan tanda ring/tracer bergaris hitam/putih.
                    </span>
                </div>
                <span className="font-semibold text-slate-600 shrink-0">TIA/EIA-598-C Standard</span>
            </div>
        </div>
    );
}
