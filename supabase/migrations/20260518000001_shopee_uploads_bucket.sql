-- ============================================================
-- Storage bucket for client Shopee upload files
-- ============================================================
-- Private bucket. Access only via API route with service role
-- (server-side validates ownership via clients table + onboarding_requests).
-- Clients tidak akses storage langsung — semua via /api/dashboard/stores/[id]/upload.
-- Engineer VenteraAI ambil file via signed URL yang di-generate di stores/[id] page.
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shopee-uploads',
  'shopee-uploads',
  false,
  52428800,  -- 50 MB
  ARRAY[
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- No INSERT/SELECT/DELETE policies for anon/authenticated — bucket is fully
-- locked down. Only service role (used by API routes) can read/write.
