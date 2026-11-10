const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function applyMigration041() {
  const client = await pool.connect();
  try {
    console.log('Connecting to database...');
    console.log('Executing Migration 041: PK Activity Slot System...');

    const sqlPath = path.join(__dirname, 'data', 'migrations', '041_pk_activity_slot.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query('SET search_path TO popolive, public;');
    await client.query(sql);

    console.log('Validating tables & columns in pk_activity_slots...');
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' 
        AND table_name = 'pk_activity_slots'
        AND column_name IN ('title', 'subtitle', 'activity_type', 'target_battles', 'reward_points', 'reward_coins', 'status');
    `);
    console.log('pk_activity_slots columns:', cols.rows.map(r => r.column_name));

    console.log('Validating seeded canonical activities...');
    const acts = await client.query(`
      SELECT id, title, subtitle, activity_type, target_battles, current_battles, reward_points, reward_coins, status
      FROM popolive.pk_activity_slots
      ORDER BY display_order ASC;
    `);
    console.log('Seeded Activities:', acts.rows);

    console.log('Migration 041 applied successfully!');
  } catch (err) {
    console.error('Migration 041 error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration041();
