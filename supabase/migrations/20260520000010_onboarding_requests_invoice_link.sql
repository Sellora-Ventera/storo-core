-- Link onboarding_requests to invoices so dashboard can filter out unpaid
-- pending requests. Before this migration, the dashboard showed onboarding
-- requests regardless of payment status — users complained about "stores
-- appearing whether I pay or not" because pending onboarding_requests are
-- created at checkout submission, not after payment confirmation.
--
-- Nullable on purpose:
--   1. Backwards compat — existing rows have no link, dashboard treats them
--      as "show by default" (legacy behavior).
--   2. Free/promo onboarding flows (if any) may not have an associated
--      invoice — leaving NULL is intentional.

ALTER TABLE onboarding_requests
  ADD COLUMN IF NOT EXISTS invoice_id UUID
    REFERENCES invoices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_onboarding_requests_invoice_id
  ON onboarding_requests(invoice_id);

COMMENT ON COLUMN onboarding_requests.invoice_id IS
  'FK ke invoice setup. NULL = legacy row (pre-migration) atau free flow tanpa invoice. Dashboard filter pending requests berdasar invoice.status (lihat dashboard/page.tsx).';
