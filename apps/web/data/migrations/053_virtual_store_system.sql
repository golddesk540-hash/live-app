-- ============================================================================
-- Migration 053: Popo Live Phase 7 Module 7.9 - Complete Virtual Store System
-- Configurable Categories, Store Items, Atomic Purchases, User Inventory,
-- Slot-Exclusive Equipment, Duration & Server-Time Expiry, Audit Logs & SSE
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS popolive;

-- 1. Configurable Store Categories (Admin-managed, never hardcoded in clients)
CREATE TABLE IF NOT EXISTS popolive.store_categories (
  category_id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  name_ur VARCHAR(140) NOT NULL,
  short_label VARCHAR(48) NOT NULL,
  short_label_ur VARCHAR(64) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  description_ur TEXT NOT NULL DEFAULT '',
  icon_key VARCHAR(64) NOT NULL DEFAULT 'sparkles',
  default_equip_slot VARCHAR(40) NOT NULL DEFAULT 'none' CHECK (
    default_equip_slot IN (
      'profile_frame', 'name_decoration', 'chat_decoration',
      'entrance_effect', 'theme', 'special_badge', 'accessory', 'none'
    )
  ),
  display_order INTEGER NOT NULL DEFAULT 100,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_categories_active_order
  ON popolive.store_categories (is_active, is_approved, display_order ASC);

-- 2. Store Catalog Items (Authoritative prices, durations, slots, eligibility rules)
CREATE TABLE IF NOT EXISTS popolive.store_items (
  item_id VARCHAR(80) PRIMARY KEY,
  category_id VARCHAR(64) NOT NULL REFERENCES popolive.store_categories(category_id) ON UPDATE CASCADE,
  name VARCHAR(140) NOT NULL,
  name_ur VARCHAR(160) NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  description_ur TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL,
  preview_image_url TEXT NOT NULL,
  animation_asset_url TEXT,
  visual_style JSONB NOT NULL DEFAULT '{}'::jsonb,
  coin_price INTEGER NOT NULL CHECK (coin_price >= 0),
  duration_type VARCHAR(32) NOT NULL DEFAULT 'limited_duration' CHECK (
    duration_type IN ('permanent', 'limited_duration', 'event_based', 'membership_based')
  ),
  duration_value INTEGER,
  duration_unit VARCHAR(24) NOT NULL DEFAULT 'days' CHECK (
    duration_unit IN ('days', 'hours', 'seconds', 'permanent', 'event', 'vip')
  ),
  duration_label VARCHAR(64) NOT NULL DEFAULT '30 Days',
  duration_label_ur VARCHAR(64) NOT NULL DEFAULT '30 دن',
  event_end_at TIMESTAMPTZ,
  equip_slot VARCHAR(40) NOT NULL DEFAULT 'none' CHECK (
    equip_slot IN (
      'profile_frame', 'name_decoration', 'chat_decoration',
      'entrance_effect', 'theme', 'special_badge', 'accessory', 'none'
    )
  ),
  is_equippable BOOLEAN NOT NULL DEFAULT TRUE,
  usage_limit_per_user INTEGER CHECK (usage_limit_per_user IS NULL OR usage_limit_per_user >= 1),
  max_total_stock INTEGER CHECK (max_total_stock IS NULL OR max_total_stock >= 1),
  sold_count INTEGER NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
  vip_only BOOLEAN NOT NULL DEFAULT FALSE,
  required_vip_level INTEGER NOT NULL DEFAULT 0 CHECK (required_vip_level >= 0),
  min_wealth_level INTEGER NOT NULL DEFAULT 1 CHECK (min_wealth_level >= 1),
  min_shining_level INTEGER NOT NULL DEFAULT 1 CHECK (min_shining_level >= 1),
  min_honor_level INTEGER NOT NULL DEFAULT 1 CHECK (min_honor_level >= 1),
  eligibility_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  is_new_arrival BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 100,
  created_by VARCHAR(64) NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_items_browse
  ON popolive.store_items (is_active, is_approved, category_id, display_order ASC);

CREATE INDEX IF NOT EXISTS idx_store_items_flags
  ON popolive.store_items (is_featured, is_popular, is_new_arrival);

-- 3. Permanent Financial Store Purchase Records
CREATE TABLE IF NOT EXISTS popolive.store_purchases (
  purchase_id VARCHAR(80) PRIMARY KEY,
  idempotency_key VARCHAR(160) UNIQUE,
  user_id VARCHAR(64) NOT NULL,
  item_id VARCHAR(80) NOT NULL REFERENCES popolive.store_items(item_id),
  category_id VARCHAR(64) NOT NULL,
  item_name_snapshot VARCHAR(140) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  unit_coin_price INTEGER NOT NULL CHECK (unit_coin_price >= 0),
  total_coins INTEGER NOT NULL CHECK (total_coins >= 0),
  coin_tx_id VARCHAR(100),
  inventory_id VARCHAR(80),
  status VARCHAR(32) NOT NULL CHECK (status IN ('completed', 'failed', 'refunded', 'reversed')),
  failure_code VARCHAR(64),
  failure_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_purchases_user_created
  ON popolive.store_purchases (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_store_purchases_item_status
  ON popolive.store_purchases (item_id, status);

-- 4. User Store Inventory (Only created by verified purchases, approved VIP plan grants, or authorized admins)
CREATE TABLE IF NOT EXISTS popolive.user_store_inventory (
  inventory_id VARCHAR(80) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  item_id VARCHAR(80) NOT NULL REFERENCES popolive.store_items(item_id),
  category_id VARCHAR(64) NOT NULL,
  equip_slot VARCHAR(40) NOT NULL,
  purchase_id VARCHAR(80) REFERENCES popolive.store_purchases(purchase_id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'consumed')),
  is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
  granted_by VARCHAR(32) NOT NULL DEFAULT 'purchase' CHECK (granted_by IN ('purchase', 'vip_plan', 'admin_grant')),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_store_inv_user_status
  ON popolive.user_store_inventory (user_id, status, purchased_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_store_inv_expiry
  ON popolive.user_store_inventory (status, expires_at)
  WHERE expires_at IS NOT NULL;

-- 5. Active Equipment Slots (One equipped item per user per slot)
CREATE TABLE IF NOT EXISTS popolive.user_store_equipment (
  user_id VARCHAR(64) NOT NULL,
  equip_slot VARCHAR(40) NOT NULL CHECK (
    equip_slot IN (
      'profile_frame', 'name_decoration', 'chat_decoration',
      'entrance_effect', 'theme', 'special_badge', 'accessory'
    )
  ),
  inventory_id VARCHAR(80) NOT NULL REFERENCES popolive.user_store_inventory(inventory_id) ON DELETE CASCADE,
  item_id VARCHAR(80) NOT NULL REFERENCES popolive.store_items(item_id),
  equipped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, equip_slot)
);

CREATE INDEX IF NOT EXISTS idx_user_store_eq_user
  ON popolive.user_store_equipment (user_id);

-- 6. Real-Time Store Events (SSE stream feed)
CREATE TABLE IF NOT EXISTS popolive.store_realtime_events (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  event_name VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_realtime_user_id
  ON popolive.store_realtime_events (user_id, id DESC);

-- 7. Store Admin Audit Log
CREATE TABLE IF NOT EXISTS popolive.store_admin_audit_logs (
  audit_id VARCHAR(80) PRIMARY KEY,
  admin_id VARCHAR(64) NOT NULL,
  actor_role VARCHAR(40) NOT NULL,
  action_type VARCHAR(64) NOT NULL,
  target_id VARCHAR(120) NOT NULL,
  reason TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SEED DATA: 10 Approved Store Categories
-- ============================================================================
INSERT INTO popolive.store_categories (
  category_id, slug, name, name_ur, short_label, short_label_ur,
  description, description_ur, icon_key, default_equip_slot, display_order, is_approved, is_active
) VALUES
  ('entrance_effects', 'entrance-effects', 'Entrance Effects', 'انٹری ایفیکٹس', 'Effects', 'ایفیکٹس', 'Luxury room arrival vehicles and lightshows.', 'کمرے میں داخلے کے شاندار اینیمیشن ایفیکٹس۔', 'sparkles', 'entrance_effect', 1, TRUE, TRUE),
  ('profile_frames', 'profile-frames', 'Profile Frames', 'پروفائل فریمز', 'Frames', 'فریمز', 'Animated & luxury avatar borders visible on profiles and live rooms.', 'پروفائل اور لائیو رومز میں چمکدار اوتار فریم۔', 'circle-dot', 'profile_frame', 2, TRUE, TRUE),
  ('chat_decorations', 'chat-decorations', 'Chat Decorations', 'چیٹ ڈیکوریشنز', 'Bubbles', 'ببلز', 'Styled party room chat bubbles and highlight frames.', 'پارٹی چیٹ کے لیے رنگین ببلز اور ڈیکوریشنز۔', 'message-square', 'chat_decoration', 3, TRUE, TRUE),
  ('themes', 'themes', 'Themes', 'تھیمز', 'Themes', 'تھیمز', 'Custom profile and party stage dark-purple neon themes.', 'پروفائل اور اسٹیج کے لیے خصوصی تھیمز۔', 'palette', 'theme', 4, TRUE, TRUE),
  ('name_decorations', 'name-decorations', 'Name Decorations', 'نام کی سجاوٹ', 'Name Deco', 'نام سجاوٹ', 'Glowing gradient nickname badges and typography styles.', 'نام کے لیے خوبصورت چمکدار اسٹائلز۔', 'type', 'name_decoration', 5, TRUE, TRUE),
  ('special_badges', 'special-badges', 'Special Badges', 'خاص بیجز', 'Badges', 'بیجز', 'Collectible prestige emblems displayed next to your ID.', 'آئی ڈی کے ساتھ نمایاں ہونے والے خاص اعزازی بیجز۔', 'award', 'special_badge', 6, TRUE, TRUE),
  ('virtual_accessories', 'virtual-accessories', 'Virtual Accessories', 'ورچوئل لوازمات', 'Accessories', 'لوازمات', 'Virtual mics, halos, and live studio flair items.', 'لائیو اسٹیج اور پروفائل کے لیے ورچوئل لوازمات۔', 'mic', 'accessory', 7, TRUE, TRUE),
  ('exclusive_items', 'exclusive-items', 'Exclusive Items', 'خصوصی آئٹمز', 'Exclusive', 'خصوصی', 'Elite collectibles gated by VIP, Wealth, Shining, or Honor.', 'وی آئی پی یا اعلیٰ درجات کے لیے مخصوص نایاب آئٹمز۔', 'crown', 'none', 8, TRUE, TRUE),
  ('seasonal_items', 'seasonal-items', 'Seasonal Items', 'موسمی آئٹمز', 'Seasonal', 'موسمی', 'Limited-time festive and seasonal collectibles.', 'تہواروں اور موسموں کے خاص محدود وقت کے آئٹمز۔', 'moon-star', 'accessory', 9, TRUE, TRUE),
  ('special_event_items', 'special-event-items', 'Special Event Items', 'خصوصی ایونٹ آئٹمز', 'Events', 'ایونٹس', 'Tournament & PK Gala commemorative Store editions.', 'ٹورنامنٹ اور پی کے گالا کے یادگاری آئٹمز۔', 'trophy', 'special_badge', 10, TRUE, TRUE)
ON CONFLICT (category_id) DO NOTHING;

-- ============================================================================
-- SEED DATA: Approved Virtual Store Items across all 10 categories + gating rules
-- ============================================================================
INSERT INTO popolive.store_items (
  item_id, category_id, name, name_ur, description, description_ur,
  thumbnail_url, preview_image_url, animation_asset_url, visual_style,
  coin_price, duration_type, duration_value, duration_unit, duration_label, duration_label_ur,
  event_end_at, equip_slot, is_equippable, usage_limit_per_user, max_total_stock,
  vip_only, required_vip_level, min_wealth_level, min_shining_level, min_honor_level,
  eligibility_rules, is_featured, is_popular, is_new_arrival, is_approved, is_active, display_order
) VALUES
  (
    'item_enter_royal_supercar', 'entrance_effects',
    'Enter Effect', 'رائل سپر کار انٹری',
    'Cyber-neon sports car arrival sweep across live & party stages.',
    'لائیو اور پارٹی اسٹیج پر شاندار سپر کار انٹری اینیمیشن۔',
    '/assets/store/enter_royal_supercar.png', '/assets/store/enter_royal_supercar.png', '/assets/gifts/sports_car.webp',
    '{"gradient":"from-cyan-400 via-pink-500 to-purple-600","glow":"rgba(56,189,248,0.55)","bannerTag":"ROYAL ENTRY"}'::jsonb,
    500, 'limited_duration', 30, 'days', '30 Days', '30 دن',
    NULL, 'entrance_effect', TRUE, NULL, NULL,
    FALSE, 0, 1, 1, 1,
    '{"minAccountAgeDays":0}'::jsonb, TRUE, TRUE, FALSE, TRUE, TRUE, 1
  ),
  (
    'item_frame_golden_feather', 'profile_frames',
    'Profile Frame', 'گولڈن فیدر فریم',
    'Radiant phoenix feather gold ring surrounding your avatar.',
    'آپ کے اوتار کے گرد سنہری شہپر فریم۔',
    '/assets/store/frame_golden_feather.png', '/assets/store/frame_golden_feather.png', '/assets/store/frame_golden_feather.png',
    '{"ringClass":"bg-gradient-to-tr from-amber-300 via-pink-500 to-yellow-400 ring-2 ring-amber-300/70","borderColor":"#fbbf24","label":"Golden Feather"}'::jsonb,
    300, 'limited_duration', 30, 'days', '30 Days', '30 دن',
    NULL, 'profile_frame', TRUE, NULL, NULL,
    FALSE, 0, 1, 1, 1,
    '{}'::jsonb, TRUE, TRUE, FALSE, TRUE, TRUE, 2
  ),
  (
    'item_bubble_neon_spark', 'chat_decorations',
    'Chat Bubble', 'نیون چیٹ ببل',
    'Illuminated magenta-gold speech bubble for party room chats.',
    'پارٹی روم چیٹ کے لیے چمکدار نیون گلابی چیٹ ببل۔',
    '/assets/store/bubble_neon_spark.png', '/assets/store/bubble_neon_spark.png', '/assets/store/bubble_neon_spark.png',
    '{"bubbleClass":"bg-gradient-to-r from-[#ff2e74]/25 to-[#a855f7]/25 border-[#ff2e74]/60 text-pink-50","accentColor":"#ff2e74"}'::jsonb,
    100, 'limited_duration', 7, 'days', '7 Days', '7 دن',
    NULL, 'chat_decoration', TRUE, NULL, NULL,
    FALSE, 0, 1, 1, 1,
    '{}'::jsonb, TRUE, TRUE, FALSE, TRUE, TRUE, 3
  ),
  (
    'item_theme_starry_stage', 'themes',
    'Room Theme', 'اسٹاری اسٹیج تھیم',
    'Permanent celestial starlight crown theme for your profile & studio.',
    'پروفائل اور اسٹوڈیو کے لیے مستقل ستاروں بھری شاہی تھیم۔',
    '/assets/store/theme_starry_stage.png', '/assets/store/theme_starry_stage.png', '/assets/gifts/castle.webp',
    '{"themeClass":"from-[#1c0b3d] via-[#2b105c] to-[#12062a]","accentColor":"#c084fc","themeKey":"starry_stage"}'::jsonb,
    1000, 'permanent', NULL, 'permanent', 'Permanent', 'مستقل',
    NULL, 'theme', TRUE, 1, NULL,
    FALSE, 0, 1, 1, 1,
    '{}'::jsonb, TRUE, FALSE, TRUE, TRUE, TRUE, 4
  ),
  (
    'item_name_neon_crimson', 'name_decorations',
    'Neon Crimson Name', 'نیون کرمسن نام',
    'Multi-tone pink & gold gradient style on your nickname.',
    'آپ کے نام پر گلابی اور سنہری چمکدار رنگ کی سجاوٹ۔',
    '/assets/store/name_neon_crimson.png', '/assets/store/name_neon_crimson.png', NULL,
    '{"nameClass":"bg-gradient-to-r from-pink-300 via-amber-200 to-fuchsia-300 bg-clip-text text-transparent font-black"}'::jsonb,
    250, 'limited_duration', 14, 'days', '14 Days', '14 دن',
    NULL, 'name_decoration', TRUE, NULL, NULL,
    FALSE, 0, 1, 1, 1,
    '{}'::jsonb, FALSE, TRUE, TRUE, TRUE, TRUE, 5
  ),
  (
    'item_badge_founder_star', 'special_badges',
    'Popo Star Badge', 'پوپو اسٹار بیج',
    'Permanent hexagonal star emblem shown on your profile & chat header.',
    'پروفائل اور چیٹ پر مستقل چمکدار اسٹار بیج۔',
    '/assets/store/badge_founder_star.png', '/assets/store/badge_founder_star.png', NULL,
    '{"badgeLabel":"STAR","badgeClass":"bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white"}'::jsonb,
    400, 'permanent', NULL, 'permanent', 'Permanent', 'مستقل',
    NULL, 'special_badge', TRUE, 1, NULL,
    FALSE, 0, 1, 1, 1,
    '{}'::jsonb, FALSE, TRUE, FALSE, TRUE, TRUE, 6
  ),
  (
    'item_acc_diamond_mic', 'virtual_accessories',
    'Diamond Stage Mic', 'ڈائمنڈ اسٹیج مائیک',
    'Crystal blue studio microphone accessory for hosts & singers.',
    'ہوسٹس اور گلوکاروں کے لیے خوبصورت ڈائمنڈ مائیک لوازمات۔',
    '/assets/store/acc_diamond_mic.png', '/assets/store/acc_diamond_mic.png', NULL,
    '{"accessoryLabel":"Diamond Mic","accentColor":"#38bdf8"}'::jsonb,
    350, 'limited_duration', 30, 'days', '30 Days', '30 دن',
    NULL, 'accessory', TRUE, NULL, NULL,
    FALSE, 0, 1, 1, 1,
    '{}'::jsonb, FALSE, FALSE, TRUE, TRUE, TRUE, 7
  ),
  (
    'item_exclusive_vip_dragon', 'exclusive_items',
    'VIP Dragon Aura', 'وی آئی پی ڈریگن اورا',
    'VIP-only dragon arrival aura. Requires an active VIP membership.',
    'صرف وی آئی پی صارفین کے لیے مخصوص ڈریگن انٹری ایفیکٹ۔',
    '/assets/store/exclusive_vip_dragon.png', '/assets/store/exclusive_vip_dragon.png', '/assets/gifts/dragon_phoenix.webp',
    '{"gradient":"from-amber-400 via-rose-500 to-purple-700","bannerTag":"VIP DRAGON"}'::jsonb,
    1200, 'membership_based', 30, 'vip', 'Active VIP Term', 'وی آئی پی مدت تک',
    NULL, 'entrance_effect', TRUE, NULL, NULL,
    TRUE, 1, 1, 1, 1,
    '{"requiresVip":true,"minVipLevel":1}'::jsonb, TRUE, FALSE, TRUE, TRUE, TRUE, 8
  ),
  (
    'item_exclusive_wealth_sovereign', 'exclusive_items',
    'Wealth Sovereign Frame', 'دولت سوورین فریم',
    'Gold bullion avatar frame unlocked strictly at Wealth Level 3+.',
    'دولت لیول 3 یا اس سے اوپر کے صارفین کے لیے سنہری فریم۔',
    '/assets/store/exclusive_wealth_sovereign.png', '/assets/store/exclusive_wealth_sovereign.png', NULL,
    '{"ringClass":"bg-gradient-to-tr from-yellow-200 via-amber-500 to-yellow-600 ring-2 ring-yellow-300","label":"Wealth Sovereign"}'::jsonb,
    800, 'permanent', NULL, 'permanent', 'Permanent', 'مستقل',
    NULL, 'profile_frame', TRUE, 1, NULL,
    FALSE, 0, 3, 1, 1,
    '{"minWealthLevel":3}'::jsonb, FALSE, TRUE, FALSE, TRUE, TRUE, 9
  ),
  (
    'item_exclusive_shining_aurora', 'exclusive_items',
    'Shining Aurora Bubble', 'شائننگ ارورا چیٹ ببل',
    'Radiant host chat bubble unlocked strictly at Shining Level 2+.',
    'شائننگ لیول 2 یا اس سے اوپر کے لیے خصوصی چیٹ ببل۔',
    '/assets/store/exclusive_shining_aurora.png', '/assets/store/exclusive_shining_aurora.png', NULL,
    '{"bubbleClass":"bg-gradient-to-r from-pink-500/30 to-amber-500/20 border-pink-400 text-pink-50"}'::jsonb,
    650, 'permanent', NULL, 'permanent', 'Permanent', 'مستقل',
    NULL, 'chat_decoration', TRUE, 1, NULL,
    FALSE, 0, 1, 2, 1,
    '{"minShiningLevel":2}'::jsonb, FALSE, FALSE, TRUE, TRUE, TRUE, 10
  ),
  (
    'item_exclusive_honor_crest', 'exclusive_items',
    'Honor Champion Crest', 'اعزاز چیمپئن بیج',
    'Emerald crest emblem unlocked strictly at Honor Level 2+.',
    'اعزاز لیول 2 یا اس سے اوپر کے لیے خصوصی امتیازی بیج۔',
    '/assets/store/exclusive_honor_crest.png', '/assets/store/exclusive_honor_crest.png', NULL,
    '{"badgeLabel":"HONOR","badgeClass":"bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950"}'::jsonb,
    750, 'permanent', NULL, 'permanent', 'Permanent', 'مستقل',
    NULL, 'special_badge', TRUE, 1, NULL,
    FALSE, 0, 1, 1, 2,
    '{"minHonorLevel":2}'::jsonb, FALSE, FALSE, TRUE, TRUE, TRUE, 11
  ),
  (
    'item_seasonal_eid_lantern', 'seasonal_items',
    'Eid Crescent Lantern', 'عید چاند لالٹین',
    'Festive golden crescent lantern available for the current season.',
    'اس تہوار کے موسم کے لیے خوبصورت سنہری لالٹین۔',
    '/assets/store/seasonal_eid_lantern.png', '/assets/store/seasonal_eid_lantern.png', '/assets/gifts/festive_lantern.webp',
    '{"accessoryLabel":"Festive Lantern","accentColor":"#fbbf24"}'::jsonb,
    450, 'event_based', 60, 'event', 'Seasonal Event', 'موسمی ایونٹ',
    NOW() + INTERVAL '60 days', 'accessory', TRUE, 2, 5000,
    FALSE, 0, 1, 1, 1,
    '{"seasonal":true}'::jsonb, FALSE, TRUE, TRUE, TRUE, TRUE, 12
  ),
  (
    'item_event_pk_wing_crest', 'special_event_items',
    'PK Gala Wing Crest', 'پی کے گالا ونگ بیج',
    'Commemorative PK tournament wing emblem (Max 1 per user).',
    'پی کے گالا ایونٹ کا یادگاری بیج (فی صارف زیادہ سے زیادہ 1)۔',
    '/assets/store/event_pk_wing_crest.png', '/assets/store/event_pk_wing_crest.png', '/assets/gifts/event_fireworks.webp',
    '{"badgeLabel":"PK GALA","badgeClass":"bg-gradient-to-r from-cyan-400 to-pink-500 text-slate-950"}'::jsonb,
    600, 'event_based', 45, 'event', 'Event Edition', 'ایونٹ ایڈیشن',
    NOW() + INTERVAL '45 days', 'special_badge', TRUE, 1, 2000,
    FALSE, 0, 1, 1, 1,
    '{"eventEdition":true}'::jsonb, FALSE, TRUE, FALSE, TRUE, TRUE, 13
  )
ON CONFLICT (item_id) DO NOTHING;

-- One legitimate verified demo purchase & inventory row for Supporter 701 preview
INSERT INTO popolive.store_purchases (
  purchase_id, idempotency_key, user_id, item_id, category_id, item_name_snapshot,
  quantity, unit_coin_price, total_coins, coin_tx_id, inventory_id, status, metadata
) VALUES (
  'STR_PUR_DEMO_701_1', 'demo_seed_purchase_701_bubble', 'user_wallet_demo_701',
  'item_bubble_neon_spark', 'chat_decorations', 'Chat Bubble',
  1, 100, 100, 'TXN_DEMO_SEED_701_STR', 'STR_INV_DEMO_701_1', 'completed', '{"seededDemo":true}'::jsonb
) ON CONFLICT (purchase_id) DO NOTHING;

INSERT INTO popolive.user_store_inventory (
  inventory_id, user_id, item_id, category_id, equip_slot, purchase_id,
  quantity, status, is_equipped, granted_by, purchased_at, activated_at, expires_at
) VALUES (
  'STR_INV_DEMO_701_1', 'user_wallet_demo_701', 'item_bubble_neon_spark', 'chat_decorations',
  'chat_decoration', 'STR_PUR_DEMO_701_1', 1, 'active', TRUE, 'purchase',
  NOW(), NOW(), NOW() + INTERVAL '30 days'
) ON CONFLICT (inventory_id) DO NOTHING;

INSERT INTO popolive.user_store_equipment (
  user_id, equip_slot, inventory_id, item_id, equipped_at, expires_at
) VALUES (
  'user_wallet_demo_701', 'chat_decoration', 'STR_INV_DEMO_701_1', 'item_bubble_neon_spark',
  NOW(), NOW() + INTERVAL '30 days'
) ON CONFLICT (user_id, equip_slot) DO NOTHING;
