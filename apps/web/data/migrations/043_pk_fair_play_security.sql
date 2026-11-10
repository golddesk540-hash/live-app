-- ============================================================================
-- Migration 043: PK Battle Fair Play & Anti-Cheat Security System
-- Module 6.9: PK Fair Play Basics, Anti-Cheat, Abuse Reporting & Security Guard
-- ============================================================================

SET search_path TO popolive, public;

-- 1. Fair Play Canonical Rules Table
CREATE TABLE IF NOT EXISTS popolive.pk_fair_play_rules (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  title_ur VARCHAR(100) NOT NULL,
  summary VARCHAR(255) NOT NULL,
  summary_ur VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 1,
  icon_name VARCHAR(50) NOT NULL DEFAULT 'shield-check',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Canonical Rules Matching 06_09_fair_play_basics.png
INSERT INTO popolive.pk_fair_play_rules (id, title, title_ur, summary, summary_ur, description, display_order, icon_name)
VALUES
  (
    'no_fake_traffic',
    'No fake traffic',
    'جعلی ٹریفک کی ممانعت',
    'Simulated viewer traffic, bot views, or spoofed devices are strictly prohibited.',
    'جعلی ناظرین، بوٹ ٹریفک، یا مصنوعی ڈیوائسز کا استعمال سختی سے ممنوع ہے۔',
    'Any form of artificial audience inflation, automated viewer emulation, headless browser spam, or spoofed IP clusters will lead to battle cancellation and host disqualification.',
    1,
    'users'
  ),
  (
    'no_gift_abuse',
    'No gift abuse',
    'تحائف کے غلط استعمال پر پابندی',
    'Self-gifting, chargeback rings, or wallet fraud strictly violate platform integrity.',
    'سیلف گفٹنگ، چارج بیک یا بٹوے کا فراڈ پلیٹ فارم کے اصولوں کی خلاف ورزی ہے۔',
    'Popo Live prohibits all circular gift-swapping rings, unauthorized payment laundering, or self-tipping between alt accounts. Legitimate audience appreciation is required.',
    2,
    'gift'
  ),
  (
    'no_multi_account_pk',
    'No multi-account PK',
    'ملٹی اکاؤنٹ پی کے ممنوع',
    'Operating both competing host accounts in a battle is strictly forbidden.',
    'ایک ہی مقابلے میں دونوں مد مقابل اکاؤنٹس چلانا مکمل طور پر ممنوع ہے۔',
    'Hosts are not permitted to match against their own sub-accounts, farm victory boosts dishonestly, or coordinate staged win-loss streaks across device farms.',
    3,
    'user-x'
  ),
  (
    'report_violations',
    'Report violations',
    'خلاف ورزی کی اطلاع دیں',
    'Real-time reporting of suspicious actions with 24/7 moderation audit review.',
    'مشکوک سرگرمیوں کی فوری اطلاع 24 گھنٹے فعال ٹیم کو دیں۔',
    'Viewers and hosts can immediately flag suspected score tampering, cheating, invitation harassment, or bot activity. Every report is audited with cryptographic score validation.',
    4,
    'flag'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_ur = EXCLUDED.title_ur,
  summary = EXCLUDED.summary,
  summary_ur = EXCLUDED.summary_ur,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  icon_name = EXCLUDED.icon_name;

-- 2. PK Abuse Reports Table
CREATE TABLE IF NOT EXISTS popolive.pk_abuse_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID REFERENCES popolive.pk_battles(id) ON DELETE SET NULL,
  reporter_id VARCHAR(100) NOT NULL,
  reporter_name VARCHAR(100) DEFAULT 'Viewer',
  reported_user_id VARCHAR(100) NOT NULL,
  reported_user_name VARCHAR(100) DEFAULT 'Host',
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'fake_traffic', 'gift_abuse', 'multi_account', 'score_manipulation', 
    'cheating', 'invitation_abuse', 'spam', 'suspicious_behavior', 'other'
  )),
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  review_notes TEXT,
  reviewed_by VARCHAR(100),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pk_abuse_reports_lookup 
  ON popolive.pk_abuse_reports (battle_id, reported_user_id, status);

CREATE INDEX IF NOT EXISTS idx_pk_abuse_reports_dedup 
  ON popolive.pk_abuse_reports (reporter_id, battle_id, category, created_at DESC);

-- 3. PK Security & Anti-Cheat Events Table
CREATE TABLE IF NOT EXISTS popolive.pk_security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  battle_id UUID REFERENCES popolive.pk_battles(id) ON DELETE CASCADE,
  event_type VARCHAR(60) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  reason TEXT NOT NULL,
  detection_source VARCHAR(50) DEFAULT 'anti_cheat_guard',
  metadata JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(20) DEFAULT 'logged' CHECK (status IN ('logged', 'flagged', 'reviewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pk_security_events_user_battle 
  ON popolive.pk_security_events (user_id, battle_id, created_at DESC);

-- 4. PK Security Audit Logs Table
CREATE TABLE IF NOT EXISTS popolive.pk_security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(60) NOT NULL,
  target_id VARCHAR(100),
  admin_id VARCHAR(100) NOT NULL,
  admin_name VARCHAR(100) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PK Security Config Table
CREATE TABLE IF NOT EXISTS popolive.pk_security_config (
  config_key VARCHAR(50) PRIMARY KEY,
  config_val VARCHAR(255) NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO popolive.pk_security_config (config_key, config_val, description)
VALUES
  ('max_invitations_per_window', '3', 'Max pending invitations sent by one host within window'),
  ('invitation_cooldown_seconds', '10', 'Minimum seconds required between successive PK invitations'),
  ('max_reactions_per_window', '10', 'Max free reactions accepted per 2 seconds rolling window'),
  ('reaction_window_seconds', '2', 'Duration of reaction throttling window in seconds'),
  ('report_cooldown_minutes', '5', 'Minutes required before duplicate report can be filed by same user on same battle'),
  ('client_score_updates_allowed', 'false', 'Security gate rejecting any direct client-driven score mutation'),
  ('max_score_delta_per_tx', '1000000', 'Upper bound per single approved gift transaction')
ON CONFLICT (config_key) DO UPDATE SET
  config_val = EXCLUDED.config_val,
  updated_at = NOW();

-- Seed Sample Abuse Report & Security Event for Canonical Battle 603
INSERT INTO popolive.pk_abuse_reports (
  battle_id, reporter_id, reporter_name, reported_user_id, reported_user_name, category, description, status
) VALUES (
  '00000000-0000-0000-0000-000000000603',
  'user_viewer_9001',
  'Ali',
  '00000000-0000-0000-0000-000000088202',
  'Ayesha',
  'score_manipulation',
  'Suspected automated clicking during rapid score surge.',
  'pending'
);

INSERT INTO popolive.pk_security_events (
  user_id, battle_id, event_type, severity, reason, metadata
) VALUES (
  'user_viewer_9001',
  '00000000-0000-0000-0000-000000000603',
  'client_score_tampering_rejected',
  'high',
  'Direct client score update was rejected: only backend authorized transactions are accepted.',
  '{"attempted_score_a": 999999, "client_ip": "127.0.0.1"}'::jsonb
);
