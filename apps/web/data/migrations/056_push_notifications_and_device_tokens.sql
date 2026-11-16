-- Migration 056: Device Token Registration, Push Notification Dispatch Logs & Detailed Notification Preferences
SET search_path TO popolive, public;

-- 1. Device Tokens Table
CREATE TABLE IF NOT EXISTS popolive.user_device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  platform VARCHAR(16) NOT NULL DEFAULT 'android', -- android | ios
  device_model VARCHAR(128) DEFAULT 'Mobile Device',
  app_version VARCHAR(32) DEFAULT '1.0.0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unq_user_device_token UNIQUE (user_id, device_token)
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON popolive.user_device_tokens(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_device_tokens_platform ON popolive.user_device_tokens(platform);

-- 2. Push Notification Dispatch Logs Table
CREATE TABLE IF NOT EXISTS popolive.push_notification_dispatch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  device_token TEXT,
  notification_type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(32) DEFAULT 'sent', -- sent | suppressed_by_preference | suppressed_by_block | failed
  suppression_reason VARCHAR(128),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_push_logs_user ON popolive.push_notification_dispatch_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_logs_type ON popolive.push_notification_dispatch_logs(notification_type);

-- 3. Enhance user_notification_settings with specific messaging & live toggles
ALTER TABLE popolive.user_notification_settings
  ADD COLUMN IF NOT EXISTS direct_messages BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS gift_alerts BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS live_broadcasts BOOLEAN DEFAULT true;
