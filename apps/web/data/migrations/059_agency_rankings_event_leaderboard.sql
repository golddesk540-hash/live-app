-- Migration 059: Agency Management System, Host Rankings, and Event Leaderboards
-- Schema: popolive

-- 1. Agencies Table
CREATE TABLE IF NOT EXISTS popolive.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  admin_user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'suspended', 'rejected'
  logo_url VARCHAR(512),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(64),
  commission_rate NUMERIC(5,2) DEFAULT 10.00,
  total_hosts INT DEFAULT 0,
  announcement TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agencies_admin ON popolive.agencies(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_agencies_status ON popolive.agencies(status);
CREATE INDEX IF NOT EXISTS idx_agencies_code ON popolive.agencies(agency_code);

-- 2. Agency Members (Hosts belonging to an agency)
CREATE TABLE IF NOT EXISTS popolive.agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES popolive.agencies(id) ON DELETE CASCADE,
  host_user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'active', 'pending', 'inactive', 'suspended', 'rejected'
  invited_by UUID REFERENCES popolive.users(id),
  joined_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agency_id, host_user_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_members_agency ON popolive.agency_members(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_agency_members_host ON popolive.agency_members(host_user_id, status);

-- 3. Events Table
CREATE TABLE IF NOT EXISTS popolive.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_code VARCHAR(64) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_urdu VARCHAR(255),
  description TEXT,
  banner_url VARCHAR(512),
  status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active', 'upcoming', 'completed'
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  prize_pool VARCHAR(128),
  rules TEXT,
  total_participants INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_status ON popolive.events(status, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_events_code ON popolive.events(event_code);

-- 4. Event Participants & Scores
CREATE TABLE IF NOT EXISTS popolive.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES popolive.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  score BIGINT DEFAULT 0,
  rank INT DEFAULT 0,
  registered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_participants_ranking ON popolive.event_participants(event_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_event_participants_user ON popolive.event_participants(user_id);

-- 5. Agency & Event Real-Time Events
CREATE TABLE IF NOT EXISTS popolive.agency_realtime_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES popolive.agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES popolive.users(id) ON DELETE CASCADE,
  event_type VARCHAR(64) NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agency_events_agency ON popolive.agency_realtime_events(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agency_events_user ON popolive.agency_realtime_events(user_id, created_at DESC);

-- 6. Seed Reference Data
-- Seed Events
INSERT INTO popolive.events (id, event_code, title, title_urdu, description, banner_url, status, start_time, end_time, prize_pool, rules, total_participants)
VALUES
  (
    'e1111111-1111-1111-1111-111111111111',
    'star_creator_challenge',
    'Star Creator Challenge 2026',
    'سٹار کریئیٹر چیلنج ۲۰۲۶',
    'Compete with elite hosts across Pakistan! Earn event points through viewer gifts, daily missions, and PK battles.',
    '/banners/star_creator_banner.png',
    'active',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP + INTERVAL '10 days',
    '1,000,000 Coins + Gold Creator Trophy',
    'Points are calculated from virtual gifts, PK wins, and viewer streaming engagement.',
    5
  ),
  (
    'e2222222-2222-2222-2222-222222222222',
    'spring_carnival_2026',
    'Spring Gala Carnival',
    'بہار گالا کارنیول',
    'Celebrate the festive season with vibrant music and community party rooms.',
    '/banners/spring_carnival.png',
    'upcoming',
    CURRENT_TIMESTAMP + INTERVAL '12 days',
    CURRENT_TIMESTAMP + INTERVAL '26 days',
    '500,000 Coins + Festival Badges',
    'Open to all verified creators.',
    0
  ),
  (
    'e3333333-3333-3333-3333-333333333333',
    'winter_pk_championship_2025',
    'Winter PK Championship 2025',
    'سرمائی پی کے چیمپئن شپ',
    'The classic winter battle tournament.',
    '/banners/winter_pk.png',
    'completed',
    CURRENT_TIMESTAMP - INTERVAL '40 days',
    CURRENT_TIMESTAMP - INTERVAL '15 days',
    '750,000 Coins',
    'Top 3 hosts received championship crowns.',
    12
  )
ON CONFLICT (event_code) DO NOTHING;

-- Seed Reference Agency (Admin: Zara Live)
DO $$
DECLARE
  v_zara_id UUID;
  v_sana_id UUID;
  v_agency_id UUID := 'a1111111-1111-1111-1111-111111111111';
  v_event_id UUID := 'e1111111-1111-1111-1111-111111111111';
BEGIN
  SELECT id INTO v_zara_id FROM popolive.users WHERE email = 'zara.live@popolive.com' OR nickname = 'Zara Live' LIMIT 1;
  SELECT id INTO v_sana_id FROM popolive.users WHERE email = 'sana.khan@popolive.com' OR nickname = 'Sana Khan' LIMIT 1;

  IF v_zara_id IS NOT NULL THEN
    -- Insert reference agency
    INSERT INTO popolive.agencies (
      id, agency_code, name, description, admin_user_id, status, logo_url, contact_email, contact_phone, announcement, total_hosts
    ) VALUES (
      v_agency_id,
      'AG-2048',
      'Star Creators Agency',
      'Premier creator-focused talent collective supporting top live streaming hosts and community showcases across South Asia.',
      v_zara_id,
      'active',
      '/avatars/agency_star.png',
      'management@starcreators.agency',
      '+92 300 1234567',
      'Welcome to Star Creators! Reach Level 3 to unlock weekly agency bonuses.',
      3
    )
    ON CONFLICT (agency_code) DO UPDATE SET
      admin_user_id = EXCLUDED.admin_user_id,
      status = 'active';

    -- Seed agency members
    INSERT INTO popolive.agency_members (agency_id, host_user_id, status, joined_at, notes)
    VALUES
      (v_agency_id, v_zara_id, 'active', CURRENT_TIMESTAMP - INTERVAL '30 days', 'Founding Agency Leader')
    ON CONFLICT (agency_id, host_user_id) DO UPDATE SET status = 'active';

    IF v_sana_id IS NOT NULL THEN
      INSERT INTO popolive.agency_members (agency_id, host_user_id, status, notes)
      VALUES (v_agency_id, v_sana_id, 'pending', 'Host join request awaiting review')
      ON CONFLICT (agency_id, host_user_id) DO NOTHING;
    END IF;

    -- Seed event participants
    INSERT INTO popolive.event_participants (event_id, user_id, score, rank)
    VALUES
      (v_event_id, v_zara_id, 28500, 1)
    ON CONFLICT (event_id, user_id) DO UPDATE SET score = 28500, rank = 1;

    IF v_sana_id IS NOT NULL THEN
      INSERT INTO popolive.event_participants (event_id, user_id, score, rank)
      VALUES
        (v_event_id, v_sana_id, 14200, 4)
      ON CONFLICT (event_id, user_id) DO UPDATE SET score = 14200, rank = 4;
    END IF;
  END IF;
END $$;
