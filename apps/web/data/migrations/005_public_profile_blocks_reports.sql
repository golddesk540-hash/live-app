-- Migration 005: Public Profile, User Blocks & User Reports
SET search_path TO popolive, public;

-- Ensure user_follows table has required indexes
CREATE TABLE IF NOT EXISTS popolive.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unq_user_follow UNIQUE (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON popolive.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON popolive.user_follows(following_id);

-- User Blocks Table
CREATE TABLE IF NOT EXISTS popolive.user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unq_user_block UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON popolive.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON popolive.user_blocks(blocked_id);

-- User Reports Table
CREATE TABLE IF NOT EXISTS popolive.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  reason VARCHAR(64) NOT NULL,
  description TEXT,
  status VARCHAR(32) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter ON popolive.user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON popolive.user_reports(reported_id);
