import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCountryFlag } from '@/lib/countries';

export const dynamic = 'force-dynamic';

export interface SearchUserResult {
  id: string;
  poppoId: string;
  nickname: string;
  avatarUrl: string;
  hostLevel: number;
  wealthLevel: number;
  isLive: boolean;
  liveRoomId?: string | null;
  followersCount?: number;
  profileUrl: string;
}

export interface SearchRoomResult {
  id: string;
  roomId: string;
  roomNumber: string;
  title: string;
  coverUrl: string;
  category: string;
  isLive: boolean;
  isPk: boolean;
  viewerCount: number;
  viewersFormatted: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  host: {
    nickname: string;
    avatarUrl: string;
    poppoId: string;
  };
}

export interface SearchPartyResult {
  id: string;
  roomNumber: string;
  title: string;
  collageUrl: string;
  currentMembers: number;
  maxMembers: number;
  seatCountFormatted: string;
  category: string;
  isLive: boolean;
  hostNickname: string;
}

function formatViewers(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return count.toString();
}

// Fallback demo data if DB is offline
const DEMO_USERS: SearchUserResult[] = [
  {
    id: 'demo-user-1',
    poppoId: '8802194',
    nickname: 'Zara Live',
    avatarUrl: '/avatars/default.png',
    hostLevel: 18,
    wealthLevel: 12,
    isLive: true,
    liveRoomId: '100220',
    followersCount: 14200,
    profileUrl: '/user/8802194',
  },
  {
    id: 'demo-user-2',
    poppoId: '7730192',
    nickname: 'Sana',
    avatarUrl: '/avatars/default.png',
    hostLevel: 24,
    wealthLevel: 15,
    isLive: true,
    liveRoomId: '100221',
    followersCount: 28900,
    profileUrl: '/user/7730192',
  },
  {
    id: 'demo-user-3',
    poppoId: '6453488',
    nickname: 'RivalStar_PK',
    avatarUrl: '/avatars/default.png',
    hostLevel: 15,
    wealthLevel: 9,
    isLive: true,
    liveRoomId: '100068',
    followersCount: 8400,
    profileUrl: '/user/6453488',
  },
];

const DEMO_ROOMS: SearchRoomResult[] = [
  {
    id: 'demo-room-1',
    roomId: '100220',
    roomNumber: '100220',
    title: 'Zara Live Night Vibes ✨',
    coverUrl: '/avatars/default.png',
    category: 'live',
    isLive: true,
    isPk: false,
    viewerCount: 1420,
    viewersFormatted: '1.4K',
    country: 'Pakistan',
    countryCode: 'PK',
    flagEmoji: '🇵🇰',
    host: {
      nickname: 'Zara Live',
      avatarUrl: '/avatars/default.png',
      poppoId: '8802194',
    },
  },
  {
    id: 'demo-room-2',
    roomId: '100221',
    roomNumber: '100221',
    title: 'Sana - Singing & Chit Chat 🎤',
    coverUrl: '/avatars/default.png',
    category: 'live',
    isLive: true,
    isPk: false,
    viewerCount: 2890,
    viewersFormatted: '2.8K',
    country: 'Pakistan',
    countryCode: 'PK',
    flagEmoji: '🇵🇰',
    host: {
      nickname: 'Sana',
      avatarUrl: '/avatars/default.png',
      poppoId: '7730192',
    },
  },
  {
    id: 'demo-room-3',
    roomId: '100222',
    roomNumber: '100222',
    title: 'PK Room: Top Broadcaster Battle ⚔️',
    coverUrl: '/avatars/default.png',
    category: 'pk',
    isLive: true,
    isPk: true,
    viewerCount: 5320,
    viewersFormatted: '5.3K',
    country: 'Pakistan',
    countryCode: 'PK',
    flagEmoji: '🇵🇰',
    host: {
      nickname: 'Sana',
      avatarUrl: '/avatars/default.png',
      poppoId: '7730192',
    },
  },
];

