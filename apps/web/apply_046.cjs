const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const dbUrl =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

async function main() {
  const pool = new Pool({ connectionString: dbUrl });
  const sqlPath = path.join(__dirname, 'data', 'migrations', '046_virtual_gift_catalog.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Executing Migration 046: Module 7.2 Virtual Gift Catalog...');
  await pool.query(sql);

  const cats = await pool.query(
    `SELECT category_id, name, short_name, display_order, is_active
     FROM popolive.gift_categories ORDER BY display_order ASC`
  );
  console.log(`Seeded Gift Categories (${cats.rows.length}):`, cats.rows.map((r) => `${r.display_order}:${r.category_id}`).join(', '));

  const gifts = await pool.query(
    `SELECT gift_id, name, coin_price, category_id, asset_type, is_popular, is_new, is_featured, is_active
     FROM popolive.gift_catalog ORDER BY display_order ASC`
  );
  console.log(`Seeded Virtual Gifts (${gifts.rows.length}):`);
  console.table(gifts.rows);

  console.log('Migration 046 applied successfully!');
  await pool.end();
}

main().catch((err) => {
  console.error('Migration 046 failed:', err);
  process.exit(1);
});
