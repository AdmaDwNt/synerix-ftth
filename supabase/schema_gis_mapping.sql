-- ====================================================================
-- SYNERIX FTTH PLATFORM: GIS MAPPING & KML/KMZ INFRASTRUCTURE SCHEMA
-- Modul: GIS Mapping (KML/KMZ Layer, Fiber Network Lines, Network Nodes)
-- Versi: FV-1 (Sesuai pan-infrastruktur-fv1.md)
-- Tanggal: Oktober 2026
-- ====================================================================

-- 0. AKTIFKAN EKSTENSI POSTGIS (Jika didukung oleh instance Supabase)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS postgis;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'PostGIS extension not available or permission denied, using standard JSONB coordinate handling.';
END
$$;

-- --------------------------------------------------------------------
-- 1. TABEL: KML_LAYERS (Metadata File KML/KMZ yang Di-upload)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kml_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT DEFAULT 0,
    total_nodes INTEGER DEFAULT 0,
    total_lines INTEGER DEFAULT 0,
    color VARCHAR(30) DEFAULT '#10B981',
    is_visible BOOLEAN DEFAULT TRUE,
    description TEXT,
    uploaded_by VARCHAR(100) DEFAULT 'Teknisi Lapangan',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kml_layers_created_at ON public.kml_layers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kml_layers_is_visible ON public.kml_layers(is_visible);

