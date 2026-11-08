import { query } from './db';

export interface PopoUserRecord {
  id: string;
  poppo_id: string;
  email: string | null;
  phone: string | null;
  nickname: string;
  avatar_url: string;
  gender: string;
  birthdate: Date | null;
  is_adult_verified: boolean;
  status: string;
  created_at: Date;
  updated_at: Date;
  country: string | null;
  country_code: string | null;
  is_profile_completed: boolean;
  bio: string | null;
  host_level: number;
  wealth_level: number;
}

export async function resolveUserByIdentifier(identifier: string): Promise<PopoUserRecord | null> {
  if (!identifier) return null;
  const trimmed = identifier.trim();

  // 1. UUID check
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
  if (isUuid) {
    const rows = await query('SELECT * FROM popolive.users WHERE id = $1 LIMIT 1', [trimmed]);
    return (rows[0] as PopoUserRecord) || null;
  }

  // 2. Numeric User ID check
  const isNumeric = /^\d+$/.test(trimmed);
  if (isNumeric) {
    const rows = await query('SELECT * FROM popolive.users WHERE poppo_id = $1 LIMIT 1', [trimmed]);
    return (rows[0] as PopoUserRecord) || null;
  }

  // 3. Fallback to lowercase nickname
  const rows = await query('SELECT * FROM popolive.users WHERE LOWER(nickname) = LOWER($1) LIMIT 1', [trimmed]);
  return (rows[0] as PopoUserRecord) || null;
}
