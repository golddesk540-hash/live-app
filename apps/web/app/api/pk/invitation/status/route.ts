import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const invitationId = searchParams.get('invitationId') || searchParams.get('id');
    const hostId = searchParams.get('hostId') || '';
    const roomNumber = searchParams.get('roomNumber') || '';

    let invite: any = null;

    if (invitationId) {
      const rows = await query(
        `SELECT * FROM popolive.pk_invitations WHERE id = $1`,
        [invitationId]
      );
      invite = rows[0];
    } else if (hostId || roomNumber) {
      // Find latest pending invitation where host is either receiver or sender
      const rows = await query(
        `SELECT * FROM popolive.pk_invitations 
         WHERE (receiver_host_id = $1 OR sender_host_id = $1 OR receiver_room_number = $2 OR sender_room_number = $2)
           AND status = 'pending'
         ORDER BY created_at DESC 
         LIMIT 1`,
        [hostId, roomNumber]
      );
      invite = rows[0];
    }

    if (!invite) {
      return NextResponse.json({
        success: true,
        hasActiveInvitation: false,
        invitation: null,
      });
    }

    const now = new Date();
    const expiresAt = new Date(invite.expires_at);
    let status = invite.status;
    let secondsRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

    if (status === 'pending' && now > expiresAt) {
      status = 'expired';
      secondsRemaining = 0;
      await query(
        `UPDATE popolive.pk_invitations SET status = 'expired', updated_at = NOW() WHERE id = $1`,
        [invite.id]
      );
    }

    // If accepted, fetch battle details
    let battle: any = null;
    if (status === 'accepted') {
      const battleRows = await query(
        `SELECT * FROM popolive.pk_battles WHERE invitation_id = $1 LIMIT 1`,
        [invite.id]
      );
      battle = battleRows[0] || null;
    }

    return NextResponse.json({
      success: true,
      hasActiveInvitation: status === 'pending',
      invitation: {
        id: invite.id,
        senderHostId: invite.sender_host_id,
        senderRoomNumber: invite.sender_room_number,
        senderNickname: invite.sender_nickname,
        senderAvatar: invite.sender_avatar,
        receiverHostId: invite.receiver_host_id,
        receiverRoomNumber: invite.receiver_room_number,
        receiverNickname: invite.receiver_nickname,
        receiverAvatar: invite.receiver_avatar,
        battleType: invite.battle_type,
        status,
        rejectionReason: invite.rejection_reason,
        expiresAt: invite.expires_at,
        secondsRemaining,
        createdAt: invite.created_at,
        updatedAt: invite.updated_at,
      },
      battle: battle ? {
        id: battle.id,
        battleType: battle.battle_type,
        status: battle.status,
        hostAId: battle.host_a_id,
        hostARoom: battle.host_a_room,
        hostANickname: battle.host_a_nickname,
        hostBId: battle.host_b_id,
        hostBRoom: battle.host_b_room,
        hostBNickname: battle.host_b_nickname,
        createdAt: battle.created_at,
      } : null,
    });
  } catch (err: any) {
    console.error('API /api/pk/invitation/status error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve invitation status' },
      { status: 500 }
    );
  }
}
