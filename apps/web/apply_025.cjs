const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

async function applyMigration() {
  const client = new Client({ connectionString });
  try {
    console.log('Connecting to database...');
    await client.connect();

    const sqlPath = path.join(__dirname, 'data', 'migrations', '025_host_rules_on_screen.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing Migration 025: Host Rules on Screen...');
    await client.query(sql);

    console.log('Validating table popolive.host_rules...');
    const rulesRes = await client.query(`
      SELECT id, title, display_order, policy_version 
      FROM popolive.host_rules 
      ORDER BY display_order ASC;
    `);
    console.log('Seeded canonical rules:', rulesRes.rows);

    console.log('Validating table popolive.host_rule_acknowledgements...');
    const ackCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'host_rule_acknowledgements';
    `);
    console.log('Found host_rule_acknowledgements columns:', ackCols.rows.map(r => `${r.column_name} (${r.data_type})`));

    console.log('Validating users columns...');
    const userCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'users' AND column_name LIKE '%host_rules%';
    `);
    console.log('Found users host_rules columns:', userCols.rows.map(r => `${r.column_name} (${r.data_type})`));

    console.log('Migration 025 applied successfully!');
  } catch (err) {
    console.error('Error applying migration 025:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
