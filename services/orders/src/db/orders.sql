-- =========================================================
-- EXTENSIONS
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- ORDERS
-- =========================================================
CREATE TABLE IF NOT EXISTS orders (
  order_id                 SERIAL PRIMARY KEY,

  -- ownership / linkage
  customer_id              INTEGER        NOT NULL,
  merchant_id              INTEGER        NOT NULL,

  -- delivery scheduling
  delivery_time            TIMESTAMPTZ    NOT NULL,
  delivery_completion_time TIMESTAMPTZ    NULL,

  -- payment deadlines
  payment_deadline_time    TIMESTAMPTZ    NOT NULL,

  -- destination details
  building   TEXT NOT NULL CHECK (
                length(building) <= 20
                AND building ~ '^[A-Za-z0-9]+$'
              ),
  room_type  TEXT NOT NULL CHECK (
                length(room_type) <= 24
                AND room_type ~ '^[A-Za-z0-9 ]+$'
              ),
  room_number TEXT NOT NULL CHECK (
                length(room_number) <= 10
                AND room_number ~ '^[A-Za-z0-9-]+$'
              ),

  -- pricing
  amount_subtotal_cents     INTEGER NOT NULL CHECK (amount_subtotal_cents >= 0),
  amount_delivery_fee_cents INTEGER NOT NULL DEFAULT 100 CHECK (amount_delivery_fee_cents >= 0),
  amount_total_cents        INTEGER NOT NULL CHECK (amount_total_cents >= 0),

  -- order status / reason
  order_status      TEXT NOT NULL,
  cancel_reason_code TEXT NULL,

  -- timestamps
  created_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_time TIMESTAMPTZ NULL
);

-- ======== USEFUL INDEXES ========
CREATE INDEX IF NOT EXISTS idx_orders_merchant_delivery_time
  ON orders (merchant_id, delivery_time DESC);

CREATE INDEX IF NOT EXISTS idx_orders_customer_created_time
  ON orders (customer_id, created_time DESC);

CREATE INDEX IF NOT EXISTS idx_orders_deadline_awaiting
  ON orders (payment_deadline_time)
  WHERE order_status = 'awaiting_payment';

CREATE INDEX IF NOT EXISTS idx_orders_status
  ON orders (order_status);

CREATE INDEX IF NOT EXISTS idx_orders_customer_status
  ON orders (customer_id, order_status, created_time DESC);


-- =========================================================
-- ORDER ITEMS
-- =========================================================
CREATE TABLE IF NOT EXISTS order_items (
  id               SERIAL PRIMARY KEY,
  order_id         INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  menu_item_id     INTEGER NOT NULL,
  name             TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  qty              INTEGER NOT NULL CHECK (qty > 0),
  options          JSONB  NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items (order_id);

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
-- OPTIONAL CHECKS & NOTES
-- =========================================================
-- * You can later add a foreign key from inbox.payload->>'orderId' if you want strong referential auditing.
-- * Consider a small table for cancel_reason_code enums if you expect more codes later.
-- * Consider an index on orders(payment_deadline_time, order_status) for sweeper efficiency.
