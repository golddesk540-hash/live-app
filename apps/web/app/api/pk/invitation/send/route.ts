import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { redisSetWithTtl } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const authUser = await getAuthenticatedUser(req).catch(() => null);

    const senderHostId = authUser?.id || body.senderHostId || body.hostId;
    const senderRoomNumber = body.senderRoomNumber || body.roomNumber || '7001';
    const receiverHostId = body.receiverHostId;
    const battleType = body.battleType || '1v1';
    const language = (body.language || 'en').toLowerCase();
    const isUrdu = language === 'ur';

    if (!senderHostId) {
      return NextResponse.json(
        {
          success: false,
          code: 'UNAUTHORIZED',
          error: 'Sender host ID is required.',
          errorUr: 'میزبان کی شناخت درکار ہے۔',
        },
        { status: 401 }
      );
    }

    if (!receiverHostId) {
      return NextResponse.json(
        {
          success: false,
          code: 'RECEIVER_REQUIRED',
          error: 'Receiver host ID is required to send an invitation.',
          errorUr: 'دعوت نامہ بھیجنے کے لیے وصول کنندہ میزبان درکار ہے۔',
        },
        { status: 400 }
      );
    }

    // 1. Self-invitation check
    if (senderHostId === receiverHostId) {
      return NextResponse.json(
        {
          success: false,
          code: 'CANNOT_INVITE_SELF',
          error: 'A host cannot invite themselves to a PK battle.',
          errorUr: 'میزبان خود کو پی کے مقابلے کی دعوت نہیں دے سکتا۔',
        },
        { status: 400 }
      );
    }

    // 2. Fetch sender details & eligibility
    const senderRows = await query(
      `SELECT u.id, u.poppo_id, u.nickname, u.avatar_url, u.status, u.is_face_verified, u.go_live_eligible, 
              COALESCE(u.in_pk_battle, false) as in_pk_battle,
              lr.room_number, lr.status as room_status, lr.is_live
       FROM popolive.users u
       LEFT JOIN popolive.live_rooms lr ON lr.host_id = u.id
       WHERE u.id::text = $1 OR u.poppo_id = $1
       LIMIT 1`,
      [senderHostId]
    );

    const sender = senderRows[0];
    if (!sender) {
      return NextResponse.json(
        {
          success: false,
          code: 'SENDER_NOT_FOUND',
          error: 'Sender host account not found.',
          errorUr: 'بھیجنے والے میزبان کا اکاؤنٹ نہیں ملا۔',
        },
        { status: 404 }
      );
    }

    if (sender.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          code: 'SENDER_SUSPENDED',
          error: 'Your account is suspended or not eligible for PK battles.',
          errorUr: 'آپ کا اکاؤنٹ معطل ہے یا پی کے مقابلے کے لیے اہل نہیں ہے۔',
        },
        { status: 403 }
      );
    }

    if (sender.in_pk_battle) {
      return NextResponse.json(
        {
          success: false,
          code: 'SENDER_ALREADY_IN_BATTLE',
          error: 'You are already in an active PK battle.',
          errorUr: 'آپ پہلے ہی ایک فعال پی کے مقابلے میں ہیں۔',
        },
        { status: 409 }
      );
    }

    // 3. Fetch receiver details & eligibility
    const receiverRows = await query(
      `SELECT u.id, u.poppo_id, u.nickname, u.avatar_url, u.status, u.is_face_verified, u.go_live_eligible,
              COALESCE(u.in_pk_battle, false) as in_pk_battle,
              COALESCE(u.pk_invites_enabled, true) as pk_invites_enabled,
              lr.room_number, lr.status as room_status, lr.is_live
       FROM popolive.users u
       LEFT JOIN popolive.live_rooms lr ON lr.host_id = u.id
       WHERE u.id::text = $1 OR u.poppo_id = $1
       LIMIT 1`,
      [receiverHostId]
    );

    const receiver = receiverRows[0];
    if (!receiver) {
      return NextResponse.json(
        {
          success: false,
          code: 'RECEIVER_NOT_FOUND',
          error: 'Target host not found.',
          errorUr: 'مطلوبہ میزبان نہیں ملا۔',
        },
        { status: 404 }
      );
    }

    if (!receiver.is_live && receiver.room_status !== 'live') {
      return NextResponse.json(
        {
          success: false,
          code: 'RECEIVER_OFFLINE',
          error: `${receiver.nickname} is currently offline or not streaming.`,
          errorUr: `${receiver.nickname} اس وقت آف لائن ہیں یا لائیو نہیں ہیں۔`,
        },
        { status: 400 }
      );
    }

    if (!receiver.pk_invites_enabled) {
      return NextResponse.json(
        {
          success: false,
          code: 'RECEIVER_INVITES_DISABLED',
          error: `${receiver.nickname} has disabled PK battle invitations.`,
          errorUr: `${receiver.nickname} نے پی کے دعوت نامے بند کر رکھے ہیں۔`,
        },
        { status: 403 }
      );
    }

    if (receiver.in_pk_battle) {
      return NextResponse.json(
        {
          success: false,
          code: 'RECEIVER_ALREADY_IN_BATTLE',
          error: `${receiver.nickname} is currently participating in another PK battle.`,
          errorUr: `${receiver.nickname} اس وقت کسی دوسرے پی کے مقابلے میں مصروف ہیں۔`,
        },
        { status: 409 }
      );
    }

    // 4. Check for active pending invitation between these two hosts (prevent duplicates / spam)
    const existingInvites = await query(
      `SELECT id, created_at, expires_at FROM popolive.pk_invitations
       WHERE sender_host_id = $1 AND receiver_host_id = $2 
         AND status = 'pending' AND expires_at > NOW()
       LIMIT 1`,
      [sender.id, receiver.id]
    );

    if (existingInvites.length > 0) {
      return NextResponse.json(
        {
          success: false,
          code: 'DUPLICATE_INVITATION',
          error: `An invitation to ${receiver.nickname} is already pending.`,
          errorUr: `${receiver.nickname} کو دعوت نامہ پہلے سے زیرِ التوا ہے۔`,
          invitationId: existingInvites[0].id,
        },
        { status: 429 }
      );
    }

    // 5. Create invitation (30 seconds expiry)
    const expiresAt = new Date(Date.now() + 30 * 1000);
    const resolvedSenderRoom = sender.room_number || senderRoomNumber;
    const resolvedReceiverRoom = receiver.room_number || '7002';

    const insertResult = await query(
      `INSERT INTO popolive.pk_invitations (
         sender_host_id, sender_room_number, sender_nickname, sender_avatar,
         receiver_host_id, receiver_room_number, receiver_nickname, receiver_avatar,
         battle_type, status, expires_at, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, NOW(), NOW())
       RETURNING *`,
      [
        sender.id,
        resolvedSenderRoom,
        sender.nickname,
        sender.avatar_url || '/avatars/default.png',
        receiver.id,
        resolvedReceiverRoom,
        receiver.nickname,
        receiver.avatar_url || '/avatars/default.png',
        battleType,
        expiresAt,
      ]
    );

    const invite = insertResult[0];

    // Store in Redis temporary cache
    await redisSetWithTtl(
      `pk:invitation:${invite.id}`,
      JSON.stringify({
        id: invite.id,
        senderId: sender.id,
        senderNickname: sender.nickname,
        receiverId: receiver.id,
        receiverNickname: receiver.nickname,
        status: 'pending',
        expiresAt: expiresAt.toISOString(),
      }),
      30
    );

    return NextResponse.json({
      success: true,
      message: `PK Battle invitation sent to ${receiver.nickname}!`,
      messageUr: `${receiver.nickname} کو پی کے مقابلے کی دعوت بھیج دی گئی ہے!`,
      invitation: {
        id: invite.id,
        senderHostId: sender.id,
        senderRoomNumber: resolvedSenderRoom,
        senderNickname: sender.nickname,
        senderAvatar: sender.avatar_url || '/avatars/default.png',
        receiverHostId: receiver.id,
        receiverRoomNumber: resolvedReceiverRoom,
        receiverNickname: receiver.nickname,
        receiverAvatar: receiver.avatar_url || '/avatars/default.png',
        battleType,
        status: 'pending',
        expiresAt: expiresAt.toISOString(),
        secondsRemaining: 30,
        createdAt: invite.created_at,
      },
    });
  } catch (err: any) {
    console.error('API /api/pk/invitation/send error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to send PK invitation' },
      { status: 500 }
    );
  }
}
