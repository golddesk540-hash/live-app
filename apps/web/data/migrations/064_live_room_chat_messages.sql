-- Migration 064: Real Live Room Chat Messages Persistence
-- Scope: Phase B4 Prompt 4 of 4: Live Room Chat, Message Persistence & Verification

CREATE TABLE IF NOT EXISTS popolive.live_room_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES popolive.live_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  sender_nickname VARCHAR(100) NOT NULL,
  sender_avatar_url TEXT,
  sender_role VARCHAR(32) DEFAULT 'viewer',
  content VARCHAR(500) NOT NULL,
  message_type VARCHAR(32) DEFAULT 'text',
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_live_room_chat_messages_room_created
  ON popolive.live_room_chat_messages(room_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_live_room_chat_messages_room_active
  ON popolive.live_room_chat_messages(room_id, is_deleted, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_live_room_chat_messages_sender
  ON popolive.live_room_chat_messages(sender_id, created_at DESC);
