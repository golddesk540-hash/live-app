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
    console.log('Executing Migration 054: Complete Receipts & Finance Export System...');
    const sql = fs.readFileSync(
      path.join(__dirname, 'data', 'migrations', '054_receipts_finance_export.sql'),
      'utf8'
    );
    await pool.query(sql);

    const rcpts = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM popolive.financial_receipts`
    );
    const audits = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM popolive.finance_export_audit_logs`
    );
    console.log(
      'Migration 054 applied successfully!',
      'Receipts Backfilled:',
      rcpts.rows[0].cnt,
      'Export Audits:',
      audits.rows[0].cnt
    );
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Migration 054 failed:', err);
  process.exit(1);
});
