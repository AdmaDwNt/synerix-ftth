-- ====================================================================
-- SYNERIX FTTH PLATFORM: SHIFTS & ROSTER OPERASIONAL SCHEMA
-- Modul: Shift Operasional & Roster Bulanan (Teknisi, NOC, PSG/Magang)
-- Tanggal: Oktober 2026
-- ====================================================================

-- 1. TABEL: SHIFT_ROSTERS (Matriks Jadwal Bulanan)
CREATE TABLE IF NOT EXISTS public.shift_rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_year VARCHAR(50) NOT NULL, -- Format: "AGUSTUS 2026", "OKTOBER 2026"
    group_name VARCHAR(50) NOT NULL DEFAULT 'NAMA TEKNISI', -- 'NAMA TEKNISI' | 'NAMA NOC' | 'NAMA PESERTA PSG'
    employee_name VARCHAR(150) NOT NULL,
    daily_shifts JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"1": "PAGI", "2": "LIBUR", ...}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_shift_rosters_month_group_emp UNIQUE (month_year, group_name, employee_name)
);

-- Indeks Performa Query
CREATE INDEX IF NOT EXISTS idx_shift_rosters_month ON public.shift_rosters(month_year);
CREATE INDEX IF NOT EXISTS idx_shift_rosters_group ON public.shift_rosters(group_name);
CREATE INDEX IF NOT EXISTS idx_shift_rosters_emp ON public.shift_rosters(employee_name);

-- RLS (Row Level Security)
ALTER TABLE public.shift_rosters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Shift Rosters" ON public.shift_rosters;
CREATE POLICY "Public Read Shift Rosters" ON public.shift_rosters FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Shift Rosters" ON public.shift_rosters;
CREATE POLICY "Public Insert Shift Rosters" ON public.shift_rosters FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Shift Rosters" ON public.shift_rosters;
CREATE POLICY "Public Update Shift Rosters" ON public.shift_rosters FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Delete Shift Rosters" ON public.shift_rosters;
CREATE POLICY "Public Delete Shift Rosters" ON public.shift_rosters FOR DELETE USING (true);


-- 2. TABEL: SHIFT_LEAVE_REQUESTS (Pengajuan Cuti, Izin, & Tukar Shift)
CREATE TABLE IF NOT EXISTS public.shift_leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type VARCHAR(50) NOT NULL DEFAULT 'CUTI_TAHUNAN', -- 'CUTI_TAHUNAN' | 'TUKAR_SHIFT' | 'IZIN_SAKIT'
    employee_name VARCHAR(150) NOT NULL,
    group_name VARCHAR(50) DEFAULT 'NAMA TEKNISI',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'APPROVED' | 'REJECTED'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks
CREATE INDEX IF NOT EXISTS idx_shift_leave_status ON public.shift_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_shift_leave_created ON public.shift_leave_requests(created_at DESC);

-- RLS
ALTER TABLE public.shift_leave_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Shift Leaves" ON public.shift_leave_requests;
CREATE POLICY "Public Read Shift Leaves" ON public.shift_leave_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Shift Leaves" ON public.shift_leave_requests;
CREATE POLICY "Public Insert Shift Leaves" ON public.shift_leave_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Shift Leaves" ON public.shift_leave_requests;
CREATE POLICY "Public Update Shift Leaves" ON public.shift_leave_requests FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Delete Shift Leaves" ON public.shift_leave_requests;
CREATE POLICY "Public Delete Shift Leaves" ON public.shift_leave_requests FOR DELETE USING (true);

