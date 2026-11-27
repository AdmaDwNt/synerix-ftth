import { createClient } from "@supabase/supabase-js";

export interface FeatureFlagItem {
    id?: string;
    key: string;
    label: string;
    category: "LAYANAN" | "OPERASIONAL" | "SECURITY";
    is_enabled: boolean;
    description?: string;
    updated_by?: string;
    updated_at?: string;
}

export const DEFAULT_FEATURE_FLAGS: Record<string, FeatureFlagItem> = {
    BETA_TOPOLOGI_JARINGAN: {
        key: "BETA_TOPOLOGI_JARINGAN",
        label: "Topologi Jaringan (Mapping GIS)",
        category: "LAYANAN",
        is_enabled: true,
        description: "Visualisasi node ODP dan persebaran jalur optik GIS",
    },
    BETA_MANAGEMENT_CORE: {
        key: "BETA_MANAGEMENT_CORE",
        label: "Management Core Fiber",
        category: "LAYANAN",
        is_enabled: true,
        description: "Standar kode warna TIA-598 dan kalkulator tube core",
    },
    BETA_IP_MANAGEMENT: {
        key: "BETA_IP_MANAGEMENT",
        label: "IP Management",
        category: "LAYANAN",
        is_enabled: true,
        description: "Manajemen alokasi IP perangkat jaringan",
    },
    BETA_LAPORAN_JARINGAN: {
        key: "BETA_LAPORAN_JARINGAN",
        label: "Laporan Jaringan",
        category: "LAYANAN",
        is_enabled: true,
        description: "Monitoring uplink dan performa bandwidth",
    },
    BETA_DATA_PELANGGAN: {
        key: "BETA_DATA_PELANGGAN",
        label: "Data Pelanggan",
        category: "LAYANAN",
        is_enabled: true,
        description: "Arsip dan profil pelanggan Billingnesia",
    },
    BETA_LEMBARAN_STAFF: {
        key: "BETA_LEMBARAN_STAFF",
        label: "Lembaran Staff (Shifts & Roster)",
        category: "LAYANAN",
        is_enabled: true,
        description: "Jadwal shift bulanan teknisi, NOC, dan magang PSG",
    },
    BETA_INPUT_TIKET_HARIAN: {
        key: "BETA_INPUT_TIKET_HARIAN",
        label: "Input Tiket Harian (Work Logs)",
        category: "LAYANAN",
        is_enabled: true,
        description: "Pelaporan pekerjaan teknis lapangan",
    },
    BETA_RIWAYAT_TIKET: {
        key: "BETA_RIWAYAT_TIKET",
        label: "Riwayat Tiket Shift",
        category: "LAYANAN",
        is_enabled: true,
        description: "Rekapitulasi penerimaan dan penanganan tiket per shift",
    },
    BETA_CATATAN_SHEET: {
        key: "BETA_CATATAN_SHEET",
        label: "Catatan Sheet NOC",
        category: "LAYANAN",
        is_enabled: true,
        description: "Dokumentasi spreadsheet interaktif multi-tab",
    },
    BETA_NOTION_NOTES: {
        key: "BETA_NOTION_NOTES",
        label: "Catatan Bebas (Notion-Style)",
        category: "OPERASIONAL",
        is_enabled: true,
        description: "Editor blok catatan teknis OLT/MikroTik CLI bebas",
    },
    BETA_JADWAL_BACKUP: {
        key: "BETA_JADWAL_BACKUP",
        label: "Jadwal Backup Perangkat",
        category: "LAYANAN",
        is_enabled: true,
        description: "Jadwal otomatisasi backup konfigurasi router/OLT",
    },
    BETA_WA_TEMPLATES: {
        key: "BETA_WA_TEMPLATES",
        label: "Template Chat WhatsApp Cepat",
        category: "OPERASIONAL",
        is_enabled: true,
        description: "Modal template pesan cepat komunikasi pelanggan",
    },
};

function getSupabaseServerClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Mendapatkan seluruh status feature flags dari DB (dengan fallback default)
 */
export async function getAllFeatureFlags(): Promise<Record<string, FeatureFlagItem>> {
    try {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase.from("feature_flags").select("*");

        if (data && !error && data.length > 0) {
            const flagsMap: Record<string, FeatureFlagItem> = { ...DEFAULT_FEATURE_FLAGS };
            data.forEach((row) => {
                flagsMap[row.key] = {
                    ...flagsMap[row.key],
                    ...row,
                };
            });
            return flagsMap;
        }
    } catch (err) {
        console.warn("Gagal membaca feature flags dari DB, menggunakan default:", err);
    }

    return DEFAULT_FEATURE_FLAGS;
}

/**
 * Memperbarui status ON/OFF satu feature flag
 */
export async function updateFeatureFlag(
    key: string,
    isEnabled: boolean,
    updatedBy?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = getSupabaseServerClient();
        const defaultInfo = DEFAULT_FEATURE_FLAGS[key];

        const payload: Record<string, any> = {
            key,
            label: defaultInfo?.label || key,
            category: defaultInfo?.category || "LAYANAN",
            is_enabled: isEnabled,
            description: defaultInfo?.description || "",
            updated_by: updatedBy || "Superadmin",
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from("feature_flags")
            .upsert(payload, { onConflict: "key" });

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error(`Gagal update feature flag ${key}:`, err);
        return { success: false, error: err?.message || "Gagal update feature flag." };
    }
}
