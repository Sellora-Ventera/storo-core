-- ============================================================
-- Referral fields for clients table (Sharelink.id integration)
-- ============================================================
-- Adds 4 fields to clients to bridge Storo <-> Sharelink referral engine.
--
-- Naming rationale (vs PRD's ambiguous `referral_code`):
--   - `referred_by_*` = INBOUND  (siapa yang mengajak client ini daftar)
--   - `own_referral_*` = OUTBOUND (kode milik client untuk dibagikan)
--
-- `*_ref_id` = ID dari Sharelink (mrs_referral_codes.id), digunakan untuk
-- query langsung ke Sharelink tanpa harus lookup by code lagi.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS referred_by_code TEXT,
  ADD COLUMN IF NOT EXISTS referred_by_ref_id TEXT,
  ADD COLUMN IF NOT EXISTS own_referral_code TEXT,
  ADD COLUMN IF NOT EXISTS own_referral_ref_id TEXT;

-- Lookup index untuk /api/referral/preview-discount (referee buka /r/CODE)
CREATE UNIQUE INDEX IF NOT EXISTS clients_own_referral_code_unique
  ON public.clients(own_referral_code)
  WHERE own_referral_code IS NOT NULL;

-- Lookup index untuk attribution queries (siapa yang direferensikan oleh X)
CREATE INDEX IF NOT EXISTS idx_clients_referred_by_code
  ON public.clients(referred_by_code)
  WHERE referred_by_code IS NOT NULL;
