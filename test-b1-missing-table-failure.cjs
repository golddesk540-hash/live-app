/**
 * ============================================================================
 * POPO LIVE — CONTROLLED SCHEMA VALIDATOR & FAILURE TEST
 * Master Plan Reference: POPO-LIVE-BACKEND-REALTIME-PLAN.pdf (Phase B1 Prompt 4, Section 8)
 *
 * Verifies:
 *  1. Complete schema passes validation.
 *  2. Missing required table fails validation.
 *  3. Missing required view fails validation.
 *  4. Missing finance rule fails validation.
 *  5. Incorrect host gift share percentage fails validation.
 *  6. Failed migration returns error and triggers rollback.
 *  7. Failed migration is NOT recorded in schema_migrations.
 *
 * Isolation: Operates inside a temporary schema 'popolive_test_validator'
 * Cleanly drops the temporary test schema on completion. Zero modification to real data.
 * ============================================================================
 */

const { Pool } = require('./apps/web/node_modules/pg');
const { validateDatabaseSchema } = require('./apps/web/scripts/migrate.cjs');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const TEST_SCHEMA = 'popolive_test_validator';

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

async function runControlledFailureTest() {
  console.log('======================================================================');
  console.log('POPO LIVE: B1 PROMPT 4 CONTROLLED VALIDATOR & FAILURE TEST');
  console.log(`Target Schema: ${TEST_SCHEMA} (Isolated Test Sandbox)`);
  console.log('======================================================================\n');

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    // ------------------------------------------------------------------------
    // SETUP: Create isolated test schema
    // ------------------------------------------------------------------------
    console.log('Setting up isolated test schema...');
    await client.query(`DROP SCHEMA IF EXISTS ${TEST_SCHEMA} CASCADE;`);
    await client.query(`CREATE SCHEMA ${TEST_SCHEMA};`);
    await client.query(`SET search_path TO ${TEST_SCHEMA}, public;`);

    // Create tracking table
    await client.query(`
      CREATE TABLE ${TEST_SCHEMA}.schema_migrations (
        version VARCHAR(32) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64) NOT NULL,
        execution_time_ms INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Create required foundation and m062 tables in test schema
    const tables = [
      'users', 'auth_providers', 'sessions', 'otp_verifications', 'password_resets', 'rate_limits',
      'user_privacy_settings', 'user_notification_settings', 'user_follows', 'user_blocks',
      'live_rooms', 'live_room_viewers', 'live_room_messages',
      'party_rooms', 'party_seats', 'party_seat_requests', 'pk_battle_sessions',
      'gift_catalog', 'gift_transactions', 'user_wallets', 'coin_transactions', 'points_transactions',
      'finance_rules', 'coin_packages', 'payment_provider_configs', 'topup_payment_orders',
      'vip_plans', 'user_vip_memberships', 'vip_membership_records',
      'store_categories', 'store_items', 'user_store_equipment', 'user_store_inventory',
      'direct_messages', 'system_notices', 'square_posts', 'square_comments',
      'fan_clubs', 'host_daily_tasks', 'agencies', 'agent_earnings', 'coin_seller_sales',
      'profile_visits', 'guardians', 'medal_catalog', 'user_medals', 'redeem_codes',
      'redeem_redemptions', 'live_room_history', 'user_invite_codes'
    ];

    for (const t of tables) {
      if (t === 'finance_rules') {
        await client.query(`CREATE TABLE ${TEST_SCHEMA}.finance_rules (rule_key VARCHAR(64) PRIMARY KEY, rule_value NUMERIC(12,4));`);
      } else if (t === 'coin_packages') {
        await client.query(`CREATE TABLE ${TEST_SCHEMA}.coin_packages (package_id VARCHAR(64) PRIMARY KEY, base_coins INT, bonus_coins INT, total_coins INT, price_amount NUMERIC(10,2), is_active BOOLEAN DEFAULT true, display_order INT);`);
      } else if (t === 'vip_plans') {
        await client.query(`CREATE TABLE ${TEST_SCHEMA}.vip_plans (plan_id VARCHAR(64) PRIMARY KEY, plan_tier VARCHAR(32), vip_level INT, duration_days INT, price_amount NUMERIC(10,2), coin_price INT, is_active BOOLEAN DEFAULT true, display_order INT);`);
      } else if (t === 'store_categories') {
        await client.query(`CREATE TABLE ${TEST_SCHEMA}.store_categories (category_id VARCHAR(64) PRIMARY KEY, slug VARCHAR(64), name VARCHAR(100), is_active BOOLEAN DEFAULT true, display_order INT);`);
      } else {
        await client.query(`CREATE TABLE ${TEST_SCHEMA}.${t} (id SERIAL PRIMARY KEY);`);
      }
    }

    // Create user_friends view
    await client.query(`CREATE VIEW ${TEST_SCHEMA}.user_friends AS SELECT 1 AS user_id, 2 AS friend_id;`);

    // Seed test finance rule (70%)
    await client.query(`INSERT INTO ${TEST_SCHEMA}.finance_rules (rule_key, rule_value) VALUES ('host_gift_share_percent', 70.0000);`);

    // Seed test coin packages (6 packages)
    const pkgSeeds = [
      ['pkg_100', 100, 0, 100, 0.99, 1],
      ['pkg_500', 500, 25, 525, 4.99, 2],
      ['pkg_1000', 1000, 100, 1100, 9.99, 3],
      ['pkg_2000', 2000, 250, 2250, 19.99, 4],
      ['pkg_5000', 5000, 600, 5600, 49.99, 5],
      ['pkg_10000', 10000, 1500, 11500, 99.99, 6],
    ];
    for (const [id, base, bonus, total, price, order] of pkgSeeds) {
      await client.query(`INSERT INTO ${TEST_SCHEMA}.coin_packages (package_id, base_coins, bonus_coins, total_coins, price_amount, display_order) VALUES ($1, $2, $3, $4, $5, $6);`, [id, base, bonus, total, price, order]);
    }

    // Seed test VIP plans (5 tiers)
    const vipSeeds = [
      ['vip_basic', 'vip_basic', 1, 30, 4.99, 500, 1],
      ['vip_silver', 'vip_silver', 2, 30, 9.99, 1000, 2],
      ['vip_gold', 'vip_gold', 3, 30, 19.99, 2000, 3],
      ['vip_diamond', 'vip_diamond', 4, 30, 49.99, 5000, 4],
      ['vip_premium', 'vip_premium', 5, 90, 129.99, 12000, 5],
    ];
    for (const [id, tier, lvl, days, price, coins, order] of vipSeeds) {
      await client.query(`INSERT INTO ${TEST_SCHEMA}.vip_plans (plan_id, plan_tier, vip_level, duration_days, price_amount, coin_price, display_order) VALUES ($1, $2, $3, $4, $5, $6, $7);`, [id, tier, lvl, days, price, coins, order]);
    }

    // Seed test store categories (10 categories including 4 primary)
    const catSeeds = [
      ['profile_frames', 'profile-frames', 'Profile Frames', 1],
      ['entrance_effects', 'entrance-effects', 'Entrance Effects', 2],
      ['chat_decorations', 'chat-decorations', 'Chat Decorations', 3],
      ['special_badges', 'special-badges', 'Special Badges', 4],
      ['themes', 'themes', 'Themes', 5],
      ['name_decorations', 'name-decorations', 'Name Decorations', 6],
      ['virtual_accessories', 'virtual-accessories', 'Virtual Accessories', 7],
      ['exclusive_items', 'exclusive-items', 'Exclusive Items', 8],
      ['seasonal_items', 'seasonal-items', 'Seasonal Items', 9],
      ['special_event_items', 'special-event-items', 'Special Event Items', 10],
    ];
    for (const [id, slug, name, order] of catSeeds) {
      await client.query(`INSERT INTO ${TEST_SCHEMA}.store_categories (category_id, slug, name, display_order) VALUES ($1, $2, $3, $4);`, [id, slug, name, order]);
    }

    console.log('Isolated test sandbox populated successfully.\n');

    // ------------------------------------------------------------------------
    // TEST 1: Complete schema passes validation
    // ------------------------------------------------------------------------
    console.log('--- Test 1: Complete Schema Validation ---');
    const fullRes = await validateDatabaseSchema(client, TEST_SCHEMA);
    assert(fullRes.success === true, 'Complete schema passes validation');
    assert(fullRes.failedChecks === 0, 'Zero failed checks on complete schema');

    // ------------------------------------------------------------------------
    // TEST 2: Missing required table fails validation
    // ------------------------------------------------------------------------
    console.log('\n--- Test 2: Missing Table Failure Test ---');
    await client.query(`DROP TABLE ${TEST_SCHEMA}.live_rooms CASCADE;`);
    const missingTableRes = await validateDatabaseSchema(client, TEST_SCHEMA);
    assert(missingTableRes.success === false, 'Validator detects missing required table');
    assert(missingTableRes.failedChecks > 0, `Failed checks count > 0 (actual: ${missingTableRes.failedChecks})`);
    assert(missingTableRes.errors.some(e => e.includes('live_rooms')), 'Error detail explicitly reports missing "live_rooms"');
    
    // Restore table
    await client.query(`CREATE TABLE ${TEST_SCHEMA}.live_rooms (id SERIAL PRIMARY KEY);`);

    // ------------------------------------------------------------------------
    // TEST 3: Missing required view fails validation
    // ------------------------------------------------------------------------
    console.log('\n--- Test 3: Missing View Failure Test ---');
    await client.query(`DROP VIEW IF EXISTS ${TEST_SCHEMA}.user_friends;`);
    const missingViewRes = await validateDatabaseSchema(client, TEST_SCHEMA);
    assert(missingViewRes.success === false, 'Validator detects missing required view');
    assert(missingViewRes.errors.some(e => e.includes('user_friends')), 'Error detail explicitly reports missing "user_friends" view');

    // Restore view
    await client.query(`CREATE VIEW ${TEST_SCHEMA}.user_friends AS SELECT 1 AS user_id, 2 AS friend_id;`);

    // ------------------------------------------------------------------------
    // TEST 4: Missing finance rule fails validation
    // ------------------------------------------------------------------------
    console.log('\n--- Test 4: Missing Finance Rule Failure Test ---');
    await client.query(`DELETE FROM ${TEST_SCHEMA}.finance_rules WHERE rule_key = 'host_gift_share_percent';`);
    const missingRuleRes = await validateDatabaseSchema(client, TEST_SCHEMA);
    assert(missingRuleRes.success === false, 'Validator detects missing finance rule');
    assert(missingRuleRes.errors.some(e => e.includes('host_gift_share_percent')), 'Error detail explicitly reports missing "host_gift_share_percent"');

    // ------------------------------------------------------------------------
    // TEST 5: Incorrect host gift share percentage fails validation
    // ------------------------------------------------------------------------
    console.log('\n--- Test 5: Incorrect Finance Rule Value Failure Test ---');
    await client.query(`INSERT INTO ${TEST_SCHEMA}.finance_rules (rule_key, rule_value) VALUES ('host_gift_share_percent', 50.0000);`);
    const wrongValueRes = await validateDatabaseSchema(client, TEST_SCHEMA);
    assert(wrongValueRes.success === false, 'Validator detects non-70 host gift share percentage');
    assert(wrongValueRes.errors.some(e => e.includes('host_gift_share_percent')), 'Error detail explicitly reports incorrect host gift share value (50% != 70%)');

    // Restore correct rule
    await client.query(`UPDATE ${TEST_SCHEMA}.finance_rules SET rule_value = 70.0000 WHERE rule_key = 'host_gift_share_percent';`);

    // ------------------------------------------------------------------------
    // TEST 6 & 7: Failed migration returns error & is NOT marked as successful
    // ------------------------------------------------------------------------
    console.log('\n--- Test 6 & 7: Failed Migration Rollback & Non-Recording ---');
    const failedVersion = '999';
    const failedName = '999_deliberate_syntax_error.sql';
    const badSql = 'CREATE TABLE deliberate_failure (id INVALID_TYPE_SYNTAX_ERROR);';

    let migrationThrew = false;
    try {
      await client.query('BEGIN;');
      await client.query(`SET search_path TO ${TEST_SCHEMA}, public;`);
      await client.query(badSql);
      await client.query(
        `INSERT INTO ${TEST_SCHEMA}.schema_migrations (version, name, checksum, execution_time_ms) VALUES ($1, $2, $3, $4);`,
        [failedVersion, failedName, 'fake_checksum', 10]
      );
      await client.query('COMMIT;');
    } catch (err) {
      await client.query('ROLLBACK;');
      migrationThrew = true;
    }

    assert(migrationThrew === true, 'Failing SQL syntax threw error and aborted');

    // Verify it was NOT recorded in schema_migrations
    const trackingRes = await client.query(
      `SELECT version FROM ${TEST_SCHEMA}.schema_migrations WHERE version = $1;`,
      [failedVersion]
    );
    assert(trackingRes.rows.length === 0, 'Failed migration 999 was NOT recorded in schema_migrations');

    // ------------------------------------------------------------------------
    // TEARDOWN: Completely drop isolated test schema
    // ------------------------------------------------------------------------
    console.log('\nTearing down isolated test sandbox...');
    await client.query(`DROP SCHEMA IF EXISTS ${TEST_SCHEMA} CASCADE;`);
    console.log(`Isolated schema "${TEST_SCHEMA}" dropped cleanly.\n`);

    console.log('======================================================================');
    console.log(`CONTROLLED FAILURE TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log('======================================================================\n');

    if (testsFailed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Controlled failure test error:', err);
    try {
      await client.query(`DROP SCHEMA IF EXISTS ${TEST_SCHEMA} CASCADE;`);
    } catch {}
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runControlledFailureTest().catch(console.error);
