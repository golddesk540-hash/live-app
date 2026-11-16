import { NextRequest, NextResponse } from 'next/server';
import { resolveMessagingActor } from '@/lib/messaging';
import { getUserActiveDeviceTokens } from '@/lib/pushNotifications';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const devices = await getUserActiveDeviceTokens(actor.id);

    return NextResponse.json({
      success: true,
      data: {
        devices,
        totalDevices: devices.length,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/notifications/devices:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
