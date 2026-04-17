-- ============================================================
-- Recreate missing platform tables (clients, invoices, etc.)
-- These were in migration 20260401000000 but not created in DB
-- Using current column names (user_id, phone) from later migrations
-- ============================================================

-- 1. Clients
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  ktp_image_url TEXT,
  shopee_store_link TEXT,
  shopee_store_id TEXT,
  shopee_store_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'clients_owner_access') THEN
    CREATE POLICY "clients_owner_access" ON public.clients FOR ALL USING (user_id = auth.uid()::text);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);

-- Partial unique index for Shopee store
CREATE UNIQUE INDEX IF NOT EXISTS clients_shopee_store_id_unique
  ON public.clients(shopee_store_id) WHERE shopee_store_id IS NOT NULL;

-- 2. Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  store_id UUID,
  type TEXT NOT NULL CHECK (type IN ('setup', 'monthly', 'disbursement')),
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  invoice_url TEXT,
  provider TEXT DEFAULT 'manual',
  provider_ref TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'own_invoices') THEN
    CREATE POLICY "own_invoices" ON public.invoices FOR SELECT USING (
      client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()::text)
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invoices_provider_ref ON public.invoices(provider_ref);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);

-- 3. Onboarding requests
CREATE TABLE IF NOT EXISTS public.onboarding_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plan TEXT,
  template_id TEXT,
  template_name TEXT,
  requested_slug TEXT,
  custom_domain TEXT,
  store_url TEXT,
  store_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  status_note TEXT,
  assigned_engineer TEXT,
  files_uploaded JSONB DEFAULT '[]',
  upload_method TEXT DEFAULT 'platform',
  live_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'onboarding_requests' AND policyname = 'onboarding_requests_owner_access') THEN
    CREATE POLICY "onboarding_requests_owner_access" ON public.onboarding_requests FOR ALL USING (
      client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()::text)
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_onboarding_requests_client_id ON public.onboarding_requests(client_id);

-- 4. Client notifications
CREATE TABLE IF NOT EXISTS public.client_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_notifications' AND policyname = 'own_notifications') THEN
    CREATE POLICY "own_notifications" ON public.client_notifications FOR ALL USING (
      client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()::text)
    );
  END IF;
END $$;

-- 5. Reserved slugs
CREATE TABLE IF NOT EXISTS public.reserved_slugs (
  slug TEXT PRIMARY KEY,
  store_id UUID,
  client_id UUID REFERENCES public.clients(id),
  reserved_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reserved_slugs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reserved_slugs' AND policyname = 'slugs_public_read') THEN
    CREATE POLICY "slugs_public_read" ON public.reserved_slugs FOR SELECT USING (true);
  END IF;
END $$;

-- 6. Triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clients_updated_at') THEN
    CREATE TRIGGER update_clients_updated_at
      BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_onboarding_requests_updated_at') THEN
    CREATE TRIGGER update_onboarding_requests_updated_at
      BEFORE UPDATE ON public.onboarding_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 7. Plan constraint on onboarding_requests
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'onboarding_requests_plan_check') THEN
    ALTER TABLE public.onboarding_requests
      ADD CONSTRAINT onboarding_requests_plan_check
      CHECK (plan IN ('starter', 'pro', 'advance', 'flexible', 'custom', 'business', 'enterprise'));
  END IF;
END $$;

-- 8. Add invoice_id FK to onboarding_leads (if not exists)
ALTER TABLE public.onboarding_leads
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id),
  ADD COLUMN IF NOT EXISTS invoice_id UUID,
  ADD COLUMN IF NOT EXISTS custom_domain TEXT;
