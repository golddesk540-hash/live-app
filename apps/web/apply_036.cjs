const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function applyMigration036() {
  const client = await pool.connect();
  try {
    console.log('Connecting to database...');
    console.log('Executing Migration 036: PK Invitations & Random Matchmaking...');

    const sqlPath = path.join(__dirname, 'data', 'migrations', '036_pk_invitations_and_matchmaking.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query('SET search_path TO popolive, public;');
    await client.query(sql);

    console.log('Validating tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'popolive' 
        AND table_name IN ('pk_invitations', 'pk_matchmaking_queue', 'pk_battles');
    `);
    console.log('Found tables:', tables.rows.map(r => r.table_name));

    const hosts = await client.query(`
      SELECT u.id, u.poppo_id, u.nickname, lr.room_number, lr.viewer_count, lr.status
      FROM popolive.users u
      JOIN popolive.live_rooms lr ON lr.host_id = u.id
      WHERE u.poppo_id IN ('88201', '88202', '88203');
    `);
    console.log('Seeded Canonical PK Hosts:', hosts.rows);

    console.log('Migration 036 applied successfully!');
  } catch (err) {
    console.error('Migration 036 error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration036();
