import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, isStaffMember } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users
 * Returns list of platform users for administrative monitoring and management.
 * Protected: Requires Administrator or Staff clearance.
 */
export async function GET(req: NextRequest) {
  try {
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

    const userRows = await query<any>(
      `SELECT id, poppo_id, email, phone, nickname, avatar_url,
              gender, status, role, is_staff, is_face_verified,
              wealth_level, host_level, go_live_eligible, created_at, updated_at
       FROM popolive.users
       WHERE ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      total,
      limit,
      offset,
      users: userRows.map((u) => ({
        id: u.id,
        poppoId: u.poppo_id,
        email: u.email,
        phone: u.phone,
        nickname: u.nickname,
        avatarUrl: u.avatar_url,
        gender: u.gender,
        status: u.status,
        role: u.role,
        isStaff: Boolean(u.is_staff),
        isFaceVerified: Boolean(u.is_face_verified),
        wealthLevel: Number(u.wealth_level) || 1,
        hostLevel: Number(u.host_level) || 1,
        goLiveEligible: Boolean(u.go_live_eligible),
        createdAt: u.created_at ? new Date(u.created_at).toISOString() : null,
      })),
    });
  } catch (err: any) {
    console.error('GET /api/admin/users error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to list users.' },
      { status: 500 }
    );
  }
}
