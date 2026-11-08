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

  console.log('Connecting to PostgreSQL to apply Migration 011...');
  const sql = fs.readFileSync(path.join(__dirname, '011_room_cards_indexes_and_states.sql'), 'utf8');
  await pool.query(sql);
  console.log('Migration 011 definitions and tags applied successfully.');

  // Check if we have an offline test room
  const offlineCheck = await pool.query("SELECT id FROM popolive.live_rooms WHERE status = 'offline' LIMIT 1");
  if (offlineCheck.rows.length === 0) {
    const anyHost = await pool.query("SELECT id, country, country_code FROM popolive.users LIMIT 1");
    if (anyHost.rows.length > 0) {
      const host = anyHost.rows[0];
      await pool.query(`
        INSERT INTO popolive.live_rooms (
          room_number, host_id, title, cover_url, category, status, is_live, viewer_count, country, country_code, tags
        ) VALUES (
          '999901', $1, 'Offline Lounge & Relax ☕', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
          'chat', 'offline', false, 0, $2, $3, ARRAY['Offline', 'Chill', 'Lounge']
        ) ON CONFLICT (room_number) DO NOTHING
      `, [host.id, host.country || 'Pakistan', host.country_code || 'PK']);
      console.log('Created offline sample room: 999901');
    }
  }

  // Check if we have an ended test room
  const endedCheck = await pool.query("SELECT id FROM popolive.live_rooms WHERE status = 'ended' LIMIT 1");
  if (endedCheck.rows.length === 0) {
    const anyHost = await pool.query("SELECT id, country, country_code FROM popolive.users LIMIT 1");
    if (anyHost.rows.length > 0) {
      const host = anyHost.rows[0];
      await pool.query(`
        INSERT INTO popolive.live_rooms (
          room_number, host_id, title, cover_url, category, status, is_live, viewer_count, country, country_code, tags, ended_at
        ) VALUES (
          '999902', $1, 'Morning Broadcast (Broadcast Ended) 🌅', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
          'live', 'ended', false, 0, $2, $3, ARRAY['Live', 'Morning', 'Ended'], CURRENT_TIMESTAMP
        ) ON CONFLICT (room_number) DO NOTHING
      `, [host.id, host.country || 'Pakistan', host.country_code || 'PK']);
      console.log('Created ended sample room: 999902');
    }
  }

  const liveRooms = await pool.query("SELECT count(*) FROM popolive.live_rooms WHERE is_live = true AND status = 'live'");
  const offlineRooms = await pool.query("SELECT count(*) FROM popolive.live_rooms WHERE status = 'offline'");
  const endedRooms = await pool.query("SELECT count(*) FROM popolive.live_rooms WHERE status = 'ended'");

  console.log(`Summary: ${liveRooms.rows[0].count} live rooms, ${offlineRooms.rows[0].count} offline rooms, ${endedRooms.rows[0].count} ended rooms.`);
  await pool.end();
}

main().catch(err => {
  console.error('Migration 011 error:', err);
  process.exit(1);
});
