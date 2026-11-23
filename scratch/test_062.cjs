const fs = require('fs');
const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

const sql062 = `
-- Migration 062: Social Relations & Missing Me Modules
-- Schema: popolive

-- 1. Mutual-Friends Database View (user_friends over user_follows)
CREATE OR REPLACE VIEW popolive.user_friends AS
SELECT 
  f1.follower_id AS user_id,
  f1.following_id AS friend_id,
  GREATEST(f1.created_at, f2.created_at) AS established_at,
  f1.live_notifications_enabled
FROM popolive.user_follows f1
JOIN popolive.user_follows f2
  ON f1.follower_id = f2.following_id
 AND f1.following_id = f2.follower_id;

-- 2. Profile Visits Table (profile_visits)
CREATE TABLE IF NOT EXISTS popolive.profile_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  visited_user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source VARCHAR(32) NOT NULL DEFAULT 'profile',
  CONSTRAINT chk_profile_visits_no_self CHECK (visitor_id != visited_user_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_visits_visited 
  ON popolive.profile_visits(visited_user_id, visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_visits_visitor 
  ON popolive.profile_visits(visitor_id, visited_at DESC);

-- 3. Guardians Table & Performance Indexes (guardians)
CREATE TABLE IF NOT EXISTS popolive.guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id VARCHAR(64) NOT NULL,
  guardian_user_id VARCHAR(64) NOT NULL,
  guardian_tier VARCHAR(64) NOT NULL DEFAULT 'guardian_angel',
  coin_price INTEGER NOT NULL DEFAULT 500,
  coin_tx_id VARCHAR(100),
  idempotency_key VARCHAR(150),
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardians_host_active 
  ON popolive.guardians(host_id, status, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_guardians_user 
  ON popolive.guardians(guardian_user_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_guardians_idempotency 
  ON popolive.guardians(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 4. Medal Catalog Table & Canonical Seed (medal_catalog)
CREATE TABLE IF NOT EXISTS popolive.medal_catalog (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  rarity VARCHAR(32) NOT NULL DEFAULT 'Common',
  icon_emoji VARCHAR(16) NOT NULL,
  description TEXT NOT NULL,
  criteria_type VARCHAR(64),
  criteria_threshold BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO popolive.medal_catalog (id, name, category, rarity, icon_emoji, description, criteria_type, criteria_threshold)
VALUES
  ('med_01', 'Top Broadcaster 2026', 'Honor', 'Legendary', '🏆', 'Awarded to creators with exceptional streaming diamond points', 'diamond_points', 1000),
  ('med_02', 'Karachi Star', 'Regional', 'Epic', '⭐', 'Earned from active broadcast audience across Pakistan', 'regional_presence', 1),
  ('med_03', 'Gift Master', 'Gifting', 'Epic', '🎁', 'Sent verified coins in gifts across creator streams', 'coins_spent', 100),
  ('med_04', 'Loyal Fan Lv.10', 'Community', 'Rare', '💖', 'Achieved high intimacy standing with favorite live hosts', 'fan_points', 500),
  ('med_05', 'PK Champion', 'Battle', 'Epic', '⚔️', 'Achieved 50+ victories in official 1v1 PK battle competitions', 'pk_wins', 50),
  ('med_06', 'Party Maestro', 'Party', 'Rare', '🎉', 'Hosted more than 100 hours in 9-seat party rooms', 'party_hours', 100),
  ('med_07', 'Super Guardian', 'Protection', 'Legendary', '🛡️', 'Holds an active Guardian Shield and VIP royal protection', 'guardian_active', 1),
  ('med_08', 'Verified Creator', 'Identity', 'Rare', '✅', 'Completed 18+ adult identity and face security verification', 'verification_passed', 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  icon_emoji = EXCLUDED.icon_emoji,
  description = EXCLUDED.description,
  criteria_type = EXCLUDED.criteria_type,
  criteria_threshold = EXCLUDED.criteria_threshold;

-- 5. User Medals Assignment Table (user_medals)
CREATE TABLE IF NOT EXISTS popolive.user_medals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  medal_id VARCHAR(32) NOT NULL REFERENCES popolive.medal_catalog(id) ON DELETE CASCADE,
  is_unlocked BOOLEAN NOT NULL DEFAULT true,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT uq_user_medal UNIQUE (user_id, medal_id)
);

CREATE INDEX IF NOT EXISTS idx_user_medals_user 
  ON popolive.user_medals(user_id);

CREATE INDEX IF NOT EXISTS idx_user_medals_medal 
  ON popolive.user_medals(medal_id);

-- 6. Redeem Codes Table (redeem_codes)
CREATE TABLE IF NOT EXISTS popolive.redeem_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(64) UNIQUE NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT,
  reward_type VARCHAR(32) NOT NULL DEFAULT 'coins',
  coin_reward INTEGER NOT NULL DEFAULT 0,
  bonus_item TEXT,
  max_uses INTEGER NOT NULL DEFAULT 1000,
  current_uses INTEGER NOT NULL DEFAULT 0,
  max_claims INTEGER NOT NULL DEFAULT 1000,
  claims_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE popolive.redeem_codes
  ADD COLUMN IF NOT EXISTS reward_type VARCHAR(32) NOT NULL DEFAULT 'coins',
  ADD COLUMN IF NOT EXISTS max_uses INTEGER NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS current_uses INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_redeem_codes_lookup 
  ON popolive.redeem_codes(code, is_active);

-- 7. Redeem Redemptions History (redeem_redemptions)
CREATE TABLE IF NOT EXISTS popolive.redeem_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES popolive.redeem_codes(id) ON DELETE CASCADE,
  code VARCHAR(64) NOT NULL,
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  coin_reward INTEGER NOT NULL DEFAULT 0,
  bonus_item TEXT,
  coin_tx_id VARCHAR(100),
  idempotency_key VARCHAR(150),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_redeem_redemptions_user_code UNIQUE (user_id, code_id)
);

CREATE INDEX IF NOT EXISTS idx_redeem_redemptions_user 
  ON popolive.redeem_redemptions(user_id, redeemed_at DESC);

CREATE INDEX IF NOT EXISTS idx_redeem_redemptions_code 
  ON popolive.redeem_redemptions(code_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_redeem_history_user_code'
  ) THEN
    ALTER TABLE popolive.redeem_history
      ADD CONSTRAINT uq_redeem_history_user_code UNIQUE (user_id, code_id);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN others THEN NULL;
END $$;

-- 8. Live Room History (live_room_history) Enhancements & Indexes
CREATE TABLE IF NOT EXISTS popolive.live_room_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) NOT NULL,
  room_id VARCHAR(64) NOT NULL,
  host_id VARCHAR(64),
  host_nickname VARCHAR(100),
  title VARCHAR(255),
  cover_url TEXT,
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  duration_seconds INTEGER DEFAULT 0,
  replay_url TEXT,
  is_replay_available BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE popolive.live_room_history
  ADD COLUMN IF NOT EXISTS host_id VARCHAR(64),
  ADD COLUMN IF NOT EXISTS host_nickname VARCHAR(100),
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS watched_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS replay_url TEXT,
  ADD COLUMN IF NOT EXISTS is_replay_available BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_live_room_history_user_watched 
  ON popolive.live_room_history(user_id, watched_at DESC);

-- 9. User Invite Codes & Invitations Table
CREATE TABLE IF NOT EXISTS popolive.user_invite_codes (
  user_id VARCHAR(64) PRIMARY KEY,
  invite_code VARCHAR(32) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_invite_codes_code 
  ON popolive.user_invite_codes(invite_code);

CREATE INDEX IF NOT EXISTS idx_invitations_inviter 
  ON popolive.invitations(inviter_id);
`;

