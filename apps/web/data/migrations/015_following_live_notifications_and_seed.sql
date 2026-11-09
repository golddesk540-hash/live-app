-- Migration 015: Following System, Live Notification Bell & Reference Seed Data
SET search_path TO popolive, public;

-- 1. Add live_notifications_enabled column to user_follows
ALTER TABLE popolive.user_follows
  ADD COLUMN IF NOT EXISTS live_notifications_enabled BOOLEAN DEFAULT true;

-- 2. Seed / Update the 4 official reference followed hosts
DO $$
DECLARE
  v_zara_id UUID;
  v_sana_id UUID;
  v_alina_id UUID;
  v_mehak_id UUID;
  v_viewer_id UUID;
BEGIN
  -- 1. Zara Live
  INSERT INTO popolive.users (email, phone, nickname, poppo_id, status, avatar_url, host_level, wealth_level)
  VALUES ('zaralive@example.com', '+923001112233', 'Zara Live', '8802194', 'active', '/assets/following/zara_live@2x.png', 18, 12)
  ON CONFLICT (email) DO UPDATE SET 
    nickname = 'Zara Live', 
    avatar_url = '/assets/following/zara_live@2x.png',
    host_level = 18
  RETURNING id INTO v_zara_id;

  INSERT INTO popolive.live_rooms (room_number, host_id, title, cover_url, category, status, is_live, viewer_count, country, country_code)
  VALUES ('100220', v_zara_id, 'Zara Live Night Vibes ✨', '/assets/following/zara_live@2x.png', 'live', 'live', true, 1800, 'Pakistan', 'PK')
  ON CONFLICT (room_number) DO UPDATE SET title = EXCLUDED.title, viewer_count = 1800, is_live = true, status = 'live';

  -- 2. Sana Khan
  INSERT INTO popolive.users (email, phone, nickname, poppo_id, status, avatar_url, host_level, wealth_level)
  VALUES ('sana@example.com', '+923004445566', 'Sana Khan', '7730192', 'active', '/assets/following/sana_khan@2x.png', 24, 15)
  ON CONFLICT (email) DO UPDATE SET 
    nickname = 'Sana Khan', 
    avatar_url = '/assets/following/sana_khan@2x.png',
    host_level = 24
  RETURNING id INTO v_sana_id;

  INSERT INTO popolive.live_rooms (room_number, host_id, title, cover_url, category, status, is_live, viewer_count, country, country_code)
  VALUES ('100221', v_sana_id, 'Sana Khan Live Broadcast 🎤', '/assets/following/sana_khan@2x.png', 'live', 'live', true, 892, 'Pakistan', 'PK')
  ON CONFLICT (room_number) DO UPDATE SET title = EXCLUDED.title, viewer_count = 892, is_live = true, status = 'live';

  -- 3. Alina
  INSERT INTO popolive.users (email, phone, nickname, poppo_id, status, avatar_url, host_level, wealth_level)
  VALUES ('alina@example.com', '+923007788990', 'Alina', '6541290', 'active', '/assets/following/alina@2x.png', 14, 8)
  ON CONFLICT (email) DO UPDATE SET 
    nickname = 'Alina', 
    avatar_url = '/assets/following/alina@2x.png',
    host_level = 14
  RETURNING id INTO v_alina_id;

  INSERT INTO popolive.live_rooms (room_number, host_id, title, cover_url, category, status, is_live, viewer_count, country, country_code)
  VALUES ('100223', v_alina_id, 'Alina Chit Chat & Chill 🌸', '/assets/following/alina@2x.png', 'live', 'live', true, 725, 'Pakistan', 'PK')
  ON CONFLICT (room_number) DO UPDATE SET title = EXCLUDED.title, viewer_count = 725, is_live = true, status = 'live';

  -- 4. Mehak
  INSERT INTO popolive.users (email, phone, nickname, poppo_id, status, avatar_url, host_level, wealth_level)
  VALUES ('mehak@example.com', '+923009988771', 'Mehak', '5432109', 'active', '/assets/following/mehak@2x.png', 11, 7)
  ON CONFLICT (email) DO UPDATE SET 
    nickname = 'Mehak', 
    avatar_url = '/assets/following/mehak@2x.png',
    host_level = 11
  RETURNING id INTO v_mehak_id;

  INSERT INTO popolive.live_rooms (room_number, host_id, title, cover_url, category, status, is_live, viewer_count, country, country_code)
  VALUES ('100224', v_mehak_id, 'Mehak Singing Session 🎶', '/assets/following/mehak@2x.png', 'live', 'live', true, 602, 'Pakistan', 'PK')
  ON CONFLICT (room_number) DO UPDATE SET title = EXCLUDED.title, viewer_count = 602, is_live = true, status = 'live';

  -- Connect Follow Relationships for topstreamer test user if exists
  SELECT id INTO v_viewer_id FROM popolive.users WHERE email = 'topstreamer@example.com' LIMIT 1;
  IF v_viewer_id IS NOT NULL THEN
    INSERT INTO popolive.user_follows (follower_id, following_id, live_notifications_enabled)
    VALUES 
      (v_viewer_id, v_zara_id, true),
      (v_viewer_id, v_sana_id, true),
      (v_viewer_id, v_alina_id, true),
      (v_viewer_id, v_mehak_id, true)
    ON CONFLICT (follower_id, following_id) DO UPDATE SET live_notifications_enabled = EXCLUDED.live_notifications_enabled;
  END IF;
END $$;
