import { createClient } from "@supabase/supabase-js";

export interface ScraperConfig {
    id?: string;
    target_name: string;
    base_url: string;
    search_endpoint: string;
    dismantle_endpoint: string;
    detail_endpoint: string;
    ticket_detail_endpoint: string;
    timeout_ms: number;
    request_interval_ms: number;
    auth_credentials?: Record<string, any>;
    is_active: boolean;
    last_tested_at?: string;
    last_test_status?: "SUCCESS" | "FAILED";
    last_test_message?: string;
}

export const DEFAULT_SCRAPER_CONFIG: ScraperConfig = {
    target_name: "BILLINGNESIA",
    base_url: process.env.BILLINGNESIA_BASE_URL || "https://billing.at-in.net",
    search_endpoint: "/admin/pelanggan/tablePelanggan",
    dismantle_endpoint: "/admin/tiket/tableTiket",
    detail_endpoint: "/admin/pelanggan/detail",
    ticket_detail_endpoint: "/admin/tiket/detailtiket",
    timeout_ms: 30000,
    request_interval_ms: 500,
    is_active: true,
};

function getSupabaseServerClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Mengambil konfigurasi scraper aktif dari database Supabase (dengan fallback ke .env)
 */
export async function getActiveScraperConfig(targetName: string = "BILLINGNESIA"): Promise<ScraperConfig> {
    try {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from("scraper_configs")
            .select("*")
            .eq("target_name", targetName)
            .maybeSingle();

        if (data && !error) {
            return {
                ...DEFAULT_SCRAPER_CONFIG,
                ...data,
                base_url: (data.base_url || DEFAULT_SCRAPER_CONFIG.base_url).replace(/\/+$/, ""),
            };
        }
    } catch (err) {
        console.warn("Gagal mengambil konfigurasi scraper dari DB, menggunakan fallback default:", err);
    }

    return {
        ...DEFAULT_SCRAPER_CONFIG,
        base_url: (process.env.BILLINGNESIA_BASE_URL || DEFAULT_SCRAPER_CONFIG.base_url).replace(/\/+$/, ""),
    };
}

/**
 * Menyimpan pembaruan konfigurasi scraper ke database Supabase
 */
export async function updateScraperConfig(
    config: Partial<ScraperConfig>,
    updatedBy?: string
): Promise<{ success: boolean; data?: ScraperConfig; error?: string }> {
    try {
        const supabase = getSupabaseServerClient();
        const cleanBaseUrl = (config.base_url || DEFAULT_SCRAPER_CONFIG.base_url).replace(/\/+$/, "");

        const payload: Record<string, any> = {
            target_name: config.target_name || "BILLINGNESIA",
            base_url: cleanBaseUrl,
            search_endpoint: config.search_endpoint || DEFAULT_SCRAPER_CONFIG.search_endpoint,
            dismantle_endpoint: config.dismantle_endpoint || DEFAULT_SCRAPER_CONFIG.dismantle_endpoint,
            detail_endpoint: config.detail_endpoint || DEFAULT_SCRAPER_CONFIG.detail_endpoint,
            ticket_detail_endpoint: config.ticket_detail_endpoint || DEFAULT_SCRAPER_CONFIG.ticket_detail_endpoint,
            timeout_ms: config.timeout_ms || 30000,
            request_interval_ms: config.request_interval_ms || 500,
            is_active: config.is_active !== undefined ? config.is_active : true,
            updated_by: updatedBy || "Superadmin",
            updated_at: new Date().toISOString(),
        };

        if (config.auth_credentials) {
            payload.auth_credentials = config.auth_credentials;
        }

        const { data, error } = await supabase
            .from("scraper_configs")
            .upsert(payload, { onConflict: "target_name" })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return { success: true, data };
    } catch (err: any) {
        console.error("Gagal menyimpan konfigurasi scraper ke DB:", err);
        return { success: false, error: err?.message || "Gagal menyimpan konfigurasi ke database." };
    }
}

/**
 * Melakukan uji konektivitas ke Domain/Base URL Billingnesia
 */
export async function testBillingnesiaConnection(baseUrl?: string): Promise<{
    reachable: boolean;
    latency_ms: number;
    status_code?: number;
    message: string;
}> {
    const targetUrl = (baseUrl || (await getActiveScraperConfig()).base_url).replace(/\/+$/, "");
    const startTime = Date.now();

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`${targetUrl}/login`, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SynerixConnectionChecker/2.0",
                "x-synerix-internal-call": "true",
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const latency = Date.now() - startTime;

        const reachable = res.status < 500;
        const message = reachable
            ? `Koneksi berhasil! Server merespons dalam ${latency}ms (HTTP ${res.status}).`
            : `Server merespons dengan kesalahan HTTP ${res.status}.`;

        // Simpan hasil tes ke database jika memungkinkan
        try {
            const supabase = getSupabaseServerClient();
            await supabase
                .from("scraper_configs")
                .update({
                    last_tested_at: new Date().toISOString(),
                    last_test_status: reachable ? "SUCCESS" : "FAILED",
                    last_test_message: message,
                })
                .eq("target_name", "BILLINGNESIA");
        } catch {}

        return {
            reachable,
            latency_ms: latency,
            status_code: res.status,
            message,
        };
    } catch (err: any) {
        const latency = Date.now() - startTime;
        const isAbort = err?.name === "AbortError";
        const message = isAbort
            ? "Koneksi timeout (lebih dari 10 detik). Domain tidak dapat dijangkau."
            : `Gagal terhubung ke ${targetUrl}: ${err?.message || "Jaringan tidak tersedia"}`;

        return {
            reachable: false,
            latency_ms: latency,
            message,
        };
    }
}
