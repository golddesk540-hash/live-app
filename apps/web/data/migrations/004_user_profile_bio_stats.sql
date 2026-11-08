-- Migration 004: User Bio, Host/Wealth Levels, Follows & Gifts
ALTER TABLE popolive.users
  ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS host_level INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS wealth_level INT DEFAULT 1;

-- Follows table for social relationships
CREATE TABLE IF NOT EXISTS popolive.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unq_user_follow UNIQUE (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON popolive.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON popolive.user_follows(following_id);

-- Gifts table for stream gifting history & stats
CREATE TABLE IF NOT EXISTS popolive.user_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES popolive.users(id) ON DELETE SET NULL,
  receiver_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  gift_name VARCHAR(64) NOT NULL,
  gift_coins INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gifts_receiver ON popolive.user_gifts(receiver_id);
