-- ============================================================================
-- Migration 034: Module 5.10 — Party Rules & Real Acceptance
-- Strict 1:1 Reference: 05_10_party_rules.png
-- Functional Safety Rules, Version Tracking, and Party Room Acceptance
-- ============================================================================

SET search_path TO popolive, public;

-- 1. Create table for Party Rules configuration
CREATE TABLE IF NOT EXISTS popolive.party_rules (
  id VARCHAR(64) PRIMARY KEY,
  party_id VARCHAR(64), -- NULL for platform global rules, room_number for party custom rules
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(64) NOT NULL DEFAULT 'safety',
  icon VARCHAR(64) NOT NULL DEFAULT 'respect',
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 1,
  policy_version VARCHAR(32) NOT NULL DEFAULT 'v1.0',
  created_by VARCHAR(128) NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_party_rules_party 
  ON popolive.party_rules(party_id, is_active, display_order);

CREATE INDEX IF NOT EXISTS idx_party_rules_version 
  ON popolive.party_rules(policy_version, is_active);

-- 2. Create table for User Party Rule Acceptance records
CREATE TABLE IF NOT EXISTS popolive.party_rule_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(128) NOT NULL,
  room_number VARCHAR(64) NOT NULL,
  policy_version VARCHAR(32) NOT NULL DEFAULT 'v1.0',
  is_accepted BOOLEAN NOT NULL DEFAULT TRUE,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(64),
  user_agent TEXT,
  CONSTRAINT unq_party_user_rule_version UNIQUE (user_id, room_number, policy_version)
);

CREATE INDEX IF NOT EXISTS idx_party_rule_acc_user_room 
  ON popolive.party_rule_acceptances(user_id, room_number, policy_version);

-- 3. Create table for Party Rule Violations / Reports (Safety Tools integration)
CREATE TABLE IF NOT EXISTS popolive.party_rule_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(64) NOT NULL,
  reporter_id VARCHAR(128) NOT NULL,
  reported_user_id VARCHAR(128) NOT NULL,
  rule_id VARCHAR(64) NOT NULL,
  reason TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_party_violations_room 
  ON popolive.party_rule_violations(room_number, created_at DESC);

-- 4. Extend popolive.party_rooms with active rules version
ALTER TABLE popolive.party_rooms
  ADD COLUMN IF NOT EXISTS active_rules_version VARCHAR(32) NOT NULL DEFAULT 'v1.0';

-- 5. Seed Canonical 5 Rules matching 05_10_party_rules.png
INSERT INTO popolive.party_rules (id, party_id, title, description, category, icon, is_mandatory, is_active, display_order, policy_version, created_by)
VALUES
  (
    'rule_respect',
    NULL,
    'Be respectful to everyone',
    'Respect all party members and maintain a positive, welcoming environment for everyone in the room.',
    'respect',
    'respect',
    TRUE,
    TRUE,
    1,
    'v1.0',
    'system'
  ),
  (
    'rule_hate_speech',
    NULL,
    'No hate or abusive content',
    'Zero tolerance for harassment, bullying, discrimination, hate speech, threats, or abusive language.',
    'safety',
    'hate_speech',
    TRUE,
    TRUE,
    2,
    'v1.0',
    'system'
  ),
  (
    'rule_inappropriate',
    NULL,
    'No inappropriate content',
    'Explicit, harmful, sexually suggestive, illegal, or violent content is strictly prohibited.',
    'content',
    'inappropriate',
    TRUE,
    TRUE,
    3,
    'v1.0',
    'system'
  ),
  (
    'rule_spam',
    NULL,
    'No spam or promotion',
    'No unsolicited advertising, repetitive spam messages, commercial links, or deceptive promotions.',
    'anti-spam',
    'spam',
    TRUE,
    TRUE,
    4,
    'v1.0',
    'system'
  ),
  (
    'rule_guidelines',
    NULL,
    'Follow Popo Live guidelines',
    'Adhere to all official Popo Live Community Guidelines and follow instructions from host and room moderators.',
    'guidelines',
    'guidelines',
    TRUE,
    TRUE,
    5,
    'v1.0',
    'system'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  is_mandatory = EXCLUDED.is_mandatory,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order,
  policy_version = EXCLUDED.policy_version,
  updated_at = CURRENT_TIMESTAMP;

-- 6. Seed Extended Community Guidelines (rules 6-10) for comprehensive coverage
INSERT INTO popolive.party_rules (id, party_id, title, description, category, icon, is_mandatory, is_active, display_order, policy_version, created_by)
VALUES
  (
    'rule_privacy',
    NULL,
    'Respect user privacy',
    'Do not share personal contact info, private identities, or sensitive data without explicit consent.',
    'safety',
    'privacy',
    TRUE,
    TRUE,
    6,
    'v1.0',
    'system'
  ),
  (
    'rule_impersonation',
    NULL,
    'No impersonation or misleading identity',
    'Do not pretend to be other creators, celebrities, Popo Live staff, or law enforcement.',
    'guidelines',
    'impersonation',
    TRUE,
    TRUE,
    7,
    'v1.0',
    'system'
  ),
  (
    'rule_moderation',
    NULL,
    'Follow host and moderator directions',
    'Respect seat queue management, speaking turns, and moderation decisions made by room leaders.',
    'guidelines',
    'moderation',
    TRUE,
    TRUE,
    8,
    'v1.0',
    'system'
  ),
  (
    'rule_media',
    NULL,
    'Respect microphone and camera permissions',
    'Keep your microphone muted when listening; only broadcast appropriate camera streams.',
    'respect',
    'media',
    TRUE,
    TRUE,
    9,
    'v1.0',
    'system'
  ),
  (
    'rule_age_safety',
    NULL,
    'Protect minor safety & platform integrity',
    'Popo Live strictly prohibits minors from live hosting or participating in adult-only discussions.',
    'safety',
    'age_safety',
    TRUE,
    TRUE,
    10,
    'v1.0',
    'system'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  is_mandatory = EXCLUDED.is_mandatory,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order,
  policy_version = EXCLUDED.policy_version,
  updated_at = CURRENT_TIMESTAMP;
