const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';
  console.log('Connecting to database...');
  const client = new Client({ connectionString });
  await client.connect();

  const sqlPath = path.join(__dirname, 'data', 'migrations', '024_quality_and_cost_guard.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Executing Migration 024: Quality and Cost Guard...');
  await client.query(sql);

  console.log('Validating table popolive.user_quality_settings...');
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'popolive' 
      AND table_name = 'user_quality_settings'
  `);
  console.log('Found user_quality_settings columns:', res.rows.map(r => `${r.column_name} (${r.data_type})`));

  console.log('Validating live_rooms quality columns...');
  const roomRes = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'popolive' 
      AND table_name = 'live_rooms'
      AND column_name IN ('current_stream_quality', 'is_cost_guard_active')
  `);
  console.log('Found live_rooms columns:', roomRes.rows.map(r => `${r.column_name} (${r.data_type})`));

  await client.end();
  console.log('Migration 024 applied successfully!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
