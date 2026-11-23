const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive' });

async function check() {
  const r = await pool.query(`SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'popolive.gift_realtime_events'::regclass`);
  console.log(r.rows);
  await pool.end();
}
check().catch(console.error);
