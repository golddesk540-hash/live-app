const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function applyMigration() {
  console.log('Connecting to database for Migration 033...');
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, 'data', 'migrations', '033_party_limits_and_protection.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing Migration 033: Limits that Protect the Room...');
    await client.query(sql);

    // Verify columns on party_rooms
    const colsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' 
        AND table_name = 'party_rooms' 
        AND column_name IN ('max_audience', 'allow_join_requests', 'is_invite_only', 'is_locked', 'seats_layout');
    `);
    console.log('party_rooms limits columns:', colsRes.rows);

    // Verify party_limits_logs table
    const tableRes = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'popolive' AND table_name = 'party_limits_logs';
    `);
    console.log('party_limits_logs exists:', tableRes.rows.length > 0);

    // Seed/Update reference room 7001 with default limits
    await client.query(`
      UPDATE popolive.party_rooms
      SET max_audience = 1000,
          allow_join_requests = true,
          is_invite_only = false,
          is_locked = false,
          seats_layout = '9 (3x3)',
          limits_updated_at = NOW(),
          limits_updated_by = 'host_maria'
      WHERE room_number = '7001';
    `);
    console.log('Updated room 7001 default limits.');

    console.log('Migration 033 applied successfully!');
  } catch (err) {
    console.error('Migration 033 failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
