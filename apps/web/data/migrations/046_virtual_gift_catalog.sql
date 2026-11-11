-- ============================================================================
-- Migration 046: Module 7.2 — Complete Virtual Gift Catalog System
-- Central backend catalog, 10 dynamic categories, asset types, audit logs, SSE
-- Connects with Module 7.1 Coins & Points, Live Rooms, PK Battles & Profiles
-- ============================================================================

SET search_path TO popolive, public;

-- 1. Gift Categories Table (Backend-managed, zero hardcoded client lists)
CREATE TABLE IF NOT EXISTS popolive.gift_categories (
  category_id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  name_ur VARCHAR(120) NOT NULL,
  short_name VARCHAR(40) NOT NULL,
  short_name_ur VARCHAR(40) NOT NULL,
  slug VARCHAR(80) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(120) NOT NULL DEFAULT 'gift',
  display_order INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_virtual_filter BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_categories_order
  ON popolive.gift_categories (display_order ASC, is_active);

-- 2. Virtual Gift Catalog Table
CREATE TABLE IF NOT EXISTS popolive.gift_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  name_ur VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  description_ur TEXT NOT NULL,
  coin_price BIGINT NOT NULL CHECK (coin_price > 0),
  category_id VARCHAR(64) NOT NULL REFERENCES popolive.gift_categories(category_id) ON UPDATE CASCADE,
  thumbnail_url TEXT NOT NULL,
  image_url TEXT NOT NULL,
  animation_url TEXT,
  asset_type VARCHAR(24) NOT NULL DEFAULT 'lottie' CHECK (asset_type IN ('png', 'webp', 'gif', 'lottie', 'video')),
  gift_type VARCHAR(40) NOT NULL DEFAULT 'standard',
  usage_count BIGINT NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_new BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Prevent duplicate gift names within the same category
CREATE UNIQUE INDEX IF NOT EXISTS idx_gift_catalog_unique_name_cat
  ON popolive.gift_catalog (LOWER(name), category_id);

CREATE INDEX IF NOT EXISTS idx_gift_catalog_active_order
  ON popolive.gift_catalog (is_active, display_order ASC);

CREATE INDEX IF NOT EXISTS idx_gift_catalog_category
  ON popolive.gift_catalog (category_id, is_active, display_order ASC);

CREATE INDEX IF NOT EXISTS idx_gift_catalog_popular
  ON popolive.gift_catalog (is_popular, usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_gift_catalog_new
  ON popolive.gift_catalog (is_new, created_at DESC);

-- 3. Gift Catalog Admin Audit Logs
CREATE TABLE IF NOT EXISTS popolive.gift_catalog_audit_logs (
  audit_id VARCHAR(80) PRIMARY KEY,
  target_type VARCHAR(30) NOT NULL CHECK (target_type IN ('gift', 'category', 'asset', 'catalog')),
  target_id VARCHAR(120) NOT NULL,
  action_type VARCHAR(80) NOT NULL,
  actor_id VARCHAR(120) NOT NULL,
  actor_role VARCHAR(40) NOT NULL,
  reason TEXT,
  before_data JSONB,
  after_data JSONB,
  ip_address VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_catalog_audit_time
  ON popolive.gift_catalog_audit_logs (created_at DESC);

-- 4. Gift Catalog Real-Time Events (SSE live updates without app restart)
CREATE TABLE IF NOT EXISTS popolive.gift_catalog_realtime_events (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(80) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_catalog_rt_events_id
  ON popolive.gift_catalog_realtime_events (id DESC);

-- 5. Seed Approved 10 Gift Categories (Ordered with 07_02 Reference Tabs First)
INSERT INTO popolive.gift_categories (
  category_id, name, name_ur, short_name, short_name_ur, slug, description, icon, display_order, is_active, is_virtual_filter
) VALUES
  ('all', 'All Gifts', 'تمام تحائف', 'All', 'تمام', 'all', 'Browse all active Popo Live virtual gifts', 'sparkles', 1, true, true),
  ('popular', 'Popular Gifts', 'مقبول تحائف', 'Popular', 'مقبول', 'popular', 'Most frequently sent gifts by the community', 'flame', 2, true, true),
  ('luxury', 'Luxury Gifts', 'لگژری تحائف', 'Luxury', 'لگژری', 'luxury', 'High-prestige cars, yachts, and royal gifts', 'crown', 3, true, false),
  ('special_event', 'Special Event Gifts', 'تقریب کے تحائف', 'Event', 'تقریب', 'special-event', 'Celebrating milestone streams & live events', 'calendar', 4, true, false),
  ('basic', 'Basic Gifts', 'بنیادی تحائف', 'Basic', 'بنیادی', 'basic', 'Friendly everyday gifts to support hosts', 'gift', 5, true, false),
  ('love', 'Love Gifts', 'محبت کے تحائف', 'Love', 'محبت', 'love', 'Warm hearts, teddy bears, and affection gifts', 'heart', 6, true, false),
  ('premium', 'Premium Gifts', 'پریمیم تحائف', 'Premium', 'پریمیم', 'premium', 'Polished royal tokens & precious gems', 'gem', 7, true, false),
  ('seasonal', 'Seasonal Gifts', 'موسمی تحائف', 'Seasonal', 'موسمی', 'seasonal', 'Festival and seasonal limited artwork gifts', 'sun', 8, true, false),
  ('animated', 'Animated Gifts', 'اینیمیٹڈ تحائف', 'Animated', 'اینیمیشن', 'animated', 'Full-motion animated celebration gifts', 'zap', 9, true, false),
  ('exclusive', 'Exclusive Gifts', 'وی آئی پی تحائف', 'Exclusive', 'خصوصی', 'exclusive', 'Ultra-rare collector gifts for top supporters', 'star', 10, true, false)
ON CONFLICT (category_id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ur = EXCLUDED.name_ur,
  short_name = EXCLUDED.short_name,
  short_name_ur = EXCLUDED.short_name_ur,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- 6. Seed Approved Virtual Gifts (First 6 match 07_02_gift_catalog.png 1:1)
INSERT INTO popolive.gift_catalog (
  gift_id, name, name_ur, description, description_ur, coin_price, category_id,
  thumbnail_url, image_url, animation_url, asset_type, gift_type, usage_count,
  is_popular, is_new, is_featured, display_order, is_active
) VALUES
  (
    'gift_rose', 'Rose', 'گلاب',
    'A fresh crimson rose to brighten your favorite host''s live stream.',
    'اپنے پسندیدہ میزبان کی لائیو اسٹریم کو روشن کرنے کے لیے ایک تازہ سرخ گلاب۔',
    10, 'basic',
    '/assets/gifts/thumbs/rose.png', '/assets/gifts/rose.png', '/assets/gifts/animations/rose.json',
    'lottie', 'standard', 15420, true, false, true, 1, true
  ),
  (
    'gift_heart', 'Heart', 'دل',
    'Show instant warmth and appreciation with a glowing pink heart.',
    'چمکتے ہوئے گلابی دل کے ساتھ فوری محبت اور قدردانی کا اظہار کریں۔',
    50, 'love',
    '/assets/gifts/thumbs/heart.png', '/assets/gifts/heart.png', '/assets/gifts/animations/heart.json',
    'lottie', 'standard', 11280, true, false, true, 2, true
  ),
  (
    'gift_teddy', 'Teddy', 'ٹیڈی',
    'Send an adorable cuddly teddy bear with celebratory sparkle effects.',
    'خوشی کے چمکتے اثرات کے ساتھ ایک پیارا ٹیڈی بیئر تحفے میں بھیجیں۔',
    100, 'love',
    '/assets/gifts/thumbs/teddy.png', '/assets/gifts/teddy.png', '/assets/gifts/animations/teddy.json',
    'lottie', 'animated', 8950, true, false, false, 3, true
  ),
  (
    'gift_crown', 'Crown', 'تاج',
    'Award the host a jeweled royal crown during heated streams or PK battles.',
    'لائیو شو یا پی کے مقابلے کے دوران میزبان کو قیمتی جواہرات والا شاہی تاج پہنائیں۔',
    500, 'premium',
    '/assets/gifts/thumbs/crown.png', '/assets/gifts/crown.png', '/assets/gifts/animations/crown.json',
    'lottie', 'animated', 6410, true, false, true, 4, true
  ),
  (
    'gift_sports_car', 'Sports Car', 'اسپورٹس کار',
    'Roar across the live room stage with a custom neon magenta supercar.',
    'نیون میجنٹا سپر کار کے ساتھ لائیو روم اسٹیج پر شاندار انٹری دیں۔',
    3000, 'luxury',
    '/assets/gifts/thumbs/sports_car.png', '/assets/gifts/sports_car.png', '/assets/gifts/animations/sports_car.json',
    'lottie', 'luxury_entrance', 2940, true, false, true, 5, true
  ),
  (
    'gift_castle', 'Castle', 'قلعہ',
    'Summon a majestic crystal fortress with grand celebration fireworks.',
    'شاندار جشن کی آتشبازی کے ساتھ ایک عظیم الشان کرسٹل محل بھیجیں۔',
    10000, 'luxury',
    '/assets/gifts/thumbs/castle.png', '/assets/gifts/castle.png', '/assets/gifts/animations/castle.json',
    'lottie', 'luxury_entrance', 1280, true, false, true, 6, true
  ),
  (
    'gift_lollipop', 'Lollipop', 'لالی پاپ',
    'Sweet neon swirl lollipop for lighthearted live room fun.',
    'لائیو روم میں ہلکی پھلکی تفریح کے لیے میٹھی نیون لالی پاپ۔',
    5, 'basic',
    '/assets/gifts/thumbs/lollipop.png', '/assets/gifts/lollipop.png', null,
    'png', 'standard', 18300, true, false, false, 7, true
  ),
  (
    'gift_love_letter', 'Love Letter', 'محبت کا خط',
    'Send an animated sealed greeting card filled with floating hearts.',
    'تیرتے دلوں سے بھرا اینیمیٹڈ محبت کا خط بھیجیں۔',
    25, 'love',
    '/assets/gifts/thumbs/love_letter.png', '/assets/gifts/love_letter.png', '/assets/gifts/animations/love_letter.json',
    'lottie', 'standard', 4320, false, true, false, 8, true
  ),
  (
    'gift_diamond_ring', 'Diamond Ring', 'ہیرے کی انگوٹھی',
    'Radiant solitaire diamond ring crafted for top supporter moments.',
    'اہم سپورٹر لمحات کے لیے تیار کردہ چمکدار ہیرے کی انگوٹھی۔',
    250, 'premium',
    '/assets/gifts/thumbs/diamond_ring.png', '/assets/gifts/diamond_ring.webp', '/assets/gifts/animations/diamond_ring.json',
    'webp', 'standard', 5190, true, false, false, 9, true
  ),
  (
    'gift_event_fireworks', 'Event Fireworks', 'تقریب کی آتشبازی',
    'Ignite multi-color celebration bursts for special Popo Live tournaments.',
    'خصوصی پوپو لائیو ٹورنامنٹس کے لیے رنگین جشن کی آتشبازی۔',
    888, 'special_event',
    '/assets/gifts/thumbs/event_fireworks.png', '/assets/gifts/event_fireworks.png', '/assets/gifts/animations/event_fireworks.json',
    'lottie', 'event', 3100, false, true, true, 10, true
  ),
  (
    'gift_festive_lantern', 'Festive Lantern', 'جشنِ چراغاں',
    'Golden seasonal lantern illuminating festive live celebrations.',
    'تہواروں کے لائیو جشن کو روشن کرنے والی سنہری لالٹین۔',
    199, 'seasonal',
    '/assets/gifts/thumbs/festive_lantern.png', '/assets/gifts/festive_lantern.png', '/assets/gifts/animations/festive_lantern.json',
    'png', 'seasonal', 2760, false, true, false, 11, true
  ),
  (
    'gift_galaxy_jet', 'Galaxy Jet', 'گیلیکسی جیٹ',
    'Supersonic neon starfighter soaring through the animated gift sky.',
    'اینیمیٹڈ گفٹ آسمان میں اڑتا ہوا تیز رفتار نیون اسٹار فائٹر۔',
    5000, 'animated',
    '/assets/gifts/thumbs/galaxy_jet.png', '/assets/gifts/galaxy_jet.png', '/assets/gifts/animations/galaxy_jet.json',
    'lottie', 'animated', 980, false, true, true, 12, true
  ),
  (
    'gift_royal_yacht', 'Royal Yacht', 'شاہی یاٹ',
    'Sail an illuminated luxury yacht directly onto the host''s stage.',
    'میزبان کے اسٹیج پر روشن لگژری یاٹ کا شاندار تحفہ۔',
    1500, 'luxury',
    '/assets/gifts/thumbs/royal_yacht.png', '/assets/gifts/royal_yacht.webp', '/assets/gifts/animations/royal_yacht.json',
    'webp', 'luxury_entrance', 1650, false, false, false, 13, true
  ),
  (
    'gift_dragon_phoenix', 'Dragon Phoenix', 'شاہی فینکس ڈریگن',
    'Ultra-exclusive collector spectacle reserved for legendary VIP patrons.',
    'لیجنڈری وی آئی پی سرپرستوں کے لیے نہایت نایاب شاہی کلیکٹر تحفہ۔',
    25000, 'exclusive',
    '/assets/gifts/thumbs/dragon_phoenix.png', '/assets/gifts/dragon_phoenix.png', '/assets/gifts/animations/dragon_phoenix.json',
    'lottie', 'exclusive', 415, false, true, true, 14, true
  )
ON CONFLICT (gift_id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ur = EXCLUDED.name_ur,
  description = EXCLUDED.description,
  description_ur = EXCLUDED.description_ur,
  coin_price = EXCLUDED.coin_price,
  category_id = EXCLUDED.category_id,
  thumbnail_url = EXCLUDED.thumbnail_url,
  image_url = EXCLUDED.image_url,
  animation_url = EXCLUDED.animation_url,
  asset_type = EXCLUDED.asset_type,
  gift_type = EXCLUDED.gift_type,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

INSERT INTO popolive.gift_catalog_audit_logs (
  audit_id, target_type, target_id, action_type, actor_id, actor_role, reason, after_data
) VALUES (
  'AUDIT_GIFT_SEED_046',
  'catalog',
  'system',
  'initial_catalog_seed',
  'system',
  'system',
  'Module 7.2 Virtual Gift Catalog initial 10 categories & 14 approved gifts',
  '{"categories": 10, "gifts": 14}'::jsonb
) ON CONFLICT (audit_id) DO NOTHING;
