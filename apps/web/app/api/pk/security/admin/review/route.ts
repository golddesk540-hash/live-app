import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin =
      searchParams.get('admin') === 'true' || req.headers.get('x-admin-role') === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Administrator privileges are required to review reports.',
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      reportId,
      status, // 'reviewed', 'resolved', 'dismissed'
      reviewNotes = 'Admin reviewed report.',
      adminId = 'admin_security_lead',
      adminName = 'Security Moderator',
    } = body;

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: 'Report ID is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const updateRes = await query<any>(
      `UPDATE popolive.pk_abuse_reports
       SET status = $1,
           review_notes = $2,
           reviewed_by = $3,
           reviewed_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, reviewNotes, adminName, reportId]
    );

    if (!updateRes || updateRes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    const updatedReport = updateRes[0];

    // Log admin audit record
    await query(
      `INSERT INTO popolive.pk_security_audit_logs (
         action, target_id, admin_id, admin_name, notes
       ) VALUES ($1, $2, $3, $4, $5)`,
      [
        `report_${status}`,
        reportId,
        adminId,
        adminName,
        `Report ${reportId} marked as ${status}. Notes: ${reviewNotes}`,
      ]
    );

    return NextResponse.json({
      success: true,
      report: {
        id: updatedReport.id,
        battleId: updatedReport.battle_id,
        category: updatedReport.category,
        status: updatedReport.status,
        reviewNotes: updatedReport.review_notes,
        reviewedBy: updatedReport.reviewed_by,
        reviewedAt: updatedReport.reviewed_at,
      },
      message: `Report ${reportId} marked as ${status}.`,
    });
  } catch (err: any) {
    console.error('API /api/pk/security/admin/review error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update report' },
      { status: 500 }
    );
  }
}
