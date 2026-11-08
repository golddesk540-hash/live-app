import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    let row = (
      await query(
        `SELECT account_notifications, security_notifications, 
                system_announcements, promotional_notifications
         FROM popolive.user_notification_settings WHERE user_id = $1`,
        [user.id]
      )
    )[0];

    if (!row) {
      await query(
        `INSERT INTO popolive.user_notification_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
        [user.id]
      );
      row = {
        account_notifications: true,
        security_notifications: true,
        system_announcements: true,
        promotional_notifications: false,
      };
    }

    return NextResponse.json({
      success: true,
      notifications: {
        account: Boolean(row.account_notifications),
        security: Boolean(row.security_notifications),
        system: Boolean(row.system_announcements),
        promotional: Boolean(row.promotional_notifications),
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/settings/notifications:', err);
    return NextResponse.json({ error: 'Failed to retrieve notification settings.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { account, security, system, promotional } = body;

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (typeof account === 'boolean') {
      updates.push(`account_notifications = $${idx++}`);
      values.push(account);
    }
    if (typeof security === 'boolean') {
      updates.push(`security_notifications = $${idx++}`);
      values.push(security);
    }
    if (typeof system === 'boolean') {
      updates.push(`system_announcements = $${idx++}`);
      values.push(system);
    }
    if (typeof promotional === 'boolean') {
      updates.push(`promotional_notifications = $${idx++}`);
      values.push(promotional);
    }

    if (updates.length > 0) {
      await query(
        `INSERT INTO popolive.user_notification_settings (user_id) 
         VALUES ($1) ON CONFLICT DO NOTHING`,
        [user.id]
      );

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(user.id);

      await query(
        `UPDATE popolive.user_notification_settings 
         SET ${updates.join(', ')} 
         WHERE user_id = $${idx}`,
        values
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully.',
    });
  } catch (err: any) {
    console.error('Error in PATCH /api/settings/notifications:', err);
    return NextResponse.json({ error: 'Failed to update notification settings.' }, { status: 500 });
  }
}
