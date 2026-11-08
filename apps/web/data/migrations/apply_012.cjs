const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function main() {
  let envDbUrl = process.env.DATABASE_URL;
  if (!envDbUrl) {
    const envLocal = path.join(__dirname, '..', '..', '.env.local');
    const envProd = path.join(__dirname, '..', '..', '.env.production');
    const envFile = fs.existsSync(envLocal) ? envLocal : (fs.existsSync(envProd) ? envProd : null);
    if (envFile) {
      const lines = fs.readFileSync(envFile, 'utf8').split('\n');
      for (const line of lines) {
        if (line.startsWith('DATABASE_URL=')) {
          envDbUrl = line.substring('DATABASE_URL='.length).trim();
          break;
        }
      }
    }
  }
  const defaultLocalUrl = 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';
  const connectionString = envDbUrl || defaultLocalUrl;
  const pool = new Pool({ connectionString });

  console.log('Connecting to PostgreSQL to apply Migration 012...');
  const sql = fs.readFileSync(path.join(__dirname, '012_discovery_banners_and_clicks.sql'), 'utf8');
  await pool.query(sql);
  console.log('Migration 012 tables and initial banners applied successfully.');

  const banners = await pool.query('SELECT count(*) FROM popolive.discovery_banners');
  console.log('Active discovery banners count:', banners.rows[0].count);

  await pool.end();
}

main().catch(err => {
  console.error('Migration 012 error:', err);
  process.exit(1);
});
