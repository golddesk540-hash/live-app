-- Migration 041: Module 6.7 PK Activity Slot System
-- Authoritative Schema for PK Activities, Banners, Countdown, and User Progress

SET search_path TO popolive, public;

-- 1. Create pk_activity_slots table
CREATE TABLE IF NOT EXISTS popolive.pk_activity_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  title_ur VARCHAR(255),
  subtitle VARCHAR(255) NOT NULL,
  subtitle_ur VARCHAR(255),
  description TEXT NOT NULL,
  description_ur TEXT,
  activity_type VARCHAR(50) NOT NULL DEFAULT 'daily', -- 'featured', 'daily', 'special', 'challenge', 'campaign'
  banner_url TEXT,
  thumbnail_url TEXT,
  target_battles INTEGER NOT NULL DEFAULT 3,
  current_battles INTEGER NOT NULL DEFAULT 0,
  reward_points INTEGER NOT NULL DEFAULT 50,
  reward_coins INTEGER NOT NULL DEFAULT 100,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  display_order INTEGER NOT NULL DEFAULT 1,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  linked_battle_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  participating_host_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by VARCHAR(100) NOT NULL DEFAULT 'admin_system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pk_activity_status 
  ON popolive.pk_activity_slots(status, is_visible, display_order ASC, starts_at ASC);

-- 2. Create pk_activity_audit_logs table for tracking admin modifications
CREATE TABLE IF NOT EXISTS popolive.pk_activity_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES popolive.pk_activity_slots(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'status_changed', 'battle_linked', 'banner_updated'
  admin_id VARCHAR(100) NOT NULL DEFAULT 'admin_system',
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pk_activity_audit 
  ON popolive.pk_activity_audit_logs(activity_id, created_at DESC);

-- 3. Create pk_user_activity_progress table for real per-user battle count & rewards
CREATE TABLE IF NOT EXISTS popolive.pk_user_activity_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  activity_id UUID NOT NULL REFERENCES popolive.pk_activity_slots(id) ON DELETE CASCADE,
  completed_battles INTEGER NOT NULL DEFAULT 0,
  target_battles INTEGER NOT NULL DEFAULT 3,
  is_reward_claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_pk_user_activity UNIQUE (user_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_pk_user_progress 
  ON popolive.pk_user_activity_progress(user_id, activity_id);

-- 4. Seed Canonical Activities (Exact 1:1 match to 06_07_activity_slot.png)

-- Activity 1: Canonical Daily PK Challenge matching 06_07_activity_slot.png
INSERT INTO popolive.pk_activity_slots (
  id, title, title_ur, subtitle, subtitle_ur, description, description_ur,
  activity_type, target_battles, current_battles, reward_points, reward_coins,
  status, starts_at, ends_at, display_order, is_visible,
  linked_battle_ids, participating_host_ids, created_by, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000607',
  'PK Activity', 'پی کے سرگرمی',
  'Daily PK Challenge', 'روزانہ پی کے چیلنج',
  'Join PK battles and win rewards!', 'پی کے مقابلوں میں حصہ لیں اور انعامات جیتیں!',
  'daily', 3, 0, 50, 100,
  'active', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '22 hours', 1, true,
  '["00000000-0000-0000-0000-000000000606"]'::jsonb,
  '["00000000-0000-0000-0000-000000088201", "00000000-0000-0000-0000-000000088202"]'::jsonb,
  'admin_system', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_ur = EXCLUDED.title_ur,
  subtitle = EXCLUDED.subtitle,
  subtitle_ur = EXCLUDED.subtitle_ur,
  description = EXCLUDED.description,
  description_ur = EXCLUDED.description_ur,
  activity_type = EXCLUDED.activity_type,
  target_battles = EXCLUDED.target_battles,
  current_battles = EXCLUDED.current_battles,
  reward_points = EXCLUDED.reward_points,
  reward_coins = EXCLUDED.reward_coins,
  status = 'active',
  display_order = 1,
  is_visible = true,
  updated_at = NOW();

-- Activity 2: Featured Weekend PK Championship
INSERT INTO popolive.pk_activity_slots (
  id, title, title_ur, subtitle, subtitle_ur, description, description_ur,
  activity_type, target_battles, current_battles, reward_points, reward_coins,
  status, starts_at, ends_at, display_order, is_visible,
  linked_battle_ids, participating_host_ids, created_by, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000608',
  'Featured PK Activity', 'نمایاں پی کے سرگرمی',
  'Weekend PK Championship', 'ہفتہ وار پی کے چیمپئن شپ',
  'Top hosts battle for the weekend championship trophy and glory!', 'ٹاپ میزبان ہفتہ وار چیمپئن شپ ٹرافی اور اعزاز کے لیے مقابلہ کرتے ہیں!',
  'featured', 5, 2, 150, 300,
  'active', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '47 hours', 2, true,
  '["00000000-0000-0000-0000-000000000607"]'::jsonb,
  '["00000000-0000-0000-0000-000000088203", "00000000-0000-0000-0000-000000088204"]'::jsonb,
  'admin_system', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  status = 'active',
  display_order = 2,
  is_visible = true,
  updated_at = NOW();

-- Activity 3: Scheduled Special Midnight Clash
INSERT INTO popolive.pk_activity_slots (
  id, title, title_ur, subtitle, subtitle_ur, description, description_ur,
  activity_type, target_battles, current_battles, reward_points, reward_coins,
  status, starts_at, ends_at, display_order, is_visible,
  linked_battle_ids, participating_host_ids, created_by, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000609',
  'Special PK Event', 'خصوصی پی کے مقابلہ',
  'Midnight PK Super Clash', 'رات کا پی کے سپر مقابلہ',
  'Special night tournament with double multipliers.', 'ڈبل ضرب کے ساتھ خصوصی رات کا مقابلہ۔',
  'special', 4, 0, 100, 200,
  'scheduled', NOW() + INTERVAL '4 hours', NOW() + INTERVAL '28 hours', 3, true,
  '["00000000-0000-0000-0000-000000000608"]'::jsonb,
  '["00000000-0000-0000-0000-000000088205", "00000000-0000-0000-0000-000000088206"]'::jsonb,
  'admin_system', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  status = 'scheduled',
  display_order = 3,
  is_visible = true,
  updated_at = NOW();

-- Activity 4: Completed Starter Trial
INSERT INTO popolive.pk_activity_slots (
  id, title, title_ur, subtitle, subtitle_ur, description, description_ur,
  activity_type, target_battles, current_battles, reward_points, reward_coins,
  status, starts_at, ends_at, display_order, is_visible,
  linked_battle_ids, participating_host_ids, created_by, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000610',
  'Host PK Challenge', 'میزبان پی کے چیلنج',
  'Starter PK Trial', 'ابتدائی پی کے ٹرائل',
  'Completed seasonal trial for active streamers.', 'فعال اسٹریمز کے لیے مکمل شدہ موسمی مقابلہ۔',
  'challenge', 3, 3, 50, 100,
  'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 hour', 4, true,
  '["00000000-0000-0000-0000-000000000604"]'::jsonb,
  '["00000000-0000-0000-0000-000000088201"]'::jsonb,
  'admin_system', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  status = 'completed',
  display_order = 4,
  is_visible = true,
  updated_at = NOW();
