import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateHostRtcToken } from '@/lib/agora';

export const dynamic = 'force-dynamic';

/**
 * GET /api/live/rooms
 * Retrieve active live rooms with optional filters:
 * - country: e.g. PK, IN, BD, ALL
 * - category: category slug or name
 * - tab: explore (default), following, new, pk
 * - search: keyword for title, host nickname, poppo_id
 * - limit: items per page (default 24, max 100)
 * - page: 1-based page index
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = (searchParams.get('tab') || 'explore').toLowerCase();
    const country = searchParams.get('country') || '';
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '24', 10)));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const offset = (page - 1) * limit;

    const authUser = await getAuthenticatedUser(req).catch(() => null);

    // Only active live rooms
    const whereConditions: string[] = ["lr.is_live = true", "lr.status = 'live'"];
    const params: any[] = [];

    // Search filter
    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      whereConditions.push(`(lr.title ILIKE $${params.length} OR u.nickname ILIKE $${params.length} OR u.poppo_id ILIKE $${params.length})`);
    }

    // Country filter
    if (country.trim() && country.toUpperCase() !== 'ALL') {
      params.push(country.trim().toUpperCase());
      whereConditions.push(`lr.country_code = $${params.length}`);
    }

    // Category filter
    if (category.trim() && category.toLowerCase() !== 'all') {
      params.push(`%${category.trim()}%`);
      whereConditions.push(`lr.category ILIKE $${params.length}`);
    }

    // PK Battle filter
    if (tab === 'pk') {
      whereConditions.push('(lr.is_pk = true OR lr.in_pk_battle = true)');
    }

    // Following tab filter
    if (tab === 'following') {
      if (authUser) {
        params.push(authUser.id);
        whereConditions.push(`lr.host_id IN (SELECT following_id FROM popolive.user_follows WHERE follower_id = $${params.length})`);
      } else {
        // Unauthenticated visitor on following tab -> return empty or recommended
        return NextResponse.json({
          success: true,
          rooms: [],
          total: 0,
          page,
          limit,
          tab,
          isGuestFollowing: true,
        });
      }
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const orderBySql = tab === 'new' ? 'ORDER BY lr.created_at DESC' : 'ORDER BY lr.viewer_count DESC, lr.created_at DESC';

    // Count total matching rooms
    const countQuery = `
      SELECT COUNT(*)::int as total
      FROM popolive.live_rooms lr
      JOIN popolive.users u ON lr.host_id = u.id
      ${whereSql}
    `;
    const countRows = await query<{ total: number }>(countQuery, params);
    const total = countRows[0]?.total || 0;

    // Fetch rooms
    const queryParams = [...params, limit, offset];
    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;

    const sql = `
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
        lr.viewer_count,
        lr.coins_earned,
        lr.country,
        lr.country_code,
        lr.flag_emoji,
        lr.started_at,
        lr.created_at,
        u.nickname AS host_nickname,
        u.poppo_id AS host_poppo_id,
        u.avatar_url AS host_avatar_url,
        COALESCE(u.wealth_level, 1) AS host_wealth_level,
        COALESCE(u.host_level, 1) AS host_level,
        u.status AS host_status
      FROM popolive.live_rooms lr
      JOIN popolive.users u ON lr.host_id = u.id
      ${whereSql}
      ${orderBySql}
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const rows = await query<any>(sql, queryParams);

    const rooms = rows.map((r) => ({
      id: r.id,
      roomNumber: r.room_number,
      title: r.title,
      coverUrl: r.cover_url || '/assets/viewer/sample_viewer_broadcast.png',
      category: r.category || 'Live Chat',
      status: r.status,
      isLive: r.is_live,
      isPk: Boolean(r.is_pk),
      viewerCount: Number(r.viewer_count) || 0,
      viewerDisplay: formatViewerCount(Number(r.viewer_count) || 0),
      country: r.country || 'Pakistan',
      countryCode: r.country_code || 'PK',
      flagEmoji: r.flag_emoji || '🇵🇰',
      startedAt: r.started_at,
      host: {
        id: r.host_id,
        nickname: r.host_nickname,
        poppoId: r.host_poppo_id,
        avatarUrl: r.host_avatar_url || '/avatars/default.png',
        wealthLevel: Number(r.host_wealth_level) || 1,
        hostLevel: Number(r.host_level) || 1,
      },
    }));

    return NextResponse.json({
      success: true,
      rooms,
      total,
      page,
      limit,
      tab,
    });
  } catch (err: any) {
    console.error('GET /api/live/rooms error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve live rooms.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/live/rooms
 * Create a new live room and start broadcasting session.
 * Requires:
 * - Authentication
 * - Age 18+ verification
 * - Wealth Level >= 5 (Locked Business Rule)
 * - Account status active
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to create a live room.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Verify account status
    if (user.status === 'banned' || user.status === 'suspended') {
      return NextResponse.json(
        { success: false, error: `Account is ${user.status}. Broadcasting privileges revoked.`, code: 'ACCOUNT_RESTRICTED' },
        { status: 403 }
      );
    }

    // Query authoritative user profile from database to verify locked business rules
    const userRows = await query<any>(
      `SELECT id, poppo_id, nickname, avatar_url, wealth_level, host_level, 
              birthdate, is_adult_verified, status, live_cover_url
       FROM popolive.users
       WHERE id = $1
       LIMIT 1`,
      [user.id]
    );

    if (userRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User record not found in database.', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const host = userRows[0];
    const wealthLevel = Number(host.wealth_level) || 1;

    // RULE 1: Age verification (18+)
    const isAdult = Boolean(host.is_adult_verified);
    if (!isAdult && host.birthdate) {
      const birth = new Date(host.birthdate);
      const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) {
        return NextResponse.json(
          { success: false, error: 'Minimum age of 18 is required to broadcast on Popo Live.', code: 'AGE_VERIFICATION_FAILED' },
          { status: 403 }
        );
      }
    }

    // RULE 2: Wealth Level 5 Required to Go Live
    if (wealthLevel < 5) {
      return NextResponse.json(
        {
          success: false,
          error: `Wealth Level 5 is required to go live. Your current wealth level is Level ${wealthLevel}.`,
          code: 'WEALTH_LEVEL_INSUFFICIENT',
          currentWealthLevel: wealthLevel,
          requiredWealthLevel: 5,
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const title = (body.title || `${host.nickname}'s Live Studio ✨`).trim();
    const category = (body.category || 'Live Chat').trim();
    const coverUrl = body.coverUrl || host.live_cover_url || host.avatar_url || '/assets/viewer/sample_viewer_broadcast.png';
    const country = body.country || host.country || 'Pakistan';
    const countryCode = (body.countryCode || host.country_code || 'PK').toUpperCase();
    const flagEmoji = countryCode === 'PK' ? '🇵🇰' : countryCode === 'IN' ? '🇮🇳' : countryCode === 'BD' ? '🇧🇩' : '🌐';

    if (title.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Room title must be at least 3 characters long.', code: 'INVALID_TITLE' },
        { status: 400 }
      );
    }

    // Close any previous active room hosted by this user
    await query(
      `UPDATE popolive.live_rooms
       SET status = 'ended', is_live = false, ended_at = CURRENT_TIMESTAMP
       WHERE host_id = $1 AND is_live = true`,
      [user.id]
    );

    // Create unique room number and credentials
    const newRoomId = crypto.randomUUID();
    const roomNumber = String(crypto.randomInt(100000, 999999));
    const streamKey = `live_${crypto.randomBytes(16).toString('hex')}`;
    const agoraChannelName = `popo_room_${roomNumber}`;
    const agoraUid = Number(host.poppo_id) || crypto.randomInt(100000, 999999);

    await query(
      `INSERT INTO popolive.live_rooms (
        id, room_number, host_id, title, cover_url, category, status, is_live,
        viewer_count, country, country_code, flag_emoji, stream_key,
        agora_channel_name, agora_uid, started_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'live', true,
        0, $7, $8, $9, $10,
        $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )`,
      [
        newRoomId,
        roomNumber,
        user.id,
        title,
        coverUrl,
        category,
        country,
        countryCode,
        flagEmoji,
        streamKey,
        agoraChannelName,
        agoraUid,
      ]
    );

    // Generate publishing token
    const agoraToken = generateHostRtcToken(agoraChannelName, agoraUid);

    return NextResponse.json({
      success: true,
      message: 'Live room created and session started successfully.',
      room: {
        id: newRoomId,
        roomNumber,
        title,
        coverUrl,
        category,
        status: 'live',
        isLive: true,
        viewerCount: 0,
        country,
        countryCode,
        flagEmoji,
        startedAt: new Date().toISOString(),
        host: {
          id: user.id,
          nickname: host.nickname,
          poppoId: host.poppo_id,
          avatarUrl: host.avatar_url,
          wealthLevel,
        },
      },
      agora: agoraToken,
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/live/rooms error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create live broadcast room.' },
      { status: 500 }
    );
  }
}

function formatViewerCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return count.toString();
}
