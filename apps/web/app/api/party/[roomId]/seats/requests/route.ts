import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;

    // 1. Expire outdated requests & invitations
    await query(
      `UPDATE popolive.party_seat_requests
       SET status = 'expired'
       WHERE room_number = $1 AND status = 'pending' AND expires_at <= NOW()`,
      [roomId]
    ).catch(() => {});

    await query(
      `UPDATE popolive.party_seat_invitations
       SET status = 'expired'
       WHERE room_number = $1 AND status = 'pending' AND expires_at <= NOW()`,
      [roomId]
    ).catch(() => {});

    // 2. Fetch pending requests
    const requests = await query(
      `SELECT id, room_number, seat_number, user_id, user_name, user_avatar, status, created_at, expires_at
       FROM popolive.party_seat_requests
       WHERE room_number = $1 AND status = 'pending'
       ORDER BY created_at DESC`,
      [roomId]
    );

    // 3. Fetch pending invitations
    const invitations = await query(
      `SELECT id, room_number, seat_number, host_id, invited_user_id, invited_user_name, invited_user_avatar, status, created_at, expires_at
       FROM popolive.party_seat_invitations
       WHERE room_number = $1 AND status = 'pending'
       ORDER BY created_at DESC`,
      [roomId]
    );

    return NextResponse.json({
      success: true,
      roomNumber: roomId,
      timestamp: Date.now(),
      pendingCount: (requests?.length || 0) + (invitations?.length || 0),
      requests: (requests || []).map((r) => ({
        id: r.id,
        roomNumber: r.room_number,
        seatNumber: Number(r.seat_number),
        userId: r.user_id,
        userName: r.user_name,
        userAvatar: r.user_avatar,
        status: r.status,
        createdAt: r.created_at,
        expiresAt: r.expires_at,
      })),
      invitations: (invitations || []).map((inv) => ({
        id: inv.id,
        roomNumber: inv.room_number,
        seatNumber: Number(inv.seat_number),
        hostId: inv.host_id,
        invitedUserId: inv.invited_user_id,
        invitedUserName: inv.invited_user_name,
        invitedUserAvatar: inv.invited_user_avatar,
        status: inv.status,
        createdAt: inv.created_at,
        expiresAt: inv.expires_at,
      })),
    });
  } catch (error: any) {
    console.error('API /party/[roomId]/seats/requests error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve seat requests' },
      { status: 500 }
    );
  }
}
