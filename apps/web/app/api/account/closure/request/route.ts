import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const VALID_REASONS = [
  'no_longer_use',
  'privacy_concerns',
  'technical_problems',
  'create_new_account',
  'unhappy_with_platform',
  'other',
];

function generateClosureRequestNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const randomSuffix = crypto.randomInt(1000, 9999);
  return `CR-${yyyy}${mm}${dd}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
    }

    const { reason, additionalExplanation, password, pin, confirmationAcknowledged } = body;

    // 1. Check if user acknowledged warnings
    if (!confirmationAcknowledged) {
      return NextResponse.json({ error: 'You must acknowledge the account closure terms and warnings.' }, { status: 400 });
    }

    // 2. Validate Reason
    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: 'Please select a valid closure reason.' }, { status: 400 });
    }

    // 3. Check for existing active/pending closure request
    const existingActive = await query(
      `SELECT id, request_number, status, requested_date
       FROM popolive.account_closure_requests
       WHERE user_id = $1 AND status IN ('pending', 'under_review') LIMIT 1`,
      [user.id]
    );

    if (existingActive.length > 0) {
      return NextResponse.json(
        {
          error: 'You already have an active account closure request under review.',
          existingRequest: existingActive[0],
        },
        { status: 409 }
      );
    }

    // 4. Verify Identity (Password or Security PIN)
    const userRows = await query(`SELECT password_hash, pin_hash, is_pin_enabled FROM popolive.users WHERE id = $1 LIMIT 1`, [user.id]);
    const u = userRows[0];

    if (u?.password_hash) {
      if (!password || typeof password !== 'string') {
        return NextResponse.json({ error: 'Current account password is required to request closure.' }, { status: 400 });
      }
      const isPassValid = await bcrypt.compare(password, u.password_hash);
      if (!isPassValid) {
        return NextResponse.json({ error: 'Incorrect account password. Please try again.' }, { status: 400 });
      }
    } else if (u?.is_pin_enabled && u?.pin_hash) {
      if (!pin || typeof pin !== 'string') {
        return NextResponse.json({ error: 'Security PIN is required to verify identity.' }, { status: 400 });
      }
      const isPinValid = await bcrypt.compare(pin, u.pin_hash);
      if (!isPinValid) {
        return NextResponse.json({ error: 'Incorrect Security PIN.' }, { status: 400 });
      }
    }

    // 5. Generate Request Number
    let requestNumber = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
      requestNumber = generateClosureRequestNumber();
      const check = await query(`SELECT id FROM popolive.account_closure_requests WHERE request_number = $1 LIMIT 1`, [requestNumber]);
      if (check.length === 0) isUnique = true;
      attempts++;
    }

    // 6. Save Closure Request
    const insertRes = await query<{ id: string }>(
      `INSERT INTO popolive.account_closure_requests (
        request_number, user_id, reason, additional_explanation, status, requested_date
      ) VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP)
      RETURNING id`,
      [
        requestNumber,
        user.id,
        reason,
        additionalExplanation ? String(additionalExplanation).trim() : null,
      ]
    );

    const requestId = insertRes[0].id;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser';

    // 7. Audit Record
    await query(
      `INSERT INTO popolive.closure_audit_records (
        request_id, user_id, action, previous_status, new_status, user_agent
      ) VALUES ($1, $2, 'request_submitted', NULL, 'pending', $3)`,
      [requestId, user.id, userAgent]
    );

    // 8. Security Event
    await query(
      `INSERT INTO popolive.security_events (user_id, event_type, description, device_info)
       VALUES ($1, 'closure_requested', $2, $3)`,
      [user.id, `Account closure request ${requestNumber} submitted (Reason: ${reason})`, userAgent]
    );

    return NextResponse.json({
      success: true,
      message: 'Account closure request submitted successfully.',
      requestNumber,
      requestId,
      status: 'pending',
    });
  } catch (err: any) {
    console.error('Error in POST /api/account/closure/request:', err);
    return NextResponse.json({ error: 'Internal server error processing closure request.' }, { status: 500 });
  }
}
