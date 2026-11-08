import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const requests = await query(
      `SELECT id, request_number, reason, additional_explanation,
              status, requested_date, reviewed_date, completed_date, cancelled_date,
              created_at, updated_at
       FROM popolive.account_closure_requests
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user.id]
    );

    const auditLog = await query(
      `SELECT a.id, a.request_id, r.request_number, a.action,
              a.previous_status, a.new_status, a.action_date, a.user_agent
       FROM popolive.closure_audit_records a
       LEFT JOIN popolive.account_closure_requests r ON a.request_id = r.id
       WHERE a.user_id = $1
       ORDER BY a.action_date DESC`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      requests,
      auditLog,
    });
  } catch (err: any) {
    console.error('Error in GET /api/account/closure/history:', err);
    return NextResponse.json({ error: 'Failed to retrieve closure history.' }, { status: 500 });
  }
}
