-- Migration 037: PK Battle Score and Timer
-- Popo Live Phase 6 Module 6.3

-- 1. Extend pk_battles with score, timer, and authoritative state fields
ALTER TABLE popolive.pk_battles
ADD COLUMN IF NOT EXISTS host_a_score BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS host_b_score BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration_seconds INT NOT NULL DEFAULT 300,
ADD COLUMN IF NOT EXISTS remaining_seconds INT NOT NULL DEFAULT 300,
ADD COLUMN IF NOT EXISTS timer_status VARCHAR(32) NOT NULL DEFAULT 'running', -- 'running', 'paused', 'warning_60s', 'warning_10s', 'time_expired', 'completed'
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS leading_host_id VARCHAR(64),
ADD COLUMN IF NOT EXISTS winner_host_id VARCHAR(64);

-- 2. Create pk_score_events table with strict deduplication
CREATE TABLE IF NOT EXISTS popolive.pk_score_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_id UUID NOT NULL REFERENCES popolive.pk_battles(id) ON DELETE CASCADE,
    host_side VARCHAR(16) NOT NULL, -- 'host_a' or 'host_b'
    target_host_id VARCHAR(64) NOT NULL,
    sender_id VARCHAR(64) NOT NULL,
    sender_name VARCHAR(128) NOT NULL,
    points BIGINT NOT NULL CHECK (points > 0),
    gift_name VARCHAR(128) DEFAULT 'Diamond Star',
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pk_score_events_battle_time ON popolive.pk_score_events (battle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pk_score_events_idempotency ON popolive.pk_score_events (idempotency_key);

-- 3. Create pk_comments table for live battle chat
CREATE TABLE IF NOT EXISTS popolive.pk_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_id UUID NOT NULL REFERENCES popolive.pk_battles(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL,
    user_name VARCHAR(128) NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pk_comments_battle_time ON popolive.pk_comments (battle_id, created_at ASC);

-- 4. Seed Canonical 1v1 Battle for Module 6.3 reference (Sara Live vs Ayesha)
-- Reference 06_03_score_and_timer.png: Sara (12,430) vs Ayesha (9,870), Timer at 04:58
INSERT INTO popolive.pk_battles (
    id, battle_type,
    host_a_id, host_a_room, host_a_nickname, host_a_avatar, host_a_score,
    host_b_id, host_b_room, host_b_nickname, host_b_avatar, host_b_score,
    match_method, status, duration_seconds, remaining_seconds, timer_status,
    started_at, expires_at, leading_host_id
)
VALUES (
    '00000000-0000-0000-0000-000000000603',
    '1v1',
    '00000000-0000-0000-0000-000000088201',
    '88201',
    'Sara Live',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    12430,
    '00000000-0000-0000-0000-000000088202',
    '88202',
    'Ayesha',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    9870,
    'invite',
    'active',
    300,
    298,
    'running',
    NOW() - INTERVAL '2 seconds',
    NOW() + INTERVAL '298 seconds',
    '00000000-0000-0000-0000-000000088201'
)
ON CONFLICT (id) DO UPDATE SET
    host_a_score = 12430,
    host_b_score = 9870,
    status = 'active',
    duration_seconds = 300,
    remaining_seconds = 298,
    timer_status = 'running',
    started_at = NOW() - INTERVAL '2 seconds',
    expires_at = NOW() + INTERVAL '298 seconds',
    leading_host_id = '00000000-0000-0000-0000-000000088201';

-- Seed initial comments matching 06_03_score_and_timer.png
DELETE FROM popolive.pk_comments WHERE battle_id = '00000000-0000-0000-0000-000000000603';

INSERT INTO popolive.pk_comments (battle_id, user_id, user_name, user_avatar, content, created_at)
VALUES 
(
    '00000000-0000-0000-0000-000000000603',
    'user_ali_101',
    'Ali',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    'Go Sara! 🔥',
    NOW() - INTERVAL '15 seconds'
),
(
    '00000000-0000-0000-0000-000000000603',
    'user_raza_102',
    'Raza',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    'Nice battle!',
    NOW() - INTERVAL '10 seconds'
),
(
    '00000000-0000-0000-0000-000000000603',
    'user_sana_103',
    'Sana',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    '💕💕',
    NOW() - INTERVAL '5 seconds'
);
