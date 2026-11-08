import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCountryFlag } from '@/lib/countries';

export const dynamic = 'force-dynamic';

function formatMetric(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 30) {
    return `${diffDays}d ago`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '16', 10)));
    const offset = (page - 1) * limit;

    const filter = searchParams.get('filter')?.toLowerCase() || 'all'; // 'all', 'live', 'verified'
    const country = searchParams.get('country')?.toUpperCase();

    let whereConditions = ["u.status = 'active'"];
    let params: any[] = [];

    if (filter === 'live') {
      whereConditions.push("lr.is_live = true AND lr.status = 'live'");
    } else if (filter === 'verified') {
      whereConditions.push('u.is_adult_verified = true');
    }

    if (country && country !== 'ALL') {
      params.push(country);
      whereConditions.push(`u.country_code = $${params.length}`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Total count
    const countSql = `
      SELECT COUNT(DISTINCT u.id)::int AS total
      FROM popolive.users u
      LEFT JOIN popolive.live_rooms lr ON (lr.host_id = u.id AND lr.is_live = true AND lr.status = 'live')
      WHERE ${whereClause}
    `;
    const countRes = await query<{ total: number }>(countSql, params);
    const total = countRes[0]?.total || 0;

    // Paginated users query
    params.push(limit);
    const limitParamIndex = params.length;
    params.push(offset);
    const offsetParamIndex = params.length;

    const usersSql = `
      SELECT 
        u.id,
        u.poppo_id,
        u.nickname,
        u.avatar_url,
        u.gender,
        u.country,
        u.country_code,
        u.host_level,
        u.wealth_level,
        u.is_adult_verified,
        u.created_at,
        lr.id AS room_id,
        lr.room_number,
        lr.title AS room_title,
        lr.is_live,
        lr.viewer_count
      FROM popolive.users u
      LEFT JOIN popolive.live_rooms lr ON (lr.host_id = u.id AND lr.is_live = true AND lr.status = 'live')
      WHERE ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;

    const rows = await query<any>(usersSql, params);

    const creators = rows.map((u) => {
      const isLive = Boolean(u.is_live && u.room_id);
      const flagEmoji = getCountryFlag(u.country_code);

      return {
        id: u.id,
        poppoId: u.poppo_id,
        nickname: u.nickname,
        avatarUrl: u.avatar_url || '/avatars/default.png',
        gender: u.gender,
        country: u.country || 'Pakistan',
        countryCode: u.country_code || 'PK',
        flagEmoji,
        hostLevel: u.host_level || 1,
        wealthLevel: u.wealth_level || 1,
        isVerified: Boolean(u.is_adult_verified),
        createdAt: u.created_at,
        joinedFormatted: formatRelativeTime(u.created_at),
        isLive,
        liveRoom: isLive ? {
          roomId: u.room_id,
          roomNumber: u.room_number,
          title: u.room_title,
          viewerCount: u.viewer_count,
          viewersFormatted: formatMetric(u.viewer_count || 0),
        } : null,
        profileUrl: `/profile/${u.id}`,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      tab: 'new',
      creators,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error in discovery new route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load new creators feed', details: error.message },
      { status: 500 }
    );
  }
}
