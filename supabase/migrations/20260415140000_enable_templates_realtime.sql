-- Enable Supabase Realtime for templates table
-- so superadmin UI receives instant updates during deploy lifecycle.

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.templates;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
