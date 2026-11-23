const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));
const pool = new Pool({
  connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public',
});

async function main() {
  const indexes = await pool.query(`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname = 'popolive' AND tablename = 'live_rooms';
  `);
  console.log('live_rooms indexes:');
  for (const row of indexes.rows) {
    console.log(` - ${row.indexname}: ${row.indexdef}`);
  }

  const sampleRooms = await pool.query(`
    SELECT id, room_number, title, country, country_code, status, is_live
    FROM popolive.live_rooms
    LIMIT 5;
  `);
  console.log('\nSample rooms:');
  console.log(sampleRooms.rows);

  await pool.end();
}

main().catch(console.error);
