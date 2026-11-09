-- ============================================================================
-- Migration 031: Module 5.6 — Party Themes
-- Strict 1:1 Reference: 05_06_themes.png
-- Reusable theme system, theme persistence, host authorization & history
-- ============================================================================

SET search_path TO popolive, public;

-- 1. Create table for available Party Themes
CREATE TABLE IF NOT EXISTS popolive.party_themes (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(255) NOT NULL,
  background_gradient TEXT NOT NULL,
  card_bg TEXT NOT NULL,
  button_gradient TEXT NOT NULL,
  accent_color VARCHAR(32) NOT NULL,
  text_color VARCHAR(32) NOT NULL DEFAULT '#FFFFFF',
  subtext_color VARCHAR(32) NOT NULL DEFAULT '#A78BFA',
  display_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Seed Canonical Themes from 05_06_themes.png + Extended Section 3 Options
INSERT INTO popolive.party_themes (
  id, name, description, thumbnail_url, background_gradient, card_bg, button_gradient, accent_color, text_color, subtext_color, display_order, is_active
) VALUES
  (
    'default',
    'Default',
    'Canonical deep navy and cosmic purple theme with ambient blue orb',
    '/assets/party/theme_thumb_default.png',
    'linear-gradient(180deg, #0b081e 0%, #150f38 45%, #0d0a22 100%)',
    'rgba(26, 20, 56, 0.75)',
    'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)',
    '#8B5CF6',
    '#FFFFFF',
    '#A78BFA',
    1,
    true
  ),
  (
    'galaxy',
    'Galaxy',
    'Vibrant cosmic purple nebula with radiating galactic rays',
    '/assets/party/theme_thumb_galaxy.png',
    'linear-gradient(180deg, #0a0620 0%, #220d4d 45%, #08031a 100%)',
    'rgba(38, 16, 77, 0.75)',
    'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
    '#A855F7',
    '#FFFFFF',
    '#C084FC',
    2,
    true
  ),
  (
    'neon',
    'Neon',
    'Electric hot magenta and neon beams glowing in deep ultraviolet darkness',
    '/assets/party/theme_thumb_neon.png',
    'linear-gradient(180deg, #140320 0%, #3a084c 45%, #0f0219 100%)',
    'rgba(64, 12, 82, 0.75)',
    'linear-gradient(135deg, #D946EF 0%, #EC4899 100%)',
    '#F43F5E',
    '#FFFFFF',
    '#F472B6',
    3,
    true
  ),
  (
    'cute',
    'Cute',
    'Soft glowing peach and warm rose with gentle ambient flares',
    '/assets/party/theme_thumb_cute.png',
    'linear-gradient(180deg, #1a0818 0%, #4a193b 45%, #180614 100%)',
    'rgba(74, 25, 59, 0.75)',
    'linear-gradient(135deg, #FB7185 0%, #F43F5E 100%)',
    '#FB7185',
    '#FFFFFF',
    '#FDA4AF',
    4,
    true
  ),
  (
    'elegant',
    'Elegant',
    'Prestigious champagne gold and bronze orbs with warm luxurious shimmer',
    '/assets/party/theme_thumb_elegant.png',
    'linear-gradient(180deg, #150f08 0%, #3b2810 45%, #110c05 100%)',
    'rgba(59, 40, 16, 0.75)',
    'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
    '#FBBF24',
    '#FFFFFF',
    '#FDE68A',
    5,
    true
  ),
  (
    'party',
    'Party',
    'Electric laser party lights with multi-colored violet and cyan beams',
    '/assets/party/theme_thumb_party.png',
    'linear-gradient(180deg, #090924 0%, #161b4d 45%, #09091f 100%)',
    'rgba(22, 27, 77, 0.75)',
    'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)',
    '#38BDF8',
    '#FFFFFF',
    '#7DD3FC',
    6,
    true
  ),
  (
    'midnight_blue',
    'Midnight Blue',
    'Deep oceanic midnight indigo with subtle celestial glow',
    '/assets/party/theme_thumb_default.png',
    'linear-gradient(180deg, #060d1f 0%, #0d1e45 45%, #050b1a 100%)',
    'rgba(13, 30, 69, 0.75)',
    'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
    '#3B82F6',
    '#FFFFFF',
    '#93C5FD',
    7,
    true
  ),
  (
    'sunset',
    'Sunset',
    'Radiant twilight amber, crimson and dusk purple horizon',
    '/assets/party/theme_thumb_cute.png',
    'linear-gradient(180deg, #220b16 0%, #521626 45%, #190812 100%)',
    'rgba(82, 22, 38, 0.75)',
    'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
    '#FB923C',
    '#FFFFFF',
    '#FED7AA',
    8,
    true
  ),
  (
    'festival',
    'Festival',
    'Carnival festival vibrancy with energetic emerald and gold highlights',
    '/assets/party/theme_thumb_party.png',
    'linear-gradient(180deg, #071913 0%, #113c2c 45%, #05140f 100%)',
    'rgba(17, 60, 44, 0.75)',
    'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    '#34D399',
    '#FFFFFF',
    '#A7F3D0',
    9,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  thumbnail_url = EXCLUDED.thumbnail_url,
  background_gradient = EXCLUDED.background_gradient,
  card_bg = EXCLUDED.card_bg,
  button_gradient = EXCLUDED.button_gradient,
  accent_color = EXCLUDED.accent_color,
  text_color = EXCLUDED.text_color,
  subtext_color = EXCLUDED.subtext_color,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

-- 2. Extend popolive.party_rooms to track active theme directly
ALTER TABLE popolive.party_rooms
  ADD COLUMN IF NOT EXISTS active_theme_id VARCHAR(64) DEFAULT 'default' REFERENCES popolive.party_themes(id);

-- 3. Create table for Active Room Theme State
CREATE TABLE IF NOT EXISTS popolive.party_room_themes (
  room_id VARCHAR(64) PRIMARY KEY,
  theme_id VARCHAR(64) NOT NULL REFERENCES popolive.party_themes(id),
  updated_by VARCHAR(64) NOT NULL DEFAULT 'host_maria',
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create table for Theme Audit History
CREATE TABLE IF NOT EXISTS popolive.party_theme_history (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(64) NOT NULL,
  theme_id VARCHAR(64) NOT NULL REFERENCES popolive.party_themes(id),
  updated_by VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Seed Room 7001 default theme state
INSERT INTO popolive.party_room_themes (room_id, theme_id, updated_by)
VALUES ('7001', 'default', 'host_maria')
ON CONFLICT (room_id) DO UPDATE SET
  theme_id = EXCLUDED.theme_id,
  updated_by = EXCLUDED.updated_by,
  updated_at = CURRENT_TIMESTAMP;

UPDATE popolive.party_rooms
SET active_theme_id = 'default'
WHERE room_number = '7001' OR room_number = '880219';
