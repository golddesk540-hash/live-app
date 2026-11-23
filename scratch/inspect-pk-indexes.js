const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive' });

async function check() {
  const indexes = await pool.query(`
    SELECT tablename, indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname = 'popolive' 
      AND tablename IN ('pk_battles', 'pk_score_events', 'pk_gift_transactions')
  `);
  console.log('INDEXES:');
  for (const r of indexes.rows) {
    console.log(`${r.tablename}.${r.indexname}: ${r.indexdef}`);
  }
  await pool.end();
}
check().catch(console.error);
