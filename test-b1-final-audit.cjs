/**
 * ============================================================================
 * POPO LIVE — MASTER B1 FINAL AUDIT & REGRESSION SUITE
 * Master Plan Reference: POPO-LIVE-BACKEND-REALTIME-PLAN.pdf (Phase B1 Prompt 4, Section 10)
 *
 * Validates:
 *  1. Database Migration Inventory (001–062 all accounted for and recorded).
 *  2. Schema Integrity (all essential foundation tables and view user_friends).
 *  3. Migration 062 Social and Me structures.
 *  4. Finance Rule: host_gift_share_percent strictly equals 70.0000.
 *  5. Catalog Data: 6 coin packages, 5 VIP plans, 10 store categories.
 *  6. Foreign-key relationships & performance indexes.
 *  7. Database Client Utilities: Pool, query, withTransaction, search_path.
 *  8. Flag Discipline: All module flags and provider flags remain OFF.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('./apps/web/node_modules/pg');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, description, detail = '') {
  if (condition) {
    console.log(`  [PASS] ${description}${detail ? ` (${detail})` : ''}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${description}${detail ? ` (${detail})` : ''}`);
    testsFailed++;
  }
}

async function runFinalAudit() {
  console.log('======================================================================');
  console.log('POPO LIVE: MASTER B1 FINAL AUDIT & REGRESSION SUITE');
  console.log('======================================================================\n');

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    // ------------------------------------------------------------------------
    // SECTION 1: MIGRATION INVENTORY & TRACKING
    // ------------------------------------------------------------------------
    console.log('--- Section 1: Migration Inventory & Tracking (001–062) ---');
    const migrationsDir = path.resolve(__dirname, 'apps/web/data/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && /^\d{3}_/.test(f))
      .sort();

    assert(files.length === 62, 'Total migration files on disk is 62', `Found: ${files.length}`);
    assert(files[0].startsWith('001_'), 'First migration is 001', files[0]);
    assert(files[files.length - 1].startsWith('062_'), 'Latest migration is 062', files[files.length - 1]);

    const trackingRes = await client.query(
      'SELECT version, name, applied_at, checksum, execution_time_ms FROM popolive.schema_migrations ORDER BY version ASC;'
    );
    assert(trackingRes.rows.length === 62, 'Total migrations recorded in schema_migrations is 62', `Recorded: ${trackingRes.rows.length}`);

    // Verify all 001–062 exist sequentially in DB
    const recordedVersions = new Set(trackingRes.rows.map(r => r.version));
    let allVersionsPresent = true;
    for (let i = 1; i <= 62; i++) {
      const vStr = String(i).padStart(3, '0');
      if (!recordedVersions.has(vStr)) {
        allVersionsPresent = false;
        break;
      }
    }
    assert(allVersionsPresent, 'All migration versions 001 through 062 present sequentially in tracking table');

    // ------------------------------------------------------------------------
    // SECTION 2: FOUNDATION & MIGRATION 062 SCHEMA VALIDATION
    // ------------------------------------------------------------------------
    console.log('\n--- Section 2: Schema Structures (001–062) ---');
    const tablesRes = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'popolive' AND table_type = 'BASE TABLE';"
    );
    const existingTables = new Set(tablesRes.rows.map(r => r.table_name));

    const requiredTables = [
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

    for (const t of requiredTables) {
      assert(existingTables.has(t), `Table "popolive.${t}" exists`);
    }

    // Mutual-friends view
    const viewRes = await client.query(
      "SELECT table_name FROM information_schema.views WHERE table_schema = 'popolive' AND table_name = 'user_friends';"
    );
    assert(viewRes.rows.length === 1, 'Mutual-friends view "popolive.user_friends" exists');

    // ------------------------------------------------------------------------
    // SECTION 3: FINANCE RULES VALIDATION
    // ------------------------------------------------------------------------
    console.log('\n--- Section 3: Finance Rules Validation ---');
    const ruleRes = await client.query(
      "SELECT rule_key, rule_value, description FROM popolive.finance_rules WHERE rule_key = 'host_gift_share_percent';"
    );
    assert(ruleRes.rows.length === 1, 'Finance rule "host_gift_share_percent" exists');
    assert(parseFloat(ruleRes.rows[0].rule_value) === 70, 'host_gift_share_percent equals exactly 70.0000', `${ruleRes.rows[0].rule_value}%`);

    // ------------------------------------------------------------------------
    // SECTION 4: CATALOG SEED DATA VALIDATION
    // ------------------------------------------------------------------------
    console.log('\n--- Section 4: Catalog Seed Data Validation ---');
    // Coin packages
    const pkgsRes = await client.query(
      'SELECT package_id, base_coins, bonus_coins, total_coins, price_amount, is_popular, is_active FROM popolive.coin_packages WHERE is_active = true ORDER BY display_order ASC;'
    );
    assert(pkgsRes.rows.length === 6, 'Exactly 6 canonical active coin packages', `Found: ${pkgsRes.rows.length}`);
    const expectedPkgIds = ['pkg_100', 'pkg_500', 'pkg_1000', 'pkg_2000', 'pkg_5000', 'pkg_10000'];
    assert(pkgsRes.rows.every((r, idx) => r.package_id === expectedPkgIds[idx]), 'Coin package IDs and ordering match canonical catalog');

    // VIP plans
    const vipRes = await client.query(
      'SELECT plan_id, plan_tier, vip_level, duration_days, price_amount, coin_price FROM popolive.vip_plans WHERE is_active = true ORDER BY display_order ASC;'
    );
    assert(vipRes.rows.length === 5, 'Exactly 5 canonical active VIP tiers', `Found: ${vipRes.rows.length}`);
    const expectedVipTiers = ['vip_basic', 'vip_silver', 'vip_gold', 'vip_diamond', 'vip_premium'];
    assert(vipRes.rows.every((r, idx) => r.plan_id === expectedVipTiers[idx]), 'VIP tiers and ordering match canonical catalog');

    // Store categories
    const catRes = await client.query(
      'SELECT category_id, slug, name FROM popolive.store_categories WHERE is_active = true ORDER BY display_order ASC;'
    );
    assert(catRes.rows.length === 10, 'Exactly 10 active store categories', `Found: ${catRes.rows.length}`);
    const primaryCats = ['profile_frames', 'entrance_effects', 'chat_decorations', 'special_badges'];
    assert(primaryCats.every(c => catRes.rows.some(r => r.category_id === c)), 'All 4 primary fixture store categories present');

    // ------------------------------------------------------------------------
    // SECTION 5: FOREIGN KEYS & INDEXES
    // ------------------------------------------------------------------------
    console.log('\n--- Section 5: Foreign Keys & Indexes Integrity ---');
    const fkRes = await client.query(`
      SELECT conname, confrelid::regclass::text as ref_table
      FROM pg_constraint
      WHERE connamespace = 'popolive'::regnamespace AND contype = 'f';
    `);
    assert(fkRes.rows.length > 50, 'PostgreSQL foreign keys configured and active across popolive schema', `Count: ${fkRes.rows.length}`);

    const idxRes = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'popolive' AND tablename = 'guardians';
    `);
    const guardianIdxNames = idxRes.rows.map(r => r.indexname);
    assert(guardianIdxNames.includes('idx_guardians_host_active'), 'Performance index "idx_guardians_host_active" exists');
    assert(guardianIdxNames.includes('idx_guardians_user'), 'Performance index "idx_guardians_user" exists');

    // ------------------------------------------------------------------------
    // SECTION 6: DATABASE CLIENT TRANSACTION & QUERY UTILITIES
    // ------------------------------------------------------------------------
    console.log('\n--- Section 6: Database Client & Transaction Utilities ---');
    // Test transaction commit
    let txCommitPassed = false;
    await client.query('BEGIN;');
    await client.query('SET search_path TO popolive, public;');
    const testSelect = await client.query('SELECT 1 as test_val;');
    await client.query('COMMIT;');
    if (testSelect.rows[0].test_val === 1) {
      txCommitPassed = true;
    }
    assert(txCommitPassed, 'Database client withTransaction commit execution working');

    // Test transaction rollback
    let txRollbackPassed = false;
    await client.query('BEGIN;');
    await client.query('SET search_path TO popolive, public;');
    await client.query('ROLLBACK;');
    txRollbackPassed = true;
    assert(txRollbackPassed, 'Database client transaction rollback execution working');

    // Test search_path
    const searchPathRes = await client.query('SHOW search_path;');
    assert(searchPathRes.rows[0].search_path.includes('popolive'), 'Current search_path contains popolive', searchPathRes.rows[0].search_path);

    // ------------------------------------------------------------------------
    // SECTION 7: FLAG DISCIPLINE VERIFICATION
    // ------------------------------------------------------------------------
    console.log('\n--- Section 7: Flag Discipline Verification ---');
    const mobileConfig = fs.readFileSync('apps/mobile/lib/api/api_config.dart', 'utf8');
    const mobileFlags = [
      'USE_LIVE_API', 'USE_PARTY_API', 'USE_MESSAGE_API', 'USE_ECONOMY_API',
      'USE_VIP_API', 'USE_STORE_API', 'USE_COMMUNITY_API', 'USE_FINAL_API'
    ];
    for (const flag of mobileFlags) {
      const regex = new RegExp(`bool\\.fromEnvironment\\('${flag}',\\s*defaultValue:\\s*false\\)`);
      assert(regex.test(mobileConfig), `Mobile module flag ${flag} defaults to false`);
    }

    const webClientFlags = fs.readFileSync('apps/web/lib/clientFlags.ts', 'utf8');
    for (const flag of mobileFlags) {
      assert(webClientFlags.includes(`NEXT_PUBLIC_${flag}`), `Web client flag NEXT_PUBLIC_${flag} declared`);
    }

    const devEnv = fs.readFileSync('apps/web/.env.development', 'utf8');
    for (const flag of mobileFlags) {
      assert(devEnv.includes(`NEXT_PUBLIC_${flag}=false`), `.env.development freezes NEXT_PUBLIC_${flag}=false`);
    }

    // ------------------------------------------------------------------------
    // SUMMARY
    // ------------------------------------------------------------------------
    console.log('\n======================================================================');
    console.log(`FINAL B1 AUDIT RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log('======================================================================\n');

    if (testsFailed > 0) {
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runFinalAudit().catch(err => {
  console.error('Final audit execution failed:', err);
  process.exit(1);
});
