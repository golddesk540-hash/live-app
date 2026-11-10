const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function applyMigration039() {
  const client = await pool.connect();
  try {
    console.log('Connecting to database...');
    console.log('Executing Migration 039: PK Winner Boost System...');

    const sqlPath = path.join(__dirname, 'data', 'migrations', '039_pk_winner_boost.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query('SET search_path TO popolive, public;');
    await client.query(sql);

    console.log('Validating tables & columns...');
    const boostTable = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' 
        AND table_name = 'pk_winner_boosts'
        AND column_name IN ('winner_user_id', 'boost_type', 'multiplier_percentage', 'status', 'expires_at');
    `);
    console.log('pk_winner_boosts columns:', boostTable.rows.map(r => r.column_name));

    const canonicalBoost = await client.query(`
      SELECT id, battle_id, winner_nickname, boost_title, status, duration_minutes, expires_at
      FROM popolive.pk_winner_boosts
      WHERE battle_id = '00000000-0000-0000-0000-000000000604';
    `);
    console.log('Canonical Boost 6.5:', canonicalBoost.rows[0]);

    console.log('Migration 039 applied successfully!');
  } catch (err) {
    console.error('Migration 039 error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration039();
