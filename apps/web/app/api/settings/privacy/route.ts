import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const VALID_VISIBILITY = ['everyone', 'followers', 'only_me'];
const VALID_FOLLOW_PERM = ['everyone', 'approval_required'];
const VALID_MESSAGE_PERM = ['everyone', 'followers_only', 'nobody'];

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    let row = (
      await query(
        `SELECT profile_visibility, birthday_visibility, gender_visibility, 
                online_status_visibility, follow_permissions, message_permissions
         FROM popolive.user_privacy_settings WHERE user_id = $1`,
        [user.id]
      )
    )[0];

    if (!row) {
      await query(
        `INSERT INTO popolive.user_privacy_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
        [user.id]
      );
      row = {
        profile_visibility: 'everyone',
        birthday_visibility: 'only_me',
        gender_visibility: 'everyone',
        online_status_visibility: 'everyone',
        follow_permissions: 'everyone',
        message_permissions: 'everyone',
      };
    }

    return NextResponse.json({
      success: true,
      privacy: {
        profileVisibility: row.profile_visibility || 'everyone',
        birthdayVisibility: row.birthday_visibility || 'only_me',
        genderVisibility: row.gender_visibility || 'everyone',
        onlineStatusVisibility: row.online_status_visibility || 'everyone',
        followPermissions: row.follow_permissions || 'everyone',
        messagePermissions: row.message_permissions || 'everyone',
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/settings/privacy:', err);
    return NextResponse.json({ error: 'Failed to retrieve privacy settings.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      profileVisibility,
      birthdayVisibility,
      genderVisibility,
      onlineStatusVisibility,
      followPermissions,
      messagePermissions,
    } = body;

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (profileVisibility && VALID_VISIBILITY.includes(profileVisibility)) {
      updates.push(`profile_visibility = $${idx++}`);
      values.push(profileVisibility);
    }
    if (birthdayVisibility && VALID_VISIBILITY.includes(birthdayVisibility)) {
      updates.push(`birthday_visibility = $${idx++}`);
      values.push(birthdayVisibility);
    }
    if (genderVisibility && VALID_VISIBILITY.includes(genderVisibility)) {
      updates.push(`gender_visibility = $${idx++}`);
      values.push(genderVisibility);
    }
    if (onlineStatusVisibility && VALID_VISIBILITY.includes(onlineStatusVisibility)) {
      updates.push(`online_status_visibility = $${idx++}`);
      values.push(onlineStatusVisibility);
    }
    if (followPermissions && VALID_FOLLOW_PERM.includes(followPermissions)) {
      updates.push(`follow_permissions = $${idx++}`);
      values.push(followPermissions);
    }
    if (messagePermissions && VALID_MESSAGE_PERM.includes(messagePermissions)) {
      updates.push(`message_permissions = $${idx++}`);
      values.push(messagePermissions);
    }

    if (updates.length > 0) {
      await query(
        `INSERT INTO popolive.user_privacy_settings (user_id) 
         VALUES ($1) ON CONFLICT DO NOTHING`,
        [user.id]
      );

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(user.id);

      await query(
        `UPDATE popolive.user_privacy_settings 
         SET ${updates.join(', ')} 
         WHERE user_id = $${idx}`,
        values
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Privacy settings updated successfully.',
    });
  } catch (err: any) {
    console.error('Error in PATCH /api/settings/privacy:', err);
    return NextResponse.json({ error: 'Failed to update privacy settings.' }, { status: 500 });
  }
}
