-- Migration 020: Live Room Viewer Presence and Agora Audience Streaming
-- Scope: Module 4.4 Viewer Room

CREATE TABLE IF NOT EXISTS popolive.live_room_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES popolive.live_rooms(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES popolive.users(id) ON DELETE CASCADE,
  session_id VARCHAR(120) NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  device_info JSONB DEFAULT '{}'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_room_viewer
  ON popolive.live_room_viewers(room_id, session_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_room_viewers_active ON popolive.live_room_viewers(room_id, is_active);
