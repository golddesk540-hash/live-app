const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function run() {
  console.log('Connecting to PostgreSQL database...');
  const client = await pool.connect();
  try {
    console.log('Applying Migration 008...');
    const sql = fs.readFileSync(path.join(__dirname, '008_web_account_activity_events.sql'), 'utf-8');
    await client.query(sql);
    console.log('[SUCCESS] Migration 008 applied successfully.');
  } catch (err) {
    console.error('Migration 008 failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