async function test() {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO popolive, public;');
    console.log('Testing SQL 062 in transaction...');
    await client.query('BEGIN;');
    await client.query(sql062);

    // Test queries against the created objects
    console.log('1. Testing user_friends view...');
    const friendsRes = await client.query('SELECT * FROM popolive.user_friends LIMIT 5;');
    console.log(`   -> Found ${friendsRes.rows.length} mutual friends`);

    console.log('2. Testing profile_visits table...');
    const visitsRes = await client.query('SELECT * FROM popolive.profile_visits LIMIT 5;');
    console.log(`   -> Found ${visitsRes.rows.length} visits`);

    console.log('3. Testing guardians table & indexes...');
    const guardRes = await client.query('SELECT * FROM popolive.guardians WHERE status = $1 LIMIT 5;', ['active']);
    console.log(`   -> Found ${guardRes.rows.length} guardians`);

    console.log('4. Testing medal_catalog table...');
    const medalsRes = await client.query('SELECT * FROM popolive.medal_catalog ORDER BY id;');
    console.log(`   -> Found ${medalsRes.rows.length} medals in catalog`);

    console.log('5. Testing user_medals table...');
    const userMedalsRes = await client.query('SELECT * FROM popolive.user_medals LIMIT 5;');
    console.log(`   -> Found ${userMedalsRes.rows.length} user medals`);

    console.log('6. Testing redeem_codes table...');
    const codesRes = await client.query('SELECT * FROM popolive.redeem_codes LIMIT 5;');
    console.log(`   -> Found ${codesRes.rows.length} redeem codes`);

    console.log('7. Testing redeem_redemptions table...');
    const redempRes = await client.query('SELECT * FROM popolive.redeem_redemptions LIMIT 5;');
    console.log(`   -> Found ${redempRes.rows.length} redemptions`);

    console.log('8. Testing live_room_history table...');
    const historyRes = await client.query('SELECT * FROM popolive.live_room_history LIMIT 5;');
    console.log(`   -> Found ${historyRes.rows.length} room history records`);

    console.log('9. Testing user_invite_codes table...');
    const inviteRes = await client.query('SELECT * FROM popolive.user_invite_codes LIMIT 5;');
    console.log(`   -> Found ${inviteRes.rows.length} user invite codes`);

    await client.query('ROLLBACK;');
    console.log('\n[SUCCESS] Migration 062 validated with 100% success in test transaction!');
  } finally {
    client.release();
    await pool.end();
  }
}

test().catch(err => {
  console.error('[FAIL]', err);
  process.exit(1);
});
