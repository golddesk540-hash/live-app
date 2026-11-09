const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';
  console.log('Connecting to database...');
  const client = new Client({ connectionString });
  await client.connect();

  const sqlPath = path.join(__dirname, 'data', 'migrations', '018_pre_live_categories_and_setup.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Executing Migration 018: Pre-Live Categories and Setup...');
  await client.query(sql);

  console.log('Validating categories in popolive.live_categories...');
  const res = await client.query(`SELECT id, name, display_order FROM popolive.live_categories ORDER BY display_order ASC`);
  console.log('Seeded categories:', res.rows);

  await client.end();
  console.log('Migration 018 applied successfully!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
