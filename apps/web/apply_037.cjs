const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function applyMigration037() {
  const client = await pool.connect();
  try {
    console.log('Connecting to database...');
    console.log('Executing Migration 037: PK Battle Score and Timer...');

    const sqlPath = path.join(__dirname, 'data', 'migrations', '037_pk_score_and_timer.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query('SET search_path TO popolive, public;');
    await client.query(sql);

    console.log('Validating tables & columns...');
    const battleCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' 
        AND table_name = 'pk_battles'
        AND column_name IN ('host_a_score', 'host_b_score', 'duration_seconds', 'timer_status', 'expires_at');
    `);
    console.log('pk_battles columns:', battleCols.rows.map(r => r.column_name));

    const eventsTable = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'popolive' 
        AND table_name IN ('pk_score_events', 'pk_comments');
    `);
    console.log('Created tables:', eventsTable.rows.map(r => r.table_name));

    const canonicalBattle = await client.query(`
      SELECT id, host_a_nickname, host_a_score, host_b_nickname, host_b_score, duration_seconds, timer_status
      FROM popolive.pk_battles
      WHERE id = '00000000-0000-0000-0000-000000000603';
    `);
    console.log('Canonical Battle 6.3:', canonicalBattle.rows[0]);

    console.log('Migration 037 applied successfully!');
  } catch (err) {
    console.error('Migration 037 error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration037();
