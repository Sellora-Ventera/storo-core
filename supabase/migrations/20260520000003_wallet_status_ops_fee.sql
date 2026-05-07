-- Add status column to store_wallets
ALTER TABLE store_wallets
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'warning', 'suspended'));

-- Backfill status for existing rows
UPDATE store_wallets SET status = CASE
  WHEN balance <= 0 THEN 'suspended'
  WHEN balance < low_balance_threshold THEN 'warning'
  ELSE 'active'
END;

-- Ops fee debit: allows negative balance, updates status, returns prev+new state
CREATE OR REPLACE FUNCTION wallet_debit_ops_fee(
  p_store_id UUID,
  p_amount BIGINT,
  p_reference_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_prev_status TEXT;
  v_threshold   BIGINT;
  v_new_balance BIGINT;
  v_new_status  TEXT;
BEGIN
  SELECT status, low_balance_threshold
    INTO v_prev_status, v_threshold
    FROM store_wallets
   WHERE store_id = p_store_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for store %', p_store_id;
  END IF;

  UPDATE store_wallets
     SET balance    = balance - p_amount,
         updated_at = now()
   WHERE store_id = p_store_id
  RETURNING balance INTO v_new_balance;

  v_new_status := CASE
    WHEN v_new_balance <= 0            THEN 'suspended'
    WHEN v_new_balance < v_threshold   THEN 'warning'
    ELSE 'active'
  END;

  IF v_new_status <> v_prev_status THEN
    UPDATE store_wallets SET status = v_new_status WHERE store_id = p_store_id;
  END IF;

  INSERT INTO wallet_transactions
    (store_id, amount, type, description, reference_id, balance_after)
  VALUES
    (p_store_id, -p_amount, 'ops_fee', p_description, p_reference_id, v_new_balance);

  RETURN jsonb_build_object(
    'new_balance', v_new_balance,
    'new_status',  v_new_status,
    'prev_status', v_prev_status
  );
END;
$$;
