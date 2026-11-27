"use client";

import { useState } from "react";
import {
    GitFork,
    Calculator,
    Info,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Zap,
    HelpCircle,
    ArrowRight,
    Radio
} from "lucide-react";

interface SplitterSpec {
    ratio: string;
    theoreticalLoss: number; // dB
    typicalMinLoss: number; // dB
    typicalAvgLoss: number; // dB
    typicalMaxLoss: number; // dB
    portCount: number;
    splitPercentage: string;
    typicalUsage: string;
    colorBadge: string;
}

export const SPLITTER_SPECS: SplitterSpec[] = [
    {
        ratio: "1:2",
        theoreticalLoss: 3.01,
        typicalMinLoss: 3.2,
        typicalAvgLoss: 3.5,
        typicalMaxLoss: 3.8,
        portCount: 2,
        splitPercentage: "50% / 50%",
        typicalUsage: "Branching Feeder / Backbone, ODC Tier-1, atau splitter rasio bertingkat",
        colorBadge: "bg-blue-100 text-blue-800 border-blue-200"
    },
    {
        ratio: "1:4",
        theoreticalLoss: 6.02,
        typicalMinLoss: 6.8,
        typicalAvgLoss: 7.2,
        typicalMaxLoss: 7.5,
        portCount: 4,
        splitPercentage: "25% per port",
        typicalUsage: "ODC distribusi mikro, cluster ruko / perumahan kecil, first-stage splitting",
        colorBadge: "bg-cyan-100 text-cyan-800 border-cyan-200"
    },
    {
        ratio: "1:8",
        theoreticalLoss: 9.03,
        typicalMinLoss: 10.0,
        typicalAvgLoss: 10.5,
        typicalMaxLoss: 10.8,
        portCount: 8,
        splitPercentage: "12.5% per port",
        typicalUsage: "Standar tiang utama ODP Pole & Pedestal FTTH paling umum di lapangan",
        colorBadge: "bg-teal-100 text-teal-800 border-teal-200"
    },
    {
        ratio: "1:16",
        theoreticalLoss: 12.04,
        typicalMinLoss: 13.4,
        typicalAvgLoss: 13.8,
        typicalMaxLoss: 14.2,
        portCount: 16,
        splitPercentage: "6.25% per port",
        typicalUsage: "ODP High Density, area padat penduduk / apartemen, direct distribution ODC",
        colorBadge: "bg-emerald-100 text-emerald-800 border-emerald-200"
    },
    {
        ratio: "1:32",
        theoreticalLoss: 15.05,
        typicalMinLoss: 16.5,
        typicalAvgLoss: 17.0,
        typicalMaxLoss: 17.5,
        portCount: 32,
        splitPercentage: "3.125% per port",
        typicalUsage: "ODC terpusat (Centralized Splitting PON) atau cluster gedung bertingkat",
        colorBadge: "bg-purple-100 text-purple-800 border-purple-200"
    },
    {
        ratio: "1:64",
        theoreticalLoss: 18.06,
        typicalMinLoss: 19.8,
        typicalAvgLoss: 20.5,
        typicalMaxLoss: 21.5,
        portCount: 64,
        splitPercentage: "1.56% per port",
        typicalUsage: "Arsitektur GPON Class C+ single-stage distribusi kapasitas masif",
        colorBadge: "bg-slate-100 text-slate-800 border-slate-200"
    }
];

