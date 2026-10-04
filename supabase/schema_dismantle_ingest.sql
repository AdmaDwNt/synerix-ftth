-- ====================================================================
-- SYNERIX FTTH PLATFORM: MIGRATION SCRIPT
-- Modul: Smart Auto-Ingest Dismantle via Bookmarklet (Mobile-First)
-- Target Table: public.dismantle_tasks
-- Tanggal: Oktober 2026
-- ====================================================================

-- 1. Tambah kolom pendukung ingest tiket, penagihan, dan URL Billingnesia
ALTER TABLE public.dismantle_tasks 
ADD COLUMN IF NOT EXISTS ticket_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS unpaid_amount NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS billing_url TEXT,
ADD COLUMN IF NOT EXISTS auto_ingested BOOLEAN DEFAULT FALSE;

-- 2. Tambahkan constraint UNIQUE pada ticket_id untuk mendukung operasi UPSERT tanpa duplikasi
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_dismantle_tasks_ticket_id'
    ) THEN
        ALTER TABLE public.dismantle_tasks 
        ADD CONSTRAINT uq_dismantle_tasks_ticket_id UNIQUE (ticket_id);
    END IF;
END $$;

-- 3. Tambahkan Index untuk mempercepat lookup data saat ingest & filter
CREATE INDEX IF NOT EXISTS idx_dismantle_tasks_ticket_id 
ON public.dismantle_tasks(ticket_id);

CREATE INDEX IF NOT EXISTS idx_dismantle_tasks_auto_ingested 
ON public.dismantle_tasks(auto_ingested);

CREATE INDEX IF NOT EXISTS idx_dismantle_tasks_unpaid 
ON public.dismantle_tasks(unpaid_amount);

-- 4. Dokumentasi Kolom (Database Comments)
COMMENT ON COLUMN public.dismantle_tasks.ticket_id IS 'Nomor tiket resmi dari Billingnesia (e.g. TKT202610014768)';
COMMENT ON COLUMN public.dismantle_tasks.unpaid_amount IS 'Total tagihan jatuh tempo yang belum dibayar dalam Rupiah';
COMMENT ON COLUMN public.dismantle_tasks.billing_url IS 'Tautan langsung ke halaman tiket Billingnesia untuk referensi teknisi';
COMMENT ON COLUMN public.dismantle_tasks.auto_ingested IS 'Flag boolean penanda bahwa data di-input otomatis via Bookmarklet HP';
