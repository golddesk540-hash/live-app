import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import {
  sendLiveRoomChatMessage,
  getLiveRoomChatHistory,
} from '@/lib/liveChatService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/live/rooms/[roomId]/chat
 * Retrieve real chat messages from popolive.live_room_chat_messages for a live broadcast room.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    if (!roomId) {
      return NextResponse.json(
        { success: false, error: 'Room ID is required.', code: 'INVALID_ROOM_ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const after = searchParams.get('after') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await getLiveRoomChatHistory({
      roomIdOrNumber: roomId,
      after,
      limit,
    });

    return NextResponse.json({
      success: true,
      roomId: result.roomId,
      roomNumber: result.roomNumber,
      messages: result.messages,
      totalCount: result.totalCount,
    });
  } catch (err: any) {
    if (err.status && err.code) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }
    console.error(`GET /api/live/rooms/${params.roomId}/chat error:`, err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve live chat messages.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/live/rooms/[roomId]/chat
 * Send a message into the live room chat.
 * Enforces session authentication; persists to PostgreSQL.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    if (!roomId) {
      return NextResponse.json(
        { success: false, error: 'Room ID is required.', code: 'INVALID_ROOM_ID' },
        { status: 400 }
      );
    }

    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to chat.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const content = (body.content || body.message || body.text || '').trim();
    const emoji = (body.emoji || '').trim();
    const fullContent = emoji && content ? `${content} ${emoji}` : content || emoji;

    if (!fullContent) {
      return NextResponse.json(
        { success: false, error: 'Message cannot be empty.', code: 'EMPTY_MESSAGE' },
        { status: 400 }
      );
    }

    const savedMessage = await sendLiveRoomChatMessage({
      roomIdOrNumber: roomId,
      user,
      content: fullContent,
      emoji: emoji || undefined,
      messageType: body.messageType,
    });

    return NextResponse.json(
      {
        success: true,
        message: savedMessage,
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
    console.error(`POST /api/live/rooms/${params.roomId}/chat error:`, err);
    return NextResponse.json(
      { success: false, error: 'Failed to send chat message.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
