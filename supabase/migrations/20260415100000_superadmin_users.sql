-- Create superadmin_users table (gate for /superadmin/* access)
-- Referenced by src/lib/auth/superadmin.ts and RLS policies in 20260415000000_template_deployment.sql

CREATE TABLE IF NOT EXISTS public.superadmin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT superadmin_users_user_id_unique UNIQUE (user_id)
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.superadmin_users_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_superadmin_users_updated_at ON public.superadmin_users;
CREATE TRIGGER trg_superadmin_users_updated_at
BEFORE UPDATE ON public.superadmin_users
FOR EACH ROW EXECUTE FUNCTION public.superadmin_users_set_updated_at();

-- Enable RLS
ALTER TABLE public.superadmin_users ENABLE ROW LEVEL SECURITY;

-- Policy: superadmin bisa baca semua row superadmin (untuk halaman /superadmin/users)
CREATE POLICY "superadmin_users_superadmin_select" ON public.superadmin_users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.superadmin_users su
      WHERE su.user_id = auth.uid() AND su.is_active = true
    )
  );

-- Policy: superadmin bisa insert superadmin baru
CREATE POLICY "superadmin_users_superadmin_insert" ON public.superadmin_users
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.superadmin_users su
      WHERE su.user_id = auth.uid() AND su.is_active = true
    )
  );

-- Policy: superadmin bisa update (aktifkan/nonaktifkan)
CREATE POLICY "superadmin_users_superadmin_update" ON public.superadmin_users
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.superadmin_users su
      WHERE su.user_id = auth.uid() AND su.is_active = true
    )
  );

-- Policy: superadmin bisa delete
CREATE POLICY "superadmin_users_superadmin_delete" ON public.superadmin_users
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.superadmin_users su
      WHERE su.user_id = auth.uid() AND su.is_active = true
    )
  );

-- Seed initial superadmins (VenteraAI team)
-- Idempotent via ON CONFLICT. Hanya seed jika user sudah ada di auth.users.
INSERT INTO public.superadmin_users (user_id, is_active)
SELECT id, true FROM auth.users
WHERE email IN (
  'storo.agency@gmail.com',
  'wahyu.ventera@gmail.com',
  'wijaya.ventera@gmail.com'
)
ON CONFLICT (user_id) DO NOTHING;
