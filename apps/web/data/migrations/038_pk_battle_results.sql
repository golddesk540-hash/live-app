-- Migration 038: PK Battle Results and Winner Declaration
-- Popo Live Phase 6 Module 6.4

-- 1. Create pk_battle_results table
CREATE TABLE IF NOT EXISTS popolive.pk_battle_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_id UUID UNIQUE NOT NULL REFERENCES popolive.pk_battles(id) ON DELETE CASCADE,
    battle_type VARCHAR(32) NOT NULL DEFAULT '1v1',
    host_a_id VARCHAR(64) NOT NULL,
    host_a_nickname VARCHAR(128) NOT NULL,
    host_a_avatar TEXT,
    host_a_score BIGINT NOT NULL DEFAULT 0,
    host_b_id VARCHAR(64) NOT NULL,
    host_b_nickname VARCHAR(128) NOT NULL,
    host_b_avatar TEXT,
    host_b_score BIGINT NOT NULL DEFAULT 0,
    result_type VARCHAR(32) NOT NULL DEFAULT 'winner_declared', -- 'winner_declared', 'draw', 'cancelled'
    winner_host_id VARCHAR(64), -- NULL on draw
    winner_nickname VARCHAR(128),
    winner_avatar TEXT,
    winner_score BIGINT,
    loser_host_id VARCHAR(64), -- NULL on draw
    loser_nickname VARCHAR(128),
    loser_avatar TEXT,
    loser_score BIGINT,
    score_diff BIGINT NOT NULL DEFAULT 0,
    duration_seconds INT NOT NULL DEFAULT 300,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pk_results_hosts ON popolive.pk_battle_results (host_a_id, host_b_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pk_results_winner ON popolive.pk_battle_results (winner_host_id);
CREATE INDEX IF NOT EXISTS idx_pk_results_created ON popolive.pk_battle_results (created_at DESC);

-- 2. Ensure pk_battles references result
ALTER TABLE popolive.pk_battles
ADD COLUMN IF NOT EXISTS result_id UUID,
ADD COLUMN IF NOT EXISTS result_type VARCHAR(32);

-- 3. Seed Canonical Completed Battle matching 06_04_result.png
-- Reference values: Sara Live WINNER (Score: 24,860) Vs Ayesha (Score: 18,320)
INSERT INTO popolive.pk_battles (
    id, battle_type,
    host_a_id, host_a_room, host_a_nickname, host_a_avatar, host_a_score,
    host_b_id, host_b_room, host_b_nickname, host_b_avatar, host_b_score,
    match_method, status, duration_seconds, remaining_seconds, timer_status,
    started_at, ended_at, expires_at, leading_host_id, winner_host_id
)
VALUES (
    '00000000-0000-0000-0000-000000000604',
    '1v1',
    '00000000-0000-0000-0000-000000088201',
    '88201',
    'Sara Live',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    24860,
    '00000000-0000-0000-0000-000000088202',
    '88202',
    'Ayesha',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    18320,
    'invite',
    'completed',
    300,
    0,
    'completed',
    NOW() - INTERVAL '305 seconds',
    NOW() - INTERVAL '5 seconds',
    NOW() - INTERVAL '5 seconds',
    '00000000-0000-0000-0000-000000088201',
    '00000000-0000-0000-0000-000000088201'
)
ON CONFLICT (id) DO UPDATE SET
    host_a_score = 24860,
    host_b_score = 18320,
    status = 'completed',
    duration_seconds = 300,
    remaining_seconds = 0,
    timer_status = 'completed',
    winner_host_id = '00000000-0000-0000-0000-000000088201';

-- Seed the official canonical result record
INSERT INTO popolive.pk_battle_results (
    id, battle_id, battle_type,
    host_a_id, host_a_nickname, host_a_avatar, host_a_score,
    host_b_id, host_b_nickname, host_b_avatar, host_b_score,
    result_type, winner_host_id, winner_nickname, winner_avatar, winner_score,
    loser_host_id, loser_nickname, loser_avatar, loser_score,
    score_diff, duration_seconds, started_at, ended_at
)
VALUES (
    '00000000-0000-0000-0000-000000000704',
    '00000000-0000-0000-0000-000000000604',
    '1v1',
    '00000000-0000-0000-0000-000000088201',
    'Sara Live',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    24860,
    '00000000-0000-0000-0000-000000088202',
    'Ayesha',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    18320,
    'winner_declared',
    '00000000-0000-0000-0000-000000088201',
    'Sara Live',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    24860,
    '00000000-0000-0000-0000-000000088202',
    'Ayesha',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    18320,
    6540,
    300,
    NOW() - INTERVAL '305 seconds',
    NOW() - INTERVAL '5 seconds'
)
ON CONFLICT (battle_id) DO UPDATE SET
    host_a_score = 24860,
    host_b_score = 18320,
    winner_score = 24860,
    loser_score = 18320,
    score_diff = 6540,
    result_type = 'winner_declared',
    winner_host_id = '00000000-0000-0000-0000-000000088201';

-- Update pk_battles with result_id
UPDATE popolive.pk_battles
SET result_id = '00000000-0000-0000-0000-000000000704', result_type = 'winner_declared'
WHERE id = '00000000-0000-0000-0000-000000000604';

-- 4. Seed Canonical Draw Battle for test verification
INSERT INTO popolive.pk_battles (
    id, battle_type,
    host_a_id, host_a_room, host_a_nickname, host_a_avatar, host_a_score,
    host_b_id, host_b_room, host_b_nickname, host_b_avatar, host_b_score,
    match_method, status, duration_seconds, remaining_seconds, timer_status,
    started_at, ended_at, expires_at
)
VALUES (
    '00000000-0000-0000-0000-000000000605',
    '1v1',
    '00000000-0000-0000-0000-000000088201',
    '88201',
    'Sara Live',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    15000,
    '00000000-0000-0000-0000-000000088202',
    '88202',
    'Ayesha',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    15000,
    'invite',
    'completed',
    300,
    0,
    'completed',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '300 seconds',
    NOW() - INTERVAL '1 day' + INTERVAL '300 seconds'
)
ON CONFLICT (id) DO UPDATE SET
    host_a_score = 15000,
    host_b_score = 15000,
    status = 'completed';

INSERT INTO popolive.pk_battle_results (
    id, battle_id, battle_type,
    host_a_id, host_a_nickname, host_a_avatar, host_a_score,
    host_b_id, host_b_nickname, host_b_avatar, host_b_score,
    result_type, winner_host_id, winner_nickname, winner_avatar, winner_score,
    loser_host_id, loser_nickname, loser_avatar, loser_score,
    score_diff, duration_seconds, started_at, ended_at
)
VALUES (
    '00000000-0000-0000-0000-000000000705',
    '00000000-0000-0000-0000-000000000605',
    '1v1',
    '00000000-0000-0000-0000-000000088201',
    'Sara Live',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    15000,
    '00000000-0000-0000-0000-000000088202',
    'Ayesha',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    15000,
    'draw',
    NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL,
    0,
    300,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '300 seconds'
)
ON CONFLICT (battle_id) DO NOTHING;
