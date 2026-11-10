import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const battleId = searchParams.get('battleId');
    const reportedUserId = searchParams.get('reportedUserId');
    const search = searchParams.get('search');
    const isAdmin = searchParams.get('admin') === 'true' || req.headers.get('x-admin-role') === 'admin';

    // Verify authorized administrator access
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Administrator privileges are required to access security reports.',
        },
        { status: 403 }
      );
    }

    let sql = `
      SELECT id, battle_id, reporter_id, reporter_name, reported_user_id, reported_user_name,
             category, description, status, review_notes, reviewed_by, reviewed_at, created_at
      FROM popolive.pk_abuse_reports
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    if (battleId) {
      params.push(battleId);
      sql += ` AND battle_id = $${params.length}`;
    }

    if (reportedUserId) {
      params.push(reportedUserId);
      sql += ` AND reported_user_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (description ILIKE $${params.length} OR reported_user_name ILIKE $${params.length} OR reporter_name ILIKE $${params.length})`;
    }

    sql += ` ORDER BY created_at DESC LIMIT 50`;

    const reports = await query<any>(sql, params);

    return NextResponse.json({
      success: true,
      reports: reports.map((r: any) => ({
        id: r.id,
        battleId: r.battle_id,
        reporterId: r.reporter_id,
        reporterName: r.reporter_name,
        reportedUserId: r.reported_user_id,
        reportedUserName: r.reported_user_name,
        category: r.category,
        description: r.description,
        status: r.status,
        reviewNotes: r.review_notes,
        reviewedBy: r.reviewed_by,
        reviewedAt: r.reviewed_at,
        createdAt: r.created_at,
      })),
      count: reports.length,
    });
  } catch (err: any) {
    console.error('API /api/pk/security/admin/reports error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve security reports' },
      { status: 500 }
    );
  }
}
