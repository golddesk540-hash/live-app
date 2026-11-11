const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function getDatabaseUrl() {
  const candidates = [
    process.env.DATABASE_URL,
    ...['.env.production', '.env.local', '.env'].map((file) => {
      const p = path.join(__dirname, file);
      if (!fs.existsSync(p)) return null;
      const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
      const match = lines.find((line) => line.startsWith('DATABASE_URL='));
      return match ? match.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '') : null;
    }),
  ];
  return (
    candidates.find(Boolean) ||
    'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive'
  );
}

async function run() {
  const pool = new Pool({ connectionString: getDatabaseUrl() });
  try {
    console.log('Executing Migration 053: Virtual Store System...');
    const sql = fs.readFileSync(
      path.join(__dirname, 'data', 'migrations', '053_virtual_store_system.sql'),
      'utf8'
    );
    await pool.query(sql);

    const cats = await pool.query(
      `SELECT count(*)::int AS cnt FROM popolive.store_categories WHERE is_active = TRUE AND is_approved = TRUE`
    );
    const items = await pool.query(
      `SELECT count(*)::int AS cnt FROM popolive.store_items WHERE is_active = TRUE AND is_approved = TRUE`
    );
    console.log(
      'Migration 053 applied successfully!',
      'Categories:',
      cats.rows[0].cnt,
      'Store Items:',
      items.rows[0].cnt
    );
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Migration 053 failed:', err);
  process.exit(1);
});
