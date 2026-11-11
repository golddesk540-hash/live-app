-- =============================================================================
-- Popo Live Phase 7 Module 7.8: Wealth, Shining and Honor System
-- Three strictly separate configurable user recognition systems:
--   1. Wealth  (verified coin spending & paid financial activity)
--   2. Shining (verified successful gift sending activity)
--   3. Honor   (approved platform recognition & achievement rules)
-- Never combines scores or levels across systems; never mixes with VIP.
-- =============================================================================

-- 1. Global Backend Configuration Rules for Recognition Systems
CREATE TABLE IF NOT EXISTS popolive.recognition_system_rules (
  rule_key VARCHAR(64) PRIMARY KEY,
  rule_value TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  updated_by VARCHAR(100) NOT NULL DEFAULT 'system_seed',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO popolive.recognition_system_rules (rule_key, rule_value, description) VALUES
  ('allow_promo_coins_for_wealth', 'false', 'If false (default), free promotional coins do not increase Wealth progress.'),
  ('wealth_score_per_coin', '1', 'Wealth progress points awarded per eligible paid coin spent.'),
  ('shining_score_per_coin', '1', 'Shining progress points awarded per coin value of verified successful gifts.'),
  ('auto_adjust_on_reversal', 'true', 'Recalculate Wealth/Shining score when verified gift or top-up transactions are reversed/refunded.'),
  ('fraud_daily_spike_threshold', '250000', 'Single-user 24h score velocity threshold flagged for admin suspicious activity review.'),
  ('leaderboard_default_limit', '20', 'Default page size for separate Wealth, Shining and Honor leaderboards.')
ON CONFLICT (rule_key) DO NOTHING;

-- 2. Approved Non-Financial Benefits Catalog (Shared Definitions, Assigned Per Level)
CREATE TABLE IF NOT EXISTS popolive.recognition_benefits (
  benefit_key VARCHAR(64) PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  title_ur VARCHAR(120) NOT NULL,
  category VARCHAR(48) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  description_ur TEXT NOT NULL DEFAULT '',
  asset_url TEXT,
  is_financial_reward BOOLEAN NOT NULL DEFAULT FALSE CHECK (is_financial_reward = FALSE),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO popolive.recognition_benefits (
  benefit_key, title, title_ur, category, description, description_ur, asset_url, is_financial_reward, is_active, display_order
) VALUES
  ('rec_special_profile_badge', 'Special Recognition Profile Badge', 'خصوصی پروفائل شناخت بیج', 'Special profile badge', 'Displays your verified Wealth, Shining or Honor emblem on user profiles and cards.', 'صارف کی پروفائل اور کارڈز پر تصدیق شدہ دولت، شائننگ یا اعزاز بیج دکھاتا ہے۔', '/assets/gifts/07_08_wealth_shining_and_honor.png', FALSE, TRUE, 1),
  ('rec_profile_frame', 'Winged Level Profile Frame', 'پنکھوں والا لیول پروفائل فریم', 'Profile frame', 'Unlocks winged metallic avatar borders corresponding to your earned recognition tier.', 'آپ کے حاصل کردہ درجہ کے مطابق چمکدار پنکھوں والا پروفائل فریم کھولتا ہے۔', '/assets/gifts/07_08_wealth_shining_and_honor.png', FALSE, TRUE, 2),
  ('rec_name_decoration', 'Shining Name Decoration', 'چمکدار نام کی آرائش', 'Name decoration', 'Applies radiant typography highlights to your nickname on profiles and leaderboards.', 'پروفائل اور لیڈر بورڈز پر آپ کے نام پر چمکدار رنگوں کی آرائش لگاتا ہے۔', '/assets/gifts/crown.png', FALSE, TRUE, 3),
  ('rec_entrance_effect', 'Special Recognition Entrance Effect', 'خصوصی لیول آمد ایفیکٹ', 'Special entrance effect', 'Triggers an approved tier aura banner when joining supported live rooms.', 'منظور شدہ لائیو رومز میں شامل ہونے پر خصوصی لیول آمد ایفیکٹ دکھاتا ہے۔', '/assets/gifts/entrances/entrance_premium.png', FALSE, TRUE, 4),
  ('rec_recognition_animation', 'Level-Up Recognition Animation', 'لیول اپ جشن اینیمیشن', 'Special recognition animation', 'Displays celebratory winged animation when promoted by the backend.', 'بیک اینڈ سے ترقی کی تصدیق پر خصوصی لیول اپ اینیمیشن دکھاتا ہے۔', '/assets/gifts/crown.png', FALSE, TRUE, 5),
  ('rec_exclusive_appearance', 'Exclusive Profile Appearance', 'خصوصی پروفائل انداز', 'Exclusive profile appearance', 'Highlights profile achievement cards with royal cosmic gradients.', 'پروفائل کارڈز کو شاہی کائناتی رنگوں اور چمک سے مزین کرتا ہے۔', '/assets/gifts/diamond_ring.png', FALSE, TRUE, 6),
  ('rec_chat_decoration', 'Approved Chat Decoration Badge', 'منظور شدہ چیٹ آرائش بیج', 'Approved chat decorations', 'Attaches a compact recognition tag beside your messages in room chat.', 'روم چیٹ میں آپ کے پیغامات کے ساتھ مختصر شناختی بیج لگاتا ہے۔', '/assets/gifts/crown.png', FALSE, TRUE, 7),
  ('rec_visual_effects', 'Approved Visual Aura Effects', 'منظور شدہ بصری چمک اثرات', 'Approved visual effects', 'Adds subtle particle shimmer around recognition badges without affecting gift prices or host shares.', 'تحائف کی قیمتوں یا ہوسٹ شیئر کو بدلے بغیر شناختی بیجز کے گرد چمک شامل کرتا ہے۔', '/assets/gifts/dragon_phoenix.png', FALSE, TRUE, 8)
ON CONFLICT (benefit_key) DO NOTHING;

-- 3. Backend-Configurable Level Tiers (Strictly Separate Across Wealth / Shining / Honor)
CREATE TABLE IF NOT EXISTS popolive.recognition_levels (
  level_id VARCHAR(64) PRIMARY KEY,
  category VARCHAR(24) NOT NULL CHECK (category IN ('wealth', 'shining', 'honor')),
  level_number INTEGER NOT NULL CHECK (level_number >= 1 AND level_number <= 200),
  level_name VARCHAR(120) NOT NULL,
  level_name_ur VARCHAR(120) NOT NULL,
  required_threshold BIGINT NOT NULL CHECK (required_threshold >= 0),
  badge_image_url TEXT NOT NULL DEFAULT '/assets/gifts/07_08_wealth_shining_and_honor.png',
  icon_key VARCHAR(48) NOT NULL DEFAULT 'wings_gold',
  wing_style VARCHAR(48) NOT NULL DEFAULT 'cosmic_bronze',
  border_color VARCHAR(32) NOT NULL DEFAULT '#EC248F',
  description TEXT NOT NULL DEFAULT '',
  description_ur TEXT NOT NULL DEFAULT '',
  benefit_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by VARCHAR(100) NOT NULL DEFAULT 'system_seed',
  updated_by VARCHAR(100) NOT NULL DEFAULT 'system_seed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category, level_number)
);

CREATE INDEX IF NOT EXISTS idx_recognition_levels_cat_active_thresh
  ON popolive.recognition_levels(category, is_active, required_threshold ASC, level_number ASC);

-- 4. User Current Level Assignments & Progress (One Row per User x Category)
CREATE TABLE IF NOT EXISTS popolive.user_recognition_progress (
  user_id VARCHAR(100) NOT NULL,
  category VARCHAR(24) NOT NULL CHECK (category IN ('wealth', 'shining', 'honor')),
  current_score BIGINT NOT NULL DEFAULT 0 CHECK (current_score >= 0),
  current_level_id VARCHAR(64) NOT NULL REFERENCES popolive.recognition_levels(level_id),
  current_level_number INTEGER NOT NULL DEFAULT 1,
  highest_level_number INTEGER NOT NULL DEFAULT 1,
  next_level_id VARCHAR(64) REFERENCES popolive.recognition_levels(level_id) ON DELETE SET NULL,
  next_threshold BIGINT,
  progress_percent NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, category)
);

CREATE INDEX IF NOT EXISTS idx_user_recognition_cat_score
  ON popolive.user_recognition_progress(category, current_score DESC, current_level_number DESC, updated_at ASC);

-- 5. Paid vs Promotional Coin Pool Tracker (Ensures Promo Coins Never Count Unless Approved)
CREATE TABLE IF NOT EXISTS popolive.user_recognition_coin_pools (
  user_id VARCHAR(100) PRIMARY KEY,
  paid_coins BIGINT NOT NULL DEFAULT 0 CHECK (paid_coins >= 0),
  promo_coins BIGINT NOT NULL DEFAULT 0 CHECK (promo_coins >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Immutable Score & Activity Ledger (Duplicate-Proof via Unique Source Keys)
CREATE TABLE IF NOT EXISTS popolive.user_recognition_ledger (
  ledger_id VARCHAR(80) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  category VARCHAR(24) NOT NULL CHECK (category IN ('wealth', 'shining', 'honor')),
  event_type VARCHAR(48) NOT NULL,
  score_delta BIGINT NOT NULL,
  balance_after BIGINT NOT NULL CHECK (balance_after >= 0),
  source_type VARCHAR(48) NOT NULL,
  source_tx_id VARCHAR(120),
  idempotency_key VARCHAR(140) UNIQUE,
  is_promotional BOOLEAN NOT NULL DEFAULT FALSE,
  is_reversed BOOLEAN NOT NULL DEFAULT FALSE,
  reversed_by_ledger_id VARCHAR(80),
  status VARCHAR(24) NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'reversed', 'ignored')),
  reason TEXT NOT NULL DEFAULT '',
  created_by VARCHAR(100) NOT NULL DEFAULT 'system',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recognition_ledger_cat_source_tx
  ON popolive.user_recognition_ledger(category, source_tx_id)
  WHERE source_tx_id IS NOT NULL AND score_delta > 0;

CREATE INDEX IF NOT EXISTS idx_recognition_ledger_user_cat_created
  ON popolive.user_recognition_ledger(user_id, category, created_at DESC);

-- 7. Level Transition History (Preserves Previous Levels Across Upgrades & Reversals)
CREATE TABLE IF NOT EXISTS popolive.user_recognition_history (
  history_id VARCHAR(80) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  category VARCHAR(24) NOT NULL CHECK (category IN ('wealth', 'shining', 'honor')),
  previous_level_id VARCHAR(64) REFERENCES popolive.recognition_levels(level_id),
  previous_level_number INTEGER NOT NULL DEFAULT 1,
  new_level_id VARCHAR(64) NOT NULL REFERENCES popolive.recognition_levels(level_id),
  new_level_number INTEGER NOT NULL DEFAULT 1,
  score_at_change BIGINT NOT NULL DEFAULT 0,
  change_reason VARCHAR(120) NOT NULL DEFAULT 'verified_activity',
  source_ledger_id VARCHAR(80),
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recognition_history_user_cat_created
  ON popolive.user_recognition_history(user_id, category, created_at DESC);

-- 8. Deduplicated Level-Up Celebration Events (No Duplicate Level-Up Notifications)
CREATE TABLE IF NOT EXISTS popolive.recognition_level_up_events (
  event_id VARCHAR(80) PRIMARY KEY,
  dedup_key VARCHAR(160) NOT NULL UNIQUE,
  user_id VARCHAR(100) NOT NULL,
  category VARCHAR(24) NOT NULL CHECK (category IN ('wealth', 'shining', 'honor')),
  new_level_id VARCHAR(64) NOT NULL REFERENCES popolive.recognition_levels(level_id),
  new_level_number INTEGER NOT NULL,
  new_level_name VARCHAR(120) NOT NULL,
  badge_image_url TEXT NOT NULL,
  unlocked_benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recognition_level_ups_user_unack
  ON popolive.recognition_level_up_events(user_id, is_acknowledged, created_at DESC);

-- 9. Configurable Honor Recognition Factors & Admin Review Workflow
CREATE TABLE IF NOT EXISTS popolive.honor_recognition_factors (
  factor_key VARCHAR(64) PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  title_ur VARCHAR(120) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  default_points INTEGER NOT NULL CHECK (default_points > 0),
  requires_admin_review BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO popolive.honor_recognition_factors (
  factor_key, title, title_ur, description, default_points, requires_admin_review, is_active, display_order
) VALUES
  ('account_achievements', 'Approved Account Achievements', 'منظور شدہ اکاؤنٹ کامیابیاں', 'Verified milestone completion on Popo Live.', 150, TRUE, TRUE, 1),
  ('verified_platform_activity', 'Verified Platform Activity', 'تصدیق شدہ پلیٹ فارم سرگرمی', 'Consistent verified streaming or room hosting activity.', 200, TRUE, TRUE, 2),
  ('recognition_awards', 'Approved Recognition Awards', 'منظور شدہ اعزازی انعامات', 'Official event or tournament recognition bestowed by staff.', 400, TRUE, TRUE, 3),
  ('community_contributions', 'Eligible Community Contributions', 'اہل کمیونٹی خدمات', 'Verified room moderation and helpful community guidance.', 250, TRUE, TRUE, 4),
  ('official_platform_recognition', 'Official Platform Recognition', 'سرکاری پلیٹ فارم اعزاز', 'Direct official Popo Live ambassador or partner recognition.', 600, TRUE, TRUE, 5)
ON CONFLICT (factor_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS popolive.honor_recognition_requests (
  request_id VARCHAR(80) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  factor_key VARCHAR(64) NOT NULL REFERENCES popolive.honor_recognition_factors(factor_key),
  points_requested INTEGER NOT NULL CHECK (points_requested > 0),
  evidence_summary TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_by VARCHAR(100) NOT NULL,
  reviewed_by VARCHAR(100),
  review_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  ledger_id VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_honor_requests_status_created
  ON popolive.honor_recognition_requests(status, created_at DESC);

-- 10. User Recognition Preferences & Privacy Controls
CREATE TABLE IF NOT EXISTS popolive.user_recognition_preferences (
  user_id VARCHAR(100) PRIMARY KEY,
  animations_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  hide_wealth_leaderboard BOOLEAN NOT NULL DEFAULT FALSE,
  hide_shining_leaderboard BOOLEAN NOT NULL DEFAULT FALSE,
  hide_honor_leaderboard BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Real-Time SSE Events & Immutable Admin Audit Logs
CREATE TABLE IF NOT EXISTS popolive.recognition_realtime_events (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  event_name VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recognition_realtime_user_id
  ON popolive.recognition_realtime_events(user_id, id DESC);

CREATE TABLE IF NOT EXISTS popolive.recognition_admin_audit_logs (
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

-- 12. Seed Distinct Backend-Configurable Tiers for Wealth, Shining & Honor
-- Wealth Tiers (thresholds verified paid coin spending)
INSERT INTO popolive.recognition_levels (
  level_id, category, level_number, level_name, level_name_ur, required_threshold,
  badge_image_url, icon_key, wing_style, border_color, description, description_ur,
  benefit_keys, display_order, is_active
) VALUES
  ('wealth_lv_1', 'wealth', 1, 'Wealth Novice', 'دولت مبتدی', 0, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'coin_spark', 'cosmic_bronze', '#A855F7', 'Starting tier for verified Popo Live supporters.', 'پوپو لائیو کے تصدیق شدہ صارفین کا ابتدائی درجہ۔', '["rec_special_profile_badge"]'::jsonb, 1, TRUE),
  ('wealth_lv_2', 'wealth', 2, 'Silver Patron', 'سلور سرپرست', 300, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'shield_silver', 'silver_prism', '#94A3B8', 'Earned after 300 verified paid coins spent.', '300 تصدیق شدہ کوائنز خرچ کرنے پر حاصل ہوتا ہے۔', '["rec_special_profile_badge","rec_chat_decoration"]'::jsonb, 2, TRUE),
  ('wealth_lv_5', 'wealth', 5, 'Neon Baron', 'نیون بیرن', 1200, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'diamond_pink', 'neon_magenta', '#EC248F', 'Vibrant magenta crest and shining profile decoration.', 'نیون گلابی تاج اور چمکدار پروفائل آرائش۔', '["rec_special_profile_badge","rec_chat_decoration","rec_name_decoration"]'::jsonb, 3, TRUE),
  ('wealth_lv_15', 'wealth', 15, 'Royal Magnate', 'شاہی رئیس', 5000, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'crown_emerald', 'emerald_wings', '#10B981', 'Unlocks winged avatar borders and recognition animations.', 'پنکھوں والا اوتار بارڈر اور لیول اپ جشن اینیمیشن۔', '["rec_special_profile_badge","rec_chat_decoration","rec_name_decoration","rec_profile_frame","rec_recognition_animation"]'::jsonb, 4, TRUE),
  ('wealth_lv_60', 'wealth', 60, 'Crimson Sovereign', 'کرِمسن سلطان', 25000, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'wings_rose', 'rose_bronze_wings', '#FB7185', 'Rose-bronze winged frame tier featured on elite profiles.', 'ایلیٹ پروفائلز پر روز برونز پنکھوں والا فریم۔', '["rec_special_profile_badge","rec_chat_decoration","rec_name_decoration","rec_profile_frame","rec_recognition_animation","rec_entrance_effect"]'::jsonb, 5, TRUE),
  ('wealth_lv_70', 'wealth', 70, 'Celestial Duke', 'آسمانی نواب', 75000, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'wings_sapphire', 'sapphire_violet_wings', '#60A5FA', 'Sapphire-violet celestial winged crest with exclusive profile glow.', 'نیلم اور بنفشی آسمانی پنکھوں کا تاج اور خاص چمک۔', '["rec_special_profile_badge","rec_chat_decoration","rec_name_decoration","rec_profile_frame","rec_recognition_animation","rec_entrance_effect","rec_exclusive_appearance"]'::jsonb, 6, TRUE),
  ('wealth_lv_80', 'wealth', 80, 'Imperial Monarch', 'شہنشاہ دولت', 200000, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'wings_gold_crown', 'imperial_gold_wings', '#FBBF24', 'Pinnacle crowned Golden Wings frame & complete non-financial Wealth visual suite.', 'سنہری تاج والے پنکھوں کا اعلیٰ ترین درجہ اور مکمل بصری مراعات۔', '["rec_special_profile_badge","rec_chat_decoration","rec_name_decoration","rec_profile_frame","rec_recognition_animation","rec_entrance_effect","rec_exclusive_appearance","rec_visual_effects"]'::jsonb, 7, TRUE),

-- Shining Tiers (thresholds verified successful gift sending)
  ('shining_lv_1', 'shining', 1, 'Shining Spark', 'چمکدار چنگاری', 0, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'star_spark', 'cosmic_pink', '#F472B6', 'Begins with your first steps into Popo Live gifting.', 'پوپو لائیو گفٹنگ کے آغاز کا پہلا درجہ۔', '["rec_special_profile_badge"]'::jsonb, 1, TRUE),
  ('shining_lv_2', 'shining', 2, 'Aurora Gifter', 'ارورا گفٹر', 200, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'star_aurora', 'pink_prism', '#EC248F', 'Unlocked after 200 coins of verified gift sending.', '200 کوائنز کے تصدیق شدہ تحائف بھیجنے پر کھلتا ہے۔', '["rec_special_profile_badge","rec_chat_decoration"]'::jsonb, 2, TRUE),
  ('shining_lv_5', 'shining', 5, 'Radiant Beacon', 'روشن مینار', 1000, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'comet_glow', 'violet_aura', '#A855F7', 'Radiant name decoration across live rooms and party chat.', 'لائیو رومز اور پارٹی چیٹ میں روشن نام کی آرائش۔', '["rec_special_profile_badge","rec_chat_decoration","rec_name_decoration"]'::jsonb, 3, TRUE),
  ('shining_lv_15', 'shining', 15, 'Nebula Star', 'نیبولا ستارہ', 4000, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'nova_wings', 'fuchsia_wings', '#D946EF', 'Winged shining frame & level-up burst celebration.', 'چمکدار پنکھوں والا فریم اور لیول اپ جشن۔', '["rec_special_profile_badge","rec_chat_decoration","rec_name_decoration","rec_profile_frame","rec_recognition_animation"]'::jsonb, 4, TRUE),
  ('shining_lv_60', 'shining', 60, 'Dawn Phoenix', 'طلوعِ فینکس', 20000, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'wings_rose', 'rose_bronze_wings', '#FB7185', 'Rose-bronze shining wings earned through sustained generous gifting.', 'مسلسل سخاوت سے حاصل کردہ روز برونز شائننگ پنکھ۔', '["rec_special_profile_badge","rec_chat_decoration","rec_name_decoration","rec_profile_frame","rec_recognition_animation","rec_entrance_effect"]'::jsonb, 5, TRUE),
  ('shining_lv_70', 'shining', 70, 'Prism Seraph', 'پرزم سراف', 65000, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'wings_sapphire', 'sapphire_violet_wings', '#38BDF8', 'Sapphire-violet luminous wings across rooms & gift stages.', 'لائیو اسٹیج اور رومز میں نیلم بنفشی چمکتے پنکھ۔', '["rec_special_profile_badge","rec_chat_decoration","rec_name_decoration","rec_profile_frame","rec_recognition_animation","rec_entrance_effect","rec_exclusive_appearance"]'::jsonb, 6, TRUE),
  ('shining_lv_80', 'shining', 80, 'Astral Luminary', 'آسمانی نیر', 180000, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'wings_gold_crown', 'imperial_gold_wings', '#FBBF24', 'Supreme golden winged crown for legendary Popo Live gifters.', 'لیجنڈری گفٹرز کے لیے اعلیٰ ترین سنہری پنکھوں کا تاج۔', '["rec_special_profile_badge","rec_chat_decoration","rec_name_decoration","rec_profile_frame","rec_recognition_animation","rec_entrance_effect","rec_exclusive_appearance","rec_visual_effects"]'::jsonb, 7, TRUE),

-- Honor Tiers (thresholds approved platform recognition points)
  ('honor_lv_1', 'honor', 1, 'Honor Citizen', 'معزز شہری', 0, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'laurel_seed', 'emerald_ring', '#34D399', 'Verified baseline Honor standing on Popo Live.', 'پوپو لائیو پر بنیادی تصدیق شدہ اعزاز۔', '["rec_special_profile_badge"]'::jsonb, 1, TRUE),
  ('honor_lv_2', 'honor', 2, 'Trusted Contributor', 'معتبر معاون', 100, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'medal_cyan', 'cyan_prism', '#22D3EE', 'Earned via approved account achievement or community help.', 'منظور شدہ کامیابی یا کمیونٹی مدد سے حاصل ہوتا ہے۔', '["rec_special_profile_badge","rec_chat_decoration"]'::jsonb, 2, TRUE),
  ('honor_lv_5', 'honor', 5, 'Guardian Envoy', 'محافظ نمائندہ', 350, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'crest_violet', 'indigo_crest', '#818CF8', 'Authorized community recognition with decorated name.', 'مستند کمیونٹی اعزاز اور مزین نام۔', '["rec_special_profile_badge","rec_chat_decoration","rec_name_decoration"]'::jsonb, 3, TRUE),
  ('honor_lv_15', 'honor', 15, 'Order Knight', 'شاہی نائٹ', 900, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'wings_emerald', 'emerald_wings', '#10B981', 'Winged honor avatar frame and official recognition burst.', 'پنکھوں والا اعزازی فریم اور سرکاری اعتراف۔', '["rec_special_profile_badge","rec_chat_decoration","rec_name_decoration","rec_profile_frame","rec_recognition_animation"]'::jsonb, 4, TRUE),
  ('honor_lv_60', 'honor', 60, 'Honor Champion', 'چیمپئن آف آنر', 2500, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'wings_rose', 'rose_bronze_wings', '#FB7185', 'Rose-bronze wings awarded for sustained verified excellence.', 'مسلسل بہترین خدمات پر روز برونز اعزازی پنکھ۔', '["rec_special_profile_badge","rec_chat_decoration","rec_name_decoration","rec_profile_frame","rec_recognition_animation","rec_entrance_effect"]'::jsonb, 5, TRUE),
  ('honor_lv_70', 'honor', 70, 'Sovereign Warden', 'سلطانِ وقار', 6000, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'wings_sapphire', 'sapphire_violet_wings', '#60A5FA', 'Sapphire-violet official platform guardian distinction.', 'پلیٹ فارم کے سرکاری محافظ کے لیے نیلم پنکھ۔', '["rec_special_profile_badge","rec_chat_decoration","rec_name_decoration","rec_profile_frame","rec_recognition_animation","rec_entrance_effect","rec_exclusive_appearance"]'::jsonb, 6, TRUE),
  ('honor_lv_80', 'honor', 80, 'Grand Laureate', 'اعظمِ اعزاز', 12000, '/assets/gifts/07_08_wealth_shining_and_honor.png', 'wings_gold_crown', 'imperial_gold_wings', '#FBBF24', 'Highest official Popo Live Honor crown with golden wings.', 'پوپو لائیو کا اعلیٰ ترین سرکاری سنہری پنکھوں والا اعزاز۔', '["rec_special_profile_badge","rec_chat_decoration","rec_name_decoration","rec_profile_frame","rec_recognition_animation","rec_entrance_effect","rec_exclusive_appearance","rec_visual_effects"]'::jsonb, 7, TRUE)
ON CONFLICT (level_id) DO NOTHING;

-- 13. Seed Baseline Recognition Progress for Canonical Users & Demo Profiles (Strictly Accurate Starting Points)
INSERT INTO popolive.user_recognition_progress (
  user_id, category, current_score, current_level_id, current_level_number, highest_level_number, next_level_id, next_threshold, progress_percent
)
SELECT
  uid,
  cat,
  0,
  cat || '_lv_1',
  1,
  1,
  cat || '_lv_2',
  CASE cat WHEN 'wealth' THEN 300 WHEN 'shining' THEN 200 ELSE 100 END,
  0
FROM (
  VALUES
    ('user_wallet_demo_701'),
    ('00000000-0000-0000-0000-000000088201'),
    ('00000000-0000-0000-0000-000000088202')
) AS u(uid)
CROSS JOIN (
  VALUES ('wealth'), ('shining'), ('honor')
) AS c(cat)
ON CONFLICT (user_id, category) DO NOTHING;
