-- Migration 055: Inbox Conversations, Direct Messaging, System Notices & In-App Notifications
SET search_path TO popolive, public;

-- 1. Inbox Conversations Table
CREATE TABLE IF NOT EXISTS popolive.inbox_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  participant_two_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  last_message_id UUID,
  last_message_text TEXT,
  last_message_sender_id UUID,
  last_message_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  unread_count_one INT DEFAULT 0,
  unread_count_two INT DEFAULT 0,
  is_pinned_one BOOLEAN DEFAULT false,
  is_pinned_two BOOLEAN DEFAULT false,
  status VARCHAR(32) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unq_inbox_conv_participants UNIQUE (participant_one_id, participant_two_id)
);

CREATE INDEX IF NOT EXISTS idx_inbox_conv_p1 ON popolive.inbox_conversations(participant_one_id);
CREATE INDEX IF NOT EXISTS idx_inbox_conv_p2 ON popolive.inbox_conversations(participant_two_id);
CREATE INDEX IF NOT EXISTS idx_inbox_conv_last_at ON popolive.inbox_conversations(last_message_at DESC);

-- 2. Direct Messages Table
CREATE TABLE IF NOT EXISTS popolive.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES popolive.inbox_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type VARCHAR(32) DEFAULT 'text',
  delivery_status VARCHAR(32) DEFAULT 'sent',
  idempotency_key VARCHAR(128),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dm_conv ON popolive.direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_dm_sender ON popolive.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_recipient ON popolive.direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_dm_created_at ON popolive.direct_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_dm_idempotency ON popolive.direct_messages(idempotency_key);

-- 3. System Notices Table
CREATE TABLE IF NOT EXISTS popolive.system_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code VARCHAR(32) NOT NULL UNIQUE,
  category VARCHAR(32) NOT NULL DEFAULT 'platform',
  badge_label VARCHAR(32) NOT NULL DEFAULT 'SYSTEM',
  title VARCHAR(255) NOT NULL,
  title_ur VARCHAR(255),
  short_desc TEXT NOT NULL,
  short_desc_ur TEXT,
  full_message TEXT NOT NULL,
  full_message_ur TEXT,
  is_important BOOLEAN DEFAULT false,
  target_user_id UUID REFERENCES popolive.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notices_category ON popolive.system_notices(category);
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON popolive.system_notices(created_at DESC);

