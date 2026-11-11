-- Migration 050: Module 7.6 Complete Coins Top-up and Recharge System
-- Implements backend-configured coin packages, multi-provider gateway configurations,
-- cryptographic webhook & idempotency verification, full order status lifecycle,
-- itemized receipts, real-time top-up SSE events, and finance admin audit logging.

-- 1. Configurable Coin Packages
CREATE TABLE IF NOT EXISTS popolive.coin_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id VARCHAR(80) UNIQUE NOT NULL,
  package_name VARCHAR(160) NOT NULL,
  package_name_ur VARCHAR(160),
  base_coins INTEGER NOT NULL CHECK (base_coins > 0),
  bonus_coins INTEGER NOT NULL DEFAULT 0 CHECK (bonus_coins >= 0),
  total_coins INTEGER NOT NULL CHECK (total_coins = base_coins + bonus_coins),
  price_amount NUMERIC(12, 2) NOT NULL CHECK (price_amount > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  icon_url TEXT NOT NULL DEFAULT '/assets/gifts/coin_stack.png',
  badge_text VARCHAR(48),
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 100,
  platform_product_id_ios VARCHAR(140),
  platform_product_id_android VARCHAR(140),
  created_by VARCHAR(120) NOT NULL DEFAULT 'system_seed',
  updated_by VARCHAR(120) NOT NULL DEFAULT 'system_seed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_packages_active_order
  ON popolive.coin_packages (is_active, display_order ASC);

-- Seed approved reference packages matching 07_06 design + institutional package
INSERT INTO popolive.coin_packages (
  package_id, package_name, package_name_ur, base_coins, bonus_coins, total_coins,
  price_amount, currency, icon_url, badge_text, is_popular, is_active, display_order,
  platform_product_id_ios, platform_product_id_android
)
VALUES
  ('pkg_100', 'Starter Pack', 'اسٹارٹر پیکج', 100, 0, 100, 0.99, 'USD', '/assets/gifts/07_06_top_up.png', NULL, false, true, 1, 'com.popolive.coins.100', 'coins_100'),
  ('pkg_500', 'Silver Pouch', 'سلور پاؤچ', 500, 25, 525, 4.99, 'USD', '/assets/gifts/07_06_top_up.png', '+25 Bonus', false, true, 2, 'com.popolive.coins.500', 'coins_500'),
  ('pkg_1000', 'Popular Gold Pack', 'مقبول گولڈ پیکج', 1000, 100, 1100, 9.99, 'USD', '/assets/gifts/07_06_top_up.png', 'Popular', true, true, 3, 'com.popolive.coins.1000', 'coins_1000'),
  ('pkg_5000', 'Royal Chest', 'رائل چیسٹ', 5000, 600, 5600, 49.99, 'USD', '/assets/gifts/07_06_top_up.png', '+600 Bonus', false, true, 4, 'com.popolive.coins.5000', 'coins_5000'),
  ('pkg_10000', 'Imperial Vault', 'امپیریل والٹ', 10000, 1500, 11500, 99.99, 'USD', '/assets/gifts/07_06_top_up.png', '+1,500 Bonus', false, true, 5, 'com.popolive.coins.10000', 'coins_10000')
ON CONFLICT (package_id) DO NOTHING;

-- 2. Payment Provider Configuration Table (honest credential readiness)
CREATE TABLE IF NOT EXISTS popolive.payment_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key VARCHAR(64) UNIQUE NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  display_name_ur VARCHAR(120),
  provider_type VARCHAR(40) NOT NULL,
  supported_platforms TEXT[] NOT NULL DEFAULT ARRAY['web', 'android', 'ios'],
  configuration_status VARCHAR(40) NOT NULL DEFAULT 'credentials_pending',
  is_sandbox BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 100,
  notes TEXT,
  updated_by VARCHAR(120) NOT NULL DEFAULT 'system_seed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO popolive.payment_provider_configs (
  provider_key, display_name, display_name_ur, provider_type, supported_platforms,
  configuration_status, is_sandbox, is_active, display_order, notes
)
VALUES
  ('sandbox_verified', 'Payment Sandbox (Verified Test)', 'سینڈ باکس ادائیگی (ٹیسٹ)', 'sandbox', ARRAY['web', 'android', 'ios'], 'ready_sandbox', true, true, 1, 'Cryptographically HMAC-signed sandbox webhook verifier for development & QA.'),
  ('apple_iap', 'Apple Pay / App Store IAP', 'ایپل پے / آئی اے پی', 'iap_ios', ARRAY['ios', 'web'], 'credentials_pending', false, true, 2, 'Requires App Store Connect Shared Secret & StoreKit 2 JWS root cert env configuration.'),
  ('google_play', 'Google Pay / Play Billing', 'گوگل پے / پلے بلنگ', 'iap_android', ARRAY['android', 'web'], 'credentials_pending', false, true, 3, 'Requires Google Play Developer API service account env configuration.'),
  ('stripe_card', 'Visa / Mastercard (Card)', 'کارڈ ادائیگی (ویزا / ماسٹرکارڈ)', 'card', ARRAY['web', 'android', 'ios'], 'credentials_pending', false, true, 4, 'Requires STRIPE_SECRET_KEY & STRIPE_WEBHOOK_SECRET env configuration.'),
  ('paypal', 'PayPal Checkout', 'پے پال', 'wallet', ARRAY['web'], 'credentials_pending', false, true, 5, 'Requires PAYPAL_CLIENT_ID & PAYPAL_CLIENT_SECRET env configuration.'),
  ('local_wallet', 'JazzCash / EasyPaisa', 'جاز کیش / ایزی پیسہ', 'local_rail', ARRAY['web', 'android'], 'credentials_pending', false, true, 6, 'Requires merchant gateway API credentials before live activation.')
