import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser, validateNicknameFormat } from '@/lib/auth';
import { resolveActiveUserVipProfile } from '@/lib/vip';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const vip = await resolveActiveUserVipProfile(user.id);

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
        bio: user.bio || '',
        hostLevel: user.host_level || 1,
        wealthLevel: user.wealth_level || 1,
        isProfileCompleted: user.is_profile_completed,
        isAdultVerified: user.is_adult_verified,
        status: user.status,
        createdAt: user.created_at,
        vip,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/profile/me:', err);
    return NextResponse.json({ error: 'Internal server error fetching profile.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      nickname,
      country,
      countryCode,
      gender,
      avatarUrl,
      bio,
      birthdate,
      birthday,
      poppoId,
      id,
      email,
      phone,
      vip,
      vipLevel,
      vipTier,
      vipBadge,
      vipStatus,
    } = body;

    // Security Check: Users cannot manually assign themselves VIP badges or levels
    if (
      vip !== undefined ||
      vipLevel !== undefined ||
      vipTier !== undefined ||
      vipBadge !== undefined ||
      vipStatus !== undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          code: 'VIP_MANUAL_ASSIGNMENT_FORBIDDEN',
          error: 'Users cannot manually assign or modify VIP membership badges or statuses.',
        },
        { status: 403 }
      );
    }

    // Security Check: Permanent User ID cannot be edited
    if (poppoId !== undefined || id !== undefined) {
      return NextResponse.json(
        { error: 'Permanent User ID cannot be modified.' },
        { status: 400 }
      );
    }

    // Security Check: Birthday changes require verification
    if (birthdate !== undefined || birthday !== undefined) {
      return NextResponse.json(
        { error: 'Birthday changes require official identity verification. Please contact support.' },
        { status: 400 }
      );
    }

    // Security Check: Email / Phone modification guarded
    if (email !== undefined || phone !== undefined) {
      return NextResponse.json(
        { error: 'Email or phone changes require dedicated two-factor security verification.' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    // 1. Nickname validation
    if (nickname !== undefined) {
      const trimmed = (nickname || '').trim();
      const check = validateNicknameFormat(trimmed);
      if (!check.valid) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }

      // Check duplicate against all other users (case-insensitive)
      const dup = await query(
        `SELECT id FROM popolive.users WHERE LOWER(nickname) = LOWER($1) AND id != $2 LIMIT 1`,
        [trimmed, user.id]
      );
      if (dup.length > 0) {
        return NextResponse.json({ error: 'This nickname is already in use by another streamer.' }, { status: 409 });
      }

      updates.push(`nickname = $${idx++}`);
      values.push(trimmed);
    }

    // 2. Country
    if (country !== undefined) {
      const trimmed = String(country).trim();
      if (trimmed.length > 64) {
        return NextResponse.json({ error: 'Country name is too long.' }, { status: 400 });
      }
      updates.push(`country = $${idx++}`);
      values.push(trimmed);
    }

    // 3. Country Code
    if (countryCode !== undefined) {
      const trimmed = String(countryCode).trim().toUpperCase();
      if (trimmed.length > 8) {
        return NextResponse.json({ error: 'Country code is too long.' }, { status: 400 });
      }
      updates.push(`country_code = $${idx++}`);
      values.push(trimmed);
    }

    // 4. Gender
    if (gender !== undefined) {
      const valid = ['male', 'female', 'other', 'unspecified'];
      const g = valid.includes(String(gender).toLowerCase()) ? String(gender).toLowerCase() : 'unspecified';
      updates.push(`gender = $${idx++}`);
      values.push(g);
    }

    // 5. Short Bio
    if (bio !== undefined) {
      const trimmedBio = String(bio).trim();
      if (trimmedBio.length > 500) {
        return NextResponse.json({ error: 'Bio must not exceed 500 characters.' }, { status: 400 });
      }
      updates.push(`bio = $${idx++}`);
      values.push(trimmedBio);
    }

    // 6. Avatar URL
    if (avatarUrl !== undefined && typeof avatarUrl === 'string') {
      updates.push(`avatar_url = $${idx++}`);
      values.push(avatarUrl);
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: 'No changes provided.' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(user.id);

    const q = `UPDATE popolive.users 
               SET ${updates.join(', ')} 
               WHERE id = $${idx} 
               RETURNING id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate, country, country_code, bio, host_level, wealth_level, is_profile_completed, is_adult_verified, status, created_at`;
    
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
        bio: updated.bio || '',
        hostLevel: Number(updated.host_level) || 1,
        wealthLevel: Number(updated.wealth_level) || 1,
        isProfileCompleted: updated.is_profile_completed,
        isAdultVerified: updated.is_adult_verified,
        status: updated.status,
        createdAt: updated.created_at,
      },
    });
  } catch (err: any) {
    console.error('Error in PATCH /api/profile/me:', err);
    return NextResponse.json({ error: 'Internal server error updating profile.' }, { status: 500 });
  }
}
