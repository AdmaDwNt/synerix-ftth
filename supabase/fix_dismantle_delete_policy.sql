-- =========================================================================
-- SYNERIX FTTH PLATFORM: FIX DELETE PERMISSION (RLS POLICY) FOR DISMANTLE
-- Jalankan skrip ini pada: Supabase Dashboard > SQL Editor > Run
-- =========================================================================

-- 1. Berikan hak akses DELETE untuk tabel dismantle_tasks
ALTER TABLE public.dismantle_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Delete Dismantle Tasks" ON public.dismantle_tasks;
CREATE POLICY "Public Delete Dismantle Tasks" ON public.dismantle_tasks 
FOR DELETE 
USING (true);

-- 2. Berikan hak akses DELETE untuk tabel joint_boxes (Modul Core Guide)
ALTER TABLE public.joint_boxes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Delete Joint Boxes" ON public.joint_boxes;
CREATE POLICY "Public Delete Joint Boxes" ON public.joint_boxes 
FOR DELETE 
USING (true);
