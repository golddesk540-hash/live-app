import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export interface PartyRoomDto {
  id: string;
  roomNumber: string;
  title: string;
  collageUrl: string;
  currentMembers: number;
  maxMembers: number;
  seatCountFormatted: string;
  isLive: boolean;
  status: string;
  category: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  hostNickname: string;
  hostAvatar?: string;
  tags?: string[];
  displayOrder?: number;
}

const FALLBACK_PARTY_ROOMS: PartyRoomDto[] = [
  {
    id: 'party-room-1',
    roomNumber: '7001',
    title: '🎉 Fun Party Room',
    collageUrl: '/assets/party/fun_party_collage@2x.png',
    currentMembers: 9,
    maxMembers: 9,
    seatCountFormatted: '9 / 9',
    isLive: true,
    status: 'live',
    category: 'Fun',
    country: 'Popular',
    countryCode: 'ALL',
    flagEmoji: '🎉',
    hostNickname: 'Sophia_Star',
    hostAvatar: '/assets/party/fun_party_collage.png',
    tags: ['9 Seats', 'Fun Party', 'Top Voice'],
    displayOrder: 1,
  },
  {
    id: 'party-room-2',
    roomNumber: '7002',
    title: 'Music Party',
    collageUrl: '/assets/party/music_party_collage@2x.png',
    currentMembers: 6,
    maxMembers: 9,
    seatCountFormatted: '6 / 9',
    isLive: true,
    status: 'live',
    category: 'Music',
    country: 'Popular',
    countryCode: 'ALL',
    flagEmoji: '🎵',
    hostNickname: 'DJ_Alex',
    hostAvatar: '/assets/party/music_party_collage.png',
    tags: ['9 Seats', 'Live Music', 'Jam Session'],
    displayOrder: 2,
  },
  {
    id: 'party-room-3',
    roomNumber: '7003',
    title: 'Friends Chat',
    collageUrl: '/assets/party/friends_chat_collage@2x.png',
    currentMembers: 4,
    maxMembers: 9,
    seatCountFormatted: '4 / 9',
    isLive: true,
    status: 'live',
    category: 'Chat',
    country: 'Popular',
    countryCode: 'ALL',
    flagEmoji: '💬',
    hostNickname: 'Emma_Friend',
    hostAvatar: '/assets/party/friends_chat_collage.png',
    tags: ['9 Seats', 'Chill', 'Chit Chat'],
    displayOrder: 3,
  },
  {
    id: 'party-room-4',
    roomNumber: '7004',
    title: 'Global Party',
    collageUrl: '/assets/party/global_party_collage@2x.png',
    currentMembers: 9,
    maxMembers: 9,
    seatCountFormatted: '9 / 9',
    isLive: true,
    status: 'live',
    category: 'Global',
    country: 'Global',
    countryCode: 'ALL',
    flagEmoji: '🌍',
    hostNickname: 'Marco_World',
    hostAvatar: '/assets/party/global_party_collage.png',
    tags: ['9 Seats', 'International', 'Multi-Language'],
    displayOrder: 4,
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countryCode = searchParams.get('country')?.trim().toUpperCase();
    const search = searchParams.get('q')?.trim();
    const category = searchParams.get('category')?.trim().toLowerCase();

    let whereConditions = ['is_live = true'];
    let params: any[] = [];

    if (countryCode && countryCode !== 'ALL') {
      params.push(countryCode);
      whereConditions.push(`country_code = $${params.length}`);
    }

    if (category) {
      params.push(`%${category}%`);
      whereConditions.push(`LOWER(category) LIKE $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      whereConditions.push(`(title ILIKE $${params.length} OR host_nickname ILIKE $${params.length} OR room_number ILIKE $${params.length})`);
    }

    const whereClause = whereConditions.join(' AND ');
    const sql = `
      SELECT 
        id,
        room_number,
        title,
        collage_url,
        current_members,
        max_members,
        is_live,
        status,
        category,
        country,
        country_code,
        flag_emoji,
        host_nickname,
        host_avatar,
        tags,
        display_order
      FROM popolive.party_rooms
      WHERE ${whereClause}
      ORDER BY display_order ASC, created_at DESC
    `;

    try {
      const rows = await query<any>(sql, params);
      if (rows && rows.length > 0) {
        const rooms: PartyRoomDto[] = rows.map((r) => ({
          id: r.id,
          roomNumber: r.room_number,
          title: r.title,
          collageUrl: r.collage_url,
          currentMembers: Number(r.current_members),
          maxMembers: Number(r.max_members || 9),
          seatCountFormatted: `${r.current_members} / ${r.max_members || 9}`,
          isLive: Boolean(r.is_live),
          status: r.status,
          category: r.category,
          country: r.country,
          countryCode: r.country_code,
          flagEmoji: r.flag_emoji,
          hostNickname: r.host_nickname,
          hostAvatar: r.host_avatar,
          tags: r.tags || [],
          displayOrder: Number(r.display_order),
        }));

        return NextResponse.json({
          success: true,
          rooms,
          total: rooms.length,
          tab: 'party',
          source: 'database',
        });
      }
    } catch (dbErr) {
      console.warn('Database query for party_rooms failed, using reference fallback:', dbErr);
    }

    // Filter fallback rooms if search or country applied
    let filtered = FALLBACK_PARTY_ROOMS;
    if (countryCode && countryCode !== 'ALL') {
      filtered = filtered.filter((r) => r.countryCode === countryCode || r.countryCode === 'ALL');
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(lower) ||
          r.hostNickname.toLowerCase().includes(lower) ||
          r.roomNumber.includes(lower)
      );
    }

    return NextResponse.json({
      success: true,
      rooms: filtered,
      total: filtered.length,
      tab: 'party',
      source: 'reference_fallback',
    });
  } catch (error: any) {
    console.error('Error fetching party rooms:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch party rooms',
        rooms: FALLBACK_PARTY_ROOMS,
        total: FALLBACK_PARTY_ROOMS.length,
      },
      { status: 500 }
    );
  }
}
