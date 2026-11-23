/**
 * ============================================================================
 * POPO LIVE — B1 PROMPT 3 AUTOMATED VERIFICATION SUITE
 * Master Plan Reference: POPO-LIVE-BACKEND-REALTIME-PLAN.pdf (Phase B1 Prompt 3)
 *
 * Validates:
 *  1. Finance Rule: host_gift_share_percent = 70 (numeric, unique, active)
 *  2. Coin Packages: 6 canonical active packages (pkg_100, pkg_500, pkg_1000, pkg_2000, pkg_5000, pkg_10000)
 *  3. VIP Plans: 5 canonical active tiers (vip_basic, vip_silver, vip_gold, vip_diamond, vip_premium)
 *  4. Store Categories: 10 canonical categories including 4 primary fixture categories
 *  5. Integrity: Database constraints, foreign keys, non-negative numbers
 *  6. Idempotency: Re-executing seed produces zero duplicates and preserves existing data
 * ============================================================================
 */

const { Pool } = require('./apps/web/node_modules/pg');
const { seed } = require('./apps/web/scripts/seed_catalogs.cjs');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, description) {
  if (condition) {
    console.log(`  [PASS] ${description}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${description}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log('======================================================================');
  console.log('POPO LIVE: B1 PROMPT 3 AUTOMATED VERIFICATION TEST');
  console.log('======================================================================\n');

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    // ------------------------------------------------------------------------
    // GROUP 1: FINANCE RULE — HOST GIFT SHARE (70%)
    // ------------------------------------------------------------------------
    console.log('--- Group 1: Finance Rule (Host Gift Share 70%) ---');
    const ruleRes = await client.query(
      `SELECT rule_key, rule_value, description FROM popolive.finance_rules WHERE rule_key = 'host_gift_share_percent';`
    );
    assert(ruleRes.rows.length === 1, 'Finance rule "host_gift_share_percent" exists in popolive.finance_rules');
    
    const rule = ruleRes.rows[0];
    const ruleNum = parseFloat(rule.rule_value);
    assert(ruleNum === 70, `host_gift_share_percent numeric value is exactly 70 (actual: ${rule.rule_value})`);
    assert(ruleNum > 0 && ruleNum <= 100, 'host_gift_share_percent is within valid percentage range (0 < val <= 100)');
    assert(typeof rule.description === 'string' && rule.description.length > 0, 'Finance rule has valid description');

    // Verify other foundational rules are preserved
    const allRules = await client.query('SELECT rule_key, rule_value FROM popolive.finance_rules;');
    assert(allRules.rows.length >= 5, `Pre-existing finance rules preserved (total: ${allRules.rows.length})`);

    // ------------------------------------------------------------------------
    // GROUP 2: COIN PACKAGES (6 CANONICAL PACKAGES)
    // ------------------------------------------------------------------------
    console.log('\n--- Group 2: Coin Packages Catalog ---');
    const activePkgsRes = await client.query(
      `SELECT package_id, package_name, base_coins, bonus_coins, total_coins, price_amount,
              currency, badge_text, is_popular, is_active, display_order
       FROM popolive.coin_packages
       WHERE is_active = true
       ORDER BY display_order ASC;`
    );

    assert(activePkgsRes.rows.length === 6, `Exactly 6 canonical active coin packages found (actual: ${activePkgsRes.rows.length})`);

    const expectedPkgs = [
      { id: 'pkg_100', name: 'Starter Pack', base: 100, bonus: 0, total: 100, price: '0.99', popular: false, order: 1 },
      { id: 'pkg_500', name: 'Silver Pouch', base: 500, bonus: 25, total: 525, price: '4.99', popular: false, order: 2, badge: '+25 Bonus' },
      { id: 'pkg_1000', name: 'Popular Gold Pack', base: 1000, bonus: 100, total: 1100, price: '9.99', popular: true, order: 3, badge: 'Popular' },
      { id: 'pkg_2000', name: 'Golden Trove', base: 2000, bonus: 250, total: 2250, price: '19.99', popular: false, order: 4, badge: 'Best Value' },
      { id: 'pkg_5000', name: 'Royal Chest', base: 5000, bonus: 600, total: 5600, price: '49.99', popular: false, order: 5, badge: '+600 Bonus' },
      { id: 'pkg_10000', name: 'Imperial Vault', base: 10000, bonus: 1500, total: 11500, price: '99.99', popular: false, order: 6, badge: '+1,500 Bonus' },
    ];

    for (let i = 0; i < expectedPkgs.length; i++) {
      const exp = expectedPkgs[i];
      const act = activePkgsRes.rows[i];
      assert(act && act.package_id === exp.id, `Package ${i + 1} ID is ${exp.id} (actual: ${act?.package_id})`);
      assert(act && act.package_name === exp.name, `Package ${exp.id} name is "${exp.name}" (actual: "${act?.package_name}")`);
      assert(act && act.base_coins === exp.base, `Package ${exp.id} base coins is ${exp.base} (actual: ${act?.base_coins})`);
      assert(act && act.bonus_coins === exp.bonus, `Package ${exp.id} bonus coins is ${exp.bonus} (actual: ${act?.bonus_coins})`);
      assert(act && act.total_coins === exp.total, `Package ${exp.id} total coins equals base + bonus = ${exp.total} (actual: ${act?.total_coins})`);
      assert(act && parseFloat(act.price_amount) === parseFloat(exp.price), `Package ${exp.id} price is $${exp.price} (actual: $${act?.price_amount})`);
      assert(act && act.currency === 'USD', `Package ${exp.id} currency is USD (actual: ${act?.currency})`);
      assert(act && act.is_popular === exp.popular, `Package ${exp.id} is_popular is ${exp.popular}`);
      assert(act && act.display_order === exp.order, `Package ${exp.id} display_order is ${exp.order}`);
      if (exp.badge) {
        assert(act && act.badge_text === exp.badge, `Package ${exp.id} badge is "${exp.badge}" (actual: "${act?.badge_text}")`);
      }
    }

    // Verify constraints & data validity across all packages
    const allPkgs = await client.query('SELECT * FROM popolive.coin_packages;');
    const invalidTotals = allPkgs.rows.filter(r => r.total_coins !== (r.base_coins + r.bonus_coins));
    assert(invalidTotals.length === 0, 'All packages satisfy constraint: total_coins = base_coins + bonus_coins');
    const invalidPrices = allPkgs.rows.filter(r => parseFloat(r.price_amount) <= 0);
    assert(invalidPrices.length === 0, 'All packages satisfy constraint: price_amount > 0');

    // ------------------------------------------------------------------------
    // GROUP 3: VIP PLANS (5 CANONICAL TIERS)
    // ------------------------------------------------------------------------
    console.log('\n--- Group 3: VIP Plans Catalog ---');
    const vipRes = await client.query(
      `SELECT plan_id, plan_tier, vip_level, plan_name, duration_days, price_amount,
              renewal_price_amount, currency, coin_price, badge_label, is_popular, is_active, display_order
       FROM popolive.vip_plans
       WHERE is_active = true
       ORDER BY display_order ASC;`
    );

    assert(vipRes.rows.length === 5, `Exactly 5 canonical active VIP plans found (actual: ${vipRes.rows.length})`);

    const expectedVip = [
      { id: 'vip_basic', tier: 'vip_basic', level: 1, name: 'VIP Basic', days: 30, price: '4.99', coins: 500, popular: false, order: 1 },
      { id: 'vip_silver', tier: 'vip_silver', level: 2, name: 'VIP Silver', days: 30, price: '9.99', coins: 1000, popular: false, order: 2 },
      { id: 'vip_gold', tier: 'vip_gold', level: 3, name: 'VIP Gold', days: 30, price: '19.99', coins: 2000, popular: true, order: 3 },
      { id: 'vip_diamond', tier: 'vip_diamond', level: 4, name: 'VIP Diamond', days: 30, price: '49.99', coins: 5000, popular: false, order: 4 },
      { id: 'vip_premium', tier: 'vip_premium', level: 5, name: 'VIP Premium', days: 90, price: '129.99', coins: 12000, popular: false, order: 5 },
    ];

    for (let i = 0; i < expectedVip.length; i++) {
      const exp = expectedVip[i];
      const act = vipRes.rows[i];
      assert(act && act.plan_id === exp.id, `VIP plan ${i + 1} ID is ${exp.id} (actual: ${act?.plan_id})`);
      assert(act && act.plan_tier === exp.tier, `VIP plan ${exp.id} tier is ${exp.tier}`);
      assert(act && act.vip_level === exp.level, `VIP plan ${exp.id} level is ${exp.level}`);
      assert(act && act.plan_name === exp.name, `VIP plan ${exp.id} name is "${exp.name}"`);
      assert(act && act.duration_days === exp.days, `VIP plan ${exp.id} duration is ${exp.days} days`);
      assert(act && parseFloat(act.price_amount) === parseFloat(exp.price), `VIP plan ${exp.id} price is $${exp.price}`);
      assert(act && act.coin_price === exp.coins, `VIP plan ${exp.id} coin price is ${exp.coins} coins`);
      assert(act && act.is_popular === exp.popular, `VIP plan ${exp.id} is_popular is ${exp.popular}`);
      assert(act && act.display_order === exp.order, `VIP plan ${exp.id} display_order is ${exp.order}`);
    }

    // ------------------------------------------------------------------------
    // GROUP 4: STORE CATEGORIES (10 CANONICAL CATEGORIES)
    // ------------------------------------------------------------------------
    console.log('\n--- Group 4: Store Categories Catalog ---');
    const catRes = await client.query(
      `SELECT category_id, slug, name, short_label, default_equip_slot, display_order, is_approved, is_active
       FROM popolive.store_categories
       WHERE is_active = true
       ORDER BY display_order ASC;`
    );

    assert(catRes.rows.length === 10, `Exactly 10 canonical active store categories found (actual: ${catRes.rows.length})`);

    const primaryCategories = ['profile_frames', 'entrance_effects', 'chat_decorations', 'special_badges'];
    for (const pCat of primaryCategories) {
      const found = catRes.rows.find(r => r.category_id === pCat);
      assert(found !== undefined, `Primary fixture category "${pCat}" exists in store_categories`);
    }

    // Check unique slugs and unique display orders
    const slugs = new Set(catRes.rows.map(r => r.slug));
    assert(slugs.size === 10, 'All 10 store categories have distinct unique slugs');
    const orders = new Set(catRes.rows.map(r => r.display_order));
    assert(orders.size === 10, 'All 10 store categories have distinct sequential display orders');

    // ------------------------------------------------------------------------
    // GROUP 5: FOREIGN KEY & CONSTRAINT VALIDATIONS
    // ------------------------------------------------------------------------
    console.log('\n--- Group 5: Foreign Key & Constraint Integrity ---');
    
    // Check store_items FK reference to store_categories
    const invalidItemsFk = await client.query(`
      SELECT item_id, category_id
      FROM popolive.store_items
      WHERE category_id NOT IN (SELECT category_id FROM popolive.store_categories);
    `);
    assert(invalidItemsFk.rows.length === 0, 'All store_items have valid FK references to store_categories');

    // Check topup_payment_orders FK reference to coin_packages
    const invalidOrdersFk = await client.query(`
      SELECT order_id, package_id
      FROM popolive.topup_payment_orders
      WHERE package_id NOT IN (SELECT package_id FROM popolive.coin_packages);
    `);
    assert(invalidOrdersFk.rows.length === 0, 'All topup_payment_orders have valid FK references to coin_packages');

    // Check unique constraints exist
    const constraintsRes = await client.query(`
      SELECT conname, contype
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_namespace n ON t.relnamespace = n.oid
      WHERE n.nspname = 'popolive'
        AND t.relname IN ('finance_rules', 'coin_packages', 'vip_plans', 'store_categories');
    `);
    const conNames = constraintsRes.rows.map(r => r.conname);
    assert(conNames.includes('finance_rules_pkey'), 'finance_rules has PRIMARY KEY constraint');
    assert(conNames.includes('coin_packages_pkey'), 'coin_packages has PRIMARY KEY constraint');
    assert(conNames.includes('coin_packages_package_id_key'), 'coin_packages has UNIQUE constraint on package_id');
    assert(conNames.includes('vip_plans_pkey'), 'vip_plans has PRIMARY KEY constraint');
    assert(conNames.includes('store_categories_pkey'), 'store_categories has PRIMARY KEY constraint');

    // ------------------------------------------------------------------------
    // GROUP 6: IDEMPOTENCY & RERUN VERIFICATION
    // ------------------------------------------------------------------------
    console.log('\n--- Group 6: Idempotency & Rerun Safety ---');
    
    // Record counts prior to rerun
    const rulesCountBefore = (await client.query('SELECT count(*)::int as cnt FROM popolive.finance_rules;')).rows[0].cnt;
    const pkgsCountBefore = (await client.query('SELECT count(*)::int as cnt FROM popolive.coin_packages;')).rows[0].cnt;
    const vipCountBefore = (await client.query('SELECT count(*)::int as cnt FROM popolive.vip_plans;')).rows[0].cnt;
    const catCountBefore = (await client.query('SELECT count(*)::int as cnt FROM popolive.store_categories;')).rows[0].cnt;

    // Execute seed() again
    await seed();

    // Verify counts after rerun
    const rulesCountAfter = (await client.query('SELECT count(*)::int as cnt FROM popolive.finance_rules;')).rows[0].cnt;
    const pkgsCountAfter = (await client.query('SELECT count(*)::int as cnt FROM popolive.coin_packages;')).rows[0].cnt;
    const vipCountAfter = (await client.query('SELECT count(*)::int as cnt FROM popolive.vip_plans;')).rows[0].cnt;
    const catCountAfter = (await client.query('SELECT count(*)::int as cnt FROM popolive.store_categories;')).rows[0].cnt;

    assert(rulesCountAfter === rulesCountBefore, `Finance rules count identical after rerun (${rulesCountBefore} -> ${rulesCountAfter})`);
    assert(pkgsCountAfter === pkgsCountBefore, `Coin packages count identical after rerun (${pkgsCountBefore} -> ${pkgsCountAfter})`);
    assert(vipCountAfter === vipCountBefore, `VIP plans count identical after rerun (${vipCountBefore} -> ${vipCountAfter})`);
    assert(catCountAfter === catCountBefore, `Store categories count identical after rerun (${catCountBefore} -> ${catCountAfter})`);

    // Verify host_gift_share_percent is still exactly 70
    const ruleAfterRerun = (await client.query(
      `SELECT rule_value FROM popolive.finance_rules WHERE rule_key = 'host_gift_share_percent';`
    )).rows[0].rule_value;
    assert(parseFloat(ruleAfterRerun) === 70, `host_gift_share_percent remains exactly 70 after rerun (${ruleAfterRerun})`);

    // ------------------------------------------------------------------------
    // SUMMARY
    // ------------------------------------------------------------------------
    console.log('\n======================================================================');
    console.log(`TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log('======================================================================\n');

    if (testsFailed > 0) {
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runTests().catch((err) => {
  console.error('Test execution failed with unhandled error:', err);
  process.exit(1);
});
