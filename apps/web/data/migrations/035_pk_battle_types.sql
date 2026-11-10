-- ============================================================================
-- Migration 035: Phase 6 Module 6.1 — PK Battle Types (1v1 & Optional 4-Host)
-- Strict 1:1 Reference: 06_01_battle_types.png
-- Battle Types Catalog, Feature Flags, PK Session Config, and Selection Logging
-- ============================================================================

SET search_path TO popolive, public;

-- 1. Create PK Feature Flags Table
CREATE TABLE IF NOT EXISTS popolive.pk_feature_flags (
  flag_key VARCHAR(64) PRIMARY KEY,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO popolive.pk_feature_flags (flag_key, is_enabled, description)
VALUES
  ('pk_1v1_enabled', true, 'Enables 1v1 PK battles between two hosts.'),
  ('pk_4host_enabled', false, 'Feature flag for 4-host PK battles (locked for future release).')
ON CONFLICT (flag_key) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 2. Create PK Battle Types Catalog Table
CREATE TABLE IF NOT EXISTS popolive.pk_battle_types (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  name_ur VARCHAR(64) NOT NULL,
  description TEXT,
  description_ur TEXT,
  max_hosts INT NOT NULL DEFAULT 2,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  feature_flag VARCHAR(64) REFERENCES popolive.pk_feature_flags(flag_key),
  display_order INT NOT NULL DEFAULT 1,
  badge_text VARCHAR(32),
  badge_text_ur VARCHAR(32),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Seed Canonical Battle Types from Module 6.1
INSERT INTO popolive.pk_battle_types 
  (id, name, name_ur, description, description_ur, max_hosts, is_enabled, is_locked, feature_flag, display_order, badge_text, badge_text_ur)
VALUES
  (
    '1v1',
    '1 vs 1',
    '1 بمقابلہ 1',
    'Two hosts compete in real-time with separate scores and battle areas.',
    'دو میزبان الگ الگ اسکور اور میدانِ مقابلہ کے ساتھ آمنے سامنے مقابلہ کرتے ہیں۔',
    2,
    true,
    false,
    'pk_1v1_enabled',
    1,
    'Active',
    'فعال'
  ),
  (
    '4_host',
    '4-Host Battle',
    '4 میزبان جنگ',
    'Four hosts battle simultaneously with multi-grid scores (Coming Soon).',
    'چار میزبان بیک وقت مقابلہ کریں گے (جلد آرہا ہے)۔',
    4,
    false,
    true,
    'pk_4host_enabled',
    2,
    'Locked',
    'مقفل'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ur = EXCLUDED.name_ur,
  description = EXCLUDED.description,
  description_ur = EXCLUDED.description_ur,
  max_hosts = EXCLUDED.max_hosts,
  is_enabled = EXCLUDED.is_enabled,
  is_locked = EXCLUDED.is_locked,
  feature_flag = EXCLUDED.feature_flag,
  display_order = EXCLUDED.display_order,
  badge_text = EXCLUDED.badge_text,
  badge_text_ur = EXCLUDED.badge_text_ur,
  updated_at = CURRENT_TIMESTAMP;

-- 3. Create PK Battle Sessions Table (holds battle setup state)
CREATE TABLE IF NOT EXISTS popolive.pk_battle_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(64) NOT NULL,
  host_id VARCHAR(128) NOT NULL,
  battle_type VARCHAR(32) NOT NULL REFERENCES popolive.pk_battle_types(id),
  language VARCHAR(8) NOT NULL DEFAULT 'en',
  status VARCHAR(32) NOT NULL DEFAULT 'configured', -- 'configured', 'matching', 'active', 'ended', 'cancelled'
  configured_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pk_sessions_room 
  ON popolive.pk_battle_sessions(room_number, configured_at DESC);

CREATE INDEX IF NOT EXISTS idx_pk_sessions_host 
  ON popolive.pk_battle_sessions(host_id, status);

-- 4. Create PK Battle Selection Audit Logs
CREATE TABLE IF NOT EXISTS popolive.pk_selection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(64) NOT NULL,
  user_id VARCHAR(128) NOT NULL,
  attempted_type VARCHAR(32) NOT NULL,
  was_accepted BOOLEAN NOT NULL,
  rejection_reason TEXT,
  ip_address VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pk_selection_logs_room 
  ON popolive.pk_selection_logs(room_number, created_at DESC);
