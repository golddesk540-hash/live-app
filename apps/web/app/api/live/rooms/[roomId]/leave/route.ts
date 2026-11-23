import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { recordViewerLeave } from '@/lib/viewerPresence';

export const dynamic = 'force-dynamic';

/**
 * POST /api/live/rooms/[roomId]/leave
 * Register a viewer leaving a live broadcast room.
 * Enforces authenticated session; idempotent deactivation of viewer presence.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
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

    const body = await req.json().catch(() => ({}));
    const sessionId = (body.sessionId || req.cookies.get('poppo_session')?.value || '').trim() || undefined;

    const result = await recordViewerLeave({
      roomIdOrNumber: roomId,
      userId: user.id,
      sessionId,
    });

    return NextResponse.json({
      success: true,
      message: 'Left live broadcast room.',
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
    console.error(`POST /api/live/rooms/${params.roomId}/leave error:`, err);
    return NextResponse.json(
      { success: false, error: 'Failed to process room departure.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
