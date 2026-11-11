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
    console.log('Executing Migration 050: Coins Top-up & Recharge System...');
    const sql = fs.readFileSync(
      path.join(__dirname, 'data', 'migrations', '050_coins_topup_and_recharge.sql'),
      'utf8'
    );
    await pool.query(sql);

    const pkgs = await pool.query('SELECT count(*)::int AS cnt FROM popolive.coin_packages WHERE is_active = true');
    const providers = await pool.query('SELECT count(*)::int AS cnt FROM popolive.payment_provider_configs');
    console.log(`Migration 050 applied successfully! Active packages: ${pkgs.rows[0].cnt}, Providers: ${providers.rows[0].cnt}`);
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Migration 050 failed:', err);
  process.exit(1);
});
