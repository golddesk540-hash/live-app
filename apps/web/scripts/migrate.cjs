/**
 * ============================================================================
 * POPO LIVE — OFFICIAL POSTGRESQL MIGRATION RUNNER & SCHEMA VALIDATOR
 * Master Plan Reference: POPO-LIVE-BACKEND-REALTIME-PLAN.pdf (Phase B1 Prompt 4)
 *
 * Capabilities:
 *  1. One-command migration execution: npm run db:migrate
 *  2. Discovers and executes migrations 001–062 in strict numeric order.
 *  3. Atomic transaction boundaries per migration (BEGIN ... COMMIT / ROLLBACK).
 *  4. SHA-256 checksum tracking in 'popolive.schema_migrations'.
 *  5. Immediate stop and nonzero exit code on any SQL or connection error.
 *  6. Post-migration schema & catalog validator (001–062 tables, views, rules, seeds).
 *  7. Operator CLI modes: default (apply+validate), --validate, --dry-run, --status.
 *  8. Environment safety: password masking in all log output.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const rawConnectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const migrationsDir = path.resolve(__dirname, '../data/migrations');

/**
 * Masks database credentials from URLs before printing to logs
 */
function sanitizeConnectionString(connStr) {
  try {
    const url = new URL(connStr);
    if (url.password) {
      url.password = '***';
    }
    return url.toString();
  } catch {
    return connStr.replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1***$3');
  }
}

/**
 * Computes SHA-256 checksum of SQL file content
 */
