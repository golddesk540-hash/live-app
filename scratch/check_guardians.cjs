const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function check() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'popolive' AND tablename = 'guardians';
    `);
    console.log('guardians indexes:');
    res.rows.forEach(r => console.log(r.indexdef));

    const constrs = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      JOIN pg_class cl ON cl.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = cl.relnamespace
      WHERE n.nspname = 'popolive' AND cl.relname = 'guardians';
    `);
    console.log('\nguardians constraints:');
    constrs.rows.forEach(r => console.log(`- ${r.conname}: ${r.def}`));
  } finally {
    client.release();
    await pool.end();
  }
}

check().catch(console.error);
