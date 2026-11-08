import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const FEEDBACK_TYPES = [
  'general_feedback',
  'website_experience',
  'feature_request',
  'bug_report',
  'design_suggestion',
  'other',
];

function generateFeedbackNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const randomSuffix = crypto.randomInt(1000, 9999);
  return `FB-${yyyy}${mm}${dd}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req).catch(() => null);
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
    }

    const {
      feedbackType,
      subject,
      message,
      rating,
      isAnonymous,
      contactEmail,
    } = body;

    // Validation
    if (!feedbackType || !FEEDBACK_TYPES.includes(feedbackType)) {
      return NextResponse.json({ error: 'Please choose a valid feedback category.' }, { status: 400 });
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
      return NextResponse.json({ error: 'Subject must be at least 3 characters long.' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return NextResponse.json({ error: 'Message must be at least 5 characters long.' }, { status: 400 });
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: 'Please provide a star rating between 1 and 5.' }, { status: 400 });
    }

    // Rate limit / duplicate check: prevent rapid submissions from same user or email within 30 seconds
    const anonymousFlag = Boolean(isAnonymous);
    const effectiveUserId = anonymousFlag ? null : user?.id || null;
    const effectiveEmail = anonymousFlag ? null : contactEmail || user?.email || null;

    if (effectiveUserId) {
      const recent = await query(
        `SELECT id FROM popolive.user_feedbacks 
         WHERE user_id = $1 AND created_at > (CURRENT_TIMESTAMP - INTERVAL '15 seconds') LIMIT 1`,
        [effectiveUserId]
      );
      if (recent.length > 0) {
        return NextResponse.json({ error: 'Please wait a few moments before submitting additional feedback.' }, { status: 429 });
      }
    }

    let feedbackNumber = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
      feedbackNumber = generateFeedbackNumber();
      const existing = await query(`SELECT id FROM popolive.user_feedbacks WHERE feedback_number = $1 LIMIT 1`, [feedbackNumber]);
      if (existing.length === 0) isUnique = true;
      attempts++;
    }

    const insertRes = await query<{ id: string }>(
      `INSERT INTO popolive.user_feedbacks (
        feedback_number, user_id, feedback_type, subject, message, rating, is_anonymous, contact_email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        feedbackNumber,
        effectiveUserId,
        feedbackType,
        subject.trim(),
        message.trim(),
        numRating,
        anonymousFlag,
        effectiveEmail,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback! Your feedback reference number is ' + feedbackNumber,
      feedbackId: insertRes[0].id,
      feedbackNumber,
    });
  } catch (err: any) {
    console.error('Error in POST /api/help/feedback:', err);
    return NextResponse.json({ error: 'Failed to record feedback.' }, { status: 500 });
  }
}