function computeChecksum(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Core Schema & Catalog Validation Engine
 * Validates tables, views, finance rules, coin packages, VIP plans, and store categories.
 */
async function validateDatabaseSchema(client, schemaName = 'popolive') {
  const result = {
    success: true,
    passedChecks: 0,
    failedChecks: 0,
    details: [],
    errors: [],
  };

  function recordCheck(passed, description, detail) {
    if (passed) {
      result.passedChecks++;
      result.details.push({ status: 'PASS', description, detail });
    } else {
      result.failedChecks++;
      result.success = false;
      result.details.push({ status: 'FAIL', description, detail });
      result.errors.push(`${description}: ${detail}`);
    }
  }

  // 1. Verify schema existence
  const schemaRes = await client.query(
    `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1;`,
    [schemaName]
  );
  recordCheck(
    schemaRes.rows.length === 1,
    `Schema "${schemaName}" exists`,
    schemaRes.rows.length === 1 ? 'Found' : 'Missing schema'
  );

  // 2. Query all tables in schema
  const tablesRes = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_type = 'BASE TABLE' ORDER BY table_name;`,
    [schemaName]
  );
  const existingTables = new Set(tablesRes.rows.map(r => r.table_name));

  // 3. Essential Foundation Tables (Migrations 001–061)
  const foundationTables = [
    'users',
    'auth_providers',
    'sessions',
    'otp_verifications',
    'password_resets',
    'rate_limits',
    'user_privacy_settings',
    'user_notification_settings',
    'user_follows',
    'user_blocks',
    'live_rooms',
    'live_room_viewers',
    'live_room_messages',
    'party_rooms',
    'party_seats',
    'party_seat_requests',
    'pk_battle_sessions',
    'gift_catalog',
    'gift_transactions',
    'user_wallets',
    'coin_transactions',
    'points_transactions',
    'finance_rules',
    'coin_packages',
    'payment_provider_configs',
    'topup_payment_orders',
    'vip_plans',
    'user_vip_memberships',
    'vip_membership_records',
    'store_categories',
    'store_items',
    'user_store_equipment',
    'user_store_inventory',
    'direct_messages',
    'system_notices',
    'square_posts',
    'square_comments',
    'fan_clubs',
    'host_daily_tasks',
    'agencies',
    'agent_earnings',
    'coin_seller_sales',
    'schema_migrations',
  ];

  for (const table of foundationTables) {
    recordCheck(
      existingTables.has(table),
      `Foundation table "${table}" exists`,
      existingTables.has(table) ? 'Present' : 'MISSING'
    );
  }

  // 4. Migration 062 Specific Tables & Views
  const m62Tables = [
    'profile_visits',
    'guardians',
    'medal_catalog',
    'user_medals',
    'redeem_codes',
    'redeem_redemptions',
    'live_room_history',
    'user_invite_codes',
  ];

  for (const table of m62Tables) {
    recordCheck(
      existingTables.has(table),
      `Migration 062 table "${table}" exists`,
      existingTables.has(table) ? 'Present' : 'MISSING'
    );
  }

  // 5. Views: user_friends mutual-follow view
  const viewsRes = await client.query(
    `SELECT table_name FROM information_schema.views WHERE table_schema = $1 AND table_name = 'user_friends';`,
    [schemaName]
  );
  recordCheck(
    viewsRes.rows.length === 1,
    `Mutual-friends view "user_friends" exists in schema "${schemaName}"`,
    viewsRes.rows.length === 1 ? 'Present' : 'MISSING'
  );

  // 6. Finance Rule: host_gift_share_percent = 70
  try {
    const ruleRes = await client.query(
      `SELECT rule_key, rule_value FROM ${schemaName}.finance_rules WHERE rule_key = 'host_gift_share_percent';`
    );
    if (ruleRes.rows.length === 0) {
      recordCheck(false, 'Finance rule "host_gift_share_percent" exists', 'Rule missing from finance_rules');
    } else {
      const val = parseFloat(ruleRes.rows[0].rule_value);
      recordCheck(
        val === 70,
        'Finance rule "host_gift_share_percent" equals 70%',
        `Value: ${ruleRes.rows[0].rule_value}%`
      );
    }
  } catch (err) {
    recordCheck(false, 'Finance rule validation', err.message);
  }

  // 7. Coin Packages: 6 canonical active packages
  try {
    const pkgsRes = await client.query(
      `SELECT package_id, base_coins, bonus_coins, total_coins, price_amount
       FROM ${schemaName}.coin_packages
       WHERE is_active = true
       ORDER BY display_order ASC;`
    );
    recordCheck(
      pkgsRes.rows.length === 6,
      'Exactly 6 canonical active coin packages exist',
      `Found: ${pkgsRes.rows.length}`
    );

    const expectedIds = ['pkg_100', 'pkg_500', 'pkg_1000', 'pkg_2000', 'pkg_5000', 'pkg_10000'];
    const actualIds = pkgsRes.rows.map(r => r.package_id);
    const hasAllIds = expectedIds.every(id => actualIds.includes(id));
    recordCheck(hasAllIds, 'All 6 canonical package IDs present (pkg_100..pkg_10000)', actualIds.join(', '));

    const invalidTotals = pkgsRes.rows.filter(r => r.total_coins !== (r.base_coins + r.bonus_coins));
    recordCheck(invalidTotals.length === 0, 'All coin packages have valid total = base + bonus', `Invalid: ${invalidTotals.length}`);
  } catch (err) {
    recordCheck(false, 'Coin package catalog validation', err.message);
  }

  // 8. VIP Plans: 5 canonical active tiers
  try {
    const vipRes = await client.query(
      `SELECT plan_id, plan_tier, vip_level, duration_days, price_amount, coin_price
       FROM ${schemaName}.vip_plans
       WHERE is_active = true
       ORDER BY display_order ASC;`
    );
    recordCheck(
      vipRes.rows.length === 5,
      'Exactly 5 canonical active VIP plans exist',
      `Found: ${vipRes.rows.length}`
    );

    const expectedVipIds = ['vip_basic', 'vip_silver', 'vip_gold', 'vip_diamond', 'vip_premium'];
    const actualVipIds = vipRes.rows.map(r => r.plan_id);
    const hasAllVip = expectedVipIds.every(id => actualVipIds.includes(id));
    recordCheck(hasAllVip, 'All 5 canonical VIP tiers present (vip_basic..vip_premium)', actualVipIds.join(', '));
  } catch (err) {
    recordCheck(false, 'VIP plans catalog validation', err.message);
  }

  // 9. Store Categories: 10 active categories including primary fixtures
  try {
    const catRes = await client.query(
      `SELECT category_id, slug, name
       FROM ${schemaName}.store_categories
       WHERE is_active = true
       ORDER BY display_order ASC;`
    );
    recordCheck(
      catRes.rows.length === 10,
      'Exactly 10 active store categories exist',
      `Found: ${catRes.rows.length}`
    );

    const primaryCategories = ['profile_frames', 'entrance_effects', 'chat_decorations', 'special_badges'];
    const catIds = new Set(catRes.rows.map(r => r.category_id));
    const hasPrimary = primaryCategories.every(id => catIds.has(id));
    recordCheck(hasPrimary, 'All 4 primary fixture store categories present', primaryCategories.join(', '));
  } catch (err) {
    recordCheck(false, 'Store categories catalog validation', err.message);
  }

  return result;
}

/**
 * Migration Runner Main Function
 */
async function run(options = {}) {
  const isVerifyOnly = options.isVerifyOnly ?? process.argv.includes('--verify') ?? process.argv.includes('--validate');
  const isDryRun = options.isDryRun ?? process.argv.includes('--dry-run');
  const isStatusOnly = options.isStatusOnly ?? process.argv.includes('--status');
  const connectionString = options.connectionString || rawConnectionString;
  const targetSchema = options.targetSchema || 'popolive';

  const nodeEnv = process.env.NODE_ENV || 'development';
  const sanitizedUrl = sanitizeConnectionString(connectionString);

  console.log('======================================================================');
  console.log('POPO LIVE: ONE-COMMAND POSTGRESQL MIGRATION & VALIDATION ENGINE');
  console.log(`Environment: ${nodeEnv.toUpperCase()}`);
  console.log(`Target URL:  ${sanitizedUrl}`);
  console.log(`Schema:      ${targetSchema}`);
  console.log(`Execution:   ${isStatusOnly ? 'STATUS INVENTORY' : isVerifyOnly ? 'VALIDATE ONLY' : isDryRun ? 'DRY RUN' : 'APPLY MIGRATIONS + VALIDATE'}`);
  console.log('======================================================================\n');

  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  const client = await pool.connect();

  try {
    // 1. Verify target database connection and target schema
    const dbInfo = await client.query('SELECT current_database() as db_name, current_user as db_user, version() as pg_version;');
    console.log(`Connected to database "${dbInfo.rows[0].db_name}" as user "${dbInfo.rows[0].db_user}"`);

    await client.query(`CREATE SCHEMA IF NOT EXISTS ${targetSchema};`);
    await client.query(`SET search_path TO ${targetSchema}, public;`);

    // 2. Ensure schema_migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${targetSchema}.schema_migrations (
        version VARCHAR(32) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64) NOT NULL,
        execution_time_ms INTEGER NOT NULL DEFAULT 0
      );
    `);

    // 3. Query existing applied migrations
    const appliedRes = await client.query(
      `SELECT version, name, applied_at, checksum, execution_time_ms FROM ${targetSchema}.schema_migrations ORDER BY version ASC;`
    );
    const appliedMap = new Map();
    appliedRes.rows.forEach(r => appliedMap.set(r.version, r));

    // 4. Discover migration files
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && /^\d{3}_/.test(f))
      .sort();

    console.log(`Discovered ${files.length} migration files (001 to ${files[files.length - 1].slice(0, 3)}) in:`);
    console.log(`  ${migrationsDir}\n`);

    // Handle --status flag
    if (isStatusOnly) {
      console.log('----------------------------------------------------------------------');
      console.log('MIGRATION INVENTORY STATUS');
      console.log('----------------------------------------------------------------------');
      for (const file of files) {
        const version = file.match(/^(\d{3})_/)[1];
        if (appliedMap.has(version)) {
          const m = appliedMap.get(version);
          console.log(`  [APPLIED]  ${version} | ${file} | ${new Date(m.applied_at).toISOString()} | ${m.execution_time_ms}ms`);
        } else {
          console.log(`  [PENDING]  ${version} | ${file}`);
        }
      }
      console.log(`\nTotal: ${files.length} files, ${appliedMap.size} applied, ${files.length - appliedMap.size} pending.`);
      return { success: true, total: files.length, applied: appliedMap.size, pending: files.length - appliedMap.size };
    }

    // Apply or simulate migrations
    let newlyAppliedCount = 0;
    let previouslyAppliedCount = 0;
    let totalTimeMs = 0;

    for (const file of files) {
      const match = file.match(/^(\d{3})_(.*)\.sql$/);
      if (!match) continue;

      const version = match[1];
      const name = file;
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      const checksum = computeChecksum(sql);

      if (appliedMap.has(version)) {
        previouslyAppliedCount++;
        const prev = appliedMap.get(version);
        if (prev.checksum !== checksum) {
          console.warn(`  [CHECKSUM WARNING] Migration ${version}: Checksum changed since applied! Recorded: ${prev.checksum.slice(0, 8)}..., Current: ${checksum.slice(0, 8)}...`);
        }
        continue;
      }

      if (isVerifyOnly) {
        console.log(`  [PENDING] Migration ${version}: ${name}`);
        continue;
      }

      // Execute migration in strict atomic transaction
      const startTime = Date.now();
      try {
        await client.query('BEGIN;');
        await client.query(`SET search_path TO ${targetSchema}, public;`);
        await client.query(sql);

        const elapsed = Date.now() - startTime;
        totalTimeMs += elapsed;

        if (isDryRun) {
          await client.query('ROLLBACK;');
          console.log(`  [DRY RUN PASS] Migration ${version}: ${name} (${elapsed}ms)`);
        } else {
          await client.query(
            `INSERT INTO ${targetSchema}.schema_migrations (version, name, checksum, execution_time_ms)
             VALUES ($1, $2, $3, $4);`,
            [version, name, checksum, elapsed]
          );
          await client.query('COMMIT;');
          newlyAppliedCount++;
          console.log(`  [APPLIED] Migration ${version}: ${name} (${elapsed}ms)`);
        }
      } catch (err) {
        await client.query('ROLLBACK;');
        console.error(`\n======================================================================`);
        console.error(`[FATAL] Migration ${version} (${name}) FAILED!`);
        console.error(`Error: ${err.message}`);
        console.error(`Transaction rolled back cleanly. Migration ${version} was NOT marked applied.`);
        console.error(`======================================================================\n`);
        throw err;
      }
    }

    console.log('----------------------------------------------------------------------');
    console.log('MIGRATION EXECUTION SUMMARY');
    console.log(`  Discovered Files:    ${files.length}`);
    console.log(`  Previously Applied:  ${previouslyAppliedCount}`);
    console.log(`  Newly Applied:       ${newlyAppliedCount}`);
    console.log(`  Execution Time:      ${totalTimeMs}ms`);
    console.log('----------------------------------------------------------------------\n');

    // 5. Post-Migration Schema & Catalog Validation
    console.log('Executing comprehensive schema and catalog validation...');
    const validation = await validateDatabaseSchema(client, targetSchema);

    for (const d of validation.details) {
      if (d.status === 'PASS') {
        console.log(`  [PASS] ${d.description} (${d.detail})`);
      } else {
        console.error(`  [FAIL] ${d.description} (${d.detail})`);
      }
    }

    console.log('\n======================================================================');
    console.log(`VALIDATION RESULT: ${validation.passedChecks} CHECKS PASSED, ${validation.failedChecks} FAILED`);
    console.log('======================================================================\n');

    if (!validation.success) {
      const err = new Error(`Database validation failed with ${validation.failedChecks} errors: ${validation.errors.join('; ')}`);
      throw err;
    }

    console.log('POPO LIVE DATABASE FOUNDATION IS 100% HEALTHY, CONSISTENT & READY.\n');
    return {
      success: true,
      totalFiles: files.length,
      previouslyApplied: previouslyAppliedCount,
      newlyApplied: newlyAppliedCount,
      validation,
    };
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration runner terminated with error:', err.message);
      process.exit(1);
    });
}

module.exports = {
  run,
  validateDatabaseSchema,
  sanitizeConnectionString,
  computeChecksum,
};
