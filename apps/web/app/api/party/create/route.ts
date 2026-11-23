import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query, withTransaction } from '@/lib/db';
import { CANONICAL_PARTY_CATEGORIES, RoomType } from '@/lib/party';
import { assertAdult, initializePartySeats } from '@/lib/partyApiService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const authUser = await getAuthenticatedUser(req).catch(() => null);

    const isDemo = req.nextUrl.searchParams.get('preview') === 'demo' || body.preview === 'demo';

    // 1. Host Authentication & Resolution (Never trust client-supplied host ID when authenticated)
    if (!authUser && !isDemo) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to create a party room.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (authUser) {
      assertAdult(authUser, 'create a Party room');
    }

    const hostId = authUser ? authUser.id : 'demo-host-zara';
    const hostNickname = authUser?.nickname || body.hostNickname || 'Zara Live';
    const hostAvatar = authUser?.avatar_url || body.hostAvatar || '/assets/studio/host_zara_avatar.png';

    // 2. Validate Party Title
    let title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Party title cannot be empty.', code: 'INVALID_TITLE' },
        { status: 400 }
      );
    }
    if (title.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Party title must not exceed 50 characters.', code: 'TITLE_TOO_LONG' },
        { status: 400 }
      );
    }

    // 3. Validate Supported Room Configuration (Exactly 9 seats required)
    const maxSeats = body.maxSeats !== undefined ? Number(body.maxSeats) : 9;
    if (maxSeats !== 9) {
      return NextResponse.json(
        {
          success: false,
          error: `SEAT_COUNT_MUST_BE_9: Party rooms must have exactly 9 seats. Specified: ${maxSeats}.`,
          code: 'SEAT_COUNT_MUST_BE_9',
        },
        { status: 400 }
      );
    }

    // 4. Validate Category
    const categoryId = body.categoryId || 'chill_chat';
    const matchedCategory = CANONICAL_PARTY_CATEGORIES.find((c) => c.id === categoryId);
    const categoryName = matchedCategory ? matchedCategory.name : (body.category || 'Chill & Chat');

    // 5. Validate Room Type
    const roomType: RoomType = body.roomType === 'private' ? 'private' : 'public';
    const isPrivate = roomType === 'private';
    const country = body.country || 'Pakistan';
    const countryCode = body.countryCode || 'PK';
    const collageUrl = body.collageUrl || '/assets/party/fun_party_collage@2x.png';

    // 6. Generate Unique Room Number (7000-7999 or 70000+)
    let roomNumber = '7' + Math.floor(100 + Math.random() * 900).toString();
    const existCheck = await query(
      `SELECT 1 FROM popolive.party_rooms WHERE room_number = $1`,
      [roomNumber]
    );
    if (existCheck.length > 0) {
      roomNumber = '7' + Math.floor(1000 + Math.random() * 9000).toString();
    }

    // 7. Atomic Room Creation & Nine-Seat Initialization in ONE PostgreSQL Transaction
    const createdRoom = await withTransaction(async (client) => {
      const partyRes = await client.query(
        `INSERT INTO popolive.party_rooms (
          id, room_number, title, collage_url, current_members, max_members, max_seats,
          is_live, status, category, category_id, room_type, is_private,
          country, country_code, flag_emoji, host_nickname, host_avatar, host_user_id,
          tags, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, 1, 9, 9,
          true, 'live', $4, $5, $6, $7,
          $8, $9, '🎉', $10, $11, $12,
          $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING *`,
        [
          roomNumber,
          title,
          collageUrl,
          categoryName,
          categoryId,
          roomType,
          isPrivate,
          country,
          countryCode,
          hostNickname,
          hostAvatar,
          hostId,
          ['9 Seats', 'Voice Party'],
        ]
      );

      const roomRow = partyRes.rows[0];

      // Initialize all 9 seats atomically (Seat 1: host, Seats 2-9: available)
      await initializePartySeats(client.query.bind(client), roomRow.id, roomNumber, {
        id: hostId,
        nickname: hostNickname,
        avatar_url: hostAvatar,
      } as any);

      return roomRow;
    });

    const roomPayload = {
      id: createdRoom.id,
      roomNumber: createdRoom.room_number,
      title: createdRoom.title,
      category: createdRoom.category,
      categoryId: createdRoom.category_id,
      roomType: createdRoom.room_type,
      isPrivate: createdRoom.is_private,
      hostNickname: createdRoom.host_nickname,
      hostAvatar: createdRoom.host_avatar,
      hostUserId: createdRoom.host_user_id,
      maxSeats: 9,
      currentMembers: 1,
      status: createdRoom.status,
      isLive: createdRoom.is_live,
      createdAt: createdRoom.created_at,
      seatGridUrl: `/party/room/${roomNumber}?preview=demo`,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Party room created successfully!',
        party: roomPayload,
        room: roomPayload,
        seatsCount: 9,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API /party/create error:', error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error while creating party',
        code: error.code || 'INTERNAL_ERROR',
      },
      { status }
    );
  }
}
