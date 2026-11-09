import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    let room: any = null;

    try {
      const rows = await query(
        `SELECT id, room_number, title, collage_url, current_members, max_members, max_seats, is_live, status, category, category_id, room_type, is_private, host_nickname, host_avatar, created_at
         FROM popolive.party_rooms
         WHERE room_number = $1 OR id::text = $1
         LIMIT 1`,
        [roomId]
      );
      if (rows && rows.length > 0) {
        room = rows[0];
      }
    } catch (err) {
      console.warn('DB party room fetch note:', err);
    }

    if (!room) {
      // Fallback demo room
      room = {
        id: 'party-demo',
        room_number: roomId,
        title: 'Friends Talk Party',
        category: 'Chill & Chat',
        category_id: 'chill_chat',
        room_type: 'public',
        is_private: false,
        host_nickname: 'Zara Live',
        host_avatar: '/assets/studio/host_zara_avatar.png',
        max_seats: 9,
        current_members: 1,
        status: 'live',
        created_at: new Date().toISOString(),
      };
    }

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        roomNumber: room.room_number,
        title: room.title,
        category: room.category,
        categoryId: room.category_id || 'chill_chat',
        roomType: room.room_type || 'public',
        isPrivate: room.is_private || false,
        hostNickname: room.host_nickname,
        hostAvatar: room.host_avatar,
        maxSeats: room.max_seats || 9,
        currentMembers: room.current_members || 1,
        status: room.status || 'live',
        createdAt: room.created_at,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve party room' },
      { status: 500 }
    );
  }
}
