-- ============================================================
-- P-2 Audit: distribution of plan values di onboarding_requests
--
-- Tujuan: identify legacy plan IDs sebelum Phase 1 migration.
-- PRD V3 cuma punya 'standard' + 'custom'. Existing data mungkin
-- masih pakai 'starter', 'pro', 'advance', 'flexible', 'business',
-- 'enterprise'.
--
-- Run di Supabase SQL Editor (project storo-platform).
-- ============================================================

-- Query 1: Distribution count per plan
SELECT
  plan,
  COUNT(*) AS total_requests,
  COUNT(*) FILTER (WHERE status = 'live') AS live_count,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
  MIN(created_at) AS earliest,
  MAX(created_at) AS latest
FROM onboarding_requests
GROUP BY plan
ORDER BY total_requests DESC;

-- Query 2: Live stores per plan (yang real customers, butuh migration plan)
SELECT
  o.plan,
  COUNT(DISTINCT s.id) AS active_stores,
  STRING_AGG(s.slug, ', ' ORDER BY s.slug) AS slugs
FROM onboarding_requests o
LEFT JOIN stores s ON s.id = o.store_id
WHERE o.status = 'live'
GROUP BY o.plan
ORDER BY active_stores DESC;

-- Query 3: Cek payment config existing — siapa yg pakai own gateway
SELECT
  s.slug,
  s.id AS store_id,
  s.client_id,
  COALESCE((s.settings->'payment'->>'use_storo_gateway')::boolean, true) AS uses_storo_gateway,
  CASE
    WHEN s.settings->'payment'->>'xendit_secret_key' IS NOT NULL
         AND LENGTH(s.settings->'payment'->>'xendit_secret_key') > 0
      THEN 'has_xendit_keys'
    ELSE 'no_keys'
  END AS xendit_status,
  CASE
    WHEN s.settings->'payment'->>'midtrans_server_key' IS NOT NULL
         AND LENGTH(s.settings->'payment'->>'midtrans_server_key') > 0
      THEN 'has_midtrans_keys'
    ELSE 'no_keys'
  END AS midtrans_status
FROM stores s
WHERE s.is_active = true
ORDER BY s.created_at DESC;

-- Query 4: Sanity check — disbursements table state
-- Konfirm: kolom apa saja yg sudah ada di prod
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'disbursements'
ORDER BY ordinal_position;
