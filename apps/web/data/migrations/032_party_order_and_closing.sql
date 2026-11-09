-- ============================================================================
-- Migration 032: Module 5.8 — Order and Closing
-- Strict 1:1 Reference: 05_08_order_and_closing.png
-- Real Party Seat Reordering, Host Protection, Lifecycle Closure & Audit
-- ============================================================================

SET search_path TO popolive, public;

-- 1. Extend party_rooms with closure audit columns
ALTER TABLE popolive.party_rooms
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_by VARCHAR(64),
  ADD COLUMN IF NOT EXISTS closing_reason VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_party_rooms_closed_at ON popolive.party_rooms(closed_at);
CREATE INDEX IF NOT EXISTS idx_party_rooms_status ON popolive.party_rooms(status);

-- 2. Audit log table for Party Closures
CREATE TABLE IF NOT EXISTS popolive.party_closing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(32) NOT NULL REFERENCES popolive.party_rooms(room_number) ON DELETE CASCADE,
  closed_by VARCHAR(64) NOT NULL,
  closed_by_role VARCHAR(32) NOT NULL DEFAULT 'host',
  reason VARCHAR(255) DEFAULT 'Host ended party',
  duration_seconds INTEGER DEFAULT 0,
  peak_audience INTEGER DEFAULT 0,
  total_seated INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_party_closing_logs_room ON popolive.party_closing_logs(room_number);
CREATE INDEX IF NOT EXISTS idx_party_closing_logs_closed_by ON popolive.party_closing_logs(closed_by);

-- 3. Audit log table for Seat Reorder operations
CREATE TABLE IF NOT EXISTS popolive.party_seat_reorder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(32) NOT NULL,
  reordered_by VARCHAR(64) NOT NULL,
  from_seat INTEGER NOT NULL,
  to_seat INTEGER NOT NULL,
  participant_id VARCHAR(64) NOT NULL,
  action_type VARCHAR(32) NOT NULL DEFAULT 'swap', -- 'swap' or 'move'
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_party_reorder_logs_room ON popolive.party_seat_reorder_logs(room_number);
