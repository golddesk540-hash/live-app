import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { resolvePartyRoom } from '@/lib/partyApiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/party/rooms/:id/seats/:n/mic
 * Toggles microphone state for seat n.
 * Enforces Rule 6: Only seated users toggle mic (or host moderating).
 * Non-seated users are blocked with HTTP 403 ONLY_SEATED_USER_CAN_TOGGLE_MIC.
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

    // Check seat occupant
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
        {
          success: false,
          error: 'ONLY_SEATED_USER_CAN_TOGGLE_MIC: Cannot toggle mic on an unoccupied seat.',
          code: 'ONLY_SEATED_USER_CAN_TOGGLE_MIC',
        },
        { status: 403 }
      );
    }

    const isOccupant = seat.participant_id.toString() === user.id.toString();
    const isHost =
      (room.host_user_id && room.host_user_id.toString() === user.id.toString()) ||
      room.host_nickname === user.nickname;

    // Locked Rule 6 Check
    if (!isOccupant && !isHost) {
      return NextResponse.json(
        {
          success: false,
          error: 'ONLY_SEATED_USER_CAN_TOGGLE_MIC: Only the seated participant or host can toggle microphone for this seat.',
          code: 'ONLY_SEATED_USER_CAN_TOGGLE_MIC',
        },
        { status: 403 }
      );
    }

    // Toggle mic
    const updateRes = await query<any>(
      `UPDATE popolive.party_seats
       SET is_muted = NOT is_muted, updated_at = CURRENT_TIMESTAMP
       WHERE room_number = $1 AND seat_number = $2
       RETURNING seat_number, is_muted, participant_id, participant_name`,
      [room.room_number, seatNum]
    );

    const updatedSeat = updateRes[0];

    return NextResponse.json({
      success: true,
      seatNumber: updatedSeat.seat_number,
      isMuted: Boolean(updatedSeat.is_muted),
      participantName: updatedSeat.participant_name,
      message: `Microphone ${updatedSeat.is_muted ? 'muted' : 'unmuted'} for Seat #${updatedSeat.seat_number}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
