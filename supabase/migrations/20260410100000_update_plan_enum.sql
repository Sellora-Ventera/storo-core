-- ============================================================
-- Update plan CHECK constraint on onboarding_requests
-- Old: ('starter', 'business', 'enterprise')
-- New: ('starter', 'pro', 'advance', 'flexible', 'custom', 'business', 'enterprise')
-- Keeps old values for backward compat with existing rows
-- ============================================================

ALTER TABLE public.onboarding_requests
  DROP CONSTRAINT IF EXISTS onboarding_requests_plan_check;

ALTER TABLE public.onboarding_requests
  ADD CONSTRAINT onboarding_requests_plan_check
  CHECK (plan IN ('starter', 'pro', 'advance', 'flexible', 'custom', 'business', 'enterprise'));
