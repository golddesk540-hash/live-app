import { NextRequest, NextResponse } from 'next/server';
import { resolveMessagingActor, sendDirectMessage } from '@/lib/messaging';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please log in to send messages.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const recipientId = body.recipientId || body.recipientUserId;
    const text = body.text || body.messageText;
    const conversationId = body.conversationId;
    const idempotencyKey = body.idempotencyKey || req.headers.get('idempotency-key');

    if (!recipientId) {
      return NextResponse.json(
        { success: false, error: 'Recipient ID is required.', code: 'MISSING_RECIPIENT' },
        { status: 400 }
      );
    }

    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message text cannot be empty.', code: 'EMPTY_MESSAGE' },
        { status: 400 }
      );
    }

    if (recipientId === actor.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot send messages to yourself.', code: 'CANNOT_MESSAGE_SELF' },
        { status: 400 }
      );
    }

    const result = await sendDirectMessage({
      senderId: actor.id,
      recipientId,
      text: text.trim(),
      conversationId,
      idempotencyKey: idempotencyKey ? String(idempotencyKey) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('Error in POST /api/messages/send:', err);

    const msg = err.message || '';
    if (msg === 'USER_BLOCKED_BY_RECIPIENT') {
      return NextResponse.json(
        { success: false, error: 'You cannot send messages to this user because you have been blocked.', code: 'USER_BLOCKED_BY_RECIPIENT' },
        { status: 403 }
      );
    }
    if (msg === 'USER_BLOCKED') {
      return NextResponse.json(
        { success: false, error: 'You have blocked this user. Unblock them first to send messages.', code: 'USER_BLOCKED' },
        { status: 403 }
      );
    }
    if (msg === 'MESSAGE_PERMISSION_DENIED') {
      return NextResponse.json(
        { success: false, error: 'This user has disabled private direct messages.', code: 'MESSAGE_PERMISSION_DENIED' },
        { status: 403 }
      );
    }
    if (msg === 'MESSAGE_FOLLOWERS_ONLY') {
      return NextResponse.json(
        { success: false, error: 'This user only accepts messages from their followers.', code: 'MESSAGE_FOLLOWERS_ONLY' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: msg || 'Failed to send message', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
