import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PKAbuseReportCategory } from '@/lib/pk';

export const dynamic = 'force-dynamic';

const VALID_CATEGORIES: PKAbuseReportCategory[] = [
  'fake_traffic',
  'gift_abuse',
  'multi_account',
  'score_manipulation',
  'cheating',
  'invitation_abuse',
  'spam',
  'suspicious_behavior',
  'other',
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      battleId = '00000000-0000-0000-0000-000000000603',
      reporterId = 'user_viewer_9001',
      reporterName = 'Ali',
      reportedUserId = '00000000-0000-0000-0000-000000088202',
      reportedUserName = 'Ayesha',
      category,
      description,
    } = body;

    // 1. Validate Category
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid report category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 2. Validate Description
    if (!description || description.trim().length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide a detailed description (at least 5 characters).',
        },
        { status: 400 }
      );
    }

    // 3. Deduplication Check (Max 1 report per reporter/battle/category within 5 minutes)
    const recentReport = await query<any>(
      `SELECT id, created_at 
       FROM popolive.pk_abuse_reports 
       WHERE reporter_id = $1 
         AND battle_id = $2 
         AND category = $3 
         AND created_at > NOW() - INTERVAL '5 minutes'`,
      [reporterId, battleId, category]
    );

    if (recentReport.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'You have recently submitted a report for this category. Our moderation team is already reviewing it. Please wait before submitting another report.',
          code: 'DUPLICATE_REPORT_COOLDOWN',
        },
        { status: 429 }
      );
    }

    // 4. Insert Report
    const insertRes = await query<any>(
      `INSERT INTO popolive.pk_abuse_reports (
         battle_id, reporter_id, reporter_name, reported_user_id, reported_user_name, category, description, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *;`,
      [
        battleId,
        reporterId,
        reporterName,
        reportedUserId,
        reportedUserName,
        category,
        description.trim(),
      ]
    );

    const report = insertRes[0];

    // Log security event for visibility
    await query(
      `INSERT INTO popolive.pk_security_events (
         user_id, battle_id, event_type, severity, reason, metadata
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        reporterId,
        battleId,
        'pk_abuse_report_submitted',
        'medium',
        `Viewer ${reporterName} filed a report for category ${category}.`,
        JSON.stringify({ reportId: report.id, category, reportedUserId, reportedUserName }),
      ]
    ).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        reportId: report.id,
        category: report.category,
        status: report.status,
        submittedAt: report.created_at,
        message: 'Your report has been submitted to the safety and moderation team.',
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('API /api/pk/security/report error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to submit abuse report' },
      { status: 500 }
    );
  }
}
