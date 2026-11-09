-- Migration 021: Real-Time Live Room Chat Messages
-- Scope: Module 4.5 Live Chat

CREATE TABLE IF NOT EXISTS popolive.live_room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id VARCHAR(64) NOT NULL,
  sender_id VARCHAR(64),
  sender_nickname VARCHAR(100) NOT NULL,
  sender_avatar_url TEXT,
  sender_role VARCHAR(32) DEFAULT 'viewer', -- 'host', 'viewer', 'vip', 'moderator', 'admin'
  message_text VARCHAR(300) NOT NULL,
  emoji VARCHAR(32),
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_room_messages_room_created 
  ON popolive.live_room_messages(room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_room_messages_sender 
  ON popolive.live_room_messages(sender_id, created_at DESC);
