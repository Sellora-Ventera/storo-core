-- Create clients table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  ktp_image_url TEXT,
  shopee_store_link TEXT,
  shopee_store_id TEXT,
  shopee_store_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create onboarding_requests table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.onboarding_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plan TEXT,
  template_id TEXT,
  template_name TEXT,
  store_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Shopee columns to existing clients table (no-op if table was just created above)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS shopee_store_link TEXT,
  ADD COLUMN IF NOT EXISTS shopee_store_id TEXT,
  ADD COLUMN IF NOT EXISTS shopee_store_name TEXT;

-- Partial unique index: one Shopee store per account, NULLs don't conflict
CREATE UNIQUE INDEX IF NOT EXISTS clients_shopee_store_id_unique
  ON public.clients(shopee_store_id)
  WHERE shopee_store_id IS NOT NULL;

-- RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_requests ENABLE ROW LEVEL SECURITY;

-- Clients: user can only see/edit their own row
CREATE POLICY "clients_owner_access" ON public.clients
  FOR ALL USING (clerk_user_id = auth.uid()::text);

-- Onboarding requests: user can only see requests linked to their client row
CREATE POLICY "onboarding_requests_owner_access" ON public.onboarding_requests
  FOR ALL USING (
    client_id IN (
      SELECT id FROM public.clients WHERE clerk_user_id = auth.uid()::text
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_clerk_user_id ON public.clients(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_client_id ON public.onboarding_requests(client_id);

-- updated_at triggers
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_requests_updated_at
  BEFORE UPDATE ON public.onboarding_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
