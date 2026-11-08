import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // 1. Fetch user language & PIN status
    const userRow = (
      await query(
        `SELECT preferred_language, is_pin_enabled, pin_locked_until, created_at 
         FROM popolive.users WHERE id = $1`,
        [user.id]
      )
    )[0];

    const isPinLocked = userRow?.pin_locked_until
      ? new Date(userRow.pin_locked_until) > new Date()
      : false;

    // 2. Fetch Blacklist count
    const blockCountRes = await query(
      `SELECT COUNT(*)::int AS count FROM popolive.user_blocks WHERE blocker_id = $1`,
      [user.id]
    );
    const blockedCount = blockCountRes[0]?.count || 0;

    // 3. Fetch Privacy settings (with defaults fallback)
    let privacyRow = (
      await query(
        `SELECT profile_visibility, birthday_visibility, gender_visibility, 
                online_status_visibility, follow_permissions, message_permissions
         FROM popolive.user_privacy_settings WHERE user_id = $1`,
        [user.id]
      )
    )[0];

    if (!privacyRow) {
      await query(
        `INSERT INTO popolive.user_privacy_settings (user_id) 
         VALUES ($1) ON CONFLICT DO NOTHING`,
        [user.id]
      );
      privacyRow = {
        profile_visibility: 'everyone',
        birthday_visibility: 'only_me',
        gender_visibility: 'everyone',
        online_status_visibility: 'everyone',
        follow_permissions: 'everyone',
        message_permissions: 'everyone',
      };
    }

    // 4. Fetch Notification settings (with defaults fallback)
    let notifRow = (
      await query(
        `SELECT account_notifications, security_notifications, 
                system_announcements, promotional_notifications
         FROM popolive.user_notification_settings WHERE user_id = $1`,
        [user.id]
      )
    )[0];

    if (!notifRow) {
      await query(
        `INSERT INTO popolive.user_notification_settings (user_id) 
         VALUES ($1) ON CONFLICT DO NOTHING`,
        [user.id]
      );
      notifRow = {
        account_notifications: true,
        security_notifications: true,
        system_announcements: true,
        promotional_notifications: false,
      };
    }

    return NextResponse.json({
      success: true,
      account: {
        id: user.id,
        poppoId: user.poppo_id,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
        email: user.email,
        phone: user.phone,
        country: user.country || 'Pakistan',
        memberSince: userRow?.created_at
          ? new Date(userRow.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
          : 'November 2026',
        createdAt: userRow?.created_at,
      },
      security: {
        isPinEnabled: Boolean(userRow?.is_pin_enabled),
        isPinLocked,
        pinLockedUntil: userRow?.pin_locked_until,
      },
      language: {
        preferred: userRow?.preferred_language || 'en',
      },
      blacklist: {
        count: blockedCount,
      },
      privacy: {
        profileVisibility: privacyRow.profile_visibility || 'everyone',
        birthdayVisibility: privacyRow.birthday_visibility || 'only_me',
        genderVisibility: privacyRow.gender_visibility || 'everyone',
        onlineStatusVisibility: privacyRow.online_status_visibility || 'everyone',
        followPermissions: privacyRow.follow_permissions || 'everyone',
        messagePermissions: privacyRow.message_permissions || 'everyone',
      },
      notifications: {
        account: Boolean(notifRow.account_notifications),
        security: Boolean(notifRow.security_notifications),
        system: Boolean(notifRow.system_announcements),
        promotional: Boolean(notifRow.promotional_notifications),
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/settings:', err);
    return NextResponse.json({ error: 'Failed to retrieve account settings.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { preferredLanguage, isPinEnabled } = body;

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (preferredLanguage && ['en', 'ur'].includes(preferredLanguage)) {
      updates.push(`preferred_language = $${idx++}`);
      values.push(preferredLanguage);
    }

    if (typeof isPinEnabled === 'boolean') {
      updates.push(`is_pin_enabled = $${idx++}`);
      values.push(isPinEnabled);
    }

    if (updates.length > 0) {
      values.push(user.id);
      await query(
        `UPDATE popolive.users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx}`,
        values
      );
    }

    return NextResponse.json({ success: true, message: 'Settings updated successfully.' });
  } catch (err: any) {
    console.error('Error in PATCH /api/settings:', err);
    return NextResponse.json({ error: 'Failed to update settings.' }, { status: 500 });
  }
}
