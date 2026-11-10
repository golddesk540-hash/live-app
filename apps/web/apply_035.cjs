const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function applyMigration() {
  console.log('Connecting to database for Migration 035...');
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, 'data', 'migrations', '035_pk_battle_types.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing Migration 035: PK Battle Types (1v1 & Optional 4-Host)...');
    await client.query(sql);

    // Verify pk_feature_flags
    const flagsRes = await client.query(`
      SELECT flag_key, is_enabled, description FROM popolive.pk_feature_flags ORDER BY flag_key ASC;
    `);
    console.log('PK Feature Flags:', flagsRes.rows);

    // Verify pk_battle_types
    const typesRes = await client.query(`
      SELECT id, name, name_ur, max_hosts, is_enabled, is_locked, feature_flag 
      FROM popolive.pk_battle_types 
      ORDER BY display_order ASC;
    `);
    console.log('PK Battle Types:', typesRes.rows);

    // Verify pk_battle_sessions columns
    const sessRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'pk_battle_sessions';
    `);
    console.log('pk_battle_sessions columns:', sessRes.rows.map(c => c.column_name));

    // Verify pk_selection_logs columns
    const logsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'pk_selection_logs';
    `);
    console.log('pk_selection_logs columns:', logsRes.rows.map(c => c.column_name));

    console.log('Migration 035 applied successfully!');
  } catch (err) {
    console.error('Migration 035 failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
