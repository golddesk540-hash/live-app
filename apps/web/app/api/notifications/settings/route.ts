import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { webPushService } from '@/lib/pushNotificationService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const userId = authUser?.id || req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view notification settings.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const preferences = await webPushService.getPreferences(userId);

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve notification settings.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const body = await req.json().catch(() => ({}));
    const userId = authUser?.id || body.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to update notification settings.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const preferences = await webPushService.updatePreferences(userId, body);

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update notification settings.' },
      { status: 500 }
    );
  }
}
