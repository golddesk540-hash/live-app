import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/live/rooms/[roomId]/chat
 * Read recent chat messages for a live broadcast room.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
    const roomRows = await query<any>(
      `SELECT id FROM popolive.live_rooms WHERE ${isUuid ? 'id = $1' : 'room_number = $1'} LIMIT 1`,
      [roomId]
    );

    const targetRoomId = roomRows.length > 0 ? roomRows[0].id : roomId;

    const messages = await query<any>(
      `SELECT id, room_id, sender_id, sender_nickname, sender_avatar_url, sender_role,
              message_text, emoji, is_pinned, created_at
       FROM popolive.live_room_messages
       WHERE room_id = $1 AND is_deleted = false
       ORDER BY created_at ASC
       LIMIT 50`,
      [targetRoomId]
    );

    return NextResponse.json({
      success: true,
      roomId: targetRoomId,
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.sender_id,
        senderNickname: m.sender_nickname || 'Viewer',
        senderAvatar: m.sender_avatar_url || '/avatars/default.png',
        senderRole: m.sender_role || 'viewer',
        content: m.message_text || m.emoji || '',
        emoji: m.emoji,
        isPinned: Boolean(m.is_pinned),
        createdAt: m.created_at,
      })),
    });
  } catch (err: any) {
    console.error(`GET /api/live/rooms/${params.roomId}/chat error:`, err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve live chat messages.' }, { status: 500 });
  }
}

/**
 * POST /api/live/rooms/[roomId]/chat
 * Send a message in the live room chat.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required to chat.', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const roomId = params.roomId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
    const roomRows = await query<any>(
      `SELECT id, host_id, status FROM popolive.live_rooms WHERE ${isUuid ? 'id = $1' : 'room_number = $1'} LIMIT 1`,
      [roomId]
    );

    if (roomRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Live room not found.', code: 'ROOM_NOT_FOUND' }, { status: 404 });
    }

    const room = roomRows[0];
    const body = await req.json().catch(() => ({}));
    const messageText = (body.message || body.content || body.text || '').trim();
    const emoji = (body.emoji || '').trim();

    if (!messageText && !emoji) {
      return NextResponse.json({ success: false, error: 'Message cannot be empty.' }, { status: 400 });
    }

    const senderRole = room.host_id === user.id ? 'host' : user.is_staff ? 'staff' : 'viewer';

    const insertRes = await query<any>(
      `INSERT INTO popolive.live_room_messages (
        id, room_id, sender_id, sender_nickname, sender_avatar_url, sender_role,
        message_text, emoji, is_pinned, is_deleted, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, false, false, CURRENT_TIMESTAMP
      )
      RETURNING id, room_id, sender_id, sender_nickname, sender_avatar_url, sender_role, message_text, emoji, created_at`,
      [
        room.id,
        user.id,
        user.nickname,
        user.avatar_url || '/avatars/default.png',
        senderRole,
        messageText || null,
        emoji || null,
      ]
    );

    const m = insertRes[0];

    return NextResponse.json({
      success: true,
      message: {
        id: m.id,
        roomId: m.room_id,
        senderId: m.sender_id,
        senderNickname: m.sender_nickname,
        senderAvatar: m.sender_avatar_url,
        senderRole: m.sender_role,
        content: m.message_text || m.emoji,
        emoji: m.emoji,
        createdAt: m.created_at,
      },
    }, { status: 201 });
  } catch (err: any) {
    console.error(`POST /api/live/rooms/${params.roomId}/chat error:`, err);
    return NextResponse.json({ success: false, error: 'Failed to send chat message.' }, { status: 500 });
  }
}
