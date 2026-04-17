-- Add column to track Cloudflare TXT record created for Vercel domain verification
ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS cloudflare_txt_record_id TEXT;
