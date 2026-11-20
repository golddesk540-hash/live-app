import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { partyMediaService } from '@/lib/partyMediaService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/party/rooms/:roomId/media/token
 * Generates an SFU room token enforcing Age 18+ and 9-seat capacity limits.
 * Seated participants (Seats 1-9) receive host/speaker tokens with audio publish capability.
 * Non-seated users (including 10th+) receive listener-only tokens.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to obtain media token.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { roomId } = params;
    const result = await partyMediaService.issueRoomToken(roomId, user.id);

    if (!result.success) {
      const statusCode =
        result.code === 'AGE_VERIFICATION_FAILED'
          ? 403
          : result.code === 'ROOM_NOT_FOUND'
          ? 404
          : 400;

      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      token: result.tokenData?.token,
      roomId: result.tokenData?.roomId,
      roomNumber: result.tokenData?.roomNumber,
      role: result.tokenData?.role,
      seatNumber: result.tokenData?.seatNumber,
      permissions: result.tokenData?.permissions,
      sfuEndpoint: result.tokenData?.sfuEndpoint,
      expiresAt: result.tokenData?.expiresAt,
    });
  } catch (err: any) {
    console.error('Party token error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to issue party media token' },
      { status: 500 }
    );
  }
}
