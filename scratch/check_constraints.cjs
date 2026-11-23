const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function checkConstraints() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      JOIN pg_class cl ON cl.oid = c.conrelid
      WHERE n.nspname = 'popolive' 
        AND cl.relname IN ('coin_transactions', 'points_transactions');
    `);
    console.log('Constraints on coin_transactions and points_transactions:');
    res.rows.forEach(r => console.log(`- [${r.conname}]: ${r.def}`));
  } finally {
    client.release();
    await pool.end();
  }
}

checkConstraints().catch(console.error);
