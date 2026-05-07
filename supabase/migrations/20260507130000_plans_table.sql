-- ============================================================
-- Phase 1.1: Create `plans` table — single source of truth
--
-- Replaces hardcoded src/lib/plans.ts. PRD V3 defines 2 active plans
-- (standard, custom). Legacy plans (starter, pro, advance, flexible)
-- retained as is_active=false for grandfathering existing customers.
--
-- Idempotent — safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  setup_fee DECIMAL(12,2),
  monthly_fee DECIMAL(12,2),
  ops_fee_pct DECIMAL(5,3) NOT NULL DEFAULT 1.000,
  pg_fee_pct DECIMAL(5,3) NOT NULL DEFAULT 4.000,

  -- Billing model capability (only 2 models — no postpay)
  allow_billing_storo_gateway BOOLEAN NOT NULL DEFAULT true,
  allow_billing_own_prepaid BOOLEAN NOT NULL DEFAULT false,

  -- Feature flags
  allow_custom_domain BOOLEAN NOT NULL DEFAULT true,
  allow_multi_admin BOOLEAN NOT NULL DEFAULT false,
  allow_api_integration BOOLEAN NOT NULL DEFAULT false,
  allow_blog_seo BOOLEAN NOT NULL DEFAULT true,
  allow_promos BOOLEAN NOT NULL DEFAULT true,
  allow_analytics BOOLEAN NOT NULL DEFAULT true,
  allow_animations BOOLEAN NOT NULL DEFAULT false,

  -- Soft limits (NULL = unlimited)
  max_products INT,
  max_admins INT DEFAULT 1,
  max_orders_per_month INT,

  is_active BOOLEAN NOT NULL DEFAULT true,
  is_legacy BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plans_active ON public.plans(is_active) WHERE is_active = true;

-- updated_at trigger
DROP TRIGGER IF EXISTS update_plans_updated_at ON public.plans;
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: public read (plans are pricing info, not sensitive)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'plans' AND policyname = 'plans_public_read'
  ) THEN
    CREATE POLICY "plans_public_read" ON public.plans FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================
-- Seed data
-- ============================================================

-- New active plans (V3)
INSERT INTO public.plans (
  id, name, setup_fee, monthly_fee, ops_fee_pct, pg_fee_pct,
  allow_billing_storo_gateway, allow_billing_own_prepaid,
  allow_custom_domain, allow_multi_admin, allow_api_integration,
  allow_blog_seo, allow_promos, allow_analytics, allow_animations,
  max_admins, is_active, is_legacy, sort_order, features
) VALUES
  (
    'standard', 'Standard', 5000000, 750000, 1.000, 4.000,
    true, true,
    true, false, false,
    true, true, true, false,
    1, true, false, 1,
    '["Custom design (template-inspired)", "Custom domain", "Payment gateway (Xendit/Midtrans)", "Ongkos kirim otomatis (Biteship)", "Dashboard lengkap", "Blog & SEO tools", "Promo & kode diskon", "Analitik penjualan", "Import produk dari Shopee"]'::jsonb
  ),
  (
    'custom', 'Custom', NULL, NULL, 1.000, 4.000,
    true, true,
    true, true, true,
    true, true, true, true,
    NULL, true, false, 99,
    '["Bespoke design dengan animations", "Custom domain", "Payment gateway (Xendit/Midtrans)", "Ongkos kirim otomatis (Biteship)", "Dashboard lengkap", "Blog & SEO tools", "Promo & kode diskon", "Analitik penjualan", "Import produk dari Shopee", "Multi-admin", "Integrasi API", "Dedicated support"]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  setup_fee = EXCLUDED.setup_fee,
  monthly_fee = EXCLUDED.monthly_fee,
  is_active = EXCLUDED.is_active,
  is_legacy = EXCLUDED.is_legacy,
  features = EXCLUDED.features,
  updated_at = now();

-- Legacy plans (grandfathered for existing customers — hidden from onboarding)
INSERT INTO public.plans (
  id, name, setup_fee, monthly_fee, ops_fee_pct,
  allow_billing_storo_gateway, allow_billing_own_prepaid,
  is_active, is_legacy, sort_order, features
) VALUES
  ('starter', 'Starter (Legacy)', 1500000, 250000, 1.000, true, false, false, true, 100, '["Legacy plan"]'::jsonb),
  ('pro', 'Pro (Legacy)', 3500000, 500000, 1.000, true, false, false, true, 101, '["Legacy plan"]'::jsonb),
  ('advance', 'Advance (Legacy)', 7500000, 1000000, 1.000, true, false, false, true, 102, '["Legacy plan"]'::jsonb),
  ('flexible', 'Flexible (Legacy)', 5000000, 750000, 1.000, true, false, false, true, 103, '["Legacy plan"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  is_legacy = true,
  is_active = false,
  updated_at = now();
