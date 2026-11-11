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
    console.log('Executing Migration 052: Wealth, Shining and Honor System...');
    const sql = fs.readFileSync(
      path.join(__dirname, 'data', 'migrations', '052_wealth_shining_honor_system.sql'),
      'utf8'
    );
    await pool.query(sql);

    const levels = await pool.query(
      `SELECT category, count(*)::int AS cnt FROM popolive.recognition_levels WHERE is_active = TRUE GROUP BY category ORDER BY category`
    );
    const benefits = await pool.query(
      `SELECT count(*)::int AS cnt FROM popolive.recognition_benefits WHERE is_active = TRUE`
    );
    const factors = await pool.query(
      `SELECT count(*)::int AS cnt FROM popolive.honor_recognition_factors WHERE is_active = TRUE`
    );
    console.log(
      'Migration 052 applied successfully!',
      'Levels:',
      levels.rows,
      'Benefits:',
      benefits.rows[0].cnt,
      'Honor Factors:',
      factors.rows[0].cnt
    );
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Migration 052 failed:', err);
  process.exit(1);
});
