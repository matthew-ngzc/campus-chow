-- Table to store payment information for each order
-- 1️⃣ Create ENUM type for payment status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
    CREATE TYPE payment_status_enum AS ENUM (
      'pending',
      'payment_verified',
      'failed',
      'pending_refund',
      'refunded'
    );
  END IF;
END$$;

-- 2️⃣ Create table
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,              -- internal DB id
    order_id BIGINT NOT NULL UNIQUE,       -- FK to orders table (1:1)
    amount_cents BIGINT NOT NULL,          -- amount in cents
    payment_status payment_status_enum NOT NULL DEFAULT 'pending',
    payment_reference TEXT NOT NULL,       -- e.g. SMUNCH-123ABC
    payment_deadline TIMESTAMPTZ NOT NULL,  -- deadline to complete payment
    transaction_ref TEXT UNIQUE DEFAULT NULL,   -- e.g. 'SM3P251009962794 C120437848203'
    screenshot_url  TEXT UNIQUE DEFAULT NULL;   -- URL to uploaded payment screenshot

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3️⃣ Index for quick lookups by order
CREATE INDEX idx_payments_order_id ON payments(order_id);
-- Index for quick lookups by transaction_ref (if not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_transaction_ref
  ON payments (transaction_ref)
  WHERE transaction_ref IS NOT NULL;

-- 4️⃣ auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_payments_timestamp
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- =========================================================
-- OUTBOX (reliable event publishing)
-- =========================================================
CREATE TABLE IF NOT EXISTS outbox (
  id            BIGSERIAL PRIMARY KEY,
  routing_key   TEXT NULL,
  payload       JSONB NULL,
  properties    JSONB NULL,
  exchange      TEXT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at  TIMESTAMPTZ NULL
);

-- Helpful filters for publisher worker
CREATE INDEX IF NOT EXISTS idx_outbox_unpublished
  ON outbox (published_at)
  WHERE published_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_outbox_created_at
  ON outbox (created_at DESC);

-- =========================================================
-- INBOX (idempotent message consumption)
-- =========================================================
CREATE TABLE IF NOT EXISTS inbox (
  id             SERIAL PRIMARY KEY,
  message_id     TEXT UNIQUE,
  routing_key    TEXT NULL,
  payload        JSONB NULL,
  received_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at   TIMESTAMPTZ NULL,
  status         TEXT DEFAULT 'received', -- 'received' | 'processed' | 'failed'
  error_message  TEXT NULL,
  properties     JSONB NULL
);

CREATE INDEX IF NOT EXISTS idx_inbox_status
  ON inbox (status);

CREATE INDEX IF NOT EXISTS idx_inbox_received_at
  ON inbox (received_at DESC);

-- =========================================================
-- 💸 TRANSACTIONS TABLE — Stores incoming payment confirmations from bank feed
-- =========================================================
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  transaction_ref TEXT UNIQUE NOT NULL,        -- e.g. 'SM3P251009962794 C112347848203'
  amount_cents BIGINT NOT NULL,               -- e.g. '28000'
  date_time TIMESTAMPTZ NOT NULL,               -- parsed timestamp e.g. '2025-10-09 17:35 +08:00'
  sender TEXT NOT NULL,                        -- e.g. 'BOB'
  receiver TEXT NOT NULL,                      -- e.g. 'Your DBS/POSB account ending 3440'

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT NULL
);

-- Optional index for fast matching by transaction_ref or amount/datetime
CREATE INDEX IF NOT EXISTS idx_transactions_ref ON transactions(transaction_ref);
CREATE INDEX IF NOT EXISTS idx_transactions_datetime ON transactions(datetime DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at_transactions()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_transactions_timestamp
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_transactions();