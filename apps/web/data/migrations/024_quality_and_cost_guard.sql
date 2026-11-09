-- Migration 024: Quality and Cost Guard (Module 4.9)
-- Persistent storage for stream quality settings, adaptive cost guard, and low-data modes

SET search_path TO popolive, public;

CREATE TABLE IF NOT EXISTS popolive.user_quality_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES popolive.users(id) ON DELETE CASCADE,
  device_id VARCHAR(128),
  preferred_quality VARCHAR(32) DEFAULT 'auto', -- 'auto', '1080p', '720p', '480p', '360p'
  cost_guard_enabled BOOLEAN DEFAULT true,
  low_data_mode BOOLEAN DEFAULT false,
  auto_adjust_weak_network BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_quality UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_quality_user ON popolive.user_quality_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quality_device ON popolive.user_quality_settings(device_id);

ALTER TABLE popolive.live_rooms
  ADD COLUMN IF NOT EXISTS current_stream_quality VARCHAR(32) DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS is_cost_guard_active BOOLEAN DEFAULT true;
