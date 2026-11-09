const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

async function applyMigration() {
  console.log('Connecting to database...');
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    console.log('Executing Migration 022: Safety Tools - Live Room Reports and Room Mutes...');
    const sqlPath = path.join(__dirname, 'data', 'migrations', '022_safety_tools_reports_mutes.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);

    console.log('Validating table popolive.live_room_mutes...');
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'live_room_mutes'
    `);
    console.log('Found mutes columns:', res.rows.map(r => `${r.column_name} (${r.data_type})`));

    console.log('Migration 022 applied successfully!');
  } catch (err) {
    console.error('Error applying migration 022:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
