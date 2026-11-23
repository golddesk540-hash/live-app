import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { recordViewerLeave } from '@/lib/viewerPresence';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const roomId = body.roomId;
    const isDemo = body.isDemo === true || req.nextUrl.searchParams.get('preview') === 'demo';

    if (isDemo && (roomId === 'demo-room-404' || roomId === 'demo')) {
      return NextResponse.json({
        success: true,
        message: 'Viewer left demo room',
        viewerCount: 7600,
        viewerDisplay: '7.6K',
      });
    }

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: 'Room ID is required.', code: 'INVALID_ROOM_ID' },
        { status: 400 }
      );
    }

    const user = await getAuthenticatedUser(req);
    const sessionId = (body.sessionId || req.cookies.get('poppo_session')?.value || '').trim() || undefined;

    const result = await recordViewerLeave({
      roomIdOrNumber: roomId,
      userId: user?.id || null,
      sessionId,
    });

    return NextResponse.json({
      success: true,
      message: 'Viewer successfully left live broadcast',
      roomId: result.roomId,
      roomNumber: result.roomNumber,
      viewerCount: result.viewerCount,
      viewerDisplay: result.viewerDisplay,
    });
  } catch (err: any) {
    if (err.status && err.code) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }
    console.error('Error in POST /api/live/viewer/leave:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
