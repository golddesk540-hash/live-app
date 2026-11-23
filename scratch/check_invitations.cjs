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
      WHERE schemaname = 'popolive' AND tablename = 'invitations';
    `);
    console.log('invitations indexes:');
    res.rows.forEach(r => console.log(r.indexdef));
  } finally {
    client.release();
    await pool.end();
  }
}

check().catch(console.error);
