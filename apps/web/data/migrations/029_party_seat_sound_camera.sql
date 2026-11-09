-- ============================================================================
-- Migration 029: Module 5.4 — Sound and Camera on a Seat
-- Strict Reference: 05_04_sound_and_camera_on_a_seat.png
-- Seat Media Controls: Mic, Camera, Host Moderation, Camera Direction
-- ============================================================================

SET search_path TO popolive, public;

-- 1. Add sound and camera moderation columns to party_seats
ALTER TABLE popolive.party_seats
  ADD COLUMN IF NOT EXISTS is_host_muted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_video_disabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS camera_facing VARCHAR(32) NOT NULL DEFAULT 'user';

-- 2. Seed Room 7001 matching 05_04_sound_and_camera_on_a_seat.png
-- Seats 1-6 occupied with active camera and mic, Seats 7-9 empty
INSERT INTO popolive.party_seats (
  room_number, seat_number, participant_id, participant_name, participant_avatar,
  is_host, is_muted, is_camera_on, is_host_muted, is_video_disabled, camera_facing,
  status, occupied_at
)
VALUES
  ('7001', 1, 'host_maria_7001', 'Maria Live', '/assets/party/seat_avatar_1.png', true, false, true, false, false, 'user', 'occupied', NOW()),
  ('7001', 2, 'user_kenji_7001', 'Kenji R', '/assets/party/seat_avatar_2.png', false, false, true, false, false, 'user', 'occupied', NOW()),
  ('7001', 3, 'user_elena_7001', 'Elena V', '/assets/party/seat_avatar_3.png', false, false, true, false, false, 'user', 'occupied', NOW()),
  ('7001', 4, 'user_chloe_7001', 'Chloe T', '/assets/party/seat_avatar_4.png', false, false, true, false, false, 'user', 'occupied', NOW()),
  ('7001', 5, 'user_david_7001', 'David K', '/assets/party/seat_avatar_5.png', false, false, true, false, false, 'user', 'occupied', NOW()),
  ('7001', 6, 'user_sophia_7001', 'Sophia M', '/assets/party/seat_avatar_6.png', false, false, true, false, false, 'user', 'occupied', NOW()),
  ('7001', 7, NULL, NULL, NULL, false, false, false, false, false, 'user', 'available', NULL),
  ('7001', 8, NULL, NULL, NULL, false, false, false, false, false, 'user', 'available', NULL),
  ('7001', 9, NULL, NULL, NULL, false, false, false, false, false, 'user', 'available', NULL)
ON CONFLICT (room_number, seat_number) DO UPDATE SET
  participant_id = EXCLUDED.participant_id,
  participant_name = EXCLUDED.participant_name,
  participant_avatar = EXCLUDED.participant_avatar,
  is_host = EXCLUDED.is_host,
  is_muted = EXCLUDED.is_muted,
  is_camera_on = EXCLUDED.is_camera_on,
  is_host_muted = EXCLUDED.is_host_muted,
  is_video_disabled = EXCLUDED.is_video_disabled,
  camera_facing = EXCLUDED.camera_facing,
  status = EXCLUDED.status,
  occupied_at = EXCLUDED.occupied_at,
  updated_at = CURRENT_TIMESTAMP;
