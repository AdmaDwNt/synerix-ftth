-- ============================================================================
-- MODUL       : FTTH Command Center Upgrade V2 (Operational & Security)
-- FILE        : supabase/schema_update_v2_operational.sql
-- DESKRIPSI   : Skema database untuk konfigurasi scraper dinamis, staging data,
--               feature flags (beta toggle), keamanan rate limit, progressive lockout,
--               IP blocking, audit log bertingkat, dan modul operasional NOC.
-- TANGGAL     : 2026
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABEL: SCRAPER_CONFIGS (Konfigurasi Dinamis Target Billingnesia)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scraper_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_name VARCHAR(50) NOT NULL UNIQUE DEFAULT 'BILLINGNESIA',
    base_url TEXT NOT NULL DEFAULT 'https://billing.at-in.net',
    search_endpoint TEXT DEFAULT '/admin/pelanggan/tablePelanggan',
    dismantle_endpoint TEXT DEFAULT '/admin/tiket/tableTiket',
    detail_endpoint TEXT DEFAULT '/admin/pelanggan/detail',
    ticket_detail_endpoint TEXT DEFAULT '/admin/tiket/detailtiket',
    timeout_ms INT NOT NULL DEFAULT 30000,
    request_interval_ms INT NOT NULL DEFAULT 500,
    auth_credentials JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_tested_at TIMESTAMPTZ,
    last_test_status VARCHAR(20),
    last_test_message TEXT,
    updated_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default konfigurasi jika belum ada
