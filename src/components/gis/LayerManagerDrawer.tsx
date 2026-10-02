"use client";

import { useState } from "react";
import {
    Layers,
    X,
    Eye,
    EyeOff,
    Trash2,
    Plus,
    FileCode,
    Calendar,
    Search,
    AlertCircle,
    Check,
} from "lucide-react";
import { KmlLayer } from "@/lib/types/gis";

interface LayerManagerDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    layers: KmlLayer[];
    onToggleLayer: (layerId: string, isVisible: boolean) => void;
    onDeleteLayer: (layerId: string) => void;
    onOpenUpload: () => void;
}

export default function LayerManagerDrawer({
    isOpen,
    onClose,
    layers,
    onToggleLayer,
    onDeleteLayer,
    onOpenUpload,
}: LayerManagerDrawerProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    if (!isOpen) return null;

    const filteredLayers = layers.filter(
        (l) =>
            l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatBytes = (bytes: number) => {
        if (!bytes || bytes === 0) return "0 KB";
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const sizes = ["Bytes", "KB", "MB", "GB"];
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-synerix-border flex flex-col animate-in slide-in-from-right duration-250">
                {/* Header */}
                <div className="px-5 py-4 border-b border-synerix-border flex items-center justify-between bg-slate-50/90">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-synerix-text">Layer Manager GIS</h3>
                            <p className="text-xs text-synerix-subtext">
                                {layers.length} File Layer Terdaftar
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Toolbar & Search */}
                <div className="p-4 border-b border-synerix-border space-y-3 bg-white">
                    <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama layer atau file..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onOpenUpload();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Upload File KML/KMZ Baru</span>
                    </button>
                </div>

                {/* Layer List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredLayers.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <FileCode className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                            <h4 className="font-bold text-xs text-slate-700">Belum Ada Layer</h4>
                            <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                                Belum ada berkas KML/KMZ yang diunggah. Klik tombol upload di atas untuk menambahkan layer baru.
                            </p>
                        </div>
                    ) : (
                        filteredLayers.map((layer) => {
                            const isVisible = layer.is_visible !== false;
                            return (
                                <div
                                    key={layer.id}
                                    className={`p-3.5 rounded-xl border transition-all ${
                                        isVisible
                                            ? "bg-white border-slate-200 shadow-xs hover:border-teal-300"
                                            : "bg-slate-50/70 border-slate-200/60 opacity-60"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2.5 min-w-0">
                                            <span
                                                className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 border border-black/10 shadow-xs"
                                                style={{ backgroundColor: layer.color || "#10B981" }}
                                            />
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-xs text-slate-800 truncate">
                                                    {layer.name}
                                                </h4>
                                                <p className="text-[10px] text-slate-400 font-mono truncate">
                                                    {layer.filename} &bull; {formatBytes(layer.file_size_bytes)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Toggle Visibility Switch */}
                                        <button
                                            type="button"
                                            onClick={() => onToggleLayer(layer.id, !isVisible)}
                                            title={isVisible ? "Sembunyikan layer dari peta" : "Tampilkan layer di peta"}
                                            className={`p-1.5 rounded-lg border transition-colors ${
                                                isVisible
                                                    ? "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
                                                    : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
                                            }`}
                                        >
                                            {isVisible ? (
                                                <Eye className="h-4 w-4" />
                                            ) : (
                                                <EyeOff className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Stats badge */}
                                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                                {layer.total_nodes} Node
                                            </span>
                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                                {layer.total_lines} Jalur Kabel
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirm(`Hapus layer "${layer.name}" beserta seluruh titik perangkat dan kabelnya?`)) {
                                                    onDeleteLayer(layer.id);
                                                }
                                            }}
                                            className="text-red-500 hover:text-red-700 font-semibold inline-flex items-center gap-1 hover:underline"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            <span>Hapus</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-synerix-border bg-slate-50 text-center">
                    <p className="text-[10px] text-slate-400">
                        Perubahan visibilitas layer langsung direfleksikan di peta tanpa reload halaman.
                    </p>
                </div>
            </div>
        </div>
    );
}
