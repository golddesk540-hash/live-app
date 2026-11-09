import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const body = await req.json().catch(() => ({}));
    const authUser = await getAuthenticatedUser(req).catch(() => null);

    const reporterId = body.reporterId || authUser?.id || 'viewer_anonymous';
    const reportedUserId = body.reportedUserId;
    const ruleId = body.ruleId;
    const reason = (body.reason || 'Violation of party rules').trim();

    if (!reportedUserId) {
      return NextResponse.json(
        { success: false, error: 'Reported user ID is required.' },
        { status: 400 }
      );
    }

    if (!ruleId) {
      return NextResponse.json(
        { success: false, error: 'Rule ID is required.' },
        { status: 400 }
      );
    }

    // 1. Insert into party_rule_violations
    const violRes = await query(
      `INSERT INTO popolive.party_rule_violations
        (room_number, reporter_id, reported_user_id, rule_id, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, room_number, reporter_id, reported_user_id, rule_id, status, created_at`,
      [roomId, reporterId, reportedUserId, ruleId, reason]
    );

    const violation = violRes?.[0];

    // 2. Cross-link to popolive.user_reports (Safety Tools integration)
    try {
      await query(
        `INSERT INTO popolive.user_reports
          (room_id, report_category, reporter_identifier, reported_identifier, reason)
         VALUES ($1, 'party_rule_violation', $2, $3, $4)`,
        [roomId, reporterId, reportedUserId, `[Rule: ${ruleId}] ${reason}`]
      );
    } catch (crossErr) {
      // Non-fatal if user_reports columns have slight variations
      console.warn('Cross-logging report to user_reports non-fatal warning:', crossErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully. Thank you for keeping Popo Live safe.',
      violationId: violation?.id,
      roomNumber: roomId,
      reportedUserId,
      ruleId,
    });
  } catch (error: any) {
    console.error('Error reporting party rule violation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error submitting report' },
      { status: 500 }
    );
  }
}
