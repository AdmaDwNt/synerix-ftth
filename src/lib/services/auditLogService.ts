import { createClient } from "@supabase/supabase-js";

export type AuditCategory = "DATA_ACTIVITY" | "AUTH_SESSION" | "BOT_INTRUSION";
export type RiskLevel = "INFO" | "WARNING" | "CRITICAL";

export interface StealthAuditLogEntry {
    id?: string;
    user_id?: string;
    username: string;
    action_type: string;
    target_id?: string;
    category?: AuditCategory;
    risk_level?: RiskLevel;
    flagged_bot?: boolean;
    details?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    created_at?: string;
}

function getSupabaseServerClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Mencatat log aktivitas audit stealth secara senyap
 */
export async function logStealthAudit(entry: StealthAuditLogEntry): Promise<void> {
    try {
        const supabase = getSupabaseServerClient();
        const payload = {
            user_id: entry.user_id || null,
            username: entry.username || "ANONYMOUS",
            action_type: entry.action_type,
            target_id: entry.target_id || null,
            category: entry.category || "DATA_ACTIVITY",
            risk_level: entry.risk_level || "INFO",
            flagged_bot: !!entry.flagged_bot,
            details: entry.details || {},
            ip_address: entry.ip_address || "127.0.0.1",
            user_agent: entry.user_agent || "unknown",
            created_at: new Date().toISOString(),
        };

        await supabase.from("user_activity_audit_logs").insert([payload]);
    } catch (err) {
        console.warn("Gagal menulis audit log ke database:", err);
    }
}

/**
 * Memblokir Alamat IP mencurigakan (Langsung oleh Superadmin atau Sistem)
 */
export async function blockIpAddress(
    ipAddress: string,
    reason: string,
    blockedBy: string = "SUPERADMIN",
    riskLevel: RiskLevel = "CRITICAL"
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase.from("blocked_ips").upsert(
            {
                ip_address: ipAddress.trim(),
                reason: reason.trim(),
                risk_level: riskLevel,
                blocked_by: blockedBy,
                created_at: new Date().toISOString(),
            },
            { onConflict: "ip_address" }
        );

        if (error) throw error;

        // Catat ke audit log
        await logStealthAudit({
            username: blockedBy,
            action_type: "BLOCK_IP",
            target_id: ipAddress,
            category: "BOT_INTRUSION",
            risk_level: "CRITICAL",
            details: { reason, ipAddress },
            ip_address: ipAddress,
        });

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err?.message || "Gagal memblokir IP." };
    }
}

/**
 * Membuka blokir Alamat IP
 */
export async function unblockIpAddress(
    ipAddress: string,
    unblockedBy: string = "SUPERADMIN"
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase.from("blocked_ips").delete().eq("ip_address", ipAddress.trim());
        if (error) throw error;

        await logStealthAudit({
            username: unblockedBy,
            action_type: "UNBLOCK_IP",
            target_id: ipAddress,
            category: "BOT_INTRUSION",
            risk_level: "INFO",
            details: { ipAddress },
        });

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err?.message || "Gagal membuka blokir IP." };
    }
}

/**
 * Standard security audit logger helper
 */
export async function logSecurityAudit(options: {
    category: AuditCategory;
    action: string;
    severity?: RiskLevel;
    ipAddress?: string;
    details?: Record<string, any>;
    username?: string;
    targetId?: string;
    flaggedBot?: boolean;
}): Promise<void> {
    await logStealthAudit({
        category: options.category,
        action_type: options.action,
        risk_level: options.severity || "INFO",
        ip_address: options.ipAddress || "127.0.0.1",
        details: options.details || {},
        username: options.username || "SYSTEM",
        target_id: options.targetId,
        flagged_bot: options.flaggedBot,
    });
}

/**
 * Mengambil daftar audit log dengan filter category
 */
export async function getAuditLogs(options?: {
    category?: AuditCategory | 'ALL';
    limit?: number;
    offset?: number;
}) {
    try {
        const supabase = getSupabaseServerClient();
        let query = supabase
            .from("user_activity_audit_logs")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false });

        if (options?.category && options.category !== 'ALL') {
            query = query.eq("category", options.category);
        }

        const limit = options?.limit || 50;
        const offset = options?.offset || 0;
        query = query.range(offset, offset + limit - 1);

        const { data, count, error } = await query;
        if (error) throw error;
        return { logs: data || [], total: count || 0 };
    } catch (err) {
        console.warn("Gagal membaca audit logs:", err);
        return { logs: [], total: 0 };
    }
}

/**
 * Mengambil daftar IP terblokir
 */
export async function getBlockedIps() {
    try {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from("blocked_ips")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (err) {
        return [];
    }
}
