import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { getCountryFlag } from '@/lib/countries';

export const dynamic = 'force-dynamic';

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

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
    const whereSql = isUuid ? 'lr.id = $1' : 'lr.room_number = $1';

    const rows = await query<any>(
      `SELECT 
        lr.id AS room_id,
        lr.room_number,
        lr.status AS room_status,
        lr.is_live,
        u.id AS host_id,
        u.poppo_id,
        u.nickname,
        u.avatar_url,
        u.gender,
        u.bio,
        u.country,
        u.country_code,
        u.host_level,
        u.wealth_level,
        u.is_adult_verified,
        u.created_at AS member_since,
        (SELECT COUNT(*)::int FROM popolive.user_follows WHERE following_id = u.id) AS followers_count,
        (SELECT COUNT(*)::int FROM popolive.user_follows WHERE follower_id = u.id) AS following_count
       FROM popolive.live_rooms lr
       JOIN popolive.users u ON lr.host_id = u.id
       WHERE ${whereSql}
       LIMIT 1`,
      [roomId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Host or room not found.',
      }, { status: 404 });
    }

    const r = rows[0];
    const countryCodeClean = r.country_code || 'PK';
    const flagEmoji = getCountryFlag(countryCodeClean);

    let isFollowing = false;
    if (viewer) {
      const followCheck = await query(
        `SELECT id FROM popolive.user_follows WHERE follower_id = $1 AND following_id = $2 LIMIT 1`,
        [viewer.id, r.host_id]
      );
      isFollowing = followCheck.length > 0;
    }

    return NextResponse.json({
      success: true,
      roomId: r.room_id,
      roomNumber: r.room_number,
      isLive: Boolean(r.is_live && r.room_status === 'live'),
      host: {
        id: r.host_id,
        poppoId: r.poppo_id,
        nickname: r.nickname,
        avatarUrl: r.avatar_url || '/avatars/default.png',
        gender: r.gender || 'unspecified',
        bio: r.bio || '',
        country: r.country || 'Pakistan',
        countryCode: countryCodeClean,
        flagEmoji,
        hostLevel: r.host_level || 1,
        wealthLevel: r.wealth_level || 1,
        isVerified: Boolean(r.is_adult_verified || (r.host_level && r.host_level >= 5)),
        followersCount: r.followers_count || 0,
        followingCount: r.following_count || 0,
        memberSince: r.member_since,
        isFollowing,
        profileUrl: `/user/${r.host_id}`,
      },
    });
  } catch (error: any) {
    console.error('Error fetching room host profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch host details', details: error.message },
      { status: 500 }
    );
  }
}
