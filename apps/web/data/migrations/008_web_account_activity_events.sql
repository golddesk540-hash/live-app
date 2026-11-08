-- Migration 008: Web Account Management, Security Events, and Account Preferences
SET search_path TO popolive, public;

-- 1. Add verification and preference fields to users table
ALTER TABLE popolive.users
  ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(64) DEFAULT 'Asia/Karachi (UTC+5)',
  ADD COLUMN IF NOT EXISTS display_theme VARCHAR(32) DEFAULT 'dark',
  ADD COLUMN IF NOT EXISTS stream_quality VARCHAR(32) DEFAULT 'auto';

-- 2. Create Security Events & Account Activity Table
CREATE TABLE IF NOT EXISTS popolive.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  event_type VARCHAR(64) NOT NULL,
  description TEXT NOT NULL,
  ip_hash VARCHAR(64),
  device_info VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_security_events_user ON popolive.security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON popolive.security_events(event_type);
