const { Client } = require('ssh2');
const conn = new Client();

const seedSql = `
DO $$
DECLARE
  u1 UUID; u2 UUID; u3 UUID; u4 UUID; u5 UUID; u6 UUID;
  r1 UUID; r2 UUID; r3 UUID; r4 UUID; r5 UUID; r6 UUID;
  pk1 UUID; pk2 UUID; pk3 UUID;
BEGIN
  -- 1. Ensure at least 6 active users exist
  INSERT INTO popolive.users (poppo_id, email, password_hash, nickname, avatar_url, gender, birthdate, country, country_code, is_adult_verified, status)
  VALUES ('7889911', 'sara.khan@popolive.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sara Khan', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500', 'female', '1998-05-12', 'Pakistan', 'PK', true, 'active')
  ON CONFLICT (poppo_id) DO UPDATE SET nickname = EXCLUDED.nickname RETURNING id INTO u1;

  INSERT INTO popolive.users (poppo_id, email, password_hash, nickname, avatar_url, gender, birthdate, country, country_code, is_adult_verified, status)
  VALUES ('7889922', 'zaid.star@popolive.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Zaid Star', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500', 'male', '1996-03-22', 'Pakistan', 'PK', true, 'active')
  ON CONFLICT (poppo_id) DO UPDATE SET nickname = EXCLUDED.nickname RETURNING id INTO u2;

  INSERT INTO popolive.users (poppo_id, email, password_hash, nickname, avatar_url, gender, birthdate, country, country_code, is_adult_verified, status)
  VALUES ('7889933', 'maya.uae@popolive.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Maya UAE', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500', 'female', '1999-08-14', 'United Arab Emirates', 'AE', true, 'active')
  ON CONFLICT (poppo_id) DO UPDATE SET nickname = EXCLUDED.nickname RETURNING id INTO u3;

  INSERT INTO popolive.users (poppo_id, email, password_hash, nickname, avatar_url, gender, birthdate, country, country_code, is_adult_verified, status)
  VALUES ('7889944', 'hamza.pro@popolive.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Hamza Pro', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500', 'male', '1995-11-03', 'Pakistan', 'PK', true, 'active')
  ON CONFLICT (poppo_id) DO UPDATE SET nickname = EXCLUDED.nickname RETURNING id INTO u4;

  INSERT INTO popolive.users (poppo_id, email, password_hash, nickname, avatar_url, gender, birthdate, country, country_code, is_adult_verified, status)
  VALUES ('7889955', 'ayesha.live@popolive.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ayesha Live', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500', 'female', '2001-01-20', 'Pakistan', 'PK', true, 'active')
  ON CONFLICT (poppo_id) DO UPDATE SET nickname = EXCLUDED.nickname RETURNING id INTO u5;

  INSERT INTO popolive.users (poppo_id, email, password_hash, nickname, avatar_url, gender, birthdate, country, country_code, is_adult_verified, status)
  VALUES ('7889966', 'elena.vibes@popolive.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Elena Vibes', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500', 'female', '1997-09-17', 'United Kingdom', 'GB', true, 'active')
  ON CONFLICT (poppo_id) DO UPDATE SET nickname = EXCLUDED.nickname RETURNING id INTO u6;

  -- 2. Clear old test rooms and reseed verified discovery rooms
  DELETE FROM popolive.pk_activities;
  DELETE FROM popolive.live_rooms;

  INSERT INTO popolive.live_rooms (room_number, host_id, title, cover_url, category, status, is_live, is_pk, viewer_count, coins_earned, country, country_code, tags)
  VALUES ('100101', u1, 'Late Night Talk Show & Songs 🎵', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600', 'live', 'live', true, false, 24200, 28100, 'Pakistan', 'PK', ARRAY['Live', 'Music'])
  RETURNING id INTO r1;

  INSERT INTO popolive.live_rooms (room_number, host_id, title, cover_url, category, status, is_live, is_pk, viewer_count, coins_earned, country, country_code, tags)
  VALUES ('100102', u2, 'VIP Party Room Open! Join Mic 🎙️', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', 'party', 'live', true, false, 16400, 16000, 'Pakistan', 'PK', ARRAY['Party', 'Voice'])
  RETURNING id INTO r2;

  INSERT INTO popolive.live_rooms (room_number, host_id, title, cover_url, category, status, is_live, is_pk, viewer_count, coins_earned, country, country_code, tags)
  VALUES ('100103', u3, 'Super PK Championship Match 🏆', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600', 'pk', 'live', true, true, 35000, 82000, 'United Arab Emirates', 'AE', ARRAY['PK', 'Battle'])
  RETURNING id INTO r3;

  INSERT INTO popolive.live_rooms (room_number, host_id, title, cover_url, category, status, is_live, is_pk, viewer_count, coins_earned, country, country_code, tags)
  VALUES ('100104', u4, 'PK Arena: Pakistan vs UAE Battle ⚔️', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600', 'pk', 'live', true, true, 18900, 49000, 'Pakistan', 'PK', ARRAY['PK', 'Arena'])
  RETURNING id INTO r4;

  INSERT INTO popolive.live_rooms (room_number, host_id, title, cover_url, category, status, is_live, is_pk, viewer_count, coins_earned, country, country_code, tags)
  VALUES ('100105', u5, 'Chit-Chat & Acoustic Vibes 🎸', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600', 'live', 'live', true, false, 892, 725, 'Pakistan', 'PK', ARRAY['Live', 'Chat'])
  RETURNING id INTO r5;

  INSERT INTO popolive.live_rooms (room_number, host_id, title, cover_url, category, status, is_live, is_pk, viewer_count, coins_earned, country, country_code, tags)
  VALUES ('100106', u6, 'Weekend Special Stream with Friends ✨', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600', 'live', 'live', true, false, 725, 725, 'United Kingdom', 'GB', ARRAY['Live', 'Friends'])
  RETURNING id INTO r6;

  -- 3. Insert PK Activities
  INSERT INTO popolive.pk_activities (room_id, host_a_id, host_b_id, title, status, host_a_votes, host_b_votes, host_a_points, host_b_points, viewer_count, started_at)
  VALUES (r3, u3, u1, 'Super PK Championship Match 🏆', 'active', 2100, 1840, 82000, 71500, 35000, CURRENT_TIMESTAMP - INTERVAL '15 minutes')
  RETURNING id INTO pk1;
  UPDATE popolive.live_rooms SET current_pk_id = pk1 WHERE id = r3;

  INSERT INTO popolive.pk_activities (room_id, host_a_id, host_b_id, title, status, host_a_votes, host_b_votes, host_a_points, host_b_points, viewer_count, started_at)
  VALUES (r4, u4, u2, 'PK Arena: Pakistan vs UAE Battle ⚔️', 'active', 1540, 1320, 49000, 44200, 18900, CURRENT_TIMESTAMP - INTERVAL '8 minutes')
  RETURNING id INTO pk2;
  UPDATE popolive.live_rooms SET current_pk_id = pk2 WHERE id = r4;

  INSERT INTO popolive.pk_activities (host_a_id, host_b_id, title, status, host_a_votes, host_b_votes, host_a_points, host_b_points, viewer_count, started_at)
  VALUES (u1, u5, 'Grand Champion Final PK 🏆', 'upcoming', 0, 0, 0, 0, 0, CURRENT_TIMESTAMP + INTERVAL '2 hours')
  RETURNING id INTO pk3;

  INSERT INTO popolive.pk_activities (host_a_id, host_b_id, title, status, host_a_votes, host_b_votes, host_a_points, host_b_points, viewer_count, started_at, ended_at)
  VALUES (u2, u6, 'Morning Speed PK Clash ⚡', 'completed', 3400, 2900, 120000, 98000, 4200, CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '3 hours');

  -- 4. Set follow relationships so u1 follows u2, u3, u4
  INSERT INTO popolive.user_follows (follower_id, following_id) VALUES (u1, u2), (u1, u3), (u1, u4)
  ON CONFLICT (follower_id, following_id) DO NOTHING;

END $$;
`;

async function main() {
  await new Promise((resolve, reject) => {
    conn.on('ready', () => {
      console.log('Connected to VPS.');
      resolve();
    }).on('error', reject).connect({
      host: '169.58.50.184',
      port: 22,
      username: 'root',
      password: 'Iftkharzaman',
      readyTimeout: 30000,
    });
  });

  conn.exec("cat << 'EOF' > /tmp/seed_creators.sql\n" + seedSql + "\nEOF\nsudo -u postgres psql -d nordleads -f /tmp/seed_creators.sql", (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', (code) => {
      console.log(`Executed with exit code ${code}`);
      conn.end();
    });
  });
}

main().catch(err => {
  console.error('Error:', err);
  conn.end();
  process.exit(1);
});
