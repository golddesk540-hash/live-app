import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { getCountryFlag } from '@/lib/countries';

export const dynamic = 'force-dynamic';

function formatMetric(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

export async function GET(req: NextRequest) {
  try {
    const viewer = await getAuthenticatedUser(req);
    if (!viewer) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        message: 'Log in to view live broadcasts from hosts you follow.',
        liveRooms: [],
        offlineUsers: [],
        totalFollowed: 0,
        liveCount: 0,
      });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;
    const country = searchParams.get('country')?.trim().toUpperCase();

    let whereClause = 'uf.follower_id = $1';
    const params: any[] = [viewer.id];

    if (country && country !== 'ALL') {
      params.push(country);
      whereClause += ` AND (u.country_code = $${params.length} OR lr.country_code = $${params.length})`;
    }

    // Fetch followed creators with their live status
    const followedSql = `
      SELECT 
        u.id AS user_id,
        u.nickname,
        u.poppo_id,
        u.avatar_url,
        u.gender,
        u.country,
        u.country_code,
        u.host_level,
        u.wealth_level,
        u.is_adult_verified,
        lr.id AS room_id,
        lr.room_number,
        lr.title AS room_title,
        lr.cover_url,
        lr.category,
        lr.tags,
        lr.is_live,
        lr.is_pk,
        lr.viewer_count,
        lr.coins_earned,
        lr.started_at,
        uf.created_at AS followed_at
      FROM popolive.user_follows uf
      JOIN popolive.users u ON uf.following_id = u.id
      LEFT JOIN popolive.live_rooms lr ON (lr.host_id = u.id AND lr.is_live = true AND lr.status = 'live')
      WHERE ${whereClause}
      ORDER BY (CASE WHEN lr.is_live = true THEN 1 ELSE 2 END) ASC, lr.viewer_count DESC NULLS LAST, u.nickname ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const countSql = `
      SELECT 
        COUNT(*)::int AS total_followed,
        COUNT(lr.id)::int AS live_count
      FROM popolive.user_follows uf
      JOIN popolive.users u ON uf.following_id = u.id
      LEFT JOIN popolive.live_rooms lr ON (lr.host_id = u.id AND lr.is_live = true AND lr.status = 'live')
      WHERE ${whereClause}
    `;

    const [rows, countRes] = await Promise.all([
      query<any>(followedSql, [...params, limit, offset]),
      query<any>(countSql, params),
    ]);

    const totalFollowed = countRes[0]?.total_followed || 0;
    const liveCount = countRes[0]?.live_count || 0;

    const liveRooms: any[] = [];
    const offlineUsers: any[] = [];

    for (const r of rows) {
      const flagEmoji = getCountryFlag(r.country_code);

      if (r.is_live && r.room_id) {
        liveRooms.push({
          roomId: r.room_id,
          roomNumber: r.room_number,
          title: r.room_title,
          coverUrl: r.cover_url || r.avatar_url || '/avatars/default.png',
          category: r.category || 'live',
          isLive: true,
          isPk: Boolean(r.is_pk),
          viewerCount: r.viewer_count || 0,
          viewersFormatted: formatMetric(r.viewer_count || 0),
          coinsEarned: parseInt(r.coins_earned || '0', 10),
          coinsFormatted: formatMetric(parseInt(r.coins_earned || '0', 10)),
          country: r.country || 'Pakistan',
          countryCode: r.country_code || 'PK',
          flagEmoji,
          tags: Array.isArray(r.tags) && r.tags.length > 0 ? r.tags : ['Live', 'Follow'],
          startedAt: r.started_at,
          isFollowing: true,
          host: {
            id: r.user_id,
            nickname: r.nickname,
            poppoId: r.poppo_id,
            avatarUrl: r.avatar_url || '/avatars/default.png',
            gender: r.gender,
            hostLevel: r.host_level || 1,
            wealthLevel: r.wealth_level || 1,
            isVerified: Boolean(r.is_adult_verified || (r.host_level && r.host_level >= 5)),
          },
        });
      } else {
        offlineUsers.push({
          userId: r.user_id,
          nickname: r.nickname,
          poppoId: r.poppo_id,
          avatarUrl: r.avatar_url || '/avatars/default.png',
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

    // If user has 0 follows, fetch recommendations so they are not left with a dead screen
    let suggestedHosts: any[] = [];
    if (totalFollowed === 0) {
      const suggestSql = `
        SELECT 
          lr.id AS room_id,
          lr.room_number,
          lr.title,
          lr.cover_url,
          lr.viewer_count,
          lr.country_code,
          u.id AS user_id,
          u.nickname,
          u.poppo_id,
          u.avatar_url,
          u.host_level
        FROM popolive.live_rooms lr
        JOIN popolive.users u ON lr.host_id = u.id
        WHERE lr.is_live = true AND lr.status = 'live'
        ORDER BY lr.viewer_count DESC
        LIMIT 6
      `;
      const recRows = await query<any>(suggestSql);
      suggestedHosts = recRows.map((rec) => ({
        roomId: rec.room_id,
        roomNumber: rec.room_number,
        title: rec.title,
        coverUrl: rec.cover_url || rec.avatar_url,
        viewerCount: rec.viewer_count,
        viewersFormatted: formatMetric(rec.viewer_count),
        flagEmoji: getCountryFlag(rec.country_code),
        host: {
          id: rec.user_id,
          nickname: rec.nickname,
          poppoId: rec.poppo_id,
          avatarUrl: rec.avatar_url,
          hostLevel: rec.host_level,
        },
      }));
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      tab: 'following',
      liveRooms,
      offlineUsers,
      suggestedHosts,
      totalFollowed,
      liveCount,
      pagination: {
        page,
        limit,
        total: totalFollowed,
        hasMore: page * limit < totalFollowed,
      },
    });
  } catch (error: any) {
    console.error('Error in discovery following route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load following feed', details: error.message },
      { status: 500 }
    );
  }
}
