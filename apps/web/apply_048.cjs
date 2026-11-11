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
    const sql = fs.readFileSync(
      path.join(__dirname, 'data', 'migrations', '048_animations_and_host_entrances.sql'),
      'utf8'
    );
    await pool.query(sql);
    console.log('Migration 048 applied successfully!');
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Migration 048 failed:', err);
  process.exit(1);
});
