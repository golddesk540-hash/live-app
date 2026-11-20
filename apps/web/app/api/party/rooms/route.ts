import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { assertAdult, initializePartySeats } from '@/lib/partyApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/party/rooms (and /party/rooms)
 * Query parameters: tab ('party' | 'following'), country, category, search / q, page, limit
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab') || 'party';
    const country = searchParams.get('country') || 'ALL';
    const category = searchParams.get('category');
    const search = searchParams.get('q') || searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const user = await getAuthenticatedUser(req).catch(() => null);

    const conditions: string[] = ["r.status IN ('live', 'active')"];
    const params: any[] = [];

    // Following tab filter: join on user_follows
    if (tab === 'following') {
      if (!user) {
        return NextResponse.json({
          success: true,
          rooms: [],
          total: 0,
          tab: 'following',
          page,
          limit,
          message: 'Authentication required for following feed.',
        });
      }
      params.push(user.id);
      conditions.push(
        `EXISTS (SELECT 1 FROM popolive.user_follows uf WHERE uf.follower_id::text = $${params.length} AND uf.following_id::text = r.host_user_id::text)`
      );
    }

    // Country filter
    if (country && country.toUpperCase() !== 'ALL') {
      params.push(country.toUpperCase());
      conditions.push(`(UPPER(r.country_code) = $${params.length} OR UPPER(r.country) = $${params.length})`);
    }

    // Category filter
    if (category && category !== 'all') {
      params.push(`%${category}%`);
      conditions.push(`(r.category ILIKE $${params.length} OR r.category_id ILIKE $${params.length})`);
    }

    // Search filter
    if (search && search.trim().length > 0) {
      params.push(`%${search.trim()}%`);
      conditions.push(
        `(r.title ILIKE $${params.length} OR r.host_nickname ILIKE $${params.length} OR r.room_number ILIKE $${params.length})`
      );
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count
    const countSql = `SELECT COUNT(*) as count FROM popolive.party_rooms r ${whereClause}`;
    const countRes = await query<{ count: string }>(countSql, params);
    const total = parseInt(countRes[0]?.count || '0', 10);

    // Query rooms
    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const roomsSql = `
      SELECT 
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
        r.country,
        r.country_code,
        r.flag_emoji,
        r.host_nickname,
        r.host_avatar,
        r.host_user_id,
        r.tags,
        r.display_order,
        r.created_at
      FROM popolive.party_rooms r
      ${whereClause}
      ORDER BY r.display_order ASC, r.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const roomRows = await query<any>(roomsSql, params);

    // Fetch real seat faces and audience viewer counts for each room
    const roomsWithDetails = await Promise.all(
      roomRows.map(async (room) => {
        // Seat faces from real participants
        const seatsSql = `
          SELECT seat_number, participant_avatar, participant_name
          FROM popolive.party_seats
          WHERE room_number = $1 AND status = 'occupied' AND participant_avatar IS NOT NULL
          ORDER BY seat_number ASC
          LIMIT 4
        `;
        const seatRows = await query<any>(seatsSql, [room.room_number]);
        const seatFaces = seatRows.map((s) => s.participant_avatar).filter(Boolean);

        // Active viewer count from party_audience
        const audSql = `
          SELECT COUNT(*) as count 
          FROM popolive.party_audience 
          WHERE room_number = $1 AND is_active = true
        `;
        const audRows = await query<any>(audSql, [room.room_number]);
        const viewerCount = parseInt(audRows[0]?.count || '0', 10);

        const currentMembers = Number(room.current_members) || 1;
        const maxSeats = Number(room.max_seats || room.max_members || 9);

        return {
          id: room.id,
          roomNumber: room.room_number,
          title: room.title,
          collageUrl: room.collage_url || '/assets/party/fun_party_collage@2x.png',
          currentMembers,
          maxMembers: maxSeats,
          maxSeats,
          seatCountFormatted: `${currentMembers} / ${maxSeats}`,
          isLive: Boolean(room.is_live),
          status: room.status,
          category: room.category,
          categoryId: room.category_id || 'chill_chat',
          country: room.country || 'Popular',
          countryCode: room.country_code || 'ALL',
          flagEmoji: room.flag_emoji || '🎉',
          hostNickname: room.host_nickname,
          hostAvatar: room.host_avatar || '/avatars/default.png',
          hostUserId: room.host_user_id,
          tags: room.tags || ['9 Seats', 'Voice Party'],
          seatFaces: seatFaces.length > 0 ? seatFaces : [room.host_avatar || '/avatars/default.png'],
          viewerCount: Math.max(viewerCount, currentMembers),
          displayOrder: Number(room.display_order || 0),
          createdAt: room.created_at,
        };
      })
    );

    return NextResponse.json({
      success: true,
      rooms: roomsWithDetails,
      total,
      tab,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('Error fetching party rooms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve party rooms: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/party/rooms (and /party/rooms)
 * Creates a new 9-seat party room
 * Enforces:
 * - Rule 1: Exactly 9 seats required (rejects anything else with HTTP 400 SEAT_COUNT_MUST_BE_9)
 * - Rule 2: Age 18+ to create (rejects underage with HTTP 403 AGE_VERIFICATION_FAILED)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to create a party room.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 1. Locked Rule 2: Age 18+ Check
    assertAdult(user, 'create a Party room');

    const body = await req.json().catch(() => ({}));

    // 2. Locked Rule 1: Party rooms have exactly 9 seats
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

    // Title validation
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

    const categoryId = body.categoryId || 'chill_chat';
    const categoryName = body.category || 'Chill & Chat';
    const roomType = body.roomType === 'private' ? 'private' : 'public';
    const country = body.country || 'Pakistan';
    const countryCode = body.countryCode || 'PK';
    const collageUrl = body.collageUrl || '/assets/party/fun_party_collage@2x.png';

    // Generate unique 4-digit room number (e.g. 7000-7999)
    let roomNumber = '7' + Math.floor(100 + Math.random() * 900).toString();
    const existingNum = await query(`SELECT 1 FROM popolive.party_rooms WHERE room_number = $1`, [roomNumber]);
    if (existingNum.length > 0) {
      roomNumber = '7' + Math.floor(1000 + Math.random() * 9000).toString();
    }

    // 3. Atomically create party room and initialize exactly 9 seats
    const result = await withTransaction(async (client) => {
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
          roomType === 'private',
          country,
          countryCode,
          user.nickname,
          user.avatar_url || '/avatars/default.png',
          user.id,
          ['9 Seats', 'Voice Party'],
        ]
      );

      const createdRoom = partyRes.rows[0];

      // Initialize all 9 seats (Seat 1: host, Seats 2-9: available)
      await initializePartySeats(client.query.bind(client), createdRoom.id, roomNumber, user);

      return createdRoom;
    });

    return NextResponse.json(
      {
        success: true,
        room: {
          id: result.id,
          roomNumber: result.room_number,
          title: result.title,
          category: result.category,
          categoryId: result.category_id,
          roomType: result.room_type,
          isPrivate: result.is_private,
          hostNickname: result.host_nickname,
          hostAvatar: result.host_avatar,
          hostUserId: result.host_user_id,
          maxSeats: 9,
          currentMembers: 1,
          status: result.status,
          isLive: result.is_live,
          createdAt: result.created_at,
        },
        seatsCount: 9,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating party room:', error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create party room.',
        code: error.code || 'INTERNAL_ERROR',
      },
      { status }
    );
  }
}
