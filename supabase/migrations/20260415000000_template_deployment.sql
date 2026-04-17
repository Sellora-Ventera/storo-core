-- ============================================================
-- Template Live Preview Deployment (Vercel + Cloudflare)
-- PRD: docs/TEMPLATE-DEPLOYMENT-PRD.md
-- ============================================================

-- Extend templates table with deployment fields
ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS source_repo TEXT NOT NULL DEFAULT 'PTVENTERA-AI/storoengine',
  ADD COLUMN IF NOT EXISTS source_branch TEXT NOT NULL DEFAULT 'main',
  ADD COLUMN IF NOT EXISTS source_commit_sha TEXT,
  ADD COLUMN IF NOT EXISTS vercel_project_id TEXT,
  ADD COLUMN IF NOT EXISTS vercel_deployment_id TEXT,
  ADD COLUMN IF NOT EXISTS cloudflare_dns_record_id TEXT,
  ADD COLUMN IF NOT EXISTS preview_store_id UUID,
  ADD COLUMN IF NOT EXISTS deploy_status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS deploy_error TEXT,
  ADD COLUMN IF NOT EXISTS deployed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS price_setup_override NUMERIC,
  ADD COLUMN IF NOT EXISTS price_monthly_override NUMERIC,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Backfill slug from name for existing rows
UPDATE public.templates SET slug = name WHERE slug IS NULL;

-- Slug must be unique & required
ALTER TABLE public.templates
  ALTER COLUMN slug SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE public.templates ADD CONSTRAINT templates_slug_unique UNIQUE (slug);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;

-- Status enum check
DO $$ BEGIN
  ALTER TABLE public.templates ADD CONSTRAINT templates_deploy_status_check
    CHECK (deploy_status IN ('draft', 'deploying', 'live', 'failed', 'taking_down', 'archived'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- updated_at trigger
DROP TRIGGER IF EXISTS update_templates_updated_at ON public.templates;
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Replace public-read policy with stricter version: only live + active
DROP POLICY IF EXISTS "templates_public_read" ON public.templates;
CREATE POLICY "templates_public_read" ON public.templates
  FOR SELECT USING (is_active = true AND deploy_status = 'live');

-- Superadmin full access
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

-- ============================================================
-- Audit log table
-- ============================================================

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

CREATE POLICY "template_logs_superadmin_read" ON public.template_deployment_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.superadmin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "template_logs_superadmin_insert" ON public.template_deployment_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.superadmin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ============================================================
-- Storage bucket for thumbnails
-- ============================================================
-- Run via dashboard or CLI:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('template-thumbnails', 'template-thumbnails', true)
-- ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
VALUES ('template-thumbnails', 'template-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: public read, superadmin write
DO $$ BEGIN
  CREATE POLICY "template_thumbnails_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'template-thumbnails');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "template_thumbnails_superadmin_write" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'template-thumbnails' AND
      EXISTS (
        SELECT 1 FROM public.superadmin_users
        WHERE user_id = auth.uid() AND is_active = true
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "template_thumbnails_superadmin_update" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'template-thumbnails' AND
      EXISTS (
        SELECT 1 FROM public.superadmin_users
        WHERE user_id = auth.uid() AND is_active = true
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "template_thumbnails_superadmin_delete" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'template-thumbnails' AND
      EXISTS (
        SELECT 1 FROM public.superadmin_users
        WHERE user_id = auth.uid() AND is_active = true
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
