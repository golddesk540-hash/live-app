import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { resolvePartyRoom } from '@/lib/partyApiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/party/rooms/:id/requests/:rid/reject
 * Host only: reject a seat join request
 * Enforces Rule 5: Only host can manage requests (HTTP 403 ONLY_HOST_CAN_MANAGE_REQUESTS)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string; requestId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const room = await resolvePartyRoom(params.roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Party room not found.', code: 'ROOM_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Locked Rule 5: Host verification
    const isHost =
      (room.host_user_id && room.host_user_id.toString() === user.id.toString()) ||
      room.host_nickname === user.nickname;

    if (!isHost) {
      return NextResponse.json(
        {
          success: false,
          error: 'ONLY_HOST_CAN_MANAGE_REQUESTS: Only the room host can reject seat requests.',
          code: 'ONLY_HOST_CAN_MANAGE_REQUESTS',
        },
        { status: 403 }
      );
    }

    const res = await query<any>(
      `UPDATE popolive.party_seat_requests
       SET status = 'rejected', responded_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND room_number = $2
       RETURNING id, status, seat_number, user_id`,
      [params.requestId, room.room_number]
    );

    if (res.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Seat request not found.', code: 'REQUEST_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Seat request rejected.',
      requestId: res[0].id,
      status: 'rejected',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
