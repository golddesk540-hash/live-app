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

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;
    if (!roomId) {
      return NextResponse.json({ success: false, error: 'Room ID is required.' }, { status: 400 });
    }

    const viewer = await getAuthenticatedUser(req);

    // Query room by UUID or room_number
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
    const whereSql = isUuid ? 'lr.id = $1' : 'lr.room_number = $1';

    const roomSql = `
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
      WHERE ${whereSql}
      LIMIT 1
    `;

    const rows = await query<any>(roomSql, [roomId]);
    if (!rows || rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Live room not found or broadcast has ended.',
        isAvailable: false,
      }, { status: 404 });
    }

    const r = rows[0];
    const countryCodeClean = r.country_code || r.user_country_code || 'PK';
    const flagEmoji = getCountryFlag(countryCodeClean);

    // Check if viewer follows host
    let isFollowing = false;
    if (viewer) {
      const followCheck = await query(
        `SELECT id FROM popolive.user_follows WHERE follower_id = $1 AND following_id = $2 LIMIT 1`,
        [viewer.id, r.host_id]
      );
      isFollowing = followCheck.length > 0;
    }

    const roomData = {
      id: r.id,
      roomNumber: r.room_number,
      title: r.title,
      coverUrl: r.cover_url || r.host_avatar_url || '/avatars/default.png',
      category: r.category || 'live',
      status: r.status,
      isLive: Boolean(r.is_live && r.status === 'live'),
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
      shareUrl: `https://kigolive.com/live/room/${r.room_number || r.id}`,
      isFollowing,
      host: {
        id: r.host_id,
        nickname: r.host_nickname,
        poppoId: r.host_poppo_id,
        avatarUrl: r.host_avatar_url || '/avatars/default.png',
        gender: r.host_gender || 'unknown',
        hostLevel: r.host_level || 1,
        wealthLevel: r.wealth_level || 1,
        isVerified: Boolean(r.is_adult_verified || (r.host_level && r.host_level >= 5)),
      },
      pkBattle: r.is_pk && r.pk_id ? {
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

    return NextResponse.json({
      success: true,
      isAvailable: roomData.isLive,
      room: roomData,
    });
  } catch (error: any) {
    console.error('Error fetching room detail:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load room details', details: error.message },
      { status: 500 }
    );
  }
}
