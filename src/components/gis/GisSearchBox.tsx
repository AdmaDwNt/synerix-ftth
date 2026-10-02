"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, MapPin, Navigation, ArrowRight, Compass } from "lucide-react";
import { NetworkNode, NetworkLine } from "@/lib/types/gis";
import { calculateHaversineDistance, formatDistance } from "@/lib/ftth/distance";

interface GisSearchBoxProps {
    nodes: NetworkNode[];
    lines: NetworkLine[];
    onSelectTarget: (target: { lat: number; lng: number; node?: NetworkNode; line?: NetworkLine }) => void;
    onFindNearbyOdp?: () => void;
}

export default function GisSearchBox({
    nodes,
    lines,
    onSelectTarget,
    onFindNearbyOdp,
}: GisSearchBoxProps) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const boxRef = useRef<HTMLDivElement>(null);

    // Filter hasil pencarian
    const searchResults = query.trim().length > 0
        ? [
              ...nodes
                  .filter(
                      (n) =>
                          n.name.toLowerCase().includes(query.toLowerCase()) ||
                          (n.pole_number && n.pole_number.toLowerCase().includes(query.toLowerCase())) ||
                          (n.address && n.address.toLowerCase().includes(query.toLowerCase()))
                  )
                  .map((n) => ({
                      id: n.id,
                      name: n.name,
                      subtext: n.pole_number ? `Tiang: ${n.pole_number}` : n.address || n.type,
                      type: n.type,
                      lat: n.latitude,
                      lng: n.longitude,
                      itemType: "NODE" as const,
                      node: n,
                  })),
              ...lines
                  .filter((l) => l.name.toLowerCase().includes(query.toLowerCase()))
                  .map((l) => ({
                      id: l.id,
                      name: l.name,
                      subtext: `Kabel ${l.cable_type} (${l.core_capacity} Core)`,
                      type: "KABEL",
                      lat: l.coordinates[0]?.[0] || 0,
                      lng: l.coordinates[0]?.[1] || 0,
                      itemType: "LINE" as const,
                      line: l,
                  })),
          ].slice(0, 8)
        : [];

    // Tutup dropdown jika klik di luar
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (result: (typeof searchResults)[0]) => {
        setQuery(result.name);
        setIsOpen(false);
        onSelectTarget({
            lat: result.lat,
            lng: result.lng,
            node: result.itemType === "NODE" ? result.node : undefined,
            line: result.itemType === "LINE" ? result.line : undefined,
        });
    };

    return (
        <div ref={boxRef} className="relative w-full sm:w-72">
            <div className="relative flex items-center">
                <Search className="h-4 w-4 absolute left-3 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Cari ODP, Tiang, Kabel..."
                    className="w-full pl-9 pr-8 py-2 bg-white/95 backdrop-blur-md border border-synerix-border rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery("");
                            setIsOpen(false);
                        }}
                        className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Dropdown Hasil Pencarian */}
            {isOpen && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-synerix-border overflow-hidden z-30 divide-y divide-slate-100 max-h-72 overflow-y-auto animate-in fade-in duration-150">
                    {searchResults.map((res) => (
                        <button
                            key={res.id}
                            type="button"
                            onClick={() => handleSelect(res)}
                            className="w-full px-3.5 py-2 text-left hover:bg-teal-50/70 transition-colors flex items-center justify-between group"
                        >
                            <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                            res.itemType === "LINE"
                                                ? "bg-sky-100 text-sky-800"
                                                : res.type === "ODC"
                                                ? "bg-amber-100 text-amber-800"
                                                : res.type === "TIANG"
                                                ? "bg-slate-100 text-slate-700"
                                                : "bg-emerald-100 text-emerald-800"
                                        }`}
                                    >
                                        {res.type}
                                    </span>
                                    <h4 className="font-bold text-xs text-slate-800 truncate group-hover:text-teal-800">
                                        {res.name}
                                    </h4>
                                </div>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                    {res.subtext}
                                </p>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
