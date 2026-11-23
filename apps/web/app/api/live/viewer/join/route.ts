import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { recordViewerJoin } from '@/lib/viewerPresence';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const roomId = body.roomId;
    const isDemo = body.isDemo === true || req.nextUrl.searchParams.get('preview') === 'demo';

    if (isDemo && (roomId === 'demo-room-404' || roomId === 'demo')) {
      return NextResponse.json({
        success: true,
        message: 'Viewer joined demo room',
        viewerCount: 7601,
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
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication session required.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const sessionId = (body.sessionId || req.cookies.get('poppo_session')?.value || '').trim() || undefined;

    const result = await recordViewerJoin({
      roomIdOrNumber: roomId,
      userId: user.id,
      sessionId,
      deviceInfo: body.deviceInfo,
    });

    return NextResponse.json({
      success: true,
      message: 'Joined live broadcast stream',
      roomId: result.roomId,
      roomNumber: result.roomNumber,
      sessionId: result.sessionId,
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
    console.error('Error in POST /api/live/viewer/join:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
