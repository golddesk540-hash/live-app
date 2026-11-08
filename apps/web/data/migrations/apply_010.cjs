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

  console.log('Connecting to PostgreSQL to apply Migration 010...');
  const sql = fs.readFileSync(path.join(__dirname, '010_live_rooms_and_pk_activities.sql'), 'utf8');
  await pool.query(sql);
  console.log('Migration 010 table definitions applied successfully.');

  // Check if live rooms already exist
  const roomCount = await pool.query('SELECT count(*) FROM popolive.live_rooms');
  console.log('Existing rooms:', roomCount.rows[0].count);

  if (parseInt(roomCount.rows[0].count, 10) === 0) {
    console.log('Seeding initial verified active live rooms for existing registered users...');
    
    // Fetch registered users
    const usersRes = await pool.query(`
      SELECT id, poppo_id, nickname, country, country_code, avatar_url 
      FROM popolive.users 
      WHERE status = 'active' 
      ORDER BY created_at ASC 
      LIMIT 12
    `);

    const users = usersRes.rows;
    if (users.length >= 2) {
      // Stream titles and cover templates
      const roomTemplates = [
        { title: 'Late Night Talk Show & Songs 🎵', category: 'live', is_pk: false, viewers: 24200, coins: 28100, cover: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80' },
        { title: 'VIP Party Room Open! Join Mic 🎙️', category: 'party', is_pk: false, viewers: 16400, coins: 16000, cover: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80' },
        { title: 'Chit-Chat & Acoustic Vibes 🎸', category: 'live', is_pk: false, viewers: 892, coins: 725, cover: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80' },
        { title: 'Weekend Special Stream with Friends ✨', category: 'live', is_pk: false, viewers: 725, coins: 725, cover: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80' },
        { title: 'Super PK Championship Match 🏆', category: 'pk', is_pk: true, viewers: 35000, coins: 82000, cover: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80' },
        { title: 'Singing & Dancing Challenge 💃', category: 'live', is_pk: false, viewers: 12500, coins: 14300, cover: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80' },
        { title: 'Voice Party & Storytelling 🌙', category: 'party', is_pk: false, viewers: 4300, coins: 3900, cover: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=600&auto=format&fit=crop&q=80' },
        { title: 'PK Arena: Pakistan vs UAE Battle ⚔️', category: 'pk', is_pk: true, viewers: 18900, coins: 49000, cover: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&auto=format&fit=crop&q=80' }
      ];

      for (let i = 0; i < Math.min(users.length, roomTemplates.length); i++) {
        const u = users[i];
        const tmpl = roomTemplates[i];
        const roomNumber = (100000 + i * 17).toString();
        
        const insRoom = await pool.query(`
          INSERT INTO popolive.live_rooms (
            room_number, host_id, title, cover_url, category, status, is_live, is_pk,
            viewer_count, coins_earned, country, country_code, tags, stream_key
          ) VALUES (
            $1, $2, $3, $4, $5, 'live', true, $6,
            $7, $8, $9, $10, ARRAY['Live', $11], $12
          ) RETURNING id
        `, [
          roomNumber,
          u.id,
          tmpl.title,
          tmpl.cover,
          tmpl.category,
          tmpl.is_pk,
          tmpl.viewers,
          tmpl.coins,
          u.country || 'Pakistan',
          u.country_code || 'PK',
          u.country || 'Pakistan',
          `stream_${roomNumber}_key`
        ]);

        const roomId = insRoom.rows[0].id;

        // If PK room, link a real PK activity
        if (tmpl.is_pk && users.length > i + 1) {
          const opponent = users[(i + 1) % users.length];
          const pkIns = await pool.query(`
            INSERT INTO popolive.pk_activities (
              room_id, host_a_id, host_b_id, title, status, host_a_votes, host_b_votes,
              host_a_points, host_b_points, viewer_count, started_at
            ) VALUES (
              $1, $2, $3, $4, 'active', 1420, 1180, 52000, 48500, $5, CURRENT_TIMESTAMP - INTERVAL '12 minutes'
            ) RETURNING id
          `, [
            roomId,
            u.id,
            opponent.id,
            tmpl.title,
            tmpl.viewers
          ]);

          await pool.query('UPDATE popolive.live_rooms SET current_pk_id = $1 WHERE id = $2', [
            pkIns.rows[0].id,
            roomId
          ]);
        }
      }

      // Also create an upcoming PK and a completed PK for PK tab statuses
      if (users.length >= 4) {
        await pool.query(`
          INSERT INTO popolive.pk_activities (
            host_a_id, host_b_id, title, status, host_a_votes, host_b_votes,
            host_a_points, host_b_points, viewer_count, started_at
          ) VALUES (
            $1, $2, 'Grand Champion Final PK 🏆', 'upcoming', 0, 0, 0, 0, 0, CURRENT_TIMESTAMP + INTERVAL '2 hours'
          )
        `, [users[0].id, users[2].id]);

        await pool.query(`
          INSERT INTO popolive.pk_activities (
            host_a_id, host_b_id, title, status, host_a_votes, host_b_votes,
            host_a_points, host_b_points, viewer_count, started_at, ended_at
          ) VALUES (
            $1, $2, 'Morning Speed PK Clash ⚡', 'completed', 3400, 2900, 120000, 98000, 4200, CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '3 hours'
          )
        `, [users[1].id, users[3].id]);
      }

      // Establish follow relationship from user[0] to user[1], user[2], user[3] so Following tab has rich data
      for (let j = 1; j <= 3; j++) {
        if (users[j]) {
          await pool.query(`
            INSERT INTO popolive.user_follows (follower_id, following_id)
            VALUES ($1, $2)
            ON CONFLICT (follower_id, following_id) DO NOTHING
          `, [users[0].id, users[j].id]);
        }
      }

      console.log('✅ Seeded live rooms, PK activities, and follow relationships successfully!');
    }
  }

  await pool.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
