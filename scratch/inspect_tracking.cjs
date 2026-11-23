const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function inspect() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name ILIKE '%migrat%' OR table_name ILIKE '%version%' OR table_name ILIKE '%changelog%';
    `);
    console.log('Matching migration/version tables across DB:', res.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

inspect().catch(console.error);