const DEMO_PARTY: SearchPartyResult[] = [
  {
    id: 'party-1',
    roomNumber: '7001',
    title: '🎉 Fun Party Room',
    collageUrl: '/assets/party/fun_party_collage@2x.png',
    currentMembers: 9,
    maxMembers: 9,
    seatCountFormatted: '9 / 9',
    category: 'Fun',
    isLive: true,
    hostNickname: 'Sophia_Star',
  },
  {
    id: 'party-2',
    roomNumber: '7002',
    title: 'Music Party',
    collageUrl: '/assets/party/music_party_collage@2x.png',
    currentMembers: 6,
    maxMembers: 9,
    seatCountFormatted: '6 / 9',
    category: 'Music',
    isLive: true,
    hostNickname: 'DJ_Alex',
  },
  {
    id: 'party-3',
    roomNumber: '7003',
    title: 'Friends Chat',
    collageUrl: '/assets/party/friends_chat_collage@2x.png',
    currentMembers: 4,
    maxMembers: 9,
    seatCountFormatted: '4 / 9',
    category: 'Chat',
    isLive: true,
    hostNickname: 'Emma_Friend',
  },
  {
    id: 'party-4',
    roomNumber: '7004',
    title: 'Global Party',
    collageUrl: '/assets/party/global_party_collage@2x.png',
    currentMembers: 9,
    maxMembers: 9,
    seatCountFormatted: '9 / 9',
    category: 'Global',
    isLive: true,
    hostNickname: 'Marco_World',
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQ = searchParams.get('q')?.trim() || '';
    const typeFilter = searchParams.get('type')?.toLowerCase() || 'all';
    const limit = Math.min(30, Math.max(1, parseInt(searchParams.get('limit') || '15', 10)));

    if (!rawQ) {
      return NextResponse.json({
        success: true,
        query: '',
        counts: { users: 0, rooms: 0, party: 0, total: 0 },
        results: { users: [], rooms: [], party: [] },
      });
    }

    const searchPattern = `%${rawQ}%`;

    let matchedUsers: SearchUserResult[] = [];
    let matchedRooms: SearchRoomResult[] = [];
    let matchedParty: SearchPartyResult[] = [];

    try {
      // 1. Search Users
      if (typeFilter === 'all' || typeFilter === 'users') {
        const usersSql = `
          SELECT 
            u.id,
            u.poppo_id,
            u.nickname,
            COALESCE(u.avatar_url, '/avatars/default.png') AS avatar_url,
            COALESCE(u.host_level, 1) AS host_level,
            COALESCE(u.wealth_level, 1) AS wealth_level,
            lr.id AS live_room_id,
            lr.room_number AS live_room_number,
            (SELECT COUNT(*)::int FROM popolive.user_follows uf WHERE uf.following_id = u.id) AS followers_count
          FROM popolive.users u
          LEFT JOIN popolive.live_rooms lr ON lr.host_id = u.id AND lr.is_live = true AND lr.status = 'live'
          WHERE (u.nickname ILIKE $1 OR u.poppo_id ILIKE $1)
          ORDER BY u.host_level DESC
          LIMIT $2
        `;
        const userRows = await query<any>(usersSql, [searchPattern, limit]);
        matchedUsers = (userRows || []).map((u) => ({
          id: u.id,
          poppoId: u.poppo_id,
          nickname: u.nickname,
          avatarUrl: u.avatar_url,
          hostLevel: Number(u.host_level || 1),
          wealthLevel: Number(u.wealth_level || 1),
          isLive: Boolean(u.live_room_id),
          liveRoomId: u.live_room_number || u.live_room_id || null,
          followersCount: Number(u.followers_count || 0),
          profileUrl: `/user/${u.poppo_id || u.id}`,
        }));
      }

      // 2. Search Live Rooms
      if (typeFilter === 'all' || typeFilter === 'rooms') {
        const roomsSql = `
          SELECT 
            lr.id,
            lr.room_number,
            lr.title,
            COALESCE(lr.cover_url, '/avatars/default.png') AS cover_url,
            lr.category,
            lr.is_live,
            lr.is_pk,
            lr.viewer_count,
            lr.country,
            lr.country_code,
            u.nickname AS host_nickname,
            COALESCE(u.avatar_url, '/avatars/default.png') AS host_avatar,
            u.poppo_id AS host_poppo_id
          FROM popolive.live_rooms lr
          JOIN popolive.users u ON lr.host_id = u.id
          WHERE (lr.title ILIKE $1 OR u.nickname ILIKE $1 OR u.poppo_id ILIKE $1)
            AND lr.is_live = true
            AND lr.status = 'live'
          ORDER BY lr.viewer_count DESC
          LIMIT $2
        `;
        const roomRows = await query<any>(roomsSql, [searchPattern, limit]);
        matchedRooms = (roomRows || []).map((r) => ({
          id: r.id,
          roomId: r.room_number || r.id,
          roomNumber: r.room_number,
          title: r.title,
          coverUrl: r.cover_url,
          category: r.category || 'live',
          isLive: Boolean(r.is_live),
          isPk: Boolean(r.is_pk),
          viewerCount: Number(r.viewer_count || 0),
          viewersFormatted: formatViewers(Number(r.viewer_count || 0)),
          country: r.country || 'Popular',
          countryCode: r.country_code || 'ALL',
          flagEmoji: getCountryFlag(r.country_code || 'ALL'),
          host: {
            nickname: r.host_nickname,
            avatarUrl: r.host_avatar,
            poppoId: r.host_poppo_id,
          },
        }));
      }

      // 3. Search Party Rooms
      if (typeFilter === 'all' || typeFilter === 'party') {
        const partySql = `
          SELECT 
            id,
            room_number,
            title,
            collage_url,
            current_members,
            max_members,
            category,
            is_live,
            host_nickname
          FROM popolive.party_rooms
          WHERE (title ILIKE $1 OR host_nickname ILIKE $1 OR room_number ILIKE $1)
            AND is_live = true
          ORDER BY current_members DESC
          LIMIT $2
        `;
        const partyRows = await query<any>(partySql, [searchPattern, limit]);
        matchedParty = (partyRows || []).map((p) => ({
          id: p.id,
          roomNumber: p.room_number,
          title: p.title,
          collageUrl: p.collage_url,
          currentMembers: Number(p.current_members),
          maxMembers: Number(p.max_members || 9),
          seatCountFormatted: `${p.current_members} / ${p.max_members || 9}`,
          category: p.category || 'Party',
          isLive: Boolean(p.is_live),
          hostNickname: p.host_nickname,
        }));
      }

      const totalCount = matchedUsers.length + matchedRooms.length + matchedParty.length;

      return NextResponse.json({
        success: true,
        query: rawQ,
        counts: {
          users: matchedUsers.length,
          rooms: matchedRooms.length,
          party: matchedParty.length,
          total: totalCount,
        },
        results: {
          users: matchedUsers,
          rooms: matchedRooms,
          party: matchedParty,
        },
        source: 'database',
      });
    } catch (dbErr) {
      console.warn('Search query DB fallback invoked:', dbErr);
    }

    // In-memory demo fallback filtering
    const qLower = rawQ.toLowerCase();
    const demoFilteredUsers = DEMO_USERS.filter(
      (u) => u.nickname.toLowerCase().includes(qLower) || u.poppoId.includes(qLower)
    );
    const demoFilteredRooms = DEMO_ROOMS.filter(
      (r) =>
        r.title.toLowerCase().includes(qLower) ||
        r.host.nickname.toLowerCase().includes(qLower) ||
        r.roomNumber.includes(qLower)
    );
    const demoFilteredParty = DEMO_PARTY.filter(
      (p) =>
        p.title.toLowerCase().includes(qLower) ||
        p.hostNickname.toLowerCase().includes(qLower) ||
        p.roomNumber.includes(qLower)
    );

    const fallbackTotal =
      demoFilteredUsers.length + demoFilteredRooms.length + demoFilteredParty.length;

    return NextResponse.json({
      success: true,
      query: rawQ,
      counts: {
        users: demoFilteredUsers.length,
        rooms: demoFilteredRooms.length,
        party: demoFilteredParty.length,
        total: fallbackTotal,
      },
      results: {
        users: demoFilteredUsers,
        rooms: demoFilteredRooms,
        party: demoFilteredParty,
      },
      source: 'demo_fallback',
    });
  } catch (err: any) {
    console.error('Search API fatal error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute search',
        counts: { users: 0, rooms: 0, party: 0, total: 0 },
        results: { users: [], rooms: [], party: [] },
      },
      { status: 500 }
    );
  }
}
