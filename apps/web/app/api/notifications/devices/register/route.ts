import { NextRequest, NextResponse } from 'next/server';
import { resolveMessagingActor } from '@/lib/messaging';
import { registerDeviceToken } from '@/lib/pushNotifications';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please log in to register device tokens.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { deviceToken, platform, deviceModel, appVersion } = body;

    if (!deviceToken || !String(deviceToken).trim()) {
      return NextResponse.json(
        { success: false, error: 'deviceToken is required.', code: 'MISSING_DEVICE_TOKEN' },
        { status: 400 }
      );
    }

    const record = await registerDeviceToken({
      userId: actor.id,
      deviceToken: String(deviceToken).trim(),
      platform: platform || (req.headers.get('x-platform') || 'android'),
      deviceModel: deviceModel || req.headers.get('user-agent') || 'Mobile Device',
      appVersion: appVersion || '1.0.0',
    });

    return NextResponse.json({
      success: true,
      data: {
        device: record,
      },
    });
  } catch (err: any) {
    console.error('Error in POST /api/notifications/devices/register:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
