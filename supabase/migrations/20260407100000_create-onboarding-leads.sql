-- Guest onboarding submissions (no auth required)
-- Captures leads from the public /onboarding form before account creation

CREATE TABLE IF NOT EXISTS public.onboarding_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  shopee_store_link TEXT,
  plan TEXT NOT NULL,
  selected_domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- No RLS needed — service role key writes, superadmin reads
ALTER TABLE public.onboarding_leads ENABLE ROW LEVEL SECURITY;

-- Service role can do anything (bypasses RLS by default)
-- Public cannot read or write directly
CREATE POLICY "superadmin_all" ON public.onboarding_leads
  FOR ALL USING (false); -- blocked for normal users; service role bypasses RLS

CREATE INDEX idx_onboarding_leads_created_at ON public.onboarding_leads(created_at DESC);
