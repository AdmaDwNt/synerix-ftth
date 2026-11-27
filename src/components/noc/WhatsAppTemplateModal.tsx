/**
 * ============================================================================
 * MODUL       : Template Chat WhatsApp (Global Modal)
 * FILE        : src/components/noc/WhatsAppTemplateModal.tsx
 * DESKRIPSI   : Modal popup global responsif untuk salin cepat template chat WhatsApp
 *               selaras dengan Screenshot 2 & Asterix Clean Light Theme.
 * ============================================================================
 */

"use client";

import React, { useState, useEffect } from "react";
import {
    X,
    Search,
    Plus,
    Copy,
    Check,
    Edit2,
    Trash2,
    MessageSquare,
    Loader2,
    CheckCircle2,
} from "lucide-react";

export interface WhatsAppTemplate {
    id: string;
    title: string;
    category: string;
    content: string;
    tags?: string[];
}

interface WhatsAppTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function WhatsAppTemplateModal({ isOpen, onClose }: WhatsAppTemplateModalProps) {
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Create Modal State
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newCategory, setNewCategory] = useState("KONFIRMASI PELANGGAN");
    const [newContent, setNewContent] = useState("");

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/wa-templates");
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
                setTemplates(json.data);
            }
        } catch (e) {
            console.error("Gagal memuat template WhatsApp:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadTemplates();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const categories = Array.from(new Set(templates.map((t) => t.category).filter(Boolean)));

    const filteredTemplates = templates.filter((t) => {
        const matchesCategory = selectedCategory === "ALL" || t.category === selectedCategory;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            t.title.toLowerCase().includes(q) ||
            t.content.toLowerCase().includes(q) ||
            (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)));
        return matchesCategory && matchesSearch;
    });

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 4 && hour < 11) return "Pagi";
        if (hour >= 11 && hour < 15) return "Siang";
        if (hour >= 15 && hour < 18) return "Sore";
        return "Malam";
    };

    const handleCopyTemplate = async (template: WhatsAppTemplate) => {
        let content = template.content;
        // Ganti placeholder dinamis
        content = content.replace(/{sapaan}/gi, `Bapak/Ibu, Selamat ${getGreeting()}`);
        content = content.replace(/{tanggal}/gi, new Date().toLocaleDateString("id-ID"));

        try {
            await navigator.clipboard.writeText(content);
            setCopiedId(template.id);
            setTimeout(() => setCopiedId(null), 2500);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus template ini?")) return;
        try {
            await fetch(`/api/wa-templates?id=${id}`, { method: "DELETE" });
            setTemplates((prev) => prev.filter((t) => t.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newContent.trim()) return;

        try {
            const res = await fetch("/api/wa-templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newTitle.trim(),
                    category: newCategory.trim(),
                    content: newContent.trim(),
                }),
            });
            const json = await res.json();
            if (json.success && json.data) {
                setTemplates((prev) => [json.data, ...prev]);
                setIsCreating(false);
                setNewTitle("");
                setNewContent("");
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            {/* Modal Container (Matching Screenshot 2) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                {/* Header Modal: Dark Navy with WhatsApp Icon (Matching Screenshot 2) */}
                <div className="bg-[#0f172a] text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                            <MessageSquare className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="font-black text-base text-white flex items-center gap-2">
                                Template Chat WhatsApp
                            </h3>
                            <p className="text-xs text-slate-300">
                                Salin pesan cepat untuk komunikasi pelanggan
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Subheader Toolbar: Search + Category + + Buat Baru (Matching Screenshot 2) */}
                <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center gap-2.5">
                    {/* Search Input */}
                    <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari judul atau isi pesan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
                        />
                    </div>

                    {/* Category Select */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full sm:w-44 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
                    >
                        <option value="ALL">Semua Kategori</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>

                    {/* + Buat Baru Button */}
                    <button
                        type="button"
                        onClick={() => setIsCreating(!isCreating)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Buat Baru</span>
                    </button>
                </div>

                {/* Create Form Drawer */}
                {isCreating && (
                    <form
                        onSubmit={handleCreateTemplate}
                        className="p-4 bg-teal-50/60 border-b border-teal-200 space-y-3 text-xs animate-in slide-in-from-top-2"
                    >
                        <div className="flex items-center justify-between font-bold text-teal-950">
                            <span>Tambah Template WhatsApp Baru</span>
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                                type="text"
                                placeholder="Judul template..."
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Kategori (e.g. PEMBAYARAN, KONFIRMASI)..."
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                required
                            />
                        </div>
                        <textarea
                            placeholder="Isi pesan chat (mendukung {sapaan}, teks tebal *bold*, dll)..."
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                            required
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="px-3.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold"
                            >
                                Simpan Template
                            </button>
                        </div>
                    </form>
                )}

                {/* Templates Scrollable List (Matching Screenshot 2) */}
                <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
                    {loading ? (
                        <div className="py-12 text-center text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                            <span className="text-xs">Memuat template pesan...</span>
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs">
                            Tidak ada template chat yang cocok.
                        </div>
                    ) : (
                        filteredTemplates.map((template) => {
                            const isCopied = copiedId === template.id;

                            return (
                                <div
                                    key={template.id}
                                    className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-4 shadow-2xs transition-all space-y-3"
                                >
                                    {/* Card Header: Category Badge + Actions (Edit/Delete) */}
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                                            {template.category}
                                        </span>

                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(template.id)}
                                                className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Template Title */}
                                    <h4 className="font-bold text-sm text-slate-900 leading-snug">
                                        {template.title}
                                    </h4>

                                    {/* Template Content Box */}
                                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 font-mono text-xs text-slate-700 whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
                                        {template.content}
                                    </div>

                                    {/* Salin Pesan Button (Matching Screenshot 2: Prominent Green) */}
                                    <div className="flex justify-end pt-1">
                                        <button
                                            type="button"
                                            onClick={() => handleCopyTemplate(template)}
                                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer ${
                                                isCopied
                                                    ? "bg-slate-800 text-emerald-400"
                                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                            }`}
                                        >
                                            {isCopied ? (
                                                <>
                                                    <Check className="w-3.5 h-3.5" />
                                                    <span>Tersalin!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-3.5 h-3.5" />
                                                    <span>Salin Pesan</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
