/**
 * ============================================================================
 * POPO LIVE — OFFICIAL FINANCIAL RULES & CATALOG SEED ENGINE
 * Master Plan Reference: POPO-LIVE-BACKEND-REALTIME-PLAN.pdf (Phase B1 Prompt 3)
 *
 * Scope:
 *  1. Finance Rule: host_gift_share_percent = 70.0000
 *  2. Coin Packages: 6 canonical packages (pkg_100, pkg_500, pkg_1000, pkg_2000, pkg_5000, pkg_10000)
 *  3. VIP Plans: 5 canonical tiers (vip_basic, vip_silver, vip_gold, vip_diamond, vip_premium)
 *  4. Store Categories: 10 canonical categories (including profile_frames, entrance_effects, chat_decorations, special_badges)
 *
 * Idempotency: All operations strictly utilize ON CONFLICT DO UPDATE/NOTHING.
 * Safety: Never performs DELETE or TRUNCATE. Preserves audit logs and existing data.
 * ============================================================================
 */

const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

// ============================================================================
// 1. FINANCE RULE DEFINITION
// ============================================================================
const FINANCE_RULES = [
  {
    rule_key: 'host_gift_share_percent',
    rule_value: '70.0000',
    description: 'Approved Popo Live rule: 70% of gift coins become host points',
    updated_by: 'system_seed',
  },
];

// ============================================================================
// 2. COIN PACKAGES (THE 6 CANONICAL POPO LIVE PACKAGES)
// ============================================================================
const COIN_PACKAGES = [
  {
    package_id: 'pkg_100',
    package_name: 'Starter Pack',
    package_name_ur: 'اسٹارٹر پیکج',
    base_coins: 100,
    bonus_coins: 0,
    total_coins: 100,
    price_amount: '0.99',
    currency: 'USD',
    icon_url: '/assets/gifts/07_06_top_up.png',
    badge_text: null,
    is_popular: false,
    is_active: true,
    display_order: 1,
    platform_product_id_ios: 'com.popolive.coins.100',
    platform_product_id_android: 'coins_100',
  },
  {
    package_id: 'pkg_500',
    package_name: 'Silver Pouch',
    package_name_ur: 'سلور پاؤچ',
    base_coins: 500,
    bonus_coins: 25,
    total_coins: 525,
    price_amount: '4.99',
    currency: 'USD',
    icon_url: '/assets/gifts/07_06_top_up.png',
    badge_text: '+25 Bonus',
    is_popular: false,
    is_active: true,
    display_order: 2,
    platform_product_id_ios: 'com.popolive.coins.500',
    platform_product_id_android: 'coins_500',
  },
  {
    package_id: 'pkg_1000',
    package_name: 'Popular Gold Pack',
    package_name_ur: 'مقبول گولڈ پیکج',
    base_coins: 1000,
    bonus_coins: 100,
    total_coins: 1100,
    price_amount: '9.99',
    currency: 'USD',
    icon_url: '/assets/gifts/07_06_top_up.png',
    badge_text: 'Popular',
    is_popular: true,
    is_active: true,
    display_order: 3,
    platform_product_id_ios: 'com.popolive.coins.1000',
    platform_product_id_android: 'coins_1000',
  },
  {
    package_id: 'pkg_2000',
    package_name: 'Golden Trove',
    package_name_ur: 'گولڈن ٹروو',
    base_coins: 2000,
    bonus_coins: 250,
    total_coins: 2250,
    price_amount: '19.99',
    currency: 'USD',
    icon_url: '/assets/gifts/07_06_top_up.png',
    badge_text: 'Best Value',
    is_popular: false,
    is_active: true,
    display_order: 4,
    platform_product_id_ios: 'com.popolive.coins.2000',
    platform_product_id_android: 'coins_2000',
  },
  {
    package_id: 'pkg_5000',
    package_name: 'Royal Chest',
    package_name_ur: 'رائل چیسٹ',
    base_coins: 5000,
    bonus_coins: 600,
    total_coins: 5600,
    price_amount: '49.99',
    currency: 'USD',
    icon_url: '/assets/gifts/07_06_top_up.png',
    badge_text: '+600 Bonus',
    is_popular: false,
    is_active: true,
    display_order: 5,
    platform_product_id_ios: 'com.popolive.coins.5000',
    platform_product_id_android: 'coins_5000',
  },
  {
    package_id: 'pkg_10000',
    package_name: 'Imperial Vault',
    package_name_ur: 'امپیریل والٹ',
    base_coins: 10000,
    bonus_coins: 1500,
    total_coins: 11500,
    price_amount: '99.99',
    currency: 'USD',
    icon_url: '/assets/gifts/07_06_top_up.png',
    badge_text: '+1,500 Bonus',
    is_popular: false,
    is_active: true,
    display_order: 6,
    platform_product_id_ios: 'com.popolive.coins.10000',
    platform_product_id_android: 'coins_10000',
  },
];

