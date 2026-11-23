const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function checkUsers() {
  const client = await pool.connect();
  try {
    const existingAgent = await client.query(`
      SELECT u.id, u.nickname, u.email, ap.agency_id, ap.role, ap.is_coin_seller, ap.status
      FROM popolive.agent_profiles ap
      JOIN popolive.users u ON u.id = ap.user_id
      WHERE ap.agency_id = 'a1111111-1111-1111-1111-111111111111';
    `);
    console.log('Existing agent for agency a1111111-1111-1111-1111-111111111111:');
    console.log(existingAgent.rows);

    const zaraUser = await client.query(`
      SELECT id, nickname, email FROM popolive.users 
      WHERE email = 'zara.live@popolive.com' OR nickname = 'Zara Live';
    `);
    console.log('\nZara user:');
    console.log(zaraUser.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsers().catch(console.error);
