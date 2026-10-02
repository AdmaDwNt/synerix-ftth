"use client";

import { useState } from "react";
import Link from "next/link";
import { JointBox } from "@/lib/types/coreGuide";
import {
    Box,
    Plus,
    Search,
    MapPin,
    Layers,
    ChevronRight,
    ExternalLink,
    AlertCircle,
    Pencil,
    Trash2,
    X,
    Inbox
} from "lucide-react";
import { getGoogleMapsUrl } from "@/lib/ftth/distance";
import CustomSelect, { SelectOption } from "@/components/ui/CustomSelect";

interface JointBoxListProps {
    jointBoxes: JointBox[];
    onAddNewBox: (newBox: Partial<JointBox>) => Promise<void>;
    onUpdateBox?: (id: string, updatedBox: Partial<JointBox>) => Promise<void>;
    onDeleteBox?: (id: string) => Promise<void>;
    loading?: boolean;
}

export default function JointBoxList({
    jointBoxes,
    onAddNewBox,
    onUpdateBox,
    onDeleteBox,
    loading = false,
}: JointBoxListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCluster, setSelectedCluster] = useState("ALL");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingBox, setEditingBox] = useState<JointBox | null>(null);
    const [deletingBox, setDeletingBox] = useState<JointBox | null>(null);
    const [saving, setSaving] = useState(false);

    // Form Tambah Joint Box Baru
    const [formData, setFormData] = useState({
        name: "",
        closure_type: "DOME_CLOSURE" as JointBox["closure_type"],
        cluster_area: "Mojoroto",
        pole_number: "",
        latitude: -7.8182,
        longitude: 111.9954,
        capacity_cores: 48,
        tray_count: 4,
        notes: "",
    });

    // Form Edit Joint Box
    const [editFormData, setEditFormData] = useState({
        name: "",
        closure_type: "DOME_CLOSURE" as JointBox["closure_type"],
        cluster_area: "Mojoroto",
        pole_number: "",
        latitude: -7.8182,
        longitude: 111.9954,
        capacity_cores: 48,
        tray_count: 4,
        notes: "",
    });

    // Unique clusters
    const clusters = ["ALL", ...Array.from(new Set(jointBoxes.map((b) => b.cluster_area)))];

    // Filtered boxes
    const filteredBoxes = jointBoxes.filter((box) => {
        const matchesQuery =
            box.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            box.cluster_area.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (box.pole_number && box.pole_number.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCluster = selectedCluster === "ALL" || box.cluster_area === selectedCluster;
        return matchesQuery && matchesCluster;
    });

    const handleSubmitNewBox = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert("Nama/Kode Joint Box wajib diisi.");
            return;
        }
        setSaving(true);
        try {
            await onAddNewBox(formData);
            setIsAddModalOpen(false);
            setFormData({
                name: "",
                closure_type: "DOME_CLOSURE",
                cluster_area: "Mojoroto",
                pole_number: "",
                latitude: -7.8182,
                longitude: 111.9954,
                capacity_cores: 48,
                tray_count: 4,
                notes: "",
            });
        } catch (err: unknown) {
            alert("Gagal menambahkan Joint Box: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    const handleOpenEditModal = (box: JointBox) => {
        setEditingBox(box);
        setEditFormData({
            name: box.name,
            closure_type: box.closure_type,
            cluster_area: box.cluster_area,
            pole_number: box.pole_number || "",
            latitude: box.latitude,
            longitude: box.longitude,
            capacity_cores: box.capacity_cores,
            tray_count: box.tray_count,
            notes: box.notes || "",
        });
    };

    const handleSubmitEditBox = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBox || !onUpdateBox) return;
        if (!editFormData.name.trim()) {
            alert("Nama/Kode Joint Box wajib diisi.");
            return;
        }
        setSaving(true);
        try {
            await onUpdateBox(editingBox.id, editFormData);
            setEditingBox(null);
        } catch (err: unknown) {
            alert("Gagal memperbarui Joint Box: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingBox || !onDeleteBox) return;
        setSaving(true);
        try {
            await onDeleteBox(deletingBox.id);
            setDeletingBox(null);
        } catch (err: unknown) {
            alert("Gagal menghapus Joint Box: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    const closureOptions: SelectOption[] = [
        { value: "DOME_CLOSURE", label: "Dome Closure" },
        { value: "INLINE_CLOSURE", label: "Inline Closure" },
        { value: "ODC_TRAY", label: "ODC Tray" },
        { value: "OPTICAL_SPLITTER_BOX", label: "Splitter Box" },
    ];

    return (
        <div className="bg-white rounded-2xl border border-synerix-border shadow-sm p-4 sm:p-6">
            {/* Header List */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                    <h3 className="text-base font-bold text-synerix-text flex items-center gap-2">
                        <Box className="h-5 w-5 text-teal-600" />
                        Daftar Joint Box & Closure Lapangan
                    </h3>
                    <p className="text-xs text-synerix-subtext">
                        Pilih closure untuk melihat atau memperbarui matriks trakea sambungan kabel
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 self-start sm:self-auto"
                >
                    <Plus className="h-4 w-4" />
                    Tambah Joint Box
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-4">
                <div className="relative w-full sm:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari kode closure, tiang, atau cluster..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
                    {clusters.map((cluster) => (
                        <button
                            key={cluster}
                            type="button"
                            onClick={() => setSelectedCluster(cluster)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all ${
                                selectedCluster === cluster
                                    ? "bg-slate-900 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {cluster === "ALL" ? "Semua Area" : cluster}
                        </button>
                    ))}
                </div>
            </div>

            {/* Box Items Grid */}
            {jointBoxes.length === 0 ? (
                /* Empty State (Belum ada data sama sekali) */
                <div className="mt-6 py-12 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                    <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mx-auto mb-3">
                        <Inbox className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-bold text-slate-800">Belum Ada Data Joint Box</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        Daftar closure/trakea masih kosong. Mulai tambahkan joint box baru untuk mendokumentasikan matriks splicing serat optik.
                    </p>
                    <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Joint Box Pertama
                    </button>
                </div>
            ) : (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredBoxes.map((box) => (
                        <div
                            key={box.id}
                            className="p-4 rounded-xl border border-slate-200 hover:border-teal-500/60 hover:shadow-sm transition-all bg-gradient-to-br from-white to-slate-50/50 flex flex-col justify-between group"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60 uppercase">
                                                {box.closure_type.replace("_", " ")}
                                            </span>
                                            <span className="text-[11px] font-medium text-slate-500">
                                                {box.cluster_area}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-sm sm:text-base text-slate-900 mt-1 group-hover:text-teal-700 transition-colors">
                                            {box.name}
                                        </h4>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded-md text-slate-700">
                                            {box.capacity_cores} Core
                                        </span>
                                        {/* Action buttons Edit & Delete */}
                                        {onUpdateBox && (
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEditModal(box)}
                                                className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-teal-700 transition-colors"
                                                title="Edit Joint Box"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                        {onDeleteBox && (
                                            <button
                                                type="button"
                                                onClick={() => setDeletingBox(box)}
                                                className="p-1 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                                title="Hapus Joint Box"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-3 space-y-1 text-xs text-slate-600">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span>
                                            Tiang: <strong>{box.pole_number || "Tidak tercatat"}</strong>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Layers className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span>
                                            Jumlah Baki (Tray): <strong>{box.tray_count} Baki</strong>
                                        </span>
                                    </div>
                                    {box.notes && (
                                        <p className="text-[11px] text-slate-500 italic mt-1 line-clamp-1">
                                            &ldquo;{box.notes}&rdquo;
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Footer Action Buttons */}
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                <a
                                    href={getGoogleMapsUrl(box.latitude, box.longitude)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-teal-700"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    Buka Lokasi
                                </a>

                                <Link
                                    href={`/core-guide/${box.id}`}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition-all group-hover:bg-teal-700 group-hover:text-white"
                                >
                                    <span>Matriks Trakea</span>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </div>
                    ))}

                    {filteredBoxes.length === 0 && jointBoxes.length > 0 && (
                        <div className="col-span-full py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                            <p className="text-xs">Tidak ada Joint Box yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo;.</p>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL TAMBAH JOINT BOX */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto no-scrollbar">
                    <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto no-scrollbar">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-base text-slate-900">
                                Tambah Joint Box Baru
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitNewBox} className="mt-4 space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Nama / Kode Joint Box *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: JB-MHS-03"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Tipe Closure
                                    </label>
                                    <CustomSelect
                                        options={closureOptions}
                                        value={formData.closure_type}
                                        onChange={(val) =>
                                            setFormData({ ...formData, closure_type: val as JointBox["closure_type"] })
                                        }
                                        size="sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Wilayah / Cluster
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Mojoroto"
                                        value={formData.cluster_area}
                                        onChange={(e) => setFormData({ ...formData, cluster_area: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        No. Tiang
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="TIANG-45"
                                        value={formData.pole_number}
                                        onChange={(e) => setFormData({ ...formData, pole_number: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Kapasitas Core
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.capacity_cores}
                                        onChange={(e) =>
                                            setFormData({ ...formData, capacity_cores: parseInt(e.target.value) || 24 })
                                        }
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Jumlah Tray
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.tray_count}
                                        onChange={(e) =>
                                            setFormData({ ...formData, tray_count: parseInt(e.target.value) || 1 })
                                        }
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Latitude
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.latitude}
                                        onChange={(e) =>
                                            setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })
                                        }
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Longitude
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.longitude}
                                        onChange={(e) =>
                                            setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })
                                        }
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Catatan Tambahan
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Catatan kondisi slack kabel, posisi baki, dll."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs disabled:opacity-50"
                                >
                                    {saving ? "Menyimpan..." : "Simpan Joint Box"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL EDIT JOINT BOX */}
            {editingBox && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto no-scrollbar">
                    <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto no-scrollbar">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-base text-slate-900">
                                Edit Joint Box
                            </h3>
                            <button
                                type="button"
                                onClick={() => setEditingBox(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitEditBox} className="mt-4 space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Nama / Kode Joint Box *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Tipe Closure
                                    </label>
                                    <CustomSelect
                                        options={closureOptions}
                                        value={editFormData.closure_type}
                                        onChange={(val) =>
                                            setEditFormData({ ...editFormData, closure_type: val as JointBox["closure_type"] })
                                        }
                                        size="sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Wilayah / Cluster
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.cluster_area}
                                        onChange={(e) => setEditFormData({ ...editFormData, cluster_area: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        No. Tiang
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.pole_number}
                                        onChange={(e) => setEditFormData({ ...editFormData, pole_number: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Kapasitas Core
                                    </label>
                                    <input
                                        type="number"
                                        value={editFormData.capacity_cores}
                                        onChange={(e) =>
                                            setEditFormData({ ...editFormData, capacity_cores: parseInt(e.target.value) || 24 })
                                        }
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Jumlah Tray
                                    </label>
                                    <input
                                        type="number"
                                        value={editFormData.tray_count}
                                        onChange={(e) =>
                                            setEditFormData({ ...editFormData, tray_count: parseInt(e.target.value) || 1 })
                                        }
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Latitude
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={editFormData.latitude}
                                        onChange={(e) =>
                                            setEditFormData({ ...editFormData, latitude: parseFloat(e.target.value) || 0 })
                                        }
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Longitude
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={editFormData.longitude}
                                        onChange={(e) =>
                                            setEditFormData({ ...editFormData, longitude: parseFloat(e.target.value) || 0 })
                                        }
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Catatan Tambahan
                                </label>
                                <textarea
                                    rows={2}
                                    value={editFormData.notes}
                                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingBox(null)}
                                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs disabled:opacity-50"
                                >
                                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI HAPUS */}
            {deletingBox && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 text-center">
                        <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                            <Trash2 className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-base text-slate-900">
                            Hapus Joint Box?
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Apakah Anda yakin ingin menghapus <strong>{deletingBox.name}</strong>? Seluruh data matriks splicing pada closure ini akan ikut terhapus.
                        </p>

                        <div className="mt-5 flex items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={() => setDeletingBox(null)}
                                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteConfirm}
                                disabled={saving}
                                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs disabled:opacity-50"
                            >
                                {saving ? "Menghapus..." : "Ya, Hapus Joint Box"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
