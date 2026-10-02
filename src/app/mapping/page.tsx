"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import {
    MapPin,
    Plus,
    Layers,
    RefreshCw,
    Navigation,
    CheckCircle2,
    X,
    Trash2,
    UploadCloud,
    Filter,
    Activity,
    Compass,
    Ruler,
    Network,
    Table as TableIcon,
    Map as MapIcon,
    CircleDot,
    Cpu,
    Check,
    RotateCcw,
    Maximize2,
    Minimize2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CustomSelect, { SelectOption } from "@/components/ui/CustomSelect";
import {
    KmlLayer,
    NetworkNode,
    NetworkLine,
    GisCategoryFilter,
    NodeType,
    BasemapType,
} from "@/lib/types/gis";
import CategoryFilterBar from "@/components/gis/CategoryFilterBar";
import KmlUploadModal from "@/components/gis/KmlUploadModal";
import LayerManagerDrawer from "@/components/gis/LayerManagerDrawer";
import NodeDetailInspector from "@/components/gis/NodeDetailInspector";
import NodeEditModal from "@/components/gis/NodeEditModal";
import LineEditModal from "@/components/gis/LineEditModal";
import CableCreateModal from "@/components/gis/CableCreateModal";
import NearbyOdpModal from "@/components/gis/NearbyOdpModal";
import OdpPortMatrixModal from "@/components/gis/OdpPortMatrixModal";
import GisSearchBox from "@/components/gis/GisSearchBox";
import BasemapSwitcher from "@/components/gis/BasemapSwitcher";
import GisDataTable from "@/components/gis/GisDataTable";
import { deleteGisLayer, toggleGisLayerVisibility } from "@/lib/gis/gisIngestService";
import { calculateHaversineDistance, formatDistance } from "@/lib/ftth/distance";

// Leaflet Map loaded Client-Side only (no-SSR)
const FTTHMap = dynamic(() => import("@/components/maps/FTTHMap"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full min-h-[420px] sm:min-h-[580px] rounded-2xl bg-slate-100 border border-synerix-border flex items-center justify-center text-synerix-subtext text-xs font-medium">
            <RefreshCw className="h-5 w-5 animate-spin text-teal-600 mr-2" />
            Memuat Peta GIS FTTH & Marker Cluster...
        </div>
    ),
});

