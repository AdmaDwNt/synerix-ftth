"use client";

import { X, ExternalLink, Navigation, Trash2, Cpu, Activity, Share2, Edit3, ShieldAlert, AlertTriangle } from "lucide-react";
import { NetworkNode, NetworkLine } from "@/lib/types/gis";
import { getGoogleMapsUrl, getWazeUrl, formatDistance } from "@/lib/ftth/distance";

interface NodeDetailInspectorProps {
    selectedNode?: NetworkNode | null;
    selectedLine?: NetworkLine | null;
    onClose: () => void;
    onDeleteNode?: (id: string) => void;
    onEditNode?: (node: NetworkNode) => void;
    onEditLine?: (line: NetworkLine) => void;
}

export default function NodeDetailInspector({
    selectedNode,
    selectedLine,
    onClose,
    onDeleteNode,
    onEditNode,
    onEditLine,
}: NodeDetailInspectorProps) {
    if (!selectedNode && !selectedLine) return null;

    return (
        <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:left-auto sm:right-4 sm:bottom-4 sm:w-88 z-30 animate-in slide-in-from-bottom duration-250 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-synerix-border overflow-hidden p-3.5 sm:p-4 space-y-3 max-h-[75vh] sm:max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    {selectedNode ? (
                        <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                        selectedNode.type === "ODC"
                                            ? "bg-amber-100 text-amber-800"
                                            : selectedNode.type === "SERVER" || selectedNode.type === "POP"
                                            ? "bg-cyan-100 text-cyan-800"
                                            : selectedNode.type === "TIANG"
                                            ? "bg-slate-100 text-slate-800"
                                            : "bg-emerald-100 text-emerald-800"
                                    }`}
                                >
                                    {selectedNode.type}
                                </span>
                                {selectedNode.status && (
                                    <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                            selectedNode.status === "ACTIVE"
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                : selectedNode.status === "DAMAGED"
                                                ? "bg-red-50 text-red-700 border border-red-200"
                                                : "bg-amber-50 text-amber-700 border border-amber-200"
                                        }`}
                                    >
                                        {selectedNode.status}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-bold text-sm text-slate-900 mt-1">
                                {selectedNode.name}
                            </h3>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-sky-100 text-sky-800">
                                    {selectedLine?.cable_type || "KABEL FIBER"}
                                </span>
                                {selectedLine?.status && (
                                    <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                            selectedLine.status === "NORMAL"
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                : "bg-red-50 text-red-700 border border-red-200"
                                        }`}
                                    >
                                        {selectedLine.status}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-bold text-sm text-slate-900 mt-1">
                                {selectedLine?.name}
                            </h3>
                        </div>
                    )}

                    <div className="flex items-center gap-1">
                        {selectedNode && onEditNode && (
                            <button
                                type="button"
                                onClick={() => onEditNode(selectedNode)}
                                title="Edit data perangkat"
                                className="p-1.5 rounded-lg text-teal-700 hover:bg-teal-50 border border-teal-200 transition-colors"
                            >
                                <Edit3 className="h-4 w-4" />
                            </button>
                        )}
                        {selectedLine && onEditLine && (
                            <button
                                type="button"
                                onClick={() => onEditLine(selectedLine)}
                                title="Edit data jalur kabel"
                                className="p-1.5 rounded-lg text-sky-700 hover:bg-sky-50 border border-sky-200 transition-colors"
                            >
                                <Edit3 className="h-4 w-4" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Details */}
                {selectedNode && (
                    <div className="space-y-2 text-xs text-slate-600">
                        {selectedNode.pole_number && (
                            <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                <span className="text-slate-400">Kode Tiang:</span>
                                <span className="font-bold text-slate-800 font-mono">
                                    {selectedNode.pole_number}
                                </span>
                            </div>
                        )}

                        {selectedNode.address && (
                            <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                📍 {selectedNode.address}
                            </p>
                        )}

                        {selectedNode.notes && (
                            <p className="text-[10px] text-slate-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                                💬 {selectedNode.notes}
                            </p>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                                <span className="text-slate-400 block text-[10px]">Kapasitas Port</span>
                                <span className="font-bold text-slate-800">
                                    {selectedNode.capacity || 8} Core/Port
                                </span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                                <span className="text-slate-400 block text-[10px]">Port Terpakai</span>
                                <span className="font-bold text-teal-700">
                                    {selectedNode.used_ports || 0} Port
                                </span>
                            </div>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px]">
                            <span className="text-slate-400 block text-[10px]">Koordinat GPS</span>
                            <span className="font-mono text-slate-700">
                                {selectedNode.latitude.toFixed(6)}, {selectedNode.longitude.toFixed(6)}
                            </span>
                        </div>

                        {/* Navigation Actions */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <a
                                href={getGoogleMapsUrl(selectedNode.latitude, selectedNode.longitude)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-center font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <Navigation className="h-3.5 w-3.5" />
                                <span>Google Maps</span>
                            </a>
                            <a
                                href={getWazeUrl(selectedNode.latitude, selectedNode.longitude)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-center font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <Share2 className="h-3.5 w-3.5" />
                                <span>Waze Rute</span>
                            </a>
                        </div>
                    </div>
                )}

                {selectedLine && (
                    <div className="space-y-2 text-xs text-slate-600">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                                <span className="text-slate-400 block text-[10px]">Estimasi Panjang</span>
                                <span className="font-bold text-slate-800 font-mono">
                                    {selectedLine.length_meters ? formatDistance(selectedLine.length_meters) : "-"}
                                </span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                                <span className="text-slate-400 block text-[10px]">Kapasitas Core</span>
                                <span className="font-bold text-sky-700">
                                    {selectedLine.core_capacity || 24} Core
                                </span>
                            </div>
                        </div>

                        {selectedLine.installation_type && (
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] flex items-center justify-between">
                                <span className="text-slate-400 text-[10px]">Tipe Instalasi:</span>
                                <span className="font-bold text-slate-700">
                                    {selectedLine.installation_type}
                                </span>
                            </div>
                        )}

                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] flex items-center justify-between">
                            <span className="text-slate-400 text-[10px]">Warna Jalur:</span>
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="h-3 w-3 rounded-full border border-black/10"
                                    style={{ backgroundColor: selectedLine.color }}
                                />
                                <span className="font-mono text-[10px] uppercase font-bold text-slate-700">
                                    {selectedLine.color}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
