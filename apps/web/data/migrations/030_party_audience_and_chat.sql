-- ============================================================================
-- Migration 030: Module 5.5 — Audience and Chat
-- Strict Reference: 05_05_audience_and_chat.png
-- Real-Time Party Audience Tracking & Live Party Chat System
-- ============================================================================

SET search_path TO popolive, public;

-- 1. Table for Party Audience Presence
CREATE TABLE IF NOT EXISTS popolive.party_audience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(32) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  user_avatar TEXT,
  user_level INTEGER DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_heartbeat TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_party_audience_member UNIQUE(room_number, user_id)
);

CREATE INDEX IF NOT EXISTS idx_party_audience_room ON popolive.party_audience(room_number, is_active);
CREATE INDEX IF NOT EXISTS idx_party_audience_user ON popolive.party_audience(user_id);

-- 2. Table for Party Room Live Messages
CREATE TABLE IF NOT EXISTS popolive.party_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(32) NOT NULL,
  sender_id VARCHAR(64) NOT NULL,
  sender_name VARCHAR(100) NOT NULL,
  sender_avatar TEXT,
  sender_role VARCHAR(32) NOT NULL DEFAULT 'audience', -- 'host', 'participant', 'audience', 'moderator'
  seat_number INTEGER, -- null for audience, 1-9 for seated participants
  message_text VARCHAR(300) NOT NULL,
  emoji VARCHAR(32),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_party_messages_room ON popolive.party_messages(room_number, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_party_messages_sender ON popolive.party_messages(sender_id, created_at DESC);

-- 3. Seed Canonical Reference Audience for Room 7001
INSERT INTO popolive.party_audience (room_number, user_id, user_name, user_avatar, user_level, is_active)
VALUES
  ('7001', 'aud_ali_khan', 'Ali Khan', '/assets/party/chat_avatar_ali_khan.png', 5, true),
  ('7001', 'aud_sana', 'Sana', '/assets/party/chat_avatar_sana.png', 4, true),
  ('7001', 'aud_bilal', 'Bilal', '/assets/party/chat_avatar_bilal.png', 7, true),
  ('7001', 'aud_zoya', 'Zoya', '/assets/party/chat_avatar_zoya.png', 6, true),
  ('7001', 'aud_tariq', 'Tariq Vance', '/assets/chat/avatar_rizwan.png', 3, true),
  ('7001', 'aud_nadia', 'Nadia Khan', '/assets/chat/avatar_sana.png', 8, true),
  ('7001', 'aud_arjun', 'Arjun Verma', '/assets/chat/avatar_bilal.png', 2, true),
  ('7001', 'aud_hina', 'Hina Malik', '/assets/chat/avatar_mehak.png', 9, true)
ON CONFLICT (room_number, user_id) DO UPDATE SET
  user_name = EXCLUDED.user_name,
  user_avatar = EXCLUDED.user_avatar,
  is_active = true,
  last_heartbeat = CURRENT_TIMESTAMP;

-- 4. Seed Canonical 4 Chat Messages from 05_05_audience_and_chat.png
-- Ordered chronologically: Ali Khan -> Sana -> Bilal -> Zoya
INSERT INTO popolive.party_messages (room_number, sender_id, sender_name, sender_avatar, sender_role, message_text, emoji, created_at)
VALUES
  ('7001', 'aud_ali_khan', 'Ali Khan', '/assets/party/chat_avatar_ali_khan.png', 'audience', 'Great party! 🎉', '🎉', NOW() - INTERVAL '30 seconds'),
  ('7001', 'aud_sana', 'Sana', '/assets/party/chat_avatar_sana.png', 'audience', 'Can I join a seat? 😀', '😀', NOW() - INTERVAL '20 seconds'),
  ('7001', 'aud_bilal', 'Bilal', '/assets/party/chat_avatar_bilal.png', 'audience', 'Amazing vibes 💜', '💜', NOW() - INTERVAL '10 seconds'),
  ('7001', 'aud_zoya', 'Zoya', '/assets/party/chat_avatar_zoya.png', 'audience', 'Love this room! ❤️', '❤️', NOW() - INTERVAL '2 seconds');
