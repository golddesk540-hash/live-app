-- Migration 060: Agent Earnings, Coin Seller, Commission Management & Withdrawals
-- Schema: popolive

-- 1. Update check constraints on transactions tables
ALTER TABLE popolive.coin_transactions DROP CONSTRAINT IF EXISTS coin_transactions_transaction_type_check;
ALTER TABLE popolive.coin_transactions ADD CONSTRAINT coin_transactions_transaction_type_check
  CHECK (transaction_type = ANY (ARRAY['topup', 'gift_sent', 'admin_credit', 'admin_debit', 'reversal', 'initial_credit', 'feature_spend', 'seller_sale', 'seller_purchase', 'seller_transfer']));

ALTER TABLE popolive.points_transactions DROP CONSTRAINT IF EXISTS points_transactions_transaction_type_check;
ALTER TABLE popolive.points_transactions ADD CONSTRAINT points_transactions_transaction_type_check
  CHECK (transaction_type = ANY (ARRAY['gift_earned', 'pk_gift_earned', 'admin_credit', 'admin_debit', 'reversal', 'task_reward', 'starter_pack', 'agent_commission', 'withdrawal_debit', 'withdrawal_refund']));

-- 2. Agent Profiles & Coin Seller Authorization Table
CREATE TABLE IF NOT EXISTS popolive.agent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES popolive.agencies(id) ON DELETE SET NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'agent', -- 'agent', 'coin_seller', 'agency_admin', 'super_admin'
  commission_rate NUMERIC(5,2) DEFAULT 8.00,
  is_coin_seller BOOLEAN DEFAULT false,
  seller_coin_balance BIGINT DEFAULT 0,
  total_sales_count INT DEFAULT 0,
  total_coins_sold BIGINT DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'revoked'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_profiles_user ON popolive.agent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_agency ON popolive.agent_profiles(agency_id);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_seller ON popolive.agent_profiles(is_coin_seller, status);

-- 3. Agent Earnings & Commissions Table
CREATE TABLE IF NOT EXISTS popolive.agent_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  total_earnings_points BIGINT DEFAULT 0,
  available_balance_points BIGINT DEFAULT 0,
  pending_balance_points BIGINT DEFAULT 0,
  withdrawn_points BIGINT DEFAULT 0,
  confirmed_commissions_points BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_user_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_earnings_user ON popolive.agent_earnings(agent_user_id);

