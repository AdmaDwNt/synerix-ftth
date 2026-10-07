import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Task ID is required" },
                { status: 400 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
        const supabaseKey =
            process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
            "";

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json(
                { success: false, error: "Database configuration missing" },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from("dismantle_tasks")
            .delete()
            .eq("id", id)
            .select();

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        if (!data || data.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Data tidak terhapus dari Supabase. Kemungkinan RLS DELETE policy belum aktif di database.",
                    requiresSqlMigration: true
                },
                { status: 403 }
            );
        }

        return NextResponse.json({ success: true, deleted: data });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err?.message || String(err) },
            { status: 500 }
        );
    }
}
