import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { getCountryFlag, resolveCountryCode } from '@/lib/countries';
import { USE_LIVE_API } from '@/lib/clientFlags';

export const dynamic = 'force-dynamic';

function formatMetric(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

const REFERENCE_FOLLOWED_USERS = [
  {
    id: 'follow-ref-1',
    userId: '8802194',
    nickname: 'Zara Live',
    poppoId: '8802194',
    avatarUrl: '/assets/following/zara_live@2x.png',
    isLive: true,
    roomId: '100220',
    roomNumber: '100220',
    roomTitle: 'Zara Live Night Vibes ✨',
    viewerCount: 1800,
    viewersFormatted: '1.8K',
    liveNotificationsEnabled: true,
  },
  {
    id: 'follow-ref-2',
    userId: '7730192',
    nickname: 'Sana Khan',
    poppoId: '7730192',
    avatarUrl: '/assets/following/sana_khan@2x.png',
    isLive: true,
    roomId: '100221',
    roomNumber: '100221',
    roomTitle: 'Sana Khan Live Broadcast 🎤',
    viewerCount: 892,
    viewersFormatted: '892',
    liveNotificationsEnabled: true,
  },
  {
    id: 'follow-ref-3',
    userId: '6541290',
    nickname: 'Alina',
    poppoId: '6541290',
    avatarUrl: '/assets/following/alina@2x.png',
    isLive: true,
    roomId: '100223',
    roomNumber: '100223',
    roomTitle: 'Alina Chit Chat & Chill 🌸',
    viewerCount: 725,
    viewersFormatted: '725',
    liveNotificationsEnabled: true,
  },
  {
    id: 'follow-ref-4',
    userId: '5432109',
    nickname: 'Mehak',
    poppoId: '5432109',
    avatarUrl: '/assets/following/mehak@2x.png',
    isLive: true,
    roomId: '100224',
    roomNumber: '100224',
    roomTitle: 'Mehak Singing Session 🎶',
    viewerCount: 602,
    viewersFormatted: '602',
    liveNotificationsEnabled: true,
  },
];

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const sessionCookie = req.cookies.get('poppo_session')?.value;
    const hasCredentials = Boolean(authHeader || sessionCookie);

    const viewer = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const rawCountry = searchParams.get('country')?.trim();

    // Validate country filter
    let resolvedCountryCode: string | null = null;
    if (rawCountry) {
      const resolved = resolveCountryCode(rawCountry);
      if (!resolved.valid) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid or unsupported country: "${rawCountry}"`,
            code: 'INVALID_COUNTRY',
          },
          { status: 400 }
        );
      }
      if (resolved.code !== 'ALL') {
        resolvedCountryCode = resolved.code!;
      }
    }

    // When USE_LIVE_API is active, strict PostgreSQL authentication is enforced
    if (USE_LIVE_API) {
      if (!viewer) {
        return NextResponse.json(
          {
            success: false,
            error: hasCredentials ? 'Unauthorized: Invalid or expired session' : 'Unauthorized. Please log in to view followed broadcasters.',
            code: 'UNAUTHORIZED',
          },
          { status: 401 }
        );
      }
    } else {
      // Offline / fixture preview mode when USE_LIVE_API is false
      if (!viewer) {
        return NextResponse.json({
          success: true,
          authenticated: false,
          isDemo: true,
          users: REFERENCE_FOLLOWED_USERS,
          liveRooms: REFERENCE_FOLLOWED_USERS.map((u) => ({
            id: u.roomId,
            roomId: u.roomId,
            roomNumber: u.roomNumber,
            title: u.roomTitle,
            coverUrl: u.avatarUrl,
            category: 'live',
            status: 'live',
            isLive: true,
            viewerCount: u.viewerCount,
            viewersFormatted: u.viewersFormatted,
            coinsEarned: 0,
            coinsFormatted: '0',
            country: 'Pakistan',
            countryCode: 'PK',
            flagEmoji: '🇵🇰',
            isFollowing: true,
            hostId: u.userId,
            hostNickname: u.nickname,
            hostName: u.nickname,
            hostAvatar: u.avatarUrl,
            hostPoppoId: u.poppoId,
            host: { id: u.userId, nickname: u.nickname, poppoId: u.poppoId, avatarUrl: u.avatarUrl },
          })),
          offlineUsers: [],
          totalFollowed: REFERENCE_FOLLOWED_USERS.length,
          liveCount: REFERENCE_FOLLOWED_USERS.length,
        });
      }
    }

    let whereClause = 'uf.follower_id = $1 AND u.status = $2';
    const params: any[] = [viewer.id, 'active'];

    if (resolvedCountryCode) {
      params.push(resolvedCountryCode);
      whereClause += ` AND (u.country_code = $${params.length} OR lr.country_code = $${params.length})`;
    }

    // Fetch followed creators with lateral active room join (guarantees 0 duplicate user rows)
    const followedSql = `
      SELECT 
        u.id AS user_id,
        u.nickname,
        u.poppo_id,
        COALESCE(u.avatar_url, '/avatars/default.png') AS avatar_url,
        u.gender,
        u.country,
        u.country_code,
        u.host_level,
        u.wealth_level,
        lr.id AS room_id,
        lr.room_number,
        lr.title AS room_title,
        lr.cover_url,
        lr.category,
        lr.status AS room_status,
        lr.is_live,
        lr.is_pk,
        lr.viewer_count,
        lr.coins_earned,
        lr.started_at,
        uf.created_at AS followed_at,
        COALESCE(uf.live_notifications_enabled, true) AS live_notifications_enabled
      FROM popolive.user_follows uf
      JOIN popolive.users u ON uf.following_id = u.id
      LEFT JOIN LATERAL (
        SELECT id, room_number, title, cover_url, category, status, is_live, is_pk, viewer_count, coins_earned, started_at, country_code
        FROM popolive.live_rooms
        WHERE host_id = u.id AND is_live = true AND status = 'live'
        ORDER BY started_at DESC
        LIMIT 1
      ) lr ON true
      WHERE ${whereClause}
      ORDER BY (CASE WHEN lr.is_live = true THEN 1 ELSE 2 END) ASC, lr.viewer_count DESC NULLS LAST, u.nickname ASC
    `;

    const rows = await query<any>(followedSql, params);

    // If user follows 0 accounts in database, return clean empty state
    if (!rows || rows.length === 0) {
      return NextResponse.json({
        success: true,
        authenticated: true,
        isDemo: false,
        users: [],
        liveRooms: [],
        offlineUsers: [],
        totalFollowed: 0,
        liveCount: 0,
      });
    }

    const users: any[] = [];
    const liveRooms: any[] = [];
    const offlineUsers: any[] = [];

    for (const r of rows) {
      const flagEmoji = getCountryFlag(r.country_code);
      const isLive = Boolean(r.is_live && r.room_id);
      const viewerCount = Number(r.viewer_count || 0);

      const userItem = {
        id: r.user_id,
        userId: r.user_id,
        nickname: r.nickname,
        poppoId: r.poppo_id,
        avatarUrl: r.avatar_url || '/avatars/default.png',
        isLive,
        roomId: r.room_id || null,
        roomNumber: r.room_number || null,
        roomTitle: r.room_title || null,
        viewerCount,
        viewersFormatted: formatMetric(viewerCount),
        liveNotificationsEnabled: Boolean(r.live_notifications_enabled),
      };

      users.push(userItem);

      if (isLive) {
        liveRooms.push({
          id: r.room_id,
          roomId: r.room_id,
          roomNumber: r.room_number,
          title: r.room_title,
          coverUrl: r.cover_url || r.avatar_url || '/avatars/default.png',
          category: r.category || 'live',
          status: 'live',
          isLive: true,
          isPk: Boolean(r.is_pk),
          viewerCount,
          viewersFormatted: formatMetric(viewerCount),
          coinsEarned: parseInt(r.coins_earned || '0', 10),
          coinsFormatted: formatMetric(parseInt(r.coins_earned || '0', 10)),
          country: r.country || 'Pakistan',
          countryCode: r.country_code || 'PK',
          flagEmoji,
          startedAt: r.started_at,
          isFollowing: true,
          hostId: r.user_id,
          hostNickname: r.nickname,
          hostName: r.nickname,
          hostAvatar: r.avatar_url || '/avatars/default.png',
          hostPoppoId: r.poppo_id,
          host: {
            id: r.user_id,
            nickname: r.nickname,
            poppoId: r.poppo_id,
            avatarUrl: r.avatar_url || '/avatars/default.png',
            hostLevel: r.host_level || 1,
            wealthLevel: r.wealth_level || 1,
          },
        });
      } else {
        offlineUsers.push({
          userId: r.user_id,
          nickname: r.nickname,
          poppoId: r.poppo_id,
          avatarUrl: r.avatar_url,
          gender: r.gender,
          country: r.country || 'Pakistan',
          countryCode: r.country_code || 'PK',
          flagEmoji,
          hostLevel: r.host_level || 1,
          isLive: false,
          isFollowing: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      isDemo: false,
      users,
      liveRooms,
      offlineUsers,
      totalFollowed: users.length,
      liveCount: liveRooms.length,
    });
  } catch (err: any) {
    console.error('Error in following API:', err);
    if (USE_LIVE_API) {
      return NextResponse.json(
        { success: false, error: 'Database connection failure', details: err.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        success: true,
        authenticated: false,
        isDemo: true,
        users: REFERENCE_FOLLOWED_USERS,
        liveRooms: [],
        offlineUsers: [],
        totalFollowed: 4,
        liveCount: 4,
        error: err.message,
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const viewer = await getAuthenticatedUser(req);
    const body = await req.json();
    const { targetUserId, enabled } = body;

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: 'targetUserId required' }, { status: 400 });
    }

    if (viewer) {
      await query(
        `UPDATE popolive.user_follows 
         SET live_notifications_enabled = $1 
         WHERE follower_id = $2 AND following_id = $3`,
        [Boolean(enabled), viewer.id, targetUserId]
      );
    }

    return NextResponse.json({
      success: true,
      enabled: Boolean(enabled),
      message: enabled ? 'Live notifications enabled' : 'Live notifications disabled',
    });
  } catch (err: any) {
    console.error('Error toggling live notifications:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