// ============================================================================
// 3. VIP PLANS (THE 5 CANONICAL TIERS)
// ============================================================================
const VIP_PLANS = [
  {
    plan_id: 'vip_basic',
    plan_tier: 'vip_basic',
    vip_level: 1,
    plan_name: 'VIP Basic',
    plan_name_ur: 'وی آئی پی بیسک',
    description: 'Essential VIP badge, room chat emblem, and priority look for 30 days.',
    description_ur: '30 دن کے لیے بنیادی وی آئی پی بیج، چیٹ نشان اور خصوصی پہچان۔',
    duration_days: 30,
    price_amount: '4.99',
    renewal_price_amount: '4.99',
    currency: 'USD',
    allow_coin_purchase: false,
    coin_price: 500,
    badge_label: 'VIP I',
    badge_asset_url: '/assets/gifts/07_07_vip.png',
    profile_frame_asset_url: '/assets/gifts/entrances/entrance_standard.png',
    name_decoration_style: 'amber_glow',
    theme_key: 'cosmic_basic',
    entrance_id: 'ent_premium',
    entrance_animation_ref: '/assets/gifts/entrances/entrance_premium.json',
    benefit_keys: JSON.stringify(['vip_profile_badge', 'special_chat_badge', 'special_vip_identity', 'vip_gift_effects']),
    benefits_config: JSON.stringify({ frameColor: '#F59E0B', auraStyle: 'amber', roomPriorityWeight: 10 }),
    special_event_access: false,
    platform_product_id_ios: 'com.popolive.vip.basic.30d',
    platform_product_id_android: 'vip_basic_30d',
    is_popular: false,
    is_active: true,
    display_order: 1,
  },
  {
    plan_id: 'vip_silver',
    plan_tier: 'vip_silver',
    vip_level: 2,
    plan_name: 'VIP Silver',
    plan_name_ur: 'وی آئی پی سلور',
    description: 'Unlocks Premium Profile Frame, Name Decoration, and Royal VIP Room Entrance.',
    description_ur: 'پریمیم پروفائل فریم، نام کی آرائش اور شاہی وی آئی پی آمد اینیمیشن۔',
    duration_days: 30,
    price_amount: '9.99',
    renewal_price_amount: '9.49',
    currency: 'USD',
    allow_coin_purchase: false,
    coin_price: 1000,
    badge_label: 'VIP II',
    badge_asset_url: '/assets/gifts/07_07_vip.png',
    profile_frame_asset_url: '/assets/gifts/entrances/entrance_premium.png',
    name_decoration_style: 'silver_prism',
    theme_key: 'cosmic_silver',
    entrance_id: 'ent_vip',
    entrance_animation_ref: '/assets/gifts/entrances/entrance_vip.json',
    benefit_keys: JSON.stringify(['vip_profile_badge', 'premium_profile_frame', 'special_entrance_animation', 'vip_name_decoration', 'special_chat_badge', 'vip_gift_effects', 'special_vip_identity']),
    benefits_config: JSON.stringify({ frameColor: '#E2E8F0', auraStyle: 'silver', roomPriorityWeight: 25 }),
    special_event_access: false,
    platform_product_id_ios: 'com.popolive.vip.silver.30d',
    platform_product_id_android: 'vip_silver_30d',
    is_popular: false,
    is_active: true,
    display_order: 2,
  },
  {
    plan_id: 'vip_gold',
    plan_tier: 'vip_gold',
    vip_level: 3,
    plan_name: 'VIP Gold',
    plan_name_ur: 'وی آئی پی گولڈ',
    description: 'Most popular tier: Royal Gold Crown, Profile Highlighting, Royal Entrance, and VIP Gift Effects.',
    description_ur: 'سب سے مقبول: شاہی گولڈ تاج، پروفائل ہائی لائٹ، شاہی آمد اور وی آئی پی تحفہ اثرات۔',
    duration_days: 30,
    price_amount: '19.99',
    renewal_price_amount: '17.99',
    currency: 'USD',
    allow_coin_purchase: false,
    coin_price: 2000,
    badge_label: 'VIP III',
    badge_asset_url: '/assets/gifts/07_07_vip.png',
    profile_frame_asset_url: '/assets/gifts/entrances/entrance_vip.png',
    name_decoration_style: 'gold_shimmer',
    theme_key: 'cosmic_gold',
    entrance_id: 'ent_vip',
    entrance_animation_ref: '/assets/gifts/entrances/entrance_vip.json',
    benefit_keys: JSON.stringify(['vip_profile_badge', 'premium_profile_frame', 'special_entrance_animation', 'vip_name_decoration', 'special_chat_badge', 'vip_gift_effects', 'profile_highlighting', 'special_vip_identity', 'vip_exclusive_features']),
    benefits_config: JSON.stringify({ frameColor: '#FBBF24', auraStyle: 'imperial_gold', roomPriorityWeight: 50 }),
    special_event_access: false,
    platform_product_id_ios: 'com.popolive.vip.gold.30d',
    platform_product_id_android: 'vip_gold_30d',
    is_popular: true,
    is_active: true,
    display_order: 3,
  },
  {
    plan_id: 'vip_diamond',
    plan_tier: 'vip_diamond',
    vip_level: 4,
    plan_name: 'VIP Diamond',
    plan_name_ur: 'وی آئی پی ڈائمنڈ',
    description: 'Diamond Aurora visual theme, iridescent profile halo, and elite Sovereign VIP entrance.',
    description_ur: 'ڈائمنڈ ارورا تھیم، چمکدار پروفائل ہالہ اور شاہی وی آئی پی آمد اینیمیشن۔',
    duration_days: 30,
    price_amount: '49.99',
    renewal_price_amount: '44.99',
    currency: 'USD',
    allow_coin_purchase: false,
    coin_price: 5000,
    badge_label: 'VIP IV',
    badge_asset_url: '/assets/gifts/07_07_vip.png',
    profile_frame_asset_url: '/assets/gifts/entrances/entrance_vip.png',
    name_decoration_style: 'diamond_aurora',
    theme_key: 'diamond_aurora',
    entrance_id: 'ent_vip',
    entrance_animation_ref: '/assets/gifts/entrances/entrance_vip.json',
    benefit_keys: JSON.stringify(['vip_profile_badge', 'premium_profile_frame', 'special_entrance_animation', 'vip_name_decoration', 'special_chat_badge', 'vip_gift_effects', 'profile_highlighting', 'exclusive_visual_themes', 'special_vip_identity', 'vip_exclusive_features']),
    benefits_config: JSON.stringify({ frameColor: '#38BDF8', auraStyle: 'diamond_prism', roomPriorityWeight: 80 }),
    special_event_access: false,
    platform_product_id_ios: 'com.popolive.vip.diamond.30d',
    platform_product_id_android: 'vip_diamond_30d',
    is_popular: false,
    is_active: true,
    display_order: 4,
  },
  {
    plan_id: 'vip_premium',
    plan_tier: 'vip_premium',
    vip_level: 5,
    plan_name: 'VIP Premium',
    plan_name_ur: 'وی آئی پی پریمیم',
    description: '90-day Sovereign All-Access VIP identity with Festival Gala Entrance & full suite of approved privileges.',
    description_ur: '90 دن کی مکمل شاہی وی آئی پی رکنیت مع فیسٹیول گالا آمد اور تمام منظور شدہ مراعات۔',
    duration_days: 90,
    price_amount: '129.99',
    renewal_price_amount: '114.99',
    currency: 'USD',
    allow_coin_purchase: false,
    coin_price: 12000,
    badge_label: 'VIP V',
    badge_asset_url: '/assets/gifts/07_07_vip.png',
    profile_frame_asset_url: '/assets/gifts/entrances/entrance_special_event.png',
    name_decoration_style: 'sovereign_royal',
    theme_key: 'sovereign_royale',
    entrance_id: 'ent_special_event',
    entrance_animation_ref: '/assets/gifts/entrances/entrance_special_event.json',
    benefit_keys: JSON.stringify(['vip_profile_badge', 'premium_profile_frame', 'special_entrance_animation', 'vip_name_decoration', 'special_chat_badge', 'vip_gift_effects', 'profile_highlighting', 'exclusive_visual_themes', 'special_vip_identity', 'vip_exclusive_features']),
    benefits_config: JSON.stringify({ frameColor: '#EC4899', auraStyle: 'sovereign_crimson_gold', roomPriorityWeight: 100 }),
    special_event_access: true,
    platform_product_id_ios: 'com.popolive.vip.premium.90d',
    platform_product_id_android: 'vip_premium_90d',
    is_popular: false,
    is_active: true,
    display_order: 5,
  },
];

