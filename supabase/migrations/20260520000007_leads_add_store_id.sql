-- ============================================================
-- Ensure leads table exists + add store_id (nullable, FK to stores)
-- ============================================================
--
-- Konteks: tabel `leads` awalnya untuk landing-page lead capture (global,
-- via leads-collector edge function). Migrasi awal (20250925) buat tabel
-- ini, tapi mungkin tidak jalan di semua environment. Migrasi ini
-- self-healing — create table kalau belum ada, atau alter kalau sudah.
--
-- store_id nullable: legacy leads (global / landing page) tetap valid
-- tanpa store_id.
-- ============================================================

-- 1. Create leads table kalau belum ada (idempotent)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'unknown',
  project TEXT NOT NULL DEFAULT 'unknown',
  source TEXT NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tambah kolom yang dibutuhkan code & seeder (idempotent via IF NOT EXISTS)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS referrer TEXT;

-- 3. Index untuk filter store-scoped
CREATE INDEX IF NOT EXISTS idx_leads_store_id ON public.leads(store_id) WHERE store_id IS NOT NULL;

-- 4. RLS — permissive (akses via service client di server-side code)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'leads' AND policyname = 'leads_service_role_all'
  ) THEN
    CREATE POLICY "leads_service_role_all" ON public.leads
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
