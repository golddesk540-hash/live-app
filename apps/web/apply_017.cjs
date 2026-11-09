const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';
  console.log('Connecting to database...');
  const client = new Client({ connectionString });
  await client.connect();

  const sqlPath = path.join(__dirname, 'data', 'migrations', '017_go_live_gates.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Executing Migration 017: Go-Live Gates...');
  await client.query(sql);

  console.log('Validating columns on popolive.users...');
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'popolive' 
      AND table_name = 'users' 
      AND column_name IN ('is_face_verified', 'face_verified_at', 'live_cover_url', 'wealth_level', 'go_live_eligible')
  `);
  console.log('Found columns:', res.rows.map(r => `${r.column_name} (${r.data_type})`));

  console.log('Validating face_verification_logs table...');
  const logsRes = await client.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema='popolive' AND table_name='face_verification_logs'
  `);
  console.log('Found tables:', logsRes.rows.map(r => r.table_name));

  await client.end();
  console.log('Migration 017 applied successfully!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
