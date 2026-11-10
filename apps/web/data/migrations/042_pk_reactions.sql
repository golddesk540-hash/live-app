-- Migration 042: Module 6.8 PK Battle Reactions System
-- Authoritative Schema for PK Reactions, Floating Animations, and Counters

SET search_path TO popolive, public;

-- 1. Create pk_reactions table
CREATE TABLE IF NOT EXISTS popolive.pk_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES popolive.pk_battles(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  user_nickname VARCHAR(100) NOT NULL DEFAULT 'Viewer',
  user_avatar TEXT,
  target_host_side VARCHAR(10) NOT NULL DEFAULT 'both', -- 'host_a', 'host_b', 'both'
  reaction_type VARCHAR(50) NOT NULL, -- 'heart', 'laugh', 'fire', 'clap', 'love', 'like', 'wow', 'party', 'strong', 'cry'
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pk_reactions_battle_created 
  ON popolive.pk_reactions(battle_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pk_reactions_user_rate 
  ON popolive.pk_reactions(user_id, created_at DESC);

-- 2. Create pk_reaction_counters table for real-time aggregated counts
CREATE TABLE IF NOT EXISTS popolive.pk_reaction_counters (
  battle_id UUID NOT NULL REFERENCES popolive.pk_battles(id) ON DELETE CASCADE,
  reaction_type VARCHAR(50) NOT NULL,
  target_host_side VARCHAR(10) NOT NULL DEFAULT 'both',
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (battle_id, reaction_type, target_host_side)
);

CREATE INDEX IF NOT EXISTS idx_pk_reaction_counters_battle 
  ON popolive.pk_reaction_counters(battle_id);

-- 3. Seed Canonical Reactions & Counters for Battle 6.3 (Matching 06_08_reactions.png)
INSERT INTO popolive.pk_reaction_counters (battle_id, reaction_type, target_host_side, count, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000603', 'heart', 'host_a', 342, NOW()),
  ('00000000-0000-0000-0000-000000000603', 'heart', 'host_b', 289, NOW()),
  ('00000000-0000-0000-0000-000000000603', 'like', 'host_a', 156, NOW()),
  ('00000000-0000-0000-0000-000000000603', 'like', 'host_b', 142, NOW()),
  ('00000000-0000-0000-0000-000000000603', 'fire', 'host_a', 98, NOW()),
  ('00000000-0000-0000-0000-000000000603', 'clap', 'host_b', 84, NOW()),
  ('00000000-0000-0000-0000-000000000603', 'love', 'both', 215, NOW())
ON CONFLICT (battle_id, reaction_type, target_host_side) DO UPDATE SET
  count = EXCLUDED.count,
  updated_at = NOW();

-- Seed sample initial reactions matching live comments
INSERT INTO popolive.pk_reactions (
  battle_id, user_id, user_nickname, target_host_side, reaction_type, emoji, created_at
) VALUES
  ('00000000-0000-0000-0000-000000000603', 'user_ali_101', 'Ali', 'host_a', 'heart', '❤️', NOW() - INTERVAL '10 seconds'),
  ('00000000-0000-0000-0000-000000000603', 'user_raza_102', 'Raza', 'host_b', 'like', '👍', NOW() - INTERVAL '8 seconds'),
  ('00000000-0000-0000-0000-000000000603', 'user_sana_103', 'Sana', 'host_a', 'heart', '💖', NOW() - INTERVAL '5 seconds'),
  ('00000000-0000-0000-0000-000000000603', 'user_viewer_9001', 'You', 'both', 'fire', '🔥', NOW() - INTERVAL '2 seconds')
ON CONFLICT DO NOTHING;
