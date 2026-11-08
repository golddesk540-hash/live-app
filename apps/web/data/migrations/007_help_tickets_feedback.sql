-- Migration 007: Help Center, FAQs, Support Tickets, Feedback, and Technical Reports
SET search_path TO popolive, public;

-- 1. Help Articles Table
CREATE TABLE IF NOT EXISTS popolive.help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(128) UNIQUE NOT NULL,
  category VARCHAR(64) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  title_ur VARCHAR(255) NOT NULL,
  content_en TEXT NOT NULL,
  content_ur TEXT NOT NULL,
  language VARCHAR(8) DEFAULT 'all',
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_help_articles_category ON popolive.help_articles(category);
CREATE INDEX IF NOT EXISTS idx_help_articles_slug ON popolive.help_articles(slug);

-- 2. FAQ Items Table
CREATE TABLE IF NOT EXISTS popolive.help_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(64) NOT NULL,
  question_en TEXT NOT NULL,
  question_ur TEXT NOT NULL,
  answer_en TEXT NOT NULL,
  answer_ur TEXT NOT NULL,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_help_faqs_category ON popolive.help_faqs(category);

-- 3. FAQ Ratings Tracking Table (prevents repeat voting)
CREATE TABLE IF NOT EXISTS popolive.faq_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faq_id UUID NOT NULL REFERENCES popolive.help_faqs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES popolive.users(id) ON DELETE SET NULL,
  ip_hash VARCHAR(64) NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unq_faq_rating_per_user UNIQUE (faq_id, ip_hash)
);

CREATE INDEX IF NOT EXISTS idx_faq_ratings_faq ON popolive.faq_ratings(faq_id);

-- 4. Support Tickets Table
CREATE TABLE IF NOT EXISTS popolive.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(32) UNIQUE NOT NULL,
  user_id UUID REFERENCES popolive.users(id) ON DELETE SET NULL,
  full_name VARCHAR(128) NOT NULL,
  email VARCHAR(255) NOT NULL,
  poppo_id VARCHAR(32),
  category VARCHAR(64) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  attachment_url TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  priority VARCHAR(32) DEFAULT 'normal',
  assigned_to UUID REFERENCES popolive.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON popolive.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON popolive.support_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON popolive.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON popolive.support_tickets(category);

-- 5. Ticket Replies Table
CREATE TABLE IF NOT EXISTS popolive.ticket_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES popolive.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES popolive.users(id) ON DELETE SET NULL,
  sender_type VARCHAR(16) NOT NULL DEFAULT 'user', -- 'user' or 'support'
  sender_name VARCHAR(128) NOT NULL,
  message TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_replies_ticket ON popolive.ticket_replies(ticket_id);

-- 6. User Feedback Table
CREATE TABLE IF NOT EXISTS popolive.user_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_number VARCHAR(32) UNIQUE NOT NULL,
  user_id UUID REFERENCES popolive.users(id) ON DELETE SET NULL,
  feedback_type VARCHAR(64) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  is_anonymous BOOLEAN DEFAULT false,
  contact_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_user ON popolive.user_feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_type ON popolive.user_feedbacks(feedback_type);

-- 7. Technical Problem Reports Table
CREATE TABLE IF NOT EXISTS popolive.technical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number VARCHAR(32) UNIQUE NOT NULL,
  user_id UUID REFERENCES popolive.users(id) ON DELETE SET NULL,
  category VARCHAR(64) NOT NULL,
  page_or_feature VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  browser_info VARCHAR(255),
  device_type VARCHAR(64),
  attachment_url TEXT,
  status VARCHAR(32) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tech_reports_user ON popolive.technical_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_tech_reports_category ON popolive.technical_reports(category);
