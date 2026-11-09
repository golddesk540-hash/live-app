const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';
  console.log('Connecting to database...');
  const client = new Client({ connectionString });
  await client.connect();

  const sqlPath = path.join(__dirname, 'data', 'migrations', '023_end_screen_and_live_center.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Executing Migration 023: End Screen and Live Center...');
  await client.query(sql);

  console.log('Validating columns on popolive.live_rooms...');
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'popolive' 
      AND table_name = 'live_rooms' 
      AND column_name IN ('duration_seconds', 'total_viewers', 'new_followers', 'points_received')
  `);
  console.log('Found new columns:', res.rows.map(r => `${r.column_name} (${r.data_type})`));

  await client.end();
  console.log('Migration 023 applied successfully!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
