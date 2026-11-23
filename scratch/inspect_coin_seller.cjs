const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function check() {
  const client = await pool.connect();
  try {
    const indexes = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'popolive' AND tablename = 'agent_profiles';
    `);
    console.log('INDEXES on agent_profiles:');
    console.log(indexes.rows);

    const rows = await client.query(`
      SELECT id, user_id, agency_id, role, is_coin_seller, status 
      FROM popolive.agent_profiles;
    `);
    console.log('\nROWS in agent_profiles:');
    console.table(rows.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

check().catch(console.error);
