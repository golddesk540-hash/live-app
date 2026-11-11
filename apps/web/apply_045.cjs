const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function applyMigration045() {
  const client = await pool.connect();
  try {
    console.log('Connecting to database...');
    console.log('Executing Migration 045: Coins and Points Management System...');

    const sqlPath = path.join(__dirname, 'data', 'migrations', '045_coins_and_points_system.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query('SET search_path TO popolive, public;');
    await client.query(sql);

    console.log('Validating Finance Rules...');
    const rules = await client.query(`
      SELECT rule_key, rule_value, description
      FROM popolive.finance_rules
      ORDER BY rule_key ASC;
    `);
    console.log('Finance Rules:', rules.rows);

    console.log('Validating Demo Wallet user_wallet_demo_701 (12,500 Coins | 8,420 Points)...');
    const wallets = await client.query(`
      SELECT wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points
      FROM popolive.user_wallets
      WHERE user_id = 'user_wallet_demo_701';
    `);
    console.log('Seeded Demo Wallet:', wallets.rows);

    console.log('Validating Coin & Points Transactions...');
    const cCount = await client.query(`SELECT COUNT(*) FROM popolive.coin_transactions WHERE user_id = 'user_wallet_demo_701';`);
    const pCount = await client.query(`SELECT COUNT(*) FROM popolive.points_transactions WHERE host_user_id = 'user_wallet_demo_701';`);
    console.log(`Seeded Coin Txns: ${cCount.rows[0].count}, Points Txns: ${pCount.rows[0].count}`);

    console.log('Migration 045 applied successfully!');
  } catch (err) {
    console.error('Migration 045 error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration045();
