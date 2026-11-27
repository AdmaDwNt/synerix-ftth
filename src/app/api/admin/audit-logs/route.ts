/**
 * ============================================================================
 * MODUL       : Audit Trail Senyap (Superadmin API)
 * FILE        : src/app/api/admin/audit-logs/route.ts
 * DESKRIPSI   : API Route khusus Superadmin untuk memantau seluruh aktivitas
 *               rekan kerja secara real-time dan senyap (Stealth Monitoring).
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BAGIAN 1: IMPORT & DEPENDENCIES
// ----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/auth/session";

// ----------------------------------------------------------------------------
// BAGIAN 2: DEFINISI TIPE & INTERFACE (TYPESCRIPT CONTRACT)
// ----------------------------------------------------------------------------
export interface AuditLogItem {
    id: string;
    user_id: string;
    username: string;
    action_type: string;
    target_id?: string;
    details?: Record<string, unknown>;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
}

// ----------------------------------------------------------------------------
// BAGIAN 3: KONSTANTA & KONFIGURASI
// ----------------------------------------------------------------------------
export const dynamic = "force-dynamic";

function getSupabaseServerClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key, { auth: { persistSession: false } });
}

// ----------------------------------------------------------------------------
// BAGIAN 4: LOGIKA UTAMA (CORE BUSINESS LOGIC - GET)
// ----------------------------------------------------------------------------
export async function GET(req: NextRequest) {
    try {
        await requireAuth("superadmin");

        const { searchParams } = new URL(req.url);
        const usernameFilter = searchParams.get("username")?.trim();
        const actionFilter = searchParams.get("action")?.trim();
        const categoryFilter = searchParams.get("category")?.trim();
        const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

        const supabase = getSupabaseServerClient();

        let query = supabase
            .from("user_activity_audit_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (usernameFilter && usernameFilter !== "ALL") {
            query = query.eq("username", usernameFilter);
        }

        if (actionFilter && actionFilter !== "ALL") {
            query = query.eq("action_type", actionFilter);
        }

        if (categoryFilter && categoryFilter !== "ALL") {
            query = query.eq("category", categoryFilter);
        }

        const [{ data: logs, error }, { data: uniqueUsers }, { data: blockedIps }] = await Promise.all([
            query,
            supabase
                .from("synerix_users")
                .select("username, full_name, role")
                .order("username", { ascending: true }),
            supabase
                .from("blocked_ips")
                .select("*")
                .order("created_at", { ascending: false }),
        ]);

        if (error) {
            console.error("Gagal mengambil audit logs:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            logs: logs || [],
            users: uniqueUsers || [],
            blockedIps: blockedIps || [],
        });
    } catch (err) {
        return NextResponse.json(
            { success: false, error: err instanceof Error ? err.message : "Akses ditolak." },
            { status: 403 }
        );
    }
}

// ----------------------------------------------------------------------------
// BAGIAN 5: HELPER / UTILITY FUNCTIONS
// ----------------------------------------------------------------------------
// Tidak ada helper tambahan pada route ini

// ----------------------------------------------------------------------------
// BAGIAN 6: EXPORT & PUBLIC API
// ----------------------------------------------------------------------------
// GET Handler diekspor untuk Next.js Route Handler
