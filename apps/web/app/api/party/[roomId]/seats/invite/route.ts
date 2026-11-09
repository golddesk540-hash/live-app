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
    if (!seatNumber || seatNumber < 2 || seatNumber > 9) {
      return NextResponse.json(
        { success: false, error: 'Invalid seat number. Invitations must be for Seats 2 to 9.' },
        { status: 400 }
      );
    }

    const hostId = authUser?.id || body.hostId || 'host_' + roomId;
    const invitedUserId = body.invitedUserId || `viewer_${Date.now().toString().slice(-4)}`;
    const invitedUserName = body.invitedUserName || 'VIP Viewer';
    const invitedUserAvatar = body.invitedUserAvatar || '/assets/studio/user_avatar_2.png';

    // 1. Confirm seat is available
    const seatCheck = await query(
      `SELECT seat_number, status, participant_name FROM popolive.party_seats 
       WHERE room_number = $1 AND seat_number = $2`,
      [roomId, seatNumber]
    );

    if (seatCheck && seatCheck.length > 0 && seatCheck[0].status === 'occupied') {
      return NextResponse.json(
        { success: false, error: `Seat #${seatNumber} is already occupied.` },
        { status: 409 }
      );
    }

    // 2. Insert invitation
    const insertRes = await query(
      `INSERT INTO popolive.party_seat_invitations (
         room_number, seat_number, host_id, invited_user_id, invited_user_name, invited_user_avatar, status, created_at, expires_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW() + INTERVAL '2 minutes')
       RETURNING id, room_number, seat_number, host_id, invited_user_id, invited_user_name, invited_user_avatar, status, created_at, expires_at`,
      [roomId, seatNumber, hostId, invitedUserId, invitedUserName, invitedUserAvatar]
    );

    const invite = insertRes && insertRes[0] ? insertRes[0] : null;

    return NextResponse.json(
      {
        success: true,
        message: `Invitation sent to ${invitedUserName} for Seat #${seatNumber}!`,
        invitation: {
          id: invite?.id,
          roomNumber: roomId,
          seatNumber,
          hostId,
          invitedUserId,
          invitedUserName,
          invitedUserAvatar,
          status: 'pending',
          createdAt: invite?.created_at,
          expiresAt: invite?.expires_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API /party/[roomId]/seats/invite error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send seat invitation' },
      { status: 500 }
    );
  }
}
