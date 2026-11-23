const { Pool } = require('../apps/web/node_modules/pg');
const pool = new Pool({ connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive' });

async function run() {
  const c1 = await pool.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'popolive' AND table_name = 'party_seats'");
  console.log('party_seats columns:', c1.rows.map(r => `${r.column_name} (${r.data_type})`));

  const c2 = await pool.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'popolive' AND table_name = 'party_seat_requests'");
  console.log('party_seat_requests columns:', c2.rows.map(r => `${r.column_name} (${r.data_type})`));

  const c3 = await pool.query("SELECT conname, contype, pg_get_constraintdef(c.oid) FROM pg_constraint c WHERE conrelid = 'popolive.party_seats'::regclass");
  console.log('party_seats constraints:', c3.rows);

  const c4 = await pool.query("SELECT conname, contype, pg_get_constraintdef(c.oid) FROM pg_constraint c WHERE conrelid = 'popolive.party_seat_requests'::regclass");
  console.log('party_seat_requests constraints:', c4.rows);

  await pool.end();
}

run().catch(console.error);
