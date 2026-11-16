import { NextRequest, NextResponse } from 'next/server';
import { resolveMessagingActor, markNotificationRead } from '@/lib/messaging';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { notificationId } = await params;
    const ok = await markNotificationRead(notificationId, actor.id);

    return NextResponse.json({
      success: true,
      data: {
        notificationId,
        markedRead: ok,
      },
    });
  } catch (err: any) {
    console.error('Error in POST /api/notifications/[notificationId]/read:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
