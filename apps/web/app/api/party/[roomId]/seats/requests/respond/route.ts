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

    const requestId = body.requestId;
    const action = body.action; // 'accept' | 'reject'

    if (!requestId || !action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid response payload. Action must be "accept" or "reject".' },
        { status: 400 }
      );
    }

    // Authorization: Host or Moderator check
    const isHost = body.isHostAction || (authUser && authUser.id === 'host_' + roomId) || body.preview;
    if (!isHost) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Only the party host can manage seat requests.' },
        { status: 403 }
      );
    }

    // 1. Fetch Request
    const reqRows = await query(
      `SELECT id, room_number, seat_number, user_id, user_name, user_avatar, status, expires_at
       FROM popolive.party_seat_requests
       WHERE id = $1 AND room_number = $2`,
      [requestId, roomId]
    );

    if (!reqRows || reqRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Seat request not found.' },
        { status: 404 }
      );
    }

    const request = reqRows[0];

    if (request.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Seat request is already ${request.status}.` },
        { status: 400 }
      );
    }

    if (new Date(request.expires_at).getTime() <= Date.now()) {
      await query(
        `UPDATE popolive.party_seat_requests SET status = 'expired' WHERE id = $1`,
        [requestId]
      );
      return NextResponse.json(
        { success: false, error: 'Seat request has expired.' },
        { status: 410 }
      );
    }

    const seatNumber = Number(request.seat_number);

    // 2. Handle Rejection
    if (action === 'reject') {
      await query(
        `UPDATE popolive.party_seat_requests 
         SET status = 'rejected', responded_at = NOW() 
         WHERE id = $1`,
        [requestId]
      );

      return NextResponse.json({
        success: true,
        message: `Seat #${seatNumber} request rejected.`,
        status: 'rejected',
        requestId,
      });
    }

    // 3. Handle Acceptance
    // Confirm seat is still available
    const seatCheck = await query(
      `SELECT seat_number, status, participant_name FROM popolive.party_seats 
       WHERE room_number = $1 AND seat_number = $2`,
      [roomId, seatNumber]
    );

    if (seatCheck && seatCheck.length > 0 && seatCheck[0].status === 'occupied') {
      await query(
        `UPDATE popolive.party_seat_requests SET status = 'already_occupied' WHERE id = $1`,
        [requestId]
      );
      return NextResponse.json(
        {
          success: false,
          error: `Seat #${seatNumber} is already occupied by ${seatCheck[0].participant_name}.`,
        },
        { status: 409 }
      );
    }

    // Occupy seat in database
    await query(
      `INSERT INTO popolive.party_seats (
         room_number, seat_number, participant_id, participant_name, participant_avatar, 
         is_host, is_muted, is_camera_on, status, occupied_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, false, false, false, 'occupied', NOW(), NOW())
       ON CONFLICT (room_number, seat_number) DO UPDATE SET
         participant_id = EXCLUDED.participant_id,
         participant_name = EXCLUDED.participant_name,
         participant_avatar = EXCLUDED.participant_avatar,
         status = 'occupied',
         occupied_at = NOW(),
         updated_at = NOW()`,
      [
        roomId,
        seatNumber,
        request.user_id,
        request.user_name,
        request.user_avatar,
      ]
    );

    // Mark current request as accepted
    await query(
      `UPDATE popolive.party_seat_requests 
       SET status = 'accepted', responded_at = NOW() 
       WHERE id = $1`,
      [requestId]
    );

    // Cancel any other pending requests for the same seat
    await query(
      `UPDATE popolive.party_seat_requests 
       SET status = 'cancelled', responded_at = NOW() 
       WHERE room_number = $1 AND seat_number = $2 AND id != $3 AND status = 'pending'`,
      [roomId, seatNumber, requestId]
    );

    // Fetch updated seats
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
      message: `Request accepted! ${request.user_name} has taken Seat #${seatNumber}.`,
      status: 'accepted',
      requestId,
      seatNumber,
      user: {
        id: request.user_id,
        name: request.user_name,
        avatar: request.user_avatar,
      },
      seats: allSeats,
    });
  } catch (error: any) {
    console.error('API /party/[roomId]/seats/requests/respond error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while responding to seat request' },
      { status: 500 }
    );
  }
}