ON CONFLICT (provider_key) DO NOTHING;

-- 3. Payment Orders Lifecycle Table
CREATE TABLE IF NOT EXISTS popolive.topup_payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(80) UNIQUE NOT NULL,
  user_id VARCHAR(120) NOT NULL,
  package_id VARCHAR(80) NOT NULL REFERENCES popolive.coin_packages(package_id),
  package_name VARCHAR(160) NOT NULL,
  provider_key VARCHAR(64) NOT NULL,
  platform VARCHAR(24) NOT NULL DEFAULT 'web',
  base_coins INTEGER NOT NULL CHECK (base_coins > 0),
  bonus_coins INTEGER NOT NULL DEFAULT 0 CHECK (bonus_coins >= 0),
  total_coins INTEGER NOT NULL CHECK (total_coins = base_coins + bonus_coins),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  status VARCHAR(32) NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'pending', 'processing', 'successful', 'failed', 'cancelled', 'expired', 'refunded', 'reversed')),
  provider_payment_ref VARCHAR(160),
  checkout_token VARCHAR(180),
  idempotency_key VARCHAR(160) UNIQUE,
  coin_transaction_id VARCHAR(80),
  receipt_id VARCHAR(80),
  failure_code VARCHAR(80),
  failure_reason TEXT,
  refund_reference VARCHAR(120),
  refund_reason TEXT,
  refunded_by VARCHAR(120),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_topup_orders_provider_ref_unique
  ON popolive.topup_payment_orders (provider_key, provider_payment_ref)
  WHERE provider_payment_ref IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_topup_orders_user_created
  ON popolive.topup_payment_orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_topup_orders_status_created
  ON popolive.topup_payment_orders (status, created_at DESC);

-- 4. Verified Top-Up Receipts Table (strict 1:1 per paid order)
CREATE TABLE IF NOT EXISTS popolive.topup_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id VARCHAR(80) UNIQUE NOT NULL,
  order_id VARCHAR(80) UNIQUE NOT NULL REFERENCES popolive.topup_payment_orders(order_id),
  user_id VARCHAR(120) NOT NULL,
  package_id VARCHAR(80) NOT NULL,
  package_name VARCHAR(160) NOT NULL,
  provider_key VARCHAR(64) NOT NULL,
  base_coins INTEGER NOT NULL,
  bonus_coins INTEGER NOT NULL,
  total_coins INTEGER NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  coin_transaction_id VARCHAR(80) NOT NULL,
  provider_payment_ref VARCHAR(160),
  status VARCHAR(32) NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'refunded', 'voided')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topup_receipts_user_issued
  ON popolive.topup_receipts (user_id, issued_at DESC);

-- 5. Cryptographic Webhook Replay Guard & Audit Log
CREATE TABLE IF NOT EXISTS popolive.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key VARCHAR(64) NOT NULL,
  event_id VARCHAR(160) NOT NULL,
  order_id VARCHAR(80),
  event_type VARCHAR(80) NOT NULL,
  signature_valid BOOLEAN NOT NULL,
  processing_status VARCHAR(40) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_key, event_id)
);

-- 6. Real-Time Top-up SSE Replay Stream
CREATE TABLE IF NOT EXISTS popolive.topup_realtime_events (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(120) NOT NULL,
  event_name VARCHAR(80) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topup_realtime_user_id
  ON popolive.topup_realtime_events (user_id, id DESC);

-- 7. Top-Up Admin Audit Log
CREATE TABLE IF NOT EXISTS popolive.topup_admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id VARCHAR(120) NOT NULL,
  actor_role VARCHAR(40) NOT NULL,
  action_type VARCHAR(80) NOT NULL,
  target_id VARCHAR(120) NOT NULL,
  reason TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
