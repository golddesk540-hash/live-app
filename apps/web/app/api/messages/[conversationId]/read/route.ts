import { NextRequest, NextResponse } from 'next/server';
import { resolveMessagingActor, markConversationRead } from '@/lib/messaging';

export const dynamic = 'force-dynamic';

export async function POST(
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
    const updated = await markConversationRead(conversationId, actor.id);

    return NextResponse.json({
      success: true,
      data: {
        conversationId,
        markedRead: updated,
      },
    });
  } catch (err: any) {
    console.error('Error in POST /api/messages/[conversationId]/read:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
