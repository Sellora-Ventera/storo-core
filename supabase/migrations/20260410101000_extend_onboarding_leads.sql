-- ============================================================
-- Extend onboarding_leads for order-first registration flow
-- Adds tracking fields so leads can be linked to created
-- client accounts and invoices after checkout
-- ============================================================

ALTER TABLE public.onboarding_leads
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS store_name TEXT,
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id),
  ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add status constraint separately (avoids issues if column pre-exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'onboarding_leads_status_check'
  ) THEN
    ALTER TABLE public.onboarding_leads
      ADD CONSTRAINT onboarding_leads_status_check
      CHECK (status IN ('pending', 'account_created', 'paid', 'converted', 'abandoned'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_onboarding_leads_email
  ON public.onboarding_leads(email);

CREATE INDEX IF NOT EXISTS idx_onboarding_leads_client_id
  ON public.onboarding_leads(client_id);
