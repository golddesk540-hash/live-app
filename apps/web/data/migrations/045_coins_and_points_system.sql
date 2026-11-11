-- =============================================================================
-- Popo Live — Phase 7 Module 7.1: Coins and Points Management System
-- Migration 045: Central Wallet Architecture, Ledger Tables, Finance Rules, Audit & Realtime Events
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS popolive;
SET search_path TO popolive, public;

-- 1. Upgrade Single Authoritative User Wallets Table (NO duplicate wallet created)
CREATE TABLE IF NOT EXISTS popolive.user_wallets (
  user_id VARCHAR(100) PRIMARY KEY,
  coins BIGINT NOT NULL DEFAULT 0,
  diamond_points BIGINT NOT NULL DEFAULT 0,
  total_spent_coins BIGINT NOT NULL DEFAULT 0,
  total_received_points BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE popolive.user_wallets
  ADD COLUMN IF NOT EXISTS wallet_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE popolive.user_wallets
  ALTER COLUMN coins TYPE BIGINT,
  ALTER COLUMN coins SET DEFAULT 0,
  ALTER COLUMN diamond_points TYPE BIGINT,
  ALTER COLUMN diamond_points SET DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_user_wallets_coins_non_negative'
  ) THEN
    ALTER TABLE popolive.user_wallets
      ADD CONSTRAINT chk_user_wallets_coins_non_negative CHECK (coins >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_user_wallets_points_non_negative'
  ) THEN
    ALTER TABLE popolive.user_wallets
      ADD CONSTRAINT chk_user_wallets_points_non_negative CHECK (diamond_points >= 0);
  END IF;
END $$;

