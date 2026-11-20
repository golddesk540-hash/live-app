import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { assertAdultMessage, assertConversationMember } from '@/lib/messageApiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/message/conversations/:id/read (and /message/conversations/:id/read)
 * Marks messages in the conversation as read and resets unread count for caller
 * Enforces Rule 2: Only conversation members can mark conversation as read
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

    assertAdultMessage(user, 'mark conversation as read');

    // Rule 2: Membership check
    const { conversation, isParticipantOne } = await assertConversationMember(
      params.conversationId,
      user.id
    );

    const unreadField = isParticipantOne ? 'unread_count_one' : 'unread_count_two';

    await withTransaction(async (client) => {
      // Mark direct messages read
      await client.query(
        `UPDATE popolive.direct_messages
         SET delivery_status = 'read',
             read_at = CURRENT_TIMESTAMP
         WHERE conversation_id = $1 AND recipient_id = $2 AND (delivery_status != 'read' OR read_at IS NULL)`,
        [conversation.id, user.id]
      );

      // Reset unread count for caller in conversation
      await client.query(
        `UPDATE popolive.inbox_conversations
         SET ${unreadField} = 0,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [conversation.id]
      );
    });

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      unreadCount: 0,
      message: 'Conversation marked as read.',
    });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json(
      { success: false, error: error.message, code: error.code || 'INTERNAL_ERROR' },
      { status }
    );
  }
}
