"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { DismantleTask, DismantleStatus } from "@/lib/types/dismantle";
import { formatDistance, getGoogleMapsUrl, getWazeUrl } from "@/lib/ftth/distance";
import { ExternalLink, Phone } from "lucide-react";

// Marker SVG Generator per Status Dismantle
const createDismantleMarkerIcon = (colorHex: string, label: string) => {
    const svgMarker = `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${colorHex}" width="34" height="34" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
        <path d="M12 0C7.03 0 3 4.03 3 9c0 5.25 7.03 13.52 11.23 18.06.4.43 1.14.43 1.54 0C20.97 22.52 28 14.25 28 9c0-4.97-4.03-9-9-9zm0 13c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
      </svg>
      <span style="position: absolute; top: 6px; font-size: 9px; font-weight: bold; color: #FFFFFF; font-family: monospace;">
        ${label}
      </span>
    </div>`;

    return L.divIcon({
        className: "custom-dismantle-marker",
        html: svgMarker,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
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
    userLocation,
}: DismantleMapProps) {
    // Default center Kediri (-7.8231, 111.9174)
    const defaultCenter: [number, number] = userLocation
        ? [userLocation.lat, userLocation.lng]
        : tasks.length > 0 && tasks[0].latitude
        ? [tasks[0].latitude, tasks[0].longitude]
        : [-7.8231, 111.9174];

    return (
        <div className="w-full h-[500px] sm:h-[600px] rounded-2xl overflow-hidden border border-synerix-border shadow-xs relative">
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
                {tasks.map((task) => (
                    <Marker
                        key={task.id}
                        position={[task.latitude, task.longitude]}
                        icon={ICONS[task.status] || ICONS.QUEUE}
                    >
                        <Popup>
                            <div className="p-1 font-sans max-w-[240px]">
                                <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
                                        {task.customer_id}
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

                                <h4 className="font-bold text-xs text-slate-900 leading-tight">
                                    {task.customer_name}
                                </h4>
                                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                                    {task.address}
                                </p>

                                <div className="mt-1.5 pt-1 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                                    <span>Cluster: <strong>{task.cluster_name}</strong></span>
                                    {task.distance_meters !== undefined && (
                                        <span className="font-bold text-teal-700">
                                            {formatDistance(task.distance_meters)}
                                        </span>
                                    )}
                                </div>

                                {task.phone_number && (
                                    <div className="mt-1 text-[11px]">
                                        <a
                                            href={`https://wa.me/${task.phone_number.replace(/^0/, "62").replace(/\D/g, "")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-teal-700 hover:underline flex items-center gap-1 font-medium"
                                        >
                                            <Phone className="h-3 w-3" />
                                            Hubungi Pelanggan
                                        </a>
                                    </div>
                                )}

                                {/* Action Buttons di Popup */}
                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                                    <a
                                        href={getGoogleMapsUrl(task.latitude, task.longitude)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] px-2 py-1 rounded bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 flex items-center gap-1"
                                    >
                                        <ExternalLink className="h-2.5 w-2.5" />
                                        Maps
                                    </a>
                                    <a
                                        href={getWazeUrl(task.latitude, task.longitude)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] px-2 py-1 rounded bg-cyan-50 text-cyan-700 font-semibold hover:bg-cyan-100 flex items-center gap-1"
                                    >
                                        <ExternalLink className="h-2.5 w-2.5" />
                                        Waze
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => onOpenStatusModal(task)}
                                        className="text-[10px] px-2 py-1 rounded bg-teal-700 text-white font-semibold hover:bg-teal-800"
                                    >
                                        Ubah Status
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
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
