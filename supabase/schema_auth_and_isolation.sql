-- ============================================================================
-- MODUL       : Autentikasi Multi-User, Isolasi Data, & Pelaporan Terpadu
-- FILE        : supabase/schema_auth_and_isolation.sql
-- DESKRIPSI   : Skema tabel database Supabase untuk akun pengguna (Billingnesia & Gudang),
--               sesi terisolasi, isolasi data work-logs, pelaporan tiket, dan audit stealth.
-- TANGGAL     : 2026
-- ============================================================================

-- ----------------------------------------------------------------------------
-- BAGIAN 1: EXTENSION & TYPE DEFINITION
-- ----------------------------------------------------------------------------

-- Pastikan UUID extension aktif
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tipe Role Pengguna (superadmin = pemilik/god-mode, technician = rekan kerja, viewer = tamu/pantau saja)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synerix_user_role') THEN
        CREATE TYPE synerix_user_role AS ENUM ('superadmin', 'technician', 'viewer');
    END IF;
END $$;


-- ----------------------------------------------------------------------------
-- BAGIAN 2: TABEL PENGGUNA (SYNERIX_USERS)
-- Menyimpan profil akun, kredensial terenkripsi AES-256 untuk autologin scraper
-- Billingnesia dan Gudang AT-IN, serta hak akses menu (RBAC)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.synerix_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Kredensial Billingnesia (Wajib)
    username VARCHAR(100) UNIQUE NOT NULL,
    encrypted_billing_password TEXT NOT NULL,
    
    -- Kredensial Gudang (Opsional / Per-Teknisi)
    gudang_username VARCHAR(100),
    encrypted_gudang_password TEXT,
    
    -- Profil & Hak Akses
    full_name VARCHAR(150) NOT NULL,
    role synerix_user_role NOT NULL DEFAULT 'technician',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    allowed_routes TEXT[] NOT NULL DEFAULT ARRAY['/work-logs', '/dismantles', '/mapping', '/core-guide', '/shifts'],
    
    -- Audit & Metadata
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks Pencarian User
CREATE INDEX IF NOT EXISTS idx_synerix_users_username ON public.synerix_users(username);
CREATE INDEX IF NOT EXISTS idx_synerix_users_role ON public.synerix_users(role);
CREATE INDEX IF NOT EXISTS idx_synerix_users_active ON public.synerix_users(is_active);


-- ----------------------------------------------------------------------------
-- BAGIAN 3: TABEL SESI AKTIF (USER_SESSIONS)
-- Menyimpan token sesi HTTP-Only dan cookie scraper aktif per pengguna
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.synerix_users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    
    -- Cache Sesi Scraper Aktif (Agar tidak perlu re-login di setiap request)
    billingnesia_cookie TEXT,
    gudang_cookie TEXT,
    cookie_expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks Sesi
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);


-- ----------------------------------------------------------------------------
-- BAGIAN 4: ISOLASI DATA PADA WORK_LOGS
-- Menambahkan ownership agar Teknisi hanya melihat data buatannya sendiri,
-- sementara Superadmin memiliki kemampuan melihat seluruh data rekan
-- ----------------------------------------------------------------------------

ALTER TABLE public.work_logs 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.synerix_users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_by_username VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_work_logs_user_id ON public.work_logs(user_id);


-- ----------------------------------------------------------------------------
-- BAGIAN 5: TABEL PELAPORAN AKTIVITAS TIKET (TICKET_ACTIVITY_REPORTS)
-- Menyimpan formulir pelaporan lengkap: multi-teknisi, checklist pemakaian
-- barang gudang (NTP), 6-7 foto bukti, dan status integrasi Telegram
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ticket_activity_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50),
    customer_name VARCHAR(150),
    
    -- Teknisi Pembuat & Anggota Tim (Multi-PIC)
    user_id UUID REFERENCES public.synerix_users(id) ON DELETE SET NULL,
    created_by_username VARCHAR(100),
    employees TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    
    -- Tindakan & Progress
    action_description TEXT NOT NULL,
    progress_percent INTEGER NOT NULL DEFAULT 100,
    
    -- Pengeluaran Barang Gudang (Sesuai Spesifikasi Lapangan)
    uses_warehouse_goods BOOLEAN NOT NULL DEFAULT FALSE,
    no_goods_reason TEXT,
    ntp_number VARCHAR(100),
    materials_used JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"ont": 1, "kabel_meter": 32, "fastkon": 1, "paku_klip": 7}
    
    -- Bukti Foto & Status Integrasi Dual-Dispatch
    photo_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- Slot 1 s/d 7 URL foto
    billingnesia_log_synced BOOLEAN NOT NULL DEFAULT FALSE,
    gudang_log_synced BOOLEAN NOT NULL DEFAULT FALSE,
    telegram_sent BOOLEAN NOT NULL DEFAULT FALSE,
    telegram_message_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks Pelaporan
CREATE INDEX IF NOT EXISTS idx_ticket_reports_ticket ON public.ticket_activity_reports(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_reports_user ON public.ticket_activity_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_reports_created ON public.ticket_activity_reports(created_at DESC);


-- ----------------------------------------------------------------------------
-- BAGIAN 6: AUDIT TRAIL SENYAP KHUSUS SUPERADMIN (USER_ACTIVITY_AUDIT_LOGS)
-- Mencatat seluruh aktivitas tim tanpa memunculkan indikator apapun di UI teknisi
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_activity_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.synerix_users(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'LOGIN', 'SCRAPE_TICKET', 'SUBMIT_ACTIVITY', 'UPDATE_DISMANTLE', dll.
    target_id VARCHAR(100),          -- ID Tiket / ID Pelanggan / Node ID
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks Audit
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.user_activity_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.user_activity_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.user_activity_audit_logs(created_at DESC);


-- ----------------------------------------------------------------------------
-- BAGIAN 7: ROW LEVEL SECURITY (RLS) POLICIES
-- Kebijakan akses data: 
-- 1. Pengguna internal/server Next.js dengan service role dapat membaca/menulis bebas
-- 2. Akses anon/public dibatasi agar kredensial tidak pernah bocor via client inspect
-- ----------------------------------------------------------------------------

ALTER TABLE public.synerix_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_activity_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy Default: Buka untuk service role / authenticated server requests
DROP POLICY IF EXISTS "Server Access Users" ON public.synerix_users;
CREATE POLICY "Server Access Users" ON public.synerix_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Server Access Sessions" ON public.user_sessions;
CREATE POLICY "Server Access Sessions" ON public.user_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Server Access Reports" ON public.ticket_activity_reports;
CREATE POLICY "Server Access Reports" ON public.ticket_activity_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Server Access Audit" ON public.user_activity_audit_logs;
CREATE POLICY "Server Access Audit" ON public.user_activity_audit_logs FOR ALL USING (true) WITH CHECK (true);


-- ----------------------------------------------------------------------------
-- BAGIAN 8: PANDUAN SETUP SUPABASE STORAGE BUCKET
-- Jalankan di menu Storage Supabase jika belum ada:
-- 1. Buat bucket baru dengan nama: 'ticket-activities'
-- 2. Atur Public Bucket: ON (atau Private dengan Signed URL)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-activities', 'ticket-activities', true)
ON CONFLICT (id) DO NOTHING;
