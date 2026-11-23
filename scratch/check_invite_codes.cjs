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
      WHERE schemaname = 'popolive' AND tablename = 'user_invite_codes';
    `);
    console.log('user_invite_codes indexes:');
    res.rows.forEach(r => console.log(r.indexdef));

    const constrs = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      JOIN pg_class cl ON cl.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = cl.relnamespace
      WHERE n.nspname = 'popolive' AND cl.relname = 'user_invite_codes';
    `);
    console.log('\nuser_invite_codes constraints:');
    constrs.rows.forEach(r => console.log(`- ${r.conname}: ${r.def}`));
  } finally {
    client.release();
    await pool.end();
  }
}

check().catch(console.error);
