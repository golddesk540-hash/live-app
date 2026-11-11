-- =============================================================================
-- Popo Live Phase 7 Module 7.5 — Host Gift Share into Points System
-- Integrates seamlessly with Module 7.1 (Coins & Points), Module 7.2 (Catalog),
-- Module 7.3 (Real-Time Gift Sending), and Module 7.4 (Animations & Entrances)
--
-- FINANCIAL RULES (Approved Popo Live Build Plan):
-- - 70% of eligible gift coins are credited to host as Points (non-cash)
-- - 30% remaining coins are recorded as Platform Share
-- - Zero cash withdrawal or currency conversion rate invented here
-- - Duplicate share credits per gift transaction prevented via UNIQUE constraint
-- =============================================================================

SET search_path TO popolive, public;

-- 1. Ensure finance rules reflect 70% host share and 30% platform share explicitly
INSERT INTO popolive.finance_rules (rule_key, rule_value, description, updated_by)
VALUES
  ('platform_gift_share_percent', 30, 'Platform retained share percentage on eligible virtual gift coins (100 - host_gift_share_percent)', 'system')
ON CONFLICT (rule_key) DO NOTHING;

-- 2. Authoritative Host Gift Share Ledger (1:1 per completed/reversed gift transaction)
CREATE TABLE IF NOT EXISTS popolive.host_earning_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  earning_id VARCHAR(100) UNIQUE NOT NULL,
  gift_transaction_id VARCHAR(100) UNIQUE NOT NULL REFERENCES popolive.gift_transactions(gift_transaction_id) ON DELETE RESTRICT,
  host_user_id VARCHAR(100) NOT NULL,
  host_nickname VARCHAR(120) NOT NULL DEFAULT 'Host',
  sender_user_id VARCHAR(100) NOT NULL,
  sender_nickname VARCHAR(120) NOT NULL DEFAULT 'Supporter',
  gift_id VARCHAR(80) NOT NULL,
  gift_name_snapshot VARCHAR(120) NOT NULL,
  gift_quantity INTEGER NOT NULL CHECK (gift_quantity > 0),
  source_type VARCHAR(30) NOT NULL DEFAULT 'live_room' CHECK (source_type IN ('live_room', 'pk_battle', 'direct_gift')),
  live_room_id VARCHAR(100),
  pk_battle_id UUID,
  original_coin_amount BIGINT NOT NULL CHECK (original_coin_amount > 0),
  host_share_percentage NUMERIC(5,2) NOT NULL DEFAULT 70.00,
  points_credited BIGINT NOT NULL CHECK (points_credited >= 0),
  platform_share_percentage NUMERIC(5,2) NOT NULL DEFAULT 30.00,
  platform_share_amount BIGINT NOT NULL CHECK (platform_share_amount >= 0),
  points_tx_id VARCHAR(100),
  status VARCHAR(30) NOT NULL CHECK (status IN ('credited', 'reversed', 'failed')),
  reversal_reference VARCHAR(100),
  reversal_reason TEXT,
  reversed_by VARCHAR(100),
  reversed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_host_platform_sum_matches CHECK (points_credited + platform_share_amount = original_coin_amount)
);

CREATE INDEX IF NOT EXISTS idx_host_earning_shares_host_created
  ON popolive.host_earning_shares (host_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_host_earning_shares_status_created
  ON popolive.host_earning_shares (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_host_earning_shares_sender
  ON popolive.host_earning_shares (sender_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_host_earning_shares_gift
  ON popolive.host_earning_shares (gift_id, created_at DESC);

-- 3. Safely backfill any historical completed/reversed Module 7.3 gift_transactions
-- Never credits failed transactions! Uses exact integer math preserving sum integrity.
INSERT INTO popolive.host_earning_shares (
  earning_id,
  gift_transaction_id,
  host_user_id,
  host_nickname,
  sender_user_id,
  sender_nickname,
  gift_id,
  gift_name_snapshot,
  gift_quantity,
  source_type,
  live_room_id,
  pk_battle_id,
  original_coin_amount,
  host_share_percentage,
  points_credited,
  platform_share_percentage,
  platform_share_amount,
  points_tx_id,
  status,
  reversal_reference,
  reversal_reason,
  reversed_by,
  reversed_at,
  metadata,
  created_at,
  updated_at
)
SELECT
  'ERN_' || REPLACE(gt.gift_transaction_id, 'GFT_', ''),
  gt.gift_transaction_id,
  gt.recipient_host_id,
  gt.recipient_nickname,
  gt.sender_user_id,
  gt.sender_nickname,
  gt.gift_id,
  gt.gift_name_snapshot,
  gt.quantity,
  CASE
    WHEN gt.pk_battle_id IS NOT NULL THEN 'pk_battle'
    WHEN gt.live_room_id IS NOT NULL THEN 'live_room'
    ELSE 'direct_gift'
  END,
  gt.live_room_id,
  gt.pk_battle_id,
  gt.total_coin_amount,
  gt.share_percentage,
  gt.host_points_credited,
  (100.00 - gt.share_percentage),
  GREATEST(0, gt.total_coin_amount - gt.host_points_credited),
  gt.points_tx_id,
  CASE WHEN gt.status = 'reversed' THEN 'reversed' ELSE 'credited' END,
  CASE WHEN gt.status = 'reversed' THEN 'REV_' || gt.gift_transaction_id ELSE NULL END,
  gt.reversal_reason,
  gt.reversed_by,
  gt.reversed_at,
  jsonb_build_object('backfilledFrom', 'gift_transactions', 'pkHostSide', gt.pk_host_side),
  gt.created_at,
  gt.updated_at
FROM popolive.gift_transactions gt
WHERE gt.status IN ('completed', 'reversed')
  AND gt.total_coin_amount > 0
  AND (gt.host_points_credited + GREATEST(0, gt.total_coin_amount - gt.host_points_credited)) = gt.total_coin_amount
ON CONFLICT (gift_transaction_id) DO NOTHING;

-- 4. Host-Scoped Real-Time Earnings Event Outbox (Strict Privacy Isolation)
CREATE TABLE IF NOT EXISTS popolive.earnings_realtime_events (
  id BIGSERIAL PRIMARY KEY,
  host_user_id VARCHAR(100) NOT NULL,
  event_type VARCHAR(80) NOT NULL CHECK (
    event_type IN (
      'earnings:gift_received',
      'earnings:points_credited',
      'earnings:balance_updated',
      'earnings:transaction_reversed',
      'earnings:history_updated'
    )
  ),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_earnings_rt_host_id
  ON popolive.earnings_realtime_events (host_user_id, id DESC);
