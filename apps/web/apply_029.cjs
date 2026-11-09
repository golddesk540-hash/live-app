const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function applyMigration() {
  console.log('Connecting to database for Migration 029...');
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, 'data', 'migrations', '029_party_seat_sound_camera.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing Migration 029: Sound and Camera on a Seat...');
    await client.query(sql);

    // Validate columns
    const seatCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'party_seats'
      ORDER BY ordinal_position;
    `);
    console.log('Found party_seats columns:', seatCols.rows.map(r => `${r.column_name} (${r.data_type})`));

    // Check Room 7001 seats
    const room7001Seats = await client.query(`
      SELECT seat_number, participant_name, is_host, is_muted, is_camera_on, status 
      FROM popolive.party_seats 
      WHERE room_number = '7001'
      ORDER BY seat_number;
    `);
    console.log('Room 7001 seats:', room7001Seats.rows);

    console.log('Migration 029 applied successfully!');
  } catch (err) {
    console.error('Migration 029 failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
