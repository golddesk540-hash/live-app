-- Poppo Live Phase 2 Authentication Database Migration
CREATE SCHEMA IF NOT EXISTS popolive;
SET search_path TO popolive, public;

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS popolive.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poppo_id VARCHAR(16) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(32) UNIQUE,
  password_hash TEXT,
  nickname VARCHAR(64) NOT NULL DEFAULT 'Poppo Streamer',
  avatar_url TEXT DEFAULT '/avatars/default.png',
  gender VARCHAR(16) DEFAULT 'unspecified',
  birthdate DATE,
  is_adult_verified BOOLEAN DEFAULT false,
  status VARCHAR(32) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Auth Providers Table
CREATE TABLE IF NOT EXISTS popolive.auth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  provider VARCHAR(32) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unq_provider_uid UNIQUE (provider, provider_user_id)
);

-- 3. Sessions Table
CREATE TABLE IF NOT EXISTS popolive.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_agent TEXT,
  ip_hash VARCHAR(64),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. OTP Verifications Table
CREATE TABLE IF NOT EXISTS popolive.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(32) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  attempts INT DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Password Resets Table
CREATE TABLE IF NOT EXISTS popolive.password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES popolive.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Rate Limits Table
CREATE TABLE IF NOT EXISTS popolive.rate_limits (
  key VARCHAR(255) PRIMARY KEY,
  points INT DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON popolive.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON popolive.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_poppo_id ON popolive.users(poppo_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON popolive.sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON popolive.otp_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON popolive.password_resets(token_hash);
