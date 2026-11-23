const fs = require('fs');
const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });
const sqlPath = path.resolve(__dirname, '../apps/web/data/migrations/060_agent_earnings_coin_seller_withdrawals.sql');
let sql = fs.readFileSync(sqlPath, 'utf8');

const target = `  SELECT id INTO v_zara_id FROM popolive.users WHERE email = 'zara.live@popolive.com' OR nickname = 'Zara Live' LIMIT 1;`;
const replacement = `  SELECT user_id INTO v_zara_id FROM popolive.agent_profiles WHERE agency_id = v_agency_id LIMIT 1;
  IF v_zara_id IS NULL THEN
    SELECT id INTO v_zara_id FROM popolive.users WHERE email = 'zara.live@popolive.com' OR nickname = 'Zara Live' LIMIT 1;
  END IF;`;

const patchedSql = sql.replace(target, replacement);

async function test() {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO popolive, public;');
    await client.query('BEGIN;');
    await client.query(patchedSql);
    await client.query('ROLLBACK;');
    console.log('[SUCCESS] 060 executes perfectly with patch!');
  } finally {
    client.release();
    await pool.end();
  }
}

test().catch(err => {
  console.error('[FAIL]', err);
  process.exit(1);
});
