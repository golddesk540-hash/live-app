const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

async function applyMigration() {
  console.log('Connecting to database...');
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    console.log('Executing Migration 020: Live Room Viewer Presence...');
    const sqlPath = path.join(__dirname, 'data', 'migrations', '020_viewer_room_presence.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);

    console.log('Validating table popolive.live_room_viewers...');
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'live_room_viewers'
    `);
    console.log('Found columns:', res.rows.map(r => `${r.column_name} (${r.data_type})`));

    console.log('Migration 020 applied successfully!');
  } catch (err) {
    console.error('Error applying migration 020:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
