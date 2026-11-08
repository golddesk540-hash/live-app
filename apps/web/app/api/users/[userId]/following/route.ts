import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { resolveUserByIdentifier } from '@/lib/userLookup';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const targetUser = await resolveUserByIdentifier(params.userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;
    const search = (searchParams.get('search') || '').trim();

    const viewer = await getAuthenticatedUser(req);
    const viewerId = viewer ? viewer.id : null;

    let searchClause = '';
    const queryParams: any[] = [targetUser.id];
    let pIdx = 2;

    if (search) {
      searchClause = `AND (LOWER(u.nickname) LIKE $${pIdx} OR u.poppo_id LIKE $${pIdx})`;
      queryParams.push(`%${search.toLowerCase()}%`);
      pIdx++;
    }

    // 1. Total matching count
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM popolive.user_follows f
      JOIN popolive.users u ON f.following_id = u.id
      WHERE f.follower_id = $1 AND u.status = 'active' ${searchClause}
    `;
    const countRes = await query(countSql, queryParams);
    const totalCount = countRes[0]?.total || 0;

    // 2. Query following
    const viewerFollowCol = viewerId
      ? `, EXISTS(SELECT 1 FROM popolive.user_follows v WHERE v.follower_id = '${viewerId}' AND v.following_id = u.id) AS is_following`
      : `, false AS is_following`;

    const viewerSelfCol = viewerId
      ? `, (u.id = '${viewerId}') AS is_self`
      : `, false AS is_self`;

    const listSql = `
      SELECT u.id, u.poppo_id, u.nickname, u.avatar_url, u.country, u.country_code, 
             u.bio, u.host_level, u.wealth_level, u.is_adult_verified, f.created_at AS followed_at
             ${viewerFollowCol} ${viewerSelfCol}
      FROM popolive.user_follows f
      JOIN popolive.users u ON f.following_id = u.id
      WHERE f.follower_id = $1 AND u.status = 'active' ${searchClause}
      ORDER BY f.created_at DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++}
    `;

    const listParams = [...queryParams, limit, offset];
    const rows = await query(listSql, listParams);

    const following = rows.map((r: any) => ({
      id: r.id,
      poppoId: r.poppo_id,
      nickname: r.nickname,
      avatarUrl: r.avatar_url || '/avatars/default.png',
      country: r.country || 'Pakistan',
      countryCode: r.country_code || 'PK',
      bio: r.bio || '',
      hostLevel: Number(r.host_level) || 1,
      wealthLevel: Number(r.wealth_level) || 1,
      isAdultVerified: Boolean(r.is_adult_verified),
      followedAt: r.followed_at,
      isFollowing: Boolean(r.is_following),
      isSelf: Boolean(r.is_self),
    }));

    return NextResponse.json({
      success: true,
      targetUser: {
        id: targetUser.id,
        poppoId: targetUser.poppo_id,
        nickname: targetUser.nickname,
      },
      following,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (err: any) {
    console.error('Error in GET /api/users/[userId]/following:', err);
    return NextResponse.json({ error: 'Failed to retrieve following users.' }, { status: 500 });
  }
}