-- 4. Coin Seller Sales Records
CREATE TABLE IF NOT EXISTS popolive.coin_seller_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_reference VARCHAR(64) UNIQUE NOT NULL,
  seller_user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  customer_user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  package_id VARCHAR(64) NOT NULL REFERENCES popolive.coin_packages(package_id),
  coins_amount BIGINT NOT NULL,
  fiat_amount NUMERIC(10,2) NOT NULL,
  fiat_currency VARCHAR(8) DEFAULT 'USD',
  commission_rate NUMERIC(5,2) NOT NULL,
  commission_points BIGINT NOT NULL,
  payment_method VARCHAR(64) DEFAULT 'cash_transfer',
  status VARCHAR(32) NOT NULL DEFAULT 'completed', -- 'completed', 'pending', 'failed', 'reversed'
  idempotency_key VARCHAR(128) UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_seller_sales_seller ON popolive.coin_seller_sales(seller_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seller_sales_customer ON popolive.coin_seller_sales(customer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seller_sales_ref ON popolive.coin_seller_sales(sale_reference);

-- 5. Payout Methods Table
CREATE TABLE IF NOT EXISTS popolive.agent_payout_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  provider VARCHAR(64) NOT NULL, -- 'jazzcash', 'easypaisa', 'bank_transfer'
  account_title VARCHAR(128) NOT NULL,
  account_number_masked VARCHAR(64) NOT NULL,
  account_number_hash VARCHAR(128) NOT NULL,
  bank_name VARCHAR(128),
  is_default BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payout_methods_user ON popolive.agent_payout_methods(user_id);

-- 6. Withdrawals Table
CREATE TABLE IF NOT EXISTS popolive.agent_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_reference VARCHAR(64) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  payout_method_id UUID REFERENCES popolive.agent_payout_methods(id),
  points_amount BIGINT NOT NULL,
  fiat_amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(8) DEFAULT 'USD',
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'under_review', 'approved', 'processing', 'completed', 'rejected', 'cancelled'
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES popolive.users(id),
  reviewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON popolive.agent_withdrawals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON popolive.agent_withdrawals(status);

-- 7. Real-Time Events Table for Agent Activities
CREATE TABLE IF NOT EXISTS popolive.agent_realtime_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES popolive.users(id) ON DELETE CASCADE,
  event_type VARCHAR(64) NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_events_user ON popolive.agent_realtime_events(user_id, created_at DESC);

-- 8. Seed Reference Agent, Seller & Financial Data
DO $$
DECLARE
  v_zara_id UUID;
  v_sana_id UUID;
  v_agency_id UUID := 'a1111111-1111-1111-1111-111111111111';
  v_payout_jazzcash_id UUID := 'd1111111-1111-1111-1111-111111111111';
  v_payout_bank_id UUID := 'd2222222-2222-2222-2222-222222222222';
BEGIN
  SELECT id INTO v_zara_id FROM popolive.users WHERE email = 'zara.live@popolive.com' OR nickname = 'Zara Live' LIMIT 1;
  SELECT id INTO v_sana_id FROM popolive.users WHERE email = 'sana.khan@popolive.com' OR nickname = 'Sana Khan' LIMIT 1;

  IF v_zara_id IS NOT NULL THEN
    -- Seed Zara Live as Authorized Agent & Coin Seller
    INSERT INTO popolive.agent_profiles (
      user_id, agency_id, role, commission_rate, is_coin_seller, seller_coin_balance, total_sales_count, total_coins_sold, status
    ) VALUES (
      v_zara_id,
      v_agency_id,
      'agency_admin',
      8.00,
      true,
      50000,
      12,
      15000,
      'active'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      is_coin_seller = true,
      seller_coin_balance = 50000,
      status = 'active';

    -- Seed Zara Live Agent Earnings
    INSERT INTO popolive.agent_earnings (
      agent_user_id, total_earnings_points, available_balance_points, pending_balance_points, withdrawn_points, confirmed_commissions_points
    ) VALUES (
      v_zara_id,
      350000,
      250000,
      25000,
      75000,
      120000
    )
    ON CONFLICT (agent_user_id) DO UPDATE SET
      available_balance_points = 250000,
      pending_balance_points = 25000;

    -- Seed Payout Methods
    INSERT INTO popolive.agent_payout_methods (
      id, user_id, provider, account_title, account_number_masked, account_number_hash, is_default, is_verified
    ) VALUES
      (v_payout_jazzcash_id, v_zara_id, 'jazzcash', 'Syeda Zara Live', '•••• •••• ••4321', 'hash_jazzcash_4321', true, true),
      (v_payout_bank_id, v_zara_id, 'bank_transfer', 'Zara Live Commercial', '•••• •••• ••8821', 'hash_bank_8821', false, true)
    ON CONFLICT (id) DO NOTHING;

    -- Seed Completed Withdrawal
    INSERT INTO popolive.agent_withdrawals (
      withdrawal_reference, user_id, payout_method_id, points_amount, fiat_amount, currency, status, completed_at
    ) VALUES (
      'WTH-20261101-001',
      v_zara_id,
      v_payout_jazzcash_id,
      75000,
      75.00,
      'USD',
      'completed',
      CURRENT_TIMESTAMP - INTERVAL '15 days'
    )
    ON CONFLICT (withdrawal_reference) DO NOTHING;

    -- Seed Previous Coin Sales
    IF v_sana_id IS NOT NULL THEN
      INSERT INTO popolive.coin_seller_sales (
        sale_reference, seller_user_id, customer_user_id, package_id, coins_amount, fiat_amount, commission_rate, commission_points, status
      ) VALUES (
        'CS-20261110-001',
        v_zara_id,
        v_sana_id,
        'pkg_1000',
        1100,
        9.99,
        8.00,
        80,
        'completed'
      )
      ON CONFLICT (sale_reference) DO NOTHING;
    END IF;
  END IF;
END $$;
