const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

const candidateTables = [
  'user_friends',
  'profile_visits',
  'guardians',
  'medal_catalog',
  'user_medals',
  'redeem_codes',
  'redeem_history',
  'redeem_redemptions',
  'live_room_history',
  'user_invite_codes',
  'user_follows',
  'medals',
  'invitations',
  'user_invitations'
];

async function check() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'popolive' 
        AND table_name = ANY($1)
      ORDER BY table_name;
    `, [candidateTables]);

    const existing = res.rows.map(r => r.table_name);
    console.log('--- EXISTING CANDIDATE TABLES IN POPOLIVE ---');
    console.log(existing);

    console.log('\n--- MISSING CANDIDATE TABLES ---');
    const missing = candidateTables.filter(t => !existing.includes(t));
    console.log(missing);

    // For existing tables, print their column structure
    for (const t of existing) {
      const cols = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'popolive' AND table_name = $1
        ORDER BY ordinal_position;
      `, [t]);
      console.log(`\nColumns of popolive.${t}:`);
      console.table(cols.rows);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

check().catch(console.error);
