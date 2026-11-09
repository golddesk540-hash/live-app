-- Migration 019: Host Studio Live Sessions and Agora Integration
-- Scope: Module 4.3 Host Studio

ALTER TABLE popolive.live_rooms
  ADD COLUMN IF NOT EXISTS agora_channel_name VARCHAR(120),
  ADD COLUMN IF NOT EXISTS agora_uid INTEGER,
  ADD COLUMN IF NOT EXISTS peak_viewer_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_likes INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS popolive.live_broadcast_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES popolive.live_rooms(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  event_type VARCHAR(64) NOT NULL, -- 'started', 'camera_toggled', 'mic_toggled', 'ended'
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_broadcast_logs_room ON popolive.live_broadcast_logs(room_id, created_at);
