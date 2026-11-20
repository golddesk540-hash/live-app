import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { resolvePartyRoom } from '@/lib/partyApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/party/rooms/:id/chat
 * Reads recent chat messages for a party room
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const room = await resolvePartyRoom(params.roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Party room not found.', code: 'ROOM_NOT_FOUND' },
        { status: 404 }
      );
    }

    const rows = await query<any>(
      `SELECT 
        id,
        room_number,
        sender_id,
        sender_name,
        sender_avatar,
        sender_role,
        seat_number,
        message_text,
        emoji,
        created_at
       FROM popolive.party_messages
       WHERE room_number = $1 AND is_deleted = false
       ORDER BY created_at ASC
       LIMIT 50`,
      [room.room_number]
    );

    const messages = rows.map((m) => ({
      id: m.id,
      roomNumber: m.room_number,
      senderId: m.sender_id,
      senderName: m.sender_name,
      senderAvatar: m.sender_avatar || '/avatars/default.png',
      senderRole: m.sender_role,
      seatNumber: m.seat_number,
      messageText: m.message_text,
      content: m.message_text,
      emoji: m.emoji,
      createdAt: m.created_at,
    }));

    return NextResponse.json({
      success: true,
      messages,
      total: messages.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/party/rooms/:id/chat
 * Sends a chat message into the party room
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to post message.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const room = await resolvePartyRoom(params.roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Party room not found.', code: 'ROOM_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const text = typeof body.message === 'string' ? body.message.trim() : typeof body.messageText === 'string' ? body.messageText.trim() : '';

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Message cannot be empty.', code: 'EMPTY_MESSAGE' },
        { status: 400 }
      );
    }

    // Determine sender role & seat number if any
    const isHost =
      (room.host_user_id && room.host_user_id.toString() === user.id.toString()) ||
      room.host_nickname === user.nickname;

    const seatedRes = await query<any>(
      `SELECT seat_number FROM popolive.party_seats WHERE room_number = $1 AND participant_id = $2 AND status = 'occupied'`,
      [room.room_number, user.id]
    );

    let senderRole = 'audience';
    let seatNumber = null;

    if (isHost) {
      senderRole = 'host';
      seatNumber = 1;
    } else if (seatedRes.length > 0) {
      senderRole = 'participant';
      seatNumber = seatedRes[0].seat_number;
    }

    const insertRes = await query<any>(
      `INSERT INTO popolive.party_messages (
        id, room_number, sender_id, sender_name, sender_avatar, sender_role, seat_number, message_text, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        room.room_number,
        user.id,
        user.nickname,
        user.avatar_url || '/avatars/default.png',
        senderRole,
        seatNumber,
        text,
      ]
    );

    const msg = insertRes[0];

    return NextResponse.json({
      success: true,
      message: {
        id: msg.id,
        roomNumber: msg.room_number,
        senderId: msg.sender_id,
        senderName: msg.sender_name,
        senderAvatar: msg.sender_avatar,
        senderRole: msg.sender_role,
        seatNumber: msg.seat_number,
        messageText: msg.message_text,
        content: msg.message_text,
        createdAt: msg.created_at,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
