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

    const sqlPath = path.join(__dirname, 'data', 'migrations', '027_party_seat_grid.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing Migration 027: Nine-Seat Party Grid...');
    await client.query(sql);

    console.log('Validating table popolive.party_seats...');
    const seatsRes = await client.query(`
      SELECT room_number, seat_number, participant_name, is_host, status 
      FROM popolive.party_seats 
      WHERE room_number = '7001'
      ORDER BY seat_number ASC;
    `);
    console.log('Seeded room 7001 seats:', seatsRes.rows);

    const seatCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'party_seats';
    `);
    console.log('Found party_seats columns:', seatCols.rows.map(r => `${r.column_name} (${r.data_type})`));

    console.log('Migration 027 applied successfully!');
  } catch (err) {
    console.error('Error applying migration 027:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
