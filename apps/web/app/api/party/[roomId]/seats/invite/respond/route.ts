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

    const invitationId = body.invitationId;
    const action = body.action; // 'accept' | 'decline'

    if (!invitationId || !action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid invitation response. Action must be "accept" or "decline".' },
        { status: 400 }
      );
    }

    // 1. Fetch Invitation
    const invRows = await query(
      `SELECT id, room_number, seat_number, host_id, invited_user_id, invited_user_name, invited_user_avatar, status, expires_at
       FROM popolive.party_seat_invitations
       WHERE id = $1 AND room_number = $2`,
      [invitationId, roomId]
    );

    if (!invRows || invRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found.' },
        { status: 404 }
      );
    }

    const invitation = invRows[0];

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Invitation is already ${invitation.status}.` },
        { status: 400 }
      );
    }

    if (new Date(invitation.expires_at).getTime() <= Date.now()) {
      await query(
        `UPDATE popolive.party_seat_invitations SET status = 'expired' WHERE id = $1`,
        [invitationId]
      );
      return NextResponse.json(
        { success: false, error: 'Invitation has expired.' },
        { status: 410 }
      );
    }

    const seatNumber = Number(invitation.seat_number);

    // 2. Handle Decline
    if (action === 'decline') {
      await query(
        `UPDATE popolive.party_seat_invitations 
         SET status = 'declined', responded_at = NOW() 
         WHERE id = $1`,
        [invitationId]
      );

      return NextResponse.json({
        success: true,
        message: 'Invitation declined.',
        status: 'declined',
        invitationId,
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
        `UPDATE popolive.party_seat_invitations SET status = 'already_occupied' WHERE id = $1`,
        [invitationId]
      );
      return NextResponse.json(
        {
          success: false,
          error: `Seat #${seatNumber} is no longer available.`,
        },
        { status: 409 }
      );
    }

    // Assign invited user to seat
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
        invitation.invited_user_id,
        invitation.invited_user_name,
        invitation.invited_user_avatar,
      ]
    );

    // Mark invitation accepted
    await query(
      `UPDATE popolive.party_seat_invitations 
       SET status = 'accepted', responded_at = NOW() 
       WHERE id = $1`,
      [invitationId]
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
      message: `Invitation accepted! You have joined Seat #${seatNumber}.`,
      status: 'accepted',
      invitationId,
      seatNumber,
      seats: allSeats,
    });
  } catch (error: any) {
    console.error('API /party/[roomId]/seats/invite/respond error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while responding to invitation' },
      { status: 500 }
    );
  }
}
