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

  console.log('Connecting to PostgreSQL to apply Migration 015...');
  const sql = fs.readFileSync(path.join(__dirname, '015_following_live_notifications_and_seed.sql'), 'utf8');
  await pool.query(sql);
  console.log('Migration 015 applied successfully.');

  const res = await pool.query("SELECT nickname, poppo_id, avatar_url FROM popolive.users WHERE nickname IN ('Zara Live', 'Sana Khan', 'Alina', 'Mehak')");
  console.log('Seeded Following Users:', res.rows);

  const roomsRes = await pool.query("SELECT title, room_number, viewer_count FROM popolive.live_rooms WHERE room_number IN ('100220', '100221', '100223', '100224')");
  console.log('Seeded Following Rooms:', roomsRes.rows);

  await pool.end();
}

main().catch(err => {
  console.error('Migration 015 error:', err);
  process.exit(1);
});
