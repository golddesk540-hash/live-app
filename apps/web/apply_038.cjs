const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function applyMigration038() {
  const client = await pool.connect();
  try {
    console.log('Connecting to database...');
    console.log('Executing Migration 038: PK Battle Results & Winner Declaration...');

    const sqlPath = path.join(__dirname, 'data', 'migrations', '038_pk_battle_results.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query('SET search_path TO popolive, public;');
    await client.query(sql);

    console.log('Validating tables & columns...');
    const resultTable = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' 
        AND table_name = 'pk_battle_results'
        AND column_name IN ('winner_host_id', 'winner_score', 'loser_score', 'result_type', 'score_diff');
    `);
    console.log('pk_battle_results columns:', resultTable.rows.map(r => r.column_name));

    const canonicalResult = await client.query(`
      SELECT id, battle_id, winner_nickname, winner_score, loser_nickname, loser_score, result_type
      FROM popolive.pk_battle_results
      WHERE battle_id = '00000000-0000-0000-0000-000000000604';
    `);
    console.log('Canonical Result 6.4:', canonicalResult.rows[0]);

    console.log('Migration 038 applied successfully!');
  } catch (err) {
    console.error('Migration 038 error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration038();
