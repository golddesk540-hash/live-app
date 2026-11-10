const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function applyMigration042() {
  const client = await pool.connect();
  try {
    console.log('Connecting to database...');
    console.log('Executing Migration 042: PK Battle Reactions System...');

    const sqlPath = path.join(__dirname, 'data', 'migrations', '042_pk_reactions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query('SET search_path TO popolive, public;');
    await client.query(sql);

    console.log('Validating tables & columns in pk_reactions...');
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' 
        AND table_name = 'pk_reactions'
        AND column_name IN ('battle_id', 'user_id', 'target_host_side', 'reaction_type', 'emoji');
    `);
    console.log('pk_reactions columns:', cols.rows.map(r => r.column_name));

    console.log('Validating reaction counters...');
    const counters = await client.query(`
      SELECT reaction_type, target_host_side, count
      FROM popolive.pk_reaction_counters
      WHERE battle_id = '00000000-0000-0000-0000-000000000603';
    `);
    console.log('Canonical Reaction Counters:', counters.rows);

    console.log('Migration 042 applied successfully!');
  } catch (err) {
    console.error('Migration 042 error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration042();
