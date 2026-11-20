import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { webPushService } from '@/lib/pushNotificationService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const body = await req.json().catch(() => ({}));
    const userId = authUser?.id || body.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to register device token.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { deviceToken, platform = 'android', deviceModel, appVersion } = body;

    if (!deviceToken) {
      return NextResponse.json(
        { success: false, error: 'deviceToken is required.', code: 'DEVICE_TOKEN_REQUIRED' },
        { status: 400 }
      );
    }

    const result = await webPushService.registerToken({
      userId,
      deviceToken,
      platform,
      deviceModel,
      appVersion,
    });

    return NextResponse.json({
      success: true,
      tokenRecord: result.tokenRecord,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to register device token.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const body = await req.json().catch(() => ({}));
    const userId = authUser?.id || body.userId || req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to unregister device token.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const deviceToken = body.deviceToken || req.nextUrl.searchParams.get('deviceToken');
    if (!deviceToken) {
      return NextResponse.json(
        { success: false, error: 'deviceToken is required.', code: 'DEVICE_TOKEN_REQUIRED' },
        { status: 400 }
      );
    }

    await webPushService.unregisterToken(userId, deviceToken);

    return NextResponse.json({
      success: true,
      message: 'Device token successfully invalidated.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to unregister device token.' },
      { status: 500 }
    );
  }
}
