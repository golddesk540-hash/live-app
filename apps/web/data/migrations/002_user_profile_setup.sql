-- Migration 002: New User Details & Profile Setup
ALTER TABLE popolive.users
  ADD COLUMN IF NOT EXISTS country VARCHAR(64) DEFAULT 'Pakistan',
  ADD COLUMN IF NOT EXISTS country_code VARCHAR(8) DEFAULT 'PK',
  ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT false;

-- Create index on lowercase nickname for fast availability lookups
CREATE INDEX IF NOT EXISTS idx_users_lower_nickname ON popolive.users (LOWER(nickname));