// ============================================================================
// 4. STORE CATEGORIES (THE 10 CANONICAL CATEGORIES)
// ============================================================================
const STORE_CATEGORIES = [
  {
    category_id: 'entrance_effects',
    slug: 'entrance-effects',
    name: 'Entrance Effects',
    name_ur: 'انٹری ایفیکٹس',
    short_label: 'Effects',
    short_label_ur: 'ایفیکٹس',
    description: 'Luxury room arrival vehicles and lightshows.',
    description_ur: 'کمرے میں داخلے کے شاندار اینیمیشن ایفیکٹس۔',
    icon_key: 'sparkles',
    default_equip_slot: 'entrance_effect',
    display_order: 1,
    is_approved: true,
    is_active: true,
  },
  {
    category_id: 'profile_frames',
    slug: 'profile-frames',
    name: 'Profile Frames',
    name_ur: 'پروفائل فریمز',
    short_label: 'Frames',
    short_label_ur: 'فریمز',
    description: 'Animated & luxury avatar borders visible on profiles and live rooms.',
    description_ur: 'پروفائل اور لائیو رومز میں چمکدار اوتار فریم۔',
    icon_key: 'circle-dot',
    default_equip_slot: 'profile_frame',
    display_order: 2,
    is_approved: true,
    is_active: true,
  },
  {
    category_id: 'chat_decorations',
    slug: 'chat-decorations',
    name: 'Chat Decorations',
    name_ur: 'چیٹ ڈیکوریشنز',
    short_label: 'Bubbles',
    short_label_ur: 'ببلز',
    description: 'Styled party room chat bubbles and highlight frames.',
    description_ur: 'پارٹی چیٹ کے لیے رنگین ببلز اور ڈیکوریشنز۔',
    icon_key: 'message-square',
    default_equip_slot: 'chat_decoration',
    display_order: 3,
    is_approved: true,
    is_active: true,
  },
  {
    category_id: 'themes',
    slug: 'themes',
    name: 'Themes',
    name_ur: 'تھیمز',
    short_label: 'Themes',
    short_label_ur: 'تھیمز',
    description: 'Custom profile and party stage dark-purple neon themes.',
    description_ur: 'پروفائل اور اسٹیج کے لیے خصوصی تھیمز۔',
    icon_key: 'palette',
    default_equip_slot: 'theme',
    display_order: 4,
    is_approved: true,
    is_active: true,
  },
  {
    category_id: 'name_decorations',
    slug: 'name-decorations',
    name: 'Name Decorations',
    name_ur: 'نام کی سجاوٹ',
    short_label: 'Name Deco',
    short_label_ur: 'نام سجاوٹ',
    description: 'Glowing gradient nickname badges and typography styles.',
    description_ur: 'نام کے لیے خوبصورت چمکدار اسٹائلز۔',
    icon_key: 'type',
    default_equip_slot: 'name_decoration',
    display_order: 5,
    is_approved: true,
    is_active: true,
  },
  {
    category_id: 'special_badges',
    slug: 'special-badges',
    name: 'Special Badges',
    name_ur: 'خاص بیجز',
    short_label: 'Badges',
    short_label_ur: 'بیجز',
    description: 'Collectible prestige emblems displayed next to your ID.',
    description_ur: 'آئی ڈی کے ساتھ نمایاں ہونے والے خاص اعزازی بیجز۔',
    icon_key: 'award',
    default_equip_slot: 'special_badge',
    display_order: 6,
    is_approved: true,
    is_active: true,
  },
  {
    category_id: 'virtual_accessories',
    slug: 'virtual-accessories',
    name: 'Virtual Accessories',
    name_ur: 'ورچوئل لوازمات',
    short_label: 'Accessories',
    short_label_ur: 'لوازمات',
    description: 'Virtual mics, halos, and live studio flair items.',
    description_ur: 'لائیو اسٹیج اور پروفائل کے لیے ورچوئل لوازمات۔',
    icon_key: 'mic',
    default_equip_slot: 'accessory',
    display_order: 7,
    is_approved: true,
    is_active: true,
  },
  {
    category_id: 'exclusive_items',
    slug: 'exclusive-items',
    name: 'Exclusive Items',
    name_ur: 'خصوصی آئٹمز',
    short_label: 'Exclusive',
    short_label_ur: 'خصوصی',
    description: 'Elite collectibles gated by VIP, Wealth, Shining, or Honor.',
    description_ur: 'وی آئی پی یا اعلیٰ درجات کے لیے مخصوص نایاب آئٹمز۔',
    icon_key: 'crown',
    default_equip_slot: 'none',
    display_order: 8,
    is_approved: true,
    is_active: true,
  },
  {
    category_id: 'seasonal_items',
    slug: 'seasonal-items',
    name: 'Seasonal Items',
    name_ur: 'موسمی آئٹمز',
    short_label: 'Seasonal',
    short_label_ur: 'موسمی',
    description: 'Limited-time festive and seasonal collectibles.',
    description_ur: 'تہواروں اور موسموں کے خاص محدود وقت کے آئٹمز۔',
    icon_key: 'moon-star',
    default_equip_slot: 'accessory',
    display_order: 9,
    is_approved: true,
    is_active: true,
  },
  {
    category_id: 'special_event_items',
    slug: 'special-event-items',
    name: 'Special Event Items',
    name_ur: 'خصوصی ایونٹ آئٹمز',
    short_label: 'Events',
    short_label_ur: 'ایونٹس',
    description: 'Tournament & PK Gala commemorative Store editions.',
    description_ur: 'ٹورنامنٹ اور پی کے گالا کے یادگاری آئٹمز۔',
    icon_key: 'trophy',
    default_equip_slot: 'special_badge',
    display_order: 10,
    is_approved: true,
    is_active: true,
  },
];

