import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export const INITIAL_TEMPLATES = [
  {
    id: 'tpl-1',
    title: 'KONFIRMASI ULANG VIA TELFON',
    category: 'KONFIRMASI PELANGGAN',
    content: `*Tiket Adwan*\nKonfirmasi - Via Telfon\nKeterangan Adwan - Router tambahan belakang sering gangguan internet putus nyambung\nStatus - Sudah dijadwalkan tim teknisi untuk pengecekan ke lokasi`,
    tags: ['konfirmasi', 'telfon'],
  },
  {
    id: 'tpl-2',
    title: 'List Paket Fibermaxs Office',
    category: 'PEMBAYARAN',
    content: `Pricelist:\n- 50 Mbps: Rp410.000\n- 100 Mbps: Rp720.000\n- 150 Mbps: Rp950.000\n- 200 Mbps: Rp1.180.000`,
    tags: ['paket', 'office', 'fibermaxs'],
  },
  {
    id: 'tpl-3',
    title: 'List Paket Home dengan PPN 11%',
    category: 'PEMBAYARAN',
    content: `LIST PAKET BULANAN DENGAN PPN 11%\n5 Mbps Rp.131.000/bln\n10 Mbps Rp.166.500/bln\n20 Mbps Rp.222.000/bln\n50 Mbps Rp.244.200/bln`,
    tags: ['paket', 'home', 'ppn'],
  },
  {
    id: 'tpl-4',
    title: 'Reboot alat adaptor',
    category: 'KONFIRMASI PELANGGAN',
    content: `Selamat {sapaan}\n\nMohon maaf, bisa dibantukan untuk melakukan reboot perangkat ONT/router dengan cara mencabut adaptor listrik dari perangkat.\n\nSetelah adaptor dicabut, mohon tunggu kurang lebih *3 menit*, kemudian pasang kembali adaptor dan tunggu hingga perangkat menyala serta koneksi internet kembali normal.`,
    tags: ['troubleshooting', 'reboot', 'adaptor'],
  },
  {
    id: 'tpl-5',
    title: 'Format Laporan Tiket Shift ke Grup',
    category: 'LAPORAN SHIFT',
    content: `*LAPORAN SHIFT NOC*\nPetugas: {petugas}\nShift: {shift}\nTanggal: {tanggal}\n\nMenerima: {menerima} Tiket\nMenangani: {menangani} Tiket\n\nDetail:\n{detail_tiket}`,
    tags: ['laporan', 'shift'],
  },
];

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from('wa_templates').select('*').order('created_at', { ascending: true });
    if (error || !data || data.length === 0) {
      return NextResponse.json({ success: true, data: INITIAL_TEMPLATES });
    }
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: INITIAL_TEMPLATES });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getSupabaseServerClient();

    const newTemplate = {
      title: body.title,
      category: body.category || 'UMUM',
      content: body.content,
      tags: body.tags || [],
      created_by: body.created_by || 'Staff NOC',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('wa_templates').insert([newTemplate]).select().single();
    if (error) {
      return NextResponse.json({ success: true, data: { id: `tpl-${Date.now()}`, ...newTemplate } });
    }
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, category, content, tags } = body;
    const supabase = getSupabaseServerClient();

    const payload = {
      title,
      category,
      content,
      tags,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('wa_templates').update(payload).eq('id', id).select().single();
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
    await supabase.from('wa_templates').delete().eq('id', id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
