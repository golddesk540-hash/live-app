const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public',
});

async function main() {
  const users = await pool.query(`SELECT id, nickname, role FROM popolive.users LIMIT 5`);
  console.log('USERS:', users.rows);
  const rooms = await pool.query(`SELECT id, room_number, host_id, title, status FROM popolive.live_rooms LIMIT 5`);
  console.log('ROOMS:', rooms.rows);
  const battles = await pool.query(`SELECT id, battle_type, status, host_a_id, host_b_id, host_a_score, host_b_score FROM popolive.pk_battles LIMIT 5`);
  console.log('BATTLES:', battles.rows);
  const pkGifts = await pool.query(`SELECT id, name, coin_price, is_active FROM popolive.pk_gift_catalog LIMIT 5`);
  console.log('PK GIFTS:', pkGifts.rows);
  await pool.end();
}
main().catch(console.error);
