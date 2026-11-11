-- =============================================================================
-- Popo Live Phase 7 Module 7.7: Complete VIP Membership System
-- Supports configurable VIP plans, approved non-financial benefits, verified
-- purchase & renewal orders, lifetime membership records/history, receipts,
-- real-time SSE events, immutable audit logs, and integration with Module 7.4.
-- =============================================================================

-- 1. Expand user_vip_memberships tier constraint cleanly so Module 7.4 & 7.7 stay unified
ALTER TABLE popolive.user_vip_memberships
  DROP CONSTRAINT IF EXISTS user_vip_memberships_vip_tier_check;

ALTER TABLE popolive.user_vip_memberships
  ADD CONSTRAINT user_vip_memberships_vip_tier_check
  CHECK (vip_tier IN (
    'none',
    'premium_host',
    'vip_basic',
    'vip_silver',
    'vip_gold',
    'vip_diamond',
    'vip_premium',
    'special_event_vip'
  ));

-- 2. Configurable VIP Plans Catalog
CREATE TABLE IF NOT EXISTS popolive.vip_plans (
  plan_id VARCHAR(64) PRIMARY KEY,
  plan_tier VARCHAR(32) NOT NULL
    CHECK (plan_tier IN ('vip_basic', 'vip_silver', 'vip_gold', 'vip_diamond', 'vip_premium')),
  vip_level INTEGER NOT NULL CHECK (vip_level BETWEEN 1 AND 10),
  plan_name VARCHAR(120) NOT NULL,
  plan_name_ur VARCHAR(120) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  description_ur TEXT NOT NULL DEFAULT '',
  duration_days INTEGER NOT NULL CHECK (duration_days BETWEEN 1 AND 3650),
  price_amount NUMERIC(10, 2) NOT NULL CHECK (price_amount > 0),
  renewal_price_amount NUMERIC(10, 2) CHECK (renewal_price_amount IS NULL OR renewal_price_amount > 0),
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  allow_coin_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  coin_price INTEGER CHECK (coin_price IS NULL OR coin_price > 0),
  badge_label VARCHAR(40) NOT NULL,
  badge_asset_url TEXT NOT NULL DEFAULT '/assets/gifts/07_07_vip.png',
  profile_frame_asset_url TEXT NOT NULL DEFAULT '/assets/gifts/entrances/entrance_vip.png',
  name_decoration_style VARCHAR(64) NOT NULL DEFAULT 'gold_shimmer',
  theme_key VARCHAR(40) NOT NULL DEFAULT 'cosmic_royale',
  entrance_id VARCHAR(64) REFERENCES popolive.host_entrance_effects(entrance_id) ON DELETE SET NULL,
  entrance_animation_ref VARCHAR(120),
  benefit_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
  benefits_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  special_event_access BOOLEAN NOT NULL DEFAULT FALSE,
  platform_product_id_ios VARCHAR(120),
  platform_product_id_android VARCHAR(120),
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_by VARCHAR(100) NOT NULL DEFAULT 'system_seed',
  updated_by VARCHAR(100) NOT NULL DEFAULT 'system_seed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vip_plans_active_order
  ON popolive.vip_plans(is_active, display_order ASC, vip_level ASC);

-- 3. Configurable Approved VIP Benefits Catalog (strictly non-financial)
CREATE TABLE IF NOT EXISTS popolive.vip_benefit_catalog (
  benefit_key VARCHAR(64) PRIMARY KEY,
  category VARCHAR(48) NOT NULL,
  title VARCHAR(120) NOT NULL,
  title_ur VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  description_ur TEXT NOT NULL,
  asset_url TEXT,
  min_vip_level INTEGER NOT NULL DEFAULT 1 CHECK (min_vip_level >= 1),
  is_financial_reward BOOLEAN NOT NULL DEFAULT FALSE CHECK (is_financial_reward = FALSE),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. VIP Payment Orders (Purchase & Renewal Checkout Ledger)
CREATE TABLE IF NOT EXISTS popolive.vip_membership_orders (
  order_id VARCHAR(80) PRIMARY KEY,
  purchase_id VARCHAR(80) NOT NULL UNIQUE,
  idempotency_key VARCHAR(120) UNIQUE,
  user_id VARCHAR(100) NOT NULL,
  plan_id VARCHAR(64) NOT NULL REFERENCES popolive.vip_plans(plan_id),
  plan_name VARCHAR(120) NOT NULL,
  vip_level INTEGER NOT NULL,
  order_type VARCHAR(24) NOT NULL CHECK (order_type IN ('purchase', 'renewal')),
  renewal_target_membership_id VARCHAR(80),
  provider_key VARCHAR(40) NOT NULL,
  payment_reference VARCHAR(180),
  platform VARCHAR(16) NOT NULL DEFAULT 'web'
    CHECK (platform IN ('web', 'android', 'ios')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  coins_charged INTEGER CHECK (coins_charged IS NULL OR coins_charged > 0),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  auto_renew_consent BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(24) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'failed', 'cancelled', 'refunded', 'expired')),
  failure_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vip_orders_provider_ref_unique
  ON popolive.vip_membership_orders(provider_key, payment_reference)
  WHERE payment_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vip_orders_user_created
  ON popolive.vip_membership_orders(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vip_orders_status_created
  ON popolive.vip_membership_orders(status, created_at DESC);

-- 5. VIP Membership Records & Lifetime History (Pending/Active/Expired/Cancelled/Suspended/Refunded)
CREATE TABLE IF NOT EXISTS popolive.vip_membership_records (
  membership_id VARCHAR(80) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  plan_id VARCHAR(64) NOT NULL REFERENCES popolive.vip_plans(plan_id),
  plan_name VARCHAR(120) NOT NULL,
  plan_tier VARCHAR(32) NOT NULL,
  vip_level INTEGER NOT NULL CHECK (vip_level >= 1),
  purchase_id VARCHAR(80) UNIQUE,
  order_id VARCHAR(80) UNIQUE,
  payment_reference VARCHAR(180),
  payment_method VARCHAR(40) NOT NULL,
  purchase_amount NUMERIC(10, 2) NOT NULL CHECK (purchase_amount >= 0),
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  coins_charged INTEGER CHECK (coins_charged IS NULL OR coins_charged > 0),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  status VARCHAR(24) NOT NULL
    CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'suspended', 'refunded')),
  activation_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  renewal_reference VARCHAR(80),
  auto_renew_consent BOOLEAN NOT NULL DEFAULT FALSE,
  auto_renew_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  granted_benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  badge_label VARCHAR(40) NOT NULL,
  badge_asset_url TEXT,
  profile_frame_asset_url TEXT,
  name_decoration_style VARCHAR(64),
  theme_key VARCHAR(40),
  entrance_id VARCHAR(64),
  special_event_access BOOLEAN NOT NULL DEFAULT FALSE,
  status_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vip_records_user_status_expiry
  ON popolive.vip_membership_records(user_id, status, expiry_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vip_records_status_created
  ON popolive.vip_membership_records(status, created_at DESC);

-- 6. VIP Purchase & Renewal Receipts
CREATE TABLE IF NOT EXISTS popolive.vip_receipts (
  receipt_id VARCHAR(80) PRIMARY KEY,
  order_id VARCHAR(80) NOT NULL UNIQUE REFERENCES popolive.vip_membership_orders(order_id) ON DELETE CASCADE,
  membership_id VARCHAR(80) NOT NULL REFERENCES popolive.vip_membership_records(membership_id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  plan_id VARCHAR(64) NOT NULL,
  plan_name VARCHAR(120) NOT NULL,
  receipt_type VARCHAR(24) NOT NULL CHECK (receipt_type IN ('purchase', 'renewal')),
  provider_key VARCHAR(40) NOT NULL,
  provider_display_name VARCHAR(120) NOT NULL,
  payment_reference VARCHAR(180) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  coins_charged INTEGER,
  duration_days INTEGER NOT NULL,
  activation_date TIMESTAMPTZ NOT NULL,
  expiry_date TIMESTAMPTZ NOT NULL,
  receipt_status VARCHAR(24) NOT NULL DEFAULT 'issued'
    CHECK (receipt_status IN ('issued', 'refunded')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vip_receipts_user_issued
  ON popolive.vip_receipts(user_id, issued_at DESC);

-- 7. Webhook Replay Guard & Real-time SSE Events & Admin Audit Log
CREATE TABLE IF NOT EXISTS popolive.vip_webhook_events (
  event_id VARCHAR(140) NOT NULL,
  provider_key VARCHAR(40) NOT NULL,
  order_id VARCHAR(80),
  payload_digest VARCHAR(128) NOT NULL,
  processing_status VARCHAR(24) NOT NULL DEFAULT 'processed',
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider_key, event_id)
);

CREATE TABLE IF NOT EXISTS popolive.vip_realtime_events (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  event_name VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vip_realtime_user_id
  ON popolive.vip_realtime_events(user_id, id DESC);

CREATE TABLE IF NOT EXISTS popolive.vip_admin_audit_logs (
  audit_id VARCHAR(80) PRIMARY KEY,
  target_type VARCHAR(48) NOT NULL,
  target_id VARCHAR(120) NOT NULL,
  action_type VARCHAR(64) NOT NULL,
  actor_id VARCHAR(100) NOT NULL,
  actor_role VARCHAR(40) NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  before_data JSONB,
  after_data JSONB,
  ip_address VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Seed 10 Approved Non-Financial VIP Benefits
INSERT INTO popolive.vip_benefit_catalog (
  benefit_key, category, title, title_ur, description, description_ur,
  asset_url, min_vip_level, is_financial_reward, is_active, display_order
) VALUES
  ('vip_profile_badge', 'Special VIP Profile Badge', 'VIP Badge & Special Look', 'وی آئی پی بیج اور خاص پہچان', 'Displays an authenticated VIP crown badge on your profile card and live rooms.', 'پروفائل کارڈ اور لائیو رومز میں مستند وی آئی پی تاج بیج دکھاتا ہے۔', '/assets/gifts/07_07_vip.png', 1, FALSE, TRUE, 1),
  ('vip_gift_effects', 'VIP Gift Effects', 'More Effects & Gifts', 'مزید ایفیکٹس اور تحائف', 'Unlocks exclusive visual aura ripples when sending approved catalog gifts (zero financial change).', 'منظور شدہ تحائف بھیجتے وقت خصوصی بصری اثرات کھولتا ہے (مالی تقسیم میں کوئی تبدیلی نہیں)۔', '/assets/gifts/crown.png', 1, FALSE, TRUE, 2),
  ('special_vip_identity', 'Special VIP Identity', 'Higher Room Priority', 'لائیو روم میں اعلیٰ ترجیح', 'Displays VIP identity priority indicator inside audience and seat listings.', 'ناظرین اور سیٹ لسٹ میں وی آئی پی شناخت کی ترجیح دکھاتا ہے۔', '/assets/gifts/07_07_vip.png', 1, FALSE, TRUE, 3),
  ('vip_exclusive_features', 'Approved VIP-Only Features', 'Exclusive VIP Gifts', 'خصوصی وی آئی پی تحائف تک رسائی', 'Unlocks visual VIP celebration frames and approved VIP badge overlays.', 'خصوصی وی آئی پی جشن فریم اور منظور شدہ وی آئی پی بیج اوورلے کھولتا ہے۔', '/assets/gifts/castle.png', 1, FALSE, TRUE, 4),
  ('premium_profile_frame', 'Premium Profile Frame', 'Premium Profile Frame', 'پریمیم پروفائل فریم', 'Wraps your avatar with an animated metallic cosmic-gold VIP ring.', 'آپ کی تصویر کے گرد متحرک گولڈ وی آئی پی فریم لگاتا ہے۔', '/assets/gifts/entrances/entrance_vip.png', 2, FALSE, TRUE, 5),
  ('vip_name_decoration', 'VIP Name Decoration', 'VIP Name Decoration', 'وی آئی پی نام کی آرائش', 'Adds luminescent gradient styling and crest flair to your nickname.', 'آپ کے نام پر روشن گولڈ/گلابی آرائش شامل کرتا ہے۔', '/assets/gifts/07_07_vip.png', 2, FALSE, TRUE, 6),
  ('special_chat_badge', 'Special Chat Badge', 'Special Chat Badge', 'خصوصی چیٹ بیج', 'Attaches a verified VIP crown tag beside your messages in room chat.', 'روم چیٹ میں آپ کے پیغامات کے ساتھ مستند وی آئی پی ٹیگ لگاتا ہے۔', '/assets/gifts/crown.png', 1, FALSE, TRUE, 7),
  ('special_entrance_animation', 'Special Entrance Animation', 'Special Entrance Animation', 'خصوصی وی آئی پی آمد اینیمیشن', 'Activates Module 7.4 Sovereign VIP room entrance animation while active.', 'فعال ہونے پر ماڈیول 7.4 کا شاہی وی آئی پی آمد اینیمیشن چلاتا ہے۔', '/assets/gifts/entrances/entrance_vip.json', 2, FALSE, TRUE, 8),
  ('profile_highlighting', 'Profile Highlighting', 'Profile Highlighting', 'پروفائل نمایاں ہائی لائٹ', 'Adds subtle luminous halo glow around your public profile card.', 'آپ کے پبلک پروفائل کارڈ کے گرد دلکش روشنی کا ہالہ شامل کرتا ہے۔', '/assets/gifts/diamond.png', 3, FALSE, TRUE, 9),
  ('exclusive_visual_themes', 'Exclusive Visual Themes', 'Exclusive Visual Themes', 'خصوصی بصری تھیمز', 'Applies Imperial Gold or Diamond Aurora VIP visual backdrop accents.', 'امپیریل گولڈ یا ڈائمنڈ ارورا وی آئی پی تھیم رنگ لاگو کرتا ہے۔', '/assets/gifts/07_07_vip.png', 4, FALSE, TRUE, 10)
ON CONFLICT (benefit_key) DO NOTHING;

-- 9. Seed 5 Configurable Backend VIP Plans (Basic -> Silver -> Gold -> Diamond -> Premium)
INSERT INTO popolive.vip_plans (
  plan_id, plan_tier, vip_level, plan_name, plan_name_ur, description, description_ur,
  duration_days, price_amount, renewal_price_amount, currency, allow_coin_purchase, coin_price,
  badge_label, badge_asset_url, profile_frame_asset_url, name_decoration_style, theme_key,
  entrance_id, entrance_animation_ref, benefit_keys, benefits_config,
  special_event_access, platform_product_id_ios, platform_product_id_android, is_popular, is_active, display_order
) VALUES
  (
    'vip_basic', 'vip_basic', 1, 'VIP Basic', 'وی آئی پی بیسک',
    'Essential VIP badge, room chat emblem, and priority look for 30 days.',
    '30 دن کے لیے بنیادی وی آئی پی بیج، چیٹ نشان اور خصوصی پہچان۔',
    30, 4.99, 4.99, 'USD', FALSE, NULL,
    'VIP I', '/assets/gifts/07_07_vip.png', '/assets/gifts/entrances/entrance_standard.png',
    'amber_glow', 'cosmic_basic', 'ent_premium', '/assets/gifts/entrances/entrance_premium.json',
    '["vip_profile_badge","special_chat_badge","special_vip_identity","vip_gift_effects"]'::jsonb,
    '{"frameColor":"#F59E0B","auraStyle":"amber","roomPriorityWeight":10}'::jsonb,
    FALSE, 'com.popolive.vip.basic.30d', 'vip_basic_30d', FALSE, TRUE, 1
  ),
  (
    'vip_silver', 'vip_silver', 2, 'VIP Silver', 'وی آئی پی سلور',
    'Unlocks Premium Profile Frame, Name Decoration, and Royal VIP Room Entrance.',
    'پریمیم پروفائل فریم، نام کی آرائش اور شاہی وی آئی پی آمد اینیمیشن۔',
    30, 9.99, 9.49, 'USD', FALSE, NULL,
    'VIP II', '/assets/gifts/07_07_vip.png', '/assets/gifts/entrances/entrance_premium.png',
    'silver_prism', 'cosmic_silver', 'ent_vip', '/assets/gifts/entrances/entrance_vip.json',
    '["vip_profile_badge","premium_profile_frame","special_entrance_animation","vip_name_decoration","special_chat_badge","vip_gift_effects","special_vip_identity"]'::jsonb,
    '{"frameColor":"#E2E8F0","auraStyle":"silver","roomPriorityWeight":25}'::jsonb,
    FALSE, 'com.popolive.vip.silver.30d', 'vip_silver_30d', FALSE, TRUE, 2
  ),
  (
    'vip_gold', 'vip_gold', 3, 'VIP Gold', 'وی آئی پی گولڈ',
    'Most popular tier: Royal Gold Crown, Profile Highlighting, Royal Entrance, and VIP Gift Effects.',
    'سب سے مقبول: شاہی گولڈ تاج، پروفائل ہائی لائٹ، شاہی آمد اور وی آئی پی تحفہ اثرات۔',
    30, 19.99, 17.99, 'USD', FALSE, NULL,
    'VIP III', '/assets/gifts/07_07_vip.png', '/assets/gifts/entrances/entrance_vip.png',
    'gold_shimmer', 'cosmic_gold', 'ent_vip', '/assets/gifts/entrances/entrance_vip.json',
    '["vip_profile_badge","premium_profile_frame","special_entrance_animation","vip_name_decoration","special_chat_badge","vip_gift_effects","profile_highlighting","special_vip_identity","vip_exclusive_features"]'::jsonb,
    '{"frameColor":"#FBBF24","auraStyle":"imperial_gold","roomPriorityWeight":50}'::jsonb,
    FALSE, 'com.popolive.vip.gold.30d', 'vip_gold_30d', TRUE, TRUE, 3
  ),
  (
    'vip_diamond', 'vip_diamond', 4, 'VIP Diamond', 'وی آئی پی ڈائمنڈ',
    'Diamond Aurora visual theme, iridescent profile halo, and elite Sovereign VIP entrance.',
    'ڈائمنڈ ارورا تھیم، چمکدار پروفائل ہالہ اور شاہی وی آئی پی آمد اینیمیشن۔',
    30, 49.99, 44.99, 'USD', FALSE, NULL,
    'VIP IV', '/assets/gifts/07_07_vip.png', '/assets/gifts/entrances/entrance_vip.png',
    'diamond_aurora', 'diamond_aurora', 'ent_vip', '/assets/gifts/entrances/entrance_vip.json',
    '["vip_profile_badge","premium_profile_frame","special_entrance_animation","vip_name_decoration","special_chat_badge","vip_gift_effects","profile_highlighting","exclusive_visual_themes","special_vip_identity","vip_exclusive_features"]'::jsonb,
    '{"frameColor":"#38BDF8","auraStyle":"diamond_prism","roomPriorityWeight":80}'::jsonb,
    FALSE, 'com.popolive.vip.diamond.30d', 'vip_diamond_30d', FALSE, TRUE, 4
  ),
  (
    'vip_premium', 'vip_premium', 5, 'VIP Premium', 'وی آئی پی پریمیم',
    '90-day Sovereign All-Access VIP identity with Festival Gala Entrance & full suite of approved privileges.',
    '90 دن کی مکمل شاہی وی آئی پی رکنیت مع فیسٹیول گالا آمد اور تمام منظور شدہ مراعات۔',
    90, 129.99, 114.99, 'USD', FALSE, NULL,
    'VIP V', '/assets/gifts/07_07_vip.png', '/assets/gifts/entrances/entrance_special_event.png',
    'sovereign_royal', 'sovereign_royale', 'ent_special_event', '/assets/gifts/entrances/entrance_special_event.json',
    '["vip_profile_badge","premium_profile_frame","special_entrance_animation","vip_name_decoration","special_chat_badge","vip_gift_effects","profile_highlighting","exclusive_visual_themes","special_vip_identity","vip_exclusive_features"]'::jsonb,
    '{"frameColor":"#EC4899","auraStyle":"sovereign_crimson_gold","roomPriorityWeight":100}'::jsonb,
    TRUE, 'com.popolive.vip.premium.90d', 'vip_premium_90d', FALSE, TRUE, 5
  )
ON CONFLICT (plan_id) DO NOTHING;

-- 10. Sync seeded VIP hosts (Sara & Zara from Migration 048) cleanly into vip_membership_records
--     while strictly excluding Host Ayesha (vip_level = 0) & ordinary users.
INSERT INTO popolive.vip_membership_records (
  membership_id, user_id, plan_id, plan_name, plan_tier, vip_level,
  purchase_id, order_id, payment_reference, payment_method,
  purchase_amount, currency, duration_days, status,
  activation_date, expiry_date, granted_benefits,
  badge_label, badge_asset_url, profile_frame_asset_url,
  name_decoration_style, theme_key, entrance_id, special_event_access, status_reason
)
SELECT
  vm.membership_id,
  vm.user_id,
  p.plan_id,
  p.plan_name,
  p.plan_tier,
  vm.vip_level,
  NULL,
  NULL,
  'SEED_048_' || vm.membership_id,
  'system_seed',
  p.price_amount,
  p.currency,
  365,
  CASE WHEN vm.status = 'active' AND vm.expires_at > NOW() THEN 'active' ELSE 'expired' END,
  vm.created_at,
  vm.expires_at,
  p.benefit_keys,
  COALESCE(vm.badge_label, p.badge_label),
  p.badge_asset_url,
  p.profile_frame_asset_url,
  p.name_decoration_style,
  p.theme_key,
  p.entrance_id,
  vm.special_event_access,
  'Synced from Module 7.4 official seeded host VIP entitlement'
FROM popolive.user_vip_memberships vm
JOIN popolive.vip_plans p ON p.plan_id = CASE
  WHEN vm.vip_level >= 5 THEN 'vip_premium'
  WHEN vm.vip_level = 4 THEN 'vip_diamond'
  WHEN vm.vip_level = 3 THEN 'vip_gold'
  WHEN vm.vip_level = 2 THEN 'vip_silver'
  ELSE 'vip_basic'
END
WHERE vm.vip_level >= 1
  AND vm.vip_tier IN ('vip_gold', 'vip_diamond', 'vip_basic', 'vip_silver', 'vip_premium', 'special_event_vip')
ON CONFLICT (membership_id) DO NOTHING;
