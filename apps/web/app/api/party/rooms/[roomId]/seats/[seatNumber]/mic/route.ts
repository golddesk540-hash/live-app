import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { resolvePartyRoom } from '@/lib/partyApiService';
import { partyMediaService } from '@/lib/partyMediaService';

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

    // Determine target mic state: accept explicit boolean/string or toggle
    const body = await req.json().catch(() => ({}));
    let targetMuted: boolean;
    if (body.isMuted !== undefined) {
      targetMuted = Boolean(body.isMuted);
    } else if (body.muted !== undefined) {
      targetMuted = Boolean(body.muted);
    } else if (body.micState === 'off' || body.micState === 'muted') {
      targetMuted = true;
    } else if (body.micState === 'on' || body.micState === 'unmuted') {
      targetMuted = false;
    } else {
      targetMuted = !Boolean(seat.is_muted);
    }

    // Update mic state in database
    const updateRes = await query<any>(
      `UPDATE popolive.party_seats
       SET is_muted = $3, updated_at = CURRENT_TIMESTAMP
       WHERE room_number = $1 AND seat_number = $2
       RETURNING seat_number, is_muted, participant_id, participant_name`,
      [room.room_number, seatNum, targetMuted]
    );

    const updatedSeat = updateRes[0];
    const isMuted = Boolean(updatedSeat.is_muted);
    const audioEnabled = partyMediaService.setSeatAudioTrackState(room.id, seatNum, isMuted);

    return NextResponse.json({
      success: true,
      seatNumber: updatedSeat.seat_number,
      isMuted,
      micState: isMuted ? 'off' : 'on',
      audioEnabled,
      participantName: updatedSeat.participant_name,
      message: `Microphone ${isMuted ? 'muted' : 'unmuted'} for Seat #${updatedSeat.seat_number}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/party/rooms/:id/seats/:n/mic
 * Retrieves current microphone state for seat n directly from PostgreSQL.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string; seatNumber: string } }
) {
  try {
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

    const seatRes = await query<any>(
      `SELECT seat_number, status, is_muted, is_camera_on, is_host_muted, participant_id, participant_name 
       FROM popolive.party_seats 
       WHERE room_number = $1 AND seat_number = $2`,
      [room.room_number, seatNum]
    );

    if (seatRes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Seat not found.', code: 'SEAT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const seat = seatRes[0];
    const isMuted = Boolean(seat.is_muted);

    return NextResponse.json({
      success: true,
      seatNumber: seat.seat_number,
      status: seat.status,
      isMuted,
      micState: isMuted ? 'off' : 'on',
      audioEnabled: !isMuted,
      participantId: seat.participant_id,
      participantName: seat.participant_name,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
