const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function applyMigration() {
  console.log('Connecting to database for Migration 030...');
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, 'data', 'migrations', '030_party_audience_and_chat.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing Migration 030: Audience and Chat...');
    await client.query(sql);

    // Validate party_audience
    const audRes = await client.query(`
      SELECT user_name, user_level, is_active FROM popolive.party_audience WHERE room_number = '7001';
    `);
    console.log('Party Audience seeded for 7001:', audRes.rows);

    // Validate party_messages
    const msgRes = await client.query(`
      SELECT sender_name, message_text, created_at FROM popolive.party_messages WHERE room_number = '7001' ORDER BY created_at ASC;
    `);
    console.log('Party Messages seeded for 7001:', msgRes.rows);

    console.log('Migration 030 applied successfully!');
  } catch (err) {
    console.error('Migration 030 failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
