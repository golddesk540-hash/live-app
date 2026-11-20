import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import {
  assertAdultMessage,
  assertConversationMember,
  checkIsBlocked,
  validateMessageContent,
} from '@/lib/messageApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/message/conversations/:id/messages (and /message/conversations/:id/messages)
 * Paginated chat message history for a conversation
 * Enforces Rule 2: Only conversation members can read messages
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    assertAdultMessage(user, 'read messages');

    // Rule 2: Membership check
    const { conversation } = await assertConversationMember(params.conversationId, user.id);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // Total count for pagination metadata
    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM popolive.direct_messages WHERE conversation_id = $1`,
      [conversation.id]
    );
    const total = parseInt(countRes[0]?.count || '0', 10);

    // Fetch messages paginated
    const msgRows = await query<any>(
      `SELECT 
        m.id,
        m.conversation_id,
        m.sender_id,
        m.recipient_id,
        m.message_text,
        m.message_type,
        m.delivery_status,
        m.read_at,
        m.created_at,
        u.nickname as sender_nickname,
        u.avatar_url as sender_avatar
       FROM popolive.direct_messages m
       JOIN popolive.users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC
       LIMIT $2 OFFSET $3`,
      [conversation.id, limit, offset]
    );

    const messages = msgRows.map((m) => {
      const isMe = m.sender_id.toString() === user.id.toString();
      return {
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        senderNickname: m.sender_nickname || (isMe ? user.nickname : 'User'),
        senderAvatar: m.sender_avatar || '/avatars/default.png',
        recipientId: m.recipient_id,
        text: m.message_text,
        content: m.message_text,
        messageType: m.message_type || 'text',
        deliveryStatus: m.delivery_status || 'sent',
        isRead: m.delivery_status === 'read' || Boolean(m.read_at),
        isMe,
        createdAt: m.created_at,
        timestamp: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      };
    });

    return NextResponse.json({
      success: true,
      messages,
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + messages.length < total,
      },
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
 * POST /api/message/conversations/:id/messages (and /message/conversations/:id/messages)
 * Sends a new direct text message
 * Enforces:
 * - Rule 1: Age 18+ to message
 * - Rule 2: Only conversation members can send
 * - Rule 4: Block check (blocked users cannot send to blocker)
 * - Rule 5: Message text validation (reject empty, reject > 1000 chars)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 1. Rule 1: Age 18+ Check
    assertAdultMessage(user, 'send direct message');

    // 2. Rule 2: Membership check
    const { conversation, recipientId, isParticipantOne } = await assertConversationMember(
      params.conversationId,
      user.id
    );

    // 3. Rule 4: Block check
    const isBlocked = await checkIsBlocked(user.id, recipientId);
    if (isBlocked) {
      return NextResponse.json(
        {
          success: false,
          error: 'USER_IS_BLOCKED: You cannot send messages to this user because you have been blocked.',
          code: 'USER_IS_BLOCKED',
        },
        { status: 403 }
      );
    }

    // 4. Rule 5: Validate message content
    const body = await req.json().catch(() => ({}));
    const rawText = body.text ?? body.content ?? body.messageText;
    const validatedText = validateMessageContent(rawText);

    // 5. Atomic insert and conversation update
    const result = await withTransaction(async (client) => {
      // Insert message
      const msgRes = await client.query(
        `INSERT INTO popolive.direct_messages (
          id, conversation_id, sender_id, recipient_id, message_text,
          message_type, delivery_status, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4,
          'text', 'sent', CURRENT_TIMESTAMP
        ) RETURNING *`,
        [conversation.id, user.id, recipientId, validatedText]
      );

      const createdMsg = msgRes.rows[0];

      // Update conversation last message & increment unread count for recipient
      const unreadField = isParticipantOne ? 'unread_count_two' : 'unread_count_one';
      await client.query(
        `UPDATE popolive.inbox_conversations
         SET last_message_id = $1,
             last_message_text = $2,
             last_message_sender_id = $3,
             last_message_at = CURRENT_TIMESTAMP,
             ${unreadField} = ${unreadField} + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [createdMsg.id, validatedText, user.id, conversation.id]
      );

      return createdMsg;
    });

    return NextResponse.json(
      {
        success: true,
        message: {
          id: result.id,
          conversationId: result.conversation_id,
          senderId: result.sender_id,
          senderNickname: user.nickname,
          senderAvatar: user.avatar_url || '/avatars/default.png',
          recipientId: result.recipient_id,
          text: result.message_text,
          content: result.message_text,
          messageType: result.message_type,
          deliveryStatus: result.delivery_status,
          isMe: true,
          createdAt: result.created_at,
          timestamp: new Date(result.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
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
