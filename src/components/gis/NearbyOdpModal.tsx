"use client";

import { useState } from "react";
import { Compass, X, MapPin, Navigation, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { NetworkNode } from "@/lib/types/gis";
import { calculateHaversineDistance, formatDistance, getGoogleMapsUrl } from "@/lib/ftth/distance";

interface NearbyOdpModalProps {
    isOpen: boolean;
    onClose: () => void;
    userLocation: { lat: number; lng: number } | null;
    nodes: NetworkNode[];
    onSelectOdp: (node: NetworkNode) => void;
    onRequestGps: () => void;
}

export default function NearbyOdpModal({
    isOpen,
    onClose,
    userLocation,
    nodes,
    onSelectOdp,
    onRequestGps,
}: NearbyOdpModalProps) {
    if (!isOpen) return null;

    // Filter seluruh ODP dan urutkan berdasarkan jarak dari lokasi teknisi
    const odpNodes = nodes.filter((n) => n.type === "ODP");

    const sortedOdps = userLocation
        ? odpNodes
              .map((odp) => {
                  const distanceMeters = calculateHaversineDistance(
                      userLocation.lat,
                      userLocation.lng,
                      odp.latitude,
                      odp.longitude
                  );
                  return {
                      ...odp,
                      distanceMeters,
                  };
              })
              .sort((a, b) => a.distanceMeters - b.distanceMeters)
              .slice(0, 10)
        : [];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-synerix-border w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="px-5 py-4 border-b border-synerix-border flex items-center justify-between bg-slate-50/90">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                            <Compass className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-synerix-text">Cari ODP Terdekat</h3>
                            <p className="text-xs text-synerix-subtext">Radar Deteksi Aset Berbasis GPS</p>
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

                {/* Content */}
                <div className="p-4 overflow-y-auto space-y-3">
                    {!userLocation ? (
                        <div className="text-center py-8 px-4 space-y-3">
                            <Navigation className="h-10 w-10 text-teal-600 mx-auto animate-pulse" />
                            <div>
                                <h4 className="font-bold text-sm text-slate-800">GPS Belum Aktif</h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    Aktifkan sensor lokasi perangkat Anda untuk menemukan ODP terdekat dalam radius pemasangan.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onRequestGps}
                                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition-colors shadow-sm"
                            >
                                Aktifkan Lokasi GPS Saya
                            </button>
                        </div>
                    ) : sortedOdps.length === 0 ? (
                        <div className="text-center py-8 px-4 text-slate-500 text-xs">
                            Tidak ditemukan ODP di sekitar lokasi Anda saat ini.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                                <span>Posisi Anda Terkunci</span>
                                <span className="font-semibold text-teal-700">
                                    {sortedOdps.length} ODP Terdekat Ditemukan
                                </span>
                            </div>

                            {sortedOdps.map((odp) => {
                                const isSafeDropcore = odp.distanceMeters <= 150;
                                const idlePorts = (odp.capacity || 8) - (odp.used_ports || 0);

                                return (
                                    <div
                                        key={odp.id}
                                        className="p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 shadow-2xs hover:shadow-xs transition-all space-y-2 group"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                                        ODP
                                                    </span>
                                                    <h4 className="font-bold text-xs text-slate-800 group-hover:text-teal-800">
                                                        {odp.name}
                                                    </h4>
                                                </div>
                                                {odp.pole_number && (
                                                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                                                        Tiang: {odp.pole_number}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-right">
                                                <span
                                                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg inline-block ${
                                                        isSafeDropcore
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                            : "bg-amber-50 text-amber-700 border border-amber-200"
                                                    }`}
                                                >
                                                    {formatDistance(odp.distanceMeters)}
                                                </span>
                                                <span className="text-[9px] text-slate-400 block mt-0.5">
                                                    {isSafeDropcore ? "Aman Dropcore" : ">150m (Jauh)"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100">
                                            <span className="text-slate-500">
                                                Port Kosong:{" "}
                                                <strong className="text-teal-700 font-bold">
                                                    {idlePorts} dari {odp.capacity || 8}
                                                </strong>
                                            </span>

                                            <div className="flex items-center gap-1.5">
                                                <a
                                                    href={getGoogleMapsUrl(odp.latitude, odp.longitude)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-2.5 py-1 rounded-lg text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold"
                                                >
                                                    Rute
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onSelectOdp(odp);
                                                        onClose();
                                                    }}
                                                    className="px-2.5 py-1 rounded-lg text-[10px] bg-teal-700 hover:bg-teal-800 text-white font-semibold flex items-center gap-1 transition-colors"
                                                >
                                                    <span>Lihat Peta</span>
                                                    <ArrowRight className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
