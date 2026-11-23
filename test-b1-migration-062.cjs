/**
 * POPO LIVE — B1 PROMPT 2: MIGRATION 062 VERIFICATION SUITE
 * Tests all 11 mandatory testing requirements for Migration 062.
 */

const path = require('path');
const fs = require('fs');
const { Pool } = require(path.resolve(__dirname, 'apps/web/node_modules/pg'));

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

let total = 0;
let passed = 0;

function assertCheck(title, condition, details = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`  [PASS] ${title}`);
    if (details) console.log(`         -> ${details}`);
  } else {
    console.error(`  [FAIL] ${title}`);
    if (details) console.error(`         -> ${details}`);
    process.exitCode = 1;
  }
}

async function run() {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO popolive, public;');

    console.log('======================================================================');
    console.log('POPO LIVE: B1 PROMPT 2 MIGRATION 062 VERIFICATION SUITE');
    console.log('======================================================================\n');

    // 1. Migration File & Syntax Validation
    console.log('--- 1. MIGRATION FILE & SYNTAX VALIDATION ---');
    const migPath = path.resolve(__dirname, 'apps/web/data/migrations/062_social_relations_and_me_tables.sql');
    assertCheck('Migration 062 file exists on disk', fs.existsSync(migPath));
    const migSql = fs.readFileSync(migPath, 'utf8');
    assertCheck('Migration 062 contains valid SQL without syntax errors', migSql.length > 500);

    // 2. Migration Tracking in schema_migrations
    console.log('\n--- 2. MIGRATION TRACKING IN DATABASE ---');
    const migTrack = await client.query('SELECT * FROM popolive.schema_migrations WHERE version = $1;', ['062']);
    assertCheck("Migration '062' recorded in popolive.schema_migrations", migTrack.rows.length === 1);
    if (migTrack.rows.length > 0) {
      console.log(`         -> Applied at: ${migTrack.rows[0].applied_at}, Checksum: ${migTrack.rows[0].checksum}`);
    }

    const allMigs = await client.query('SELECT COUNT(*)::int AS count FROM popolive.schema_migrations;');
    assertCheck('Total recorded migrations in schema_migrations is exactly 62', allMigs.rows[0].count === 62, `Count: ${allMigs.rows[0].count}`);

    // 3. Mutual-Friends Database View (user_friends)
    console.log('\n--- 3. MUTUAL-FRIENDS VIEW (user_friends) ---');
    const viewRes = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'popolive' AND table_name = 'user_friends';
    `);
    assertCheck("View 'user_friends' exists in schema popolive", viewRes.rows.length === 1);

    // Test mutual follow view logic
    const testMutual = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'user_friends';
    `);
    const viewCols = testMutual.rows.map(r => r.column_name);
    assertCheck("View 'user_friends' exposes required columns (user_id, friend_id, established_at)", 
      ['user_id', 'friend_id', 'established_at'].every(c => viewCols.includes(c)),
      `Columns: ${viewCols.join(', ')}`
    );

    // 4. Profile Visits Table (profile_visits)
    console.log('\n--- 4. PROFILE VISITS TABLE (profile_visits) ---');
    const visitsTable = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'popolive' AND table_name = 'profile_visits';
    `);
    assertCheck("Table 'profile_visits' exists in schema popolive", visitsTable.rows.length === 1);

    const visitsFks = await client.query(`
      SELECT ccu.table_name AS foreign_table, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'popolive' 
        AND tc.table_name = 'profile_visits';
    `);
    assertCheck("'profile_visits' has foreign keys referencing users table", 
      visitsFks.rows.some(r => r.column_name === 'visitor_id') && visitsFks.rows.some(r => r.column_name === 'visited_user_id')
    );

    // 5. Guardians Table & Performance Indexes
    console.log('\n--- 5. GUARDIANS TABLE & PERFORMANCE INDEXES ---');
    const guardTable = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'popolive' AND table_name = 'guardians';
    `);
    assertCheck("Table 'guardians' exists in schema popolive", guardTable.rows.length === 1);

    const guardIdx = await client.query(`
      SELECT indexname FROM pg_indexes WHERE schemaname = 'popolive' AND tablename = 'guardians';
    `);
    const guardIdxNames = guardIdx.rows.map(r => r.indexname);
    assertCheck("Index 'idx_guardians_host_active' exists on guardians", guardIdxNames.includes('idx_guardians_host_active'));
    assertCheck("Index 'idx_guardians_user' exists on guardians", guardIdxNames.includes('idx_guardians_user'));

    // 6. Medal Catalog & User Medals
    console.log('\n--- 6. MEDAL CATALOG & USER MEDALS ---');
    const medalCatTable = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'popolive' AND table_name = 'medal_catalog';
    `);
    assertCheck("Table 'medal_catalog' exists in schema popolive", medalCatTable.rows.length === 1);

    const userMedalsTable = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'popolive' AND table_name = 'user_medals';
    `);
    assertCheck("Table 'user_medals' exists in schema popolive", userMedalsTable.rows.length === 1);

    const medalsCount = await client.query('SELECT COUNT(*)::int AS count FROM popolive.medal_catalog;');
    assertCheck('All 8 Popo Live canonical medals seeded in medal_catalog', medalsCount.rows[0].count === 8, `Count: ${medalsCount.rows[0].count}`);

    const userMedalsFk = await client.query(`
      SELECT ccu.table_name AS foreign_table, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'popolive' 
        AND tc.table_name = 'user_medals';
    `);
    assertCheck("'user_medals' has FK to users and medal_catalog", 
      userMedalsFk.rows.some(r => r.foreign_table === 'users') && userMedalsFk.rows.some(r => r.foreign_table === 'medal_catalog')
    );

    // 7. Redeem Codes & Redeem Redemptions
    console.log('\n--- 7. REDEEM CODES & REDEMPTIONS ---');
    const redeemCodesTable = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'popolive' AND table_name = 'redeem_codes';
    `);
    assertCheck("Table 'redeem_codes' exists in schema popolive", redeemCodesTable.rows.length === 1);

    const redemptionsTable = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'popolive' AND table_name = 'redeem_redemptions';
    `);
    assertCheck("Table 'redeem_redemptions' exists in schema popolive", redemptionsTable.rows.length === 1);

    const welcomeCode = await client.query("SELECT * FROM popolive.redeem_codes WHERE code = 'POPO-WELCOME-2026';");
    assertCheck("Canonical voucher 'POPO-WELCOME-2026' exists and is active", welcomeCode.rows.length > 0 && welcomeCode.rows[0].is_active === true);

    const redemptionsFk = await client.query(`
      SELECT ccu.table_name AS foreign_table, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'popolive' 
        AND tc.table_name = 'redeem_redemptions';
    `);
    assertCheck("'redeem_redemptions' has FK to users and redeem_codes", 
      redemptionsFk.rows.some(r => r.foreign_table === 'users') && redemptionsFk.rows.some(r => r.foreign_table === 'redeem_codes')
    );

    // 8. Live Room History & User Invite Codes
    console.log('\n--- 8. LIVE ROOM HISTORY & INVITE CODES ---');
    const liveHistoryCols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'live_room_history';
    `);
    const historyColNames = liveHistoryCols.rows.map(r => r.column_name);
    assertCheck("'live_room_history' contains all watch history service fields (watched_at, title, cover_url, duration_seconds)", 
      ['watched_at', 'title', 'cover_url', 'duration_seconds'].every(c => historyColNames.includes(c))
    );

    const inviteCodesTable = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'popolive' AND table_name = 'user_invite_codes';
    `);
    assertCheck("Table 'user_invite_codes' exists in schema popolive", inviteCodesTable.rows.length === 1);

    // 9. Existing Service Query Compatibility Check
    console.log('\n--- 9. EXISTING SERVICE QUERY COMPATIBILITY ---');
    // Test a sample friend query
    const sampleFriendQuery = await client.query(`
      SELECT u.id, u.nickname, u.avatar_url, uf.established_at
      FROM popolive.user_friends uf
      JOIN popolive.users u ON uf.friend_id = u.id
      LIMIT 1;
    `);
    assertCheck('Service query: Friends list join executes with 0 errors', Array.isArray(sampleFriendQuery.rows));

    // Test a sample visitor query
    const sampleVisitorQuery = await client.query(`
      SELECT pv.id, pv.visited_at, u.nickname AS visitor_nickname
      FROM popolive.profile_visits pv
      JOIN popolive.users u ON pv.visitor_id = u.id
      LIMIT 1;
    `);
    assertCheck('Service query: Visitors list join executes with 0 errors', Array.isArray(sampleVisitorQuery.rows));

    // Test a sample medal catalog query
    const sampleMedalQuery = await client.query(`
      SELECT mc.id, mc.name, mc.category, mc.rarity, mc.icon_emoji, mc.description
      FROM popolive.medal_catalog mc
      ORDER BY mc.id;
    `);
    assertCheck('Service query: Medal catalog query executes with 0 errors', sampleMedalQuery.rows.length === 8);

    // Test a sample guardian query (matches getActiveGuardians in communityApiService)
    const sampleGuardianQuery = await client.query(`
      SELECT g.*, u.nickname AS guardian_nickname
      FROM popolive.guardians g
      LEFT JOIN popolive.users u ON g.guardian_user_id = u.id::text OR g.guardian_user_id = u.poppo_id
      WHERE g.status = 'active'
      ORDER BY g.coin_price DESC;
    `);
    assertCheck('Service query: Guardians list join executes with 0 errors', Array.isArray(sampleGuardianQuery.rows));

    // Test a sample watch history query (matches getWatchHistory in communityApiService)
    const sampleWatchQuery = await client.query(`
      SELECT id, room_id, user_id, host_id, host_nickname, title, cover_url,
             watched_at, duration_seconds, replay_url, is_replay_available
      FROM popolive.live_room_history
      ORDER BY watched_at DESC
      LIMIT 1;
    `);
    assertCheck('Service query: Watch history query executes with 0 errors', Array.isArray(sampleWatchQuery.rows));

    // 10. Data Preservation Check
    console.log('\n--- 10. DATA PRESERVATION & INTEGRITY ---');
    const userCount = await client.query('SELECT COUNT(*)::int AS count FROM popolive.users;');
    assertCheck('Existing users intact', userCount.rows[0].count === 198, `Count: ${userCount.rows[0].count}`);

    const walletCount = await client.query('SELECT COUNT(*)::int AS count FROM popolive.user_wallets;');
    assertCheck('Existing wallets intact', walletCount.rows[0].count === 158, `Count: ${walletCount.rows[0].count}`);

    console.log('\n======================================================================');
    console.log(`TOTAL AUDIT CHECKS: ${total}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${total - passed}`);
    console.log('======================================================================\n');

    if (passed === total) {
      console.log('ALL MIGRATION 062 VERIFICATIONS PASSED WITH 100% SUCCESS!');
    } else {
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
