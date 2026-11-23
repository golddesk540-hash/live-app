-- Migration 063: Live Room Viewers Presence Indexes and Helpers
-- Scope: Phase B4 Prompt 3: Real Database-Backed Live Viewer Join, Leave, Presence & Real Counts

-- 1. Composite index for active room viewer queries by user
CREATE INDEX IF NOT EXISTS idx_live_room_viewers_user_room_active 
  ON popolive.live_room_viewers (room_id, viewer_id, is_active);

-- 2. Index for active heartbeat filtering and stale presence expiration
CREATE INDEX IF NOT EXISTS idx_live_room_viewers_heartbeat_active 
  ON popolive.live_room_viewers (is_active, last_heartbeat);

-- 3. Composite index for viewer_id lookup across rooms
CREATE INDEX IF NOT EXISTS idx_live_room_viewers_viewer_active 
  ON popolive.live_room_viewers (viewer_id, is_active);

-- 4. Unique partial index to ensure a viewer user is only active once per room (in addition to session_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_room_user
  ON popolive.live_room_viewers (room_id, viewer_id)
  WHERE is_active = true AND viewer_id IS NOT NULL;
