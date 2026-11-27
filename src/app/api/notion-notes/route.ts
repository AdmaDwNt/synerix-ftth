import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('notion_notes')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getSupabaseServerClient();

    const newNote = {
      title: body.title || 'Catatan Baru',
      content_blocks: body.content_blocks || [
        { id: `b_${Date.now()}`, type: 'paragraph', content: '' }
      ],
      tags: body.tags || [],
      is_pinned: !!body.is_pinned,
      author: body.author || 'Staff NOC',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('notion_notes').insert([newNote]).select().single();
    if (error) {
      return NextResponse.json({ success: true, data: { id: `note-${Date.now()}`, ...newNote } });
    }
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, content_blocks, tags, is_pinned } = body;
    const supabase = getSupabaseServerClient();

    const payload = {
      title,
      content_blocks,
      tags,
      is_pinned,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('notion_notes').update(payload).eq('id', id).select().single();
    if (error) {
      return NextResponse.json({ success: true, data: { id, ...payload } });
    }
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID wajib diisi' }, { status: 400 });

    const supabase = getSupabaseServerClient();
    await supabase.from('notion_notes').delete().eq('id', id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
