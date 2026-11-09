-- Migration 017: Go-Live Gates (Face Check, Cover Image, Wealth Level)
-- Scope: Module 4.1 Go-Live Setup Requirements

ALTER TABLE popolive.users
  ADD COLUMN IF NOT EXISTS is_face_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS face_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS live_cover_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS live_cover_updated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS go_live_eligible BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS popolive.face_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL, -- 'pending', 'verified', 'failed'
  provider VARCHAR(64) DEFAULT 'kyc_face_service',
  confidence_score NUMERIC(5,2) DEFAULT 98.50,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_face_verification_user ON popolive.face_verification_logs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_users_go_live_eligible ON popolive.users(go_live_eligible);

-- Update seed user 'Zara Live' (zara@popolive.com) to have wealth_level = 12 and verified status for demonstration
UPDATE popolive.users
SET is_face_verified = true,
    face_verified_at = CURRENT_TIMESTAMP,
    live_cover_url = '/covers/default.jpg',
    wealth_level = 12,
    go_live_eligible = true
WHERE email = 'zara@popolive.com';
