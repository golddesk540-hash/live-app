import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, validateNicknameFormat } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const currentToken = req.cookies.get('poppo_session')?.value || '';

    // 1. Fetch user detailed account info
    const userRows = await query(
      `SELECT u.id, u.poppo_id, u.email, u.phone, u.nickname, u.avatar_url,
              u.gender, u.birthdate, u.country, u.country_code, u.bio,
              u.host_level, u.wealth_level, u.status, u.created_at, u.updated_at,
              u.is_adult_verified, u.is_profile_completed,
              COALESCE(u.is_email_verified, true) as is_email_verified,
              COALESCE(u.is_phone_verified, false) as is_phone_verified,
              COALESCE(u.timezone, 'Asia/Karachi (UTC+5)') as timezone,
              COALESCE(u.display_theme, 'dark') as display_theme,
              COALESCE(u.stream_quality, 'auto') as stream_quality,
              COALESCE(u.preferred_language, 'en') as preferred_language,
              COALESCE(u.is_pin_enabled, false) as is_pin_enabled,
              u.pin_locked_until,
              (u.password_hash IS NOT NULL) as has_password
       FROM popolive.users u
       WHERE u.id = $1 LIMIT 1`,
      [user.id]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const u = userRows[0];

    // 2. Fetch active sessions count
    const sessionCountRes = await query(
      `SELECT COUNT(*)::int as count FROM popolive.sessions
       WHERE user_id = $1 AND is_revoked = false AND expires_at > CURRENT_TIMESTAMP`,
      [user.id]
    );
    const activeSessionsCount = sessionCountRes[0]?.count || 1;

    // 3. Fetch latest login session info
    const lastSessionRes = await query(
      `SELECT last_active_at, created_at, browser_name, os_name, location, device_type
       FROM popolive.sessions
       WHERE user_id = $1 AND is_revoked = false
       ORDER BY last_active_at DESC LIMIT 1`,
      [user.id]
    );
    const lastLogin = lastSessionRes[0] || null;

    // 4. Fetch Blacklist count
    const blockCountRes = await query(
      `SELECT COUNT(*)::int as count FROM popolive.user_blocks WHERE blocker_id = $1`,
      [user.id]
    );
    const blacklistCount = blockCountRes[0]?.count || 0;

    // 5. Fetch Open Tickets count
    const ticketCountRes = await query(
      `SELECT COUNT(*)::int as count FROM popolive.support_tickets
       WHERE (user_id = $1 OR email = $2) AND status != 'closed'`,
      [user.id, user.email || '']
    );
    const openTicketsCount = ticketCountRes[0]?.count || 0;

    // 6. Fetch Privacy Settings
    const privacyRes = await query(
      `SELECT profile_visibility, birthday_visibility, gender_visibility,
              online_status_visibility, follow_permissions, message_permissions
       FROM popolive.user_privacy_settings WHERE user_id = $1 LIMIT 1`,
      [user.id]
    );
    const privacy = privacyRes[0] || {
      profile_visibility: 'public',
      birthday_visibility: 'private',
      gender_visibility: 'public',
      online_status_visibility: 'public',
      follow_permissions: 'everyone',
      message_permissions: 'everyone',
    };

    // Calculate profile completion percentage
    let completedPoints = 0;
    const totalPoints = 5;
    if (u.nickname && u.nickname !== 'Poppo Streamer') completedPoints++;
    if (u.avatar_url && !u.avatar_url.includes('default.png')) completedPoints++;
    if (u.gender && u.gender !== 'unspecified') completedPoints++;
    if (u.birthdate) completedPoints++;
    if (u.bio && u.bio.trim().length > 0) completedPoints++;
    const profileCompletionPercent = Math.round((completedPoints / totalPoints) * 100);

    const isPinLocked = u.pin_locked_until ? new Date(u.pin_locked_until) > new Date() : false;

    return NextResponse.json({
      success: true,
      account: {
        id: u.id,
        poppoId: u.poppo_id,
        nickname: u.nickname,
        avatarUrl: u.avatar_url,
        email: u.email,
        phone: u.phone,
        gender: u.gender,
        birthdate: u.birthdate ? u.birthdate.toISOString().split('T')[0] : null,
        country: u.country || 'Pakistan',
        countryCode: u.country_code || 'PK',
        bio: u.bio || '',
        hostLevel: u.host_level || 1,
        wealthLevel: u.wealth_level || 1,
        status: u.status,
        createdAt: u.created_at ? u.created_at.toISOString() : '',
        profileCompletionPercent,
        isProfileCompleted: Boolean(u.is_profile_completed),
      },
      verification: {
        isEmailVerified: Boolean(u.is_email_verified),
        isPhoneVerified: Boolean(u.is_phone_verified),
        isAdultVerified: Boolean(u.is_adult_verified),
        status: Boolean(u.is_email_verified && u.is_adult_verified) ? 'verified' : 'pending',
      },
      security: {
        hasPassword: Boolean(u.has_password),
        isPinEnabled: Boolean(u.is_pin_enabled),
        isPinLocked,
        activeSessionsCount,
        lastLogin: lastLogin
          ? {
              timestamp: lastLogin.last_active_at || lastLogin.created_at,
              browser: lastLogin.browser_name || 'Chrome',
              os: lastLogin.os_name || 'Windows',
              device: lastLogin.device_type || 'desktop',
              location: lastLogin.location || 'Pakistan',
            }
          : null,
      },
      preferences: {
        language: u.preferred_language,
        timezone: u.timezone,
        displayTheme: u.display_theme,
        streamQuality: u.stream_quality,
      },
      privacy,
      stats: {
        blacklistCount,
        openTicketsCount,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/account:', err);
    return NextResponse.json({ error: 'Failed to retrieve web account information.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
    }

    const { nickname, bio, gender, country, countryCode } = body;

    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;

    // 1. Nickname check
    if (nickname !== undefined) {
      const nickValidation = validateNicknameFormat(nickname);
      if (!nickValidation.valid) {
        return NextResponse.json({ error: nickValidation.error }, { status: 400 });
      }

      // Check uniqueness if different from current
      if (nickname.trim().toLowerCase() !== user.nickname.toLowerCase()) {
        const existing = await query(
          `SELECT id FROM popolive.users WHERE LOWER(nickname) = LOWER($1) AND id != $2 LIMIT 1`,
          [nickname.trim(), user.id]
        );
        if (existing.length > 0) {
          return NextResponse.json({ error: 'This nickname is already in use by another user.' }, { status: 409 });
        }
      }

      updates.push(`nickname = $${idx++}`);
      params.push(nickname.trim());
    }

    if (bio !== undefined) {
      if (typeof bio === 'string' && bio.length > 300) {
        return NextResponse.json({ error: 'Bio cannot exceed 300 characters.' }, { status: 400 });
      }
      updates.push(`bio = $${idx++}`);
      params.push(bio ? bio.trim() : '');
    }

    if (gender !== undefined) {
      const allowedGenders = ['male', 'female', 'other', 'unspecified'];
      if (!allowedGenders.includes(gender)) {
        return NextResponse.json({ error: 'Invalid gender value.' }, { status: 400 });
      }
      updates.push(`gender = $${idx++}`);
      params.push(gender);
    }

    if (country !== undefined) {
      updates.push(`country = $${idx++}`);
      params.push(country.trim());
      if (countryCode !== undefined) {
        updates.push(`country_code = $${idx++}`);
        params.push(countryCode.trim());
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: 'No fields provided to update.' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(user.id);

    const sql = `UPDATE popolive.users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, nickname, bio, gender, country`;
    const res = await query(sql, params);

    // Log security event
    await query(
      `INSERT INTO popolive.security_events (user_id, event_type, description, device_info)
       VALUES ($1, 'profile_update', 'Account details updated (nickname/bio/country)', $2)`,
      [user.id, req.headers.get('user-agent') || 'Browser']
    );

    return NextResponse.json({
      success: true,
      message: 'Account information updated successfully.',
      user: res[0],
    });
  } catch (err: any) {
    console.error('Error in PATCH /api/account:', err);
    return NextResponse.json({ error: 'Failed to update account information.' }, { status: 500 });
  }
}
