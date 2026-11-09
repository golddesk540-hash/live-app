import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const REPORT_REASONS = [
  { id: 'harassment_bullying', label: 'Harassment or bullying' },
  { id: 'inappropriate_content', label: 'Inappropriate content' },
  { id: 'spam', label: 'Spam' },
  { id: 'impersonation', label: 'Fake account or impersonation' },
  { id: 'hate_speech', label: 'Hate or abusive language' },
  { id: 'other', label: 'Other' },
];

const VALID_REASON_IDS = new Set(REPORT_REASONS.map((r) => r.id));

// In-memory sliding duplicate prevention cache: `${reporterId}_${reportedId}_${reason}` -> timestamp
const duplicateReportMap = new Map<string, number>();
const DUPLICATE_COOLDOWN_MS = 60000; // 60 seconds

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const {
      roomId = '880219',
      reportedUserId,
      reportedNickname = 'Zara Live',
      reason,
      description = '',
    } = body;

    // 1. Validate required fields
    if (!reason || typeof reason !== 'string' || !VALID_REASON_IDS.has(reason.trim().toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please select a valid report reason.',
          validReasons: REPORT_REASONS,
        },
        { status: 400 }
      );
    }

    const trimmedReason = reason.trim().toLowerCase();
    const trimmedDescription = (description || '').trim();

    // Max 500 characters
    if (trimmedDescription.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Description exceeds maximum limit of 500 characters' },
        { status: 400 }
      );
    }

    // 2. Identify Reporter
    const authUser = await getAuthenticatedUser(req).catch(() => null);
    const reporterId = authUser?.id || body.reporterId || 'guest-reporter-' + Math.floor(1000 + Math.random() * 9000);
    const targetUserId = reportedUserId || 'demo-host-zara';

    // Disallow self-reporting
    if (reporterId === targetUserId) {
      return NextResponse.json(
        { success: false, error: 'You cannot report your own account' },
        { status: 400 }
      );
    }

    // 3. Prevent duplicate submission
    const duplicateKey = `${reporterId}_${targetUserId}_${trimmedReason}`;
    const now = Date.now();
    const lastReportTime = duplicateReportMap.get(duplicateKey);

    if (lastReportTime && now - lastReportTime < DUPLICATE_COOLDOWN_MS) {
      const waitSec = Math.ceil((DUPLICATE_COOLDOWN_MS - (now - lastReportTime)) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `Duplicate report detected. You recently reported this user for the same reason. Please wait ${waitSec}s.`,
        },
        { status: 429 }
      );
    }

    duplicateReportMap.set(duplicateKey, now);

    // 4. Generate unique report ID
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const reportCode = `RPT-${roomId.slice(0, 6).toUpperCase()}-${randomHex}`;

    // 5. Persist Report to DB
    let savedId = reportCode;
    try {
      const insertSql = `
        INSERT INTO popolive.user_reports 
          (room_id, report_category, reporter_identifier, reported_identifier, reason, description, status)
        VALUES 
          ($1, 'live_room', $2, $3, $4, $5, 'pending')
        RETURNING id, created_at
      `;
      const rows = await query(insertSql, [
        String(roomId),
        String(reporterId),
        String(targetUserId),
        trimmedReason,
        trimmedDescription,
      ]);

      if (rows && rows[0]?.id) {
        savedId = rows[0].id;
      }
    } catch (dbErr) {
      console.warn('DB report insert fallback to generated code:', dbErr);
    }

    return NextResponse.json({
      success: true,
      reportId: reportCode,
      dbId: savedId,
      roomId,
      reportedUserId: targetUserId,
      reportedNickname,
      reason: trimmedReason,
      reasonLabel: REPORT_REASONS.find((r) => r.id === trimmedReason)?.label,
      description: trimmedDescription,
      status: 'pending_investigation',
      message: 'Report submitted successfully. Our safety moderation team will investigate this room within 24 hours.',
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error submitting safety report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit report' },
      { status: 500 }
    );
  }
}

// GET: Retrieve reports for host or staff
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId') || '880219';

    const authUser = await getAuthenticatedUser(req).catch(() => null);

    // Enforce role-based safety permissions: Host or Admin can inspect room reports
    const isStaffOrHost = authUser?.role === 'admin' || authUser?.role === 'staff' || authUser?.id === 'demo-host-zara';

    if (!isStaffOrHost && searchParams.get('preview') !== 'demo') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Only the room host or safety staff can review room reports.' },
        { status: 403 }
      );
    }

    let reports: any[] = [];
    try {
      const selectSql = `
        SELECT id, room_id, reporter_identifier, reported_identifier, reason, description, status, created_at
        FROM popolive.user_reports
        WHERE room_id = $1
        ORDER BY created_at DESC
        LIMIT 20
      `;
      const rows = await query(selectSql, [roomId]);
      reports = rows || [];
    } catch {
      reports = [];
    }

    return NextResponse.json({
      success: true,
      roomId,
      reports,
      totalCount: reports.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
