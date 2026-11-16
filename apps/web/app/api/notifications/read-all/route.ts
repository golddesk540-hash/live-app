import { NextRequest, NextResponse } from 'next/server';
import { resolveMessagingActor, markAllNotificationsRead } from '@/lib/messaging';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const count = await markAllNotificationsRead(actor.id);

    return NextResponse.json({
      success: true,
      data: {
        markedReadCount: count,
      },
    });
  } catch (err: any) {
    console.error('Error in POST /api/notifications/read-all:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
