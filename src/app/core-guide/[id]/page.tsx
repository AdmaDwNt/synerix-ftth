"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    MapPin,
    Layers,
    Camera,
    ExternalLink,
    Lock,
    CheckCircle2,
    AlertTriangle,
    Image as ImageIcon,
    RefreshCw
} from "lucide-react";
import { JointBox, JointBoxSplice, CoreStatus } from "@/lib/types/coreGuide";
import { createClient } from "@/lib/supabase/client";
import { getGoogleMapsUrl } from "@/lib/ftth/distance";
import JointingMatrixTable from "@/components/core-guide/JointingMatrixTable";

export default function JointBoxDetailPage() {
    const params = useParams();
    const boxId = params?.id as string;
    const supabase = createClient();

    const [jointBox, setJointBox] = useState<JointBox | null>(null);
    const [splices, setSplices] = useState<JointBoxSplice[]>([]);
    const [loading, setLoading] = useState(true);
    const [trayPhotoUrl, setTrayPhotoUrl] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    // Fetch detail Joint Box & Splices
    useEffect(() => {
        if (!boxId) return;

        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch Box from Supabase
                const { data: boxData } = await supabase
                    .from("joint_boxes")
                    .select("*")
                    .eq("id", boxId)
                    .single();

                if (boxData) {
                    setJointBox(boxData as JointBox);
                    setTrayPhotoUrl(boxData.tray_photo_url || null);
                } else {
                    setJointBox(null);
                }

                // Fetch Splices
                const { data: spliceData } = await supabase
                    .from("joint_box_splices")
                    .select("*")
                    .eq("joint_box_id", boxId)
                    .order("tray_number", { ascending: true })
                    .order("in_core_global", { ascending: true });

                if (spliceData) {
                    setSplices(spliceData as JointBoxSplice[]);
                } else {
                    setSplices([]);
                }
            } catch (err) {
                console.error("Error loading joint box detail:", err);
                setJointBox(null);
                setSplices([]);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [boxId]);

    // Handler Add Splice
    const handleAddSplice = async (newSplice: Omit<JointBoxSplice, "id">) => {
        const payload: JointBoxSplice = {
            ...newSplice,
            id: crypto.randomUUID(),
        };

        try {
            await supabase.from("joint_box_splices").insert([payload]);
        } catch (err) {
            console.warn("Gagal simpan ke Supabase, simpan lokal:", err);
        }

        setSplices((prev) => [...prev, payload]);
    };

    // Handler Update Splice Status
    const handleUpdateSpliceStatus = async (id: string, newStatus: CoreStatus) => {
        try {
            await supabase
                .from("joint_box_splices")
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq("id", id);
        } catch (err) {
            console.warn("Gagal update status di Supabase:", err);
        }

        setSplices((prev) =>
            prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
        );
    };

    // Handler Delete Splice
    const handleDeleteSplice = async (id: string) => {
        try {
            await supabase.from("joint_box_splices").delete().eq("id", id);
        } catch (err) {
            console.warn("Gagal delete di Supabase:", err);
        }

        setSplices((prev) => prev.filter((s) => s.id !== id));
    };

    // Handler Upload Foto Baki
    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingPhoto(true);
        // Local preview simulation
        const previewUrl = URL.createObjectURL(file);
        setTrayPhotoUrl(previewUrl);

        // Update di supabase
        try {
            supabase
                .from("joint_boxes")
                .update({ tray_photo_url: previewUrl })
                .eq("id", boxId);
        } catch (e) {
            console.warn(e);
        }
        setUploadingPhoto(false);
    };

    if (loading || !jointBox) {
        return (
            <div className="min-h-screen bg-synerix-bg flex items-center justify-center p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <RefreshCw className="h-5 w-5 animate-spin text-teal-600" />
                    Memuat Matriks Trakea Closure...
                </div>
            </div>
        );
    }

    // Hitung status core
    const activeCores = splices.filter((s) => s.status === "ACTIVE").length;
    const spareCores = splices.filter((s) => s.status === "SPARE").length;
    const damagedCores = splices.filter((s) => s.status === "DAMAGED").length;

    return (
        <main className="min-h-screen bg-synerix-bg pb-24">
            {/* Header Detail Box */}
            <div className="bg-white border-b border-synerix-border">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Link
                            href="/core-guide"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-teal-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-all"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Kembali ke Daftar Closure
                        </Link>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                                    {jointBox.closure_type.replace("_", " ")}
                                </span>
                                <span className="text-xs font-semibold text-slate-500">
                                    Area {jointBox.cluster_area}
                                </span>
                            </div>

                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                                {jointBox.name}
                            </h1>

                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                    Tiang: <strong>{jointBox.pole_number || "Tidak tercatat"}</strong>
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Layers className="h-3.5 w-3.5 text-slate-400" />
                                    Kapasitas: <strong>{jointBox.capacity_cores} Core ({jointBox.tray_count} Baki)</strong>
                                </span>
                                <span>•</span>
                                <a
                                    href={getGoogleMapsUrl(jointBox.latitude, jointBox.longitude)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-teal-700 hover:underline font-medium"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    Navigasi GPS
                                </a>
                            </div>
                        </div>

                        {/* Status Counter Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center">
                                <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 justify-center">
                                    <Lock className="h-3 w-3" /> Active
                                </div>
                                <div className="text-lg font-extrabold font-mono">{activeCores} Core</div>
                            </div>
                            <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-center">
                                <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 justify-center">
                                    <CheckCircle2 className="h-3 w-3" /> Spare
                                </div>
                                <div className="text-lg font-extrabold font-mono">{spareCores} Core</div>
                            </div>
                            <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-800 text-center">
                                <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 justify-center">
                                    <AlertTriangle className="h-3 w-3" /> Damaged
                                </div>
                                <div className="text-lg font-extrabold font-mono">{damagedCores} Core</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="w-full px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
                {/* Visual Dokumentasi Foto Tray Fisik */}
                <div className="bg-white rounded-2xl border border-synerix-border p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 shrink-0">
                            <Camera className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Dokumentasi Visual Baki (Tray Splicing)
                            </h3>
                            <p className="text-xs text-slate-500">
                                Rekam susunan kabel/trakea fisik baki agar teknisi maintenance berikutnya tidak perlu meraba tray.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto">
                        {trayPhotoUrl ? (
                            <a
                                href={trayPhotoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                <ImageIcon className="h-3.5 w-3.5 text-teal-600" />
                                Lihat Foto Baki
                            </a>
                        ) : null}

                        <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-xs active:scale-95 transition-all">
                            <Camera className="h-3.5 w-3.5" />
                            <span>
                                {uploadingPhoto
                                    ? "Mengunggah..."
                                    : trayPhotoUrl
                                    ? "Ganti Foto"
                                    : "Upload / Ambil Foto Baki"}
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handlePhotoUpload}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                {/* Splicing Matrix Table */}
                <JointingMatrixTable
                    jointBox={jointBox}
                    splices={splices}
                    onAddSplice={handleAddSplice}
                    onUpdateSpliceStatus={handleUpdateSpliceStatus}
                    onDeleteSplice={handleDeleteSplice}
                />
            </div>
        </main>
    );
}
