import { NextRequest, NextResponse } from 'next/server';
import { resolveMessagingActor, getUserNotifications } from '@/lib/messaging';

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

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'all';
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const notifications = await getUserNotifications({
      userId: actor.id,
      category,
      unreadOnly,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        totalNotifications: notifications.length,
        unreadCount,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/notifications:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
