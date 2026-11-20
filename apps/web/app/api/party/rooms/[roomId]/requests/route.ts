import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { resolvePartyRoom, assertAdult } from '@/lib/partyApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/party/rooms/:id/requests
 * Host only: view pending seat requests
 * Enforces Rule 5: Only host can manage requests (HTTP 403 ONLY_HOST_CAN_MANAGE_REQUESTS)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
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
          error: 'ONLY_HOST_CAN_MANAGE_REQUESTS: Only the room host can view or manage seat requests.',
          code: 'ONLY_HOST_CAN_MANAGE_REQUESTS',
        },
        { status: 403 }
      );
    }

    const requests = await query<any>(
      `SELECT id, room_number, seat_number, user_id, user_name, user_avatar, status, created_at, expires_at
       FROM popolive.party_seat_requests
       WHERE room_number = $1 AND status = 'pending'
       ORDER BY created_at ASC`,
      [room.room_number]
    );

    return NextResponse.json({
      success: true,
      requests: requests.map((r) => ({
        id: r.id,
        roomNumber: r.room_number,
        seatNumber: r.seat_number,
        userId: r.user_id,
        userName: r.user_name,
        userAvatar: r.user_avatar,
        status: r.status,
        createdAt: r.created_at,
        expiresAt: r.expires_at,
      })),
      total: requests.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/party/rooms/:id/requests
 * Viewer requests to join a seat (2 through 9)
 * Enforces:
 * - Rule 1: Party rooms have exactly 9 seats (rejects targetSeat > 9 or full room with HTTP 400 ROOM_FULL_OR_SEAT_OUT_OF_RANGE)
 * - Rule 2: Age 18+ to join (rejects underage with HTTP 403 AGE_VERIFICATION_FAILED)
 * - Rule 4: One seat per user (rejects if already seated with HTTP 409 USER_ALREADY_SEATED)
 * - Check: One pending request per user per room (rejects duplicate with HTTP 409 REQUEST_ALREADY_PENDING)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 1. Locked Rule 2: Age 18+ Check
    assertAdult(user, 'request a seat in Party');

    const room = await resolvePartyRoom(params.roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Party room not found.', code: 'ROOM_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // 2. Locked Rule 4: One seat per user in this room
    const alreadySeated = await query<any>(
      `SELECT seat_number FROM popolive.party_seats 
       WHERE room_number = $1 AND participant_id = $2 AND status = 'occupied'
       LIMIT 1`,
      [room.room_number, user.id]
    );

    if (alreadySeated.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `USER_ALREADY_SEATED: You are already occupying Seat #${alreadySeated[0].seat_number} in this room.`,
          code: 'USER_ALREADY_SEATED',
        },
        { status: 409 }
      );
    }

    // 3. Prevent duplicate pending requests
    const pendingReq = await query<any>(
      `SELECT id FROM popolive.party_seat_requests
       WHERE room_number = $1 AND user_id = $2 AND status = 'pending'
       LIMIT 1`,
      [room.room_number, user.id]
    );

    if (pendingReq.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'REQUEST_ALREADY_PENDING: You already have a pending seat request for this room.',
          code: 'REQUEST_ALREADY_PENDING',
          requestId: pendingReq[0].id,
        },
        { status: 409 }
      );
    }

    // 4. Target seat selection (Seat 2 to 9, never 1 which is host)
    let requestedSeat = body.seatNumber ? parseInt(body.seatNumber, 10) : null;

    if (requestedSeat !== null) {
      if (requestedSeat < 2 || requestedSeat > 9) {
        return NextResponse.json(
          {
            success: false,
            error: 'ROOM_FULL_OR_SEAT_OUT_OF_RANGE: Requested seat must be between 2 and 9.',
            code: 'ROOM_FULL_OR_SEAT_OUT_OF_RANGE',
          },
          { status: 400 }
        );
      }
    } else {
      // Find lowest available seat number
      const avail = await query<any>(
        `SELECT seat_number FROM popolive.party_seats
         WHERE room_number = $1 AND seat_number BETWEEN 2 AND 9 AND status = 'available' AND participant_id IS NULL
         ORDER BY seat_number ASC LIMIT 1`,
        [room.room_number]
      );
      if (avail.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'ROOM_FULL_OR_SEAT_OUT_OF_RANGE: All 9 seats in this party room are currently full.',
            code: 'ROOM_FULL_OR_SEAT_OUT_OF_RANGE',
          },
          { status: 400 }
        );
      }
      requestedSeat = avail[0].seat_number;
    }

    // Check if room is already 9/9 occupied
    const occupiedSeats = await query<any>(
      `SELECT COUNT(*) as count FROM popolive.party_seats WHERE room_number = $1 AND status = 'occupied'`,
      [room.room_number]
    );
    if (parseInt(occupiedSeats[0]?.count || '0', 10) >= 9) {
      return NextResponse.json(
        {
          success: false,
          error: 'ROOM_FULL_OR_SEAT_OUT_OF_RANGE: All 9 seats in this party room are currently full.',
          code: 'ROOM_FULL_OR_SEAT_OUT_OF_RANGE',
        },
        { status: 400 }
      );
    }

    // Insert request
    const insertRes = await query<any>(
      `INSERT INTO popolive.party_seat_requests (
        id, party_id, room_number, seat_number, user_id, user_name, user_avatar, status, created_at, expires_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '2 minutes'
      ) RETURNING id, seat_number, status, created_at`,
      [
        room.id,
        room.room_number,
        requestedSeat,
        user.id,
        user.nickname,
        user.avatar_url || '/avatars/default.png',
      ]
    );

    const createdReq = insertRes[0];

    return NextResponse.json(
      {
        success: true,
        requestId: createdReq.id,
        seatNumber: createdReq.seat_number,
        status: createdReq.status,
        message: 'Seat join request submitted to host.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error submitting seat request:', error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to submit seat request.',
        code: error.code || 'INTERNAL_ERROR',
      },
      { status }
    );
  }
}
