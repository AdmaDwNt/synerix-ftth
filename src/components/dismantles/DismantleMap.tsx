"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { DismantleTask, DismantleStatus } from "@/lib/types/dismantle";
import { formatDistance, getGoogleMapsUrl, getWazeUrl } from "@/lib/ftth/distance";
import { resolveDisplayPhone } from "@/lib/utils/phoneHelper";
import {
    ExternalLink,
    Phone,
    CheckSquare,
    Square,
    Receipt,
    Cpu,
    Cable,
    AlertCircle,
    User,
    Eye
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Marker SVG Generator per Status Dismantle
const createDismantleMarkerIcon = (colorHex: string, label: string) => {
    const svgMarker = `
    <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${colorHex}" width="36" height="36" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
        <path d="M12 0C7.03 0 3 4.03 3 9c0 5.25 7.03 13.52 11.23 18.06.4.43 1.14.43 1.54 0C20.97 22.52 28 14.25 28 9c0-4.97-4.03-9-9-9zm0 13c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
      </svg>
      <span style="position: absolute; top: 6px; font-size: 9px; font-weight: bold; color: #FFFFFF; font-family: monospace;">
        ${label}
      </span>
    </div>`;

    return L.divIcon({
        className: "custom-dismantle-marker",
        html: svgMarker,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38],
    });
};

const ICONS: Record<DismantleStatus, L.DivIcon> = {
    QUEUE: createDismantleMarkerIcon("#EF4444", "Q"),
    IN_PROGRESS: createDismantleMarkerIcon("#F59E0B", "OTW"),
    COMPLETED: createDismantleMarkerIcon("#10B981", "OK"),
    FAILED: createDismantleMarkerIcon("#64748B", "X"),
};

interface DismantleMapProps {
    tasks: DismantleTask[];
    onOpenStatusModal: (task: DismantleTask) => void;
    onOpenCustomerDetail?: (task: DismantleTask) => void;
    userLocation?: { lat: number; lng: number } | null;
}

