const fs = require('fs');
const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });
const migrationsDir = path.resolve(__dirname, '../apps/web/data/migrations');

// Read 058 and 060
let sql058 = fs.readFileSync(path.join(migrationsDir, '058_host_tasks_levels_pack_identity.sql'), 'utf8');
let sql060 = fs.readFileSync(path.join(migrationsDir, '060_agent_earnings_coin_seller_withdrawals.sql'), 'utf8');

// Replace with superset
const patched058 = sql058.replace(
  "ARRAY['gift_earned', 'pk_gift_earned', 'admin_credit', 'admin_debit', 'reversal', 'task_reward', 'starter_pack']",
  "ARRAY['gift_earned', 'pk_gift_earned', 'admin_credit', 'admin_debit', 'reversal', 'task_reward', 'starter_pack', 'agent_commission', 'withdrawal_debit', 'withdrawal_refund']"
);

const patched060 = sql060.replace(
  "ARRAY['topup', 'gift_sent', 'admin_credit', 'admin_debit', 'reversal', 'initial_credit', 'feature_spend', 'seller_sale', 'seller_purchase', 'seller_transfer']",
  "ARRAY['topup', 'gift_sent', 'admin_credit', 'admin_debit', 'reversal', 'initial_credit', 'feature_spend', 'seller_sale', 'seller_purchase', 'seller_transfer', 'vip_subscribe', 'withdrawal', 'task_reward', 'earning_credit']"
);

async function testPatched() {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO popolive, public;');

    console.log('Testing patched 058 in transaction...');
    await client.query('BEGIN;');
    await client.query(patched058);
    await client.query('ROLLBACK;');
    console.log('[SUCCESS] Patched 058 executed cleanly!');

    console.log('Testing patched 060 in transaction...');
    await client.query('BEGIN;');
    await client.query(patched060);
    await client.query('ROLLBACK;');
    console.log('[SUCCESS] Patched 060 executed cleanly!');
  } finally {
    client.release();
    await pool.end();
  }
}

testPatched().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
