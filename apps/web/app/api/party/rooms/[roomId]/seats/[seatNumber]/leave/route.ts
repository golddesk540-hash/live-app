import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { resolvePartyRoom } from '@/lib/partyApiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/party/rooms/:id/seats/:n/leave
 * Vacates seat n.
 * Allowed for:
 * 1. The user currently seated at seat n (self-leave).
 * 2. The host of the room (host-kick).
 * Any other user is blocked with HTTP 403 UNAUTHORIZED_SEAT_ACTION.
 * Seat 1 (host seat) cannot be vacated via leave (host must end/close party).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string; seatNumber: string } }
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

    const seatNum = parseInt(params.seatNumber, 10);
    if (isNaN(seatNum) || seatNum < 1 || seatNum > 9) {
      return NextResponse.json(
        { success: false, error: 'Invalid seat number (must be 1-9).', code: 'INVALID_SEAT' },
        { status: 400 }
      );
    }

    if (seatNum === 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Host seat #1 cannot be vacated directly. Host must end or close the party room.',
          code: 'HOST_SEAT_CANNOT_LEAVE',
        },
        { status: 400 }
      );
    }

    // Check who is seated at seat n
    const seatRes = await query<any>(
      `SELECT * FROM popolive.party_seats WHERE room_number = $1 AND seat_number = $2`,
      [room.room_number, seatNum]
    );

    if (seatRes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Seat not found.', code: 'SEAT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const seat = seatRes[0];
    if (seat.status !== 'occupied' || !seat.participant_id) {
      return NextResponse.json(
        { success: false, error: 'Seat is not currently occupied.', code: 'SEAT_NOT_OCCUPIED' },
        { status: 400 }
      );
    }

    const isOccupant = seat.participant_id.toString() === user.id.toString();
    const isHost =
      (room.host_user_id && room.host_user_id.toString() === user.id.toString()) ||
      room.host_nickname === user.nickname;

    if (!isOccupant && !isHost) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED_SEAT_ACTION: Only the seated user or the room host can vacate this seat.',
          code: 'UNAUTHORIZED_SEAT_ACTION',
        },
        { status: 403 }
      );
    }

    // Vacate seat in transaction and update member count
    await withTransaction(async (client) => {
      await client.query(
        `UPDATE popolive.party_seats
         SET participant_id = NULL,
             participant_name = NULL,
             participant_avatar = NULL,
             status = 'available',
             is_muted = false,
             occupied_at = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE room_number = $1 AND seat_number = $2`,
        [room.room_number, seatNum]
      );

      await client.query(
        `UPDATE popolive.party_rooms
         SET current_members = GREATEST(1, (SELECT COUNT(*) FROM popolive.party_seats WHERE room_number = $1 AND status = 'occupied')),
             updated_at = CURRENT_TIMESTAMP
         WHERE room_number = $1`,
        [room.room_number]
      );
    });

    return NextResponse.json({
      success: true,
      message: isHost && !isOccupant ? `Host kicked user from Seat #${seatNum}.` : `Vacated Seat #${seatNum}.`,
      seatNumber: seatNum,
      vacatedSeat: seatNum,
      isHostKick: isHost && !isOccupant,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
