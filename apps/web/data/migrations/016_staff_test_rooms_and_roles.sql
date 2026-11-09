-- Migration 016: Staff Access Control and Test Rooms Management
SET search_path TO popolive, public;

-- 1. Add Staff Role & Flag to Users Table
ALTER TABLE popolive.users 
ADD COLUMN IF NOT EXISTS role VARCHAR(32) DEFAULT 'user';

ALTER TABLE popolive.users 
ADD COLUMN IF NOT EXISTS is_staff BOOLEAN DEFAULT false;

-- 2. Grant Staff Access to Developer Test Users
UPDATE popolive.users 
SET is_staff = true, role = 'staff' 
WHERE email IN ('topstreamer@example.com', 'admin@popolive.com', 'staff@popolive.com');

-- 3. Create Dedicated Staff User If Missing
INSERT INTO popolive.users (
  id, poppo_id, email, phone, nickname, avatar_url, gender, 
  is_adult_verified, status, host_level, wealth_level, role, is_staff, password_hash
)
VALUES (
  'a0000000-0000-0000-0000-000000000099',
  '9000001',
  'staff@popolive.com',
  '+923009000001',
  'Staff Quality Engineer',
  '/avatars/default.png',
  'unspecified',
  true,
  'active',
  50,
  50,
  'staff',
  true,
  -- bcrypt hash for 'StaffPass123!'
  '$2a$10$e8hJc62qK8/yJ6h4P6o2u.oKj0x70QoB87xO378E50J9.l3XgPZae'
)
ON CONFLICT (email) DO UPDATE 
SET is_staff = true, role = 'staff';

-- 4. Test Rooms Table (Dedicated test room registry isolated from production rooms)
CREATE TABLE IF NOT EXISTS popolive.test_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_room_id VARCHAR(32) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  host_nickname VARCHAR(64) NOT NULL,
  host_poppo_id VARCHAR(16) NOT NULL,
  host_avatar_url TEXT DEFAULT '/avatars/default.png',
  thumbnail_url TEXT NOT NULL,
  category VARCHAR(32) DEFAULT 'live',
  status VARCHAR(32) DEFAULT 'ready',
  environment VARCHAR(32) DEFAULT 'staging',
  description TEXT,
  viewer_simulation_count INT DEFAULT 150,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Seed Test Rooms (Strictly labeled as TEST DATA)
INSERT INTO popolive.test_rooms (
  test_room_id, title, host_nickname, host_poppo_id, host_avatar_url, 
  thumbnail_url, category, status, environment, description, viewer_simulation_count
)
VALUES
  (
    'TEST-9001',
    '[TEST DATA] Staging Stage — Popo Idol Rehearsal 🎙️',
    'TestHost Alpha',
    '99001',
    '/assets/following/zara_live@2x.png',
    '/covers/default.jpg',
    'live',
    'ready',
    'staging',
    'Simulated high-traffic broadcast for video bitrate and latency validation.',
    240
  ),
  (
    'TEST-9002',
    '[TEST DATA] 9-Seat Party Voice Latency Benchmark 🎧',
    'Audio Tester Beta',
    '99002',
    '/assets/following/sana_khan@2x.png',
    '/covers/default.jpg',
    'party',
    'testing',
    'staging',
    'Voice packet loss simulation under 9 simultaneous speaker connections.',
    95
  ),
  (
    'TEST-9003',
    '[TEST DATA] PK Cross-Border Sync Battle Protocol ⚔️',
    'PK Lab Unit',
    '99003',
    '/assets/following/alina@2x.png',
    '/covers/default.jpg',
    'pk',
    'ready',
    'sandbox',
    'Simulated 2-stream split view for gift animation score calculation.',
    180
  ),
  (
    'TEST-9004',
    '[TEST DATA] Ultra HD 60FPS Codec Ingestion Stream 📹',
    'Codec Lab Delta',
    '99004',
    '/assets/following/mehak@2x.png',
    '/covers/default.jpg',
    'live',
    'draft',
    'staging',
    'H.265 / AV1 hardware decoder stress test stream.',
    30
  )
ON CONFLICT (test_room_id) DO UPDATE 
SET 
  title = EXCLUDED.title,
  host_nickname = EXCLUDED.host_nickname,
  thumbnail_url = EXCLUDED.thumbnail_url,
  status = EXCLUDED.status,
  environment = EXCLUDED.environment;
