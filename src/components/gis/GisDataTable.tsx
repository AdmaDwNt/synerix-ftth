"use client";

import { useState, useMemo } from "react";
import {
    Table,
    Search,
    Filter,
    Edit3,
    Trash2,
    MapPin,
    Download,
    Eye,
    CheckSquare,
    Square,
    Network,
    Cpu,
} from "lucide-react";
import { NetworkNode, NetworkLine, NodeType } from "@/lib/types/gis";
import { formatDistance, getGoogleMapsUrl } from "@/lib/ftth/distance";

interface GisDataTableProps {
    nodes: NetworkNode[];
    lines: NetworkLine[];
    onSelectNodeOnMap: (node: NetworkNode) => void;
    onSelectLineOnMap: (line: NetworkLine) => void;
    onEditNode: (node: NetworkNode) => void;
    onEditLine: (line: NetworkLine) => void;
    onDeleteNode: (nodeId: string) => void;
    onBatchDeleteNodes?: (nodeIds: string[]) => void;
}

export default function GisDataTable({
    nodes,
    lines,
    onSelectNodeOnMap,
    onSelectLineOnMap,
    onEditNode,
    onEditLine,
    onDeleteNode,
    onBatchDeleteNodes,
}: GisDataTableProps) {
    const [tab, setTab] = useState<"NODES" | "LINES">("NODES");
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Filter nodes
    const filteredNodes = useMemo(() => {
        return nodes.filter((n) => {
            const matchesSearch =
                n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (n.pole_number && n.pole_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (n.address && n.address.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesType = typeFilter === "ALL" || n.type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [nodes, searchQuery, typeFilter]);

    // Filter lines
    const filteredLines = useMemo(() => {
        return lines.filter((l) => {
            const matchesSearch =
                l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.cable_type.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [lines, searchQuery]);

    // Toggle select all
    const handleToggleSelectAll = () => {
        if (selectedIds.size === filteredNodes.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredNodes.map((n) => n.id)));
        }
    };

    const handleToggleSelectOne = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Export CSV
    const handleExportCsv = () => {
        const headers = ["Nama", "Tipe", "Status", "Kapasitas", "Port Terpakai", "Kode Tiang", "Latitude", "Longitude", "Alamat"];
        const rows = filteredNodes.map((n) => [
            `"${n.name}"`,
            `"${n.type}"`,
            `"${n.status || "ACTIVE"}"`,
            n.capacity || 0,
            n.used_ports || 0,
            `"${n.pole_number || ""}"`,
            n.latitude,
            n.longitude,
            `"${n.address || ""}"`,
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `synerix_gis_nodes_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-2xl border border-synerix-border shadow-xs overflow-hidden flex flex-col space-y-3 p-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                        type="button"
                        onClick={() => {
                            setTab("NODES");
                            setSelectedIds(new Set());
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            tab === "NODES"
                                ? "bg-white text-teal-800 shadow-xs"
                                : "text-slate-600 hover:text-slate-800"
                        }`}
                    >
                        Titik Perangkat ({nodes.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setTab("LINES");
                            setSelectedIds(new Set());
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            tab === "LINES"
                                ? "bg-white text-teal-800 shadow-xs"
                                : "text-slate-600 hover:text-slate-800"
                        }`}
                    >
                        Jalur Kabel Fiber ({lines.length})
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-56">
                        <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama, tiang, alamat..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                        />
                    </div>

                    {tab === "NODES" && (
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                        >
                            <option value="ALL">Semua Tipe</option>
                            <option value="ODP">ODP</option>
                            <option value="ODC">ODC</option>
                            <option value="SERVER">Server</option>
                            <option value="POP">POP</option>
                            <option value="TIANG">Tiang</option>
                            <option value="DISMANTLE">Dismantle</option>
                        </select>
                    )}

                    {/* Export CSV Button */}
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                        title="Download Data CSV/Excel"
                    >
                        <Download className="h-3.5 w-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Batch Action Bar jika ada yang dipilih */}
            {selectedIds.size > 0 && tab === "NODES" && (
                <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
                    <span className="font-semibold text-teal-900">
                        {selectedIds.size} titik terpilih
                    </span>
                    {onBatchDeleteNodes && (
                        <button
                            type="button"
                            onClick={() => {
                                if (confirm(`Hapus ${selectedIds.size} titik node yang dipilih secara massal?`)) {
                                    onBatchDeleteNodes(Array.from(selectedIds));
                                    setSelectedIds(new Set());
                                }
                            }}
                            className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-1 text-[11px]"
                        >
                            <Trash2 className="h-3 w-3" />
                            <span>Hapus Terpilih ({selectedIds.size})</span>
                        </button>
                    )}
                </div>
            )}

            {/* Table Content */}
            <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
                {tab === "NODES" ? (
                    <table className="w-full text-left text-xs text-slate-700 border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-[11px] font-bold text-slate-500">
                            <tr>
                                <th className="p-2.5 w-8">
                                    <button
                                        type="button"
                                        onClick={handleToggleSelectAll}
                                        className="text-slate-500 hover:text-teal-700"
                                    >
                                        {selectedIds.size === filteredNodes.length && filteredNodes.length > 0 ? (
                                            <CheckSquare className="h-4 w-4 text-teal-600" />
                                        ) : (
                                            <Square className="h-4 w-4" />
                                        )}
                                    </button>
                                </th>
                                <th className="p-2.5">Nama Perangkat</th>
                                <th className="p-2.5">Tipe</th>
                                <th className="p-2.5">Status</th>
                                <th className="p-2.5">Kapasitas</th>
                                <th className="p-2.5">Kode Tiang</th>
                                <th className="p-2.5">Koordinat GPS</th>
                                <th className="p-2.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredNodes.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-400">
                                        Tidak ada data titik yang sesuai filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredNodes.map((node) => {
                                    const isChecked = selectedIds.has(node.id);
                                    return (
                                        <tr
                                            key={node.id}
                                            className={`hover:bg-slate-50/80 transition-colors ${
                                                isChecked ? "bg-teal-50/40" : ""
                                            }`}
                                        >
                                            <td className="p-2.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleSelectOne(node.id)}
                                                    className="text-slate-400 hover:text-teal-600"
                                                >
                                                    {isChecked ? (
                                                        <CheckSquare className="h-4 w-4 text-teal-600" />
                                                    ) : (
                                                        <Square className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="p-2.5 font-bold text-slate-800">
                                                <div>
                                                    <span>{node.name}</span>
                                                    {node.address && (
                                                        <span className="block text-[10px] text-slate-400 font-normal truncate max-w-xs">
                                                            {node.address}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-2.5">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                                        node.type === "ODC"
                                                            ? "bg-amber-100 text-amber-800"
                                                            : node.type === "SERVER" || node.type === "POP"
                                                            ? "bg-cyan-100 text-cyan-800"
                                                            : node.type === "TIANG"
                                                            ? "bg-slate-100 text-slate-800"
                                                            : "bg-emerald-100 text-emerald-800"
                                                    }`}
                                                >
                                                    {node.type}
                                                </span>
                                            </td>
                                            <td className="p-2.5">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                        node.status === "DAMAGED"
                                                            ? "bg-red-50 text-red-700"
                                                            : node.status === "FULL"
                                                            ? "bg-purple-50 text-purple-700"
                                                            : "bg-emerald-50 text-emerald-700"
                                                    }`}
                                                >
                                                    {node.status || "ACTIVE"}
                                                </span>
                                            </td>
                                            <td className="p-2.5 font-mono text-[11px]">
                                                {node.capacity ? (
                                                    <span>
                                                        <strong className="text-teal-700">{node.used_ports || 0}</strong> / {node.capacity} Port
                                                    </span>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                            <td className="p-2.5 font-mono text-[11px] text-slate-600">
                                                {node.pole_number || "-"}
                                            </td>
                                            <td className="p-2.5 font-mono text-[11px] text-slate-500">
                                                {node.latitude.toFixed(5)}, {node.longitude.toFixed(5)}
                                            </td>
                                            <td className="p-2.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => onSelectNodeOnMap(node)}
                                                        title="Buka titik ini di peta"
                                                        className="p-1 rounded-lg text-teal-700 hover:bg-teal-50"
                                                    >
                                                        <MapPin className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onEditNode(node)}
                                                        title="Edit data titik"
                                                        className="p-1 rounded-lg text-slate-600 hover:bg-slate-100"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (confirm(`Hapus node "${node.name}"?`)) {
                                                                onDeleteNode(node.id);
                                                            }
                                                        }}
                                                        title="Hapus node"
                                                        className="p-1 rounded-lg text-red-500 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-left text-xs text-slate-700 border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-[11px] font-bold text-slate-500">
                            <tr>
                                <th className="p-2.5">Nama Kabel</th>
                                <th className="p-2.5">Tipe Kabel</th>
                                <th className="p-2.5">Status Fisik</th>
                                <th className="p-2.5">Kapasitas Core</th>
                                <th className="p-2.5">Panjang Estimasi</th>
                                <th className="p-2.5">Warna</th>
                                <th className="p-2.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLines.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">
                                        Tidak ada data jalur kabel fiber.
                                    </td>
                                </tr>
                            ) : (
                                filteredLines.map((line) => (
                                    <tr key={line.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-2.5 font-bold text-slate-800">
                                            {line.name}
                                        </td>
                                        <td className="p-2.5">
                                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-sky-100 text-sky-800">
                                                {line.cable_type}
                                            </span>
                                        </td>
                                        <td className="p-2.5">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                    line.status === "CUT"
                                                        ? "bg-red-50 text-red-700"
                                                        : "bg-emerald-50 text-emerald-700"
                                                }`}
                                            >
                                                {line.status || "NORMAL"}
                                            </span>
                                        </td>
                                        <td className="p-2.5 font-mono text-[11px] font-bold text-slate-700">
                                            {line.core_capacity} Core
                                        </td>
                                        <td className="p-2.5 font-mono text-[11px]">
                                            {line.length_meters ? formatDistance(line.length_meters) : "-"}
                                        </td>
                                        <td className="p-2.5">
                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className="h-3 w-3 rounded-full border border-black/10"
                                                    style={{ backgroundColor: line.color }}
                                                />
                                                <span className="font-mono text-[10px] uppercase">
                                                    {line.color}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectLineOnMap(line)}
                                                    title="Buka kabel ini di peta"
                                                    className="p-1 rounded-lg text-teal-700 hover:bg-teal-50"
                                                >
                                                    <MapPin className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onEditLine(line)}
                                                    title="Edit kabel"
                                                    className="p-1 rounded-lg text-slate-600 hover:bg-slate-100"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