-- --------------------------------------------------------------------
-- 2. TABEL: NETWORK_NODES (Titik Perangkat FTTH: ODP, ODC, POP, Tiang, dll)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.network_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layer_id UUID REFERENCES public.kml_layers(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'ODP',
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    capacity INTEGER DEFAULT 8,
    used_ports INTEGER DEFAULT 0,
    raw_properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrasi penyesuaian kolom jika tabel network_nodes sudah dibuat sebelumnya
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_nodes' AND column_name = 'layer_id') THEN
        ALTER TABLE public.network_nodes ADD COLUMN layer_id UUID REFERENCES public.kml_layers(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_nodes' AND column_name = 'raw_properties') THEN
        ALTER TABLE public.network_nodes ADD COLUMN raw_properties JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_nodes' AND column_name = 'capacity') THEN
        ALTER TABLE public.network_nodes ADD COLUMN capacity INTEGER DEFAULT 8;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_nodes' AND column_name = 'used_ports') THEN
        ALTER TABLE public.network_nodes ADD COLUMN used_ports INTEGER DEFAULT 0;
    END IF;

    -- Update check constraint tipe agar mendukung TIANG, CLOSURE, SERVER, dll
    ALTER TABLE public.network_nodes DROP CONSTRAINT IF EXISTS network_nodes_type_check;
    ALTER TABLE public.network_nodes ADD CONSTRAINT network_nodes_type_check 
        CHECK (type IN ('SERVER', 'POP', 'ODC', 'ODP', 'CUSTOMER', 'DISMANTLE', 'TIANG', 'CLOSURE', 'OTHER'));
END
$$;

CREATE INDEX IF NOT EXISTS idx_network_nodes_layer ON public.network_nodes(layer_id);
CREATE INDEX IF NOT EXISTS idx_network_nodes_type ON public.network_nodes(type);
CREATE INDEX IF NOT EXISTS idx_network_nodes_coords ON public.network_nodes(latitude, longitude);

-- --------------------------------------------------------------------
-- 3. TABEL: NETWORK_LINES (Jalur Koordinat Kabel Fiber Optik / LineString)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.network_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layer_id UUID REFERENCES public.kml_layers(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    cable_type VARCHAR(50) DEFAULT 'DISTRIBUTION', -- FEEDER, DISTRIBUTION, DROP_CABLE, BACKBONE
    core_capacity INTEGER DEFAULT 24,
    color VARCHAR(30) DEFAULT '#0284C7',
    coordinates JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array [[lat, lng], [lat, lng], ...]
    length_meters DOUBLE PRECISION DEFAULT 0,
    raw_properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_lines_layer ON public.network_lines(layer_id);
CREATE INDEX IF NOT EXISTS idx_network_lines_cable_type ON public.network_lines(cable_type);

-- --------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS UNTUK OPERASIONAL TEKNISI
-- --------------------------------------------------------------------
ALTER TABLE public.kml_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_lines ENABLE ROW LEVEL SECURITY;

-- Policies: kml_layers
CREATE POLICY "Public Read Kml Layers" ON public.kml_layers FOR SELECT USING (true);
CREATE POLICY "Public Insert Kml Layers" ON public.kml_layers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Kml Layers" ON public.kml_layers FOR UPDATE USING (true);
CREATE POLICY "Public Delete Kml Layers" ON public.kml_layers FOR DELETE USING (true);

-- Policies: network_nodes
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Read Network Nodes" ON public.network_nodes;
    DROP POLICY IF EXISTS "Public Insert Network Nodes" ON public.network_nodes;
    DROP POLICY IF EXISTS "Public Update Network Nodes" ON public.network_nodes;
    DROP POLICY IF EXISTS "Public Delete Network Nodes" ON public.network_nodes;
    
    CREATE POLICY "Public Read Network Nodes" ON public.network_nodes FOR SELECT USING (true);
    CREATE POLICY "Public Insert Network Nodes" ON public.network_nodes FOR INSERT WITH CHECK (true);
    CREATE POLICY "Public Update Network Nodes" ON public.network_nodes FOR UPDATE USING (true);
    CREATE POLICY "Public Delete Network Nodes" ON public.network_nodes FOR DELETE USING (true);
END
$$;

-- Policies: network_lines
CREATE POLICY "Public Read Network Lines" ON public.network_lines FOR SELECT USING (true);
CREATE POLICY "Public Insert Network Lines" ON public.network_lines FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Network Lines" ON public.network_lines FOR UPDATE USING (true);
CREATE POLICY "Public Delete Network Lines" ON public.network_lines FOR DELETE USING (true);

-- --------------------------------------------------------------------
-- 5. SEED DATA DUMMY GIS UNTUK KEDIRI NETWORK (Verifikasi Awal)
-- --------------------------------------------------------------------
DO $$
DECLARE
    v_layer_id UUID;
BEGIN
    -- Cek jika sample layer belum ada
    IF NOT EXISTS (SELECT 1 FROM public.kml_layers WHERE name = 'Feeder & ODP Mojoroto Induk') THEN
        INSERT INTO public.kml_layers (name, filename, file_size_bytes, total_nodes, total_lines, color, description)
        VALUES ('Feeder & ODP Mojoroto Induk', 'feeder_mojoroto_v1.kmz', 48200, 4, 1, '#10B981', 'Jalur distribusi feeder dan ODP utama cluster Mojoroto')
        RETURNING id INTO v_layer_id;

        -- Seed Nodes terkait Layer
        INSERT INTO public.network_nodes (layer_id, name, type, description, latitude, longitude, capacity, used_ports)
        VALUES
            (v_layer_id, 'SERVER-HEADEND-KDR', 'SERVER', 'Pusat Server Headend Kediri', -7.818000, 111.992000, 48, 12),
            (v_layer_id, 'ODC-MHS-01', 'ODC', 'ODC Induk Mojoroto Kapasitas 144 Core', -7.819200, 111.994500, 144, 48),
            (v_layer_id, 'ODP-MHS-01', 'ODP', 'ODP Jalan KH Wachid Hasyim No 12', -7.820500, 111.996800, 16, 11),
            (v_layer_id, 'T-MHS-08', 'TIANG', 'Tiang Besi 7 Meter PLN Sharing', -7.821300, 111.998200, 0, 0);

        -- Seed Line Kabel Fiber Optik terkait Layer
        INSERT INTO public.network_lines (layer_id, name, cable_type, core_capacity, color, coordinates, length_meters)
        VALUES
            (v_layer_id, 'CABLE-FEEDER-ODC01-TO-ODP01', 'FEEDER', 48, '#0284C7', 
             '[["-7.818000", "111.992000"], ["-7.819200", "111.994500"], ["-7.820500", "111.996800"], ["-7.821300", "111.998200"]]'::jsonb, 
             820.5);
    END IF;
END
$$;
