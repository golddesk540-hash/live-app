-- Migration 036: PK Battle Invitations & Random Matchmaking
-- Popo Live Phase 6 Module 6.2

-- 1. Extend users with PK flags
ALTER TABLE popolive.users
ADD COLUMN IF NOT EXISTS in_pk_battle BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS current_pk_battle_id UUID,
ADD COLUMN IF NOT EXISTS pk_invites_enabled BOOLEAN DEFAULT true;

-- 2. Extend live_rooms with PK flags
ALTER TABLE popolive.live_rooms
ADD COLUMN IF NOT EXISTS in_pk_battle BOOLEAN DEFAULT false;

-- Ensure unique constraint on room_number for pk_battle_sessions (deduplicate first)
DELETE FROM popolive.pk_battle_sessions a
USING popolive.pk_battle_sessions b
WHERE a.room_number = b.room_number
  AND a.configured_at < b.configured_at;

CREATE UNIQUE INDEX IF NOT EXISTS uq_pk_battle_sessions_room ON popolive.pk_battle_sessions(room_number);

-- 3. PK Invitations Table
CREATE TABLE IF NOT EXISTS popolive.pk_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_host_id VARCHAR(64) NOT NULL,
    sender_room_number VARCHAR(64) NOT NULL,
    sender_nickname VARCHAR(128) NOT NULL,
    sender_avatar TEXT,
    receiver_host_id VARCHAR(64) NOT NULL,
    receiver_room_number VARCHAR(64) NOT NULL,
    receiver_nickname VARCHAR(128) NOT NULL,
    receiver_avatar TEXT,
    battle_type VARCHAR(32) NOT NULL DEFAULT '1v1',
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'expired', 'cancelled'
    rejection_reason TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pk_invitations_receiver ON popolive.pk_invitations (receiver_host_id, status);
CREATE INDEX IF NOT EXISTS idx_pk_invitations_sender ON popolive.pk_invitations (sender_host_id, status);
CREATE INDEX IF NOT EXISTS idx_pk_invitations_expires ON popolive.pk_invitations (expires_at) WHERE status = 'pending';

-- 4. PK Matchmaking Queue Table
CREATE TABLE IF NOT EXISTS popolive.pk_matchmaking_queue (
    id SERIAL PRIMARY KEY,
    host_id VARCHAR(64) NOT NULL UNIQUE,
    room_number VARCHAR(64) NOT NULL,
    host_nickname VARCHAR(128) NOT NULL,
    host_avatar TEXT,
    country_code VARCHAR(16) DEFAULT 'PK',
    viewer_count INT DEFAULT 0,
    battle_type VARCHAR(32) NOT NULL DEFAULT '1v1',
    status VARCHAR(32) NOT NULL DEFAULT 'searching', -- 'searching', 'matched', 'cancelled', 'timeout'
    matched_with_host_id VARCHAR(64),
    matched_battle_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pk_matchmaking_status ON popolive.pk_matchmaking_queue (status, battle_type, created_at);

-- 5. PK Battles Table
CREATE TABLE IF NOT EXISTS popolive.pk_battles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_type VARCHAR(32) NOT NULL DEFAULT '1v1',
    host_a_id VARCHAR(64) NOT NULL,
    host_a_room VARCHAR(64) NOT NULL,
    host_a_nickname VARCHAR(128) NOT NULL,
    host_a_avatar TEXT,
    host_b_id VARCHAR(64) NOT NULL,
    host_b_room VARCHAR(64) NOT NULL,
    host_b_nickname VARCHAR(128) NOT NULL,
    host_b_avatar TEXT,
    match_method VARCHAR(32) NOT NULL DEFAULT 'invite', -- 'invite', 'random'
    invitation_id UUID,
    status VARCHAR(32) NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'starting', 'active', 'completed', 'cancelled'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pk_battles_hosts ON popolive.pk_battles (host_a_id, host_b_id, status);
CREATE INDEX IF NOT EXISTS idx_pk_battles_rooms ON popolive.pk_battles (host_a_room, host_b_room, status);

-- 6. Seed canonical live hosts from reference design (Sara Live, Ayesha, Zoya)
INSERT INTO popolive.users (
    id, poppo_id, email, nickname, avatar_url, country, country_code,
    is_adult_verified, is_face_verified, go_live_eligible, status,
    host_level, wealth_level, in_pk_battle, pk_invites_enabled
)
VALUES 
(
    '00000000-0000-0000-0000-000000088201',
    '88201',
    'sara.live@popolive.com',
    'Sara Live',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    'Pakistan',
    'PK',
    true, true, true, 'active',
    18, 25, false, true
),
(
    '00000000-0000-0000-0000-000000088202',
    '88202',
    'ayesha@popolive.com',
    'Ayesha',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    'Pakistan',
    'PK',
    true, true, true, 'active',
    14, 19, false, true
),
(
    '00000000-0000-0000-0000-000000088203',
    '88203',
    'zoya@popolive.com',
    'Zoya',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
    'United Arab Emirates',
    'AE',
    true, true, true, 'active',
    22, 30, false, true
)
ON CONFLICT (id) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    poppo_id = EXCLUDED.poppo_id,
    avatar_url = EXCLUDED.avatar_url,
    country = EXCLUDED.country,
    country_code = EXCLUDED.country_code,
    is_face_verified = true,
    go_live_eligible = true,
    status = 'active',
    in_pk_battle = false,
    pk_invites_enabled = true;

-- Seed / update live rooms for the canonical hosts
INSERT INTO popolive.live_rooms (
    id, room_number, host_id, title, cover_url, category, status, is_live, is_pk,
    viewer_count, country, country_code, tags, stream_key, current_stream_quality, is_cost_guard_active
)
VALUES
(
    '00000000-0000-0000-0000-000000007002',
    '7002',
    '00000000-0000-0000-0000-000000088201',
    'Sara Live Official PK & Chill Stream ✨',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    'live',
    'live',
    true,
    false,
    12400,
    'Pakistan',
    'PK',
    ARRAY['Live', 'PK', 'Urdu'],
    'stream_7002_key',
    '720p',
    true
),
(
    '00000000-0000-0000-0000-000000007003',
    '7003',
    '00000000-0000-0000-0000-000000088202',
    'Ayesha Music and PK Battle Arena 🎵',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    'live',
    'live',
    true,
    false,
    8900,
    'Pakistan',
    'PK',
    ARRAY['Music', 'Battle', 'Urdu'],
    'stream_7003_key',
    '720p',
    true
),
(
    '00000000-0000-0000-0000-000000007004',
    '7004',
    '00000000-0000-0000-0000-000000088203',
    'Zoya Gulf Vibes & PK Challenges 🌟',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
    'live',
    'live',
    true,
    false,
    5100,
    'United Arab Emirates',
    'AE',
    ARRAY['Dubai', 'Talent', 'PK'],
    'stream_7004_key',
    '720p',
    true
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    room_number = EXCLUDED.room_number,
    host_id = EXCLUDED.host_id,
    viewer_count = EXCLUDED.viewer_count,
    is_live = true,
    status = 'live',
    is_pk = false;
