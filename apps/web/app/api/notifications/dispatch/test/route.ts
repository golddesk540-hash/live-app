import { NextRequest, NextResponse } from 'next/server';
import { resolveMessagingActor } from '@/lib/messaging';
import {
  dispatchPushNotification,
  dispatchFollowedHostLiveAlert,
  dispatchGiftPushNotification,
} from '@/lib/pushNotifications';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, recipientUserId, hostId, roomId, title, giftName, coinPrice } = body;

    if (action === 'live_broadcast_alert') {
      const res = await dispatchFollowedHostLiveAlert({
        hostId: hostId || actor.id,
        roomId: roomId || '100220',
        title: title || 'Live Streaming Session',
      });
      return NextResponse.json({ success: true, data: res });
    }

    if (action === 'gift_alert') {
      const res = await dispatchGiftPushNotification({
        recipientHostId: recipientUserId || actor.id,
        senderUserId: actor.id,
        giftName: giftName || 'Luxury Yacht',
        coinPrice: coinPrice || 5000,
        roomId: roomId || '100220',
      });
      return NextResponse.json({ success: true, data: res });
    }

    // Default custom push dispatch
    const res = await dispatchPushNotification(recipientUserId || actor.id, {
      type: body.type || 'direct_message',
      title: body.title || 'Test Notification',
      body: body.body || 'Test message body',
      data: body.data || {},
      senderId: body.senderId,
    });

    return NextResponse.json({ success: true, data: res });
  } catch (err: any) {
    console.error('Error in POST /api/notifications/dispatch/test:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId') || actor.id;

    const logs = await query(
      `SELECT id, user_id, device_token, notification_type, title, body, payload, status, suppression_reason, created_at
       FROM popolive.push_notification_dispatch_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [targetUserId]
    );

    return NextResponse.json({
      success: true,
      data: {
        logs,
        totalLogs: logs.length,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/notifications/dispatch/test:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