INSERT INTO public.scraper_configs (target_name, base_url, timeout_ms, is_active)
VALUES ('BILLINGNESIA', 'https://billing.at-in.net', 30000, true)
ON CONFLICT (target_name) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 2. TABEL: SCRAPER_STAGING (Penampungan & Distribusi Hasil Scrape / Paste)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scraper_staging (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id VARCHAR(100),
    customer_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(50),
    address TEXT,
    cluster_name VARCHAR(100) DEFAULT 'AREA-OPERASIONAL',
    device_type VARCHAR(100) DEFAULT 'ONT + Adaptor',
    notes TEXT,
    staging_status VARCHAR(20) NOT NULL DEFAULT 'NEW', -- 'NEW' | 'DUPLICATE'
    target_destination VARCHAR(20), -- 'DISMANTLE' | 'WORK_LOG'
    is_dispatched BOOLEAN NOT NULL DEFAULT FALSE,
    dispatched_at TIMESTAMPTZ,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraper_staging_status ON public.scraper_staging(staging_status);
CREATE INDEX IF NOT EXISTS idx_scraper_staging_cust ON public.scraper_staging(customer_id);
CREATE INDEX IF NOT EXISTS idx_scraper_staging_ticket ON public.scraper_staging(ticket_id);


-- ----------------------------------------------------------------------------
-- 3. TABEL: FEATURE_FLAGS (Feature Toggle Beta di Settings)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(80) NOT NULL UNIQUE,
    label VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'LAYANAN', -- 'LAYANAN' | 'OPERASIONAL' | 'SECURITY'
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    updated_by VARCHAR(100),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed daftar toggle beta fitur (Semua baru adalah BETA, kecuali Panduan Wi-Fi Modem yang permanen)
INSERT INTO public.feature_flags (key, label, category, is_enabled, description)
VALUES 
    ('BETA_TOPOLOGI_JARINGAN', 'Topologi Jaringan (Mapping GIS)', 'LAYANAN', true, 'Menu visualisasi peta ODP dan persebaran jaringan'),
    ('BETA_MANAGEMENT_CORE', 'Management Core Fiber', 'LAYANAN', true, 'Modul standar warna core TIA-598 dan tube guide'),
    ('BETA_IP_MANAGEMENT', 'IP Management', 'LAYANAN', true, 'Modul manajemen alokasi subnet IP perangkat'),
    ('BETA_LAPORAN_JARINGAN', 'Laporan Jaringan', 'LAYANAN', true, 'Modul rekapitulasi performa uplink dan bandwidth'),
    ('BETA_DATA_PELANGGAN', 'Data Pelanggan', 'LAYANAN', true, 'Tampilan data dan arsip pelanggan Billingnesia'),
    ('BETA_LEMBARAN_STAFF', 'Lembaran Staff (Shifts & Roster)', 'LAYANAN', true, 'Jadwal shift bulanan teknisi dan NOC'),
    ('BETA_INPUT_TIKET_HARIAN', 'Input Tiket Harian (Work Logs)', 'LAYANAN', true, 'Pencatatan aktivitas pekerjaan harian lapangan'),
    ('BETA_RIWAYAT_TIKET', 'Riwayat Tiket Shift', 'LAYANAN', true, 'Arsip rekapitulasi penerimaan dan penanganan tiket'),
    ('BETA_CATATAN_SHEET', 'Catatan Sheet NOC', 'LAYANAN', true, 'Dokumentasi interaktif berbasis multi-tab spreadsheet'),
    ('BETA_NOTION_NOTES', 'Catatan Bebas (Notion-Style)', 'OPERASIONAL', true, 'Editor catatan teknis blok bebas OLT/MikroTik CLI'),
    ('BETA_JADWAL_BACKUP', 'Jadwal Backup Perangkat', 'LAYANAN', true, 'Otomatisasi pengingat backup konfigurasi OLT'),
    ('BETA_WA_TEMPLATES', 'Template Chat WhatsApp Cepat', 'OPERASIONAL', true, 'Modal cepat salin pesan template ke pelanggan')
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description;


-- ----------------------------------------------------------------------------
-- 4. TABEL: LOGIN_ATTEMPTS & BLOCKED_IPS (Keamanan Rate Limiting & Lockout)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(150) NOT NULL, -- username / email
    ip_address VARCHAR(50) NOT NULL,
    failed_count INT NOT NULL DEFAULT 1,
    locked_until TIMESTAMPTZ,
    requires_captcha BOOLEAN NOT NULL DEFAULT FALSE,
    requires_2fa BOOLEAN NOT NULL DEFAULT FALSE,
    last_attempt_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_key ON public.login_attempts(identifier, ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON public.login_attempts(ip_address);

CREATE TABLE IF NOT EXISTS public.blocked_ips (
    ip_address VARCHAR(50) PRIMARY KEY,
    reason TEXT NOT NULL,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'WARNING', -- 'INFO' | 'WARNING' | 'CRITICAL'
    blocked_by VARCHAR(100) DEFAULT 'SYSTEM_FIREWALL',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);


-- ----------------------------------------------------------------------------
-- 5. EKSPANSI TABEL AUDIT LOG (STEALTH AUDIT & BOT INTRUSION DETECTION)
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_activity_audit_logs 
ADD COLUMN IF NOT EXISTS category VARCHAR(30) DEFAULT 'DATA_ACTIVITY', -- 'DATA_ACTIVITY' | 'AUTH_SESSION' | 'BOT_INTRUSION'
ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20) DEFAULT 'INFO',       -- 'INFO' | 'WARNING' | 'CRITICAL'
ADD COLUMN IF NOT EXISTS flagged_bot BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON public.user_activity_audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk ON public.user_activity_audit_logs(risk_level);


-- ----------------------------------------------------------------------------
-- 6. TABEL OPERASIONAL: NOC_SHEETS, NOTION_NOTES, WA_TEMPLATES, SHIFT_REPORTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.noc_sheets (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    columns JSONB NOT NULL DEFAULT '["ID Tiket", "Pelanggan", "Keterangan"]'::jsonb,
    rows JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notion_notes (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) DEFAULT 'UMUM',
    blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_pinned BOOLEAN DEFAULT FALSE,
    updated_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wa_templates (
    id VARCHAR(100) PRIMARY KEY,
    category VARCHAR(50) NOT NULL DEFAULT 'KONFIRMASI PELANGGAN',
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shift_ticket_reports (
    id VARCHAR(100) PRIMARY KEY,
    staff_name VARCHAR(150) NOT NULL,
    shift VARCHAR(50) NOT NULL, -- 'SHIFT PAGI' | 'SHIFT SORE' | 'SHIFT MALAM' | 'SOC'
    date_str VARCHAR(100) NOT NULL,
    date_raw DATE NOT NULL DEFAULT CURRENT_DATE,
    tickets_received INT NOT NULL DEFAULT 0,
    tickets_handled INT NOT NULL DEFAULT 0,
    notes TEXT,
    ticket_list JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Allow server side operations)
ALTER TABLE public.scraper_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noc_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notion_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_ticket_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow server access to scraper_configs" ON public.scraper_configs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow server access to scraper_staging" ON public.scraper_staging FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow server access to feature_flags" ON public.feature_flags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow server access to login_attempts" ON public.login_attempts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow server access to blocked_ips" ON public.blocked_ips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow server access to noc_sheets" ON public.noc_sheets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow server access to notion_notes" ON public.notion_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow server access to wa_templates" ON public.wa_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow server access to shift_ticket_reports" ON public.shift_ticket_reports FOR ALL USING (true) WITH CHECK (true);
