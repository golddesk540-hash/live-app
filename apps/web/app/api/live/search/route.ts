import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/live/search?q=&type=people|rooms|id
 * Search for broadcasters, active live rooms, or numeric Poppo/room IDs.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    const type = (url.searchParams.get('type') || 'all').toLowerCase();
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 50);

    if (!q) {
      return NextResponse.json({
        success: true,
        query: '',
        results: {
          people: [],
          rooms: [],
        },
      });
    }

    const isNumeric = /^\d+$/.test(q);
    const searchPattern = `%${q}%`;

    let people: any[] = [];
    let rooms: any[] = [];

    // Search people (users)
    if (type === 'all' || type === 'people' || type === 'id') {
      const userSql = isNumeric
        ? `SELECT id, poppo_id, nickname, avatar_url, wealth_level, host_level, country, country_code, status
           FROM popolive.users
           WHERE (poppo_id = $1 OR LOWER(nickname) LIKE LOWER($2)) AND status = 'active'
           LIMIT $3`
        : `SELECT id, poppo_id, nickname, avatar_url, wealth_level, host_level, country, country_code, status
           FROM popolive.users
           WHERE LOWER(nickname) LIKE LOWER($1) AND status = 'active'
           LIMIT $2`;

      const userParams = isNumeric ? [q, searchPattern, limit] : [searchPattern, limit];
      const userRows = await query<any>(userSql, userParams);

      people = userRows.map((u) => ({
        id: u.id,
        poppoId: u.poppo_id,
        nickname: u.nickname,
        avatarUrl: u.avatar_url || '/avatars/default.png',
        wealthLevel: Number(u.wealth_level) || 1,
        hostLevel: Number(u.host_level) || 1,
        country: u.country || 'Pakistan',
        countryCode: u.country_code || 'PK',
      }));
    }

    // Search live rooms
    if (type === 'all' || type === 'rooms' || type === 'id') {
      const roomSql = isNumeric
        ? `SELECT lr.id, lr.room_number, lr.title, lr.cover_url, lr.category, lr.viewer_count,
                  lr.country, lr.country_code, lr.flag_emoji, lr.is_live, lr.is_pk,
                  u.id AS host_id, u.nickname AS host_nickname, u.avatar_url AS host_avatar_url
           FROM popolive.live_rooms lr
           JOIN popolive.users u ON lr.host_id = u.id
           WHERE lr.status = 'live' AND (lr.room_number = $1 OR LOWER(lr.title) LIKE LOWER($2))
           ORDER BY lr.viewer_count DESC
           LIMIT $3`
        : `SELECT lr.id, lr.room_number, lr.title, lr.cover_url, lr.category, lr.viewer_count,
                  lr.country, lr.country_code, lr.flag_emoji, lr.is_live, lr.is_pk,
                  u.id AS host_id, u.nickname AS host_nickname, u.avatar_url AS host_avatar_url
           FROM popolive.live_rooms lr
           JOIN popolive.users u ON lr.host_id = u.id
           WHERE lr.status = 'live' AND LOWER(lr.title) LIKE LOWER($1)
           ORDER BY lr.viewer_count DESC
           LIMIT $2`;

      const roomParams = isNumeric ? [q, searchPattern, limit] : [searchPattern, limit];
      const roomRows = await query<any>(roomSql, roomParams);

      rooms = roomRows.map((r) => ({
        id: r.id,
        roomNumber: r.room_number,
        title: r.title,
        coverUrl: r.cover_url || '/assets/viewer/sample_viewer_broadcast.png',
        category: r.category,
        viewerCount: Number(r.viewer_count) || 0,
        country: r.country,
        countryCode: r.country_code,
        flagEmoji: r.flag_emoji || '🇵🇰',
        isLive: r.is_live,
        isPk: Boolean(r.is_pk),
        host: {
          id: r.host_id,
          nickname: r.host_nickname,
          avatarUrl: r.host_avatar_url,
        },
      }));
    }

    return NextResponse.json({
      success: true,
      query: q,
      type,
      results: {
        people,
        rooms,
      },
      total: people.length + rooms.length,
    });
  } catch (err: any) {
    console.error('GET /api/live/search error:', err);
    return NextResponse.json({ success: false, error: 'Failed to perform search.' }, { status: 500 });
  }
}
