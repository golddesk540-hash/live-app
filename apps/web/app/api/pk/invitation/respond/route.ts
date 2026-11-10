import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { redisSetWithTtl } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const authUser = await getAuthenticatedUser(req).catch(() => null);

    const invitationId = body.invitationId;
    const action = (body.action || '').toLowerCase(); // 'accept' | 'reject'
    const receiverHostId = authUser?.id || body.receiverHostId || body.hostId;
    const reason = body.reason || null;
    const language = (body.language || 'en').toLowerCase();
    const isUrdu = language === 'ur';

    if (!invitationId) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVITATION_ID_REQUIRED',
          error: 'Invitation ID is required.',
          errorUr: 'دعوت نامے کی شناخت درکار ہے۔',
        },
        { status: 400 }
      );
    }

    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_ACTION',
          error: "Action must be either 'accept' or 'reject'.",
          errorUr: "عمل لازمی طور پر 'accept' یا 'reject' ہونا چاہیے۔",
        },
        { status: 400 }
      );
    }

    // 1. Fetch invitation
    const inviteRows = await query(
      `SELECT * FROM popolive.pk_invitations WHERE id = $1`,
      [invitationId]
    );

    const invite = inviteRows[0];
    if (!invite) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVITATION_NOT_FOUND',
          error: 'Invitation not found.',
          errorUr: 'دعوت نامہ نہیں ملا۔',
        },
        { status: 404 }
      );
    }

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(invite.expires_at);

    if (invite.status !== 'pending' || now > expiresAt) {
      const currentStatus = now > expiresAt ? 'expired' : invite.status;
      if (now > expiresAt && invite.status === 'pending') {
        await query(
          `UPDATE popolive.pk_invitations SET status = 'expired', updated_at = NOW() WHERE id = $1`,
          [invitationId]
        );
      }
      return NextResponse.json(
        {
          success: false,
          code: 'INVITATION_INACTIVE',
          status: currentStatus,
          error: `This PK battle invitation has ${currentStatus}.`,
          errorUr: `یہ پی کے دعوت نامہ ${currentStatus === 'expired' ? 'ختم' : currentStatus} ہو چکا ہے۔`,
        },
        { status: 410 }
      );
    }

    // 2. Handle Rejection
    if (action === 'reject') {
      await query(
        `UPDATE popolive.pk_invitations 
         SET status = 'rejected', rejection_reason = $2, updated_at = NOW() 
         WHERE id = $1`,
        [invitationId, reason || 'declined_by_host']
      );

      await redisSetWithTtl(
        `pk:invitation:${invitationId}`,
        JSON.stringify({ id: invitationId, status: 'rejected', reason }),
        60
      );

      return NextResponse.json({
        success: true,
        action: 'rejected',
        message: 'PK battle invitation rejected.',
        messageUr: 'پی کے مقابلے کی دعوت مسترد کر دی گئی۔',
        invitationId,
      });
    }

    // 3. Handle Acceptance with Safe Transaction & Row Locking
    const battleResult = await withTransaction(async (client) => {
      // Lock sender and receiver user rows to prevent race condition
      const usersRes = await client.query(
        `SELECT id, poppo_id, nickname, COALESCE(in_pk_battle, false) as in_pk_battle 
         FROM popolive.users 
         WHERE id::text IN ($1, $2) OR poppo_id IN ($1, $2)
         FOR UPDATE`,
        [invite.sender_host_id, invite.receiver_host_id]
      );

      for (const u of usersRes.rows) {
        if (u.in_pk_battle) {
          throw new Error(`HOST_BUSY:${u.nickname} is already in a PK battle.`);
        }
      }

      // Create confirmed PK battle
      const battleRes = await client.query(
        `INSERT INTO popolive.pk_battles (
           battle_type, host_a_id, host_a_room, host_a_nickname, host_a_avatar,
           host_b_id, host_b_room, host_b_nickname, host_b_avatar,
           match_method, invitation_id, status, created_at, started_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'invite', $10, 'confirmed', NOW(), NOW())
         RETURNING *`,
        [
          invite.battle_type,
          invite.sender_host_id,
          invite.sender_room_number,
          invite.sender_nickname,
          invite.sender_avatar,
          invite.receiver_host_id,
          invite.receiver_room_number,
          invite.receiver_nickname,
          invite.receiver_avatar,
          invitationId,
        ]
      );

      const battle = battleRes.rows[0];

      // Update both hosts' users table
      await client.query(
        `UPDATE popolive.users 
         SET in_pk_battle = true, current_pk_battle_id = $1, updated_at = NOW() 
         WHERE id::text IN ($2, $3) OR poppo_id IN ($2, $3)`,
        [battle.id, invite.sender_host_id, invite.receiver_host_id]
      );

      // Update live rooms
      await client.query(
        `UPDATE popolive.live_rooms 
         SET in_pk_battle = true, is_pk = true, current_pk_id = $1, updated_at = NOW() 
         WHERE room_number IN ($2, $3)`,
        [battle.id, invite.sender_room_number, invite.receiver_room_number]
      );

      // Mark invitation accepted
      await client.query(
        `UPDATE popolive.pk_invitations 
         SET status = 'accepted', updated_at = NOW() 
         WHERE id = $1`,
        [invitationId]
      );

      // Upsert PK Battle Session for Host A & Host B
      await client.query(
        `INSERT INTO popolive.pk_battle_sessions (
           room_number, host_id, battle_type, status, configured_at, updated_at
         )
         VALUES ($1, $2, $3, 'active', NOW(), NOW())
         ON CONFLICT (room_number) DO UPDATE SET
           battle_type = EXCLUDED.battle_type,
           status = 'active',
           updated_at = NOW()`,
        [invite.sender_room_number, invite.sender_host_id, invite.battle_type]
      );

      await client.query(
        `INSERT INTO popolive.pk_battle_sessions (
           room_number, host_id, battle_type, status, configured_at, updated_at
         )
         VALUES ($1, $2, $3, 'active', NOW(), NOW())
         ON CONFLICT (room_number) DO UPDATE SET
           battle_type = EXCLUDED.battle_type,
           status = 'active',
           updated_at = NOW()`,
        [invite.receiver_room_number, invite.receiver_host_id, invite.battle_type]
      );

      return battle;
    });

    // Cache battle state in Redis
    await redisSetWithTtl(
      `pk:battle:${battleResult.id}`,
      JSON.stringify({
        id: battleResult.id,
        status: 'confirmed',
        hostAId: battleResult.host_a_id,
        hostBId: battleResult.host_b_id,
        matchMethod: 'invite',
      }),
      600
    );

    return NextResponse.json({
      success: true,
      action: 'accepted',
      message: 'PK battle confirmed! Both hosts are now connected.',
      messageUr: 'پی کے جنگ کی تصدیق ہو گئی! دونوں میزبان اب جڑ چکے ہیں۔',
      battle: {
        id: battleResult.id,
        battleType: battleResult.battle_type,
        matchMethod: 'invite',
        status: 'confirmed',
        hostA: {
          id: battleResult.host_a_id,
          nickname: battleResult.host_a_nickname,
          avatar: battleResult.host_a_avatar,
          roomNumber: battleResult.host_a_room,
        },
        hostB: {
          id: battleResult.host_b_id,
          nickname: battleResult.host_b_nickname,
          avatar: battleResult.host_b_avatar,
          roomNumber: battleResult.host_b_room,
        },
        createdAt: battleResult.created_at,
        startedAt: battleResult.started_at,
      },
    });
  } catch (err: any) {
    console.error('API /api/pk/invitation/respond error:', err);
    if (err.message && err.message.startsWith('HOST_BUSY:')) {
      return NextResponse.json(
        {
          success: false,
          code: 'HOST_ALREADY_IN_BATTLE',
          error: err.message.replace('HOST_BUSY:', ''),
          errorUr: 'میزبان پہلے ہی کسی دوسرے مقابلے میں مصروف ہے۔',
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to process PK invitation response' },
      { status: 500 }
    );
  }
}
