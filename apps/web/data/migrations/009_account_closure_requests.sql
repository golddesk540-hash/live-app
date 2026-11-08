-- Migration 009: Account Closure and Deletion Request System
SET search_path TO popolive, public;

-- 1. Account Closure Requests Table
CREATE TABLE IF NOT EXISTS popolive.account_closure_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(32) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  reason VARCHAR(64) NOT NULL,
  additional_explanation TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'under_review', 'approved', 'rejected', 'cancelled', 'completed'
  requested_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  reviewed_date TIMESTAMPTZ,
  reviewed_by UUID REFERENCES popolive.users(id) ON DELETE SET NULL,
  completed_date TIMESTAMPTZ,
  cancelled_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_closure_requests_user ON popolive.account_closure_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_closure_requests_number ON popolive.account_closure_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_closure_requests_status ON popolive.account_closure_requests(status);

-- 2. Closure Audit Records Table
CREATE TABLE IF NOT EXISTS popolive.closure_audit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES popolive.account_closure_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  action VARCHAR(64) NOT NULL,
  previous_status VARCHAR(32),
  new_status VARCHAR(32),
  ip_hash VARCHAR(64),
  user_agent TEXT,
  action_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_closure_audit_user ON popolive.closure_audit_records(user_id);
CREATE INDEX IF NOT EXISTS idx_closure_audit_request ON popolive.closure_audit_records(request_id);
