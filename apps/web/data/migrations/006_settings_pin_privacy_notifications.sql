-- Migration 006: Settings, Security PIN, Privacy Settings & Notifications
SET search_path TO popolive, public;

-- Add PIN and Language fields to users table
ALTER TABLE popolive.users
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(8) DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS is_pin_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS pin_failed_attempts INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMPTZ;

-- User Privacy Settings Table
CREATE TABLE IF NOT EXISTS popolive.user_privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES popolive.users(id) ON DELETE CASCADE,
  profile_visibility VARCHAR(32) DEFAULT 'everyone',
  birthday_visibility VARCHAR(32) DEFAULT 'only_me',
  gender_visibility VARCHAR(32) DEFAULT 'everyone',
  online_status_visibility VARCHAR(32) DEFAULT 'everyone',
  follow_permissions VARCHAR(32) DEFAULT 'everyone',
  message_permissions VARCHAR(32) DEFAULT 'everyone',
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User Notification Preferences Table
CREATE TABLE IF NOT EXISTS popolive.user_notification_settings (
  user_id UUID PRIMARY KEY REFERENCES popolive.users(id) ON DELETE CASCADE,
  account_notifications BOOLEAN DEFAULT true,
  security_notifications BOOLEAN DEFAULT true,
  system_announcements BOOLEAN DEFAULT true,
  promotional_notifications BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
