"use client";

import { useState } from "react";
import { Layers, Map as MapIcon, Globe, Moon, Mountain } from "lucide-react";
import { BasemapType } from "@/lib/types/gis";

interface BasemapSwitcherProps {
    currentBasemap: BasemapType;
    onChange: (basemap: BasemapType) => void;
}

export const BASEMAP_CONFIGS: Record<
    BasemapType,
    { name: string; url: string; attribution: string; icon: any; maxZoom: number }
> = {
    OSM: {
        name: "Jalan Standar",
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        icon: MapIcon,
        maxZoom: 19,
    },
    ESRI_SATELLITE: {
        name: "Citra Satelit",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP",
        icon: Globe,
        maxZoom: 19,
    },
    CARTO_DARK: {
        name: "Mode Gelap",
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        icon: Moon,
        maxZoom: 20,
    },
    OPENTOPO: {
        name: "Topografi Kontur",
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
        icon: Mountain,
        maxZoom: 17,
    },
};

export default function BasemapSwitcher({
    currentBasemap,
    onChange,
}: BasemapSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-synerix-border shadow-md hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Ganti Peta Dasar (Satelit / Gelap / OSM)"
            >
                <Layers className="h-4 w-4 text-teal-600" />
                <span className="hidden sm:inline">
                    {BASEMAP_CONFIGS[currentBasemap]?.name || "Peta Dasar"}
                </span>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop penutup saat klik di luar */}
                    <div
                        className="fixed inset-0 z-20"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-synerix-border p-2 z-30 space-y-1 animate-in fade-in duration-150">
                        <span className="block px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Pilihan Peta Dasar
                        </span>
                        {(Object.keys(BASEMAP_CONFIGS) as BasemapType[]).map((key) => {
                            const config = BASEMAP_CONFIGS[key];
                            const Icon = config.icon;
                            const isSelected = currentBasemap === key;

                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                        onChange(key);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                                        isSelected
                                            ? "bg-teal-50 text-teal-800 border border-teal-200"
                                            : "text-slate-700 hover:bg-slate-100"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-teal-600" : "text-slate-500"}`} />
                                        <span>{config.name}</span>
                                    </div>
                                    {isSelected && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
