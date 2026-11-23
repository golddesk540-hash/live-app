import { NextRequest, NextResponse } from 'next/server';
import { getLiveRoomChatHistory } from '@/lib/liveChatService';
import { USE_LIVE_API } from '@/lib/clientFlags';

export const dynamic = 'force-dynamic';

// Reference messages for offline fixture / demo mode
const DEMO_REFERENCE_MESSAGES = [
  {
    id: 'demo-msg-1',
    roomId: '880219',
    senderId: 'demo-user-sana',
    senderNickname: 'Sana',
    senderAvatarUrl: '/assets/chat/avatar_sana.png',
    senderRole: 'viewer',
    messageText: 'So beautiful',
    content: 'So beautiful 💕',
    emoji: '💕',
    fullText: 'So beautiful 💕',
    createdAt: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: 'demo-msg-2',
    roomId: '880219',
    senderId: 'demo-user-rizwan',
    senderNickname: 'Rizwan',
    senderAvatarUrl: '/assets/chat/avatar_rizwan.png',
    senderRole: 'viewer',
    messageText: 'Nice live',
    content: 'Nice live 😊',
    emoji: '😊',
    fullText: 'Nice live 😊',
    createdAt: new Date(Date.now() - 95000).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId') || searchParams.get('room_id') || '';
    const after = searchParams.get('after') || undefined;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100);
    const preview = searchParams.get('preview');

    if (!USE_LIVE_API && (preview === 'demo' || roomId === 'demo' || roomId === '880219' || !roomId)) {
      return NextResponse.json({
        success: true,
        roomId: roomId || '880219',
        isDemo: true,
        messages: DEMO_REFERENCE_MESSAGES,
        totalCount: DEMO_REFERENCE_MESSAGES.length,
        timestamp: new Date().toISOString(),
      });
    }

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: 'Room ID is required.', code: 'INVALID_ROOM_ID' },
        { status: 400 }
      );
    }

    const history = await getLiveRoomChatHistory({
      roomIdOrNumber: roomId,
      after,
      limit,
    });

    return NextResponse.json({
      success: true,
      roomId: history.roomId,
      roomNumber: history.roomNumber,
      isDemo: false,
      messages: history.messages,
      totalCount: history.totalCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    if (err.status && err.code) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }
    console.error('Error in GET /api/live/chat/messages:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve live chat messages.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
