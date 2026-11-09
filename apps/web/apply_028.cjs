const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function applyMigration() {
  console.log('Connecting to database for Migration 028...');
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, 'data', 'migrations', '028_party_seat_requests_invitations.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing Migration 028: Taking a Seat (Request / Invite)...');
    await client.query(sql);

    // Validate tables
    const reqCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'party_seat_requests'
      ORDER BY ordinal_position;
    `);
    console.log('Found party_seat_requests columns:', reqCols.rows.map(r => `${r.column_name} (${r.data_type})`));

    const invCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'party_seat_invitations'
      ORDER BY ordinal_position;
    `);
    console.log('Found party_seat_invitations columns:', invCols.rows.map(r => `${r.column_name} (${r.data_type})`));

    console.log('Migration 028 applied successfully!');
  } catch (err) {
    console.error('Migration 028 failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
