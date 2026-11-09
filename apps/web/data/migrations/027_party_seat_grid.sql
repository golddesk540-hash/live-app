-- ============================================================================
-- Migration 027: Module 5.2 — Nine-Seat Party Grid
-- Strict 1:1 Reference: 05_02_seat_grid.png
-- Real 9-Seat Party Grid Architecture, Host Seat 1, Real-Time Synchronization
-- ============================================================================

SET search_path TO popolive, public;

-- 1. Create table for Nine-Seat Grid Records
CREATE TABLE IF NOT EXISTS popolive.party_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID,
  room_number VARCHAR(32) NOT NULL,
  seat_number INTEGER NOT NULL CHECK (seat_number >= 1 AND seat_number <= 9),
  participant_id VARCHAR(64),
  participant_name VARCHAR(100),
  participant_avatar TEXT,
  is_host BOOLEAN NOT NULL DEFAULT false,
  is_muted BOOLEAN NOT NULL DEFAULT false,
  is_camera_on BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(32) NOT NULL DEFAULT 'available', -- 'occupied', 'available', 'locked'
  occupied_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_party_seat UNIQUE(room_number, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_party_seats_room ON popolive.party_seats(room_number);
CREATE INDEX IF NOT EXISTS idx_party_seats_participant ON popolive.party_seats(participant_id);

-- 2. Seed Default 9 Seats for Existing Reference Rooms (e.g. 7001, 7002, 7003, 7004)
-- For room 7001: Host Maria Live in Seat 1, Seats 2-9 available
INSERT INTO popolive.party_seats (room_number, seat_number, participant_id, participant_name, participant_avatar, is_host, is_muted, is_camera_on, status, occupied_at)
VALUES
  ('7001', 1, 'host_maria_7001', 'Maria Live', '/assets/studio/host_zara_avatar.png', true, false, true, 'occupied', NOW()),
  ('7001', 2, NULL, NULL, NULL, false, false, false, 'available', NULL),
  ('7001', 3, NULL, NULL, NULL, false, false, false, 'available', NULL),
  ('7001', 4, NULL, NULL, NULL, false, false, false, 'available', NULL),
  ('7001', 5, NULL, NULL, NULL, false, false, false, 'available', NULL),
  ('7001', 6, NULL, NULL, NULL, false, false, false, 'available', NULL),
  ('7001', 7, NULL, NULL, NULL, false, false, false, 'available', NULL),
  ('7001', 8, NULL, NULL, NULL, false, false, false, 'available', NULL),
  ('7001', 9, NULL, NULL, NULL, false, false, false, 'available', NULL)
ON CONFLICT (room_number, seat_number) DO UPDATE SET
  participant_name = EXCLUDED.participant_name,
  participant_avatar = EXCLUDED.participant_avatar,
  is_host = EXCLUDED.is_host,
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;
