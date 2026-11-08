-- Migration 012: Discovery Banners, Banner Clicks, and Ranking Structure
SET search_path TO popolive, public;

-- 1. Discovery Banners Table
CREATE TABLE IF NOT EXISTS popolive.discovery_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  desktop_image_url TEXT,
  mobile_image_url TEXT,
  destination VARCHAR(255) NOT NULL DEFAULT '/ranking',
  cta_text VARCHAR(64) DEFAULT 'View Now >',
  badge_text VARCHAR(64) DEFAULT 'HOT',
  display_order INT DEFAULT 0,
  start_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP - INTERVAL '1 day',
  end_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP + INTERVAL '90 days',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_banners_active_dates ON popolive.discovery_banners(active, start_date, end_date, display_order ASC);

-- 2. Banner Clicks Analytics Table
CREATE TABLE IF NOT EXISTS popolive.banner_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id UUID NOT NULL REFERENCES popolive.discovery_banners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES popolive.users(id) ON DELETE SET NULL,
  ip_hash VARCHAR(64),
  user_agent TEXT,
  clicked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_banner_clicks_banner ON popolive.banner_clicks(banner_id);
CREATE INDEX IF NOT EXISTS idx_banner_clicks_date ON popolive.banner_clicks(clicked_at DESC);

-- 3. Seed Initial Promotional Banners matching 03_05_banners_and_rank_door.png
INSERT INTO popolive.discovery_banners (
  title, description, destination, cta_text, badge_text, display_order, active, desktop_image_url, mobile_image_url
) VALUES 
(
  'Top Hosts',
  'Monthly Ranking',
  '/ranking/host',
  'View Now >',
  'MONTHLY',
  1,
  true,
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'
),
(
  'PK Championship Arena',
  'Epic Live Battles & Big Rewards',
  '/live/pk',
  'Join Arena >',
  'ARENA',
  2,
  true,
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'
),
(
  'Star Streamer Carnival 2026',
  'Weekly Wealth & Popularity Leaderboard',
  '/ranking/wealth',
  'Explore Now >',
  'SPECIAL',
  3,
  true,
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80'
)
ON CONFLICT DO NOTHING;
