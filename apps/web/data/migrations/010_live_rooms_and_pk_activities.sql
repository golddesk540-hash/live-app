-- Migration 010: Live Rooms and PK Activities for Discovery
SET search_path TO popolive, public;

CREATE TABLE IF NOT EXISTS popolive.live_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(32) UNIQUE NOT NULL,
  host_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  cover_url TEXT,
  category VARCHAR(64) DEFAULT 'live',
  status VARCHAR(32) DEFAULT 'live', -- 'live', 'ended', 'paused'
  is_live BOOLEAN DEFAULT true,
  is_pk BOOLEAN DEFAULT false,
  current_pk_id UUID,
  viewer_count INTEGER DEFAULT 0,
  coins_earned BIGINT DEFAULT 0,
  country VARCHAR(64) DEFAULT 'Pakistan',
  country_code VARCHAR(8) DEFAULT 'PK',
  tags TEXT[] DEFAULT '{}',
  stream_key VARCHAR(128),
  started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_live_rooms_status ON popolive.live_rooms(status);
CREATE INDEX IF NOT EXISTS idx_live_rooms_host ON popolive.live_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_live_rooms_is_live ON popolive.live_rooms(is_live);
CREATE INDEX IF NOT EXISTS idx_live_rooms_is_pk ON popolive.live_rooms(is_pk);
CREATE INDEX IF NOT EXISTS idx_live_rooms_country ON popolive.live_rooms(country_code);

CREATE TABLE IF NOT EXISTS popolive.pk_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES popolive.live_rooms(id) ON DELETE CASCADE,
  host_a_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  host_b_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(32) DEFAULT 'active', -- 'upcoming', 'active', 'completed'
  host_a_votes INTEGER DEFAULT 0,
  host_b_votes INTEGER DEFAULT 0,
  host_a_points BIGINT DEFAULT 0,
  host_b_points BIGINT DEFAULT 0,
  viewer_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pk_status ON popolive.pk_activities(status);
CREATE INDEX IF NOT EXISTS idx_pk_hosts ON popolive.pk_activities(host_a_id, host_b_id);
