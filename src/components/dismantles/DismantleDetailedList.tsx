/**
 * ============================================================================
 * MODUL       : Dismantle Detailed List & Smart Copy
 * FILE        : src/components/dismantles/DismantleDetailedList.tsx
 * DESKRIPSI   : Tampilan rinci berbasis kartu untuk data dismantle pelanggan,
 *               dilengkapi multi-select checkbox dan tombol smart copy WhatsApp
 *               ("Salin Terpilih" dan "Salin Semua").
 * ============================================================================
 */

"use client";

import React, { useState } from "react";
import {
    Copy,
    CheckSquare,
    Square,
    Phone,
    MapPin,
    User,
    Hash,
    Clock,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Send,
} from "lucide-react";

export interface DismantleItem {
    id: string;
    ticket_no?: string;
    customer_id?: string;
    customer_name: string;
    address?: string;
    phone?: string;
    status: string;
    sla_hours_remaining?: number;
    created_at?: string;
    scheduled_date?: string;
    assigned_technician?: string;
    notes?: string;
}

interface DismantleDetailedListProps {
    items: DismantleItem[];
    onSelectStatus?: (id: string, newStatus: string) => void;
    onEdit?: (item: DismantleItem) => void;
}

export default function DismantleDetailedList({
    items,
    onSelectStatus,
    onEdit,
}: DismantleDetailedListProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    const isAllSelected = items.length > 0 && selectedIds.size === items.length;

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(items.map((i) => i.id)));
        }
    };

    const toggleSelectItem = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    };

    const formatItemsForWhatsApp = (targetItems: DismantleItem[]): string => {
        const dateStr = new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });

        const lines: string[] = [
            `*LIST DISMANTLE PERANGKAT FTTH*`,
            `Tanggal: ${dateStr}`,
            `Total: ${targetItems.length} Pelanggan`,
            `----------------------------------`,
        ];

        targetItems.forEach((item, index) => {
            lines.push(`*${index + 1}. ${item.customer_name}*`);
            if (item.ticket_no) lines.push(`   No. Tiket: ${item.ticket_no}`);
            if (item.customer_id) lines.push(`   ID Pelanggan: ${item.customer_id}`);
            if (item.address) lines.push(`   Alamat: ${item.address}`);
            if (item.phone) lines.push(`   No. HP/WA: ${item.phone}`);
            if (item.status) lines.push(`   Status: ${item.status}`);
            if (item.notes) lines.push(`   Ket: ${item.notes}`);
            lines.push(``);
        });

        lines.push(`_Mohon segera diproses & update laporan setelah penarikan alat._`);
        return lines.join("\n");
    };

    const handleCopy = async (targetItems: DismantleItem[], type: "SELECTED" | "ALL") => {
        if (targetItems.length === 0) return;
        const text = formatItemsForWhatsApp(targetItems);
        try {
            await navigator.clipboard.writeText(text);
            const msg =
                type === "SELECTED"
                    ? `Berhasil menyalin ${targetItems.length} data terpilih!`
                    : `Berhasil menyalin seluruh ${targetItems.length} data dismantle!`;
            setCopyFeedback(msg);
            setTimeout(() => setCopyFeedback(null), 3000);
        } catch (err) {
            console.error("Gagal menyalin teks:", err);
        }
    };

    const selectedItems = items.filter((i) => selectedIds.has(i.id));

    return (
        <div className="space-y-4">
            {/* Top Toolbar Actions */}
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                {/* Checkbox Select All */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-teal-700 transition-colors cursor-pointer select-none"
                    >
                        {isAllSelected ? (
                            <CheckSquare className="w-4 h-4 text-teal-600" />
                        ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                        )}
                        <span>
                            {isAllSelected ? "Batalkan Pilihan" : "Pilih Semua"}{" "}
                            <span className="text-slate-400 font-normal">
                                ({selectedIds.size}/{items.length} terpilih)
                            </span>
                        </span>
                    </button>
                </div>

                {/* WhatsApp Copy Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Salin Terpilih Button */}
                    <button
                        type="button"
                        disabled={selectedIds.size === 0}
                        onClick={() => handleCopy(selectedItems, "SELECTED")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-600 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold shadow-2xs active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all"
                        title="Salin data yang dicentang ke format WhatsApp"
                    >
                        <Copy className="w-3.5 h-3.5 text-teal-600" />
                        <span>Salin Terpilih ({selectedIds.size})</span>
                    </button>

                    {/* Salin Semua Button */}
                    <button
                        type="button"
                        disabled={items.length === 0}
                        onClick={() => handleCopy(items, "ALL")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-2xs active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all"
                        title="Salin seluruh data yang tampil saat ini ke format WhatsApp"
                    >
                        <Send className="w-3.5 h-3.5" />
                        <span>Salin Semua ({items.length})</span>
                    </button>
                </div>
            </div>

            {/* Notification Banner Feedback */}
            {copyFeedback && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{copyFeedback}</span>
                </div>
            )}

            {/* Card Grid / List */}
            {items.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
                    Tidak ada data dismantle yang sesuai dengan filter.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                    {items.map((item) => {
                        const isSelected = selectedIds.has(item.id);
                        return (
                            <div
                                key={item.id}
                                onClick={() => toggleSelectItem(item.id)}
                                className={`p-4 rounded-xl border transition-all cursor-pointer relative bg-white flex flex-col justify-between ${
                                    isSelected
                                        ? "border-teal-500 ring-2 ring-teal-500/15 shadow-sm"
                                        : "border-slate-200 hover:border-slate-300 hover:shadow-2xs"
                                }`}
                            >
                                {/* Header Card: Checkbox, Tiket, SLA */}
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-2.5">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSelectItem(item.id);
                                                }}
                                                className="text-slate-400 hover:text-teal-600"
                                            >
                                                {isSelected ? (
                                                    <CheckSquare className="w-4 h-4 text-teal-600" />
                                                ) : (
                                                    <Square className="w-4 h-4" />
                                                )}
                                            </button>
                                            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                                {item.ticket_no || "TKT-MANUAL"}
                                            </span>
                                        </div>

                                        <span
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                item.status === "SELESAI"
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : item.status === "PROSES"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : item.status === "PENDING"
                                                    ? "bg-amber-100 text-amber-800"
                                                    : "bg-slate-100 text-slate-700"
                                            }`}
                                        >
                                            {item.status}
                                        </span>
                                    </div>

                                    {/* Customer Identity */}
                                    <div className="space-y-1.5 mb-3">
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                            <h4 className="font-black text-sm text-slate-900 leading-tight">
                                                {item.customer_name}
                                            </h4>
                                        </div>

                                        {item.customer_id && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                                                <Hash className="w-3 h-3 text-slate-400 shrink-0" />
                                                <span>ID: {item.customer_id}</span>
                                            </div>
                                        )}

                                        {item.address && (
                                            <div className="flex items-start gap-1.5 text-xs text-slate-600">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                                <span className="line-clamp-2">{item.address}</span>
                                            </div>
                                        )}

                                        {item.phone && (
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                <a
                                                    href={`https://wa.me/${item.phone.replace(/^0/, "62").replace(/\D/g, "")}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="font-medium text-emerald-700 hover:underline"
                                                >
                                                    {item.phone}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Card: Meta & Quick Copy */}
                                <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {item.scheduled_date || "Hari ini"}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopy([item], "SELECTED");
                                        }}
                                        className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold text-[11px]"
                                    >
                                        <Copy className="w-3 h-3" /> Salin WA
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
