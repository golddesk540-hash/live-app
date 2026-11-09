const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function applyMigration() {
  console.log('Connecting to database for Migration 032...');
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, 'data', 'migrations', '032_party_order_and_closing.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing Migration 032: Party Order and Closing...');
    await client.query(sql);

    // Verify columns on party_rooms
    const colsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' 
        AND table_name = 'party_rooms' 
        AND column_name IN ('closed_at', 'closed_by', 'closing_reason');
    `);
    console.log('party_rooms new columns:', colsRes.rows);

    // Verify party_closing_logs table
    const tableRes1 = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'popolive' AND table_name = 'party_closing_logs';
    `);
    console.log('party_closing_logs exists:', tableRes1.rows.length > 0);

    // Verify party_seat_reorder_logs table
    const tableRes2 = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'popolive' AND table_name = 'party_seat_reorder_logs';
    `);
    console.log('party_seat_reorder_logs exists:', tableRes2.rows.length > 0);

    console.log('Migration 032 applied successfully!');
  } catch (err) {
    console.error('Migration 032 failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
