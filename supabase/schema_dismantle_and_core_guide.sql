-- ====================================================================
-- SYNERIX FTTH PLATFORM: MIGRATION SCRIPT
-- Modul: Dismantle Tasks & Guide Core (Joint Boxes & Splicing Matrix)
-- Date: Oktober 2026
-- ====================================================================

-- 1. TABEL: DISMANTLE TASKS
CREATE TABLE IF NOT EXISTS public.dismantle_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(50) NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(25),
    address TEXT NOT NULL,
    cluster_name VARCHAR(100) NOT NULL,
    parent_odp_id UUID,
    parent_odp_name VARCHAR(100),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'QUEUE' CHECK (status IN ('QUEUE', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
    device_type VARCHAR(100) DEFAULT 'ONT ZTE F609',
    serial_number VARCHAR(100),
    mac_address VARCHAR(50),
    accessories TEXT[] DEFAULT ARRAY['ADAPTOR', 'PATCHCORD'],
    evidence_photo_url TEXT,
    failure_reason TEXT,
    technician_name VARCHAR(100),
    completed_at TIMESTAMPTZ,
    handover_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing untuk pencarian cepat & grouping
CREATE INDEX IF NOT EXISTS idx_dismantle_cluster ON public.dismantle_tasks(cluster_name);
CREATE INDEX IF NOT EXISTS idx_dismantle_status ON public.dismantle_tasks(status);
CREATE INDEX IF NOT EXISTS idx_dismantle_parent_odp ON public.dismantle_tasks(parent_odp_name);

-- 2. TABEL: JOINT BOXES (CLOSURES)
CREATE TABLE IF NOT EXISTS public.joint_boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    closure_type VARCHAR(50) NOT NULL DEFAULT 'DOME_CLOSURE' CHECK (closure_type IN ('DOME_CLOSURE', 'INLINE_CLOSURE', 'ODC_TRAY', 'OPTICAL_SPLITTER_BOX')),
    cluster_area VARCHAR(100) NOT NULL,
    pole_number VARCHAR(50),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    capacity_cores INTEGER NOT NULL DEFAULT 48,
    tray_count INTEGER NOT NULL DEFAULT 4,
    tray_photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_joint_boxes_cluster ON public.joint_boxes(cluster_area);

-- 3. TABEL: JOINT BOX SPLICES (MATRIKS TRAKEA SAMBUNGAN CORE)
CREATE TABLE IF NOT EXISTS public.joint_box_splices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    joint_box_id UUID NOT NULL REFERENCES public.joint_boxes(id) ON DELETE CASCADE,
    tray_number INTEGER NOT NULL DEFAULT 1,
    in_cable_name VARCHAR(100) NOT NULL,
    in_tube_num INTEGER NOT NULL CHECK (in_tube_num BETWEEN 1 AND 12),
    in_core_num INTEGER NOT NULL CHECK (in_core_num BETWEEN 1 AND 12),
    in_core_global INTEGER NOT NULL,
    out_cable_name VARCHAR(100) NOT NULL,
    out_tube_num INTEGER NOT NULL CHECK (out_tube_num BETWEEN 1 AND 12),
    out_core_num INTEGER NOT NULL CHECK (out_core_num BETWEEN 1 AND 12),
    out_core_global INTEGER NOT NULL,
    splice_type VARCHAR(30) NOT NULL DEFAULT 'FUSION_SPLICE' CHECK (splice_type IN ('FUSION_SPLICE', 'MECHANICAL', 'PASS_THROUGH')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SPARE', 'DAMAGED')),
    destination_target VARCHAR(150),
    optical_loss_db DECIMAL(4,2) DEFAULT 0.03,
    technician_notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_splices_joint_box ON public.joint_box_splices(joint_box_id);
CREATE INDEX IF NOT EXISTS idx_splices_status ON public.joint_box_splices(status);

-- 4. ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC READ/WRITE ACCESS UNTUK OPERASIONAL TEKNISI
ALTER TABLE public.dismantle_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.joint_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.joint_box_splices ENABLE ROW LEVEL SECURITY;

-- Allow anon & authenticated user to SELECT, INSERT, UPDATE
CREATE POLICY "Public Read Dismantle Tasks" ON public.dismantle_tasks FOR SELECT USING (true);
CREATE POLICY "Public Insert Dismantle Tasks" ON public.dismantle_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Dismantle Tasks" ON public.dismantle_tasks FOR UPDATE USING (true);

CREATE POLICY "Public Read Joint Boxes" ON public.joint_boxes FOR SELECT USING (true);
CREATE POLICY "Public Insert Joint Boxes" ON public.joint_boxes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Joint Boxes" ON public.joint_boxes FOR UPDATE USING (true);

CREATE POLICY "Public Read Splices" ON public.joint_box_splices FOR SELECT USING (true);
CREATE POLICY "Public Insert Splices" ON public.joint_box_splices FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Splices" ON public.joint_box_splices FOR UPDATE USING (true);
CREATE POLICY "Public Delete Splices" ON public.joint_box_splices FOR DELETE USING (true);

-- 5. SEED DATA CONTOH OPERASIONAL LAPANGAN (KEDIRI & SEKITARNYA)
INSERT INTO public.joint_boxes (id, name, closure_type, cluster_area, pole_number, latitude, longitude, capacity_cores, tray_count, notes)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'JB-MOJOROTO-01', 'DOME_CLOSURE', 'Mojoroto', 'TIANG-TEL-45', -7.818200, 111.995400, 48, 4, 'Dekat perempatan Mojoroto, tray 1 feeder utama'),
    ('22222222-2222-2222-2222-222222222222', 'JB-PESANTREN-02', 'INLINE_CLOSURE', 'Pesantren', 'TIANG-PST-12', -7.835100, 112.032100, 24, 2, 'Kabel slack 10m di atas tiang PLN')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.joint_box_splices (joint_box_id, tray_number, in_cable_name, in_tube_num, in_core_num, in_core_global, out_cable_name, out_tube_num, out_core_num, out_core_global, splice_type, status, destination_target, optical_loss_db)
VALUES
    ('11111111-1111-1111-1111-111111111111', 1, 'Feeder Utama POP A (48c)', 1, 1, 1, 'Distribusi Mojoroto Indah (24c)', 1, 1, 1, 'FUSION_SPLICE', 'ACTIVE', 'ODP-MHS-01 Port 1', 0.02),
    ('11111111-1111-1111-1111-111111111111', 1, 'Feeder Utama POP A (48c)', 1, 2, 2, 'Distribusi Mojoroto Indah (24c)', 1, 2, 2, 'FUSION_SPLICE', 'ACTIVE', 'ODP-MHS-01 Port 2', 0.03),
    ('11111111-1111-1111-1111-111111111111', 1, 'Feeder Utama POP A (48c)', 1, 3, 3, 'Distribusi Mojoroto Indah (24c)', 1, 3, 3, 'FUSION_SPLICE', 'SPARE', 'Cadangan Cluster B', 0.01),
    ('11111111-1111-1111-1111-111111111111', 1, 'Feeder Utama POP A (48c)', 1, 4, 4, 'Distribusi Mojoroto Indah (24c)', 1, 4, 4, 'FUSION_SPLICE', 'DAMAGED', 'Core micro-bending tinggi', 1.85)
ON CONFLICT DO NOTHING;

INSERT INTO public.dismantle_tasks (customer_id, customer_name, phone_number, address, cluster_name, parent_odp_name, latitude, longitude, status, device_type, serial_number)
VALUES
    ('CUST-KDR-081', 'Bpk. Hendra Pratama', '081234567890', 'Perum Kediri Permai Blok B No. 12', 'Mojoroto', 'ODP-MHS-01', -7.819400, 111.996100, 'QUEUE', 'ZTE F609', 'ZTEGC9812A45'),
    ('CUST-KDR-082', 'Ibu Ratna Dewi', '085712349911', 'Jl. KH. Wachid Hasyim No. 44', 'Mojoroto', 'ODP-MHS-01', -7.821100, 111.998500, 'IN_PROGRESS', 'Huawei HG8245H5', '48575443ABC1'),
    ('CUST-KDR-095', 'Bp. Anton Wijaya', '082199887766', 'Perum Pesantren Asri Blok C-05', 'Pesantren', 'ODP-PST-03', -7.836200, 112.033500, 'QUEUE', 'Fiberhome HG6243C', 'FHTT98347102'),
-- 6. TABEL: NETWORK NODES (GEOGRAPHIC GIS MAPPING TAGGING)
CREATE TABLE IF NOT EXISTS public.network_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'ODP' CHECK (type IN ('SERVER', 'POP', 'ODC', 'ODP', 'CUSTOMER', 'DISMANTLE')),
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_nodes_type ON public.network_nodes(type);

ALTER TABLE public.network_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Network Nodes" ON public.network_nodes FOR SELECT USING (true);
CREATE POLICY "Public Insert Network Nodes" ON public.network_nodes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Network Nodes" ON public.network_nodes FOR UPDATE USING (true);
CREATE POLICY "Public Delete Network Nodes" ON public.network_nodes FOR DELETE USING (true);

-- 7. TABEL: SHIFT ROSTERS (JADWAL SHIFT BULANAN OPERASIONAL TEKNISI / NOC / PSG)
CREATE TABLE IF NOT EXISTS public.shift_rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_year VARCHAR(50) NOT NULL, -- Format: "AGUSTUS 2026"
    group_name VARCHAR(50) NOT NULL DEFAULT 'NAMA TEKNISI', -- NAMA TEKNISI, NAMA NOC, NAMA PESERTA PSG
    employee_name VARCHAR(100) NOT NULL,
    daily_shifts JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"1": "SOC", "2": "LIBUR", "3": "PAGI", ...}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shift_rosters_month ON public.shift_rosters(month_year);
CREATE INDEX IF NOT EXISTS idx_shift_rosters_group ON public.shift_rosters(group_name);

ALTER TABLE public.shift_rosters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Shift Rosters" ON public.shift_rosters FOR SELECT USING (true);
CREATE POLICY "Public Insert Shift Rosters" ON public.shift_rosters FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Shift Rosters" ON public.shift_rosters FOR UPDATE USING (true);
CREATE POLICY "Public Delete Shift Rosters" ON public.shift_rosters FOR DELETE USING (true);


