import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { resolveMessagingActor } from '@/lib/messaging';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await resolveMessagingActor(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    let row = (
      await query(
        `SELECT account_notifications, security_notifications, 
                system_announcements, promotional_notifications,
                direct_messages, gift_alerts, live_broadcasts
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
        direct_messages: true,
        gift_alerts: true,
        live_broadcasts: true,
      };
    }

    return NextResponse.json({
      success: true,
      notifications: {
        account: Boolean(row.account_notifications),
        security: Boolean(row.security_notifications),
        system: Boolean(row.system_announcements),
        promotional: Boolean(row.promotional_notifications),
        direct_messages: row.direct_messages !== false,
        gift_alerts: row.gift_alerts !== false,
        live_broadcasts: row.live_broadcasts !== false,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/settings/notifications:', err);
    return NextResponse.json({ error: 'Failed to retrieve notification settings.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handleUpdate(req);
}

export async function PATCH(req: NextRequest) {
  return handleUpdate(req);
}

async function handleUpdate(req: NextRequest) {
  try {
    const user = await resolveMessagingActor(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { account, security, system, promotional, direct_messages, gift_alerts, live_broadcasts } = body;

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
    if (typeof direct_messages === 'boolean') {
      updates.push(`direct_messages = $${idx++}`);
      values.push(direct_messages);
    }
    if (typeof gift_alerts === 'boolean') {
      updates.push(`gift_alerts = $${idx++}`);
      values.push(gift_alerts);
    }
    if (typeof live_broadcasts === 'boolean') {
      updates.push(`live_broadcasts = $${idx++}`);
      values.push(live_broadcasts);
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
      message: 'Notification settings updated successfully.',
    });
  } catch (err: any) {
    console.error('Error in updating notification settings:', err);
    return NextResponse.json({ error: 'Failed to update notification settings.' }, { status: 500 });
  }
}
