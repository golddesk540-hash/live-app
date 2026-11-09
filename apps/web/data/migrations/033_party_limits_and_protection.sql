-- ============================================================================
-- Migration 033: Module 5.9 — Limits that Protect the Room
-- Strict 1:1 Reference: 05_09_limits_that_protect_the_room.png
-- Room Limits, Max Seats, Audience Limit, Join Requests, Invite Only, Lock Room
-- ============================================================================

SET search_path TO popolive, public;

-- 1. Extend party_rooms with limits & protection settings
ALTER TABLE popolive.party_rooms
  ADD COLUMN IF NOT EXISTS max_audience INTEGER NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS allow_join_requests BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_invite_only BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seats_layout VARCHAR(32) NOT NULL DEFAULT '9 (3x3)',
  ADD COLUMN IF NOT EXISTS limits_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS limits_updated_by VARCHAR(64) DEFAULT 'host_maria';

CREATE INDEX IF NOT EXISTS idx_party_rooms_limits_locked ON popolive.party_rooms(is_locked);
CREATE INDEX IF NOT EXISTS idx_party_rooms_invite_only ON popolive.party_rooms(is_invite_only);

-- 2. Audit log table for Room Limits Changes
CREATE TABLE IF NOT EXISTS popolive.party_limits_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(32) NOT NULL REFERENCES popolive.party_rooms(room_number) ON DELETE CASCADE,
  max_seats INTEGER NOT NULL DEFAULT 9,
  max_audience INTEGER NOT NULL DEFAULT 1000,
  allow_join_requests BOOLEAN NOT NULL DEFAULT true,
  is_invite_only BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  updated_by VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_party_limits_logs_room ON popolive.party_limits_logs(room_number);
