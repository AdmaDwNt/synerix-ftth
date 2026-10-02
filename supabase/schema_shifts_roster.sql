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


-- 3. SEED DATA AWAL (AGUSTUS 2026 - Roster Spreadsheet Bawaan)
INSERT INTO public.shift_rosters (month_year, group_name, employee_name, daily_shifts)
VALUES 
  -- NAMA TEKNISI
  ('AGUSTUS 2026', 'NAMA TEKNISI', 'DAVID ARDIANSYAH', '{"1":"SOC","2":"LIBUR","3":"LIBUR","4":"MALAM","5":"MALAM","6":"MALAM","7":"MALAM","8":"LIBUR","9":"LIBUR","10":"PAGI","11":"PAGI","12":"SOC","13":"SOC","14":"MALAM","15":"MALAM","16":"LIBUR","17":"LIBUR","18":"PAGI","19":"PAGI","20":"SOC","21":"SOC","22":"MALAM","23":"MALAM","24":"LIBUR","25":"LIBUR","26":"PAGI","27":"PAGI","28":"SOC","29":"SOC","30":"MALAM","31":"MALAM"}'::jsonb),
  ('AGUSTUS 2026', 'NAMA TEKNISI', 'RENDI MAULA ARDIANSYAH', '{"1":"PAGI","2":"PAGI","3":"SOC","4":"SOC","5":"LIBUR","6":"LIBUR","7":"LIBUR","8":"PAGI","9":"PAGI","10":"SOC","11":"SOC","12":"MALAM","13":"MALAM","14":"LIBUR","15":"LIBUR","16":"PAGI","17":"PAGI","18":"SOC","19":"SOC","20":"MALAM","21":"MALAM","22":"LIBUR","23":"LIBUR","24":"PAGI","25":"PAGI","26":"SOC","27":"SOC","28":"MALAM","29":"MALAM","30":"LIBUR","31":"LIBUR"}'::jsonb),
  ('AGUSTUS 2026', 'NAMA TEKNISI', 'M. ANANG MA''RUF', '{"1":"PAGI","2":"PAGI","3":"PAGI","4":"PAGI","5":"PAGI","6":"PAGI","7":"LIBUR","8":"LIBUR","9":"PAGI","10":"PAGI","11":"PAGI","12":"PAGI","13":"PAGI","14":"PAGI","15":"LIBUR","16":"LIBUR","17":"PAGI","18":"PAGI","19":"PAGI","20":"PAGI","21":"PAGI","22":"PAGI","23":"LIBUR","24":"LIBUR","25":"PAGI","26":"PAGI","27":"PAGI","28":"PAGI","29":"PAGI","30":"PAGI","31":"LIBUR"}'::jsonb),
  ('AGUSTUS 2026', 'NAMA TEKNISI', 'BIMA SAPUTRA', '{"1":"MALAM","2":"MALAM","3":"MALAM","4":"LIBUR","5":"LIBUR","6":"PAGI","7":"PAGI","8":"SOC","9":"SOC","10":"MALAM","11":"MALAM","12":"LIBUR","13":"LIBUR","14":"PAGI","15":"PAGI","16":"SOC","17":"SOC","18":"MALAM","19":"MALAM","20":"LIBUR","21":"LIBUR","22":"PAGI","23":"PAGI","24":"SOC","25":"SOC","26":"MALAM","27":"MALAM","28":"LIBUR","29":"LIBUR","30":"PAGI","31":"PAGI"}'::jsonb),
  ('AGUSTUS 2026', 'NAMA TEKNISI', 'BAGUS DWI PURNOMO', '{"1":"MALAM","2":"MALAM","3":"LIBUR","4":"LIBUR","5":"PAGI","6":"PAGI","7":"SOC","8":"SOC","9":"MALAM","10":"MALAM","11":"LIBUR","12":"LIBUR","13":"PAGI","14":"PAGI","15":"SOC","16":"SOC","17":"MALAM","18":"MALAM","19":"LIBUR","20":"LIBUR","21":"PAGI","22":"PAGI","23":"SOC","24":"SOC","25":"MALAM","26":"MALAM","27":"LIBUR","28":"LIBUR","29":"PAGI","30":"PAGI","31":"SOC"}'::jsonb),
  ('AGUSTUS 2026', 'NAMA TEKNISI', 'FERI DWI SETYAWAN', '{"1":"SOC","2":"SOC","3":"MALAM","4":"MALAM","5":"LIBUR","6":"LIBUR","7":"PAGI","8":"PAGI","9":"SOC","10":"SOC","11":"MALAM","12":"MALAM","13":"LIBUR","14":"LIBUR","15":"PAGI","16":"PAGI","17":"SOC","18":"SOC","19":"MALAM","20":"MALAM","21":"LIBUR","22":"LIBUR","23":"PAGI","24":"PAGI","25":"SOC","26":"SOC","27":"MALAM","28":"MALAM","29":"LIBUR","30":"LIBUR","31":"PAGI"}'::jsonb),
  ('AGUSTUS 2026', 'NAMA TEKNISI', 'EKO WAHYUDI', '{"1":"LIBUR","2":"LIBUR","3":"PAGI","4":"PAGI","5":"SOC","6":"SOC","7":"MALAM","8":"MALAM","9":"LIBUR","10":"LIBUR","11":"PAGI","12":"PAGI","13":"SOC","14":"SOC","15":"MALAM","16":"MALAM","17":"LIBUR","18":"LIBUR","19":"PAGI","20":"PAGI","21":"SOC","22":"SOC","23":"MALAM","24":"MALAM","25":"LIBUR","26":"LIBUR","27":"PAGI","28":"PAGI","29":"SOC","30":"SOC","31":"MALAM"}'::jsonb),
  ('AGUSTUS 2026', 'NAMA TEKNISI', 'M. KHANIFUDIN', '{"1":"LIBUR","2":"LIBUR","3":"PAGI","4":"PAGI","5":"SOC","6":"SOC","7":"MALAM","8":"MALAM","9":"LIBUR","10":"LIBUR","11":"PAGI","12":"PAGI","13":"SOC","14":"SOC","15":"MALAM","16":"MALAM","17":"LIBUR","18":"LIBUR","19":"PAGI","20":"PAGI","21":"SOC","22":"SOC","23":"MALAM","24":"MALAM","25":"LIBUR","26":"LIBUR","27":"PAGI","28":"PAGI","29":"SOC","30":"SOC","31":"MALAM"}'::jsonb),

  -- NAMA NOC
  ('AGUSTUS 2026', 'NAMA NOC', 'ADITYA BAYU PRATAMA', '{"1":"PAGI","2":"PAGI","3":"SOC","4":"SOC","5":"MALAM","6":"MALAM","7":"LIBUR","8":"LIBUR","9":"PAGI","10":"PAGI","11":"SOC","12":"SOC","13":"MALAM","14":"MALAM","15":"LIBUR","16":"LIBUR","17":"PAGI","18":"PAGI","19":"SOC","20":"SOC","21":"MALAM","22":"MALAM","23":"LIBUR","24":"LIBUR","25":"PAGI","26":"PAGI","27":"SOC","28":"SOC","29":"MALAM","30":"MALAM","31":"LIBUR"}'::jsonb),
  ('AGUSTUS 2026', 'NAMA NOC', 'DIMAS PUTRA', '{"1":"SOC","2":"SOC","3":"MALAM","4":"MALAM","5":"LIBUR","6":"LIBUR","7":"PAGI","8":"PAGI","9":"SOC","10":"PAGI","11":"LIBUR","12":"LIBUR","13":"SOC","14":"SOC","15":"PAGI","16":"PAGI","17":"PAGI","18":"SOC","19":"SOC","20":"LIBUR","21":"LIBUR","22":"PAGI","23":"PAGI","24":"PAGI","25":"PAGI","26":"SOC","27":"SOC","28":"LIBUR","29":"LIBUR","30":"PAGI","31":"PAGI"}'::jsonb),
  ('AGUSTUS 2026', 'NAMA NOC', 'FARIL JEMBLUK', '{"1":"MALAM","2":"MALAM","3":"MALAM","4":"LIBUR","5":"LIBUR","6":"MALAM","7":"MALAM","8":"MALAM","9":"MALAM","10":"LIBUR","11":"LIBUR","12":"MALAM","13":"MALAM","14":"MALAM","15":"MALAM","16":"LIBUR","17":"LIBUR","18":"MALAM","19":"MALAM","20":"MALAM","21":"MALAM","22":"LIBUR","23":"LIBUR","24":"MALAM","25":"MALAM","26":"MALAM","27":"MALAM","28":"LIBUR","29":"LIBUR","30":"MALAM","31":"MALAM"}'::jsonb),

  -- NAMA PESERTA PSG
  ('AGUSTUS 2026', 'NAMA PESERTA PSG', 'ADRIL SMKN SEMEN', '{"1":"LIBUR","2":"PAGI","3":"PAGI","4":"PAGI","5":"LIBUR","6":"LIBUR","7":"SOC","8":"SOC","9":"LIBUR","10":"LIBUR","11":"PAGI","12":"PAGI","13":"PAGI","14":"PAGI","15":"LIBUR","16":"LIBUR","17":"PAGI","18":"PAGI","19":"PAGI","20":"PAGI","21":"LIBUR","22":"LIBUR","23":"PAGI","24":"PAGI","25":"LIBUR","26":"LIBUR","27":"SOC","28":"SOC","29":"LIBUR","30":"LIBUR","31":"SOC"}'::jsonb),
  ('AGUSTUS 2026', 'NAMA PESERTA PSG', 'JOHAN SMKN SEMEN', '{"1":"PAGI","2":"LIBUR","3":"PAGI","4":"PAGI","5":"LIBUR","6":"LIBUR","7":"PAGI","8":"PAGI","9":"PAGI","10":"PAGI","11":"LIBUR","12":"LIBUR","13":"PAGI","14":"PAGI","15":"PAGI","16":"PAGI","17":"LIBUR","18":"LIBUR","19":"PAGI","20":"PAGI","21":"PAGI","22":"PAGI","23":"LIBUR","24":"LIBUR","25":"PAGI","26":"PAGI","27":"PAGI","28":"PAGI","29":"LIBUR","30":"LIBUR","31":"PAGI"}'::jsonb),
  ('AGUSTUS 2026', 'NAMA PESERTA PSG', 'ALIF SMK CR', '{"1":"PAGI","2":"LIBUR","3":"PAGI","4":"PAGI","5":"LIBUR","6":"LIBUR","7":"PAGI","8":"SOC","9":"SOC","10":"LIBUR","11":"LIBUR","12":"PAGI","13":"PAGI","14":"PAGI","15":"PAGI","16":"LIBUR","17":"LIBUR","18":"PAGI","19":"PAGI","20":"PAGI","21":"PAGI","22":"LIBUR","23":"LIBUR","24":"PAGI","25":"PAGI","26":"PAGI","27":"PAGI","28":"LIBUR","29":"LIBUR","30":"SOC","31":"SOC"}'::jsonb)
ON CONFLICT (month_year, group_name, employee_name) 
DO UPDATE SET daily_shifts = EXCLUDED.daily_shifts, updated_at = NOW();
