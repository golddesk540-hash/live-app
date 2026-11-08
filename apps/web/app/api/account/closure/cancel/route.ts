import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // Find active closure request
    const existing = await query(
      `SELECT id, request_number, status
       FROM popolive.account_closure_requests
       WHERE user_id = $1 AND status IN ('pending', 'under_review')
       ORDER BY created_at DESC LIMIT 1`,
      [user.id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'No cancellable pending account closure request was found.' },
        { status: 400 }
      );
    }

    const targetReq = existing[0];
    const prevStatus = targetReq.status;

    // Update status to 'cancelled'
    await query(
      `UPDATE popolive.account_closure_requests
       SET status = 'cancelled', cancelled_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [targetReq.id]
    );

    const userAgent = req.headers.get('user-agent') || 'Browser';

    // Insert audit record
    await query(
      `INSERT INTO popolive.closure_audit_records (
        request_id, user_id, action, previous_status, new_status, user_agent
      ) VALUES ($1, $2, 'request_cancelled', $3, 'cancelled', $4)`,
      [targetReq.id, user.id, prevStatus, userAgent]
    );

    // Insert security event
    await query(
      `INSERT INTO popolive.security_events (user_id, event_type, description, device_info)
       VALUES ($1, 'closure_cancelled', $2, $3)`,
      [user.id, `Account closure request ${targetReq.request_number} was cancelled by the user.`, userAgent]
    );

    return NextResponse.json({
      success: true,
      message: 'Your account closure request has been cancelled. Your account remains active.',
      requestNumber: targetReq.request_number,
      status: 'cancelled',
    });
  } catch (err: any) {
    console.error('Error in POST /api/account/closure/cancel:', err);
    return NextResponse.json({ error: 'Failed to cancel closure request.' }, { status: 500 });
  }
}
