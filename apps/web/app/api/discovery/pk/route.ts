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

    const statusFilter = searchParams.get('status')?.trim().toLowerCase(); // 'all', 'active', 'upcoming', 'completed'
    const country = searchParams.get('country')?.trim().toUpperCase();

    let whereConditions: string[] = [];
    let params: any[] = [];

    if (statusFilter && ['active', 'upcoming', 'completed'].includes(statusFilter)) {
      params.push(statusFilter);
      whereConditions.push(`pk.status = $${params.length}`);
    }

    if (country && country !== 'ALL') {
      params.push(country);
      whereConditions.push(`(uA.country_code = $${params.length} OR uB.country_code = $${params.length} OR lr.country_code = $${params.length})`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Status counts
    const statusCountsSql = `
      SELECT 
        COUNT(CASE WHEN pk.status = 'active' THEN 1 END)::int AS active_count,
        COUNT(CASE WHEN pk.status = 'upcoming' THEN 1 END)::int AS upcoming_count,
        COUNT(CASE WHEN pk.status = 'completed' THEN 1 END)::int AS completed_count,
        COUNT(*)::int AS total_count
      FROM popolive.pk_activities pk
      JOIN popolive.users uA ON pk.host_a_id = uA.id
      JOIN popolive.users uB ON pk.host_b_id = uB.id
      LEFT JOIN popolive.live_rooms lr ON pk.room_id = lr.id
      ${whereClause}
    `;
    const countRes = await query<any>(statusCountsSql, params);
    const counts = countRes[0] || { active_count: 0, upcoming_count: 0, completed_count: 0, total_count: 0 };

    // Paginated battles query
    params.push(limit);
    const limitParamIndex = params.length;
    params.push(offset);
    const offsetParamIndex = params.length;

    const pkSql = `
      SELECT 
        pk.id,
        pk.room_id,
        pk.title,
        pk.status,
        pk.host_a_votes,
        pk.host_b_votes,
        pk.host_a_points,
        pk.host_b_points,
        pk.viewer_count,
        pk.started_at,
        pk.ended_at,
        lr.room_number,
        lr.is_live,
        lr.viewer_count AS room_viewers,
        uA.id AS host_a_id,
        uA.nickname AS host_a_nickname,
        uA.poppo_id AS host_a_poppo_id,
        uA.avatar_url AS host_a_avatar_url,
        uA.country_code AS host_a_country_code,
        uA.host_level AS host_a_level,
        uB.id AS host_b_id,
        uB.nickname AS host_b_nickname,
        uB.poppo_id AS host_b_poppo_id,
        uB.avatar_url AS host_b_avatar_url,
        uB.country_code AS host_b_country_code,
        uB.host_level AS host_b_level
      FROM popolive.pk_activities pk
      JOIN popolive.users uA ON pk.host_a_id = uA.id
      JOIN popolive.users uB ON pk.host_b_id = uB.id
      LEFT JOIN popolive.live_rooms lr ON pk.room_id = lr.id
      ${whereClause}
      ORDER BY 
        (CASE pk.status 
          WHEN 'active' THEN 1 
          WHEN 'upcoming' THEN 2 
          WHEN 'completed' THEN 3 
          ELSE 4 
        END) ASC,
        pk.started_at DESC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;

    const rows = await query<any>(pkSql, params);

    const battles = rows.map((r) => {
      const viewers = r.room_viewers || r.viewer_count || 0;
      return {
        id: r.id,
        roomId: r.room_id,
        roomNumber: r.room_number,
        title: r.title,
        status: r.status as 'active' | 'upcoming' | 'completed',
        isLiveRoom: Boolean(r.is_live && r.room_id),
        viewerCount: viewers,
        viewersFormatted: formatMetric(viewers),
        startedAt: r.started_at,
        endedAt: r.ended_at,
        hostA: {
          id: r.host_a_id,
          nickname: r.host_a_nickname,
          poppoId: r.host_a_poppo_id,
          avatarUrl: r.host_a_avatar_url || '/avatars/default.png',
          hostLevel: r.host_a_level || 1,
          countryCode: r.host_a_country_code || 'PK',
          flagEmoji: getCountryFlag(r.host_a_country_code),
          votes: r.host_a_votes || 0,
          points: parseInt(r.host_a_points || '0', 10),
          pointsFormatted: formatMetric(parseInt(r.host_a_points || '0', 10)),
        },
        hostB: {
          id: r.host_b_id,
          nickname: r.host_b_nickname,
          poppoId: r.host_b_poppo_id,
          avatarUrl: r.host_b_avatar_url || '/avatars/default.png',
          hostLevel: r.host_b_level || 1,
          countryCode: r.host_b_country_code || 'PK',
          flagEmoji: getCountryFlag(r.host_b_country_code),
          votes: r.host_b_votes || 0,
          points: parseInt(r.host_b_points || '0', 10),
          pointsFormatted: formatMetric(parseInt(r.host_b_points || '0', 10)),
        },
        watchUrl: r.room_id ? `/live/room/${r.room_id}` : null,
      };
    });

    const activeTotal = statusFilter ? (statusFilter === 'active' ? counts.active_count : (statusFilter === 'upcoming' ? counts.upcoming_count : counts.completed_count)) : counts.total_count;
    const totalPages = Math.ceil(activeTotal / limit);

    return NextResponse.json({
      success: true,
      tab: 'pk',
      battles,
      counts: {
        active: counts.active_count,
        upcoming: counts.upcoming_count,
        completed: counts.completed_count,
        total: counts.total_count,
      },
      pagination: {
        page,
        limit,
        total: activeTotal,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error in discovery pk route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load PK battles', details: error.message },
      { status: 500 }
    );
  }
}
