"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import {
    UploadCloud,
    FileCode,
    CheckCircle2,
    AlertCircle,
    X,
    Loader2,
    Layers,
    Share2,
    Database,
    Sparkles,
} from "lucide-react";
import { parseKmlKmzFile } from "@/lib/gis/kmlParser";
import { bulkIngestGisData, IngestProgress } from "@/lib/gis/gisIngestService";
import { ParsedGisPayload } from "@/lib/types/gis";
import { createClient } from "@/lib/supabase/client";
import { formatDistance } from "@/lib/ftth/distance";

interface KmlUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function KmlUploadModal({ isOpen, onClose, onSuccess }: KmlUploadModalProps) {
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [ingesting, setIngesting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [parsedData, setParsedData] = useState<ParsedGisPayload | null>(null);
    const [customLayerName, setCustomLayerName] = useState("");
    const [customColor, setCustomColor] = useState("#10B981");
    const [progress, setProgress] = useState<IngestProgress | null>(null);

    if (!isOpen) return null;

    const handleFileProcess = async (file: File) => {
        setErrorMsg(null);
        setParsing(true);
        setParsedData(null);

        try {
            const fileName = file.name.toLowerCase();
            if (!fileName.endsWith(".kml") && !fileName.endsWith(".kmz")) {
                throw new Error("Format file tidak didukung. Harap upload file berekstensi .kml atau .kmz");
            }

            const result = await parseKmlKmzFile(file);
            setParsedData(result);
            setCustomLayerName(result.layerMeta.name);
            setCustomColor(result.layerMeta.color || "#10B981");
        } catch (err: any) {
            console.error("Gagal memproses file KML:", err);
            setErrorMsg(err?.message || "Gagal memproses file KML/KMZ.");
        } finally {
            setParsing(false);
        }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileProcess(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileProcess(e.target.files[0]);
        }
    };

    const handleSaveToDatabase = async () => {
        if (!parsedData) return;
        setIngesting(true);
        setErrorMsg(null);

        // Update layer name & color sesuai input teknisi
        const updatedPayload: ParsedGisPayload = {
            ...parsedData,
            layerMeta: {
                ...parsedData.layerMeta,
                name: customLayerName.trim() || parsedData.layerMeta.name,
                color: customColor,
            },
        };

        try {
            await bulkIngestGisData(supabase, updatedPayload, (prog) => {
                setProgress(prog);
            });

            setTimeout(() => {
                onSuccess();
                handleReset();
                onClose();
            }, 800);
        } catch (err: any) {
            console.error("Ingest error:", err);
            setErrorMsg(err?.message || "Gagal menyimpan ke database.");
            setIngesting(false);
        }
    };

    const handleReset = () => {
        setParsedData(null);
        setCustomLayerName("");
        setProgress(null);
        setErrorMsg(null);
        setIngesting(false);
        setParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Hitung ringkasan node berdasarkan tipe
    const nodeCounts = parsedData?.nodes.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>) || {};

    const totalCableLength = parsedData?.lines.reduce((sum, l) => sum + (l.length_meters || 0), 0) || 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-synerix-border w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-5 py-4 border-b border-synerix-border flex items-center justify-between bg-slate-50/80">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 border border-teal-500/20">
                            <UploadCloud className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-synerix-text">Import Infrastruktur KML/KMZ</h3>
                            <p className="text-xs text-synerix-subtext">Client-Side Parser & Bulk Ingest PostGIS</p>
                        </div>
                    </div>
                    {!ingesting && (
                        <button
                            type="button"
                            onClick={() => {
                                handleReset();
                                onClose();
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* Body Content */}
                <div className="p-5 overflow-y-auto space-y-4 text-xs">
                    {errorMsg && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2 animate-in fade-in">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {!parsedData && (
                        <div>
                            {/* Drag and Drop Box */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                                    isDragging
                                        ? "border-teal-500 bg-teal-50/50 scale-[0.99]"
                                        : "border-slate-300 hover:border-teal-500 hover:bg-slate-50/60"
                                }`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".kml,.kmz"
                                    className="hidden"
                                />

                                {parsing ? (
                                    <div className="py-4 flex flex-col items-center gap-2 text-teal-700">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                        <span className="font-semibold text-xs">Membedah file KML/KMZ...</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="p-3 rounded-full bg-teal-50 text-teal-600 border border-teal-100">
                                            <FileCode className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">
                                                Tarik & Letakkan file .kml atau .kmz di sini
                                            </p>
                                            <p className="text-slate-500 text-[11px] mt-0.5">
                                                atau klik untuk memilih file dari komputer / HP Anda
                                            </p>
                                        </div>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                                            Maksimum 50 MB &bull; Client-Side Instant Parsing
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Preview Parsed Data */}
                    {parsedData && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    <span className="font-semibold text-emerald-800">
                                        File Berhasil Diproses di Browser
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    disabled={ingesting}
                                    className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium"
                                >
                                    Ganti File
                                </button>
                            </div>

                            {/* Nama Layer & Pilihan Warna */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Nama Layer Infrastruktur
                                    </label>
                                    <input
                                        type="text"
                                        value={customLayerName}
                                        onChange={(e) => setCustomLayerName(e.target.value)}
                                        disabled={ingesting}
                                        placeholder="Contoh: Feeder Mojoroto Induk"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-semibold text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Warna Tema Layer
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={customColor}
                                            onChange={(e) => setCustomColor(e.target.value)}
                                            disabled={ingesting}
                                            className="h-8 w-12 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                                        />
                                        <span className="font-mono text-[11px] text-slate-600 uppercase">
                                            {customColor}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Ringkasan Temuan GIS */}
                            <div className="p-3.5 bg-slate-50 border border-synerix-border rounded-xl space-y-2.5">
                                <h4 className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                                    Statistik Entitas Spasial Terdeteksi:
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                                        <span className="text-slate-500 block">Total Titik Perangkat</span>
                                        <span className="text-base font-bold text-teal-700">
                                            {parsedData.nodes.length} Titik
                                        </span>
                                    </div>
                                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                                        <span className="text-slate-500 block">Jalur Kabel Fiber</span>
                                        <span className="text-base font-bold text-sky-700">
                                            {parsedData.lines.length} Jalur ({formatDistance(totalCableLength)})
                                        </span>
                                    </div>
                                </div>

                                {/* Rincian Tipe Node */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {Object.entries(nodeCounts).map(([type, count]) => (
                                        <span
                                            key={type}
                                            className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold flex items-center gap-1"
                                        >
                                            <span className="font-bold text-teal-700">{count}</span> {type}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Progress Bar saat Menyimpan */}
                            {ingesting && progress && (
                                <div className="space-y-1.5 p-3 bg-teal-50/70 border border-teal-200 rounded-xl">
                                    <div className="flex justify-between items-center text-[11px] font-semibold text-teal-900">
                                        <span className="flex items-center gap-1.5">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                                            {progress.message}
                                        </span>
                                        <span className="font-mono">{progress.percent}%</span>
                                    </div>
                                    <div className="w-full bg-teal-200/50 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress.percent}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-3.5 border-t border-synerix-border bg-slate-50 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={() => {
                            handleReset();
                            onClose();
                        }}
                        disabled={ingesting}
                        className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                        Batal
                    </button>

                    {parsedData && (
                        <button
                            type="button"
                            onClick={handleSaveToDatabase}
                            disabled={ingesting}
                            className="px-5 py-2 rounded-xl bg-teal-700 text-white font-semibold hover:bg-teal-800 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            {ingesting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Menyimpan ke Supabase...</span>
                                </>
                            ) : (
                                <>
                                    <Database className="h-4 w-4" />
                                    <span>Simpan ke Database</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
