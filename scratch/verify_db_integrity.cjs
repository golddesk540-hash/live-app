const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function verify() {
  const client = await pool.connect();
  let total = 0;
  let passed = 0;

  function assert(title, condition, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] ${title}`);
      if (details) console.log(`         -> ${details}`);
    } else {
      console.error(`  [FAIL] ${title}`);
      if (details) console.error(`         -> ${details}`);
    }
  }

  try {
    console.log('======================================================================');
    console.log('POPO LIVE: B1 PROMPT 1 DATABASE INTEGRITY AUDIT');
    console.log('======================================================================\n');

    // 1. Migration Tracking Verification
    console.log('--- 1. MIGRATION TRACKING VERIFICATION ---');
    const migRes = await client.query('SELECT version, name, applied_at, checksum FROM popolive.schema_migrations ORDER BY version ASC;');
    assert('Migration tracking table exists with exact 61 records', migRes.rows.length === 61, `Found ${migRes.rows.length} records`);

    const versions = migRes.rows.map(r => r.version);
    const expectedVersions = Array.from({ length: 61 }, (_, i) => String(i + 1).padStart(3, '0'));
    const missingVersions = expectedVersions.filter(v => !versions.includes(v));
    assert('All migration versions 001 through 061 are recorded', missingVersions.length === 0, `Missing: ${missingVersions.join(', ') || 'None'}`);

    // 2. Table Count & Integrity
    console.log('\n--- 2. SCHEMA TABLE COUNT & INTEGRITY ---');
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'popolive' 
      ORDER BY table_name;
    `);
    assert('Schema popolive contains over 190 tables', tableRes.rows.length >= 190, `Found ${tableRes.rows.length} tables`);

    // 3. Primary Key Verification
    console.log('\n--- 3. PRIMARY KEY VERIFICATION ---');
    const pkRes = await client.query(`
      SELECT tc.table_name, ccu.column_name as pk_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'popolive';
    `);
    assert('Primary keys exist on core popolive tables', pkRes.rows.length >= 150, `Found ${pkRes.rows.length} primary keys`);

    const keyTablesWithPks = ['users', 'user_wallets', 'live_rooms', 'party_rooms', 'coin_transactions', 'points_transactions', 'vip_plans', 'store_items', 'agencies', 'schema_migrations'];
    for (const kt of keyTablesWithPks) {
      const hasPk = pkRes.rows.some(r => r.table_name === kt);
      assert(`Core table '${kt}' has valid PRIMARY KEY`, hasPk);
    }

    // 4. Foreign Key Verification
    console.log('\n--- 4. FOREIGN KEY CONSTRAINT VERIFICATION ---');
    const fkRes = await client.query(`
      SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'popolive';
    `);
    assert('Foreign key constraints exist across relations', fkRes.rows.length >= 60, `Found ${fkRes.rows.length} foreign keys`);

    // 5. Index Verification
    console.log('\n--- 5. INDEX VERIFICATION ---');
    const indexRes = await client.query(`
      SELECT indexname, tablename, indexdef
      FROM pg_indexes
      WHERE schemaname = 'popolive';
    `);
    assert('Indexes created across popolive tables', indexRes.rows.length >= 200, `Found ${indexRes.rows.length} indexes`);

    // 6. Data Preservation Check
    console.log('\n--- 6. DATA PRESERVATION & USER RECORDS CHECK ---');
    const userCount = await client.query('SELECT COUNT(*) as count FROM popolive.users;');
    assert('Existing users preserved in database', parseInt(userCount.rows[0].count, 10) > 0, `Users count: ${userCount.rows[0].count}`);

    const walletCount = await client.query('SELECT COUNT(*) as count FROM popolive.user_wallets;');
    assert('Existing user wallets preserved in database', parseInt(walletCount.rows[0].count, 10) > 0, `Wallets count: ${walletCount.rows[0].count}`);

    const coinTxCount = await client.query('SELECT COUNT(*) as count FROM popolive.coin_transactions;');
    assert('Existing coin transactions preserved in database', parseInt(coinTxCount.rows[0].count, 10) > 0, `Coin tx count: ${coinTxCount.rows[0].count}`);

    const pointsTxCount = await client.query('SELECT COUNT(*) as count FROM popolive.points_transactions;');
    assert('Existing points transactions preserved in database', parseInt(pointsTxCount.rows[0].count, 10) > 0, `Points tx count: ${pointsTxCount.rows[0].count}`);

    console.log('\n======================================================================');
    console.log(`TOTAL AUDIT CHECKS: ${total}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${total - passed}`);
    console.log('======================================================================\n');

    if (passed === total) {
      console.log('DATABASE INTEGRITY FULLY VERIFIED WITH 100% SUCCESS!');
    } else {
      process.exitCode = 1;
    }

  } finally {
    client.release();
    await pool.end();
  }
}

verify().catch(err => {
  console.error('Integrity audit error:', err);
  process.exit(1);
});
