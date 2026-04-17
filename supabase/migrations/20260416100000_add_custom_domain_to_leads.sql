-- ============================================================
-- Add custom_domain column to onboarding_leads
-- Stores the custom domain selected during onboarding wizard
-- (e.g. "namatoko.com"), separate from selected_domain (subdomain)
-- ============================================================

-- Step 1: Add custom_domain to onboarding_leads
ALTER TABLE public.onboarding_leads
  ADD COLUMN IF NOT EXISTS custom_domain TEXT;

-- Step 2: Ensure onboarding_requests.custom_domain exists (skip if table doesn't exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'onboarding_requests'
  ) THEN
    ALTER TABLE public.onboarding_requests ADD COLUMN IF NOT EXISTS custom_domain TEXT;
  END IF;
END $$;

-- Step 3: Ensure clients has both whatsapp and phone columns mapped
-- The checkout route uses "whatsapp" but some migrations created "phone"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'clients'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'whatsapp'
    ) THEN
      ALTER TABLE public.clients ADD COLUMN whatsapp TEXT;
      UPDATE public.clients SET whatsapp = phone WHERE phone IS NOT NULL AND whatsapp IS NULL;
    END IF;
  END IF;
END $$;
