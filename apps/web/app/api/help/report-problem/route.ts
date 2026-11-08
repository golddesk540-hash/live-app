import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const PROBLEM_CATEGORIES = [
  'broken_pages',
  'login_errors',
  'profile_errors',
  'payment_errors',
  'display_problems',
  'other',
];

function generateReportNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const randomSuffix = crypto.randomInt(1000, 9999);
  return `TR-${yyyy}${mm}${dd}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req).catch(() => null);
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
    }

    const {
      category,
      pageOrFeature,
      description,
      browserInfo,
      deviceType,
      attachmentUrl,
    } = body;

    // Validation
    if (!category || !PROBLEM_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Please choose a valid problem category.' }, { status: 400 });
    }

    if (!pageOrFeature || typeof pageOrFeature !== 'string' || pageOrFeature.trim().length < 2) {
      return NextResponse.json({ error: 'Please specify the affected page or feature.' }, { status: 400 });
    }

    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return NextResponse.json({ error: 'Please provide a clear description of the problem (at least 10 characters).' }, { status: 400 });
    }

    let reportNumber = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
      reportNumber = generateReportNumber();
      const existing = await query(`SELECT id FROM popolive.technical_reports WHERE report_number = $1 LIMIT 1`, [reportNumber]);
      if (existing.length === 0) isUnique = true;
      attempts++;
    }

    const insertRes = await query<{ id: string }>(
      `INSERT INTO popolive.technical_reports (
        report_number, user_id, category, page_or_feature, description, browser_info, device_type, attachment_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING id`,
      [
        reportNumber,
        user?.id || null,
        category,
        pageOrFeature.trim(),
        description.trim(),
        browserInfo ? String(browserInfo).substring(0, 255) : null,
        deviceType ? String(deviceType).substring(0, 64) : 'desktop',
        attachmentUrl || null,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Technical problem report submitted successfully. Our engineering team has received it.',
      reportId: insertRes[0].id,
      reportNumber,
    });
  } catch (err: any) {
    console.error('Error in POST /api/help/report-problem:', err);
    return NextResponse.json({ error: 'Failed to record technical report.' }, { status: 500 });
  }
}
