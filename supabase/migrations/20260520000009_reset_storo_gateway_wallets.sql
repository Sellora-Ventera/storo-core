-- ============================================================
-- Reset wallet untuk store mode storo_gateway
--
-- Setelah migrasi 20260520000005_sales_ledger.sql, storo_gateway
-- tidak lagi menggunakan wallet (store_wallets / wallet_transactions) —
-- saldo penjualan dipindah ke sales_ledger_entries.
--
-- Tindakan:
--   1. Insert wallet_transactions type='adjustment' yang me-net-off
--      saldo apapun (positif/negatif) → 0, lalu set store_wallets.balance = 0.
--   2. Catat alasan migrasi di description supaya audit trail jelas.
--
-- Idempotent: hanya jalan untuk store storo_gateway yang balance != 0
-- DAN belum punya adjustment "Reset migrasi ke sales ledger".
-- ============================================================

DO $$
DECLARE
  v_wallet RECORD;
  v_offset BIGINT;
BEGIN
  FOR v_wallet IN
    SELECT sw.id, sw.store_id, sw.balance
    FROM public.store_wallets sw
    JOIN public.stores s ON s.id = sw.store_id
    WHERE s.billing_model = 'storo_gateway'
      AND sw.balance != 0
      AND NOT EXISTS (
        SELECT 1 FROM public.wallet_transactions wt
        WHERE wt.store_id = sw.store_id
          AND wt.type = 'adjustment'
          AND wt.description = 'Reset migrasi ke sales ledger (storo_gateway)'
      )
  LOOP
    -- Offset adalah lawan dari balance current → setelah insert, balance = 0
    v_offset := -v_wallet.balance;

    INSERT INTO public.wallet_transactions (
      store_id, amount, type, description, balance_after
    ) VALUES (
      v_wallet.store_id,
      v_offset,
      'adjustment',
      'Reset migrasi ke sales ledger (storo_gateway)',
      0
    );

    UPDATE public.store_wallets
    SET balance = 0, updated_at = now()
    WHERE id = v_wallet.id;
  END LOOP;
END $$;
