import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser, validateNicknameFormat } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        poppoId: user.poppo_id,
        email: user.email,
        phone: user.phone,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
        gender: user.gender,
        birthdate: user.birthdate,
        country: user.country,
        countryCode: user.country_code,
        isProfileCompleted: user.is_profile_completed,
        isAdultVerified: user.is_adult_verified,
        status: user.status,
        createdAt: user.created_at,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/profile/me:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { nickname, country, countryCode, gender, avatarUrl } = body;

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (nickname !== undefined) {
      const trimmed = (nickname || '').trim();
      const check = validateNicknameFormat(trimmed);
      if (!check.valid) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }

      // Check duplicate
      const dup = await query(
        `SELECT id FROM popolive.users WHERE LOWER(nickname) = LOWER($1) AND id != $2 LIMIT 1`,
        [trimmed, user.id]
      );
      if (dup.length > 0) {
        return NextResponse.json({ error: 'This nickname is already in use.' }, { status: 409 });
      }

      updates.push(`nickname = $${idx++}`);
      values.push(trimmed);
    }

    if (country !== undefined) {
      updates.push(`country = $${idx++}`);
      values.push(country.trim());
    }

    if (countryCode !== undefined) {
      updates.push(`country_code = $${idx++}`);
      values.push(countryCode.trim().toUpperCase());
    }

    if (gender !== undefined) {
      const valid = ['male', 'female', 'other', 'unspecified'];
      const g = valid.includes(gender.toLowerCase()) ? gender.toLowerCase() : 'unspecified';
      updates.push(`gender = $${idx++}`);
      values.push(g);
    }

    if (avatarUrl !== undefined && typeof avatarUrl === 'string') {
      updates.push(`avatar_url = $${idx++}`);
      values.push(avatarUrl);
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: 'No changes provided' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(user.id);

    const q = `UPDATE popolive.users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate, country, country_code, is_profile_completed, is_adult_verified, status`;
    const rows = await query(q, values);
    const updated = rows[0];

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updated.id,
        poppoId: updated.poppo_id,
        email: updated.email,
        phone: updated.phone,
        nickname: updated.nickname,
        avatarUrl: updated.avatar_url,
        gender: updated.gender,
        birthdate: updated.birthdate ? updated.birthdate.toISOString().split('T')[0] : null,
        country: updated.country,
        countryCode: updated.country_code,
        isProfileCompleted: updated.is_profile_completed,
      },
    });
  } catch (err: any) {
    console.error('Error in PATCH /api/profile/me:', err);
    return NextResponse.json({ error: 'Internal server error updating profile.' }, { status: 500 });
  }
}
