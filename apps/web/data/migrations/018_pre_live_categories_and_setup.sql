-- Migration 018: Pre-Live Categories and Setup
-- Scope: Module 4.2 Pre-Live Title and Category Selection

CREATE TABLE IF NOT EXISTS popolive.live_categories (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  description TEXT,
  icon_name VARCHAR(64) DEFAULT 'chat',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed 7 official categories required by Module 4.2 specification
INSERT INTO popolive.live_categories (id, name, description, icon_name, display_order, is_active)
VALUES
  ('live_chat', 'Live Chat', 'Casual conversation, social interaction & daily talks', 'message-circle', 1, true),
  ('music', 'Music', 'Singing, musical instruments & live performances', 'music', 2, true),
  ('entertainment', 'Entertainment', 'Comedy, dance, drama & variety shows', 'sparkles', 3, true),
  ('lifestyle', 'Lifestyle', 'Fashion, food, travel & life vlogs', 'coffee', 4, true),
  ('gaming', 'Gaming', 'Mobile & PC gaming streams & esports', 'gamepad-2', 5, true),
  ('talent', 'Talent', 'Magic, acrobatics, art & special skills', 'award', 6, true),
  ('education', 'Education', 'Language learning, coaching & discussions', 'book-open', 7, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- Add user default preferences for pre-live broadcasting
ALTER TABLE popolive.users
  ADD COLUMN IF NOT EXISTS preferred_live_title VARCHAR(120) DEFAULT 'Come and chat with me 💕',
  ADD COLUMN IF NOT EXISTS preferred_live_category VARCHAR(32) DEFAULT 'live_chat';
