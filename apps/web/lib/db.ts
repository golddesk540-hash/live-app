import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });
  }
  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const p = getDbPool();
  const client = await p.connect();
  try {
    await client.query('SET search_path TO popolive, public;');
    const res = await client.query(text, params);
    return res.rows;
  } finally {
    client.release();
  }
}

export async function withTransaction<T>(
  callback: (client: { query: (text: string, params?: any[]) => Promise<any> }) => Promise<T>
): Promise<T> {
  const p = getDbPool();
  const client = await p.connect();
  try {
    await client.query('SET search_path TO popolive, public;');
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {}
    throw err;
  } finally {
    client.release();
  }
}

export async function runMigrations(): Promise<void> {
  const p = getDbPool();
  const client = await p.connect();
  try {
    await client.query('CREATE SCHEMA IF NOT EXISTS popolive;');
    await client.query('SET search_path TO popolive, public;');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
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
    `);

    // Authentication Providers table (OAuth + Phone links)
    await client.query(`
      CREATE TABLE IF NOT EXISTS auth_providers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR(32) NOT NULL,
        provider_user_id VARCHAR(255) NOT NULL,
        provider_email VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unq_provider_uid UNIQUE (provider, provider_user_id)
      );
    `);

    // Active User Sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        user_agent TEXT,
        ip_hash VARCHAR(64),
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // OTP Verifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone VARCHAR(32) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        attempts INT DEFAULT 0,
        verified BOOLEAN DEFAULT false,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Password Reset tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        used BOOLEAN DEFAULT false,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Rate Limiting table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key VARCHAR(255) PRIMARY KEY,
        points INT DEFAULT 0,
        reset_at TIMESTAMPTZ NOT NULL
      );
    `);

    console.log('PostgreSQL migrations applied successfully in schema popolive!');
  } finally {
    client.release();
  }
}
