-- =============================================================================
-- Popo Live Phase 7 Module 7.3 — Complete Real-Time Gift Sending System
-- Connects Module 7.1 (Wallet Coins & Points), Module 7.2 (Gift Catalog),
-- Live Streaming Rooms, and Phase 6 PK Battles
-- =============================================================================

SET search_path TO popolive, public;

-- 1. Extend Backend Finance Rules with Approved Quantity Configuration
INSERT INTO popolive.finance_rules (rule_key, rule_value, description, updated_by)
VALUES
  ('min_gift_quantity', 1, 'Minimum approved virtual gift quantity per send transaction', 'system'),
  ('max_gift_quantity', 99, 'Maximum approved virtual gift quantity per single send transaction', 'system'),
  ('gift_rate_limit_per_10s', 30, 'Maximum real-time gift send requests allowed per sender within 10 seconds', 'system')
ON CONFLICT (rule_key) DO NOTHING;

-- 2. Extend Gift Catalog with Backend-Configurable Quantity Limits per Gift
ALTER TABLE popolive.gift_catalog
  ADD COLUMN IF NOT EXISTS max_quantity INTEGER NOT NULL DEFAULT 99,
  ADD COLUMN IF NOT EXISTS allowed_quantities INTEGER[] NOT NULL DEFAULT ARRAY[1, 5, 10, 66, 99];

-- Approved luxury/exclusive gifts use bounded preset bundles configured by backend
UPDATE popolive.gift_catalog
SET max_quantity = 10,
    allowed_quantities = ARRAY[1, 3, 5, 10]
WHERE gift_id IN ('gift_sports_car', 'gift_castle', 'gift_galaxy_jet', 'gift_royal_yacht', 'gift_dragon_phoenix')
  AND max_quantity = 99;

-- 3. Permanent Gift Sending Transactions Ledger (Section 13 Complete Schema)
CREATE TABLE IF NOT EXISTS popolive.gift_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_transaction_id VARCHAR(100) UNIQUE NOT NULL,
  sender_user_id VARCHAR(100) NOT NULL,
  sender_nickname VARCHAR(120) NOT NULL DEFAULT 'Supporter',
  recipient_host_id VARCHAR(100) NOT NULL,
  recipient_nickname VARCHAR(120) NOT NULL DEFAULT 'Host',
  live_room_id VARCHAR(100),
  pk_battle_id UUID,
  pk_host_side VARCHAR(16),
  gift_id VARCHAR(80) NOT NULL REFERENCES popolive.gift_catalog(gift_id),
  gift_name_snapshot VARCHAR(120) NOT NULL,
  gift_price_snapshot BIGINT NOT NULL CHECK (gift_price_snapshot > 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_coin_amount BIGINT NOT NULL CHECK (total_coin_amount >= 0),
  host_points_credited BIGINT NOT NULL DEFAULT 0 CHECK (host_points_credited >= 0),
  platform_share BIGINT NOT NULL DEFAULT 0 CHECK (platform_share >= 0),
  share_percentage NUMERIC(5,2) NOT NULL DEFAULT 70.00,
  status VARCHAR(30) NOT NULL CHECK (status IN ('processing', 'completed', 'failed', 'reversed')),
  failure_code VARCHAR(80),
  failure_reason TEXT,
  coin_tx_id VARCHAR(100),
  points_tx_id VARCHAR(100),
  idempotency_key VARCHAR(150) UNIQUE,
  reversal_reason TEXT,
  reversed_by VARCHAR(100),
  reversed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_tx_sender
  ON popolive.gift_transactions (sender_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gift_tx_recipient
  ON popolive.gift_transactions (recipient_host_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gift_tx_room
  ON popolive.gift_transactions (live_room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gift_tx_battle
  ON popolive.gift_transactions (pk_battle_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gift_tx_status
  ON popolive.gift_transactions (status, created_at DESC);

-- 4. Real-Time Gift Sending Outbox (SSE / Socket Event Synchronization)
CREATE TABLE IF NOT EXISTS popolive.gift_realtime_events (
  id BIGSERIAL PRIMARY KEY,
  room_scope VARCHAR(120) NOT NULL,
  sender_user_id VARCHAR(100),
  recipient_host_id VARCHAR(100),
  event_type VARCHAR(80) NOT NULL CHECK (
    event_type IN (
      'gift:send_request',
      'gift:transaction_processing',
      'gift:transaction_completed',
      'gift:transaction_failed',
      'gift:received',
      'gift:animation_broadcast',
      'gift:coin_balance_updated',
      'gift:host_points_updated',
      'gift:transaction_reversed',
      'gift:state_sync'
    )
  ),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_rt_scope_id
  ON popolive.gift_realtime_events (room_scope, id DESC);

CREATE INDEX IF NOT EXISTS idx_gift_rt_created
  ON popolive.gift_realtime_events (created_at DESC);

-- 5. Ensure Canonical Active Live Room '880219' (Zara Live) and Canonical Ended Room '990703' Exist for Integration & Testing
DO $$
DECLARE
  v_zara_id UUID;
BEGIN
  SELECT id INTO v_zara_id FROM popolive.users WHERE email = 'zaralive@example.com' OR poppo_id = '8802194' LIMIT 1;
  IF v_zara_id IS NOT NULL THEN
    INSERT INTO popolive.live_rooms (
      room_number, host_id, title, cover_url, category, status, is_live, is_pk, viewer_count, country, country_code
    ) VALUES (
      '880219', v_zara_id, 'Zara Live — Real-Time Gift Stage ✨', '/assets/studio/host_zara_avatar.png', 'live', 'live', true, false, 1680, 'Pakistan', 'PK'
    ) ON CONFLICT (room_number) DO UPDATE SET
      host_id = EXCLUDED.host_id,
      status = 'live',
      is_live = true,
      updated_at = NOW();

    INSERT INTO popolive.live_rooms (
      room_number, host_id, title, cover_url, category, status, is_live, is_pk, viewer_count, country, country_code, ended_at
    ) VALUES (
      '990703', v_zara_id, 'Archived Broadcast (Ended Room Test)', '/assets/studio/host_zara_avatar.png', 'live', 'ended', false, false, 0, 'Pakistan', 'PK', NOW() - INTERVAL '2 hours'
    ) ON CONFLICT (room_number) DO UPDATE SET
      status = 'ended',
      is_live = false,
      ended_at = COALESCE(popolive.live_rooms.ended_at, NOW() - INTERVAL '2 hours'),
      updated_at = NOW();
  END IF;
END $$;
