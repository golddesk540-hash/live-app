-- Migration 023: End Screen and Live Center (Module 4.8)
-- Schema enhancements for live session termination, duration calculations, and host live history

SET search_path TO popolive, public;

ALTER TABLE popolive.live_rooms
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_viewers INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS new_followers INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_received BIGINT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_live_rooms_host_ended 
  ON popolive.live_rooms(host_id, ended_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_rooms_status_ended 
  ON popolive.live_rooms(status, ended_at DESC);

-- Update existing ended rooms to have calculated duration_seconds if started_at and ended_at exist
UPDATE popolive.live_rooms
SET duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER)
WHERE ended_at IS NOT NULL AND (duration_seconds = 0 OR duration_seconds IS NULL);
