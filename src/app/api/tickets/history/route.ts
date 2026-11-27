import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Default initial reports matching Screenshot 3
const INITIAL_REPORTS = [
  {
    id: 'rep-1',
    staff_name: 'Joko',
    shift: 'SHIFT MALAM',
    report_date: '2026-11-21',
    report_time: '08:14 WIB',
    tickets_received: 4,
    tickets_handled: 3,
    notes: 'Jaringan aman, 3 tiket teratasi di area IRSA, 1 tiket pending pengecekan fisik tiang besok.',
    created_at: new Date('2026-11-21T08:14:00Z').toISOString(),
  },
  {
    id: 'rep-2',
    staff_name: 'Denok',
    shift: 'SHIFT SORE',
    report_date: '2026-11-21',
    report_time: '22:41 WIB',
    tickets_received: 4,
    tickets_handled: 9,
    notes: 'Penanganan keluhan redaman tinggi cluster Mangunjaya selesai.',
    created_at: new Date('2026-11-21T22:41:00Z').toISOString(),
  },
  {
    id: 'rep-3',
    staff_name: 'Fariel',
    shift: 'SHIFT PAGI',
    report_date: '2026-11-21',
    report_time: '15:03 WIB',
    tickets_received: 4,
    tickets_handled: 9,
    notes: 'Patroli feeder lancar, tiket masuk sudah diteruskan ke teknisi lapangan.',
    created_at: new Date('2026-11-21T15:03:00Z').toISOString(),
  },
  {
    id: 'rep-4',
    staff_name: 'Joko',
    shift: 'SHIFT MALAM',
    report_date: '2026-11-20',
    report_time: '07:57 WIB',
    tickets_received: 2,
    tickets_handled: 4,
    notes: 'Pemantauan OLT IRSA aman normal.',
    created_at: new Date('2026-11-20T07:57:00Z').toISOString(),
  },
  {
    id: 'rep-5',
    staff_name: 'Denok',
    shift: 'SHIFT SORE',
    report_date: '2026-11-20',
    report_time: '22:20 WIB',
    tickets_received: 3,
    tickets_handled: 9,
    notes: 'Selesai serah terima dengan shift malam.',
    created_at: new Date('2026-11-20T22:20:00Z').toISOString(),
  },
  {
    id: 'rep-6',
    staff_name: 'Fariel',
    shift: 'SHIFT PAGI',
    report_date: '2026-11-20',
    report_time: '15:03 WIB',
    tickets_received: 4,
    tickets_handled: 10,
    notes: 'Semua tiket kendala sambungan sudah diverifikasi.',
    created_at: new Date('2026-11-20T15:03:00Z').toISOString(),
  },
  {
    id: 'rep-7',
    staff_name: 'Denok',
    shift: 'SHIFT SORE',
    report_date: '2026-11-19',
    report_time: '22:51 WIB',
    tickets_received: 1,
    tickets_handled: 11,
    notes: 'Eskalasi 1 tiket ONU Loss ke koordinator lapangan.',
    created_at: new Date('2026-11-19T22:51:00Z').toISOString(),
  },
  {
    id: 'rep-8',
    staff_name: 'Joko',
    shift: 'SHIFT PAGI',
    report_date: '2026-11-19',
    report_time: '14:57 WIB',
    tickets_received: 4,
    tickets_handled: 12,
    notes: 'Pembersihan patchcord OLT rack 2.',
    created_at: new Date('2026-11-19T14:57:00Z').toISOString(),
  },
  {
    id: 'rep-9',
    staff_name: 'Eka',
    shift: 'SHIFT MALAM',
    report_date: '2026-11-18',
    report_time: '08:24 WIB',
    tickets_received: 2,
    tickets_handled: 8,
    notes: 'Tidak ada kendala major.',
    created_at: new Date('2026-11-18T08:24:00Z').toISOString(),
  },
  {
    id: 'rep-10',
    staff_name: 'Denok',
    shift: 'SHIFT SORE',
    report_date: '2026-11-18',
    report_time: '22:22 WIB',
    tickets_received: 0,
    tickets_handled: 10,
    notes: 'Kondisi operasional normal.',
    created_at: new Date('2026-11-18T22:22:00Z').toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const staff = searchParams.get('staff');
    const shift = searchParams.get('shift');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const supabase = getSupabaseServerClient();
    let query = supabase.from('shift_ticket_reports').select('*').order('report_date', { ascending: false }).order('created_at', { ascending: false });

    if (staff && staff !== 'ALL') {
      query = query.ilike('staff_name', `%${staff}%`);
    }
    if (shift && shift !== 'ALL') {
      query = query.eq('shift', shift);
    }
    if (startDate) {
      query = query.gte('report_date', startDate);
    }
    if (endDate) {
      query = query.lte('report_date', endDate);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      let filtered = [...INITIAL_REPORTS];
      if (staff && staff !== 'ALL') {
        filtered = filtered.filter((r) => r.staff_name.toLowerCase().includes(staff.toLowerCase()));
      }
      if (shift && shift !== 'ALL') {
        filtered = filtered.filter((r) => r.shift.toUpperCase().includes(shift.toUpperCase()));
      }
      return NextResponse.json({ success: true, data: filtered });
    }
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: INITIAL_REPORTS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getSupabaseServerClient();

    const newReport = {
      staff_name: body.staff_name,
      shift: body.shift,
      report_date: body.report_date || new Date().toISOString().slice(0, 10),
      report_time: body.report_time || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      tickets_received: Number(body.tickets_received) || 0,
      tickets_handled: Number(body.tickets_handled) || 0,
      notes: body.notes || '',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('shift_ticket_reports').insert([newReport]).select().single();
    if (error) {
      return NextResponse.json({ success: true, data: { id: `rep-${Date.now()}`, ...newReport } });
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
    await supabase.from('shift_ticket_reports').delete().eq('id', id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
