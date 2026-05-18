-- Extend onboarding_requests.plan CHECK constraint to allow V3 plan IDs.
-- V3 wizard (src/lib/plans.ts) uses: basic, standard, business, custom.
-- Legacy: starter, pro, advance, flexible, enterprise.

ALTER TABLE public.onboarding_requests
  DROP CONSTRAINT IF EXISTS onboarding_requests_plan_check;

ALTER TABLE public.onboarding_requests
  ADD CONSTRAINT onboarding_requests_plan_check
  CHECK (plan IN (
    'basic', 'standard', 'business', 'custom',
    'starter', 'pro', 'advance', 'flexible', 'enterprise'
  ));
