import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { recordViewerJoin } from '@/lib/viewerPresence';

export const dynamic = 'force-dynamic';

/**
 * POST /api/live/rooms/[roomId]/join
 * Register a viewer joining a live broadcast room.
 * Enforces authenticated session; viewer identity is strictly server-derived.
 * Prevents duplicate counts on reconnect or refresh.
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
        { success: false, error: 'Authentication session required to join live room.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const sessionId = (body.sessionId || req.cookies.get('poppo_session')?.value || '').trim() || undefined;

    const result = await recordViewerJoin({
      roomIdOrNumber: roomId,
      userId: user.id,
      sessionId,
      deviceInfo: body.deviceInfo,
    });

    return NextResponse.json({
      success: true,
      message: 'Joined live broadcast room.',
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
    console.error(`POST /api/live/rooms/${params.roomId}/join error:`, err);
    return NextResponse.json(
      { success: false, error: 'Failed to join live room.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