export default function MappingPage() {
    const supabase = createClient();
    const formRef = useRef<HTMLDivElement>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Data States
    const [layers, setLayers] = useState<KmlLayer[]>([]);
    const [nodes, setNodes] = useState<NetworkNode[]>([]);
    const [lines, setLines] = useState<NetworkLine[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // View & Basemap Modes
    const [viewMode, setViewMode] = useState<"MAP" | "TABLE">("MAP");
    const [basemap, setBasemap] = useState<BasemapType>("OSM");
    const [showCoverageRadius, setShowCoverageRadius] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<GisCategoryFilter>("ALL");

    // Interactive Drawing Tool (Cable Polyline)
    const [isDrawingLine, setIsDrawingLine] = useState(false);
    const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
    const [isSaveCableOpen, setIsSaveCableOpen] = useState(false);

    // Ruler Measure Tool
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [measuringPoints, setMeasuringPoints] = useState<[number, number][]>([]);

    // Navigation & Fly-To
    const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
    const [userGpsLocation, setUserGpsLocation] = useState<{ lat: number; lng: number } | null>(null);

    // Selected Items for Inspector & Modals
    const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
    const [selectedLine, setSelectedLine] = useState<NetworkLine | null>(null);
    const [editingNode, setEditingNode] = useState<NetworkNode | null>(null);
    const [editingLine, setEditingLine] = useState<NetworkLine | null>(null);
    const [portMatrixNode, setPortMatrixNode] = useState<NetworkNode | null>(null);

    // UI Modals
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isLayerDrawerOpen, setIsLayerDrawerOpen] = useState(false);
    const [isNearbyOdpOpen, setIsNearbyOdpOpen] = useState(false);

    // Manual Tagging Form State
    const [isAdding, setIsAdding] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [type, setType] = useState<NodeType>("ODP");
    const [description, setDescription] = useState("");
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [selectedLayerId, setSelectedLayerId] = useState<string>("");

    const nodeTypeOptions: SelectOption[] = [
        { value: "ODP", label: "ODP (Optical Distribution Point)", colorDot: "bg-emerald-500" },
        { value: "ODC", label: "ODC (Optical Distribution Cabinet)", colorDot: "bg-amber-500" },
        { value: "POP", label: "POP (Point of Presence)", colorDot: "bg-teal-700" },
        { value: "SERVER", label: "SERVER / Headend", colorDot: "bg-cyan-500" },
        { value: "TIANG", label: "Tiang Fiber / Pole", colorDot: "bg-slate-500" },
        { value: "CUSTOMER", label: "Rumah Pelanggan", colorDot: "bg-blue-500" },
        { value: "DISMANTLE", label: "Titik Dismantle", colorDot: "bg-red-500" },
        { value: "CLOSURE", label: "Joint Box / Closure", colorDot: "bg-indigo-500" },
    ];

    // 1. Fetch seluruh data GIS (Layers, Nodes, Lines)
    const fetchAllGisData = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const { data: layerData, error: layerError } = await supabase
                .from("kml_layers")
                .select("*")
                .order("created_at", { ascending: false });
            if (layerError) throw new Error(`Layers: ${layerError.message}`);
            if (layerData) setLayers(layerData);

            const { data: nodeData, error: nodeError } = await supabase
                .from("network_nodes")
                .select("*")
                .order("created_at", { ascending: false });
            if (nodeError) throw new Error(`Nodes: ${nodeError.message}`);
            if (nodeData) setNodes(nodeData);

            const { data: lineData, error: lineError } = await supabase
                .from("network_lines")
                .select("*")
                .order("created_at", { ascending: false });
            if (lineError) throw new Error(`Lines: ${lineError.message}`);
            if (lineData) setLines(lineData);
        } catch (err: any) {
            const message = err?.message || "Gagal memuat data GIS. Periksa koneksi internet Anda.";
            console.error("Error fetching GIS data:", err);
            setFetchError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllGisData();
    }, []);

    // Filter nodes & lines berdasarkan layer yang visible
    const visibleLayerIds = useMemo(() => {
        return new Set(layers.filter((l) => l.is_visible !== false).map((l) => l.id));
    }, [layers]);

    const visibleNodes = useMemo(() => {
        return nodes.filter((n) => !n.layer_id || visibleLayerIds.has(n.layer_id));
    }, [nodes, visibleLayerIds]);

    const visibleLines = useMemo(() => {
        return lines.filter((l) => l.layer_id && visibleLayerIds.has(l.layer_id));
    }, [lines, visibleLayerIds]);

    // Handle Toggle Visibility Layer
    const handleToggleLayer = async (layerId: string, isVisible: boolean) => {
        setLayers((prev) =>
            prev.map((l) => (l.id === layerId ? { ...l, is_visible: isVisible } : l))
        );
        try {
            await toggleGisLayerVisibility(supabase, layerId, isVisible);
        } catch (err: any) {
            console.error("Gagal toggle layer:", err);
            fetchAllGisData();
        }
    };

    // Handle Hapus Layer
    const handleDeleteLayer = async (layerId: string) => {
        try {
            await deleteGisLayer(supabase, layerId);
            setLayers((prev) => prev.filter((l) => l.id !== layerId));
            setNodes((prev) => prev.filter((n) => n.layer_id !== layerId));
            setLines((prev) => prev.filter((l) => l.layer_id !== layerId));
            setSelectedNode(null);
            setSelectedLine(null);
        } catch (err: any) {
            alert("Gagal menghapus layer: " + err.message);
        }
    };

    // Saat klik titik pada peta
    const handleMapClick = (lat: number, lng: number) => {
        // A. Mode Menggambar Jalur Kabel
        if (isDrawingLine) {
            setDrawingPoints((prev) => [...prev, [lat, lng]]);
            return;
        }

        // B. Mode Mengukur Jarak (Ruler)
        if (isMeasuring) {
            setMeasuringPoints((prev) => [...prev, [lat, lng]]);
            return;
        }

        // C. Default: Mode Tagging Titik Baru
        setSelectedNode(null);
        setSelectedLine(null);
        setLatitude(lat);
        setLongitude(lng);
        setIsAdding(true);

        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
    };

    // Hitung total panjang saat mode gambar kabel
    const drawingTotalMeters = useMemo(() => {
        if (drawingPoints.length < 2) return 0;
        let total = 0;
        for (let i = 1; i < drawingPoints.length; i++) {
            total += calculateHaversineDistance(
                drawingPoints[i - 1][0],
                drawingPoints[i - 1][1],
                drawingPoints[i][0],
                drawingPoints[i][1]
            );
        }
        return total;
    }, [drawingPoints]);

    // Hitung total panjang saat mode ruler
    const measuringTotalMeters = useMemo(() => {
        if (measuringPoints.length < 2) return 0;
        let total = 0;
        for (let i = 1; i < measuringPoints.length; i++) {
            total += calculateHaversineDistance(
                measuringPoints[i - 1][0],
                measuringPoints[i - 1][1],
                measuringPoints[i][0],
                measuringPoints[i][1]
            );
        }
        return total;
    }, [measuringPoints]);

    // Ambil GPS Lokasi Teknisi Saat Ini
    const handleGetMyLocation = () => {
        if (!navigator.geolocation) {
            alert("Browser atau perangkat Anda tidak mendukung fitur Geolocation.");
            return;
        }
        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setUserGpsLocation({ lat, lng });
                setLatitude(lat);
                setLongitude(lng);
                setFlyToTarget({ lat, lng, zoom: 18 });
                setGettingLocation(false);
            },
            (err) => {
                setGettingLocation(false);
                alert("Gagal membaca lokasi GPS: " + err.message);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Toggle Fullscreen (Mendukung Desktop Fullscreen API & Mobile Fallback)
    const toggleFullscreen = async () => {
        if (!isFullscreen) {
            setIsFullscreen(true);
            try {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                } else if ((document.documentElement as any).webkitRequestFullscreen) {
                    await (document.documentElement as any).webkitRequestFullscreen();
                }
            } catch {
                // Fallback CSS fullscreen tetap aktif
            }
        } else {
            setIsFullscreen(false);
            try {
                if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
                    if (document.exitFullscreen) {
                        await document.exitFullscreen();
                    } else if ((document as any).webkitExitFullscreen) {
                        await (document as any).webkitExitFullscreen();
                    }
                }
            } catch {
                // ignore
            }
        }
        setTimeout(() => {
            window.dispatchEvent(new Event("resize"));
        }, 150);
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isNative = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
            if (!isNative && isFullscreen) {
                setIsFullscreen(false);
                setTimeout(() => {
                    window.dispatchEvent(new Event("resize"));
                }, 150);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isFullscreen) {
                setIsFullscreen(false);
                if (document.fullscreenElement && document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                }
                setTimeout(() => {
                    window.dispatchEvent(new Event("resize"));
                }, 150);
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isFullscreen]);

    // Simpan Manual Node ke Supabase
    const handleSaveManualNode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return alert("Nama perangkat wajib diisi!");
        if (latitude === null || longitude === null) return alert("Pilih koordinat pada peta!");

        setSaving(true);
        try {
            const { data, error } = await supabase
                .from("network_nodes")
                .insert({
                    name: name.trim(),
                    type,
                    status: "ACTIVE",
                    description: description.trim() || null,
                    latitude,
                    longitude,
                    layer_id: selectedLayerId || null,
                    capacity: type === "ODC" ? 144 : type === "ODP" ? 8 : 0,
                    used_ports: 0,
                })
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setNodes((prev) => [data, ...prev]);
                setIsAdding(false);
                setName("");
                setDescription("");
                setLatitude(null);
                setLongitude(null);
            }
        } catch (err: any) {
            alert("Gagal menyimpan titik: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    // Hapus Single Node
    const handleDeleteSingleNode = async (nodeId: string) => {
        try {
            const { error } = await supabase.from("network_nodes").delete().eq("id", nodeId);
            if (error) throw error;
            setNodes((prev) => prev.filter((n) => n.id !== nodeId));
            if (selectedNode?.id === nodeId) setSelectedNode(null);
        } catch (err: any) {
            alert("Gagal menghapus node: " + err.message);
        }
    };

    // Batch Delete Nodes
    const handleBatchDeleteNodes = async (nodeIds: string[]) => {
        try {
            const { error } = await supabase.from("network_nodes").delete().in("id", nodeIds);
            if (error) throw error;
            setNodes((prev) => prev.filter((n) => !nodeIds.includes(n.id)));
        } catch (err: any) {
            alert("Gagal menghapus beberapa node: " + err.message);
        }
    };

    // Helper Form Tagging Manual (Dapat dipakai di sidebar biasa maupun modal saat Fullscreen)
    const renderTaggingFormContent = (isModal: boolean = false) => (
        <div className={`p-4 sm:p-5 rounded-2xl bg-white border-2 border-teal-500 shadow-xl space-y-3 animate-in fade-in duration-200 ${isModal ? "w-full max-w-sm max-h-[85vh] overflow-y-auto" : ""}`}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-synerix-text text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4 text-teal-700" /> Tagging Manual Titik Baru
                </h3>
                <button
                    type="button"
                    onClick={() => {
                        setIsAdding(false);
                        setLatitude(null);
                        setLongitude(null);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <form onSubmit={handleSaveManualNode} className="space-y-3 text-xs">
                <div>
                    <label className="text-slate-700 block mb-1 font-semibold">
                        Nama Titik / ID Perangkat <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Misal: ODP-MHS-04"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                </div>

                <div>
                    <label className="text-slate-700 block mb-1 font-semibold">
                        Tipe Perangkat Jaringan
                    </label>
                    <CustomSelect
                        options={nodeTypeOptions}
                        value={type}
                        onChange={(val) => setType(val as NodeType)}
                    />
                </div>

                <div>
                    <label className="text-slate-700 block mb-1 font-semibold">
                        Koordinat GPS (Otomatis)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="text"
                            readOnly
                            value={latitude !== null ? latitude.toFixed(6) : ""}
                            placeholder="Latitude"
                            className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-mono text-[11px]"
                        />
                        <input
                            type="text"
                            readOnly
                            value={longitude !== null ? longitude.toFixed(6) : ""}
                            placeholder="Longitude"
                            className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-mono text-[11px]"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-slate-700 block mb-1 font-semibold">
                        Catatan / Patokan Lokasi
                    </label>
                    <textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Contoh: Depan Toko Berkah, Tiang PLN"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                </div>

                <div className="flex items-center gap-2 pt-1">
                    <button
                        type="button"
                        onClick={() => {
                            setIsAdding(false);
                            setLatitude(null);
                            setLongitude(null);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 py-2 px-3 rounded-xl bg-teal-700 text-white font-semibold hover:bg-teal-800 transition-colors disabled:opacity-50"
                    >
                        {saving ? "Menyimpan..." : "Simpan Titik"}
                    </button>
                </div>
            </form>
        </div>
    );

    return (
        <div className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-3">
            {/* 1. Header Topbar & Aksi Cepat */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-synerix-border shadow-xs">
                <div>
                    <h1 className="text-base sm:text-lg font-black text-synerix-text flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-teal-700 shrink-0" />
                        <span>GIS Mapping FTTH (Advanced Suite)</span>
                    </h1>
                    <p className="text-xs text-synerix-subtext mt-0.5">
                        Suite operasional spasial: Full CRUD, visualizer port, drawing tools, & citra satelit
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {/* Toggle View: Peta vs Tabel */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setViewMode("MAP")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                viewMode === "MAP"
                                    ? "bg-white text-teal-800 shadow-xs"
                                    : "text-slate-600 hover:text-slate-800"
                            }`}
                        >
                            <MapIcon className="h-3.5 w-3.5" />
                            <span>Peta</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("TABLE")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                viewMode === "TABLE"
                                    ? "bg-white text-teal-800 shadow-xs"
                                    : "text-slate-600 hover:text-slate-800"
                            }`}
                        >
                            <TableIcon className="h-3.5 w-3.5" />
                            <span>Tabel Aset</span>
                        </button>
                    </div>

                    {/* Tombol Import KML/KMZ */}
                    <button
                        type="button"
                        onClick={() => setIsUploadOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                    >
                        <UploadCloud className="w-4 h-4" />
                        <span>Import KML</span>
                    </button>

                    {/* Tombol Layer Manager */}
                    <button
                        type="button"
                        onClick={() => setIsLayerDrawerOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                    >
                        <Layers className="w-4 h-4 text-teal-700" />
                        <span>Layers ({layers.length})</span>
                    </button>

                    {/* Tombol GPS Saya */}
                    <button
                        type="button"
                        onClick={handleGetMyLocation}
                        disabled={gettingLocation}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 disabled:opacity-50"
                        title="Lokasi GPS Teknisi"
                    >
                        <Navigation className={`w-3.5 h-3.5 text-teal-600 ${gettingLocation ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">GPS Saya</span>
                    </button>

                    {/* Tombol Fullscreen (Desktop & Mobile) */}
                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
                            isFullscreen
                                ? "bg-amber-500 text-white border-amber-600 hover:bg-amber-600"
                                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                        }`}
                        title={isFullscreen ? "Keluar Layar Penuh (ESC)" : "Layar Penuh (Fullscreen)"}
                    >
                        {isFullscreen ? (
                            <>
                                <Minimize2 className="w-3.5 h-3.5 text-white" />
                                <span className="hidden sm:inline">Normal</span>
                            </>
                        ) : (
                            <>
                                <Maximize2 className="w-3.5 h-3.5 text-teal-700" />
                                <span className="hidden sm:inline">Fullscreen</span>
                            </>
                        )}
                    </button>

                    {/* Tombol Refresh */}
                    <button
                        type="button"
                        onClick={fetchAllGisData}
                        disabled={loading}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center transition-all shadow-xs active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-600" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Error Banner — visible di mobile untuk debugging */}
            {fetchError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <div className="flex-1">
                        <p className="text-sm font-bold text-red-700 flex items-center gap-1.5">
                            <X className="w-4 h-4 shrink-0" />
                            Gagal Memuat Data
                        </p>
                        <p className="text-xs text-red-600 mt-0.5 break-all">{fetchError}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => fetchAllGisData()}
                            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Coba Lagi
                        </button>
                        <button
                            type="button"
                            onClick={() => setFetchError(null)}
                            className="px-2 py-1.5 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-100 transition-all"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}

            {/* 2. Fast Category Filter Bar */}
            <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-synerix-border shadow-xs">
                <CategoryFilterBar
                    activeCategory={selectedCategory}
                    onChange={setSelectedCategory}
                    nodes={visibleNodes}
                />
            </div>

            {/* 3. Main Workspace: Map View vs Table View */}
            {viewMode === "TABLE" ? (
                <GisDataTable
                    nodes={visibleNodes}
                    lines={visibleLines}
                    onSelectNodeOnMap={(n) => {
                        setViewMode("MAP");
                        setSelectedNode(n);
                        setFlyToTarget({ lat: n.latitude, lng: n.longitude, zoom: 18 });
                    }}
                    onSelectLineOnMap={(l) => {
                        setViewMode("MAP");
                        setSelectedLine(l);
                        if (l.coordinates.length > 0) {
                            setFlyToTarget({ lat: l.coordinates[0][0], lng: l.coordinates[0][1], zoom: 17 });
                        }
                    }}
                    onEditNode={(n) => setEditingNode(n)}
                    onEditLine={(l) => setEditingLine(l)}
                    onDeleteNode={handleDeleteSingleNode}
                    onBatchDeleteNodes={handleBatchDeleteNodes}
                />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Viewport Peta GIS */}
                    <div
                        ref={mapContainerRef}
                        className={`${
                            isFullscreen
                                ? "fixed inset-0 z-[80] w-screen h-screen bg-slate-900 overflow-hidden flex flex-col"
                                : "lg:col-span-3 h-[460px] sm:h-[580px] lg:h-[680px] rounded-2xl overflow-hidden border border-synerix-border shadow-sm relative"
                        }`}
                    >
                        {/* A. Floating Omnibox Search & Proximity Tools */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 sm:right-auto z-20 flex items-center gap-1.5 sm:gap-2">
                            <div className="flex-1 sm:flex-initial min-w-0">
                                <GisSearchBox
                                    nodes={visibleNodes}
                                    lines={visibleLines}
                                    onSelectTarget={({ lat, lng, node, line }) => {
                                        setFlyToTarget({ lat, lng, zoom: 18 });
                                        if (node) setSelectedNode(node);
                                        if (line) setSelectedLine(line);
                                    }}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsNearbyOdpOpen(true)}
                                className="px-2.5 sm:px-3 py-2 rounded-xl bg-white/95 backdrop-blur-md border border-synerix-border shadow-md hover:bg-white text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                                title="Temukan ODP Terdekat dari Lokasi Saya"
                            >
                                <Compass className="h-4 w-4 text-teal-600" />
                                <span className="hidden sm:inline">ODP Terdekat</span>
                            </button>
                        </div>

                        {/* B. Floating Tool Controls: Top-Right on Desktop, Vertical Thumb Dock on Mobile */}
                        <div className="absolute top-14 right-2.5 sm:top-2.5 sm:right-2.5 z-20 flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-2">
                            {/* Tombol Fullscreen (Desktop & Mobile) */}
                            <button
                                type="button"
                                onClick={toggleFullscreen}
                                className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95 ${
                                    isFullscreen
                                        ? "bg-amber-600 text-white border-amber-700 hover:bg-amber-700"
                                        : "bg-white/95 backdrop-blur-md border-synerix-border text-slate-700 hover:bg-white"
                                }`}
                                title={isFullscreen ? "Keluar Layar Penuh (ESC)" : "Layar Penuh (Fullscreen)"}
                            >
                                {isFullscreen ? (
                                    <>
                                        <Minimize2 className="h-4 w-4 text-white" />
                                        <span className="hidden md:inline">Normal</span>
                                    </>
                                ) : (
                                    <>
                                        <Maximize2 className="h-4 w-4 text-teal-700" />
                                        <span className="hidden md:inline">Fullscreen</span>
                                    </>
                                )}
                            </button>

                            {/* Basemap Switcher */}
                            <BasemapSwitcher currentBasemap={basemap} onChange={setBasemap} />

                            {/* Toggle Radius 150m */}
                            <button
                                type="button"
                                onClick={() => setShowCoverageRadius((prev) => !prev)}
                                className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95 ${
                                    showCoverageRadius
                                        ? "bg-emerald-700 text-white border-emerald-800"
                                        : "bg-white/95 backdrop-blur-md border-synerix-border text-slate-700 hover:bg-white"
                                }`}
                                title="Tampilkan Lingkaran Radius Dropcore 150m pada ODP"
                            >
                                <CircleDot className="h-4 w-4 text-emerald-500" />
                                <span className="hidden md:inline">Radius 150m</span>
                            </button>

                            {/* Mode Ukur Jarak (Ruler) */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (isMeasuring) {
                                        setIsMeasuring(false);
                                        setMeasuringPoints([]);
                                    } else {
                                        setIsMeasuring(true);
                                        setIsDrawingLine(false);
                                        setIsAdding(false);
                                        setMeasuringPoints([]);
                                    }
                                }}
                                className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95 ${
                                    isMeasuring
                                        ? "bg-rose-600 text-white border-rose-700 animate-pulse"
                                        : "bg-white/95 backdrop-blur-md border-synerix-border text-slate-700 hover:bg-white"
                                }`}
                                title="Ukur Jarak Tarikan Dropcore"
                            >
                                <Ruler className="h-4 w-4 text-rose-500" />
                                <span className="hidden md:inline">
                                    {isMeasuring ? "Tutup Ukur" : "Ukur Jarak"}
                                </span>
                            </button>

                            {/* Mode Gambar Jalur Kabel */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (isDrawingLine) {
                                        setIsDrawingLine(false);
                                        setDrawingPoints([]);
                                    } else {
                                        setIsDrawingLine(true);
                                        setIsMeasuring(false);
                                        setIsAdding(false);
                                        setDrawingPoints([]);
                                    }
                                }}
                                className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95 ${
                                    isDrawingLine
                                        ? "bg-teal-700 text-white border-teal-800 animate-pulse"
                                        : "bg-white/95 backdrop-blur-md border-synerix-border text-slate-700 hover:bg-white"
                                }`}
                                title="Mode Gambar Tarikan Kabel Fiber Baru"
                            >
                                <Network className="h-4 w-4 text-sky-600" />
                                <span className="hidden md:inline">
                                    {isDrawingLine ? "Keluar Gambar" : "Gambar Kabel"}
                                </span>
                            </button>
                        </div>

                        {/* Fullscreen Floating Indicator Pill on Top Center */}
                        {isFullscreen && (
                            <div className="hidden sm:flex absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-300 rounded-full text-[11px] items-center gap-1.5 shadow-lg pointer-events-none">
                                <Maximize2 className="h-3 w-3 text-teal-400" />
                                <span>Mode Layar Penuh &bull; Tekan <strong>ESC</strong> untuk keluar</span>
                            </div>
                        )}

                        {/* C. Floating Drawing Bar Status Banner */}
                        {isDrawingLine && (
                            <div className="absolute bottom-4 left-3 right-3 sm:bottom-auto sm:top-16 sm:left-auto sm:right-3 sm:w-96 z-20 bg-teal-900/90 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-teal-500/30 flex items-center justify-between gap-2 text-xs animate-in slide-in-from-top duration-150">
                                <div>
                                    <div className="font-bold flex items-center gap-1.5">
                                        <Network className="h-4 w-4 text-teal-300" />
                                        <span>Mode Menggambar Kabel</span>
                                    </div>
                                    <p className="text-[11px] text-teal-200 mt-0.5 font-mono">
                                        {drawingPoints.length} Titik &bull; {formatDistance(drawingTotalMeters)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    {drawingPoints.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setIsSaveCableOpen(true)}
                                            className="px-3 py-1.5 rounded-xl bg-teal-400 text-teal-950 font-bold hover:bg-teal-300 transition-colors shadow-xs"
                                        >
                                            Simpan Jalur
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsDrawingLine(false);
                                            setDrawingPoints([]);
                                        }}
                                        className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* D. Floating Ruler Bar Banner */}
                        {isMeasuring && (
                            <div className="absolute bottom-4 left-3 right-3 sm:bottom-auto sm:top-16 sm:left-auto sm:right-3 sm:w-88 z-20 bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-rose-500/30 flex items-center justify-between gap-2 text-xs animate-in slide-in-from-top duration-150">
                                <div>
                                    <div className="font-bold flex items-center gap-1.5 text-rose-300">
                                        <Ruler className="h-4 w-4" />
                                        <span>Mode Penggaris Jarak</span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 mt-0.5 font-mono">
                                        Total: <strong className="text-white text-sm">{formatDistance(measuringTotalMeters)}</strong>
                                    </p>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setMeasuringPoints([])}
                                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-slate-200"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMeasuring(false);
                                            setMeasuringPoints([]);
                                        }}
                                        className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* In-Fullscreen Tagging Modal Overlay */}
                        {isFullscreen && isAdding && (
                            <div className="fixed inset-0 z-[95] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
                                {renderTaggingFormContent(true)}
                            </div>
                        )}

                        {/* Peta FTTH Leaflet Component */}
                        <div className="w-full h-full relative">
                            <FTTHMap
                                nodes={visibleNodes}
                                lines={visibleLines}
                                activeCategory={selectedCategory}
                                basemap={basemap}
                                showCoverageRadius={showCoverageRadius}
                                isDrawingLine={isDrawingLine}
                                drawingPoints={drawingPoints}
                                isMeasuring={isMeasuring}
                                measuringPoints={measuringPoints}
                                flyToTarget={flyToTarget}
                                selectedLocation={latitude && longitude ? { lat: latitude, lng: longitude } : null}
                                onMapClick={handleMapClick}
                                onSelectNode={(node) => {
                                    setSelectedNode(node);
                                    setSelectedLine(null);
                                }}
                                onSelectLine={(line) => {
                                    setSelectedLine(line);
                                    setSelectedNode(null);
                                }}
                                onDeleteNode={handleDeleteSingleNode}
                            />
                        </div>

                        {/* Node & Line Inspector Bottom Sheet */}
                        <NodeDetailInspector
                            selectedNode={selectedNode}
                            selectedLine={selectedLine}
                            onClose={() => {
                                setSelectedNode(null);
                                setSelectedLine(null);
                            }}
                            onDeleteNode={handleDeleteSingleNode}
                            onEditNode={(n) => setEditingNode(n)}
                            onEditLine={(l) => setEditingLine(l)}
                        />
                    </div>

                    {/* Sisi Kanan: Panel Form Tagging Titik atau Ringkasan Cepat */}
                    <div ref={formRef} className={`${isFullscreen ? "hidden" : "lg:col-span-1 space-y-4"}`}>
                        {!isFullscreen && isAdding ? (
                            renderTaggingFormContent(false)
                        ) : (
                            <div className="bg-white p-4 rounded-2xl border border-synerix-border shadow-xs space-y-3 text-xs">
                                <h3 className="font-bold text-synerix-text flex items-center gap-2 border-b border-slate-100 pb-2">
                                    <Activity className="w-4 h-4 text-teal-700" />
                                    <span>Command Center GIS</span>
                                </h3>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className="text-slate-500">File Layer Terdaftar</span>
                                        <span className="font-bold text-slate-800 font-mono">
                                            {layers.length} Layer
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className="text-slate-500">Titik Perangkat Aktif</span>
                                        <span className="font-bold text-teal-700 font-mono">
                                            {visibleNodes.length} Titik
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className="text-slate-500">Jalur Kabel Fiber</span>
                                        <span className="font-bold text-sky-700 font-mono">
                                            {visibleLines.length} Jalur
                                        </span>
                                    </div>
                                </div>

                                {selectedNode && selectedNode.type === "ODP" && (
                                    <button
                                        type="button"
                                        onClick={() => setPortMatrixNode(selectedNode)}
                                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Cpu className="w-4 h-4" />
                                        <span>Kelola Port: {selectedNode.name}</span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setIsUploadOpen(true)}
                                    className="w-full py-2.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold flex items-center justify-center gap-2 transition-colors mt-2"
                                >
                                    <UploadCloud className="w-4 h-4" />
                                    <span>Import File KML/KMZ</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Edit Node (CRUD) */}
            <NodeEditModal
                isOpen={!!editingNode}
                node={editingNode}
                layers={layers}
                supabase={supabase}
                onClose={() => setEditingNode(null)}
                onSaved={(updated) => {
                    setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
                    if (selectedNode?.id === updated.id) setSelectedNode(updated);
                }}
                onDeleted={(id) => {
                    setNodes((prev) => prev.filter((n) => n.id !== id));
                    if (selectedNode?.id === id) setSelectedNode(null);
                }}
            />

            {/* Modal Edit Kabel (CRUD) */}
            <LineEditModal
                isOpen={!!editingLine}
                line={editingLine}
                layers={layers}
                supabase={supabase}
                onClose={() => setEditingLine(null)}
                onSaved={(updated) => {
                    setLines((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
                    if (selectedLine?.id === updated.id) setSelectedLine(updated);
                }}
                onDeleted={(id) => {
                    setLines((prev) => prev.filter((l) => l.id !== id));
                    if (selectedLine?.id === id) setSelectedLine(null);
                }}
            />

            {/* Modal Simpan Jalur Kabel Baru (Hasil Drawing) */}
            <CableCreateModal
                isOpen={isSaveCableOpen}
                onClose={() => {
                    setIsSaveCableOpen(false);
                    setIsDrawingLine(false);
                    setDrawingPoints([]);
                }}
                coordinates={drawingPoints}
                totalLengthMeters={drawingTotalMeters}
                layers={layers}
                supabase={supabase}
                onCreated={(newLine) => {
                    setLines((prev) => [newLine, ...prev]);
                    setIsDrawingLine(false);
                    setDrawingPoints([]);
                }}
            />

            {/* Modal ODP Terdekat (Proximity) */}
            <NearbyOdpModal
                isOpen={isNearbyOdpOpen}
                onClose={() => setIsNearbyOdpOpen(false)}
                userLocation={userGpsLocation}
                nodes={visibleNodes}
                onSelectOdp={(odp) => {
                    setSelectedNode(odp);
                    setFlyToTarget({ lat: odp.latitude, lng: odp.longitude, zoom: 18 });
                }}
                onRequestGps={handleGetMyLocation}
            />

            {/* Modal Matriks Port ODP (8/16 Port) */}
            <OdpPortMatrixModal
                isOpen={!!portMatrixNode}
                node={portMatrixNode}
                supabase={supabase}
                onClose={() => setPortMatrixNode(null)}
                onPortsUpdated={fetchAllGisData}
            />

            {/* Modal Import KML/KMZ */}
            <KmlUploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onSuccess={fetchAllGisData}
            />

            {/* Layer Manager Drawer */}
            <LayerManagerDrawer
                isOpen={isLayerDrawerOpen}
                onClose={() => setIsLayerDrawerOpen(false)}
                layers={layers}
                onToggleLayer={handleToggleLayer}
                onDeleteLayer={handleDeleteLayer}
                onOpenUpload={() => setIsUploadOpen(true)}
            />
        </div>
    );
}