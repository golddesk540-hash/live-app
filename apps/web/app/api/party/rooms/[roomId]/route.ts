import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/party/rooms/:id (and /party/rooms/:id)
 * Fetches party room details by UUID or string room_number
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;

    const rows = await query<any>(
      `SELECT 
        r.id,
        r.room_number,
        r.title,
        r.collage_url,
        r.current_members,
        r.max_members,
        r.max_seats,
        r.is_live,
        r.status,
        r.category,
        r.category_id,
        r.room_type,
        r.is_private,
        r.country,
        r.country_code,
        r.flag_emoji,
        r.host_nickname,
        r.host_avatar,
        r.host_user_id,
        r.tags,
        r.created_at
       FROM popolive.party_rooms r
       WHERE r.id::text = $1 OR r.room_number = $1
       LIMIT 1`,
      [roomId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Party room not found.', code: 'ROOM_NOT_FOUND' },
        { status: 404 }
      );
    }

    const room = rows[0];

    // Query seat count & occupied members
    const seatsRes = await query<any>(
      `SELECT COUNT(*) as occupied_count 
       FROM popolive.party_seats 
       WHERE room_number = $1 AND status = 'occupied'`,
      [room.room_number]
    );
    const occupiedCount = parseInt(seatsRes[0]?.occupied_count || '1', 10);

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        roomNumber: room.room_number,
        title: room.title,
        collageUrl: room.collage_url,
        currentMembers: occupiedCount,
        maxMembers: Number(room.max_members || 9),
        maxSeats: Number(room.max_seats || 9),
        seatCountFormatted: `${occupiedCount} / ${room.max_seats || 9}`,
        isLive: Boolean(room.is_live),
        status: room.status,
        category: room.category,
        categoryId: room.category_id,
        roomType: room.room_type,
        isPrivate: room.is_private,
        country: room.country,
        countryCode: room.country_code,
        flagEmoji: room.flag_emoji,
        hostNickname: room.host_nickname,
        hostAvatar: room.host_avatar,
        hostUserId: room.host_user_id,
        tags: room.tags || [],
        createdAt: room.created_at,
      },
    });
  } catch (error: any) {
    console.error('Error fetching party room details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve party room details: ' + error.message },
      { status: 500 }
    );
  }
}
