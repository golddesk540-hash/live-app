import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import {
  recordViewerJoin,
  recordViewerLeave,
  getActiveRoomViewers,
} from '@/lib/viewerPresence';

export const dynamic = 'force-dynamic';

/**
 * GET /api/live/rooms/[roomId]/viewers
 * Fetches active viewers and current distinct viewer count from PostgreSQL.
 */
export async function GET(
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

    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    const result = await getActiveRoomViewers(roomId, limit);

    return NextResponse.json({
      success: true,
      roomId: result.roomId,
      roomNumber: result.roomNumber,
      viewerCount: result.viewerCount,
      viewerDisplay: result.viewerDisplay,
      viewers: result.viewers,
    });
  } catch (err: any) {
    if (err.status && err.code) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }
    console.error(`GET /api/live/rooms/${params.roomId}/viewers error:`, err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch room viewers.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/live/rooms/[roomId]/viewers
 * Register a viewer joining the live room.
 * Enforces session authentication.
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

    const result = await recordViewerJoin({
      roomIdOrNumber: roomId,
      userId: user.id,
      sessionId,
      deviceInfo: body.deviceInfo,
    });

    return NextResponse.json({
      success: true,
      message: 'Viewer joined live broadcast room.',
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
    console.error(`POST /api/live/rooms/${params.roomId}/viewers error:`, err);
    return NextResponse.json(
      { success: false, error: 'Failed to register viewer join.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/live/rooms/[roomId]/viewers
 * Deregister a viewer leaving the live room.
 * Enforces session authentication and provides idempotent departure.
 */
export async function DELETE(
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
      message: 'Viewer left live broadcast room.',
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
    console.error(`DELETE /api/live/rooms/${params.roomId}/viewers error:`, err);
    return NextResponse.json(
      { success: false, error: 'Failed to deregister viewer.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
