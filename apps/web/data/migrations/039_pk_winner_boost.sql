-- Migration 039: PK Winner Boost System
-- Popo Live Phase 6 Module 6.5

-- 1. Create pk_winner_boosts table
CREATE TABLE IF NOT EXISTS popolive.pk_winner_boosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_id UUID UNIQUE NOT NULL REFERENCES popolive.pk_battles(id) ON DELETE CASCADE,
    result_id UUID REFERENCES popolive.pk_battle_results(id) ON DELETE SET NULL,
    winner_user_id VARCHAR(64) NOT NULL,
    winner_nickname VARCHAR(128) NOT NULL,
    winner_avatar TEXT,
    boost_type VARCHAR(64) NOT NULL DEFAULT 'points_boost', -- 'points_boost', 'temporary_badge', 'profile_highlight', 'winner_animation'
    boost_title VARCHAR(128) NOT NULL DEFAULT 'Winner Boost Active',
    boost_description TEXT NOT NULL DEFAULT '+20% points for next 30 minutes',
    multiplier_percentage INT NOT NULL DEFAULT 20,
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'pending', 'active', 'expired', 'cancelled', 'rejected'
    duration_minutes INT NOT NULL DEFAULT 30,
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pk_boosts_winner ON popolive.pk_winner_boosts (winner_user_id, status);
CREATE INDEX IF NOT EXISTS idx_pk_boosts_expires ON popolive.pk_winner_boosts (expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_pk_boosts_battle ON popolive.pk_winner_boosts (battle_id);

-- 2. Create pk_boost_audit_logs table
CREATE TABLE IF NOT EXISTS popolive.pk_boost_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boost_id UUID NOT NULL REFERENCES popolive.pk_winner_boosts(id) ON DELETE CASCADE,
    battle_id UUID,
    action VARCHAR(64) NOT NULL, -- 'created', 'activated', 'expired', 'cancelled', 'admin_override'
    actor_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(64) NOT NULL DEFAULT 'system',
    previous_status VARCHAR(32),
    new_status VARCHAR(32) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pk_boost_audit_boost ON popolive.pk_boost_audit_logs (boost_id, created_at DESC);

-- 3. Extend users table with active boost references
ALTER TABLE popolive.users
ADD COLUMN IF NOT EXISTS has_active_boost BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS active_boost_id UUID;

-- 4. Seed Canonical Winner Boost for Module 6.5 matching 06_05_winner_boost.png
-- Canonical winner Sara Live (ID: 00000000-0000-0000-0000-000000088201) from battle 00000000-0000-0000-0000-000000000604
-- Active 30 min boost with ~29:59 remaining
INSERT INTO popolive.pk_winner_boosts (
    id, battle_id, result_id, winner_user_id, winner_nickname, winner_avatar,
    boost_type, boost_title, boost_description, multiplier_percentage,
    status, duration_minutes, activated_at, expires_at
)
VALUES (
    '00000000-0000-0000-0000-000000000805',
    '00000000-0000-0000-0000-000000000604',
    '00000000-0000-0000-0000-000000000704',
    '00000000-0000-0000-0000-000000088201',
    'Sara Live',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    'points_boost',
    'Winner Boost Active',
    '+20% points for next 30 minutes',
    20,
    'active',
    30,
    NOW() - INTERVAL '1 second',
    NOW() + INTERVAL '1799 seconds'
)
ON CONFLICT (battle_id) DO UPDATE SET
    status = 'active',
    activated_at = NOW() - INTERVAL '1 second',
    expires_at = NOW() + INTERVAL '1799 seconds',
    boost_title = 'Winner Boost Active',
    boost_description = '+20% points for next 30 minutes';

-- Insert initial audit record
INSERT INTO popolive.pk_boost_audit_logs (
    boost_id, battle_id, action, actor_id, actor_role, previous_status, new_status, reason
)
VALUES (
    '00000000-0000-0000-0000-000000000805',
    '00000000-0000-0000-0000-000000000604',
    'activated',
    'system',
    'system',
    'pending',
    'active',
    'Automatic boost activation following verified 1v1 battle victory'
)
ON CONFLICT DO NOTHING;

-- Update user flag
UPDATE popolive.users
SET has_active_boost = true,
    active_boost_id = '00000000-0000-0000-0000-000000000805'
WHERE id = '00000000-0000-0000-0000-000000088201';
