export interface FiberColor {
    number: number;
    name: string;
    hex: string;
    textColor: string;
}

export const TIA598_COLORS: FiberColor[] = [
    { number: 1, name: "Biru", hex: "#2563EB", textColor: "#FFFFFF" },
    { number: 2, name: "Oranye", hex: "#F97316", textColor: "#FFFFFF" },
    { number: 3, name: "Hijau", hex: "#16A34A", textColor: "#FFFFFF" },
    { number: 4, name: "Cokelat", hex: "#78350F", textColor: "#FFFFFF" },
    { number: 5, name: "Slate / Abu-abu", hex: "#64748B", textColor: "#FFFFFF" },
    { number: 6, name: "Putih", hex: "#F8FAFC", textColor: "#0F172A" },
    { number: 7, name: "Merah", hex: "#DC2626", textColor: "#FFFFFF" },
    { number: 8, name: "Hitam", hex: "#18181B", textColor: "#FFFFFF" },
    { number: 9, name: "Kuning", hex: "#EAB308", textColor: "#0F172A" },
    { number: 10, name: "Ungu", hex: "#9333EA", textColor: "#FFFFFF" },
    { number: 11, name: "Pink", hex: "#EC4899", textColor: "#FFFFFF" },
    { number: 12, name: "Toska / Aqua", hex: "#06B6D4", textColor: "#FFFFFF" },
];

export function getCoreAndTubeColor(coreIndex: number) {
    // coreIndex dimulai dari 1
    const tubeIndex = Math.ceil(coreIndex / 12);
    const colorInTube = ((coreIndex - 1) % 12) + 1;

    const tubeColor = TIA598_COLORS[(tubeIndex - 1) % 12];
    const coreColor = TIA598_COLORS[colorInTube - 1];

    return {
        tubeNumber: tubeIndex,
        tubeColor,
        coreNumberInTube: colorInTube,
        coreColor,
    };
}