import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { assertAdultMessage } from '@/lib/messageApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/message/search?q= (and /message/search?q=)
 * Searches matching people and conversation threads for message inbox
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

    assertAdultMessage(user, 'search messages');

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q) {
      return NextResponse.json({
        success: true,
        people: [],
        conversations: [],
        total: 0,
      });
    }

    const searchPattern = `%${q}%`;

    // 1. Search matching users (excluding self)
    const peopleRows = await query<any>(
      `SELECT id, poppo_id, nickname, avatar_url, status, wealth_level, is_face_verified
       FROM popolive.users
       WHERE id::text != $1
         AND (nickname ILIKE $2 OR poppo_id ILIKE $2)
       LIMIT 10`,
      [user.id, searchPattern]
    );

    const people = peopleRows.map((p) => ({
      id: p.id,
      userId: p.id,
      poppoId: p.poppo_id,
      nickname: p.nickname,
      avatarUrl: p.avatar_url || '/avatars/default.png',
      status: p.status || 'active',
      isVerified: Boolean(p.is_face_verified),
    }));

    // 2. Search matching conversations
    const convRows = await query<any>(
      `SELECT 
        c.id as conversation_id,
        c.last_message_text,
        c.last_message_at,
        u.id as peer_id,
        u.nickname as peer_nickname,
        u.avatar_url as peer_avatar
       FROM popolive.inbox_conversations c
       JOIN popolive.users u ON u.id = (
         CASE 
           WHEN c.participant_one_id::text = $1 THEN c.participant_two_id 
           ELSE c.participant_one_id 
         END
       )
       WHERE (c.participant_one_id::text = $1 OR c.participant_two_id::text = $1)
         AND (u.nickname ILIKE $2 OR c.last_message_text ILIKE $2)
       LIMIT 10`,
      [user.id, searchPattern]
    );

    const conversations = convRows.map((c) => ({
      id: c.conversation_id,
      threadId: c.conversation_id,
      peerId: c.peer_id,
      peerNickname: c.peer_nickname,
      peerAvatar: c.peer_avatar || '/avatars/default.png',
      lastMessage: c.last_message_text,
      lastMessageTime: c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    }));

    return NextResponse.json({
      success: true,
      query: q,
      people,
      conversations,
      total: people.length + conversations.length,
    });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json(
      { success: false, error: error.message, code: error.code || 'INTERNAL_ERROR' },
      { status }
    );
  }
}
