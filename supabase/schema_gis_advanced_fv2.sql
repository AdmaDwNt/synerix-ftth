-- ====================================================================
-- SYNERIX FTTH PLATFORM: ADVANCED GIS SUITE & FULL CRUD (FV-2)
-- Modul: GIS Mapping (Expanded Nodes, Lines, ODP Ports & Audit Logs)
-- Versi: FV-2 (Sesuai plan-gis-advanced-fv2.md)
-- Tanggal: Oktober 2026
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. EKSPANSI TABEL: NETWORK_NODES (Status, Tiang, Foto, & Hierarki)
-- --------------------------------------------------------------------
DO $$
BEGIN
    -- Status Operasional Node
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_nodes' AND column_name = 'status') THEN
        ALTER TABLE public.network_nodes ADD COLUMN status VARCHAR(30) DEFAULT 'ACTIVE';
        ALTER TABLE public.network_nodes ADD CONSTRAINT chk_node_status 
            CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'FULL', 'PLANNING', 'DAMAGED'));
    END IF;

    -- Relasi Hierarki (Misal ODP terhubung ke ODC Induk)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_nodes' AND column_name = 'parent_node_id') THEN
        ALTER TABLE public.network_nodes ADD COLUMN parent_node_id UUID REFERENCES public.network_nodes(id) ON DELETE SET NULL;
    END IF;

    -- Nomor / Kode Tiang Fisik (PLN / Telkom / Icon / Mandiri)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_nodes' AND column_name = 'pole_number') THEN
        ALTER TABLE public.network_nodes ADD COLUMN pole_number VARCHAR(50);
    END IF;

    -- Alamat Lengkap / Patokan Jalan
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_nodes' AND column_name = 'address') THEN
        ALTER TABLE public.network_nodes ADD COLUMN address TEXT;
    END IF;

    -- URL Foto Fisik Instalasi di Lapangan
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_nodes' AND column_name = 'photo_url') THEN
        ALTER TABLE public.network_nodes ADD COLUMN photo_url TEXT;
    END IF;

    -- Catatan Tambahan Teknisi
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_nodes' AND column_name = 'notes') THEN
        ALTER TABLE public.network_nodes ADD COLUMN notes TEXT;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_network_nodes_status ON public.network_nodes(status);
CREATE INDEX IF NOT EXISTS idx_network_nodes_parent ON public.network_nodes(parent_node_id);
CREATE INDEX IF NOT EXISTS idx_network_nodes_pole ON public.network_nodes(pole_number);

-- --------------------------------------------------------------------
-- 2. EKSPANSI TABEL: NETWORK_LINES (Status Jalur, Tipe Instalasi & Node Relasi)
-- --------------------------------------------------------------------
DO $$
BEGIN
    -- Tipe Instalasi Kabel (Udara / Tanam / Ducting)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_lines' AND column_name = 'installation_type') THEN
        ALTER TABLE public.network_lines ADD COLUMN installation_type VARCHAR(30) DEFAULT 'AERIAL';
        ALTER TABLE public.network_lines ADD CONSTRAINT chk_line_install_type 
            CHECK (installation_type IN ('AERIAL', 'UNDERGROUND', 'DUCT'));
    END IF;

    -- Status Kondisi Fisik Jalur Kabel
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_lines' AND column_name = 'status') THEN
        ALTER TABLE public.network_lines ADD COLUMN status VARCHAR(30) DEFAULT 'NORMAL';
        ALTER TABLE public.network_lines ADD CONSTRAINT chk_line_status 
            CHECK (status IN ('NORMAL', 'CUT', 'HIGH_ATTENUATION', 'MAINTENANCE'));
    END IF;

    -- Node Awal dan Node Akhir Jalur Tarikan Kabel
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_lines' AND column_name = 'start_node_id') THEN
        ALTER TABLE public.network_lines ADD COLUMN start_node_id UUID REFERENCES public.network_nodes(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_lines' AND column_name = 'end_node_id') THEN
        ALTER TABLE public.network_lines ADD COLUMN end_node_id UUID REFERENCES public.network_nodes(id) ON DELETE SET NULL;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_network_lines_status ON public.network_lines(status);

-- --------------------------------------------------------------------
-- 3. TABEL BARU: ODP_PORTS (Manajemen Kapasitas & Okupansi Port Fisik)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.odp_ports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES public.network_nodes(id) ON DELETE CASCADE,
    port_number INTEGER NOT NULL CHECK (port_number BETWEEN 1 AND 32),
    status VARCHAR(20) NOT NULL DEFAULT 'IDLE' CHECK (status IN ('IDLE', 'OCCUPIED', 'RESERVED', 'DAMAGED')),
    customer_id VARCHAR(50),
    customer_name VARCHAR(150),
    optical_power_dbm DECIMAL(5,2), -- e.g. -18.25 dBm
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_node_port UNIQUE (node_id, port_number)
);

CREATE INDEX IF NOT EXISTS idx_odp_ports_node ON public.odp_ports(node_id);
CREATE INDEX IF NOT EXISTS idx_odp_ports_status ON public.odp_ports(status);
CREATE INDEX IF NOT EXISTS idx_odp_ports_cust ON public.odp_ports(customer_id);

ALTER TABLE public.odp_ports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read ODP Ports" ON public.odp_ports FOR SELECT USING (true);
CREATE POLICY "Public Insert ODP Ports" ON public.odp_ports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update ODP Ports" ON public.odp_ports FOR UPDATE USING (true);
CREATE POLICY "Public Delete ODP Ports" ON public.odp_ports FOR DELETE USING (true);

-- --------------------------------------------------------------------
-- 4. TABEL BARU: GIS_AUDIT_LOGS (Pencatatan Jejak Aksi CRUD Teknisi)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gis_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('NODE', 'LINE', 'LAYER', 'PORT')),
    entity_id UUID NOT NULL,
    entity_name VARCHAR(150),
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'BATCH_DELETE')),
    performed_by VARCHAR(100) DEFAULT 'Teknisi Lapangan',
    changes_summary JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gis_audit_entity ON public.gis_audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_gis_audit_created ON public.gis_audit_logs(created_at DESC);

ALTER TABLE public.gis_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read GIS Audit" ON public.gis_audit_logs FOR SELECT USING (true);
CREATE POLICY "Public Insert GIS Audit" ON public.gis_audit_logs FOR INSERT WITH CHECK (true);

-- --------------------------------------------------------------------
-- 5. FUNCTION HELPER: INISIALISASI PORT OTOMATIS SAAT ODP DIBUAT
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_init_odp_ports(p_node_id UUID, p_capacity INTEGER)
RETURNS VOID AS $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..p_capacity LOOP
        INSERT INTO public.odp_ports (node_id, port_number, status)
        VALUES (p_node_id, i, 'IDLE')
        ON CONFLICT (node_id, port_number) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
