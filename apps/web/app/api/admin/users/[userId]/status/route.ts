import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, isStaffMember } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/users/[userId]/status
 * Administrative Ban & Status Enforcement
 * 
 * Strict Acceptance Requirements:
 * 1. Only authorized administrators can ban or suspend users (403 for unauthorized).
 * 2. Ban is permanently saved in PostgreSQL database.
 * 3. All active sessions are immediately revoked (is_revoked = true).
 * 4. Banned users cannot log in or restore sessions.
 * 5. Banned users are strictly blocked from broadcasting (Go-Live eligibility revoked).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = await getAuthenticatedUser(req);
    if (!admin || !isStaffMember(admin)) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'FORBIDDEN',
          error: 'Forbidden: Administrator clearance required to modify user account status.',
        },
        { status: 403 }
      );
    }

    const targetUserId = decodeURIComponent(params.userId || '').trim();
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Target userId is required.' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const newStatus = String(body.status || '').trim().toLowerCase();
    const reason = String(body.reason || 'Administrative action').trim();

    if (!['active', 'suspended', 'banned'].includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'INVALID_STATUS',
          error: 'Invalid status. Permitted values: active, suspended, banned.',
        },
        { status: 400 }
      );
    }

    // Lookup target user
    const targetRows = await query<any>(
      `SELECT id, poppo_id, email, nickname, status, role FROM popolive.users WHERE id::text = $1 OR poppo_id = $2 LIMIT 1`,
      [targetUserId, targetUserId]
    );

    if (!targetRows || targetRows.length === 0) {
      return NextResponse.json(
        { success: false, errorCode: 'USER_NOT_FOUND', error: 'Target user not found.' },
        { status: 404 }
      );
    }

    const target = targetRows[0];
    const previousStatus = target.status;

    // Prevent banning super admins unless caller is super admin
    if (target.role === 'admin' && admin.role !== 'admin') {
      return NextResponse.json(
        { success: false, errorCode: 'CANNOT_BAN_ADMIN', error: 'Cannot modify status of another administrator.' },
        { status: 403 }
      );
    }

    // Apply status change in database
    await query(
      `UPDATE popolive.users
       SET status = $1::character varying,
           go_live_eligible = CASE WHEN $1::text = 'active' THEN go_live_eligible ELSE false END,
           updated_at = NOW()
       WHERE id = $2::uuid`,
      [newStatus, target.id]
    );

    // If banning or suspending, revoke all existing active sessions
    let revokedSessionsCount = 0;
    if (newStatus === 'banned' || newStatus === 'suspended') {
      const revokeRes = await query(
        `UPDATE popolive.sessions
         SET is_revoked = true
         WHERE user_id = $1::uuid AND is_revoked = false`,
        [target.id]
      );
      revokedSessionsCount = (revokeRes as any).rowCount || 0;
    }

    // Record audit log
    await query(
      `INSERT INTO popolive.wallet_audit_logs (
         audit_id, actor_id, target_user_id, action, before_state, after_state, reason, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        `aud_ban_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        admin.id,
        target.id,
        `admin_status_${newStatus}`,
        JSON.stringify({ status: previousStatus }),
        JSON.stringify({ status: newStatus, revokedSessions: revokedSessionsCount }),
        reason,
      ]
    ).catch((err) => console.warn('Audit log write warning:', err?.message));

    return NextResponse.json({
      success: true,
      userId: target.id,
      poppoId: target.poppo_id,
      previousStatus,
      status: newStatus,
      revokedSessionsCount,
      updatedBy: admin.id,
      reason,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('POST /api/admin/users/[userId]/status error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update user status.' },
      { status: 500 }
    );
  }
}
