-- ============================================================================
-- POPO LIVE MIGRATION 058: HOST TASKS, LEVELS, NEW HOST PACK & EARNING IDENTITY
-- Module M8: Daily Host Tasks, Task Levels, Progress Tracking, New Host Pack & KYC
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS popolive;

-- 1. Host Daily Tasks Catalogue
CREATE TABLE IF NOT EXISTS popolive.host_daily_tasks (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(64) NOT NULL, -- 'live_streaming', 'gift_activity', 'community'
  category_label VARCHAR(64) NOT NULL,
  target_progress INT NOT NULL,
  unit VARCHAR(32) NOT NULL, -- 'min', 'gifts', 'viewers', 'room'
  reward_points INT NOT NULL DEFAULT 50,
  reward_coins INT NOT NULL DEFAULT 0,
  icon_key VARCHAR(64) DEFAULT 'clock',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Daily Task Progress Ledger
CREATE TABLE IF NOT EXISTS popolive.user_daily_task_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  task_id VARCHAR(64) NOT NULL REFERENCES popolive.host_daily_tasks(id) ON DELETE CASCADE,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_progress INT NOT NULL DEFAULT 0,
  target_progress INT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'In Progress', -- 'Not Started', 'In Progress', 'Completed', 'Claimed'
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  is_reward_claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMPTZ,
  reward_points_credited INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_daily_task UNIQUE (user_id, task_id, task_date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_task_user_date ON popolive.user_daily_task_progress(user_id, task_date);

-- 3. Host Task Levels Hierarchy
CREATE TABLE IF NOT EXISTS popolive.host_task_levels (
  level_number INT PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  min_points INT NOT NULL,
  target_points INT NOT NULL,
  description TEXT,
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  badge_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. User Host Task Level Records
CREATE TABLE IF NOT EXISTS popolive.user_host_task_levels (
  user_id UUID PRIMARY KEY REFERENCES popolive.users(id) ON DELETE CASCADE,
  current_level INT NOT NULL DEFAULT 1 REFERENCES popolive.host_task_levels(level_number),
  task_points INT NOT NULL DEFAULT 0,
  highest_level INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. New Host Pack Configuration
CREATE TABLE IF NOT EXISTS popolive.new_host_packs (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  description TEXT,
  reward_points INT NOT NULL DEFAULT 200,
  reward_coins INT NOT NULL DEFAULT 50,
  welcome_badge VARCHAR(64) DEFAULT 'Rising Star',
  guides JSONB NOT NULL DEFAULT '[]'::jsonb,
  validity_days INT NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. User New Host Pack Claims
CREATE TABLE IF NOT EXISTS popolive.user_new_host_pack_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE UNIQUE,
  pack_id VARCHAR(64) NOT NULL REFERENCES popolive.new_host_packs(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'claimed', -- 'eligible', 'claimed', 'expired'
  completed_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reward_points_credited INT NOT NULL DEFAULT 0
);

-- 7. Host Earning Identity (KYC & Earning Status)
CREATE TABLE IF NOT EXISTS popolive.host_earning_identities (
  user_id UUID PRIMARY KEY REFERENCES popolive.users(id) ON DELETE CASCADE,
  legal_name VARCHAR(120) NOT NULL,
  country VARCHAR(64) NOT NULL DEFAULT 'Pakistan',
  document_type VARCHAR(32) NOT NULL DEFAULT 'national_id', -- 'national_id', 'passport', 'drivers_license'
  document_number_masked VARCHAR(64) NOT NULL DEFAULT '•••• •••• ••••',
  document_front_url TEXT,
  document_back_url TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'incomplete', -- 'not_started', 'incomplete', 'submitted', 'under_review', 'verified', 'rejected', 'suspended'
  earning_eligible BOOLEAN NOT NULL DEFAULT false,
  verification_notes TEXT,
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Host Task Real-time Events
CREATE TABLE IF NOT EXISTS popolive.host_task_realtime_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  event_type VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_host_task_events_user ON popolive.host_task_realtime_events(user_id, created_at DESC);

-- Update points_transactions_transaction_type_check to permit host task and starter pack reward transactions
ALTER TABLE popolive.points_transactions DROP CONSTRAINT IF EXISTS points_transactions_transaction_type_check;
ALTER TABLE popolive.points_transactions ADD CONSTRAINT points_transactions_transaction_type_check
  CHECK (transaction_type = ANY (ARRAY['gift_earned', 'pk_gift_earned', 'admin_credit', 'admin_debit', 'reversal', 'task_reward', 'starter_pack']));

