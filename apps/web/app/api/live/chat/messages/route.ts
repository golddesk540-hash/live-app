import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Authentic reference messages matching 04_05_live_chat.png
const DEMO_REFERENCE_MESSAGES = [
  {
    id: 'demo-msg-1',
    roomId: '880219',
    senderId: 'demo-user-sana',
    senderNickname: 'Sana',
    senderAvatarUrl: '/assets/chat/avatar_sana.png',
    senderRole: 'viewer',
    messageText: 'So beautiful',
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
    emoji: '😊',
    fullText: 'Nice live 😊',
    createdAt: new Date(Date.now() - 95000).toISOString(),
  },
  {
    id: 'demo-msg-3',
    roomId: '880219',
    senderId: 'demo-user-mehak',
    senderNickname: 'Mehak',
    senderAvatarUrl: '/assets/chat/avatar_mehak.png',
    senderRole: 'viewer',
    messageText: 'Love your vibe',
    emoji: '❤️',
    fullText: 'Love your vibe ❤️',
    createdAt: new Date(Date.now() - 70000).toISOString(),
  },
  {
    id: 'demo-msg-4',
    roomId: '880219',
    senderId: 'demo-user-khang',
    senderNickname: 'Khan G',
    senderAvatarUrl: '/assets/chat/avatar_khang.png',
    senderRole: 'viewer',
    messageText: 'Great show',
    emoji: '👏',
    fullText: 'Great show 👏',
    createdAt: new Date(Date.now() - 45000).toISOString(),
  },
  {
    id: 'demo-msg-5',
    roomId: '880219',
    senderId: 'demo-user-ayesha',
    senderNickname: 'Ayesha',
    senderAvatarUrl: '/assets/chat/avatar_ayesha.png',
    senderRole: 'viewer',
    messageText: 'Where are you from?',
    emoji: '',
    fullText: 'Where are you from?',
    createdAt: new Date(Date.now() - 25000).toISOString(),
  },
  {
    id: 'demo-msg-6',
    roomId: '880219',
    senderId: 'demo-user-bilal',
    senderNickname: 'Bilal',
    senderAvatarUrl: '/assets/chat/avatar_bilal.png',
    senderRole: 'viewer',
    messageText: 'Amazing',
    emoji: '❤️',
    fullText: 'Amazing ❤️',
    createdAt: new Date(Date.now() - 10000).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId') || searchParams.get('room_id') || '880219';
    const preview = searchParams.get('preview');
    const after = searchParams.get('after'); // optional ISO timestamp
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100);

    const isDemo = preview === 'demo' || roomId === 'demo' || roomId === '880219';

    // Try fetching database messages for this roomId
    let dbMessages: any[] = [];
    try {
      let queryStr = `
        SELECT id, room_id, sender_id, sender_nickname, sender_avatar_url, sender_role, 
               message_text, emoji, is_pinned, is_deleted, created_at
        FROM popolive.live_room_messages
        WHERE room_id = $1 AND is_deleted = false
      `;
      const params: any[] = [roomId];

      if (after) {
        queryStr += ` AND created_at > $2`;
        params.push(after);
      }

      queryStr += ` ORDER BY created_at ASC LIMIT $${params.length + 1}`;
      params.push(limit);

      const rows = await query(queryStr, params);
      dbMessages = (rows || []).map((row: any) => ({
        id: row.id,
        roomId: row.room_id,
        senderId: row.sender_id,
        senderNickname: row.sender_nickname,
        senderAvatarUrl: row.sender_avatar_url || '/assets/studio/host_zara_avatar.png',
        senderRole: row.sender_role || 'viewer',
        messageText: row.message_text,
        emoji: row.emoji || '',
        fullText: row.emoji ? `${row.message_text} ${row.emoji}` : row.message_text,
        isPinned: !!row.is_pinned,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      }));
    } catch (dbErr) {
      console.warn('DB chat fetch failed, falling back to in-memory/demo store:', dbErr);
    }

    let combinedMessages = [];
    if (isDemo) {
      if (after) {
        // Only return demo messages created after requested timestamp
        const filteredDemo = DEMO_REFERENCE_MESSAGES.filter(
          m => new Date(m.createdAt) > new Date(after)
        );
        combinedMessages = [...filteredDemo, ...dbMessages];
      } else {
        // Return 6 reference messages first, then any new DB messages
        combinedMessages = [...DEMO_REFERENCE_MESSAGES, ...dbMessages];
      }
    } else {
      combinedMessages = dbMessages;
    }

    return NextResponse.json({
      success: true,
      roomId,
      isDemo,
      messages: combinedMessages,
      totalCount: combinedMessages.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}
