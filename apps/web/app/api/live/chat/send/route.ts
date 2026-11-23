import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { sendLiveRoomChatMessage } from '@/lib/liveChatService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to send chat messages.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const roomId = body.roomId || body.room_id;
    if (!roomId) {
      return NextResponse.json(
        { success: false, error: 'Room ID is required.', code: 'INVALID_ROOM_ID' },
        { status: 400 }
      );
    }

    const text = (body.text || body.content || body.message || body.messageText || '').trim();
    const emoji = (body.emoji || '').trim();
    const fullText = emoji && text ? `${text} ${emoji}` : text || emoji;

    if (!fullText) {
      return NextResponse.json(
        { success: false, error: 'Message cannot be empty.', code: 'EMPTY_MESSAGE' },
        { status: 400 }
      );
    }

    const saved = await sendLiveRoomChatMessage({
      roomIdOrNumber: roomId,
      user,
      content: fullText,
      emoji: emoji || undefined,
      messageType: body.messageType,
    });

    return NextResponse.json(
      {
        success: true,
        message: saved,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.status && err.code) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }
    console.error('Error in POST /api/live/chat/send:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to send chat message.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
