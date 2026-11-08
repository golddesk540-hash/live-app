-- Migration 003: Session Device Tracking & Revocation Management
ALTER TABLE popolive.sessions
  ADD COLUMN IF NOT EXISTS device_type VARCHAR(32) DEFAULT 'desktop',
  ADD COLUMN IF NOT EXISTS browser_name VARCHAR(64) DEFAULT 'Chrome',
  ADD COLUMN IF NOT EXISTS os_name VARCHAR(64) DEFAULT 'Windows',
  ADD COLUMN IF NOT EXISTS location VARCHAR(64) DEFAULT 'Pakistan',
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN DEFAULT false;

-- Create index on user_id and is_revoked for session listing & cleanup
CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON popolive.sessions (user_id, is_revoked, expires_at);