// User current GPS marker
const userGpsIcon = L.divIcon({
    className: "user-gps-pulse-marker",
    html: `
    <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background-color: rgba(14, 165, 233, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 14px; height: 14px; border-radius: 50%; background-color: #0284C7; border: 2.5px solid #FFFFFF; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

export default function DismantleMap({
    tasks,
    onOpenStatusModal,
    onOpenCustomerDetail,
    userLocation,
}: DismantleMapProps) {
    const supabase = createClient();

    // Local state checklist progres dismantle per tugas (ONT, Kabel, Tagihan)
    const [dismantleProgressMap, setDismantleProgressMap] = useState<
        Record<string, { ont: boolean; cable: boolean; bill: boolean }>
    >({});

    const handleToggleItem = async (taskId: string, itemType: "ont" | "cable" | "bill") => {
        setDismantleProgressMap((prev) => {
            const current = prev[taskId] || { ont: false, cable: false, bill: false };
            const updated = { ...current, [itemType]: !current[itemType] };
            return { ...prev, [taskId]: updated };
        });

        // Simpan catatan penanda ke Supabase
        try {
            const currentObj = dismantleProgressMap[taskId] || { ont: false, cable: false, bill: false };
            const updated = { ...currentObj, [itemType]: !currentObj[itemType] };
            const task = tasks.find((t) => t.id === taskId);
            if (task) {
                const accessories = (task.accessories || []).filter((a) => !a.startsWith("PROGRESS_ITEMS:"));
                accessories.push(`PROGRESS_ITEMS:${JSON.stringify(updated)}`);
                await supabase.from("dismantle_tasks").update({ accessories }).eq("id", taskId);
            }
        } catch (e) {
            console.warn("Gagal update progress item:", e);
        }
    };

    // Center map
    const defaultCenter: [number, number] = userLocation
        ? [userLocation.lat, userLocation.lng]
        : tasks.length > 0 && tasks[0].latitude
        ? [tasks[0].latitude, tasks[0].longitude]
        : [-7.8231, 111.9174];

    return (
        <div className="w-full h-[520px] sm:h-[620px] rounded-2xl overflow-hidden border border-slate-200 shadow-2xs relative">
            <MapContainer
                center={defaultCenter}
                zoom={14}
                scrollWheelZoom={true}
                className="w-full h-full z-10"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Marker Posisi Live GPS Teknisi */}
                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={userGpsIcon}>
                        <Popup>
                            <div className="p-1 font-sans text-xs">
                                <span className="font-bold text-sky-700">📍 Lokasi Anda Saat Ini</span>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                    {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Markers untuk Seluruh Tugas Dismantle */}
                {tasks.map((task) => {
                    // Ambil metadata jika ada
                    let metadata: any = {};
                    const metaStr = task.accessories?.find((a) => a.startsWith("METADATA:"));
                    if (metaStr) {
                        try {
                            metadata = JSON.parse(metaStr.replace("METADATA:", ""));
                        } catch (e) {
                            metadata = {};
                        }
                    }

                    // Ambil saved progress items jika ada
                    const progressStr = task.accessories?.find((a) => a.startsWith("PROGRESS_ITEMS:"));
                    let savedProgress = { ont: false, cable: false, bill: false };
                    if (progressStr) {
                        try {
                            savedProgress = JSON.parse(progressStr.replace("PROGRESS_ITEMS:", ""));
                        } catch (e) {
                            savedProgress = { ont: false, cable: false, bill: false };
                        }
                    }
                    const activeProgress = dismantleProgressMap[task.id] || savedProgress;

                    // Keterangan Indikasi Awal dari Tiket (Poin 34)
                    const indicationText = metadata.ticket_indication || task.failure_reason || (
                        task.unpaid_amount && task.unpaid_amount > 0
                            ? `Dismantle total. Tagihan tertunggak Rp ${task.unpaid_amount.toLocaleString("id-ID")}`
                            : "Dismantle total perangkat ONT & kabel dropcore."
                    );

                    const isBillPaid = activeProgress.bill || (task.unpaid_amount || 0) <= 0;

                    return (
                        <Marker
                            key={task.id}
                            position={[task.latitude, task.longitude]}
                            icon={ICONS[task.status] || ICONS.QUEUE}
                        >
                            {/* Poin 34: Pin diberikan label sesuai nama pelanggan */}
                            <Tooltip direction="top" offset={[0, -36]} opacity={0.9} permanent={false}>
                                <span className="font-bold text-xs text-slate-800">
                                    {task.customer_name}
                                </span>
                            </Tooltip>

                            {/* Poin 34-35: Kotak dialog popup detail ketika pin diklik */}
                            <Popup minWidth={280} maxWidth={320}>
                                <div className="p-1 font-sans text-xs">
                                    {/* 1. Header: ID & Status */}
                                    <div className="flex items-center justify-between gap-1 mb-1.5 pb-1 border-b border-slate-100">
                                        <span className="text-[10px] font-mono font-bold bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded border border-teal-200">
                                            #{task.customer_id}
                                        </span>
                                        <span
                                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                                task.status === "COMPLETED"
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : task.status === "IN_PROGRESS"
                                                    ? "bg-amber-100 text-amber-800"
                                                    : task.status === "FAILED"
                                                    ? "bg-slate-200 text-slate-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {task.status}
                                        </span>
                                    </div>

                                    {/* 2. Nama Pelanggan */}
                                    <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                                        {task.customer_name}
                                    </h4>

                                    {/* 3. Alamat Lengkap Teks (Bukan sharelok koordinat) */}
                                    <div className="mt-1 text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <span className="font-semibold text-slate-700 block text-[10px] uppercase text-slate-400">
                                            Alamat Rumah:
                                        </span>
                                        <span>{task.address}</span>
                                    </div>

                                    {/* 4. No WA */}
                                    {(() => {
                                        const displayPhone = resolveDisplayPhone(task.phone_number || metadata.phone_number_1, metadata.phone_number_2);
                                        if (!displayPhone) return null;
                                        return (
                                            <div className="mt-1.5 text-[11px]">
                                                <a
                                                    href={`https://wa.me/${displayPhone.replace(/^0/, "62").replace(/\D/g, "")}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                                                >
                                                    <Phone className="h-3 w-3 text-emerald-600" />
                                                    <span>WhatsApp: {displayPhone}</span>
                                                </a>
                                            </div>
                                        );
                                    })()}

                                    {/* 5. DAFTAR DISMANTLE & PENANDA PROGRES (Poin 34-35) */}
                                    <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                                                Daftar Dismantle & Checklist:
                                            </span>
                                            {task.ticket_id && (
                                                <span className="text-[9px] font-mono text-amber-800 bg-amber-50 px-1 rounded">
                                                    🎫 {task.ticket_id}
                                                </span>
                                            )}
                                        </div>

                                        {/* Keterangan Indikasi Awal dari Tiket */}
                                        <div className="p-1.5 bg-amber-50/80 rounded border border-amber-200/80 text-[10px] text-amber-900 leading-tight">
                                            <strong>Indikasi:</strong> {indicationText}
                                        </div>

                                        {/* Checklist Item: ONT, Kabel, Tagihan */}
                                        <div className="space-y-1 pt-1">
                                            {/* Item 1: Perangkat ONT */}
                                            <div
                                                onClick={() => handleToggleItem(task.id, "ont")}
                                                className="flex items-center justify-between p-1 rounded hover:bg-slate-50 cursor-pointer text-[11px]"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    {activeProgress.ont ? (
                                                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    ) : (
                                                        <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    )}
                                                    <span className={activeProgress.ont ? "line-through text-slate-400" : "text-slate-800"}>
                                                        Perangkat ONT ({task.device_type || "ZTE F609"})
                                                    </span>
                                                </div>
                                                <span className={`text-[9px] font-bold ${activeProgress.ont ? "text-emerald-700" : "text-slate-400"}`}>
                                                    {activeProgress.ont ? "Sudah Diambil" : "Belum"}
                                                </span>
                                            </div>

                                            {/* Item 2: Kabel Dropcore */}
                                            <div
                                                onClick={() => handleToggleItem(task.id, "cable")}
                                                className="flex items-center justify-between p-1 rounded hover:bg-slate-50 cursor-pointer text-[11px]"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    {activeProgress.cable ? (
                                                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    ) : (
                                                        <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    )}
                                                    <span className={activeProgress.cable ? "line-through text-slate-400" : "text-slate-800"}>
                                                        Kabel Dropcore / Outdoor
                                                    </span>
                                                </div>
                                                <span className={`text-[9px] font-bold ${activeProgress.cable ? "text-emerald-700" : "text-slate-400"}`}>
                                                    {activeProgress.cable ? "Sudah Diambil" : "Belum"}
                                                </span>
                                            </div>

                                            {/* Item 3: Tagihan Tertunggak */}
                                            <div
                                                onClick={() => handleToggleItem(task.id, "bill")}
                                                className="flex items-center justify-between p-1 rounded hover:bg-slate-50 cursor-pointer text-[11px]"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    {isBillPaid ? (
                                                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    ) : (
                                                        <Square className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                                    )}
                                                    <span className={isBillPaid ? "line-through text-slate-400" : "text-rose-700 font-semibold"}>
                                                        Tagihan: Rp {(task.unpaid_amount || 0).toLocaleString("id-ID")}
                                                    </span>
                                                </div>
                                                <span className={`text-[9px] font-bold ${isBillPaid ? "text-emerald-700" : "text-rose-600"}`}>
                                                    {isBillPaid ? "Lunas" : "Jatuh Tempo"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons di Popup */}
                                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                                        {onOpenCustomerDetail && (
                                            <button
                                                type="button"
                                                onClick={() => onOpenCustomerDetail(task)}
                                                className="text-[10px] px-2 py-1 rounded bg-teal-50 text-teal-800 font-semibold hover:bg-teal-100 flex items-center gap-1 cursor-pointer"
                                            >
                                                <Eye className="w-3 h-3 text-teal-700" />
                                                <span>Detail</span>
                                            </button>
                                        )}

                                        <a
                                            href={getGoogleMapsUrl(task.latitude, task.longitude)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] px-2 py-1 rounded bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 flex items-center gap-1"
                                        >
                                            <ExternalLink className="h-2.5 w-2.5" />
                                            Maps
                                        </a>

                                        <button
                                            type="button"
                                            onClick={() => onOpenStatusModal(task)}
                                            className="text-[10px] px-2 py-1 rounded bg-slate-800 text-white font-semibold hover:bg-slate-900 cursor-pointer"
                                        >
                                            Ubah Status
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Legend Peta */}
            <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-xl shadow-md border border-slate-200 text-[10px] font-medium flex items-center gap-3">
                <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Antrean
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Menuju Lokasi
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Selesai
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Gagal
                </span>
            </div>
        </div>
    );
}
