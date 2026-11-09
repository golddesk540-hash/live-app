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

  console.log('Connecting to PostgreSQL to apply Migration 013...');
  const sql = fs.readFileSync(path.join(__dirname, '013_party_rooms_discovery.sql'), 'utf8');
  await pool.query(sql);
  console.log('Migration 013 party_rooms table applied and seeded successfully.');

  const res = await pool.query('SELECT room_number, title, current_members, max_members FROM popolive.party_rooms ORDER BY display_order');
  console.log('Active Party Rooms:', res.rows);

  await pool.end();
}

main().catch(err => {
  console.error('Migration 013 error:', err);
  process.exit(1);
});
