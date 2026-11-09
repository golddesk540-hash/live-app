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
    const isDemo = req.nextUrl.searchParams.get('preview') === 'demo' || body.preview === 'demo';

    const seatNumber = Number(body.seatNumber);
    if (!seatNumber || seatNumber < 1 || seatNumber > 9) {
      return NextResponse.json(
        { success: false, error: 'Invalid seat number. Must be between 1 and 9.' },
        { status: 400 }
      );
    }

    const participantId = authUser?.id || body.participantId || (isDemo ? `demo_user_${Date.now()}` : null);
    const participantName = authUser?.nickname || body.participantName || 'Guest User';
    const participantAvatar = authUser?.avatar_url || body.participantAvatar || '/assets/studio/user_avatar_default.png';

    if (!participantId && !isDemo) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to occupy a seat.' },
        { status: 401 }
      );
    }

    // Protection: Seat 1 is exclusively reserved for the host
    if (seatNumber === 1 && !body.isHost && (!authUser || authUser.id !== 'host_' + roomId)) {
      // Check if user is the room host
      let isRoomHost = false;
      try {
        const roomRows = await query(
          `SELECT host_user_id, host_nickname FROM popolive.party_rooms WHERE room_number = $1`,
          [roomId]
        );
        if (roomRows && roomRows[0]) {
          if (roomRows[0].host_user_id === participantId || roomRows[0].host_nickname === participantName) {
            isRoomHost = true;
          }
        }
      } catch {}

      if (!isRoomHost && !body.isHost) {
        return NextResponse.json(
          { success: false, error: 'Seat 1 is reserved exclusively for the Party Host.' },
          { status: 403 }
        );
      }
    }

    // Check if the seat is already occupied or locked
    const existingSeat = await query(
      `SELECT seat_number, status, participant_id, participant_name FROM popolive.party_seats 
       WHERE room_number = $1 AND seat_number = $2`,
      [roomId, seatNumber]
    );

    if (existingSeat && existingSeat.length > 0) {
      const seat = existingSeat[0];
      if (seat.status === 'occupied' && seat.participant_id !== participantId) {
        return NextResponse.json(
          {
            success: false,
            error: `Seat ${seatNumber} is already occupied by ${seat.participant_name || 'another user'}.`,
          },
          { status: 409 }
        );
      }
      if (seat.status === 'locked') {
        return NextResponse.json(
          { success: false, error: `Seat ${seatNumber} is locked by host.` },
          { status: 423 }
        );
      }
    }

    // Check if this participant is already occupying another seat in the same room
    const otherSeat = await query(
      `SELECT seat_number FROM popolive.party_seats 
       WHERE room_number = $1 AND participant_id = $2 AND seat_number != $3 AND status = 'occupied'`,
      [roomId, participantId, seatNumber]
    );

    if (otherSeat && otherSeat.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Participant is already occupying Seat ${otherSeat[0].seat_number}. Vacate first before changing seats.`,
        },
        { status: 400 }
      );
    }

    // Atomically occupy the seat
    const updateRes = await query(
      `INSERT INTO popolive.party_seats (
         room_number, seat_number, participant_id, participant_name, participant_avatar, 
         is_host, is_muted, is_camera_on, status, occupied_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, false, false, 'occupied', NOW(), NOW())
       ON CONFLICT (room_number, seat_number) DO UPDATE SET
         participant_id = EXCLUDED.participant_id,
         participant_name = EXCLUDED.participant_name,
         participant_avatar = EXCLUDED.participant_avatar,
         status = 'occupied',
         occupied_at = NOW(),
         updated_at = NOW()
       RETURNING id, room_number, seat_number, participant_id, participant_name, participant_avatar, is_host, is_muted, is_camera_on, status, occupied_at`,
      [
        roomId,
        seatNumber,
        participantId,
        participantName,
        participantAvatar,
        seatNumber === 1,
      ]
    );

    const seat = updateRes && updateRes[0] ? updateRes[0] : null;

    // Fetch updated all 9 seats
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
      message: `Seat ${seatNumber} successfully occupied!`,
      seat,
      seats: allSeats,
    });
  } catch (error: any) {
    console.error('API /party/[roomId]/seats/occupy error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while occupying seat' },
      { status: 500 }
    );
  }
}
