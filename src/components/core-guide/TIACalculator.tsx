"use client";

import { useState } from "react";
import {
    calculateCoreFromGlobal,
    calculateGlobalFromTubeAndCore,
    TIA598_COLORS,
    getFiberColor
} from "@/lib/ftth/tia598";
import { Sparkles, ArrowRightLeft, Layers, Hash } from "lucide-react";

export default function TIACalculator() {
    // Mode kalkulasi: 'BY_CORE' atau 'BY_TUBE_CORE'
    const [calcMode, setCalcMode] = useState<"BY_CORE" | "BY_TUBE_CORE">("BY_CORE");

    // State untuk Input Core Global
    const [globalInput, setGlobalInput] = useState<number>(28);

    // State untuk Reverse Input (Tube & Core)
    const [selectedTube, setSelectedTube] = useState<number>(3);
    const [selectedCoreInTube, setSelectedCoreInTube] = useState<number>(4);

    // Hasil kalkulasi
    const resultFromGlobal = calculateCoreFromGlobal(globalInput || 1);
    const resultGlobalFromReverse = calculateGlobalFromTubeAndCore(selectedTube, selectedCoreInTube);

    // Preset nomor core umum di lapangan FTTH
    const corePresets = [1, 12, 13, 24, 28, 48, 96, 144];

    return (
        <div className="bg-white rounded-2xl border border-synerix-border shadow-sm p-4 sm:p-6 transition-all">
            {/* Header Kalkulator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-synerix-text flex items-center gap-2">
                            Interactive TIA-598 Color Calculator
                        </h2>
                        <p className="text-xs text-synerix-subtext">
                            Alat bantu instan identifikasi warna Tube & Core fiber optik
                        </p>
                    </div>
                </div>

                {/* Tab Switcher Mode */}
                <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setCalcMode("BY_CORE")}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                            calcMode === "BY_CORE"
                                ? "bg-white text-teal-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                        }`}
                    >
                        Cari No. Core
                    </button>
                    <button
                        type="button"
                        onClick={() => setCalcMode("BY_TUBE_CORE")}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                            calcMode === "BY_TUBE_CORE"
                                ? "bg-white text-teal-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                        }`}
                    >
                        <ArrowRightLeft className="h-3 w-3" />
                        Pilih Tube & Core
                    </button>
                </div>
            </div>

            {/* CONTENT MODE 1: DARI NOMOR CORE GLOBAL */}
            {calcMode === "BY_CORE" && (
                <div className="mt-5 space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                            Masukkan Nomor Core Global (1 s/d 288):
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 max-w-xs">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="number"
                                    min="1"
                                    max="288"
                                    value={globalInput}
                                    onChange={(e) => setGlobalInput(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="Contoh: 28"
                                />
                            </div>
                            <div className="flex gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setGlobalInput((prev) => Math.max(1, prev - 1))}
                                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 active:scale-95"
                                >
                                    -1
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGlobalInput((prev) => prev + 1)}
                                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 active:scale-95"
                                >
                                    +1
                                </button>
                            </div>
                        </div>

                        {/* Presets Button */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                            <span className="text-[11px] text-slate-400 mr-1">Preset cepat:</span>
                            {corePresets.map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setGlobalInput(preset)}
                                    className={`text-[11px] px-2 py-0.5 rounded-md font-semibold transition-all ${
                                        globalInput === preset
                                            ? "bg-teal-700 text-white shadow-xs"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    Core {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* HASIL VISUAL CARD */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {/* KARTU TUBE */}
                        <div className="rounded-xl border border-slate-200 p-4 bg-gradient-to-br from-slate-50 to-white relative overflow-hidden shadow-xs">
                            <div
                                className="absolute top-0 left-0 right-0 h-2"
                                style={{ backgroundColor: resultFromGlobal.tubeColor.hex }}
                            />
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                <span className="font-semibold uppercase tracking-wider">Loose Tube</span>
                                <span className="text-[11px] bg-slate-200/80 px-2 py-0.5 rounded font-mono">
                                    Tube ke-{resultFromGlobal.tubeNumber}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 mt-3">
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${resultFromGlobal.tubeColor.textClass} ${resultFromGlobal.tubeColor.borderClass || ""}`}
                                    style={{ backgroundColor: resultFromGlobal.tubeColor.hex }}
                                >
                                    {resultFromGlobal.tubeNumber}
                                </div>
                                <div>
                                    <div className="text-base font-bold text-slate-900">
                                        Warna {resultFromGlobal.tubeColor.nameId}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        Standard: {resultFromGlobal.tubeColor.nameEn} ({resultFromGlobal.tubeColor.hex})
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* KARTU CORE DALAM TUBE */}
                        <div className="rounded-xl border border-slate-200 p-4 bg-gradient-to-br from-slate-50 to-white relative overflow-hidden shadow-xs">
                            <div
                                className="absolute top-0 left-0 right-0 h-2"
                                style={{ backgroundColor: resultFromGlobal.coreColor.hex }}
                            />
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                <span className="font-semibold uppercase tracking-wider">Fiber Core</span>
                                <span className="text-[11px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold">
                                    Core ke-{resultFromGlobal.coreNumberInTube} dalam Tube
                                </span>
                            </div>

                            <div className="flex items-center gap-3 mt-3">
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${resultFromGlobal.coreColor.textClass} ${resultFromGlobal.coreColor.borderClass || ""}`}
                                    style={{ backgroundColor: resultFromGlobal.coreColor.hex }}
                                >
                                    {resultFromGlobal.coreNumberInTube}
                                </div>
                                <div>
                                    <div className="text-base font-bold text-slate-900">
                                        Warna {resultFromGlobal.coreColor.nameId}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        Standard: {resultFromGlobal.coreColor.nameEn} ({resultFromGlobal.coreColor.hex})
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ringkasan Satu Baris */}
                    <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between text-xs sm:text-sm text-teal-900 font-medium">
                        <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-teal-600 shrink-0" />
                            <span>
                                Rumus Lapangan: <strong>Core {resultFromGlobal.globalCore}</strong> terletak pada{" "}
                                <strong className="text-teal-700">Tube {resultFromGlobal.tubeNumber} ({resultFromGlobal.tubeColor.nameId})</strong>{" "}
                                dan helai ke-
                                <strong className="text-teal-700">{resultFromGlobal.coreNumberInTube} ({resultFromGlobal.coreColor.nameId})</strong>.
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* CONTENT MODE 2: REVERSE SELECTOR (PILIH TUBE & CORE) */}
            {calcMode === "BY_TUBE_CORE" && (
                <div className="mt-5 space-y-5">
                    {/* Pemilih Tube */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                            1. Pilih Tube (Warna Selongsong):
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
                            {TIA598_COLORS.map((color) => {
                                const isSelected = selectedTube === color.number;
                                return (
                                    <button
                                        key={`tube-${color.number}`}
                                        type="button"
                                        onClick={() => setSelectedTube(color.number)}
                                        className={`p-2 rounded-xl flex flex-col items-center justify-center text-center transition-all ${
                                            isSelected
                                                ? "ring-2 ring-teal-600 ring-offset-2 scale-102 shadow-sm"
                                                : "opacity-85 hover:opacity-100 hover:scale-101"
                                        }`}
                                        style={{ backgroundColor: color.hex }}
                                    >
                                        <span className={`text-xs font-bold ${color.textClass}`}>
                                            T-{color.number}
                                        </span>
                                        <span className={`text-[10px] leading-tight truncate w-full ${color.textClass}`}>
                                            {color.nameId}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Pemilih Core dalam Tube */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                            2. Pilih Core dalam Baki (Warna Serat):
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
                            {TIA598_COLORS.map((color) => {
                                const isSelected = selectedCoreInTube === color.number;
                                return (
                                    <button
                                        key={`core-${color.number}`}
                                        type="button"
                                        onClick={() => setSelectedCoreInTube(color.number)}
                                        className={`p-2 rounded-xl flex flex-col items-center justify-center text-center transition-all ${
                                            isSelected
                                                ? "ring-2 ring-teal-600 ring-offset-2 scale-102 shadow-sm"
                                                : "opacity-85 hover:opacity-100 hover:scale-101"
                                        }`}
                                        style={{ backgroundColor: color.hex }}
                                    >
                                        <span className={`text-xs font-bold ${color.textClass}`}>
                                            C-{color.number}
                                        </span>
                                        <span className={`text-[10px] leading-tight truncate w-full ${color.textClass}`}>
                                            {color.nameId}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* HASIL REVERSE LOOKUP */}
                    <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                        <div>
                            <div className="text-xs text-teal-400 font-semibold uppercase tracking-wider">
                                Hasil Identifikasi Nomor Core Global
                            </div>
                            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 text-white flex items-baseline gap-2">
                                Core {resultGlobalFromReverse}
                                <span className="text-xs font-normal text-slate-300">
                                    (Kabel Feeder / Distribusi Standar 12 Core/Tube)
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span
                                className="px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs"
                                style={{
                                    backgroundColor: getFiberColor(selectedTube).hex,
                                    color: getFiberColor(selectedTube).hex === "#F8FAFC" ? "#0F172A" : "#FFFFFF"
                                }}
                            >
                                Tube {selectedTube} ({getFiberColor(selectedTube).nameId})
                            </span>
                            <span className="text-slate-400">➔</span>
                            <span
                                className="px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs"
                                style={{
                                    backgroundColor: getFiberColor(selectedCoreInTube).hex,
                                    color: getFiberColor(selectedCoreInTube).hex === "#F8FAFC" ? "#0F172A" : "#FFFFFF"
                                }}
                            >
                                Core {selectedCoreInTube} ({getFiberColor(selectedCoreInTube).nameId})
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
