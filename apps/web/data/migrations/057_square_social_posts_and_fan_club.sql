-- ============================================================================
-- POPO LIVE MIGRATION 057: SQUARE SOCIAL POSTS, COMMENTS, REPORTS & FAN CLUB
-- Module M7: Complete Square Community, Feed, Media Uploads & Fan Clubs
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS popolive;

-- 1. Square Posts Table
CREATE TABLE IF NOT EXISTS popolive.square_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_type VARCHAR(32) NOT NULL DEFAULT 'none', -- 'none', 'single_image', 'two_images', 'multi_images', 'video', 'live_room'
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  video_url TEXT,
  video_thumbnail_url TEXT,
  video_duration VARCHAR(32),
  video_title VARCHAR(255),
  live_room_label VARCHAR(120),
  live_room_id VARCHAR(64),
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  visibility VARCHAR(32) NOT NULL DEFAULT 'Public', -- 'Public', 'Followers', 'Following', 'Private', 'VIP Circle'
  likes_count INT NOT NULL DEFAULT 0,
  comments_count INT NOT NULL DEFAULT 0,
  shares_count INT NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(32) NOT NULL DEFAULT 'published', -- 'published', 'hidden', 'removed_by_moderator'
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_square_posts_created_at ON popolive.square_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_square_posts_author ON popolive.square_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_square_posts_status ON popolive.square_posts(status);

-- 2. Square Post Likes Table
CREATE TABLE IF NOT EXISTS popolive.square_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES popolive.square_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_square_post_likes UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_square_post_likes_post ON popolive.square_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_square_post_likes_user ON popolive.square_post_likes(user_id);

-- 3. Square Comments Table
CREATE TABLE IF NOT EXISTS popolive.square_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES popolive.square_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES popolive.square_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active', 'deleted_by_author', 'removed_by_moderator'
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_square_comments_post ON popolive.square_comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_square_comments_author ON popolive.square_comments(author_id);

-- 4. Square Comment Likes Table
CREATE TABLE IF NOT EXISTS popolive.square_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES popolive.square_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_square_comment_likes UNIQUE (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_square_comment_likes_comment ON popolive.square_comment_likes(comment_id);

-- 5. Square Community Reports Table
CREATE TABLE IF NOT EXISTS popolive.square_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  target_type VARCHAR(32) NOT NULL, -- 'post' or 'comment'
  target_id UUID NOT NULL,
  reason VARCHAR(100) NOT NULL, -- 'Spam', 'Harassment or bullying', 'Hate speech', 'Inappropriate content', 'Violence or threats', 'Fake or misleading information', 'Other'
  description TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed', 'actioned'
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_square_reports UNIQUE (reporter_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_square_reports_target ON popolive.square_reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_square_reports_reporter ON popolive.square_reports(reporter_id);

-- 6. Fan Clubs Table
CREATE TABLE IF NOT EXISTS popolive.fan_clubs (
  id VARCHAR(64) PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  badge_label VARCHAR(64) NOT NULL,
  club_level INT NOT NULL DEFAULT 1,
  member_count INT NOT NULL DEFAULT 0,
  cover_image_url TEXT,
  accent_tone VARCHAR(32) NOT NULL DEFAULT 'gold',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fan_clubs_host ON popolive.fan_clubs(host_id);

-- 7. Fan Club Members Table
CREATE TABLE IF NOT EXISTS popolive.fan_club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id VARCHAR(64) NOT NULL REFERENCES popolive.fan_clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  role VARCHAR(32) NOT NULL DEFAULT 'member', -- 'member', 'elder', 'admin'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_fan_club_members UNIQUE (club_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_fan_club_members_club ON popolive.fan_club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_fan_club_members_user ON popolive.fan_club_members(user_id);

-- 8. Fan Club Invitations Table
CREATE TABLE IF NOT EXISTS popolive.fan_club_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id VARCHAR(64) NOT NULL REFERENCES popolive.fan_clubs(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  invite_code VARCHAR(32),
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'expired'
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
  CONSTRAINT uq_fan_club_invites UNIQUE (club_id, invitee_id)
);

CREATE INDEX IF NOT EXISTS idx_fan_club_invites_invitee ON popolive.fan_club_invites(invitee_id, status);

-- 9. Real-time Events for Square & Fan Club
CREATE TABLE IF NOT EXISTS popolive.square_realtime_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(64) NOT NULL,
  target_user_id UUID,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_square_realtime_events_type ON popolive.square_realtime_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_square_realtime_events_user ON popolive.square_realtime_events(target_user_id);
