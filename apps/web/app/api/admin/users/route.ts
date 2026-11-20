import { NextRequest, NextResponse } from 'next/server';
import { adminDeskService } from '@/lib/adminDeskService';
import { authorizeAdminRequest } from '@/lib/adminAuthMiddleware';
import { getAuthenticatedUser, isStaffMember } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users
 * Returns list of platform users for administrative monitoring and management.
 * Protected: Requires Administrator clearance or Admin Desk Bearer token.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';

    // If Admin Desk token is supplied, use adminDeskService
    if (authHeader.startsWith('Bearer ')) {
      const auth = await authorizeAdminRequest(req, 'users:read');
      if (!auth.authorized || !auth.actor) {
        return auth.response!;
      }

      const { searchParams } = new URL(req.url);
      const search = (searchParams.get('search') || '').trim();

      const users = search
        ? adminDeskService.searchUsers(auth.actor, search)
        : adminDeskService.listUsers(auth.actor);

      return NextResponse.json({
        success: true,
        users,
        total: users.length,
      });
    }

    // Fallback: Legacy session clearance
    const admin = await getAuthenticatedUser(req);
    if (!admin || !isStaffMember(admin)) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'FORBIDDEN',
          error: 'Forbidden: Administrator clearance required.',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const status = searchParams.get('status') || '';
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    let whereConditions: string[] = ['1=1'];
    let params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereConditions.push(`(LOWER(nickname) LIKE $${params.length} OR LOWER(email) LIKE $${params.length} OR poppo_id LIKE $${params.length})`);
    }

    if (status && status !== 'all') {
      params.push(status);
      whereConditions.push(`status = $${params.length}`);
    }

    const whereSql = whereConditions.join(' AND ');

    const countRows = await query<any>(
      `SELECT COUNT(*)::int AS total FROM popolive.users WHERE ${whereSql}`,
      params
    );
    const total = countRows[0]?.total || 0;

    params.push(limit);
    const limitParam = `$${params.length}`;
    params.push(offset);
    const offsetParam = `$${params.length}`;

    const users = await query<any>(
      `SELECT id, poppo_id, nickname, avatar_url, email, phone, gender,
              status, host_level, wealth_level, role, is_staff, is_face_verified,
              created_at, updated_at
       FROM popolive.users
       WHERE ${whereSql}
       ORDER BY created_at DESC
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params
    );

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + users.length < total,
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve users',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
