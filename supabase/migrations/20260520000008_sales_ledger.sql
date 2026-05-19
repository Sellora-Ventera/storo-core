-- ============================================================
-- Sales Ledger untuk mode storo_gateway
--
-- Append-only ledger yang mencatat:
--   - sale       (kredit dari order completed, dipicu cron 7 hari post-delivered)
--   - withdrawal (debit dari disbursement berhasil)
--   - refund     (debit dari pembatalan/return setelah credit sale)
--   - adjustment (manual koreksi oleh superadmin)
--
-- Saldo tersedia dihitung on-the-fly via view sales_balance_summary
-- (tidak ada tabel balance cached — single source of truth = ledger).
--
-- Terpisah dari store_wallets / wallet_transactions yang khusus own_prepaid.
-- ============================================================

-- 1. Append-only ledger
CREATE TABLE IF NOT EXISTS public.sales_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sale', 'withdrawal', 'refund', 'adjustment')),
  amount BIGINT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  disbursement_id UUID REFERENCES public.disbursements(id) ON DELETE SET NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS idx_sales_ledger_store_created
  ON public.sales_ledger_entries(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_ledger_store_type
  ON public.sales_ledger_entries(store_id, type);
CREATE INDEX IF NOT EXISTS idx_sales_ledger_disbursement
  ON public.sales_ledger_entries(disbursement_id)
  WHERE disbursement_id IS NOT NULL;
-- Idempotency: max satu entry sale/refund per order
CREATE UNIQUE INDEX IF NOT EXISTS ux_sales_ledger_sale_per_order
  ON public.sales_ledger_entries(order_id)
  WHERE type = 'sale' AND order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_sales_ledger_refund_per_order
  ON public.sales_ledger_entries(order_id)
  WHERE type = 'refund' AND order_id IS NOT NULL;
-- 2. RLS
ALTER TABLE public.sales_ledger_entries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sales_ledger_entries' AND policyname = 'own_sales_ledger_select'
  ) THEN
    CREATE POLICY "own_sales_ledger_select" ON public.sales_ledger_entries
      FOR SELECT USING (
        store_id IN (
          SELECT s.id FROM public.stores s
          JOIN public.clients c ON c.id = s.client_id
          WHERE c.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;
-- 3. Summary view: saldo tersedia dihitung on-the-fly
CREATE OR REPLACE VIEW public.sales_balance_summary AS
SELECT
  store_id,
  COALESCE(SUM(amount) FILTER (WHERE type = 'sale'), 0) AS total_sales,
  COALESCE(-SUM(amount) FILTER (WHERE type = 'withdrawal'), 0) AS total_withdrawn,
  COALESCE(-SUM(amount) FILTER (WHERE type = 'refund'), 0) AS total_refunded,
  COALESCE(SUM(amount) FILTER (WHERE type = 'adjustment'), 0) AS total_adjustment,
  COALESCE(SUM(amount), 0) AS available_balance
FROM public.sales_ledger_entries
GROUP BY store_id;
-- 4. Extend disbursements untuk membedakan kind & track requester
ALTER TABLE public.disbursements
  ADD COLUMN IF NOT EXISTS kind TEXT,
  ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS bank_snapshot JSONB;
-- Backfill: row existing = platform_payout (superadmin-initiated)
UPDATE public.disbursements SET kind = 'platform_payout' WHERE kind IS NULL;
-- Set NOT NULL + CHECK + DEFAULT untuk row mendatang
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'disbursements'
      AND column_name = 'kind' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.disbursements ALTER COLUMN kind SET NOT NULL;
    ALTER TABLE public.disbursements ALTER COLUMN kind SET DEFAULT 'platform_payout';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'disbursements'
      AND constraint_name = 'disbursements_kind_check'
  ) THEN
    ALTER TABLE public.disbursements
      ADD CONSTRAINT disbursements_kind_check
      CHECK (kind IN ('sales_withdrawal', 'platform_payout'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_disbursements_kind
  ON public.disbursements(kind);
COMMENT ON TABLE public.sales_ledger_entries IS
  'Append-only ledger untuk storo_gateway. Tidak ada balance cached; saldo via sales_balance_summary view.';
COMMENT ON COLUMN public.sales_ledger_entries.amount IS
  'Positif = credit (sale), negatif = debit (withdrawal/refund/adjustment).';
COMMENT ON COLUMN public.disbursements.kind IS
  'sales_withdrawal = seller-initiated dari sales ledger; platform_payout = superadmin-initiated manual.';
COMMENT ON COLUMN public.disbursements.bank_snapshot IS
  'Snapshot rekening saat request dibuat (bank_name, bank_account_name, bank_account_number). Cegah drift bila seller ubah rekening.';
