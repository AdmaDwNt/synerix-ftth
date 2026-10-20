/**
 * ============================================================================
 * MODUL       : Manajemen Pengguna (Superadmin API)
 * FILE        : src/app/api/admin/users/route.ts
 * DESKRIPSI   : API Route khusus Superadmin untuk CRUD pengguna: melihat daftar,
 *               menambah teknisi baru, mengubah role, toggle aktif/nonaktif,
 *               reset password, dan mengatur hak akses rute menu.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BAGIAN 1: IMPORT & DEPENDENCIES
// ----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, recordStealthAuditLog, UserRole } from "@/lib/auth/session";
import { encryptPassword } from "@/lib/auth/crypto";

// ----------------------------------------------------------------------------
// BAGIAN 2: DEFINISI TIPE & INTERFACE (TYPESCRIPT CONTRACT)
// ----------------------------------------------------------------------------
interface CreateUserPayload {
    username: string;
    password: string;
    full_name: string;
    role?: UserRole;
    allowed_routes?: string[];
}

interface UpdateUserPayload {
    id: string;
    full_name?: string;
    role?: UserRole;
    is_active?: boolean;
    allowed_routes?: string[];
    new_password?: string;
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
// BAGIAN 4: LOGIKA UTAMA (CORE BUSINESS LOGIC - CRUD)
// ----------------------------------------------------------------------------

/**
 * GET: Mengambil daftar seluruh pengguna terdaftar (Khusus Superadmin)
 */
export async function GET() {
    try {
        const auth = await requireAuth("superadmin");
        const supabase = getSupabaseServerClient();

        const { data: users, error } = await supabase
            .from("synerix_users")
            .select("id, username, full_name, role, is_active, allowed_routes, last_login_at, created_at, updated_at")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Gagal mengambil data users:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            users: users || [],
            currentUserRole: auth.user.role,
        });
    } catch (err) {
        return NextResponse.json(
            { success: false, error: err instanceof Error ? err.message : "Akses ditolak." },
            { status: 403 }
        );
    }
}

/**
 * POST: Menambahkan teknisi / pengguna baru oleh Superadmin
 */
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth("superadmin");
        const body: CreateUserPayload = await req.json();

        const rawUsername = (body.username || "").trim();
        const rawPassword = (body.password || "").trim();
        const rawFullName = (body.full_name || "").trim();
        const assignedRole: UserRole = body.role || "technician";
        const allowedRoutes = body.allowed_routes || [
            "/work-logs",
            "/dismantles",
            "/mapping",
            "/core-guide",
            "/shifts",
        ];

        if (!rawUsername || !rawPassword || !rawFullName) {
            return NextResponse.json(
                { success: false, error: "Username, password, dan nama lengkap wajib diisi." },
                { status: 400 }
            );
        }

        const normalizedUsername = rawUsername.toLowerCase();
        const supabase = getSupabaseServerClient();

        // 1. Cek apakah username sudah ada
        const { data: existing } = await supabase
            .from("synerix_users")
            .select("id")
            .eq("username", normalizedUsername)
            .maybeSingle();

        if (existing) {
            return NextResponse.json(
                { success: false, error: `Username "${normalizedUsername}" sudah terdaftar.` },
                { status: 409 }
            );
        }

        // 2. Simpan user baru dengan enkripsi password AES-256
        const { data: newUser, error: insertErr } = await supabase
            .from("synerix_users")
            .insert({
                username: normalizedUsername,
                encrypted_billing_password: encryptPassword(rawPassword),
                full_name: rawFullName,
                role: assignedRole,
                is_active: true,
                allowed_routes: allowedRoutes,
            })
            .select("id, username, full_name, role, is_active, allowed_routes, created_at")
            .single();

        if (insertErr || !newUser) {
            console.error("Gagal menambahkan user:", insertErr);
            return NextResponse.json(
                { success: false, error: insertErr?.message || "Gagal menyimpan pengguna baru." },
                { status: 500 }
            );
        }

        // 3. Catat Stealth Audit Log
        recordStealthAuditLog({
            userId: auth.user.id,
            username: auth.user.username,
            actionType: "ADD_USER",
            targetId: newUser.id,
            details: { created_username: newUser.username, role: newUser.role },
        }).catch(() => {});

        return NextResponse.json({
            success: true,
            user: newUser,
            message: "Pengguna baru berhasil ditambahkan.",
        });
    } catch (err) {
        return NextResponse.json(
            { success: false, error: err instanceof Error ? err.message : "Akses ditolak." },
            { status: 403 }
        );
    }
}

/**
 * PATCH: Mengubah data pengguna (role, status aktif, hak akses, atau password)
 */
export async function PATCH(req: NextRequest) {
    try {
        const auth = await requireAuth("superadmin");
        const body: UpdateUserPayload = await req.json();

        if (!body.id) {
            return NextResponse.json(
                { success: false, error: "ID pengguna wajib disertakan." },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServerClient();

        // Siapkan field yang akan diperbarui
        const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (body.full_name !== undefined) updates.full_name = body.full_name.trim();
        if (body.role !== undefined) updates.role = body.role;
        if (body.is_active !== undefined) updates.is_active = body.is_active;
        if (body.allowed_routes !== undefined) updates.allowed_routes = body.allowed_routes;
        if (body.new_password && body.new_password.trim()) {
            updates.encrypted_billing_password = encryptPassword(body.new_password.trim());
        }

        // Jangan izinkan superadmin menonaktifkan dirinya sendiri
        if (body.id === auth.user.id && body.is_active === false) {
            return NextResponse.json(
                { success: false, error: "Anda tidak dapat menonaktifkan akun Anda sendiri." },
                { status: 400 }
            );
        }

        const { data: updatedUser, error: updateErr } = await supabase
            .from("synerix_users")
            .update(updates)
            .eq("id", body.id)
            .select("id, username, full_name, role, is_active, allowed_routes, updated_at")
            .single();

        if (updateErr) {
            return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
        }

        // Catat Stealth Audit Log
        recordStealthAuditLog({
            userId: auth.user.id,
            username: auth.user.username,
            actionType: "UPDATE_USER",
            targetId: body.id,
            details: updates,
        }).catch(() => {});

        return NextResponse.json({
            success: true,
            user: updatedUser,
            message: "Data pengguna berhasil diperbarui.",
        });
    } catch (err) {
        return NextResponse.json(
            { success: false, error: err instanceof Error ? err.message : "Akses ditolak." },
            { status: 403 }
        );
    }
}

/**
 * DELETE: Menghapus pengguna dari sistem
 */
export async function DELETE(req: NextRequest) {
    try {
        const auth = await requireAuth("superadmin");
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("id");

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Parameter ID pengguna wajib disertakan." },
                { status: 400 }
            );
        }

        // Cegah superadmin menghapus akunnya sendiri
        if (userId === auth.user.id) {
            return NextResponse.json(
                { success: false, error: "Anda tidak dapat menghapus akun Anda sendiri." },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServerClient();

        const { error: deleteErr } = await supabase.from("synerix_users").delete().eq("id", userId);

        if (deleteErr) {
            return NextResponse.json({ success: false, error: deleteErr.message }, { status: 500 });
        }

        // Catat Stealth Audit Log
        recordStealthAuditLog({
            userId: auth.user.id,
            username: auth.user.username,
            actionType: "DELETE_USER",
            targetId: userId,
        }).catch(() => {});

        return NextResponse.json({
            success: true,
            message: "Pengguna berhasil dihapus.",
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
// GET, POST, PATCH, DELETE diekspor sebagai Next.js Route Handlers
