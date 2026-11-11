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
    'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads'
  );
}

async function run() {
  const pool = new Pool({ connectionString: getDatabaseUrl() });
  try {
    console.log('Executing Migration 051: VIP Membership System...');
    const sql = fs.readFileSync(
      path.join(__dirname, 'data', 'migrations', '051_vip_membership_system.sql'),
      'utf8'
    );
    await pool.query(sql);

    const plans = await pool.query('SELECT count(*)::int AS cnt FROM popolive.vip_plans WHERE is_active = true');
    const benefits = await pool.query('SELECT count(*)::int AS cnt FROM popolive.vip_benefit_catalog WHERE is_active = true');
    const records = await pool.query('SELECT count(*)::int AS cnt FROM popolive.vip_membership_records');
    console.log(
      `Migration 051 applied successfully! Active VIP Plans: ${plans.rows[0].cnt}, Benefits: ${benefits.rows[0].cnt}, Seeded VIP Records: ${records.rows[0].cnt}`
    );
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Migration 051 failed:', err);
  process.exit(1);
});
