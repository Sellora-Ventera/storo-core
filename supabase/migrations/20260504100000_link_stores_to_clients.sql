-- Link stores table to clients (storo.id portal multi-store)
-- Adds stores.client_id (FK to clients.id) for owner resolution by Supabase Auth user.
-- Backfills existing data using onboarding_requests.client_id where store_id matches.

BEGIN;

-- 1. Add client_id column (nullable to allow legacy stores w/o client mapping)
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stores_client_id ON stores(client_id);

-- 2. Backfill client_id from onboarding_requests where store_id is set
UPDATE stores s
SET client_id = onboarding_requests.client_id
FROM onboarding_requests
WHERE onboarding_requests.store_id = s.id
  AND s.client_id IS NULL
  AND onboarding_requests.client_id IS NOT NULL;

-- 3. RLS — owner-via-client policies
-- We add new policies; existing owner_id-based policies (if any) are kept for backward
-- compat with storoengine deploy yang masih pakai owner_id (Supabase Auth uid as text).

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stores_select_own_client" ON stores;
CREATE POLICY "stores_select_own_client" ON stores
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "stores_update_own_client" ON stores;
CREATE POLICY "stores_update_own_client" ON stores
  FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()::text
    )
  );

-- INSERT/DELETE handled by service role from superadmin / onboarding flows.
-- No direct INSERT policy for authenticated users (controlled via API routes).

COMMENT ON COLUMN stores.client_id IS
  'FK to clients.id. Owner-of-record from storo.id portal. NULL for legacy stores managed via STORE_ID env on a per-deploy storoengine instance.';

COMMIT;
