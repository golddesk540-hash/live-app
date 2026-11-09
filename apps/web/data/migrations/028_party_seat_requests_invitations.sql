-- ============================================================================
-- Migration 028: Module 5.3 — Taking a Seat (Request / Invite)
-- Strict Reference: 05_03_taking_a_seat_request_invite.png
-- Viewer Seat Requests, Host Approvals/Rejections, Host Invitations, Real-Time States
-- ============================================================================

SET search_path TO popolive, public;

-- 1. Table for Viewer Seat Requests
CREATE TABLE IF NOT EXISTS popolive.party_seat_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID,
  room_number VARCHAR(32) NOT NULL,
  seat_number INTEGER NOT NULL CHECK (seat_number >= 2 AND seat_number <= 9),
  user_id VARCHAR(64) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  user_avatar TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'cancelled', 'expired'
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '2 minutes')
);

CREATE INDEX IF NOT EXISTS idx_seat_requests_room ON popolive.party_seat_requests(room_number, status);
CREATE INDEX IF NOT EXISTS idx_seat_requests_user ON popolive.party_seat_requests(user_id, status);

-- 2. Table for Host Seat Invitations
CREATE TABLE IF NOT EXISTS popolive.party_seat_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID,
  room_number VARCHAR(32) NOT NULL,
  seat_number INTEGER NOT NULL CHECK (seat_number >= 2 AND seat_number <= 9),
  host_id VARCHAR(64) NOT NULL,
  invited_user_id VARCHAR(64) NOT NULL,
  invited_user_name VARCHAR(100) NOT NULL,
  invited_user_avatar TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'cancelled', 'expired'
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '2 minutes')
);

CREATE INDEX IF NOT EXISTS idx_seat_invites_room ON popolive.party_seat_invitations(room_number, status);
CREATE INDEX IF NOT EXISTS idx_seat_invites_user ON popolive.party_seat_invitations(invited_user_id, status);

-- 3. Seed demo initial request for Room 7001 (e.g. Kenji R requesting Seat 2)
INSERT INTO popolive.party_seat_requests (
  room_number, seat_number, user_id, user_name, user_avatar, status, created_at, expires_at
)
VALUES (
  '7001', 2, 'user_kenji_7001', 'Kenji R', '/assets/studio/user_avatar_1.png', 'pending', NOW(), NOW() + INTERVAL '10 minutes'
)
ON CONFLICT DO NOTHING;
