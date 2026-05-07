-- store_wallets: one row per store, cached balance
CREATE TABLE store_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
  balance BIGINT NOT NULL DEFAULT 0,       -- in IDR cents (1 IDR = 1 unit; store as integer)
  low_balance_threshold BIGINT NOT NULL DEFAULT 100000, -- IDR 100rb
  auto_suspend BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- wallet_transactions: append-only ledger
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,            -- positive = credit, negative = debit
  type TEXT NOT NULL CHECK (type IN ('topup', 'ops_fee', 'refund', 'adjustment')),
  description TEXT,
  reference_id TEXT,                 -- Xendit invoice_id for topup, order_id for ops_fee
  balance_after BIGINT NOT NULL,     -- snapshot after this transaction
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallet_transactions_store_id ON wallet_transactions(store_id);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(store_id, created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at_now()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_store_wallets_updated_at
  BEFORE UPDATE ON store_wallets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_now();

-- RLS: owner can read their wallet; service role manages everything
ALTER TABLE store_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owner can view their wallet"
  ON store_wallets FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM stores WHERE client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()::text
      )
    )
  );

CREATE POLICY "Store owner can view their transactions"
  ON wallet_transactions FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM stores WHERE client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()::text
      )
    )
  );

-- Atomic credit function
CREATE OR REPLACE FUNCTION wallet_credit(
  p_store_id UUID,
  p_amount BIGINT,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL
) RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_new_balance BIGINT;
BEGIN
  INSERT INTO store_wallets (store_id, balance)
  VALUES (p_store_id, p_amount)
  ON CONFLICT (store_id) DO UPDATE
    SET balance = store_wallets.balance + p_amount,
        updated_at = now()
  RETURNING balance INTO v_new_balance;

  INSERT INTO wallet_transactions (store_id, amount, type, description, reference_id, balance_after)
  VALUES (p_store_id, p_amount, p_type, p_description, p_reference_id, v_new_balance);

  RETURN v_new_balance;
END;
$$;

-- Atomic debit function (raises error if insufficient balance)
CREATE OR REPLACE FUNCTION wallet_debit(
  p_store_id UUID,
  p_amount BIGINT,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL
) RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_new_balance BIGINT;
BEGIN
  UPDATE store_wallets
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE store_id = p_store_id
  RETURNING balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for store %', p_store_id;
  END IF;
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  INSERT INTO wallet_transactions (store_id, amount, type, description, reference_id, balance_after)
  VALUES (p_store_id, -p_amount, p_type, p_description, p_reference_id, v_new_balance);

  RETURN v_new_balance;
END;
$$;
