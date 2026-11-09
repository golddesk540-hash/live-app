-- ============================================================================
-- Migration 026: Module 5.1 — Create a Party
-- Strict 1:1 Reference: 05_01_create_a_party.png
-- Party Entity, Categories, Room Types (Public / Private)
-- ============================================================================

SET search_path TO popolive, public;

-- 1. Create table for Party Categories
CREATE TABLE IF NOT EXISTS popolive.party_categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(64) DEFAULT 'party',
  display_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Seed Development Categories from Section 4 of Prompt
INSERT INTO popolive.party_categories (id, name, icon, display_order, is_active)
VALUES
  ('chill_chat', 'Chill & Chat', 'coffee', 1, true),
  ('music', 'Music', 'music', 2, true),
  ('entertainment', 'Entertainment', 'sparkles', 3, true),
  ('gaming', 'Gaming', 'gamepad', 4, true),
  ('lifestyle', 'Lifestyle', 'heart', 5, true),
  ('talent', 'Talent', 'award', 6, true),
  ('friendship', 'Friendship', 'users', 7, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

-- 2. Extend popolive.party_rooms for Phase 5 Party Lifecycle
ALTER TABLE popolive.party_rooms
  ADD COLUMN IF NOT EXISTS host_user_id UUID,
  ADD COLUMN IF NOT EXISTS room_type VARCHAR(32) NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS category_id VARCHAR(64) DEFAULT 'chill_chat',
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_seats INTEGER DEFAULT 9;

-- Ensure collage_url has a default to avoid NOT NULL failures on dynamic party creation
ALTER TABLE popolive.party_rooms
  ALTER COLUMN collage_url SET DEFAULT '/assets/party/fun_party_collage@2x.png';

CREATE INDEX IF NOT EXISTS idx_party_rooms_host_user ON popolive.party_rooms(host_user_id);
CREATE INDEX IF NOT EXISTS idx_party_rooms_room_type ON popolive.party_rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_party_rooms_category_id ON popolive.party_rooms(category_id);
