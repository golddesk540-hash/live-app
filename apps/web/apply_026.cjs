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

    const sqlPath = path.join(__dirname, 'data', 'migrations', '026_party_creation_and_categories.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing Migration 026: Party Creation & Categories...');
    await client.query(sql);

    console.log('Validating table popolive.party_categories...');
    const catRes = await client.query(`
      SELECT id, name, display_order 
      FROM popolive.party_categories 
      ORDER BY display_order ASC;
    `);
    console.log('Seeded party categories:', catRes.rows);

    console.log('Validating table popolive.party_rooms columns...');
    const roomCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'party_rooms';
    `);
    console.log('Found party_rooms columns:', roomCols.rows.map(r => `${r.column_name} (${r.data_type})`));

    console.log('Migration 026 applied successfully!');
  } catch (err) {
    console.error('Error applying migration 026:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
