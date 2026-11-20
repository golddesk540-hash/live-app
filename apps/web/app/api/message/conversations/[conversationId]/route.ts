import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { assertAdultMessage, assertConversationMember } from '@/lib/messageApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/message/conversations/:id (and /message/conversations/:id)
 * Fetches conversation details with membership verification
 * Enforces Rule 2: A user can only access conversations they belong to
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

    assertAdultMessage(user, 'view conversation');

    // Rule 2: Membership check
    const { conversation, recipientId, isParticipantOne } = await assertConversationMember(
      params.conversationId,
      user.id
    );

    // Query peer info
    const peerRows = await query<any>(
      `SELECT id, nickname, avatar_url, status, wealth_level, is_face_verified FROM popolive.users WHERE id::text = $1 LIMIT 1`,
      [recipientId]
    );
    const peer = peerRows[0] || {};

    const unreadCount = isParticipantOne ? Number(conversation.unread_count_one || 0) : Number(conversation.unread_count_two || 0);

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        threadId: conversation.id,
        peerId: recipientId,
        peerNickname: peer.nickname || 'Popo User',
        peerAvatar: peer.avatar_url || '/avatars/default.png',
        peerStatus: peer.status || 'active',
        peerWealthLevel: Number(peer.wealth_level || 1),
        peerIsVerified: Boolean(peer.is_face_verified),
        lastMessage: conversation.last_message_text,
        lastMessageAt: conversation.last_message_at,
        unreadCount,
        status: conversation.status,
        createdAt: conversation.created_at,
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
