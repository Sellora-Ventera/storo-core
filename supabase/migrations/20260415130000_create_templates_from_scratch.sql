-- Idempotent: create templates + deployment_logs from scratch
-- Needed because earlier migration was recorded but table doesn't exist

CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  preview_image_url TEXT,
  demo_url TEXT,
  repo_url TEXT,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  source_repo TEXT NOT NULL DEFAULT 'PTVENTERA-AI/storoengine',
  source_branch TEXT NOT NULL DEFAULT 'main',
  source_commit_sha TEXT,
  vercel_project_id TEXT,
  vercel_deployment_id TEXT,
  cloudflare_dns_record_id TEXT,
  preview_store_id UUID,
  deploy_status TEXT NOT NULL DEFAULT 'draft' CHECK (deploy_status IN ('draft', 'deploying', 'live', 'failed', 'taking_down', 'archived')),
  deploy_error TEXT,
  deployed_at TIMESTAMPTZ,
  price_setup_override NUMERIC,
  price_monthly_override NUMERIC,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_templates_updated_at ON public.templates;
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "templates_public_read" ON public.templates;
CREATE POLICY "templates_public_read" ON public.templates
  FOR SELECT USING (is_active = true AND deploy_status = 'live');

DROP POLICY IF EXISTS "templates_superadmin_all" ON public.templates;
CREATE POLICY "templates_superadmin_all" ON public.templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.superadmin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.superadmin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Audit log table
CREATE TABLE IF NOT EXISTS public.template_deployment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'deploy', 'redeploy', 'takedown', 'status_check', 'seed', 'unseed')),
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'failed', 'skipped')),
  step TEXT,
  vercel_response JSONB,
  cloudflare_response JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_template_deployment_logs_template_id
  ON public.template_deployment_logs(template_id, created_at DESC);

ALTER TABLE public.template_deployment_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "template_logs_superadmin_read" ON public.template_deployment_logs;
CREATE POLICY "template_logs_superadmin_read" ON public.template_deployment_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.superadmin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "template_logs_superadmin_insert" ON public.template_deployment_logs;
CREATE POLICY "template_logs_superadmin_insert" ON public.template_deployment_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.superadmin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Storage bucket for thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('template-thumbnails', 'template-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "template_thumbnails_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'template-thumbnails');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "template_thumbnails_superadmin_write" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'template-thumbnails' AND
      EXISTS (SELECT 1 FROM public.superadmin_users WHERE user_id = auth.uid() AND is_active = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "template_thumbnails_superadmin_delete" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'template-thumbnails' AND
      EXISTS (SELECT 1 FROM public.superadmin_users WHERE user_id = auth.uid() AND is_active = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
