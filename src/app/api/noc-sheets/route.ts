import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Fallback in-memory initial sheets if table is empty or migrating
const DEFAULT_SHEETS = [
  {
    id: 'sheet-perbaikan',
    name: 'List Perbaikan',
    columns: ['ID Tiket', 'Pelanggan', 'Keterangan'],
    rows: [
      { 'ID Tiket': 'TKT202607235699', 'Pelanggan': 'BUMDES MANGUNJAYA (MANGUNREJO)', 'Keterangan': 'PINDAH ALAT' },
      { 'ID Tiket': 'TKT202610274564', 'Pelanggan': 'MUKMININ CAKRUK', 'Keterangan': 'ONU LOSS KUNJUNGAN MENUNGGU...' },
      { 'ID Tiket': 'TKT2026110930802', 'Pelanggan': 'TIKET PATROLI', 'Keterangan': 'TIKET PATROLI' },
      { 'ID Tiket': 'TKT2026111324654', 'Pelanggan': 'SUMARSONO', 'Keterangan': 'PERGANTIAN ALAT/ADAPTOR KUNJ...' },
      { 'ID Tiket': 'TKT2026111359717', 'Pelanggan': '0101010401089 - NIDA HANI AMMARIA (IRSA BANJAR)', 'Keterangan': 'ONU LOSS' }
    ],
    updated_at: new Date().toISOString()
  },
  {
    id: 'sheet-dismantle',
    name: 'List Dismantle',
    columns: ['ID Pelanggan', 'Nama', 'Alamat', 'Status'],
    rows: [],
    updated_at: new Date().toISOString()
  }
];

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from('noc_sheets').select('*').order('created_at', { ascending: true });
    if (error || !data || data.length === 0) {
      return NextResponse.json({ success: true, data: DEFAULT_SHEETS });
    }
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: DEFAULT_SHEETS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getSupabaseServerClient();

    const newSheet = {
      name: body.name || 'Sheet Baru',
      columns: body.columns || ['Kolom 1', 'Kolom 2', 'Kolom 3'],
      rows: body.rows || [],
      created_by: body.created_by || 'Staff NOC',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('noc_sheets').insert([newSheet]).select().single();
    if (error) {
      return NextResponse.json({ success: true, data: { id: `sheet-${Date.now()}`, ...newSheet } });
    }
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, columns, rows } = body;
    const supabase = getSupabaseServerClient();

    const payload = {
      name,
      columns,
      rows,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('noc_sheets').update(payload).eq('id', id).select().single();
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
    await supabase.from('noc_sheets').delete().eq('id', id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
