import { NextRequest, NextResponse } from 'next/server';
import {
  resolveMessagingActor,
  getInboxConversations,
  getOrCreateConversation,
  seedInitialConversationsIfEmpty,
  getInboxSummary,
} from '@/lib/messaging';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please log in to access your inbox.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Seed realistic conversations on first open if empty
    await seedInitialConversationsIfEmpty(actor.id);

    const conversations = await getInboxConversations(actor.id);
    const summary = await getInboxSummary(actor.id);

    return NextResponse.json({
      success: true,
      data: {
        conversations,
        totalConversations: conversations.length,
        summary,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/inbox/conversations:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const recipientUserId = body.recipientUserId || body.recipientId;

    if (!recipientUserId) {
      return NextResponse.json(
        { success: false, error: 'Recipient user ID is required.', code: 'INVALID_RECIPIENT' },
        { status: 400 }
      );
    }

    if (recipientUserId === actor.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot start a conversation with yourself.', code: 'CANNOT_MESSAGE_SELF' },
        { status: 400 }
      );
    }

    // Verify recipient exists
    const recipientRows = await query(
      `SELECT id, nickname, poppo_id, avatar_url, host_level, wealth_level FROM popolive.users WHERE id = $1`,
      [recipientUserId]
    );

    if (recipientRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Recipient user not found.', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const convId = await getOrCreateConversation(actor.id, recipientUserId);
    const opp = recipientRows[0];

    return NextResponse.json({
      success: true,
      data: {
        conversationId: convId,
        recipient: {
          id: opp.id,
          name: opp.nickname,
          poppoId: String(opp.poppo_id),
          avatarUrl: opp.avatar_url,
          hostLevel: Number(opp.host_level) || 1,
          wealthLevel: Number(opp.wealth_level) || 1,
        },
      },
    });
  } catch (err: any) {
    console.error('Error in POST /api/inbox/conversations:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
