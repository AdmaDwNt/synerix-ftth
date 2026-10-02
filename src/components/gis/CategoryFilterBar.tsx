"use client";

import { GisCategoryFilter, NetworkNode } from "@/lib/types/gis";

interface CategoryFilterBarProps {
    activeCategory: GisCategoryFilter;
    onChange: (cat: GisCategoryFilter) => void;
    nodes: NetworkNode[];
}

export default function CategoryFilterBar({
    activeCategory,
    onChange,
    nodes,
}: CategoryFilterBarProps) {
    // Hitung counter per kategori
    const counts = {
        ALL: nodes.length,
        SERVER_POP: nodes.filter((n) => n.type === "SERVER" || n.type === "POP").length,
        ODC: nodes.filter((n) => n.type === "ODC").length,
        ODP: nodes.filter((n) => n.type === "ODP").length,
        TIANG: nodes.filter((n) => n.type === "TIANG").length,
        DISMANTLE: nodes.filter((n) => n.type === "DISMANTLE").length,
    };

    const filters: {
        id: GisCategoryFilter;
        label: string;
        dotColor: string;
    }[] = [
        { id: "ALL", label: "Semua", dotColor: "bg-slate-700" },
        { id: "SERVER_POP", label: "Server / POP", dotColor: "bg-cyan-500" },
        { id: "ODC", label: "ODC", dotColor: "bg-amber-500" },
        { id: "ODP", label: "ODP", dotColor: "bg-emerald-500" },
        { id: "TIANG", label: "Tiang", dotColor: "bg-slate-500" },
        { id: "DISMANTLE", label: "Dismantle", dotColor: "bg-red-500" },
    ];

    return (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {filters.map((f) => {
                const isActive = activeCategory === f.id;
                const count = counts[f.id] || 0;

                return (
                    <button
                        key={f.id}
                        type="button"
                        onClick={() => onChange(f.id)}
                        className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border shadow-xs ${
                            isActive
                                ? "bg-teal-700 text-white border-teal-800 shadow-teal-700/20"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                    >
                        <span
                            className={`h-2 w-2 rounded-full shrink-0 ${
                                isActive ? "bg-white" : f.dotColor
                            }`}
                        />
                        <span>{f.label}</span>
                        <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                                isActive
                                    ? "bg-teal-800/80 text-teal-100"
                                    : "bg-slate-100 text-slate-600"
                            }`}
                        >
                            {count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
