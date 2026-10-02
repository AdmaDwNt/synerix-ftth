"use client";

import { DismantleStatus } from "@/lib/types/dismantle";
import {
    Filter,
    Search,
    Navigation,
    Clock,
    CheckCircle2,
    XCircle,
    Layers,
    Compass
} from "lucide-react";

interface DismantleClusterFilterProps {
    clusters: string[];
    selectedCluster: string;
    onSelectCluster: (cluster: string) => void;
    parentOdps: string[];
    selectedOdp: string;
    onSelectOdp: (odp: string) => void;
    selectedStatus: DismantleStatus | "ALL";
    onSelectStatus: (status: DismantleStatus | "ALL") => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    onGetLiveLocation: () => void;
    locationActive: boolean;
    counts: {
        all: number;
        queue: number;
        inProgress: number;
        completed: number;
        failed: number;
    };
}

export default function DismantleClusterFilter({
    clusters,
    selectedCluster,
    onSelectCluster,
    parentOdps,
    selectedOdp,
    onSelectOdp,
    selectedStatus,
    onSelectStatus,
    searchQuery,
    onSearchChange,
    onGetLiveLocation,
    locationActive,
    counts,
}: DismantleClusterFilterProps) {
    return (
        <div className="bg-white rounded-2xl border border-synerix-border p-4 sm:p-5 shadow-xs space-y-4">
            {/* Baris 1: Search & Tombol GPS Proximity */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative w-full sm:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari nama pelanggan, ID, alamat, atau SN..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                </div>

                {/* Tombol Urutkan Jarak GPS Terdekat */}
                <button
                    type="button"
                    onClick={onGetLiveLocation}
                    className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 shrink-0 w-full sm:w-auto shadow-xs ${
                        locationActive
                            ? "bg-teal-700 text-white shadow-teal-700/20"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                >
                    <Compass className={`h-4 w-4 ${locationActive ? "animate-spin text-teal-300" : ""}`} />
                    <span>{locationActive ? "Urut Jarak GPS Aktif" : "Urut Terdekat dari GPS"}</span>
                </button>
            </div>

            {/* Baris 2: Dropdown Filter Cluster Area & Parent ODP */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                <div className="w-full sm:w-1/2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                        <Filter className="h-3 w-3 text-teal-600" /> Filter Area / Cluster:
                    </label>
                    <select
                        value={selectedCluster}
                        onChange={(e) => onSelectCluster(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="ALL">Semua Cluster / Wilayah</option>
                        {clusters.map((c) => (
                            <option key={c} value={c}>
                                Cluster: {c}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="w-full sm:w-1/2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                        <Layers className="h-3 w-3 text-teal-600" /> Filter Parent ODP:
                    </label>
                    <select
                        value={selectedOdp}
                        onChange={(e) => onSelectOdp(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="ALL">Semua ODP</option>
                        {parentOdps.map((odp) => (
                            <option key={odp} value={odp}>
                                {odp}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Baris 3: Status Pills Toggle */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                    type="button"
                    onClick={() => onSelectStatus("ALL")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                        selectedStatus === "ALL"
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    Semua ({counts.all})
                </button>

                <button
                    type="button"
                    onClick={() => onSelectStatus("QUEUE")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                        selectedStatus === "QUEUE"
                            ? "bg-red-600 text-white shadow-xs"
                            : "bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                >
                    <Clock className="h-3 w-3" />
                    Antrean ({counts.queue})
                </button>

                <button
                    type="button"
                    onClick={() => onSelectStatus("IN_PROGRESS")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                        selectedStatus === "IN_PROGRESS"
                            ? "bg-amber-500 text-white shadow-xs"
                            : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                    }`}
                >
                    <Navigation className="h-3 w-3" />
                    Menuju Lokasi ({counts.inProgress})
                </button>

                <button
                    type="button"
                    onClick={() => onSelectStatus("COMPLETED")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                        selectedStatus === "COMPLETED"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    }`}
                >
                    <CheckCircle2 className="h-3 w-3" />
                    Selesai ({counts.completed})
                </button>

                <button
                    type="button"
                    onClick={() => onSelectStatus("FAILED")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                        selectedStatus === "FAILED"
                            ? "bg-slate-700 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    <XCircle className="h-3 w-3" />
                    Gagal ({counts.failed})
                </button>
            </div>
        </div>
    );
}
