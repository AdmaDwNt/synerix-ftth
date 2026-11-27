/**
 * ============================================================================
 * MODUL       : Catatan Bebas NOC (Notion-Style Block Editor)
 * FILE        : src/components/noc/NotionNotes.tsx
 * DESKRIPSI   : Editor blok interaktif untuk dokumentasi teknis NOC (H1-H3,
 *               Todo checklist, Bullet/Numbered, CLI Codeblock untuk OLT/MikroTik, Callouts).
 * ============================================================================
 */

"use client";

import React, { useState, useEffect } from "react";
import {
    Plus,
    Trash2,
    Pin,
    Tag,
    Terminal,
    CheckSquare,
    Square,
    List,
    Heading1,
    Heading2,
    Heading3,
    AlertTriangle,
    Save,
    Loader2,
    CheckCircle2,
    FileText,
} from "lucide-react";

export type BlockType =
    | "heading1"
    | "heading2"
    | "heading3"
    | "paragraph"
    | "todo"
    | "bullet"
    | "code"
    | "callout";

export interface NoteBlock {
    id: string;
    type: BlockType;
    content: string;
    checked?: boolean;
}

export interface NotionNoteItem {
    id: string;
    title: string;
    content_blocks: NoteBlock[];
    tags: string[];
    is_pinned: boolean;
    author: string;
    updated_at?: string;
}

