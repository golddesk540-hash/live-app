import { NextRequest, NextResponse } from 'next/server';
import { resolveMessagingActor, getConversationMessages, determineUserStatus } from '@/lib/messaging';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { conversationId } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const beforeTimestamp = searchParams.get('before') || undefined;

    // Get conversation details & opponent
    const convRows = await query(
      `SELECT c.id, c.participant_one_id, c.participant_two_id,
              u.id AS opp_id, u.nickname AS opp_nickname, u.poppo_id AS opp_poppo_id,
              u.avatar_url AS opp_avatar_url, u.host_level AS opp_host_level,
              u.wealth_level AS opp_wealth_level,
              COALESCE(u.is_staff, false) AS opp_is_official,
              EXISTS(SELECT 1 FROM popolive.live_rooms lr WHERE lr.host_id = u.id AND lr.is_live = true) AS opp_is_live,
              (SELECT MAX(last_active_at) FROM popolive.sessions s WHERE s.user_id = u.id AND s.is_revoked = false) AS opp_last_active_at
       FROM popolive.inbox_conversations c
       INNER JOIN popolive.users u ON u.id = (CASE WHEN c.participant_one_id = $1 THEN c.participant_two_id ELSE c.participant_one_id END)
       WHERE c.id = $2 AND (c.participant_one_id = $1 OR c.participant_two_id = $1)`,
      [actor.id, conversationId]
    );

    if (convRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found or access denied.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const conv = convRows[0];
    const oppStatus = determineUserStatus({
      is_live: Boolean(conv.opp_is_live),
      is_official: Boolean(conv.opp_is_official),
      last_active_at: conv.opp_last_active_at,
    });

    const messages = await getConversationMessages(conversationId, actor.id, limit, beforeTimestamp);

    return NextResponse.json({
      success: true,
      data: {
        conversationId,
        opponent: {
          id: conv.opp_id,
          name: conv.opp_nickname,
          poppoId: String(conv.opp_poppo_id),
          avatarUrl: conv.opp_avatar_url || '/assets/chat/avatar_default.png',
          status: oppStatus.status,
          lastSeen: oppStatus.lastSeen,
          ringColorHex: oppStatus.ringColorHex,
          isOfficial: Boolean(conv.opp_is_official),
          hostLevel: Number(conv.opp_host_level) || 1,
          wealthLevel: Number(conv.opp_wealth_level) || 1,
        },
        messages,
        totalMessages: messages.length,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/messages/[conversationId]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
