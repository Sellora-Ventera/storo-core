-- ============================================================
-- Reconcile disbursements table schema
--
-- Background: Existing prod table has schema MISMATCH with API code:
--   - Prod has: period_start DATE NOT NULL, period_end DATE NOT NULL
--   - API uses: period_label TEXT
--   - UI form input: cuma "periodLabel" string (e.g. "Mei 2026")
-- This means feature is broken — INSERT akan fail karena period_start/end NOT NULL.
-- Confirmed: 0 rows in prod, jadi feature memang belum pernah dipakai.
--
-- Action: drop period_start/end (no data risk), add period_label as canonical,
-- add client_id (denormalized for RLS perf) + missing columns + indexes + RLS.
--
-- Idempotent — safe to re-run.
-- ============================================================

-- 1. Ensure table exists (no-op if already there)
CREATE TABLE IF NOT EXISTS public.disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  period_label TEXT,
  gross_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  pg_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  ops_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'paid')),
  paid_at TIMESTAMPTZ,
  notes TEXT,
  payment_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add missing columns to existing table (idempotent)
ALTER TABLE public.disbursements
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id),
  ADD COLUMN IF NOT EXISTS period_label TEXT,
  ADD COLUMN IF NOT EXISTS payment_ref TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 3. Drop legacy period_start/period_end (safe: 0 rows confirmed)
ALTER TABLE public.disbursements
  DROP COLUMN IF EXISTS period_start,
  DROP COLUMN IF EXISTS period_end;

-- 4. Now make period_label NOT NULL (after ensuring column exists & 0 rows)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'disbursements'
      AND column_name = 'period_label'
      AND is_nullable = 'YES'
  ) THEN
    -- Backfill any NULL period_label (defensive — shouldn't be any)
    UPDATE public.disbursements SET period_label = 'unspecified' WHERE period_label IS NULL;
    ALTER TABLE public.disbursements ALTER COLUMN period_label SET NOT NULL;
  END IF;
END $$;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_disbursements_store_id ON public.disbursements(store_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_client_id ON public.disbursements(client_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_status ON public.disbursements(status);
CREATE INDEX IF NOT EXISTS idx_disbursements_created_at ON public.disbursements(created_at DESC);

-- 6. Auto-populate client_id from store_id on INSERT
CREATE OR REPLACE FUNCTION public.populate_disbursement_client_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_id IS NULL AND NEW.store_id IS NOT NULL THEN
    SELECT client_id INTO NEW.client_id FROM public.stores WHERE id = NEW.store_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS disbursements_populate_client_id ON public.disbursements;
CREATE TRIGGER disbursements_populate_client_id
  BEFORE INSERT ON public.disbursements
  FOR EACH ROW EXECUTE FUNCTION public.populate_disbursement_client_id();

-- 7. updated_at trigger (reuse existing function)
DROP TRIGGER IF EXISTS update_disbursements_updated_at ON public.disbursements;
CREATE TRIGGER update_disbursements_updated_at
  BEFORE UPDATE ON public.disbursements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Backfill client_id for existing rows (idempotent, no-op for empty table)
UPDATE public.disbursements d
SET client_id = s.client_id
FROM public.stores s
WHERE d.store_id = s.id AND d.client_id IS NULL;

-- 9. RLS — owner SELECT own, service role does mutations
ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'disbursements' AND policyname = 'own_disbursements_select'
  ) THEN
    CREATE POLICY "own_disbursements_select" ON public.disbursements
      FOR SELECT USING (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()::text)
      );
  END IF;
END $$;
