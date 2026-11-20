import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { assertAdultMessage } from '@/lib/messageApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/message/conversations (and /message/conversations)
 * Lists all conversation threads and active people row for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    assertAdultMessage(user, 'access messaging inbox');

    // 1. Query user conversations joined with peer user details
    const convRows = await query<any>(
      `SELECT 
        c.id as conversation_id,
        c.participant_one_id,
        c.participant_two_id,
        c.last_message_id,
        c.last_message_text,
        c.last_message_sender_id,
        c.last_message_at,
        c.unread_count_one,
        c.unread_count_two,
        c.is_pinned_one,
        c.is_pinned_two,
        c.status as conversation_status,
        c.created_at,
        c.updated_at,
        CASE 
          WHEN c.participant_one_id::text = $1 THEN c.participant_two_id 
          ELSE c.participant_one_id 
        END as peer_id,
        u.nickname as peer_nickname,
        u.avatar_url as peer_avatar,
        u.status as peer_user_status,
        COALESCE(u.wealth_level, 1) as peer_wealth_level,
        COALESCE(u.is_face_verified, false) as peer_is_verified
       FROM popolive.inbox_conversations c
       JOIN popolive.users u ON u.id = (
         CASE 
           WHEN c.participant_one_id::text = $1 THEN c.participant_two_id 
           ELSE c.participant_one_id 
         END
       )
       WHERE c.participant_one_id::text = $1 OR c.participant_two_id::text = $1
       ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC`,
      [user.id]
    );

    const conversations = convRows.map((r) => {
      const isParticipantOne = r.participant_one_id.toString() === user.id.toString();
      const unreadCount = isParticipantOne ? Number(r.unread_count_one || 0) : Number(r.unread_count_two || 0);
      const isPinned = isParticipantOne ? Boolean(r.is_pinned_one) : Boolean(r.is_pinned_two);

      return {
        id: r.conversation_id,
        threadId: r.conversation_id,
        peerId: r.peer_id,
        peerUserId: r.peer_id,
        peerNickname: r.peer_nickname || 'Popo User',
        peerAvatar: r.peer_avatar || '/avatars/default.png',
        peerStatus: r.peer_user_status || 'active',
        peerWealthLevel: Number(r.peer_wealth_level || 1),
        peerIsVerified: Boolean(r.peer_is_verified),
        lastMessage: r.last_message_text || '',
        lastMessageSenderId: r.last_message_sender_id,
        lastMessageTime: r.last_message_at ? new Date(r.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        unreadCount,
        isPinned,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });

    // 2. Query People Row (followed creators / followers)
    const peopleRows = await query<any>(
      `SELECT DISTINCT 
        u.id, u.nickname, u.avatar_url, u.status,
        COALESCE(u.is_face_verified, false) as is_verified
       FROM popolive.user_follows uf
       JOIN popolive.users u ON (u.id = uf.following_id OR u.id = uf.follower_id)
       WHERE (uf.follower_id::text = $1 OR uf.following_id::text = $1)
         AND u.id::text != $1
       LIMIT 15`,
      [user.id]
    );

    const people = peopleRows.map((p) => ({
      id: p.id,
      userId: p.id,
      nickname: p.nickname,
      avatarUrl: p.avatar_url || '/avatars/default.png',
      status: p.status || 'active',
      isVerified: Boolean(p.is_verified),
      isLive: false,
    }));

    return NextResponse.json({
      success: true,
      conversations,
      chats: conversations,
      people,
      total: conversations.length,
    });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json(
      { success: false, error: error.message, code: error.code || 'INTERNAL_ERROR' },
      { status }
    );
  }
}

/**
 * POST /api/message/conversations (and /message/conversations)
 * Creates a new conversation or retrieves existing conversation with recipientId
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    assertAdultMessage(user, 'start a conversation');

    const body = await req.json().catch(() => ({}));
    const recipientId = body.recipientId || body.peerUserId || body.targetUserId;

    if (!recipientId) {
      return NextResponse.json(
        { success: false, error: 'recipientId is required.', code: 'MISSING_RECIPIENT' },
        { status: 400 }
      );
    }

    if (recipientId.toString() === user.id.toString()) {
      return NextResponse.json(
        { success: false, error: 'Cannot create a conversation with yourself.', code: 'CANNOT_CHAT_SELF' },
        { status: 400 }
      );
    }

    // Verify recipient user exists
    const recRows = await query<any>(`SELECT id, nickname, avatar_url FROM popolive.users WHERE id::text = $1 LIMIT 1`, [recipientId]);
    if (recRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Recipient user not found.', code: 'RECIPIENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Find or create conversation in canonical order (p1 < p2 to respect unique constraint)
    const p1 = user.id < recipientId ? user.id : recipientId;
    const p2 = user.id < recipientId ? recipientId : user.id;

    const existingRes = await query<any>(
      `SELECT id, participant_one_id, participant_two_id, last_message_text, last_message_at, unread_count_one, unread_count_two
       FROM popolive.inbox_conversations
       WHERE participant_one_id::text = $1 AND participant_two_id::text = $2
       LIMIT 1`,
      [p1, p2]
    );

    if (existingRes.length > 0) {
      return NextResponse.json({
        success: true,
        conversationId: existingRes[0].id,
        isExisting: true,
        conversation: existingRes[0],
      });
    }

    const insertRes = await query<any>(
      `INSERT INTO popolive.inbox_conversations (
        id, participant_one_id, participant_two_id, unread_count_one, unread_count_two,
        status, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, 0, 0, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id, participant_one_id, participant_two_id, status, created_at`,
      [p1, p2]
    );

    return NextResponse.json(
      {
        success: true,
        conversationId: insertRes[0].id,
        isExisting: false,
        conversation: insertRes[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json(
      { success: false, error: error.message, code: error.code || 'INTERNAL_ERROR' },
      { status }
    );
  }
}
