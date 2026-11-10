-- Migration 040: Module 6.6 PK Discovery Tab
-- Authoritative Schema for PK Battles Discovery, Available Hosts, and Featured Rankings

SET search_path TO popolive, public;

-- 1. Alter pk_battles to include discovery and featured metadata
ALTER TABLE popolive.pk_battles
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS viewer_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_pk_battles_discovery_status 
  ON popolive.pk_battles(status, is_featured, viewer_count DESC, created_at DESC);

-- 2. Create pk_featured_battles table for admin featured curation
CREATE TABLE IF NOT EXISTS popolive.pk_featured_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES popolive.pk_battles(id) ON DELETE CASCADE,
  featured_by VARCHAR(100) DEFAULT 'admin',
  featured_order INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_featured_battle UNIQUE (battle_id)
);

CREATE INDEX IF NOT EXISTS idx_pk_featured_order 
  ON popolive.pk_featured_battles(featured_order ASC, created_at DESC);

-- 3. Seed / Ensure Key Users for Module 6.6 matching 06_06_pk_discovery_tab.png
INSERT INTO popolive.users (
  id, poppo_id, nickname, avatar_url, country, country_code,
  is_face_verified, go_live_eligible, in_pk_battle, pk_invites_enabled, status, created_at, updated_at
) VALUES
  ('00000000-0000-0000-0000-000000088204', '88204', 'Nimra',
   'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
   'Pakistan', 'PK', true, true, true, true, 'active', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000088205', '88205', 'Hira',
   'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
   'Pakistan', 'PK', true, true, true, true, 'active', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000088206', '88206', 'Alina',
   'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
   'Pakistan', 'PK', true, true, true, true, 'active', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000088207', '88207', 'Fatima',
   'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
   'Pakistan', 'PK', true, true, true, true, 'active', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000088208', '88208', 'Mehak',
   'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
   'Pakistan', 'PK', true, true, true, true, 'active', NOW(), NOW()),
  -- Available Hosts for PK Invitations (Live & not in PK)
  ('00000000-0000-0000-0000-000000088209', '88209', 'Sana Khan',
   'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
   'Pakistan', 'PK', true, true, false, true, 'active', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000088210', '88210', 'Noor Al-Huda',
   'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
   'United Arab Emirates', 'AE', true, true, false, true, 'active', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000088211', '88211', 'Mahnoor Malik',
   'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
   'Saudi Arabia', 'SA', true, true, false, true, 'active', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000088212', '88212', 'Rabia Sheikh',
   'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
   'Pakistan', 'PK', true, true, false, true, 'active', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  nickname = EXCLUDED.nickname,
  avatar_url = EXCLUDED.avatar_url,
  country = EXCLUDED.country,
  country_code = EXCLUDED.country_code,
  is_face_verified = EXCLUDED.is_face_verified,
  go_live_eligible = EXCLUDED.go_live_eligible,
  in_pk_battle = EXCLUDED.in_pk_battle,
  pk_invites_enabled = EXCLUDED.pk_invites_enabled,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 4. Seed / Ensure Live Rooms for Available Hosts
INSERT INTO popolive.live_rooms (
  id, room_number, host_id, title, category, status, is_live, viewer_count, country, country_code, in_pk_battle, created_at, updated_at
) VALUES
  ('00000000-0000-0000-0000-000000089209', '88209', '00000000-0000-0000-0000-000000088209', 'Chit-chat & Singing 🎶 Ready for PK!', 'Entertainment', 'live', true, 1840, 'Pakistan', 'PK', false, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000089210', '88210', '00000000-0000-0000-0000-000000088210', 'Dubai Evening Vibes ✨ PK Open', 'Music', 'live', true, 3420, 'United Arab Emirates', 'AE', false, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000089211', '88211', '00000000-0000-0000-0000-000000088211', 'Riyadh Live 🌙 Send PK invite!', 'Chat', 'live', true, 920, 'Saudi Arabia', 'SA', false, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000089212', '88212', '00000000-0000-0000-0000-000000088212', 'Fun & Games 🎮 Who wants to battle?', 'Gaming', 'live', true, 640, 'Pakistan', 'PK', false, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  room_number = EXCLUDED.room_number,
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  is_live = EXCLUDED.is_live,
  viewer_count = EXCLUDED.viewer_count,
  in_pk_battle = EXCLUDED.in_pk_battle,
  updated_at = NOW();

-- 5. Seed Canonical Active PK Battles (Matching 06_06_pk_discovery_tab.png)

-- Battle 1: Sara Live vs Ayesha (24.8K watching, Featured #1)
INSERT INTO popolive.pk_battles (
  id, battle_type,
  host_a_id, host_a_room, host_a_nickname, host_a_avatar, host_a_score,
  host_b_id, host_b_room, host_b_nickname, host_b_avatar, host_b_score,
  match_method, status, duration_seconds, remaining_seconds, timer_status,
  expires_at, started_at, viewer_count, is_featured, featured_order, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000606', '1v1',
  '00000000-0000-0000-0000-000000088201', '88201', 'Sara Live',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80', 24860,
  '00000000-0000-0000-0000-000000088202', '88202', 'Ayesha',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80', 18320,
  'invitation', 'active', 300, 185, 'running',
  NOW() + INTERVAL '185 seconds', NOW() - INTERVAL '115 seconds',
  24800, true, 1, NOW() - INTERVAL '115 seconds'
) ON CONFLICT (id) DO UPDATE SET
  host_a_score = EXCLUDED.host_a_score,
  host_b_score = EXCLUDED.host_b_score,
  status = 'active',
  remaining_seconds = 185,
  viewer_count = 24800,
  is_featured = true,
  featured_order = 1,
  expires_at = NOW() + INTERVAL '185 seconds';

-- Battle 2: Zoya vs Nimra (11.2K watching, Featured #2)
INSERT INTO popolive.pk_battles (
  id, battle_type,
  host_a_id, host_a_room, host_a_nickname, host_a_avatar, host_a_score,
  host_b_id, host_b_room, host_b_nickname, host_b_avatar, host_b_score,
  match_method, status, duration_seconds, remaining_seconds, timer_status,
  expires_at, started_at, viewer_count, is_featured, featured_order, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000607', '1v1',
  '00000000-0000-0000-0000-000000088203', '88203', 'Zoya',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80', 14200,
  '00000000-0000-0000-0000-000000088204', '88204', 'Nimra',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80', 12850,
  'random', 'active', 300, 240, 'running',
  NOW() + INTERVAL '240 seconds', NOW() - INTERVAL '60 seconds',
  11200, true, 2, NOW() - INTERVAL '60 seconds'
) ON CONFLICT (id) DO UPDATE SET
  host_a_score = EXCLUDED.host_a_score,
  host_b_score = EXCLUDED.host_b_score,
  status = 'active',
  remaining_seconds = 240,
  viewer_count = 11200,
  is_featured = true,
  featured_order = 2,
  expires_at = NOW() + INTERVAL '240 seconds';

-- Battle 3: Hira vs Alina (6.9K watching, Featured #3)
INSERT INTO popolive.pk_battles (
  id, battle_type,
  host_a_id, host_a_room, host_a_nickname, host_a_avatar, host_a_score,
  host_b_id, host_b_room, host_b_nickname, host_b_avatar, host_b_score,
  match_method, status, duration_seconds, remaining_seconds, timer_status,
  expires_at, started_at, viewer_count, is_featured, featured_order, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000608', '1v1',
  '00000000-0000-0000-0000-000000088205', '88205', 'Hira',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80', 8450,
  '00000000-0000-0000-0000-000000088206', '88206', 'Alina',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80', 9100,
  'invitation', 'active', 300, 130, 'running',
  NOW() + INTERVAL '130 seconds', NOW() - INTERVAL '170 seconds',
  6900, true, 3, NOW() - INTERVAL '170 seconds'
) ON CONFLICT (id) DO UPDATE SET
  host_a_score = EXCLUDED.host_a_score,
  host_b_score = EXCLUDED.host_b_score,
  status = 'active',
  remaining_seconds = 130,
  viewer_count = 6900,
  is_featured = true,
  featured_order = 3,
  expires_at = NOW() + INTERVAL '130 seconds';

-- Battle 4: Fatima vs Mehak (Popular battle with 35K watching)
INSERT INTO popolive.pk_battles (
  id, battle_type,
  host_a_id, host_a_room, host_a_nickname, host_a_avatar, host_a_score,
  host_b_id, host_b_room, host_b_nickname, host_b_avatar, host_b_score,
  match_method, status, duration_seconds, remaining_seconds, timer_status,
  expires_at, started_at, viewer_count, is_featured, featured_order, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000609', '1v1',
  '00000000-0000-0000-0000-000000088207', '88207', 'Fatima',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80', 32100,
  '00000000-0000-0000-0000-000000088208', '88208', 'Mehak',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80', 28900,
  'random', 'active', 300, 210, 'running',
  NOW() + INTERVAL '210 seconds', NOW() - INTERVAL '90 seconds',
  35000, false, 0, NOW() - INTERVAL '90 seconds'
) ON CONFLICT (id) DO UPDATE SET
  host_a_score = EXCLUDED.host_a_score,
  host_b_score = EXCLUDED.host_b_score,
  status = 'active',
  remaining_seconds = 210,
  viewer_count = 35000,
  expires_at = NOW() + INTERVAL '210 seconds';

-- 6. Insert Featured Battle entries in pk_featured_battles
INSERT INTO popolive.pk_featured_battles (battle_id, featured_by, featured_order, status)
VALUES
  ('00000000-0000-0000-0000-000000000606', 'admin', 1, 'active'),
  ('00000000-0000-0000-0000-000000000607', 'admin', 2, 'active'),
  ('00000000-0000-0000-0000-000000000608', 'admin', 3, 'active')
ON CONFLICT (battle_id) DO UPDATE SET
  featured_order = EXCLUDED.featured_order,
  status = EXCLUDED.status,
  updated_at = NOW();
