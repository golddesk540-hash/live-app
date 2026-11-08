import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCountryFlag } from '@/lib/countries';

export const dynamic = 'force-dynamic';

function formatMetric(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const offset = (page - 1) * limit;

    const countryCode = searchParams.get('country')?.trim().toUpperCase();
    const category = searchParams.get('category')?.trim().toLowerCase();
    const statusParam = searchParams.get('status')?.trim().toLowerCase() || 'live';
    const sortBy = searchParams.get('sort')?.trim().toLowerCase() || 'popular';
    const searchQuery = searchParams.get('q')?.trim();

    let whereConditions: string[] = [];
    let params: any[] = [];

    // Filter by status: live, offline, ended, or all
    if (statusParam === 'live') {
      whereConditions.push("lr.is_live = true AND lr.status = 'live'");
    } else if (statusParam === 'offline') {
      whereConditions.push("(lr.is_live = false OR lr.status = 'offline')");
    } else if (statusParam === 'ended') {
      whereConditions.push("lr.status = 'ended'");
    } else if (statusParam !== 'all') {
      whereConditions.push("lr.is_live = true AND lr.status = 'live'");
    }

    // Filter by country code
    if (countryCode && countryCode !== 'ALL') {
      params.push(countryCode);
      whereConditions.push(`(lr.country_code = $${params.length} OR u.country_code = $${params.length})`);
    }

    // Filter by category
    if (category && category !== 'all' && ['live', 'party', 'pk', 'game', 'chat'].includes(category)) {
      params.push(category);
      whereConditions.push(`lr.category = $${params.length}`);
    }

    // Search filter
    if (searchQuery) {
      params.push(`%${searchQuery}%`);
      whereConditions.push(`(lr.title ILIKE $${params.length} OR u.nickname ILIKE $${params.length} OR u.poppo_id ILIKE $${params.length})`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Total count query
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM popolive.live_rooms lr
      JOIN popolive.users u ON lr.host_id = u.id
      ${whereClause}
    `;
    const countRes = await query<{ total: number }>(countSql, params);
    const total = countRes[0]?.total || 0;

    // Sorting
    let orderBy = 'lr.viewer_count DESC, lr.started_at DESC';
    if (sortBy === 'recent') {
      orderBy = 'lr.started_at DESC, lr.viewer_count DESC';
    } else if (sortBy === 'viewers') {
      orderBy = 'lr.viewer_count DESC';
    }

    // Paginated rooms query
    params.push(limit);
    const limitIndex = params.length;
    params.push(offset);
    const offsetIndex = params.length;

    const roomsSql = `
      SELECT 
        lr.id,
        lr.room_number,
        lr.host_id,
        lr.title,
        lr.cover_url,
        lr.category,
        lr.status,
        lr.is_live,
        lr.is_pk,
        lr.current_pk_id,
        lr.viewer_count,
        lr.coins_earned,
        lr.country,
        lr.country_code,
        lr.tags,
        lr.started_at,
        lr.ended_at,
        u.id AS user_id,
        u.nickname AS host_nickname,
        u.poppo_id AS host_poppo_id,
        u.avatar_url AS host_avatar_url,
        u.gender AS host_gender,
        u.host_level,
        u.wealth_level,
        u.is_adult_verified,
        u.country AS user_country,
        u.country_code AS user_country_code,
        pk.id AS pk_id,
        pk.title AS pk_title,
        pk.status AS pk_status,
        pk.host_a_votes,
        pk.host_b_votes,
        pk.host_a_points,
        pk.host_b_points,
        u_opp.id AS opp_id,
        u_opp.nickname AS opp_nickname,
        u_opp.avatar_url AS opp_avatar_url,
        u_opp.poppo_id AS opp_poppo_id
      FROM popolive.live_rooms lr
      JOIN popolive.users u ON lr.host_id = u.id
      LEFT JOIN popolive.pk_activities pk ON lr.current_pk_id = pk.id
      LEFT JOIN popolive.users u_opp ON (
        pk.id IS NOT NULL AND (
          CASE WHEN pk.host_a_id = u.id THEN pk.host_b_id ELSE pk.host_a_id END = u_opp.id
        )
      )
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const rows = await query<any>(roomsSql, params);

    const rooms = rows.map((r) => {
      const countryCodeClean = r.country_code || r.user_country_code || 'PK';
      const flagEmoji = getCountryFlag(countryCodeClean);
      const isLive = Boolean(r.is_live && r.status === 'live');

      return {
        roomId: r.id,
        roomNumber: r.room_number,
        title: r.title,
        coverUrl: r.cover_url || r.host_avatar_url || '/avatars/default.png',
        category: r.category || 'live',
        status: r.status,
        isLive,
        isPk: Boolean(r.is_pk),
        viewerCount: r.viewer_count || 0,
        viewersFormatted: formatMetric(r.viewer_count || 0),
        coinsEarned: parseInt(r.coins_earned || '0', 10),
        coinsFormatted: formatMetric(parseInt(r.coins_earned || '0', 10)),
        country: r.country || r.user_country || 'Pakistan',
        countryCode: countryCodeClean,
        flagEmoji,
        tags: Array.isArray(r.tags) && r.tags.length > 0 ? r.tags : ['Live', 'Chat'],
        startedAt: r.started_at,
        endedAt: r.ended_at,
        host: {
          id: r.host_id,
          nickname: r.host_nickname || 'Streamer',
          poppoId: r.host_poppo_id || '---',
          avatarUrl: r.host_avatar_url || '/avatars/default.png',
          gender: r.host_gender || 'unknown',
          hostLevel: r.host_level || 1,
          wealthLevel: r.wealth_level || 1,
          isVerified: Boolean(r.is_adult_verified || (r.host_level && r.host_level >= 5)),
        },
        pkDetails: r.is_pk && r.pk_id ? {
          pkId: r.pk_id,
          title: r.pk_title,
          status: r.pk_status,
          votesHost: r.host_a_votes,
          votesOpponent: r.host_b_votes,
          pointsHost: r.host_a_points,
          pointsOpponent: r.host_b_points,
          opponent: r.opp_id ? {
            id: r.opp_id,
            nickname: r.opp_nickname,
            avatarUrl: r.opp_avatar_url,
            poppoId: r.opp_poppo_id,
          } : null,
        } : null,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      rooms,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error fetching discovery rooms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rooms', details: error.message },
      { status: 500 }
    );
  }
}
