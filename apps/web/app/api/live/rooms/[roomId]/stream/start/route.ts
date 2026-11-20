import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { mediaService } from '@/lib/mediaService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/live/rooms/:roomId/stream/start
 * Authenticated Host-Only: Generates RTMP ingest credentials and starts live video stream.
 * Enforces Age 18+ and Wealth Level 5 requirements.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to start live stream.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { roomId } = params;
    const result = await mediaService.startStream(roomId, user.id);

    if (!result.success) {
      const statusCode =
        result.code === 'WEALTH_LEVEL_INSUFFICIENT' ||
        result.code === 'AGE_VERIFICATION_FAILED' ||
        result.code === 'FORBIDDEN_NOT_ROOM_HOST'
          ? 403
          : result.code === 'ROOM_NOT_FOUND'
          ? 404
          : result.code === 'RATE_LIMIT_EXCEEDED'
          ? 429
          : 400;

      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      roomId: result.roomId,
      roomNumber: result.roomNumber,
      credentials: result.credentials,
      message: 'RTMP stream credentials generated successfully.',
    });
  } catch (err: any) {
    console.error('Stream start error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to start stream' },
      { status: 500 }
    );
  }
}
