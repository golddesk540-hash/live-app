import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, checkRateLimit } from '@/lib/auth';
import { resolveUserByIdentifier } from '@/lib/userLookup';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const VALID_REPORT_REASONS = [
  'harassment',
  'inappropriate_content',
  'spam_fraud',
  'underage_streamer',
  'impersonation',
  'hate_speech',
  'copyright_violation',
  'other',
];

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const viewer = await getAuthenticatedUser(req);
    if (!viewer) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to submit a report.' }, { status: 401 });
    }

    const targetUser = await resolveUserByIdentifier(params.userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found.' }, { status: 404 });
    }

    if (viewer.id === targetUser.id) {
      return NextResponse.json({ error: 'You cannot report your own account.' }, { status: 400 });
    }

    // Rate limit: max 5 reports per hour
    const rateCheck = await checkRateLimit(`report_${viewer.id}`, 5, 3600);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'You have submitted too many reports recently. Please wait before reporting again.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawReason = String(body.reason || 'other').toLowerCase();
    const reason = VALID_REPORT_REASONS.includes(rawReason) ? rawReason : 'other';
    const description = String(body.description || '').trim().slice(0, 1000);

    await query(
      `INSERT INTO popolive.user_reports (reporter_id, reported_id, reason, description, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [viewer.id, targetUser.id, reason, description]
    );

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully. Our safety moderation team will investigate this account within 24 hours.',
    });
  } catch (err: any) {
    console.error('Error in POST /api/users/[userId]/report:', err);
    return NextResponse.json({ error: 'Failed to submit report.' }, { status: 500 });
  }
}
