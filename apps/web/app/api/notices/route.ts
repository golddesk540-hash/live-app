import { NextRequest, NextResponse } from 'next/server';
import { resolveMessagingActor, getSystemNotices } from '@/lib/messaging';

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

    const notices = await getSystemNotices({
      userId: actor.id,
      category,
      unreadOnly,
    });

    const unreadCount = notices.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      data: {
        notices,
        totalNotices: notices.length,
        unreadCount,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/notices:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
