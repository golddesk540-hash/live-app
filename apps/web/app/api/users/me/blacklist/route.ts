import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;
    const search = (searchParams.get('search') || '').trim();

    let searchClause = '';
    const queryParams: any[] = [user.id];
    let pIdx = 2;

    if (search) {
      searchClause = `AND (LOWER(u.nickname) LIKE $${pIdx} OR u.poppo_id LIKE $${pIdx})`;
      queryParams.push(`%${search.toLowerCase()}%`);
      pIdx++;
    }

    // Total count
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM popolive.user_blocks b
      JOIN popolive.users u ON b.blocked_id = u.id
      WHERE b.blocker_id = $1 ${searchClause}
    `;
    const countRes = await query(countSql, queryParams);
    const totalCount = countRes[0]?.total || 0;

    // List query
    const listSql = `
      SELECT u.id, u.poppo_id, u.nickname, u.avatar_url, u.country, u.country_code, 
             b.created_at AS blocked_at
      FROM popolive.user_blocks b
      JOIN popolive.users u ON b.blocked_id = u.id
      WHERE b.blocker_id = $1 ${searchClause}
      ORDER BY b.created_at DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++}
    `;

    const listParams = [...queryParams, limit, offset];
    const rows = await query(listSql, listParams);

    const blockedUsers = rows.map((r: any) => ({
      id: r.id,
      poppoId: r.poppo_id,
      nickname: r.nickname,
      avatarUrl: r.avatar_url || '/avatars/default.png',
      country: r.country || 'Pakistan',
      countryCode: r.country_code || 'PK',
      blockedAt: r.blocked_at,
    }));

    return NextResponse.json({
      success: true,
      blockedUsers,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (err: any) {
    console.error('Error in GET /api/users/me/blacklist:', err);
    return NextResponse.json({ error: 'Failed to retrieve blacklist.' }, { status: 500 });
  }
}
