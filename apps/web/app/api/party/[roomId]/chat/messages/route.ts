import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PartyMessage } from '@/lib/party';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const { searchParams } = new URL(req.url);

    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const before = searchParams.get('before');

    let rows: any[] = [];
    if (before) {
      rows = await query(
        `SELECT id, room_number, sender_id, sender_name, sender_avatar, sender_role, 
                seat_number, message_text, emoji, created_at
         FROM popolive.party_messages
         WHERE room_number = $1 AND is_deleted = false AND created_at < $2
         ORDER BY created_at ASC
         LIMIT $3`,
        [roomId, before, limit]
      );
    } else {
      rows = await query(
        `SELECT id, room_number, sender_id, sender_name, sender_avatar, sender_role, 
                seat_number, message_text, emoji, created_at
         FROM popolive.party_messages
         WHERE room_number = $1 AND is_deleted = false
         ORDER BY created_at ASC
         LIMIT $2`,
        [roomId, limit]
      );
    }

    const messages: PartyMessage[] = (rows || []).map((r) => ({
      id: r.id,
      roomNumber: r.room_number,
      senderId: r.sender_id,
      senderName: r.sender_name,
      senderAvatar: r.sender_avatar || '/assets/party/chat_avatar_ali_khan.png',
      senderRole: r.sender_role || 'audience',
      seatNumber: r.seat_number ? Number(r.seat_number) : null,
      messageText: r.message_text,
      emoji: r.emoji,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      roomNumber: roomId,
      count: messages.length,
      messages,
    });
  } catch (error: any) {
    console.error('API /party/[roomId]/chat/messages error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve party chat messages' },
      { status: 500 }
    );
  }
}
