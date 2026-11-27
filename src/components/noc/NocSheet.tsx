/**
 * ============================================================================
 * MODUL       : Catatan Sheet NOC (Multi-Tab Spreadsheet)
 * FILE        : src/components/noc/NocSheet.tsx
 * DESKRIPSI   : Spreadsheet operasional NOC interaktif berbasis tabel & multi-tab sheet
 *               selaras dengan Screenshot 1 & Asterix Clean Light Theme.
 * ============================================================================
 */

"use client";

import React, { useState, useEffect } from "react";
import {
    Table,
    Plus,
    Minus,
    Columns,
    Save,
    Download,
    FileSpreadsheet,
    Edit2,
    Trash2,
    Check,
    CheckCircle2,
    Loader2,
} from "lucide-react";

interface SheetTab {
    id: string;
    name: string;
    columns: string[];
    rows: Record<string, string>[];
    updated_at?: string;
}

export default function NocSheet() {
    const [sheets, setSheets] = useState<SheetTab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    // Editing Tab Name State
    const [editingTabId, setEditingTabId] = useState<string | null>(null);
    const [editingTabName, setEditingTabName] = useState("");

    // Selected Row State
    const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
    const [rowSelectionActive, setRowSelectionActive] = useState(true);

    // Load sheets from backend API
    const loadSheets = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/noc-sheets");
            const json = await res.json();
            if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                setSheets(json.data);
                setActiveTabId(json.data[0].id);
            }
        } catch (err) {
            console.error("Gagal memuat sheets:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSheets();
    }, []);

    const activeSheet = sheets.find((s) => s.id === activeTabId) || sheets[0];

    // Update active sheet in state
    const updateActiveSheet = (updater: (prev: SheetTab) => SheetTab) => {
        if (!activeSheet) return;
        setSheets((prev) =>
            prev.map((s) => (s.id === activeSheet.id ? updater(s) : s))
        );
    };

    // Add Row
    const handleAddRow = () => {
        if (!activeSheet) return;
        const emptyRow: Record<string, string> = {};
        activeSheet.columns.forEach((col) => {
            emptyRow[col] = "";
        });
        updateActiveSheet((prev) => ({
            ...prev,
            rows: [...prev.rows, emptyRow],
        }));
    };

    // Remove Selected Row (or last row)
    const handleRemoveRow = () => {
        if (!activeSheet || activeSheet.rows.length === 0) return;
        updateActiveSheet((prev) => {
            const nextRows = [...prev.rows];
            if (selectedRowIndex !== null && selectedRowIndex >= 0) {
                nextRows.splice(selectedRowIndex, 1);
            } else {
                nextRows.pop();
            }
            return { ...prev, rows: nextRows };
        });
        setSelectedRowIndex(null);
    };

    // Add Column
    const handleAddColumn = () => {
        if (!activeSheet) return;
        const newColName = prompt("Masukkan nama kolom baru:");
        if (!newColName?.trim()) return;
        const cleanCol = newColName.trim();
        if (activeSheet.columns.includes(cleanCol)) {
            alert("Nama kolom sudah ada.");
            return;
        }

        updateActiveSheet((prev) => ({
            ...prev,
            columns: [...prev.columns, cleanCol],
            rows: prev.rows.map((r) => ({ ...r, [cleanCol]: "" })),
        }));
    };

    // Remove Column
    const handleRemoveColumn = () => {
        if (!activeSheet || activeSheet.columns.length <= 1) {
            alert("Minimal harus tersisa 1 kolom.");
            return;
        }
        const colToRemove = prompt(
            `Ketik nama kolom yang ingin dihapus:\n(${activeSheet.columns.join(", ")})`
        );
        if (!colToRemove) return;
        const cleanCol = colToRemove.trim();
        if (!activeSheet.columns.includes(cleanCol)) {
            alert("Kolom tidak ditemukan.");
            return;
        }

        updateActiveSheet((prev) => {
            const nextCols = prev.columns.filter((c) => c !== cleanCol);
            const nextRows = prev.rows.map((r) => {
                const copy = { ...r };
                delete copy[cleanCol];
                return copy;
            });
            return { ...prev, columns: nextCols, rows: nextRows };
        });
    };

    // Cell Edit
    const handleCellChange = (rowIndex: number, colName: string, value: string) => {
        updateActiveSheet((prev) => {
            const nextRows = [...prev.rows];
            nextRows[rowIndex] = { ...nextRows[rowIndex], [colName]: value };
            return { ...prev, rows: nextRows };
        });
    };

    // Add New Tab
    const handleAddNewTab = async () => {
        const tabName = prompt("Nama Sheet / Tab Baru:");
        if (!tabName?.trim()) return;
        const newSheetPayload = {
            name: tabName.trim(),
            columns: ["ID Tiket", "Pelanggan", "Keterangan"],
            rows: [],
        };
        try {
            const res = await fetch("/api/noc-sheets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newSheetPayload),
            });
            const json = await res.json();
            if (json.success && json.data) {
                setSheets((prev) => [...prev, json.data]);
                setActiveTabId(json.data.id);
            }
        } catch (err) {
            console.error("Gagal menambah sheet:", err);
        }
    };

    // Rename Tab
    const handleSaveTabName = async (tabId: string) => {
        if (!editingTabName.trim()) {
            setEditingTabId(null);
            return;
        }
        const target = sheets.find((s) => s.id === tabId);
        if (!target) return;

        const updated = { ...target, name: editingTabName.trim() };
        setSheets((prev) => prev.map((s) => (s.id === tabId ? updated : s)));
        setEditingTabId(null);

        try {
            await fetch("/api/noc-sheets", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated),
            });
        } catch (e) {
            console.error(e);
        }
    };

    // Manual Save
    const handleManualSave = async () => {
        if (!activeSheet) return;
        setIsSaving(true);
        try {
            await fetch("/api/noc-sheets", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(activeSheet),
            });
            setSaveMessage("Data sheet berhasil disimpan!");
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    // Export CSV
    const handleExportCsv = () => {
        if (!activeSheet) return;
        const header = ["#", ...activeSheet.columns].join(",");
        const rows = activeSheet.rows.map((row, idx) => {
            const values = [idx + 1, ...activeSheet.columns.map((c) => `"${(row[c] || "").replace(/"/g, '""')}"`)];
            return values.join(",");
        });
        const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${activeSheet.name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">Memuat data Sheet NOC...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Dark Navy Hero Header (Matching Screenshot 1) */}
            <div className="bg-[#0f172a] rounded-2xl p-5 text-white shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                            Catatan &amp; Sheet NOC
                        </h2>
                        <p className="text-xs text-slate-300">
                            Dokumentasi data operasional NOC interaktif berbasis tabel &amp; multi-tab sheet
                        </p>
                    </div>
                </div>

                {/* Top Action Buttons (Matching Screenshot 1) */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold shadow-2xs active:scale-95 transition-all cursor-pointer"
                        title="Download CSV"
                    >
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        <span>Ekspor CSV</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleManualSave}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                    >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>Simpan Manual</span>
                    </button>
                </div>
            </div>

            {/* Notification Banner */}
            {saveMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{saveMessage}</span>
                </div>
            )}

            {/* Tab Navigation & Row/Column Tools Bar (Matching Screenshot 1) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-3 border-b border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Left: Tabs List (Matching Screenshot 1) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                        {sheets.map((sheet) => {
                            const isActive = sheet.id === activeTabId;
                            return (
                                <div
                                    key={sheet.id}
                                    className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                        isActive
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                    }`}
                                    onClick={() => setActiveTabId(sheet.id)}
                                >
                                    <FileSpreadsheet className={`w-3.5 h-3.5 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                                    {editingTabId === sheet.id ? (
                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="text"
                                                value={editingTabName}
                                                onChange={(e) => setEditingTabName(e.target.value)}
                                                className="w-24 px-1 py-0.5 text-xs bg-white border border-teal-500 rounded font-semibold focus:outline-none"
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleSaveTabName(sheet.id)}
                                                className="text-emerald-700 hover:text-emerald-900"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span>{sheet.name}</span>
                                            {isActive && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingTabId(sheet.id);
                                                        setEditingTabName(sheet.name);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 hover:text-emerald-950 p-0.5 text-emerald-700"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}

                        {/* + Tab Baru Button (Matching Screenshot 1) */}
                        <button
                            type="button"
                            onClick={handleAddNewTab}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 hover:border-teal-500 text-slate-500 hover:text-teal-700 text-xs font-semibold transition-all cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tab Baru</span>
                        </button>
                    </div>

                    {/* Right: Actions Controls: + Baris, - Baris, + Kolom, - Kolom (Matching Screenshot 1) */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                        {/* Pilih Baris Toggle */}
                        <button
                            type="button"
                            onClick={() => setRowSelectionActive(!rowSelectionActive)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                rowSelectionActive
                                    ? "bg-teal-50 text-teal-800 border-teal-200"
                                    : "bg-white text-slate-500 border-slate-200"
                            }`}
                        >
                            Pilih Baris: {rowSelectionActive ? "On" : "Off"}
                        </button>

                        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
                            <span className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Aksi:
                            </span>
                            <button
                                type="button"
                                onClick={handleAddRow}
                                className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                                title="Tambah Baris"
                            >
                                <Plus className="w-3 h-3 text-emerald-600" />
                                <span>Baris</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleRemoveRow}
                                className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                                title="Hapus Baris"
                            >
                                <Minus className="w-3 h-3 text-rose-600" />
                                <span>Baris</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleAddColumn}
                                className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                                title="Tambah Kolom"
                            >
                                <Plus className="w-3 h-3 text-emerald-600" />
                                <span>Kolom</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleRemoveColumn}
                                className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                                title="Hapus Kolom"
                            >
                                <Minus className="w-3 h-3 text-rose-600" />
                                <span>Kolom</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Data Matrix (Matching Screenshot 1) */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        {/* Header Row: Dark Navy Theme (Matching Screenshot 1) */}
                        <thead>
                            <tr className="bg-[#1e293b] text-white">
                                <th className="py-2.5 px-3 font-bold w-12 text-center border-r border-slate-700 font-mono text-[11px]">
                                    #
                                </th>
                                {activeSheet?.columns.map((col, idx) => (
                                    <th
                                        key={idx}
                                        className="py-2.5 px-3 font-bold tracking-wide border-r border-slate-700 text-slate-100 last:border-r-0"
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* Body Rows */}
                        <tbody className="divide-y divide-slate-200">
                            {activeSheet?.rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={(activeSheet?.columns.length || 0) + 1}
                                        className="py-10 text-center text-slate-400 bg-slate-50/50"
                                    >
                                        Belum ada data baris. Klik{" "}
                                        <span className="font-bold text-teal-700">+ Baris</span> untuk menambahkan.
                                    </td>
                                </tr>
                            ) : (
                                activeSheet?.rows.map((row, rIdx) => {
                                    const isRowSelected = selectedRowIndex === rIdx;
                                    return (
                                        <tr
                                            key={rIdx}
                                            onClick={() => {
                                                if (rowSelectionActive) {
                                                    setSelectedRowIndex(isRowSelected ? null : rIdx);
                                                }
                                            }}
                                            className={`transition-colors ${
                                                isRowSelected
                                                    ? "bg-teal-50/80 ring-1 ring-teal-500/30"
                                                    : "hover:bg-slate-50/80 bg-white"
                                            }`}
                                        >
                                            <td className="py-2 px-3 text-center font-mono text-slate-400 font-bold border-r border-slate-200 text-[11px] select-none">
                                                {rIdx + 1}
                                            </td>
                                            {activeSheet.columns.map((col, cIdx) => (
                                                <td
                                                    key={cIdx}
                                                    className="p-1 border-r border-slate-200 last:border-r-0"
                                                >
                                                    <input
                                                        type="text"
                                                        value={row[col] || ""}
                                                        onChange={(e) =>
                                                            handleCellChange(rIdx, col, e.target.value)
                                                        }
                                                        className="w-full px-2 py-1 text-xs text-slate-800 bg-transparent rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all font-medium"
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Status Bar (Matching Screenshot 1: Total: 5 Baris • 3 Kolom) */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>
                        Total: {activeSheet?.rows.length || 0} Baris &bull; {activeSheet?.columns.length || 0} Kolom
                    </span>
                    <span className="text-slate-400">
                        {activeSheet?.updated_at
                            ? `Diperbarui ${new Date(activeSheet.updated_at).toLocaleTimeString("id-ID")}`
                            : "Siap"}
                    </span>
                </div>
            </div>
        </div>
    );
}