export default function NotionNotes() {
    const [notes, setNotes] = useState<NotionNoteItem[]>([]);
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    const loadNotes = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/notion-notes");
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
                if (json.data.length === 0) {
                    // Create default note
                    const defaultNote: NotionNoteItem = {
                        id: "default-note",
                        title: "SOP Eskalasi Gangguan Backbone & OLT",
                        tags: ["SOP", "NOC", "OLT"],
                        is_pinned: true,
                        author: "Supervisor NOC",
                        content_blocks: [
                            { id: "b1", type: "heading1", content: "SOP Penanganan Redaman Naik Cluster Irsa" },
                            { id: "b2", type: "callout", content: "PENTING: Jangan melakukan reset ONU tanpa konfirmasi redaman feeder di ODF." },
                            { id: "b3", type: "heading2", content: "Checklist Pengecekan:" },
                            { id: "b4", type: "todo", content: "Cek log alarm OLT di CLI (show gpon onu state)", checked: true },
                            { id: "b5", type: "todo", content: "Ukur optical power transmitter port 3", checked: false },
                            { id: "b6", type: "heading3", content: "Command CLI Referensi:" },
                            { id: "b7", type: "code", content: "display ont optical-info 0/1 3\ninterface gpon-olt_1/2/3\nont modify 1 sn" },
                        ],
                    };
                    setNotes([defaultNote]);
                    setActiveNoteId(defaultNote.id);
                } else {
                    setNotes(json.data);
                    setActiveNoteId(json.data[0].id);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotes();
    }, []);

    const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];

    const updateActiveNote = (updater: (prev: NotionNoteItem) => NotionNoteItem) => {
        if (!activeNote) return;
        setNotes((prev) =>
            prev.map((n) => (n.id === activeNote.id ? updater(n) : n))
        );
    };

    const handleAddBlock = (type: BlockType) => {
        const newBlock: NoteBlock = {
            id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type,
            content: "",
            checked: false,
        };
        updateActiveNote((prev) => ({
            ...prev,
            content_blocks: [...prev.content_blocks, newBlock],
        }));
    };

    const handleUpdateBlock = (blockId: string, content: string) => {
        updateActiveNote((prev) => ({
            ...prev,
            content_blocks: prev.content_blocks.map((b) =>
                b.id === blockId ? { ...b, content } : b
            ),
        }));
    };

    const handleToggleTodo = (blockId: string) => {
        updateActiveNote((prev) => ({
            ...prev,
            content_blocks: prev.content_blocks.map((b) =>
                b.id === blockId ? { ...b, checked: !b.checked } : b
            ),
        }));
    };

    const handleDeleteBlock = (blockId: string) => {
        updateActiveNote((prev) => ({
            ...prev,
            content_blocks: prev.content_blocks.filter((b) => b.id !== blockId),
        }));
    };

    const handleCreateNewNote = async () => {
        const title = prompt("Judul Catatan Baru:");
        if (!title?.trim()) return;

        const newNotePayload = {
            title: title.trim(),
            tags: ["NOC"],
            is_pinned: false,
            content_blocks: [{ id: `b_${Date.now()}`, type: "paragraph" as BlockType, content: "" }],
        };

        try {
            const res = await fetch("/api/notion-notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newNotePayload),
            });
            const json = await res.json();
            if (json.success && json.data) {
                setNotes((prev) => [json.data, ...prev]);
                setActiveNoteId(json.data.id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveNote = async () => {
        if (!activeNote) return;
        setIsSaving(true);
        try {
            await fetch("/api/notion-notes", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(activeNote),
            });
            setSaveMessage("Catatan berhasil disimpan!");
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">Memuat Catatan NOC...</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Sidebar Notes List */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                        Dokumen Catatan
                    </h3>
                    <button
                        type="button"
                        onClick={handleCreateNewNote}
                        className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" /> Baru
                    </button>
                </div>

                <div className="space-y-1.5">
                    {notes.map((note) => {
                        const isActive = note.id === activeNote?.id;
                        return (
                            <div
                                key={note.id}
                                onClick={() => setActiveNoteId(note.id)}
                                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                    isActive
                                        ? "bg-teal-50 border-teal-300 text-teal-950 shadow-2xs"
                                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-1 mb-1">
                                    <h4 className="font-bold truncate flex-1">{note.title}</h4>
                                    {note.is_pinned && <Pin className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                    <span>{note.content_blocks.length} blok</span>
                                    <span>&bull;</span>
                                    <span>{note.tags.join(", ") || "Umum"}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Block Editor Area */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
                {/* Header Note Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                    <div className="flex-1 min-w-0">
                        <input
                            type="text"
                            value={activeNote?.title || ""}
                            onChange={(e) =>
                                updateActiveNote((prev) => ({ ...prev, title: e.target.value }))
                            }
                            className="w-full text-lg sm:text-xl font-black text-slate-900 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-teal-500 rounded px-1"
                            placeholder="Judul Catatan..."
                        />
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 px-1">
                            <Tag className="w-3.5 h-3.5" />
                            <span>Tags: {activeNote?.tags.join(", ") || "NOC"}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleSaveNote}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                        >
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            <span>Simpan</span>
                        </button>
                    </div>
                </div>

                {saveMessage && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{saveMessage}</span>
                    </div>
                )}

                {/* Blocks List */}
                <div className="space-y-3 min-h-[300px]">
                    {activeNote?.content_blocks.map((block) => (
                        <div key={block.id} className="group relative flex items-start gap-2">
                            {/* Block Controls / Drag Handle */}
                            <button
                                type="button"
                                onClick={() => handleDeleteBlock(block.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity mt-1 shrink-0"
                                title="Hapus Blok"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Render according to Block Type */}
                            <div className="flex-1 min-w-0">
                                {block.type === "heading1" && (
                                    <input
                                        type="text"
                                        value={block.content}
                                        onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                                        placeholder="Heading 1..."
                                        className="w-full text-base sm:text-lg font-bold text-slate-900 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-teal-500 rounded px-1.5 py-1"
                                    />
                                )}

                                {block.type === "heading2" && (
                                    <input
                                        type="text"
                                        value={block.content}
                                        onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                                        placeholder="Heading 2..."
                                        className="w-full text-sm sm:text-base font-bold text-slate-800 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-teal-500 rounded px-1.5 py-1"
                                    />
                                )}

                                {block.type === "heading3" && (
                                    <input
                                        type="text"
                                        value={block.content}
                                        onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                                        placeholder="Heading 3..."
                                        className="w-full text-xs sm:text-sm font-bold text-slate-700 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-teal-500 rounded px-1.5 py-1"
                                    />
                                )}

                                {block.type === "paragraph" && (
                                    <textarea
                                        value={block.content}
                                        onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                                        placeholder="Ketik teks penjelasan atau catatan di sini..."
                                        rows={2}
                                        className="w-full text-xs text-slate-800 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-teal-500 rounded px-1.5 py-1 resize-y"
                                    />
                                )}

                                {block.type === "todo" && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleTodo(block.id)}
                                            className="text-teal-700 hover:text-teal-900 shrink-0"
                                        >
                                            {block.checked ? (
                                                <CheckSquare className="w-4 h-4 text-teal-600" />
                                            ) : (
                                                <Square className="w-4 h-4 text-slate-400" />
                                            )}
                                        </button>
                                        <input
                                            type="text"
                                            value={block.content}
                                            onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                                            placeholder="Item tugas / checklist..."
                                            className={`w-full text-xs text-slate-800 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-teal-500 rounded px-1 py-0.5 ${
                                                block.checked ? "line-through text-slate-400" : ""
                                            }`}
                                        />
                                    </div>
                                )}

                                {block.type === "bullet" && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-teal-600 font-black text-sm shrink-0">&bull;</span>
                                        <input
                                            type="text"
                                            value={block.content}
                                            onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                                            placeholder="Daftar poin..."
                                            className="w-full text-xs text-slate-800 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-teal-500 rounded px-1 py-0.5"
                                        />
                                    </div>
                                )}

                                {block.type === "code" && (
                                    <div className="rounded-xl bg-[#0f172a] p-3 text-slate-200 border border-slate-800">
                                        <div className="flex items-center gap-1.5 text-[10px] text-teal-400 font-mono font-bold mb-1.5">
                                            <Terminal className="w-3.5 h-3.5" />
                                            <span>CLI Script (MikroTik / OLT / Cisco)</span>
                                        </div>
                                        <textarea
                                            value={block.content}
                                            onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                                            placeholder="Ketik command line di sini..."
                                            rows={3}
                                            className="w-full bg-transparent font-mono text-xs text-emerald-400 border-none focus:outline-none resize-y"
                                        />
                                    </div>
                                )}

                                {block.type === "callout" && (
                                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2.5">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                        <textarea
                                            value={block.content}
                                            onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                                            placeholder="Catatan peringatan penting..."
                                            rows={2}
                                            className="w-full bg-transparent text-xs text-amber-900 font-medium border-none focus:outline-none resize-none"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Add Block Toolbar */}
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400 mr-2 uppercase tracking-wider">
                        + Tambah Blok:
                    </span>
                    <button
                        type="button"
                        onClick={() => handleAddBlock("paragraph")}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                    >
                        Teks Paragraf
                    </button>
                    <button
                        type="button"
                        onClick={() => handleAddBlock("heading1")}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                    >
                        H1
                    </button>
                    <button
                        type="button"
                        onClick={() => handleAddBlock("heading2")}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                    >
                        H2
                    </button>
                    <button
                        type="button"
                        onClick={() => handleAddBlock("todo")}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                    >
                        Checklist Todo
                    </button>
                    <button
                        type="button"
                        onClick={() => handleAddBlock("bullet")}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                    >
                        Bullet List
                    </button>
                    <button
                        type="button"
                        onClick={() => handleAddBlock("code")}
                        className="px-2.5 py-1 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold"
                    >
                        Code CLI OLT
                    </button>
                    <button
                        type="button"
                        onClick={() => handleAddBlock("callout")}
                        className="px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold"
                    >
                        Callout Penting
                    </button>
                </div>
            </div>
        </div>
    );
}
