/**
 * ============================================================================
 * MODUL       : Panduan Wi-Fi & Modem ONT (Customer Education)
 * FILE        : src/components/noc/WifiGuideModal.tsx
 * DESKRIPSI   : Modal panduan praktis penanganan kendala Wi-Fi, reboot ONT,
 *               dan indikator LED perangkat pelanggan (Permanen, Non-Beta).
 * ============================================================================
 */

"use client";

import React, { useState } from "react";
import {
    Wifi,
    X,
    Info,
    RotateCcw,
    Radio,
    ShieldAlert,
    CheckCircle2,
    BookOpen,
} from "lucide-react";

interface WifiGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function WifiGuideModal({ isOpen, onClose }: WifiGuideModalProps) {
    const [selectedTab, setSelectedTab] = useState<"REBOOT" | "LED" | "TIPS">("REBOOT");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                {/* Header Modal */}
                <div className="bg-[#0f172a] text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-400">
                            <Wifi className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <h3 className="font-black text-base text-white">
                                Panduan Wi-Fi &amp; Modem ONT
                            </h3>
                            <p className="text-xs text-slate-300">
                                Edukasi pelanggan &amp; SOP penanganan kendala sambungan mandiri
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sub Tab Navigation */}
                <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
                    <button
                        type="button"
                        onClick={() => setSelectedTab("REBOOT")}
                        className={`flex-1 py-3 text-center border-b-2 transition-all ${
                            selectedTab === "REBOOT"
                                ? "border-teal-600 text-teal-800 bg-white"
                                : "border-transparent hover:text-slate-900"
                        }`}
                    >
                        SOP Reboot Adaptor
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTab("LED")}
                        className={`flex-1 py-3 text-center border-b-2 transition-all ${
                            selectedTab === "LED"
                                ? "border-teal-600 text-teal-800 bg-white"
                                : "border-transparent hover:text-slate-900"
                        }`}
                    >
                        Indikator Lampu LED
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTab("TIPS")}
                        className={`flex-1 py-3 text-center border-b-2 transition-all ${
                            selectedTab === "TIPS"
                                ? "border-teal-600 text-teal-800 bg-white"
                                : "border-transparent hover:text-slate-900"
                        }`}
                    >
                        Tips Optimal Wi-Fi
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
                    {selectedTab === "REBOOT" && (
                        <div className="space-y-3">
                            <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-start gap-3">
                                <RotateCcw className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-sm">Langkah Reboot Perangkat (3 Menit):</h4>
                                    <p className="mt-1">
                                        Reboot membantu merefresh alokasi cache IP dan sinkronisasi frekuensi optik pada perangkat ONT.
                                    </p>
                                </div>
                            </div>
                            <ol className="list-decimal list-inside space-y-2 pl-2">
                                <li>Cabut kabel adaptor listrik modem dari colokan listrik stopkontak (jangan mencabut kabel kuning fiber).</li>
                                <li>Tunggu selama <strong>3 menit</strong> penuh agar arus statis terlepas dari kapasitor modem.</li>
                                <li>Colokkan kembali adaptor listrik dan pastikan lampu power menyala hijau.</li>
                                <li>Tunggu hingga lampu <strong>PON menyala hijau solid tanpa kedip</strong> (proses sekitar 2-3 menit).</li>
                                <li>Sambungkan kembali HP/laptop ke Wi-Fi dan coba akses internet.</li>
                            </ol>
                        </div>
                    )}

                    {selectedTab === "LED" && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                                    <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        PON Hijau Solid
                                    </h4>
                                    <p className="text-[11px] text-emerald-800 mt-1">
                                        Sinyal optik normal dan teregistrasi ke OLT pusat. Internet siap digunakan.
                                    </p>
                                </div>

                                <div className="p-3 rounded-xl border border-rose-200 bg-rose-50">
                                    <h4 className="font-bold text-rose-900 flex items-center gap-1.5">
                                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                                        LOS Merah Berkedip
                                    </h4>
                                    <p className="text-[11px] text-rose-800 mt-1">
                                        Sinyal kabel fiber terputus atau redaman terlalu tinggi (&gt; -28 dBm). Butuh kunjungan teknisi.
                                    </p>
                                </div>

                                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50">
                                    <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                                        <Radio className="w-4 h-4 text-amber-600" />
                                        PON Berkedip Cepat
                                    </h4>
                                    <p className="text-[11px] text-amber-800 mt-1">
                                        Modem sedang mencoba handshake atau belum terdaftar di port OLT.
                                    </p>
                                </div>

                                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                                        <Info className="w-4 h-4 text-slate-600" />
                                        WLAN / Wi-Fi Mati
                                    </h4>
                                    <p className="text-[11px] text-slate-700 mt-1">
                                        Fungsi radio Wi-Fi nonaktif. Tekan tombol fisik WLAN di sisi modem selama 3 detik.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedTab === "TIPS" && (
                        <div className="space-y-2.5">
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <h4 className="font-bold text-slate-900 mb-1">1. Posisi Penempatan Modem</h4>
                                <p className="text-slate-600">
                                    Letakkan router di area terbuka minimal 1 meter dari lantai. Hindari meletakkan modem di balik tembok tebal, dekat microwave, cermin besar, atau di dalam lemari tertutup.
                                </p>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <h4 className="font-bold text-slate-900 mb-1">2. Perbedaan Frekuensi 2.4 GHz vs 5 GHz</h4>
                                <p className="text-slate-600">
                                    Gunakan frekuensi <strong>5 GHz</strong> jika dekat modem untuk kecepatan maksimal. Gunakan frekuensi <strong>2.4 GHz</strong> jika berada di kamar bersekat untuk jangkauan lebih jauh.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs shadow-2xs"
                    >
                        Tutup Panduan
                    </button>
                </div>
            </div>
        </div>
    );
}
