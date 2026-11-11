-- =============================================================================
-- Migration 048: Module 7.4 — Premium Gift Animations & Host Entrance Effects
-- Isolated from wallet balance mutations; maps strictly to approved Module 7.2
-- gift_catalog items and genuine database VIP memberships.
-- =============================================================================

CREATE TABLE IF NOT EXISTS popolive.animation_priority_config (
  config_key VARCHAR(64) PRIMARY KEY,
  display_label VARCHAR(120) NOT NULL,
  priority_weight INTEGER NOT NULL DEFAULT 10,
  max_concurrent INTEGER NOT NULL DEFAULT 1 CHECK (max_concurrent BETWEEN 1 AND 10),
  default_duration_ms INTEGER NOT NULL DEFAULT 3000 CHECK (default_duration_ms BETWEEN 800 AND 15000),
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by VARCHAR(100) NOT NULL DEFAULT 'system_seed',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS popolive.gift_animations (
  animation_id VARCHAR(80) PRIMARY KEY,
  gift_id VARCHAR(64) NOT NULL UNIQUE REFERENCES popolive.gift_catalog(gift_id) ON DELETE CASCADE,
  animation_tier VARCHAR(32) NOT NULL
    CHECK (animation_tier IN ('small_floating', 'medium_animated', 'large_fullscreen', 'luxury', 'special_event', 'pk_effect')),
  priority_category VARCHAR(32) NOT NULL DEFAULT 'standard'
    CHECK (priority_category IN ('standard', 'premium', 'luxury', 'special_event')),
  priority_weight INTEGER NOT NULL DEFAULT 10 CHECK (priority_weight BETWEEN 1 AND 1000),
  duration_ms INTEGER NOT NULL DEFAULT 2800 CHECK (duration_ms BETWEEN 800 AND 15000),
  loop_count INTEGER NOT NULL DEFAULT 1 CHECK (loop_count BETWEEN 1 AND 10),
  is_fullscreen BOOLEAN NOT NULL DEFAULT FALSE,
  sound_url TEXT,
  preview_image_url TEXT,
  fallback_asset_url TEXT NOT NULL DEFAULT '/assets/gifts/fallback_gift.png',
  pk_effect_style VARCHAR(32) NOT NULL DEFAULT 'side_burst'
    CHECK (pk_effect_style IN ('side_float', 'side_burst', 'center_stage', 'cross_arena')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by VARCHAR(100) NOT NULL DEFAULT 'system_seed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_animations_tier
  ON popolive.gift_animations(animation_tier, is_active, priority_weight DESC);

CREATE TABLE IF NOT EXISTS popolive.host_entrance_effects (
  entrance_id VARCHAR(64) PRIMARY KEY,
  entrance_type VARCHAR(32) NOT NULL UNIQUE
    CHECK (entrance_type IN ('standard', 'premium', 'vip', 'special_event')),
  name VARCHAR(120) NOT NULL,
  name_ur VARCHAR(120) NOT NULL,
  required_vip_level INTEGER NOT NULL DEFAULT 0 CHECK (required_vip_level >= 0),
  min_host_level INTEGER NOT NULL DEFAULT 1 CHECK (min_host_level >= 1),
  requires_special_event BOOLEAN NOT NULL DEFAULT FALSE,
  vip_badge_label VARCHAR(40),
  asset_type VARCHAR(24) NOT NULL DEFAULT 'lottie',
  animation_url TEXT NOT NULL,
  preview_image_url TEXT NOT NULL,
  sound_url TEXT,
  duration_ms INTEGER NOT NULL DEFAULT 3400 CHECK (duration_ms BETWEEN 1000 AND 15000),
  priority_weight INTEGER NOT NULL DEFAULT 40,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by VARCHAR(100) NOT NULL DEFAULT 'system_seed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS popolive.user_vip_memberships (
  membership_id VARCHAR(80) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL UNIQUE,
  vip_level INTEGER NOT NULL DEFAULT 1 CHECK (vip_level >= 0),
  vip_tier VARCHAR(32) NOT NULL DEFAULT 'vip_gold'
    CHECK (vip_tier IN ('none', 'premium_host', 'vip_gold', 'vip_diamond', 'special_event_vip')),
  badge_label VARCHAR(40) NOT NULL DEFAULT 'VIP',
  special_event_access BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(24) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'revoked')),
  granted_by VARCHAR(100) NOT NULL DEFAULT 'system_seed',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_vip_memberships_lookup
  ON popolive.user_vip_memberships(user_id, status, expires_at DESC);

CREATE TABLE IF NOT EXISTS popolive.user_animation_preferences (
  user_id VARCHAR(100) PRIMARY KEY,
  enable_large_animations BOOLEAN NOT NULL DEFAULT TRUE,
  enable_sound_effects BOOLEAN NOT NULL DEFAULT TRUE,
  reduce_animations BOOLEAN NOT NULL DEFAULT FALSE,
  respect_device_reduced_motion BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS popolive.animation_playback_queue (
  queue_id VARCHAR(80) PRIMARY KEY,
  dedupe_key VARCHAR(180) NOT NULL UNIQUE,
  event_category VARCHAR(24) NOT NULL CHECK (event_category IN ('gift', 'host_entrance')),
  room_scope VARCHAR(120) NOT NULL,
  live_room_id VARCHAR(120),
  pk_battle_id VARCHAR(120),
  pk_host_side VARCHAR(16),
  gift_transaction_id VARCHAR(80),
  gift_id VARCHAR(64),
  gift_name VARCHAR(120),
  gift_name_ur VARCHAR(120),
  entrance_id VARCHAR(64),
  entrance_type VARCHAR(32),
  sender_user_id VARCHAR(100),
  sender_nickname VARCHAR(120),
  sender_avatar_url TEXT,
  recipient_host_id VARCHAR(100) NOT NULL,
  recipient_nickname VARCHAR(120) NOT NULL,
  recipient_poppo_id VARCHAR(40),
  recipient_avatar_url TEXT,
  vip_badge_label VARCHAR(40),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_coin_amount BIGINT NOT NULL DEFAULT 0,
  animation_tier VARCHAR(32) NOT NULL,
  priority_category VARCHAR(32) NOT NULL DEFAULT 'standard',
  priority_weight INTEGER NOT NULL DEFAULT 10,
  is_fullscreen BOOLEAN NOT NULL DEFAULT FALSE,
  pk_effect_style VARCHAR(32) NOT NULL DEFAULT 'side_burst',
  duration_ms INTEGER NOT NULL DEFAULT 3000,
  loop_count INTEGER NOT NULL DEFAULT 1,
  asset_type VARCHAR(24) NOT NULL DEFAULT 'lottie',
  animation_url TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  sound_url TEXT,
  fallback_url TEXT NOT NULL DEFAULT '/assets/gifts/fallback_gift.png',
  status VARCHAR(24) NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'playing', 'completed', 'skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_animation_queue_scope_status
  ON popolive.animation_playback_queue(room_scope, status, priority_weight DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_animation_queue_tx
  ON popolive.animation_playback_queue(gift_transaction_id) WHERE gift_transaction_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS popolive.animation_realtime_events (
  id BIGSERIAL PRIMARY KEY,
  room_scope VARCHAR(120) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  queue_id VARCHAR(80),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_animation_realtime_events_scope
  ON popolive.animation_realtime_events(room_scope, id DESC);

CREATE TABLE IF NOT EXISTS popolive.animation_admin_audit_logs (
  audit_id VARCHAR(80) PRIMARY KEY,
  target_type VARCHAR(40) NOT NULL,
  target_id VARCHAR(120) NOT NULL,
  action_type VARCHAR(48) NOT NULL,
  actor_id VARCHAR(100) NOT NULL,
  actor_role VARCHAR(32) NOT NULL,
  reason TEXT,
  before_data JSONB,
  after_data JSONB,
  ip_address VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed backend priority weights & fullscreen concurrency limit
INSERT INTO popolive.animation_priority_config (
  config_key, display_label, priority_weight, max_concurrent, default_duration_ms, is_enabled
) VALUES
  ('standard', 'Standard Gift Effects', 10, 3, 2200, TRUE),
  ('premium', 'Premium Animated Gifts', 35, 2, 3200, TRUE),
  ('luxury', 'Luxury Full-Screen Gifts', 80, 1, 4500, TRUE),
  ('special_event', 'Special Event Effects', 90, 1, 4800, TRUE),
  ('vip_entrance', 'VIP Host Entrance Effects', 100, 1, 3800, TRUE),
  ('max_concurrent_fullscreen', 'Max Concurrent Full-Screen Animations', 100, 1, 4500, TRUE)
ON CONFLICT (config_key) DO NOTHING;

-- Map approved Module 7.2 catalog gifts deterministically to approved animation tiers
INSERT INTO popolive.gift_animations (
  animation_id, gift_id, animation_tier, priority_category, priority_weight,
  duration_ms, loop_count, is_fullscreen, sound_url, preview_image_url, fallback_asset_url, pk_effect_style, is_active
) VALUES
  ('anim_gift_lollipop', 'gift_lollipop', 'small_floating', 'standard', 10, 2000, 1, FALSE, '/assets/gifts/sfx/sfx_small_chime.wav', '/assets/gifts/lollipop.png', '/assets/gifts/fallback_gift.png', 'side_float', TRUE),
  ('anim_gift_rose', 'gift_rose', 'small_floating', 'standard', 12, 2200, 1, FALSE, '/assets/gifts/sfx/sfx_small_chime.wav', '/assets/gifts/rose.png', '/assets/gifts/fallback_gift.png', 'side_float', TRUE),
  ('anim_gift_love_letter', 'gift_love_letter', 'small_floating', 'standard', 14, 2300, 1, FALSE, '/assets/gifts/sfx/sfx_small_chime.wav', '/assets/gifts/love_letter.png', '/assets/gifts/fallback_gift.png', 'side_float', TRUE),
  ('anim_gift_heart', 'gift_heart', 'medium_animated', 'standard', 20, 2600, 1, FALSE, '/assets/gifts/sfx/sfx_medium_sparkle.wav', '/assets/gifts/heart.png', '/assets/gifts/fallback_gift.png', 'side_burst', TRUE),
  ('anim_gift_teddy', 'gift_teddy', 'medium_animated', 'standard', 25, 2800, 1, FALSE, '/assets/gifts/sfx/sfx_medium_sparkle.wav', '/assets/gifts/teddy.png', '/assets/gifts/fallback_gift.png', 'side_burst', TRUE),
  ('anim_gift_festive_lantern', 'gift_festive_lantern', 'medium_animated', 'premium', 32, 3000, 1, FALSE, '/assets/gifts/sfx/sfx_medium_sparkle.wav', '/assets/gifts/festive_lantern.png', '/assets/gifts/fallback_gift.png', 'side_burst', TRUE),
  ('anim_gift_diamond_ring', 'gift_diamond_ring', 'large_fullscreen', 'premium', 45, 3400, 1, TRUE, '/assets/gifts/sfx/sfx_large_fanfare.wav', '/assets/gifts/diamond_ring.png', '/assets/gifts/fallback_gift.png', 'center_stage', TRUE),
  ('anim_gift_crown', 'gift_crown', 'large_fullscreen', 'premium', 55, 3600, 1, TRUE, '/assets/gifts/sfx/sfx_large_fanfare.wav', '/assets/gifts/crown.png', '/assets/gifts/fallback_gift.png', 'center_stage', TRUE),
  ('anim_gift_royal_yacht', 'gift_royal_yacht', 'luxury', 'luxury', 72, 4200, 1, TRUE, '/assets/gifts/sfx/sfx_luxury_grand.wav', '/assets/gifts/royal_yacht.png', '/assets/gifts/fallback_gift.png', 'cross_arena', TRUE),
  ('anim_gift_sports_car', 'gift_sports_car', 'luxury', 'luxury', 78, 4400, 1, TRUE, '/assets/gifts/sfx/sfx_luxury_grand.wav', '/assets/gifts/sports_car.png', '/assets/gifts/fallback_gift.png', 'cross_arena', TRUE),
  ('anim_gift_galaxy_jet', 'gift_galaxy_jet', 'luxury', 'luxury', 84, 4500, 1, TRUE, '/assets/gifts/sfx/sfx_luxury_grand.wav', '/assets/gifts/galaxy_jet.png', '/assets/gifts/fallback_gift.png', 'cross_arena', TRUE),
  ('anim_gift_castle', 'gift_castle', 'luxury', 'luxury', 92, 4800, 2, TRUE, '/assets/gifts/sfx/sfx_luxury_grand.wav', '/assets/gifts/castle.png', '/assets/gifts/fallback_gift.png', 'cross_arena', TRUE),
  ('anim_gift_event_fireworks', 'gift_event_fireworks', 'special_event', 'special_event', 90, 4200, 2, TRUE, '/assets/gifts/sfx/sfx_special_event.wav', '/assets/gifts/event_fireworks.png', '/assets/gifts/fallback_gift.png', 'center_stage', TRUE),
  ('anim_gift_dragon_phoenix', 'gift_dragon_phoenix', 'luxury', 'luxury', 98, 5200, 2, TRUE, '/assets/gifts/sfx/sfx_luxury_grand.wav', '/assets/gifts/dragon_phoenix.png', '/assets/gifts/fallback_gift.png', 'cross_arena', TRUE)
ON CONFLICT (gift_id) DO NOTHING;

-- Backfill any dynamic QA/extra active catalog gifts with safe deterministic defaults
INSERT INTO popolive.gift_animations (
  animation_id, gift_id, animation_tier, priority_category, priority_weight,
  duration_ms, loop_count, is_fullscreen, sound_url, preview_image_url, fallback_asset_url, pk_effect_style, is_active
)
SELECT
  'anim_' || gc.gift_id,
  gc.gift_id,
  CASE
    WHEN gc.coin_price >= 3000 THEN 'luxury'
    WHEN gc.coin_price >= 500 THEN 'large_fullscreen'
    WHEN gc.coin_price >= 50 THEN 'medium_animated'
    ELSE 'small_floating'
  END,
  CASE
    WHEN gc.coin_price >= 3000 THEN 'luxury'
    WHEN gc.coin_price >= 250 THEN 'premium'
    ELSE 'standard'
  END,
  CASE
    WHEN gc.coin_price >= 3000 THEN 80
    WHEN gc.coin_price >= 250 THEN 40
    ELSE 15
  END,
  CASE
    WHEN gc.coin_price >= 3000 THEN 4200
    WHEN gc.coin_price >= 250 THEN 3200
    ELSE 2200
  END,
  1,
  (gc.coin_price >= 250),
  CASE
    WHEN gc.coin_price >= 3000 THEN '/assets/gifts/sfx/sfx_luxury_grand.wav'
    WHEN gc.coin_price >= 250 THEN '/assets/gifts/sfx/sfx_large_fanfare.wav'
    ELSE '/assets/gifts/sfx/sfx_small_chime.wav'
  END,
  gc.image_url,
  '/assets/gifts/fallback_gift.png',
  'side_burst',
  gc.is_active
FROM popolive.gift_catalog gc
WHERE NOT EXISTS (
  SELECT 1 FROM popolive.gift_animations ga WHERE ga.gift_id = gc.gift_id
)
ON CONFLICT (gift_id) DO NOTHING;

-- Seed 4 configurable Host Entrance Effect tiers
INSERT INTO popolive.host_entrance_effects (
  entrance_id, entrance_type, name, name_ur, required_vip_level, min_host_level,
  requires_special_event, vip_badge_label, asset_type, animation_url, preview_image_url, sound_url, duration_ms, priority_weight, is_active
) VALUES
  ('ent_standard', 'standard', 'Standard Host Entrance', 'معیاری میزبان آمد', 0, 1, FALSE, NULL, 'lottie', '/assets/gifts/entrances/entrance_standard.json', '/assets/gifts/entrances/entrance_standard.png', '/assets/gifts/sfx/sfx_entrance_standard.wav', 2600, 30, TRUE),
  ('ent_premium', 'premium', 'Starlight Premium Entrance', 'پریمیم اسٹارلائٹ آمد', 0, 5, FALSE, 'STAR HOST', 'lottie', '/assets/gifts/entrances/entrance_premium.json', '/assets/gifts/entrances/entrance_premium.png', '/assets/gifts/sfx/sfx_entrance_premium.wav', 3200, 55, TRUE),
  ('ent_vip', 'vip', 'Royal VIP Sovereign Entrance', 'شاہی وی آئی پی آمد', 2, 1, FALSE, 'VIP III', 'lottie', '/assets/gifts/entrances/entrance_vip.json', '/assets/gifts/entrances/entrance_vip.png', '/assets/gifts/sfx/sfx_entrance_vip.wav', 4000, 100, TRUE),
  ('ent_special_event', 'special_event', 'Festival Gala Entrance', 'خصوصی ایونٹ آمد', 1, 1, TRUE, 'EVENT GALAXY', 'lottie', '/assets/gifts/entrances/entrance_special_event.json', '/assets/gifts/entrances/entrance_special_event.png', '/assets/gifts/sfx/sfx_entrance_special_event.wav', 4200, 110, TRUE)
ON CONFLICT (entrance_type) DO NOTHING;

-- Seed genuine VIP memberships for approved VIP demo hosts ONLY (never ordinary users)
INSERT INTO popolive.user_vip_memberships (
  membership_id, user_id, vip_level, vip_tier, badge_label, special_event_access, status, granted_by, expires_at
)
SELECT
  'VIP_HOST_SARA',
  u.id::text,
  3,
  'vip_gold',
  'VIP III',
  TRUE,
  'active',
  'system_seed',
  NOW() + INTERVAL '365 days'
FROM popolive.users u
WHERE u.id::text = '00000000-0000-0000-0000-000000088201'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO popolive.user_vip_memberships (
  membership_id, user_id, vip_level, vip_tier, badge_label, special_event_access, status, granted_by, expires_at
)
SELECT
  'VIP_HOST_ZARA',
  u.id::text,
  4,
  'vip_diamond',
  'VIP IV',
  TRUE,
  'active',
  'system_seed',
  NOW() + INTERVAL '365 days'
FROM popolive.users u
WHERE u.email = 'zaralive@example.com' OR u.poppo_id = '8802194'
ORDER BY u.created_at ASC
LIMIT 1
ON CONFLICT (user_id) DO NOTHING;

-- Host Ayesha is intentionally seeded with premium_host ONLY (vip_level=0) so ordinary/non-VIP hosts cannot claim VIP entrance
INSERT INTO popolive.user_vip_memberships (
  membership_id, user_id, vip_level, vip_tier, badge_label, special_event_access, status, granted_by, expires_at
)
SELECT
  'PREM_HOST_AYESHA',
  u.id::text,
  0,
  'premium_host',
  'STAR HOST',
  FALSE,
  'active',
  'system_seed',
  NOW() + INTERVAL '365 days'
FROM popolive.users u
WHERE u.id::text = '00000000-0000-0000-0000-000000088202'
ON CONFLICT (user_id) DO NOTHING;

-- Ensure Host Sara / Ayesha have host_level >= 5 if seeded, while ordinary user remains untouched
UPDATE popolive.users
SET host_level = GREATEST(COALESCE(host_level, 1), 12)
WHERE id::text IN ('00000000-0000-0000-0000-000000088201', '00000000-0000-0000-0000-000000088202')
   OR email = 'zaralive@example.com'
   OR poppo_id = '8802194';
