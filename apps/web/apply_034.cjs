const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function applyMigration() {
  console.log('Connecting to database for Migration 034...');
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, 'data', 'migrations', '034_party_rules_and_acceptance.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing Migration 034: Party Rules and Acceptance...');
    await client.query(sql);

    // Verify party_rules table
    const rulesRes = await client.query(`
      SELECT id, title, icon, is_mandatory, display_order, policy_version 
      FROM popolive.party_rules 
      ORDER BY display_order ASC;
    `);
    console.log(`Found ${rulesRes.rows.length} seeded party rules:`);
    rulesRes.rows.forEach(r => console.log(` - [${r.display_order}] (${r.icon}) ${r.title} [${r.policy_version}]`));

    // Verify party_rule_acceptances table
    const accRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'party_rule_acceptances';
    `);
    console.log('party_rule_acceptances columns:', accRes.rows.map(c => c.column_name));

    // Verify party_rule_violations table
    const violRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'party_rule_violations';
    `);
    console.log('party_rule_violations columns:', violRes.rows.map(c => c.column_name));

    // Verify active_rules_version on party_rooms
    const roomCol = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'party_rooms' AND column_name = 'active_rules_version';
    `);
    console.log('party_rooms active_rules_version column exists:', roomCol.rows.length > 0);

    // Ensure room 7001 has active_rules_version set
    await client.query(`
      UPDATE popolive.party_rooms
      SET active_rules_version = 'v1.0'
      WHERE room_number = '7001';
    `);
    console.log('Updated room 7001 active_rules_version to v1.0');

    console.log('Migration 034 applied successfully!');
  } catch (err) {
    console.error('Migration 034 failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
