-- Migration 013: Party Rooms Discovery List
SET search_path TO popolive, public;

CREATE TABLE IF NOT EXISTS popolive.party_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(32) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  collage_url TEXT NOT NULL,
  current_members INTEGER NOT NULL DEFAULT 1,
  max_members INTEGER NOT NULL DEFAULT 9,
  is_live BOOLEAN NOT NULL DEFAULT true,
  status VARCHAR(32) NOT NULL DEFAULT 'live',
  category VARCHAR(64) NOT NULL DEFAULT 'Party',
  country VARCHAR(64) NOT NULL DEFAULT 'Popular',
  country_code VARCHAR(8) NOT NULL DEFAULT 'ALL',
  flag_emoji VARCHAR(16) NOT NULL DEFAULT '🎉',
  host_nickname VARCHAR(100) NOT NULL DEFAULT 'PopoHost',
  host_avatar TEXT DEFAULT '/avatars/default.png',
  tags TEXT[] DEFAULT '{"9 Seats", "Voice Party", "Interactive"}',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_party_rooms_is_live ON popolive.party_rooms(is_live);
CREATE INDEX IF NOT EXISTS idx_party_rooms_order ON popolive.party_rooms(display_order);

-- Seed the 4 official reference rooms from 03_06_party_discovery_list.png
INSERT INTO popolive.party_rooms (
  room_number, title, collage_url, current_members, max_members, is_live, status, category, country, country_code, flag_emoji, host_nickname, display_order
) VALUES
  ('7001', '🎉 Fun Party Room', '/assets/party/fun_party_collage@2x.png', 9, 9, true, 'live', 'Fun', 'Popular', 'ALL', '🎉', 'Sophia_Star', 1),
  ('7002', 'Music Party', '/assets/party/music_party_collage@2x.png', 6, 9, true, 'live', 'Music', 'Popular', 'ALL', '🎵', 'DJ_Alex', 2),
  ('7003', 'Friends Chat', '/assets/party/friends_chat_collage@2x.png', 4, 9, true, 'live', 'Chat', 'Popular', 'ALL', '💬', 'Emma_Friend', 3),
  ('7004', 'Global Party', '/assets/party/global_party_collage@2x.png', 9, 9, true, 'live', 'Global', 'Global', 'ALL', '🌍', 'Marco_World', 4)
ON CONFLICT (room_number) DO UPDATE SET
  title = EXCLUDED.title,
  collage_url = EXCLUDED.collage_url,
  current_members = EXCLUDED.current_members,
  max_members = EXCLUDED.max_members,
  is_live = EXCLUDED.is_live,
  status = EXCLUDED.status,
  category = EXCLUDED.category,
  country = EXCLUDED.country,
  country_code = EXCLUDED.country_code,
  flag_emoji = EXCLUDED.flag_emoji,
  host_nickname = EXCLUDED.host_nickname,
  display_order = EXCLUDED.display_order,
  updated_at = CURRENT_TIMESTAMP;
