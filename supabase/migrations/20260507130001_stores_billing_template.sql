-- ============================================================
-- Phase 1.2: Extend stores table for V3 multi-tenant
--
-- Adds:
--   - billing_model ENUM (storo_gateway, own_prepaid)
--   - template_variant TEXT (folder name in storo-storefront repo)
--   - theme_config JSONB (colors, fonts, layout tokens)
--
-- Migrates existing settings.payment.use_storo_gateway → billing_model.
-- Per owner decision (2026-05-07): all existing stores → 'storo_gateway'
-- regardless of previous setting (no own_prepaid wallet support yet).
--
-- Idempotent — safe to re-run.
-- ============================================================

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS billing_model TEXT NOT NULL DEFAULT 'storo_gateway'
    CHECK (billing_model IN ('storo_gateway', 'own_prepaid')),
  ADD COLUMN IF NOT EXISTS template_variant TEXT NOT NULL DEFAULT 'custom-pending',
  ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT '{}';

-- Backfill: set all existing stores to 'storo_gateway' (per owner decision)
-- Existing rows already have default 'storo_gateway' from ADD COLUMN, so this is a no-op.
-- Explicit UPDATE for clarity + future-proof in case any row got NULL.
UPDATE public.stores
SET billing_model = 'storo_gateway'
WHERE billing_model IS NULL OR billing_model NOT IN ('storo_gateway', 'own_prepaid');

-- Index for billing_model (used by middleware for wallet check)
CREATE INDEX IF NOT EXISTS idx_stores_billing_model ON public.stores(billing_model);
CREATE INDEX IF NOT EXISTS idx_stores_template_variant ON public.stores(template_variant);

-- Optional: add FK from stores.plan_id → plans.id (Phase 1.3 — defer to next migration)
-- Currently plan info is in onboarding_requests.plan, not directly on stores.
