"use client";

import { useState, useEffect } from "react";
import { Box, Sparkles, GitFork } from "lucide-react";
import TIACalculator from "@/components/core-guide/TIACalculator";
import ColorReferenceTable from "@/components/core-guide/ColorReferenceTable";
import SplitterLossReference from "@/components/core-guide/SplitterLossReference";
import JointBoxList from "@/components/core-guide/JointBoxList";
import { JointBox } from "@/lib/types/coreGuide";
import { createClient } from "@/lib/supabase/client";

export default function CoreGuidePage() {
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState<"CALCULATOR" | "SPLITTER" | "JOINT_BOXES">("CALCULATOR");
    const [jointBoxes, setJointBoxes] = useState<JointBox[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch data Joint Box dari Supabase
    const fetchJointBoxes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("joint_boxes")
                .select("*")
                .order("created_at", { ascending: false });

            if (data) {
                setJointBoxes(data as JointBox[]);
            } else if (error) {
                console.error("Error fetching joint boxes from Supabase:", error.message);
                setJointBoxes([]);
            }
        } catch (e) {
            console.error("Error fetching joint boxes:", e);
            setJointBoxes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJointBoxes();
    }, []);

    // Tambah Joint Box Baru
    const handleAddNewBox = async (newBoxData: Partial<JointBox>) => {
        const payload: JointBox = {
            id: crypto.randomUUID(),
            name: newBoxData.name || "JB-BARU",
            closure_type: newBoxData.closure_type || "DOME_CLOSURE",
            cluster_area: newBoxData.cluster_area || "Umum",
            pole_number: newBoxData.pole_number || null,
            latitude: newBoxData.latitude || -7.8182,
            longitude: newBoxData.longitude || 111.9954,
            capacity_cores: newBoxData.capacity_cores || 24,
            tray_count: newBoxData.tray_count || 2,
            notes: newBoxData.notes || null,
            created_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("joint_boxes").insert([payload]);
        if (error) {
            console.error("Gagal simpan ke Supabase:", error.message);
            throw error;
        }

        setJointBoxes((prev) => [payload, ...prev]);
    };

    // Update Joint Box
    const handleUpdateBox = async (id: string, updatedData: Partial<JointBox>) => {
        const { error } = await supabase
            .from("joint_boxes")
            .update({ ...updatedData, updated_at: new Date().toISOString() })
            .eq("id", id);

        if (error) {
            console.error("Gagal update ke Supabase:", error.message);
            throw error;
        }

        setJointBoxes((prev) =>
            prev.map((box) => (box.id === id ? { ...box, ...updatedData } : box))
        );
    };

    // Delete Joint Box
    const handleDeleteBox = async (id: string) => {
        const { error } = await supabase.from("joint_boxes").delete().eq("id", id);
        if (error) {
            console.error("Gagal hapus dari Supabase:", error.message);
            throw error;
        }

        setJointBoxes((prev) => prev.filter((box) => box.id !== id));
    };

    return (
        <main className="min-h-screen bg-synerix-bg pb-24">
            {/* Top Header Banner */}
            <div className="bg-white border-b border-synerix-border">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-synerix-text tracking-tight">
                                Standar TIA-598, Loss Splitter &amp; Joint Box
                            </h1>
                            <p className="text-xs sm:text-sm text-synerix-subtext mt-1 max-w-2xl">
                                Panduan warna core &amp; tube serat optik standar TIA-598, standar loss redaman optical splitter 1:2 s/d 1:16, serta pencatatan digital matriks trakea penyambungan kabel di setiap closure/joint box.
                            </p>
                        </div>

                        {/* Quick Stats Badges */}
                        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                            <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-center">
                                <div className="text-[11px] text-slate-500 font-medium">Warna Standar</div>
                                <div className="text-base font-bold text-slate-900 font-mono">12 TIA</div>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-center">
                                <div className="text-[11px] text-slate-500 font-medium">Splitter PLC</div>
                                <div className="text-base font-bold text-teal-700 font-mono">1:2 - 1:16</div>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-center">
                                <div className="text-[11px] text-slate-500 font-medium">Total Joint Box</div>
                                <div className="text-base font-bold text-slate-800 font-mono">
                                    {jointBoxes.length}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 mt-6 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
                        <button
                            type="button"
                            onClick={() => setActiveTab("CALCULATOR")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                                activeTab === "CALCULATOR"
                                    ? "bg-teal-700 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                        >
                            <Sparkles className="h-4 w-4" />
                            <span>Kalkulator &amp; Acuan TIA-598</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("SPLITTER")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                                activeTab === "SPLITTER"
                                    ? "bg-teal-700 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                        >
                            <GitFork className="h-4 w-4" />
                            <span>Loss Splitter (1:2 - 1:16)</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("JOINT_BOXES")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                                activeTab === "JOINT_BOXES"
                                    ? "bg-teal-700 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                        >
                            <Box className="h-4 w-4" />
                            <span>Daftar Joint Box ({jointBoxes.length})</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="w-full px-4 sm:px-6 lg:px-8 pt-5">
                {activeTab === "CALCULATOR" && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <TIACalculator />
                        <ColorReferenceTable />

                        {/* Banner Cepat ke Modul Splitter */}
                        <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-teal-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-xs">
                                    <GitFork className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">
                                        Standar Redaman &amp; Loss Splitter Optik (1:2 s/d 1:16)
                                    </h4>
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        Tersedia tabel toleransi redaman PLC splitter, rumus matematis, serta simulator output power untuk ONT rumah pelanggan.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveTab("SPLITTER")}
                                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer shadow-xs transition-all hover:scale-[1.02] active:scale-95"
                            >
                                Buka Modul Loss Splitter &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "SPLITTER" && (
                    <div className="animate-in fade-in duration-200">
                        <SplitterLossReference />
                    </div>
                )}

                {activeTab === "JOINT_BOXES" && (
                    <div className="animate-in fade-in duration-200">
                        <JointBoxList
                            jointBoxes={jointBoxes}
                            onAddNewBox={handleAddNewBox}
                            onUpdateBox={handleUpdateBox}
                            onDeleteBox={handleDeleteBox}
                            loading={loading}
                        />
                    </div>
                )}
            </div>
        </main>
    );
}
