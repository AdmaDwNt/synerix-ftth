/**
 * ============================================================================
 * MODUL       : Halaman Modul Catatan NOC
 * FILE        : src/app/notes/page.tsx
 * DESKRIPSI   : Halaman integrasi Catatan & Sheet NOC (Multi-Tab Spreadsheet)
 *               serta Catatan Bebas (Notion-Style Block Editor).
 * ============================================================================
 */

"use client";

import React, { useState } from "react";
import NocSheet from "@/components/noc/NocSheet";
import NotionNotes from "@/components/noc/NotionNotes";
import { FileSpreadsheet, FileText } from "lucide-react";

export default function NotesPage() {
    const [activeSubTab, setActiveSubTab] = useState<"SHEET" | "NOTION">("SHEET");

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Top Sub-Tab Switcher */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center rounded-xl bg-slate-200/80 p-1 border border-slate-300/80">
                    <button
                        type="button"
                        onClick={() => setActiveSubTab("SHEET")}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeSubTab === "SHEET"
                                ? "bg-white text-teal-800 shadow-2xs"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span>Catatan Sheet NOC (Tabel)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveSubTab("NOTION")}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeSubTab === "NOTION"
                                ? "bg-white text-teal-800 shadow-2xs"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <FileText className="w-4 h-4 text-teal-600" />
                        <span>Catatan Bebas (Notion-Style)</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeSubTab === "SHEET" ? <NocSheet /> : <NotionNotes />}
        </div>
    );
}
