const { Pool } = require('pg');
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
});

async function run() {
  const res = await pool.query(
    "UPDATE popolive.party_rooms SET host_nickname = 'Maria Live', host_avatar = '/assets/studio/host_zara_avatar.png' WHERE room_number = '7001'"
  );
  console.log('Updated room 7001:', res.rowCount);
  await pool.end();
}

run().catch(console.error);
