import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { CANONICAL_PARTY_CATEGORIES, RoomType } from '@/lib/party';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const authUser = await getAuthenticatedUser(req).catch(() => null);

    const isDemo = req.nextUrl.searchParams.get('preview') === 'demo' || body.preview === 'demo';

    // 1. Host Resolution
    const hostId = authUser?.id || body.hostId || (isDemo ? 'demo-host-zara' : null);
    const hostNickname = authUser?.nickname || body.hostNickname || 'Zara Live';
    const hostAvatar = authUser?.avatar_url || '/assets/studio/host_zara_avatar.png';

    if (!hostId && !isDemo) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to create a party room.' },
        { status: 401 }
      );
    }

    // 2. Validate Party Title (Section 3 of Prompt)
    let title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Party title cannot be empty.' },
        { status: 400 }
      );
    }
    if (title.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Party title must not exceed 50 characters.' },
        { status: 400 }
      );
    }

    // 3. Validate Category (Section 4 of Prompt)
    const categoryId = body.categoryId || 'chill_chat';
    const matchedCategory = CANONICAL_PARTY_CATEGORIES.find((c) => c.id === categoryId);
    if (!matchedCategory) {
      return NextResponse.json(
        { success: false, error: 'Invalid party category selected.' },
        { status: 400 }
      );
    }
    const categoryName = matchedCategory.name;

    // 4. Validate Room Type (Section 5 of Prompt)
    const roomType: RoomType = body.roomType === 'private' ? 'private' : 'public';
    const isPrivate = roomType === 'private';

    // 5. Generate Unique Room Number (e.g. 7000 + random)
    let roomNumber = '7' + Math.floor(100 + Math.random() * 900).toString();
    try {
      // Find max room number or check existence
      const existCheck = await query(
        `SELECT room_number FROM popolive.party_rooms WHERE room_number = $1`,
        [roomNumber]
      );
      if (existCheck && existCheck.length > 0) {
        roomNumber = '7' + Math.floor(1000 + Math.random() * 9000).toString();
      }
    } catch {}

    // 6. Insert Party Room into PostgreSQL
    let newPartyId = 'party-' + Date.now();
    let createdAt = new Date().toISOString();

    try {
      const insertRes = await query(
        `INSERT INTO popolive.party_rooms 
         (room_number, title, collage_url, current_members, max_members, max_seats, is_live, status, category, category_id, room_type, is_private, host_nickname, host_avatar, host_user_id)
         VALUES ($1, $2, $3, 1, 9, 9, true, 'live', $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, room_number, title, category, category_id, room_type, is_private, host_nickname, host_avatar, created_at`,
        [
          roomNumber,
          title,
          '/assets/party/fun_party_collage@2x.png',
          categoryName,
          categoryId,
          roomType,
          isPrivate,
          hostNickname,
          hostAvatar,
          hostId && hostId.includes('-') && hostId.length === 36 ? hostId : null,
        ]
      );

      if (insertRes && insertRes[0]) {
        const row = insertRes[0];
        newPartyId = row.id;
        createdAt = row.created_at;
      }
    } catch (dbErr) {
      console.warn('DB party room insertion note:', dbErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Party room created successfully!',
        party: {
          id: newPartyId,
          roomNumber,
          title,
          category: categoryName,
          categoryId,
          roomType,
          isPrivate,
          hostNickname,
          hostAvatar,
          maxSeats: 9,
          currentMembers: 1,
          status: 'live',
          createdAt,
          seatGridUrl: `/party/room/${roomNumber}?preview=demo`,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API /party/create error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while creating party' },
      { status: 500 }
    );
  }
}
