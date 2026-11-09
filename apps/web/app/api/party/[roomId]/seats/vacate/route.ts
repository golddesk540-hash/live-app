import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const body = await req.json().catch(() => ({}));
    const authUser = await getAuthenticatedUser(req).catch(() => null);

    const seatNumber = Number(body.seatNumber);
    if (!seatNumber || seatNumber < 1 || seatNumber > 9) {
      return NextResponse.json(
        { success: false, error: 'Invalid seat number. Must be between 1 and 9.' },
        { status: 400 }
      );
    }

    // Protection: Host Seat 1 cannot be vacated via standard vacate endpoint
    if (seatNumber === 1 && !body.forceHostClose) {
      return NextResponse.json(
        { success: false, error: 'Host Seat 1 cannot be vacated while the party is active.' },
        { status: 403 }
      );
    }

    // Check if the seat is already occupied
    const existing = await query(
      `SELECT seat_number, status, participant_id, is_host FROM popolive.party_seats 
       WHERE room_number = $1 AND seat_number = $2`,
      [roomId, seatNumber]
    );

    if (!existing || existing.length === 0 || existing[0].status === 'available') {
      return NextResponse.json({
        success: true,
        message: `Seat ${seatNumber} is already available.`,
      });
    }

    // Authorization check: participant can vacate their own seat, or host can kick/vacate
    const currentOccupant = existing[0].participant_id;
    const isOwner = authUser && (authUser.id === currentOccupant || body.participantId === currentOccupant);
    const isHost = body.isHostAction || (authUser && authUser.id === 'host_' + roomId);

    if (!isOwner && !isHost && !body.preview) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to vacate this seat.' },
        { status: 403 }
      );
    }

    // Vacate seat in PostgreSQL
    const updateRes = await query(
      `UPDATE popolive.party_seats
       SET participant_id = NULL,
           participant_name = NULL,
           participant_avatar = NULL,
           is_muted = false,
           is_camera_on = false,
           status = 'available',
           occupied_at = NULL,
           updated_at = NOW()
       WHERE room_number = $1 AND seat_number = $2
       RETURNING id, room_number, seat_number, status, updated_at`,
      [roomId, seatNumber]
    );

    const allSeats = await query(
      `SELECT id, room_number, seat_number, participant_id, participant_name, participant_avatar, 
              is_host, is_muted, is_camera_on, status, occupied_at, updated_at
       FROM popolive.party_seats
       WHERE room_number = $1
       ORDER BY seat_number ASC`,
      [roomId]
    );

    return NextResponse.json({
      success: true,
      message: `Seat ${seatNumber} is now available.`,
      seat: updateRes && updateRes[0] ? updateRes[0] : null,
      seats: allSeats,
    });
  } catch (error: any) {
    console.error('API /party/[roomId]/seats/vacate error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while vacating seat' },
      { status: 500 }
    );
  }
}