async function seed() {
  console.log('======================================================================');
  console.log('POPO LIVE: B1 PROMPT 3 SEED ENGINE');
  console.log('Target: Local PostgreSQL Database (popolive)');
  console.log('======================================================================\n');

  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('SET search_path TO popolive, public;');

    // ------------------------------------------------------------------------
    // 1. SEED FINANCE RULE: host_gift_share_percent = 70
    // ------------------------------------------------------------------------
    console.log('[1/4] Seeding Finance Rules...');
    for (const rule of FINANCE_RULES) {
      await client.query(
        `INSERT INTO popolive.finance_rules (rule_key, rule_value, description, updated_by, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (rule_key) DO UPDATE
         SET rule_value = EXCLUDED.rule_value,
             description = EXCLUDED.description,
             updated_by = EXCLUDED.updated_by,
             updated_at = NOW();`,
        [rule.rule_key, rule.rule_value, rule.description, rule.updated_by]
      );
      console.log(`  -> Finance Rule seeded: ${rule.rule_key} = ${rule.rule_value}%`);
    }

    // ------------------------------------------------------------------------
    // 2. SEED COIN PACKAGES (6 Canonical Packages)
    // ------------------------------------------------------------------------
    console.log('\n[2/4] Seeding Coin Packages...');
    for (const pkg of COIN_PACKAGES) {
      await client.query(
        `INSERT INTO popolive.coin_packages (
           package_id, package_name, package_name_ur, base_coins, bonus_coins, total_coins,
           price_amount, currency, icon_url, badge_text, is_popular, is_active, display_order,
           platform_product_id_ios, platform_product_id_android, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
         ON CONFLICT (package_id) DO UPDATE
         SET package_name = EXCLUDED.package_name,
             package_name_ur = EXCLUDED.package_name_ur,
             base_coins = EXCLUDED.base_coins,
             bonus_coins = EXCLUDED.bonus_coins,
             total_coins = EXCLUDED.total_coins,
             price_amount = EXCLUDED.price_amount,
             currency = EXCLUDED.currency,
             icon_url = EXCLUDED.icon_url,
             badge_text = EXCLUDED.badge_text,
             is_popular = EXCLUDED.is_popular,
             is_active = EXCLUDED.is_active,
             display_order = EXCLUDED.display_order,
             platform_product_id_ios = EXCLUDED.platform_product_id_ios,
             platform_product_id_android = EXCLUDED.platform_product_id_android,
             updated_at = NOW();`,
        [
          pkg.package_id,
          pkg.package_name,
          pkg.package_name_ur,
          pkg.base_coins,
          pkg.bonus_coins,
          pkg.total_coins,
          pkg.price_amount,
          pkg.currency,
          pkg.icon_url,
          pkg.badge_text,
          pkg.is_popular,
          pkg.is_active,
          pkg.display_order,
          pkg.platform_product_id_ios,
          pkg.platform_product_id_android,
        ]
      );
      console.log(
        `  -> Package [${pkg.package_id}]: ${pkg.package_name} | ${pkg.base_coins} + ${pkg.bonus_coins} coins | $${pkg.price_amount} ${pkg.currency}`
      );
    }

    // ------------------------------------------------------------------------
    // 3. SEED VIP PLANS (5 Canonical Tiers)
    // ------------------------------------------------------------------------
    console.log('\n[3/4] Seeding VIP Plans...');
    for (const plan of VIP_PLANS) {
      await client.query(
        `INSERT INTO popolive.vip_plans (
           plan_id, plan_tier, vip_level, plan_name, plan_name_ur, description, description_ur,
           duration_days, price_amount, renewal_price_amount, currency, allow_coin_purchase, coin_price,
           badge_label, badge_asset_url, profile_frame_asset_url, name_decoration_style, theme_key,
           entrance_id, entrance_animation_ref, benefit_keys, benefits_config,
           special_event_access, platform_product_id_ios, platform_product_id_android,
           is_popular, is_active, display_order, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7,
           $8, $9, $10, $11, $12, $13,
           $14, $15, $16, $17, $18,
           $19, $20, $21, $22,
           $23, $24, $25,
           $26, $27, $28, NOW()
         )
         ON CONFLICT (plan_id) DO UPDATE
         SET plan_tier = EXCLUDED.plan_tier,
             vip_level = EXCLUDED.vip_level,
             plan_name = EXCLUDED.plan_name,
             plan_name_ur = EXCLUDED.plan_name_ur,
             description = EXCLUDED.description,
             description_ur = EXCLUDED.description_ur,
             duration_days = EXCLUDED.duration_days,
             price_amount = EXCLUDED.price_amount,
             renewal_price_amount = EXCLUDED.renewal_price_amount,
             currency = EXCLUDED.currency,
             allow_coin_purchase = EXCLUDED.allow_coin_purchase,
             coin_price = EXCLUDED.coin_price,
             badge_label = EXCLUDED.badge_label,
             badge_asset_url = EXCLUDED.badge_asset_url,
             profile_frame_asset_url = EXCLUDED.profile_frame_asset_url,
             name_decoration_style = EXCLUDED.name_decoration_style,
             theme_key = EXCLUDED.theme_key,
             entrance_id = EXCLUDED.entrance_id,
             entrance_animation_ref = EXCLUDED.entrance_animation_ref,
             benefit_keys = EXCLUDED.benefit_keys,
             benefits_config = EXCLUDED.benefits_config,
             special_event_access = EXCLUDED.special_event_access,
             platform_product_id_ios = EXCLUDED.platform_product_id_ios,
             platform_product_id_android = EXCLUDED.platform_product_id_android,
             is_popular = EXCLUDED.is_popular,
             is_active = EXCLUDED.is_active,
             display_order = EXCLUDED.display_order,
             updated_at = NOW();`,
        [
          plan.plan_id,
          plan.plan_tier,
          plan.vip_level,
          plan.plan_name,
          plan.plan_name_ur,
          plan.description,
          plan.description_ur,
          plan.duration_days,
          plan.price_amount,
          plan.renewal_price_amount,
          plan.currency,
          plan.allow_coin_purchase,
          plan.coin_price,
          plan.badge_label,
          plan.badge_asset_url,
          plan.profile_frame_asset_url,
          plan.name_decoration_style,
          plan.theme_key,
          plan.entrance_id,
          plan.entrance_animation_ref,
          plan.benefit_keys,
          plan.benefits_config,
          plan.special_event_access,
          plan.platform_product_id_ios,
          plan.platform_product_id_android,
          plan.is_popular,
          plan.is_active,
          plan.display_order,
        ]
      );
      console.log(
        `  -> VIP Plan [${plan.plan_id}]: ${plan.plan_name} (Level ${plan.vip_level}) | $${plan.price_amount} / ${plan.duration_days}d`
      );
    }

    // ------------------------------------------------------------------------
    // 4. SEED STORE CATEGORIES (10 Canonical Categories)
    // ------------------------------------------------------------------------
    console.log('\n[4/4] Seeding Store Categories...');
    for (const cat of STORE_CATEGORIES) {
      await client.query(
        `INSERT INTO popolive.store_categories (
           category_id, slug, name, name_ur, short_label, short_label_ur,
           description, description_ur, icon_key, default_equip_slot,
           display_order, is_approved, is_active, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
         ON CONFLICT (category_id) DO UPDATE
         SET slug = EXCLUDED.slug,
             name = EXCLUDED.name,
             name_ur = EXCLUDED.name_ur,
             short_label = EXCLUDED.short_label,
             short_label_ur = EXCLUDED.short_label_ur,
             description = EXCLUDED.description,
             description_ur = EXCLUDED.description_ur,
             icon_key = EXCLUDED.icon_key,
             default_equip_slot = EXCLUDED.default_equip_slot,
             display_order = EXCLUDED.display_order,
             is_approved = EXCLUDED.is_approved,
             is_active = EXCLUDED.is_active,
             updated_at = NOW();`,
        [
          cat.category_id,
          cat.slug,
          cat.name,
          cat.name_ur,
          cat.short_label,
          cat.short_label_ur,
          cat.description,
          cat.description_ur,
          cat.icon_key,
          cat.default_equip_slot,
          cat.display_order,
          cat.is_approved,
          cat.is_active,
        ]
      );
      console.log(`  -> Store Category [${cat.category_id}]: "${cat.name}" | Slot: ${cat.default_equip_slot}`);
    }

    await client.query('COMMIT');
    console.log('\n======================================================================');
    console.log('SEED EXECUTION SUCCESSFUL — ALL DATA COMMITTED ATOMICALLY');
    console.log('======================================================================\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('SEED FAILED — TRANSACTION ROLLED BACK:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seed, FINANCE_RULES, COIN_PACKAGES, VIP_PLANS, STORE_CATEGORIES };
