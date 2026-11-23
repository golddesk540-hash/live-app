import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCountryFlag, resolveCountryCode } from '@/lib/countries';

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

    const category = searchParams.get('category')?.trim().toLowerCase();
    const rawCountry = searchParams.get('country')?.trim();
    const search = searchParams.get('q')?.trim() || searchParams.get('search')?.trim();
    const tab = searchParams.get('tab')?.trim().toLowerCase() || 'explore';
    const statusParam = searchParams.get('status')?.trim().toLowerCase() || 'live';

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

    let whereConditions: string[] = [];
    let params: any[] = [];

    // Filter by live status
    if (statusParam === 'live') {
      whereConditions.push('lr.is_live = true', "lr.status = 'live'");
    } else if (statusParam === 'ended') {
      whereConditions.push("lr.status = 'ended'");
    } else if (statusParam === 'offline') {
      whereConditions.push("(lr.is_live = false OR lr.status = 'offline')");
    } else if (statusParam !== 'all') {
      whereConditions.push('lr.is_live = true', "lr.status = 'live'");
    }

    if (category && category !== 'all' && ['live', 'party', 'pk', 'game'].includes(category)) {
      params.push(category);
      whereConditions.push(`lr.category = $${params.length}`);
    }

    if (resolvedCountryCode) {
      params.push(resolvedCountryCode);
      whereConditions.push(`(lr.country_code = $${params.length} OR u.country_code = $${params.length})`);
    }

    if (search) {
      params.push(`%${search}%`);
      whereConditions.push(`(lr.title ILIKE $${params.length} OR u.nickname ILIKE $${params.length} OR u.poppo_id ILIKE $${params.length})`);
    }

    // Tab-specific filters
    if (tab === 'pk') {
      whereConditions.push('(lr.is_pk = true OR lr.in_pk_battle = true)');
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

    // Sorting rule
    let orderBy = 'lr.viewer_count DESC, lr.started_at DESC';
    if (tab === 'for_you' || tab === 'foryou') {
      orderBy = 'lr.viewer_count DESC, lr.coins_earned DESC, lr.started_at DESC';
    } else if (tab === 'new') {
      orderBy = 'lr.started_at DESC, lr.created_at DESC';
    }

    // Paginated rooms query with PK opponent lookup
    params.push(limit);
    const limitParamIndex = params.length;
    params.push(offset);
    const offsetParamIndex = params.length;

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
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;

    const rows = await query<any>(roomsSql, params);

    const rooms = rows.map((r) => {
      const countryCodeClean = r.country_code || r.user_country_code || 'PK';
      const flagEmoji = getCountryFlag(countryCodeClean);
      const isLive = Boolean(r.is_live && r.status === 'live');

      return {
        id: r.id,
        roomId: r.id,
        roomNumber: r.room_number,
        title: r.title,
        coverUrl: r.cover_url || r.host_avatar_url || '/avatars/default.png',
        category: r.category || 'live',
        status: r.status || 'live',
        isLive,
        isPk: Boolean(r.is_pk),
        viewerCount: Number(r.viewer_count) || 0,
        viewersFormatted: formatMetric(Number(r.viewer_count) || 0),
        coinsEarned: parseInt(r.coins_earned || '0', 10),
        coinsFormatted: formatMetric(parseInt(r.coins_earned || '0', 10)),
        country: r.country || r.user_country || 'Pakistan',
        countryCode: countryCodeClean,
        flagEmoji,
        tags: Array.isArray(r.tags) && r.tags.length > 0 ? r.tags : ['Live'],
        startedAt: r.started_at,
        endedAt: r.ended_at,
        host: {
          id: r.host_id,
          nickname: r.host_nickname || 'Streamer',
          poppoId: r.host_poppo_id || '---',
          avatarUrl: r.host_avatar_url || '/avatars/default.png',
          gender: r.host_gender || 'unknown',
          hostLevel: Number(r.host_level) || 1,
          wealthLevel: Number(r.wealth_level) || 1,
          isVerified: Boolean(r.is_adult_verified || (r.host_level && r.host_level >= 5)),
        },
        hostId: r.host_id,
        hostNickname: r.host_nickname || 'Streamer',
        hostName: r.host_nickname || 'Streamer',
        hostAvatar: r.host_avatar_url || '/avatars/default.png',
        hostPoppoId: r.host_poppo_id || '---',
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
      tab,
      total,
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
    console.error('Error fetching explore discovery feed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load explore feed', details: error.message },
      { status: 500 }
    );
  }
}
