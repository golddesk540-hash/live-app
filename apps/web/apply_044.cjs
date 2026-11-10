const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function applyMigration044() {
  const client = await pool.connect();
  try {
    console.log('Connecting to database...');
    console.log('Executing Migration 044: PK Battle Hand-off to Real Gifts...');

    const sqlPath = path.join(__dirname, 'data', 'migrations', '044_pk_real_gifts.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query('SET search_path TO popolive, public;');
    await client.query(sql);

    console.log('Validating Gift Catalog...');
    const gifts = await client.query(`
      SELECT id, name, name_ur, coin_price, currency_icon 
      FROM popolive.pk_gift_catalog 
      ORDER BY display_order ASC;
    `);
    console.log('Seeded PK Gifts:', gifts.rows);

    console.log('Validating User Wallets...');
    const wallets = await client.query(`
      SELECT user_id, coins, diamond_points 
      FROM popolive.user_wallets
      WHERE user_id = 'user_viewer_9001';
    `);
    console.log('Demo Viewer Wallet (3,600 coins):', wallets.rows);

    console.log('Migration 044 applied successfully!');
  } catch (err) {
    console.error('Migration 044 error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration044();