export default function SplitterLossReference() {
    // State Kalkulator Simulasi
    const [selectedRatio, setSelectedRatio] = useState<string>("1:8");
    const [inputPower, setInputPower] = useState<number>(-12.0); // dBm input di ODP/ODC
    const [connectorLoss, setConnectorLoss] = useState<number>(0.5); // adapter SC/APC
    const [dropCableLengthMeters, setDropCableLengthMeters] = useState<number>(150); // meter dropcore

    const activeSpec = SPLITTER_SPECS.find((s) => s.ratio === selectedRatio) || SPLITTER_SPECS[2];

    // Estimasi redaman kabel drop (~0.35 dB per km pada 1310nm / 0.25 pada 1490nm -> kita gunakan 0.3 dB/km)
    const cableLoss = (dropCableLengthMeters / 1000) * 0.3;

    // Output Power = Input Power - Splitter Loss - Connector Loss - Drop Cable Loss
    const estimatedOutputMin = inputPower - activeSpec.typicalMinLoss - connectorLoss - cableLoss;
    const estimatedOutputAvg = inputPower - activeSpec.typicalAvgLoss - connectorLoss - cableLoss;
    const estimatedOutputMax = inputPower - activeSpec.typicalMaxLoss - connectorLoss - cableLoss;

    // Evaluasi Status Kelayakan ONT (Target: -15 dBm s/d -25 dBm)
    const getOntStatus = (val: number) => {
        if (val > -8) {
            return {
                label: "OVERPOWER (BAHAYA)",
                desc: "Sinyal terlalu kuat, berisiko merusak receiver optik ONT. Gunakan attenuator.",
                color: "text-purple-700 bg-purple-50 border-purple-200",
                badgeBg: "bg-purple-600 text-white",
                icon: AlertTriangle
            };
        }
        if (val >= -22) {
            return {
                label: "SANGAT OPTIMAL",
                desc: "Kualitas redaman sangat ideal untuk koneksi GPON gigabit dan stabil tanpa drop.",
                color: "text-emerald-700 bg-emerald-50 border-emerald-200",
                badgeBg: "bg-emerald-600 text-white",
                icon: CheckCircle2
            };
        }
        if (val >= -25) {
            return {
                label: "NORMAL & LAYAK",
                desc: "Memenuhi standar baku ISP Asterix/Fibermaxs/Digimaxs (Rentang operasional aman).",
                color: "text-teal-700 bg-teal-50 border-teal-200",
                badgeBg: "bg-teal-600 text-white",
                icon: CheckCircle2
            };
        }
        if (val >= -27) {
            return {
                label: "WARNING (MARGIN TIPIS)",
                desc: "Mendekati batas sensitivitas ONT. Rentan RFO/LOS jika kabel drop tertekuk (bending).",
                color: "text-amber-700 bg-amber-50 border-amber-200",
                badgeBg: "bg-amber-600 text-white",
                icon: AlertTriangle
            };
        }
        return {
            label: "CRITICAL / DROP",
            desc: "Redaman melebihi batas sensitivitas RX ONT (-27 s/d -28 dBm). Pasti terjadi packet loss atau LOS merah.",
            color: "text-red-700 bg-red-50 border-red-200",
            badgeBg: "bg-red-600 text-white",
            icon: XCircle
        };
    };

    const statusAvg = getOntStatus(estimatedOutputAvg);
    const StatusIcon = statusAvg.icon;

    return (
        <div className="space-y-6">
            {/* Header Modul Splitter */}
            <div className="bg-white rounded-2xl border border-synerix-border shadow-sm p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                            <GitFork className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-synerix-text flex items-center gap-2">
                                Standar Redaman &amp; Loss Optical Splitter PLC
                            </h2>
                            <p className="text-xs text-synerix-subtext">
                                Nilai acuan matematis &amp; toleransi real lapangan untuk splitter 1:2, 1:4, 1:8, 1:16, hingga 1:32
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold">
                        <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                            PLC Splitter Standard
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                            ITU-T G.671
                        </span>
                    </div>
                </div>

                {/* TABEL ACUAN STANDAR SPLITTER (1:2, 1:4, 1:8, 1:16, 1:32, 1:64) */}
                <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                                <th className="py-3 px-3 sm:px-4 rounded-l-xl">Tipe Splitter</th>
                                <th className="py-3 px-3 sm:px-4">Rasio Output</th>
                                <th className="py-3 px-3 sm:px-4 text-center">Loss Teoretis</th>
                                <th className="py-3 px-3 sm:px-4 text-center bg-teal-50/60 text-teal-900">
                                    Loss Real (Rata-rata)
                                </th>
                                <th className="py-3 px-3 sm:px-4 text-center">Rentang Toleransi</th>
                                <th className="py-3 px-3 sm:px-4 rounded-r-xl">Aplikasi Lapangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {SPLITTER_SPECS.map((spec) => {
                                const isSelected = spec.ratio === selectedRatio;
                                return (
                                    <tr
                                        key={spec.ratio}
                                        onClick={() => setSelectedRatio(spec.ratio)}
                                        className={`transition-colors cursor-pointer hover:bg-slate-50/80 ${
                                            isSelected ? "bg-teal-50/50 font-medium" : ""
                                        }`}
                                    >
                                        <td className="py-3 px-3 sm:px-4">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border font-mono ${spec.colorBadge}`}
                                                >
                                                    {spec.ratio}
                                                </span>
                                                <span className="font-semibold text-slate-800">
                                                    {spec.portCount} Port
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 sm:px-4 text-slate-600 font-mono">
                                            {spec.splitPercentage}
                                        </td>
                                        <td className="py-3 px-3 sm:px-4 text-center font-mono font-bold text-slate-700">
                                            {spec.theoreticalLoss.toFixed(2)} dB
                                        </td>
                                        <td className="py-3 px-3 sm:px-4 text-center bg-teal-50/40">
                                            <span className="inline-block px-2.5 py-1 rounded-md bg-teal-700 text-white font-mono font-bold text-xs shadow-2xs">
                                                ~{spec.typicalAvgLoss.toFixed(1)} dB
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 sm:px-4 text-center font-mono text-slate-500">
                                            {spec.typicalMinLoss.toFixed(1)} – {spec.typicalMaxLoss.toFixed(1)} dB
                                        </td>
                                        <td className="py-3 px-3 sm:px-4 text-slate-600 max-w-xs text-[11px] leading-relaxed">
                                            {spec.typicalUsage}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footnote Rumus */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-teal-600 shrink-0" />
                        <span>
                            <strong>Rumus Teoretis:</strong> Loss = 10 × log₁₀(N) dB. Nilai real lapangan bertambah ~0.2 s/d 0.8 dB karena excess loss &amp; fabrikasi internal PLC.
                        </span>
                    </div>
                    <span className="font-semibold text-slate-600 shrink-0">Baku Mutu ISP FTTH</span>
                </div>
            </div>

            {/* SIMULATOR & KALKULATOR ESTIMASI REDAMAN DI ODP / ONT */}
            <div className="bg-white rounded-2xl border border-synerix-border shadow-sm p-4 sm:p-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                        <Calculator className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-synerix-text flex items-center gap-2">
                            Simulator Redaman Lapangan (Input &rarr; Output ONT)
                        </h3>
                        <p className="text-xs text-synerix-subtext">
                            Hitung estimasi redaman akhir di rumah pelanggan berdasarkan splitter, konektor, dan panjang kabel drop
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
                    {/* Panel Input Parameter (Kiri - 7 Kolom) */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* 1. Pilih Splitter */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-2">
                                1. Pilih Splitter Pasif:
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {SPLITTER_SPECS.map((s) => (
                                    <button
                                        key={s.ratio}
                                        type="button"
                                        onClick={() => setSelectedRatio(s.ratio)}
                                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center border ${
                                            selectedRatio === s.ratio
                                                ? "bg-teal-700 text-white border-teal-700 shadow-sm ring-2 ring-teal-600/30"
                                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                        }`}
                                    >
                                        <div>{s.ratio}</div>
                                        <div className={`text-[10px] font-normal mt-0.5 ${selectedRatio === s.ratio ? "text-teal-100" : "text-slate-400"}`}>
                                            ~{s.typicalAvgLoss} dB
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. Redaman Input Feeder (dBm) */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-slate-700">
                                    2. Redaman Input Masuk (Feeder / ODC / Port OLT):
                                </label>
                                <span className="text-xs font-bold text-teal-800 font-mono">
                                    {inputPower.toFixed(1)} dBm
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={inputPower}
                                    onChange={(e) => setInputPower(parseFloat(e.target.value) || 0)}
                                    className="w-32 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="-12.0"
                                />
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => setInputPower(-8.0)}
                                        className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-600"
                                    >
                                        ODC Feeder (-8 dBm)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setInputPower(-12.0)}
                                        className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-600"
                                    >
                                        In ODP (-12 dBm)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setInputPower(-15.0)}
                                        className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-600"
                                    >
                                        In ODP Jauh (-15 dBm)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 3. Parameter Konektor & Kabel Drop */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    3. Loss Konektor &amp; Adapter (dB):
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="3"
                                        value={connectorLoss}
                                        onChange={(e) => setConnectorLoss(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    SC/APC hijau tipikal: 0.3 – 0.5 dB
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    4. Estimasi Panjang Drop Core (Meter):
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        step="25"
                                        min="10"
                                        max="1000"
                                        value={dropCableLengthMeters}
                                        onChange={(e) => setDropCableLengthMeters(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Loss kabel drop: ~0.3 dB / 1000m (± {cableLoss.toFixed(2)} dB)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Panel Hasil Kalkulasi (Kanan - 5 Kolom) */}
                    <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

                        <div>
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                                <span className="font-semibold uppercase tracking-wider">Hasil Estimasi Redaman</span>
                                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-[11px] text-teal-300">
                                    Splitter {selectedRatio}
                                </span>
                            </div>

                            {/* Angka Utama Output */}
                            <div className="mt-2">
                                <div className="text-[11px] text-slate-400">Estimasi Redaman di Rumah Pelanggan (ONT):</div>
                                <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white mt-1">
                                    {estimatedOutputAvg.toFixed(2)}{" "}
                                    <span className="text-sm font-semibold text-slate-300">dBm</span>
                                </div>
                                <div className="text-xs text-slate-400 font-mono mt-1">
                                    Rentang: {estimatedOutputMax.toFixed(2)} s/d {estimatedOutputMin.toFixed(2)} dBm
                                </div>
                            </div>

                            {/* Status Kelayakan Card */}
                            <div className={`mt-4 p-3 rounded-xl border flex items-start gap-3 ${statusAvg.color}`}>
                                <StatusIcon className="h-5 w-5 shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                                        <span>{statusAvg.label}</span>
                                    </div>
                                    <div className="text-[11px] mt-0.5 leading-relaxed opacity-90">
                                        {statusAvg.desc}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Breakdown Rincian Nilai */}
                        <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] space-y-1 font-mono text-slate-300">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Power Masuk In:</span>
                                <span>{inputPower.toFixed(2)} dBm</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Loss Splitter {selectedRatio}:</span>
                                <span className="text-amber-400">- {activeSpec.typicalAvgLoss.toFixed(2)} dB</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Loss Konektor &amp; Adapter:</span>
                                <span className="text-amber-400">- {connectorLoss.toFixed(2)} dB</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Loss Kabel Drop ({dropCableLengthMeters}m):</span>
                                <span className="text-amber-400">- {cableLoss.toFixed(2)} dB</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KARTU PANDUAN CEPAT SPESIFIKASI SPLITTER LAPANGAN */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {SPLITTER_SPECS.slice(0, 4).map((spec) => (
                    <div
                        key={`card-${spec.ratio}`}
                        className="bg-white rounded-xl border border-synerix-border p-4 shadow-2xs hover:shadow-sm transition-all"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border font-mono ${spec.colorBadge}`}>
                                {spec.ratio}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-800">
                                ~{spec.typicalAvgLoss} dB
                            </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">
                            Splitter 1:{spec.portCount} ({spec.splitPercentage})
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            {spec.typicalUsage}
                        </p>
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>Max: {spec.typicalMaxLoss} dB</span>
                            <span>Teori: {spec.theoreticalLoss.toFixed(2)} dB</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* PANDUAN SOP TEKNISI FTTH */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-teal-600" />
                    SOP &amp; Standar Praktik Baik Pemasangan Splitter
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-slate-600">
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                        <strong className="text-slate-900 block mb-1">1. Bersihkan Konektor Ferrule</strong>
                        Gunakan optical connector cleaner atau alkohol isopropil 99% sebelum menancapkan patchcord ke adapter splitter untuk mencegah loss kotoran hingga 2 dB.
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                        <strong className="text-slate-900 block mb-1">2. Perhatikan Bending Radius</strong>
                        Jangan menekuk kabel pigtail/tube splitter melebihi radius tekuk minimum (30 mm) agar tidak timbul macro-bending loss mendadak.
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                        <strong className="text-slate-900 block mb-1">3. Standar Redaman ONT Ideal</strong>
                        Target pasang baru pelanggan Asterix/Fibermaxs/Digimaxs adalah <strong>-18 dBm s/d -23 dBm</strong>. Jika di atas -25 dBm, telusuri splice joint box dan ODC.
                    </div>
                </div>
            </div>
        </div>
    );
}
