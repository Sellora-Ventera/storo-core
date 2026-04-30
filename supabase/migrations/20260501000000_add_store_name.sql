-- Add store_name column to onboarding_requests
-- Allows clients to set a display name for their store (separate from requested_slug)

ALTER TABLE public.onboarding_requests
  ADD COLUMN IF NOT EXISTS store_name TEXT;
