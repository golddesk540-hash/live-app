import { NextRequest, NextResponse } from 'next/server';
import { resolveMessagingActor } from '@/lib/messaging';
import { unregisterDeviceToken } from '@/lib/pushNotifications';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please log in to unregister device tokens.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { deviceToken } = body;

    if (!deviceToken || !String(deviceToken).trim()) {
      return NextResponse.json(
        { success: false, error: 'deviceToken is required.', code: 'MISSING_DEVICE_TOKEN' },
        { status: 400 }
      );
    }

    const ok = await unregisterDeviceToken({
      userId: actor.id,
      deviceToken: String(deviceToken).trim(),
    });

    return NextResponse.json({
      success: true,
      data: {
        unregistered: ok,
      },
    });
  } catch (err: any) {
    console.error('Error in POST /api/notifications/devices/unregister:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
