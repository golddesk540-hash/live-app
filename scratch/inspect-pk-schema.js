const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive' });

async function check() {
  const tables = ['pk_battles', 'pk_score_events', 'pk_gift_transactions', 'pk_gift_catalog'];
  for (const t of tables) {
    const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'popolive' AND table_name = $1 ORDER BY ordinal_position`, [t]);
    console.log(`=== ${t} ===`);
    console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
  }
  await pool.end();
}
check().catch(console.error);