-- 4. User System Notice Reads
CREATE TABLE IF NOT EXISTS popolive.user_notice_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES popolive.system_notices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unq_user_notice_read UNIQUE (notice_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notice_reads_user ON popolive.user_notice_reads(user_id);

-- 5. In-App Notifications Table
CREATE TABLE IF NOT EXISTS popolive.user_in_app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  category VARCHAR(32) NOT NULL,
  actor_id UUID REFERENCES popolive.users(id) ON DELETE SET NULL,
  actor_nickname VARCHAR(100),
  actor_avatar_url TEXT,
  title VARCHAR(255) NOT NULL,
  title_ur VARCHAR(255),
  body TEXT NOT NULL,
  body_ur TEXT,
  entity_type VARCHAR(32),
  entity_id VARCHAR(128),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inapp_notif_user ON popolive.user_in_app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_inapp_notif_category ON popolive.user_in_app_notifications(category);
CREATE INDEX IF NOT EXISTS idx_inapp_notif_created_at ON popolive.user_in_app_notifications(created_at DESC);

-- 6. Messaging Realtime Events Table
CREATE TABLE IF NOT EXISTS popolive.messaging_realtime_events (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(64) NOT NULL,
  recipient_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES popolive.users(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES popolive.inbox_conversations(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_msg_events_recip ON popolive.messaging_realtime_events(recipient_id, id);

-- 7. Seed Official System Notices
INSERT INTO popolive.system_notices (
  reference_code, category, badge_label, title, title_ur,
  short_desc, short_desc_ur,
  full_message, full_message_ur,
  is_important, created_at
)
VALUES
(
  'SYS-2026-8104', 'account', 'ACCOUNT',
  'Your profile is ready', 'آپ کا پروفائل تیار ہے',
  'Your profile information has been updated. Add a photo and bio so people can find you.',
  'آپ کی پروفائل معلومات اپ ڈیٹ ہو چکی ہیں۔ تصویر اور بایو شامل کریں تاکہ لوگ آپ کو تلاش کر سکیں۔',
  'Your Popo Live profile information has been synced across web and mobile discovery. Add a profile picture and short bio to help friends discover you faster.',
  'آپ کا پوپو لائیو پروفائل ویب اور موبائل دونوں پر سنک ہو چکا ہے۔ ایک اچھا اوتار اور بایو شامل کریں تاکہ دوست آپ کو فوری تلاش کر سکیں۔',
  false, CURRENT_TIMESTAMP - INTERVAL '2 hours'
),
(
  'SEC-2026-4491', 'security_safety', 'SECURITY',
  'A new login was detected', 'ایک نیا لاگ ان درج کیا گیا',
  'Review your active sessions if you did not sign in on Web Browser recently.',
  'اگر آپ نے حال ہی میں ویب براؤزر پر لاگ ان نہیں کیا تو اپنے فعال سیشنز کا جائزہ لیں۔',
  'A new sign-in was detected on Popo Live Web. If this looks unfamiliar, inspect Active Sessions and update your security credentials.',
  'پوپو لائیو ویب پر ایک نیا لاگ ان دیکھا گیا ہے۔ اگر یہ آپ نہیں تھے تو سیکیورٹی سیٹنگز میں جا کر پاس ورڈ تبدیل کریں اور پرانے سیشنز بند کریں۔',
  true, CURRENT_TIMESTAMP - INTERVAL '5 hours'
),
(
  'PLT-2026-1002', 'platform', 'PLATFORM',
  'Sprint 4: Messaging & Community Launch', 'سپرنٹ ۴: ان باکس اور میسجنگ کا آغاز',
  'Direct messaging, real-time sync, and official notifications are now active.',
  'ڈائریکٹ میسجز، ریئل ٹائم چیٹ اور دفتری نوٹیفیکیشنز اب فعال ہو چکے ہیں۔',
  'Welcome to Popo Live Sprint 4! Chat with verified hosts, stay informed with platform updates, and enjoy enhanced streaming interactivity.',
  'پوپو لائیو کے سپرنٹ ۴ میں خوش آمدید! اب آپ اپنے پسندیدہ ہوسٹس سے پرائیویٹ چیٹ کر سکتے ہیں اور پلیٹ فارم کے تمام نئے نوٹس فوری موصول کر سکتے ہیں۔',
  false, CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
  'WLT-2026-0315', 'wallet_gift', 'WALLET',
  'Wallet Security & 70% Host Earnings', 'والیٹ تحفظ اور ۷۰ فیصد ہوسٹ آمدنی',
  'All virtual gift diamonds are backed by 70% revenue sharing under audited ledger.',
  'تمام ورچوئل گفٹ ڈائمنڈز شفاف اور آڈٹ شدہ ۷۰ فیصد شیئرنگ پالیسی کے تحت دیے جاتے ہیں۔',
  'Our automated financial ledger guarantees 70% host earnings on every virtual gift received, with multi-currency top-up and instant diamond point settlement.',
  'ہمارا خودکار مالیاتی نظام ہر ورچوئل گفٹ پر ہوسٹ کو ۷۰ فیصد ڈائمنڈ پوائنٹس فراہم کرتا ہے۔ تمام ٹرانزیکشنز مکمل طور پر محفوظ اور آڈٹ شدہ ہیں۔',
  true, CURRENT_TIMESTAMP - INTERVAL '2 days'
)
ON CONFLICT (reference_code) DO NOTHING;
