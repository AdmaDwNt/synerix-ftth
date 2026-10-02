import { FiberColorToken, CalculatedCoreInfo } from "@/lib/types/coreGuide";

// Urutan baku 12 Warna Standar Internasional TIA-598
export const TIA598_COLORS: FiberColorToken[] = [
    {
        number: 1,
        nameId: "Biru",
        nameEn: "Blue",
        hex: "#2563EB",
        bgClass: "bg-blue-600",
        textClass: "text-white",
    },
    {
        number: 2,
        nameId: "Oranye",
        nameEn: "Orange",
        hex: "#EA580C",
        bgClass: "bg-orange-600",
        textClass: "text-white",
    },
    {
        number: 3,
        nameId: "Hijau",
        nameEn: "Green",
        hex: "#16A34A",
        bgClass: "bg-green-600",
        textClass: "text-white",
    },
    {
        number: 4,
        nameId: "Cokelat",
        nameEn: "Brown",
        hex: "#854D0E",
        bgClass: "bg-amber-900",
        textClass: "text-white",
    },
    {
        number: 5,
        nameId: "Abu-Abu (Slate)",
        nameEn: "Slate",
        hex: "#64748B",
        bgClass: "bg-slate-500",
        textClass: "text-white",
    },
    {
        number: 6,
        nameId: "Putih",
        nameEn: "White",
        hex: "#F8FAFC",
        bgClass: "bg-slate-50",
        textClass: "text-slate-800",
        borderClass: "border border-slate-300 shadow-sm",
    },
    {
        number: 7,
        nameId: "Merah",
        nameEn: "Red",
        hex: "#DC2626",
        bgClass: "bg-red-600",
        textClass: "text-white",
    },
    {
        number: 8,
        nameId: "Hitam",
        nameEn: "Black",
        hex: "#0F172A",
        bgClass: "bg-slate-900",
        textClass: "text-white",
        borderClass: "border border-slate-700",
    },
    {
        number: 9,
        nameId: "Kuning",
        nameEn: "Yellow",
        hex: "#EAB308",
        bgClass: "bg-yellow-400",
        textClass: "text-slate-900",
    },
    {
        number: 10,
        nameId: "Ungu",
        nameEn: "Violet",
        hex: "#9333EA",
        bgClass: "bg-purple-600",
        textClass: "text-white",
    },
    {
        number: 11,
        nameId: "Merah Muda (Pink)",
        nameEn: "Rose / Pink",
        hex: "#EC4899",
        bgClass: "bg-pink-500",
        textClass: "text-white",
    },
    {
        number: 12,
        nameId: "Toska (Aqua)",
        nameEn: "Aqua / Turquoise",
        hex: "#06B6D4",
        bgClass: "bg-cyan-500",
        textClass: "text-slate-950 font-semibold",
    },
];

/**
 * Mengambil token warna berdasarkan indeks 1-12
 */
export function getFiberColor(colorIndex: number): FiberColorToken {
    // Tangani modulo jika lebih dari 12
    const normalized = ((colorIndex - 1) % 12 + 12) % 12;
    return TIA598_COLORS[normalized];
}

/**
 * Menghitung posisi Tube dan Core dalam Tube dari Nomor Core Global (misal core 28 -> Tube 3 Hijau, Core 4 Cokelat)
 */
export function calculateCoreFromGlobal(globalCore: number): CalculatedCoreInfo {
    const validCore = Math.max(1, Math.floor(globalCore));
    const tubeNumber = Math.floor((validCore - 1) / 12) + 1;
    const coreNumberInTube = ((validCore - 1) % 12) + 1;

    return {
        globalCore: validCore,
        tubeNumber,
        tubeColor: getFiberColor(tubeNumber),
        coreNumberInTube,
        coreColor: getFiberColor(coreNumberInTube),
    };
}

/**
 * Menghitung nomor core global dari Tube dan Core dalam Tube (misal Tube 3, Core 4 -> Core 28)
 */
export function calculateGlobalFromTubeAndCore(tubeNumber: number, coreInTube: number): number {
    const validTube = Math.max(1, Math.floor(tubeNumber));
    const validCoreInTube = Math.min(12, Math.max(1, Math.floor(coreInTube)));
    return (validTube - 1) * 12 + validCoreInTube;
}
