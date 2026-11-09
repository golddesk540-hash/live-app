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
    if (!seatNumber || seatNumber < 2 || seatNumber > 9) {
      return NextResponse.json(
        { success: false, error: 'Invalid seat number. Viewer requests are only allowed for Seats 2 to 9.' },
        { status: 400 }
      );
    }

    const userId = authUser?.id || body.userId || (isDemo ? `demo_user_${Date.now().toString().slice(-4)}` : null);
    const userName = authUser?.nickname || body.userName || 'Guest Viewer';
    const userAvatar = authUser?.avatar_url || body.userAvatar || '/assets/studio/user_avatar_1.png';

    if (!userId && !isDemo) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to request a seat.' },
        { status: 401 }
      );
    }

    // Module 5.9: Verify room limits and protection settings
    const roomRows = await query(
      `SELECT max_seats, allow_join_requests, is_invite_only, is_locked, status FROM popolive.party_rooms WHERE room_number = $1`,
      [roomId]
    );

    if (roomRows && roomRows[0]) {
      const room = roomRows[0];
      if (room.status === 'closed') {
        return NextResponse.json(
          { success: false, error: 'Party room is closed.' },
          { status: 403 }
        );
      }
      if (room.is_locked) {
        return NextResponse.json(
          { success: false, error: 'Room is locked. Seat requests are disabled.' },
          { status: 403 }
        );
      }
      if (room.allow_join_requests === false) {
        return NextResponse.json(
          { success: false, error: 'Seat join requests are disabled by the host.' },
          { status: 403 }
        );
      }
      if (room.is_invite_only) {
        return NextResponse.json(
          { success: false, error: 'Party is Invite Only. Direct seat requests are not allowed.' },
          { status: 403 }
        );
      }

      // Check if all seats are occupied
      const occupiedRes = await query(
        `SELECT COUNT(*) as count FROM popolive.party_seats WHERE room_number = $1 AND status = 'occupied'`,
        [roomId]
      );
      const occupiedCount = parseInt(occupiedRes[0]?.count || '1', 10);
      const maxSeats = room.max_seats || 9;
      if (occupiedCount >= maxSeats) {
        return NextResponse.json(
          {
            success: false,
            error: `Seats Full: All ${maxSeats} participant seats are currently occupied.`,
            isSeatsFull: true,
            maxSeats,
          },
          { status: 409 }
        );
      }
    }

    // 1. Check if the seat is already occupied or locked
    const seatCheck = await query(
      `SELECT seat_number, status, participant_id, participant_name FROM popolive.party_seats 
       WHERE room_number = $1 AND seat_number = $2`,
      [roomId, seatNumber]
    );

    if (seatCheck && seatCheck.length > 0) {
      const seat = seatCheck[0];
      if (seat.status === 'occupied') {
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
          { success: false, error: `Seat ${seatNumber} is currently locked by the host.` },
          { status: 423 }
        );
      }
    }

    // 2. Check if user is already occupying any seat in the party
    const activeSeat = await query(
      `SELECT seat_number FROM popolive.party_seats 
       WHERE room_number = $1 AND participant_id = $2 AND status = 'occupied'`,
      [roomId, userId]
    );

    if (activeSeat && activeSeat.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `You are already occupying Seat #${activeSeat[0].seat_number}. Vacate your seat before requesting another.`,
        },
        { status: 400 }
      );
    }

    // 3. Check for existing active pending request from this user
    const pendingCheck = await query(
      `SELECT id, seat_number, created_at FROM popolive.party_seat_requests 
       WHERE room_number = $1 AND user_id = $2 AND status = 'pending' AND expires_at > NOW()`,
      [roomId, userId]
    );

    if (pendingCheck && pendingCheck.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `You already have a pending request for Seat #${pendingCheck[0].seat_number}. Please wait for the host to respond.`,
          existingRequest: pendingCheck[0],
        },
        { status: 400 }
      );
    }

    // 4. Insert seat request
    const insertRes = await query(
      `INSERT INTO popolive.party_seat_requests (
         room_number, seat_number, user_id, user_name, user_avatar, status, created_at, expires_at
       )
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW() + INTERVAL '2 minutes')
       RETURNING id, room_number, seat_number, user_id, user_name, user_avatar, status, created_at, expires_at`,
      [roomId, seatNumber, userId, userName, userAvatar]
    );

    const seatRequest = insertRes && insertRes[0] ? insertRes[0] : null;

    return NextResponse.json(
      {
        success: true,
        message: `Seat request for Seat #${seatNumber} submitted to host!`,
        request: {
          id: seatRequest?.id,
          roomNumber: roomId,
          seatNumber,
          userId,
          userName,
          userAvatar,
          status: 'pending',
          createdAt: seatRequest?.created_at,
          expiresAt: seatRequest?.expires_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API /party/[roomId]/seats/request error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit seat request' },
      { status: 500 }
    );
  }
}