-- 2. Configurable Backend Finance Rules Table
CREATE TABLE IF NOT EXISTS popolive.finance_rules (
  rule_key VARCHAR(100) PRIMARY KEY,
  rule_value NUMERIC(12, 4) NOT NULL,
  description TEXT NOT NULL,
  updated_by VARCHAR(100) NOT NULL DEFAULT 'system',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO popolive.finance_rules (rule_key, rule_value, description, updated_by)
VALUES
  ('host_gift_share_percent', 70, 'Approved Popo Live rule: 70% of gift coins become host points', 'system'),
  ('new_user_initial_coins', 0, 'Approved initial coin balance for newly registered user wallets', 'system'),
  ('new_user_initial_points', 0, 'Approved initial host points balance for newly created wallets', 'system'),
  ('min_transaction_amount', 1, 'Minimum coin/point unit for valid financial transactions', 'system'),
  ('max_single_transaction_amount', 10000000, 'Maximum safety cap for single wallet credit/debit', 'system')
ON CONFLICT (rule_key) DO NOTHING;

-- 3. Immutable Coin Transaction History Ledger
CREATE TABLE IF NOT EXISTS popolive.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  wallet_id UUID NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL CHECK (
    transaction_type IN ('topup', 'gift_sent', 'admin_credit', 'admin_debit', 'reversal', 'initial_credit', 'feature_spend')
  ),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('credit', 'debit')),
  coin_amount BIGINT NOT NULL CHECK (coin_amount >= 0),
  previous_balance BIGINT NOT NULL CHECK (previous_balance >= 0),
  new_balance BIGINT NOT NULL CHECK (new_balance >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  reference_id VARCHAR(150),
  related_tx_id VARCHAR(100),
  idempotency_key VARCHAR(150) UNIQUE,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by VARCHAR(100) NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_tx_user_created
  ON popolive.coin_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_tx_status
  ON popolive.coin_transactions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_tx_reference
  ON popolive.coin_transactions (reference_id);

-- 4. Immutable Host Points Earning History Ledger (Strictly Separate from Coins)
CREATE TABLE IF NOT EXISTS popolive.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  wallet_id UUID NOT NULL,
  host_user_id VARCHAR(100) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL CHECK (
    transaction_type IN ('gift_earned', 'pk_gift_earned', 'admin_credit', 'admin_debit', 'reversal')
  ),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('credit', 'debit')),
  points_amount BIGINT NOT NULL CHECK (points_amount >= 0),
  source_gift_coins BIGINT NOT NULL DEFAULT 0,
  share_percentage_applied NUMERIC(5, 2) NOT NULL DEFAULT 70.00,
  gift_source VARCHAR(120) NOT NULL DEFAULT 'Virtual Gift',
  sender_id VARCHAR(100),
  sender_name VARCHAR(100),
  previous_balance BIGINT NOT NULL CHECK (previous_balance >= 0),
  new_balance BIGINT NOT NULL CHECK (new_balance >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  reference_id VARCHAR(150),
  related_tx_id VARCHAR(100),
  idempotency_key VARCHAR(150) UNIQUE,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by VARCHAR(100) NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_tx_host_created
  ON popolive.points_transactions (host_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_tx_status
  ON popolive.points_transactions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_tx_reference
  ON popolive.points_transactions (reference_id);

-- 5. Complete Financial Security & Admin Audit Logs
CREATE TABLE IF NOT EXISTS popolive.wallet_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id VARCHAR(100) UNIQUE NOT NULL,
  target_user_id VARCHAR(100) NOT NULL,
  wallet_id UUID,
  action_type VARCHAR(60) NOT NULL,
  actor_id VARCHAR(100) NOT NULL,
  actor_role VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  balance_type VARCHAR(20) CHECK (balance_type IN ('coins', 'points', 'both', 'none')),
  amount BIGINT NOT NULL DEFAULT 0,
  previous_balance BIGINT,
  new_balance BIGINT,
  reference_tx_id VARCHAR(100),
  ip_address VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_audit_target
  ON popolive.wallet_audit_logs (target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_audit_actor
  ON popolive.wallet_audit_logs (actor_id, created_at DESC);

-- 6. Real-Time Wallet Events Outbox (Supports SSE push & reconnect balance recovery)
CREATE TABLE IF NOT EXISTS popolive.wallet_realtime_events (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  event_type VARCHAR(60) NOT NULL CHECK (
    event_type IN (
      'wallet:coin_balance_updated',
      'wallet:points_balance_updated',
      'wallet:transaction_completed',
      'wallet:transaction_failed',
      'wallet:transaction_reversed'
    )
  ),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_rt_events_user
  ON popolive.wallet_realtime_events (user_id, id DESC);

-- 7. Seed Canonical Module 7.1 Wallet Matching Reference Picture 07_01_coins_and_points.png
--    (Coins: 12,500 | Earnings Points: 8,420)
INSERT INTO popolive.user_wallets (
  user_id, coins, diamond_points, total_spent_coins, total_received_points
) VALUES (
  'user_wallet_demo_701', 12500, 8420, 4200, 8420
)
ON CONFLICT (user_id) DO UPDATE SET
  coins = EXCLUDED.coins,
  diamond_points = EXCLUDED.diamond_points,
  updated_at = NOW();

-- Seed Ledger Entries for Demo Wallet user_wallet_demo_701 (for realistic history views)
DO $$
DECLARE
  v_wallet_id UUID;
BEGIN
  SELECT wallet_id INTO v_wallet_id FROM popolive.user_wallets WHERE user_id = 'user_wallet_demo_701';

  INSERT INTO popolive.coin_transactions (
    transaction_id, wallet_id, user_id, transaction_type, direction, coin_amount,
    previous_balance, new_balance, status, reference_id, description, created_by, created_at
  ) VALUES
    (
      'TXN_COIN_701_001', v_wallet_id, 'user_wallet_demo_701', 'topup', 'credit', 14000,
      700, 14700, 'completed', 'ORD_PK_88401', 'Official Coin Top-up Package (Verified)', 'payment_gateway', NOW() - INTERVAL '3 days'
    ),
    (
      'TXN_COIN_701_002', v_wallet_id, 'user_wallet_demo_701', 'gift_sent', 'debit', 1000,
      14700, 13700, 'completed', 'GIFT_PK_603_ROCKET', 'Sent Space Rocket to Sara Live (PK Battle)', 'gift_service', NOW() - INTERVAL '1 day'
    ),
    (
      'TXN_COIN_701_003', v_wallet_id, 'user_wallet_demo_701', 'gift_sent', 'debit', 500,
      13700, 13200, 'completed', 'GIFT_LIVE_CASTLE', 'Sent Magic Castle in Room 880219', 'gift_service', NOW() - INTERVAL '6 hours'
    ),
    (
      'TXN_COIN_701_004', v_wallet_id, 'user_wallet_demo_701', 'gift_sent', 'debit', 50000,
      13200, 13200, 'failed', 'GIFT_ATTEMPT_FAIL_01', 'Gift failed: Insufficient coin balance', 'gift_service', NOW() - INTERVAL '4 hours'
    ),
    (
      'TXN_COIN_701_005', v_wallet_id, 'user_wallet_demo_701', 'gift_sent', 'debit', 700,
      13200, 12500, 'completed', 'GIFT_PK_CROWN_LOT', 'Sent Luxury Gift Pack during Live Show', 'gift_service', NOW() - INTERVAL '45 minutes'
    )
  ON CONFLICT (transaction_id) DO NOTHING;

  INSERT INTO popolive.points_transactions (
    transaction_id, wallet_id, host_user_id, transaction_type, direction, points_amount,
    source_gift_coins, share_percentage_applied, gift_source, sender_id, sender_name,
    previous_balance, new_balance, status, reference_id, description, created_by, created_at
  ) VALUES
    (
      'TXN_PTS_701_001', v_wallet_id, 'user_wallet_demo_701', 'gift_earned', 'credit', 3500,
      5000, 70.00, 'Diamond Crown Show', 'viewer_ali_11', 'Ali Khan',
      3870, 7370, 'completed', 'GIFT_REV_7701', '70% host share earned from 5,000 coins gift', 'finance_engine', NOW() - INTERVAL '2 days'
    ),
    (
      'TXN_PTS_701_002', v_wallet_id, 'user_wallet_demo_701', 'pk_gift_earned', 'credit', 700,
      1000, 70.00, 'Space Rocket (PK Battle)', 'viewer_zara_22', 'Zara VIP',
      7370, 8070, 'completed', 'GIFT_REV_7702', '70% host share earned from 1,000 coins PK gift', 'finance_engine', NOW() - INTERVAL '5 hours'
    ),
    (
      'TXN_PTS_701_003', v_wallet_id, 'user_wallet_demo_701', 'gift_earned', 'credit', 350,
      500, 70.00, 'Magic Castle (Live Room)', 'viewer_omar_33', 'Omar_PK',
      8070, 8420, 'completed', 'GIFT_REV_7703', '70% host share earned from 500 coins gift', 'finance_engine', NOW() - INTERVAL '30 minutes'
    )
  ON CONFLICT (transaction_id) DO NOTHING;

  INSERT INTO popolive.wallet_audit_logs (
    audit_id, target_user_id, wallet_id, action_type, actor_id, actor_role, reason,
    balance_type, amount, previous_balance, new_balance, reference_tx_id
  ) VALUES (
    'AUDIT_SEED_701_001', 'user_wallet_demo_701', v_wallet_id, 'initial_seed', 'system', 'system',
    'Module 7.1 canonical wallet initialization', 'both', 12500, 0, 12500, 'TXN_COIN_701_001'
  ) ON CONFLICT (audit_id) DO NOTHING;
END $$;

-- 8. Seed Authenticated Finance Admin, Ordinary Admin, and Standard Viewer Users for RBAC & Testing
INSERT INTO popolive.users (
  id, poppo_id, email, phone, nickname, avatar_url, gender,
  is_adult_verified, status, host_level, wealth_level, role, is_staff, is_profile_completed, password_hash
) VALUES
  (
    'a0000000-0000-0000-0000-000000000097',
    '9000097',
    'finance@popolive.com',
    '+923009000097',
    'Finance Controller',
    '/avatars/default.png',
    'unspecified',
    true,
    'active',
    50,
    50,
    'finance_admin',
    true,
    true,
    '$2b$10$6BZTeZHcejYmuQw9O/pCXe42YiISIWYQkCfl/G03nRw4z9pX/Edbm'
  ),
  (
    'a0000000-0000-0000-0000-000000000098',
    '9000098',
    'ordinaryadmin@popolive.com',
    '+923009000098',
    'Community Admin (Non-Finance)',
    '/avatars/default.png',
    'unspecified',
    true,
    'active',
    30,
    30,
    'admin',
    true,
    true,
    '$2b$10$8dKYbi98deKXpYaEW/lxfOm.ptBif8q4ouHGKki5oC.1VQd1frWxS'
  ),
  (
    'a0000000-0000-0000-0000-000000000701',
    '7010001',
    'viewer701@popolive.com',
    '+923007010001',
    'Popo VIP Viewer',
    '/avatars/default.png',
    'female',
    true,
    'active',
    12,
    25,
    'user',
    false,
    true,
    '$2b$10$NkHGuXANYOJ0b/5gK2scO.MRrsws0bFS9c9MDDhzMKNlNbgIV97ru'
  )
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  is_staff = EXCLUDED.is_staff,
  password_hash = EXCLUDED.password_hash;

