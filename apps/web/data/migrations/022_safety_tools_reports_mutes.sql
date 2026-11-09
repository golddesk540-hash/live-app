-- Migration 022: Safety Tools - Live Room Reports and Room Mutes
-- Scope: Phase 4 Module 4.6 Safety Tools

SET search_path TO popolive, public;

-- 1. Ensure live room report columns exist on popolive.user_reports
ALTER TABLE popolive.user_reports 
  ADD COLUMN IF NOT EXISTS room_id VARCHAR(64),
  ADD COLUMN IF NOT EXISTS report_category VARCHAR(64) DEFAULT 'live_room',
  ADD COLUMN IF NOT EXISTS reporter_identifier VARCHAR(64),
  ADD COLUMN IF NOT EXISTS reported_identifier VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_reports_room ON popolive.user_reports(room_id, created_at DESC);

-- 2. Create Live Room Mutes Table
CREATE TABLE IF NOT EXISTS popolive.live_room_mutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id VARCHAR(64) NOT NULL,
  muter_id VARCHAR(64) NOT NULL,
  muted_user_id VARCHAR(64) NOT NULL,
  muted_nickname VARCHAR(100),
  mute_type VARCHAR(32) NOT NULL DEFAULT 'viewer_local', -- 'viewer_local' or 'room_global'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unq_room_mute UNIQUE (room_id, muter_id, muted_user_id, mute_type)
);

CREATE INDEX IF NOT EXISTS idx_mutes_room_muter 
  ON popolive.live_room_mutes(room_id, muter_id, is_active);

CREATE INDEX IF NOT EXISTS idx_mutes_room_target 
  ON popolive.live_room_mutes(room_id, muted_user_id, is_active);
