-- Migration 014: Search Seed Data and Indexes for Module 3.7
SET search_path TO popolive, public;

-- 1. Create search indexes on users, live rooms, and party rooms
CREATE INDEX IF NOT EXISTS idx_users_nickname_lower ON popolive.users (LOWER(nickname));
CREATE INDEX IF NOT EXISTS idx_users_poppo_id ON popolive.users (poppo_id);
CREATE INDEX IF NOT EXISTS idx_live_rooms_title_lower ON popolive.live_rooms (LOWER(title));
CREATE INDEX IF NOT EXISTS idx_party_rooms_title_lower ON popolive.party_rooms (LOWER(title));

-- 2. Seed 'Zara Live' and 'Sana' if not exists
DO $$
DECLARE
  v_zara_id UUID;
  v_sana_id UUID;
BEGIN
  -- Insert Zara Live
  INSERT INTO popolive.users (email, phone, nickname, poppo_id, status, bio, host_level, wealth_level)
  VALUES ('zaralive@example.com', '+923001112233', 'Zara Live', '8802194', 'active', 'Official Popo Live Host 🌟 Welcome to my broadcast!', 18, 12)
  ON CONFLICT (email) DO UPDATE SET nickname = 'Zara Live', poppo_id = '8802194', host_level = 18, wealth_level = 12
  RETURNING id INTO v_zara_id;

  IF v_zara_id IS NOT NULL THEN
    -- Live Room for Zara
    INSERT INTO popolive.live_rooms (
      room_number, host_id, title, cover_url, category, status, is_live, viewer_count, country, country_code
    ) VALUES (
      '100220', v_zara_id, 'Zara Live Night Vibes ✨', '/avatars/default.png', 'live', 'live', true, 1420, 'Pakistan', 'PK'
    ) ON CONFLICT (room_number) DO UPDATE SET title = EXCLUDED.title, is_live = true, status = 'live';
  END IF;

  -- Insert Sana
  INSERT INTO popolive.users (email, phone, nickname, poppo_id, status, bio, host_level, wealth_level)
  VALUES ('sana@example.com', '+923004445566', 'Sana', '7730192', 'active', 'Singer & Host 🎶 Let us chat and enjoy music!', 24, 15)
  ON CONFLICT (email) DO UPDATE SET nickname = 'Sana', poppo_id = '7730192', host_level = 24, wealth_level = 15
  RETURNING id INTO v_sana_id;

  IF v_sana_id IS NOT NULL THEN
    -- Live Room for Sana
    INSERT INTO popolive.live_rooms (
      room_number, host_id, title, cover_url, category, status, is_live, viewer_count, country, country_code
    ) VALUES (
      '100221', v_sana_id, 'Sana - Singing & Chit Chat 🎤', '/avatars/default.png', 'live', 'live', true, 2890, 'Pakistan', 'PK'
    ) ON CONFLICT (room_number) DO UPDATE SET title = EXCLUDED.title, is_live = true, status = 'live';

    -- PK Room for PK search chip
    INSERT INTO popolive.live_rooms (
      room_number, host_id, title, cover_url, category, status, is_live, is_pk, viewer_count, country, country_code
    ) VALUES (
      '100222', v_sana_id, 'PK Room: Top Broadcaster Battle ⚔️', '/avatars/default.png', 'pk', 'live', true, true, 5320, 'Pakistan', 'PK'
    ) ON CONFLICT (room_number) DO UPDATE SET title = EXCLUDED.title, is_live = true, status = 'live', is_pk = true;
  END IF;
END $$;
