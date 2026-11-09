-- ============================================================================
-- Migration 025: Module 4.10 — Host Rules on Screen
-- Strict 1:1 Reference: 04_10_host_rules_on_screen.png
-- Functional Safety Rules, Version Tracking, and Host Acknowledgements
-- ============================================================================

-- 1. Create table for Host Rules configuration & versions
CREATE TABLE IF NOT EXISTS popolive.host_rules (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(64) NOT NULL DEFAULT 'safety',
  icon VARCHAR(64) DEFAULT 'check',
  display_order INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  policy_version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create table for Host Rule Acknowledgement records
CREATE TABLE IF NOT EXISTS popolive.host_rule_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  host_poppo_id VARCHAR(64),
  policy_version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
  is_accepted BOOLEAN NOT NULL DEFAULT TRUE,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(64),
  user_agent TEXT,
  is_reacceptance BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_host_ack_user_version 
  ON popolive.host_rule_acknowledgements (user_id, policy_version);

CREATE INDEX IF NOT EXISTS idx_host_ack_poppo_id 
  ON popolive.host_rule_acknowledgements (host_poppo_id);

-- 3. Extend popolive.users with host rules acceptance cache
ALTER TABLE popolive.users
  ADD COLUMN IF NOT EXISTS has_accepted_host_rules BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS host_rules_version_accepted VARCHAR(32),
  ADD COLUMN IF NOT EXISTS host_rules_accepted_at TIMESTAMPTZ;

-- 4. Seed Canonical 5 Rules matching 04_10_host_rules_on_screen.png
INSERT INTO popolive.host_rules (id, title, description, category, icon, display_order, is_active, policy_version)
VALUES
  (
    'rule_nudity',
    'No nudity or sexual content',
    'Any sexually explicit behavior, pornography, nudity, or provocative exposure is strictly prohibited and subject to immediate broadcast termination and account suspension.',
    'content_safety',
    'check',
    1,
    TRUE,
    '1.0.0'
  ),
  (
    'rule_minors',
    'No minors (under 18)',
    'Broadcasters must be at least 18 years old. Live broadcasting featuring unverified minors or exploitation of children is completely forbidden under our Child Protection Policy.',
    'age_restriction',
    'check',
    2,
    TRUE,
    '1.0.0'
  ),
  (
    'rule_violence',
    'No violence or hate speech',
    'Harassment, bullying, verbal abuse, hate speech, threats of violence, or discrimination against any race, religion, gender, or nationality is strictly prohibited.',
    'community_conduct',
    'check',
    3,
    TRUE,
    '1.0.0'
  ),
  (
    'rule_illegal',
    'No illegal or harmful activities',
    'Broadcasting illegal acts, substance abuse, smoking/alcohol on camera, gambling, self-harm, weapons, or dangerous stunts is strictly banned.',
    'legal_compliance',
    'check',
    4,
    TRUE,
    '1.0.0'
  ),
  (
    'rule_guidelines',
    'Follow community guidelines',
    'Adhere to all Popo Live Community Standards and Broadcaster Code of Decorum. Maintain respect for viewers, hosts, and platform moderators at all times.',
    'platform_decorum',
    'check',
    5,
    TRUE,
    '1.0.0'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  policy_version = EXCLUDED.policy_version,
  updated_at = NOW();
