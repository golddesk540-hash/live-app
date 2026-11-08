import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const VALID_CATEGORIES = [
  'account_issues',
  'login_problems',
  'profile_problems',
  'security_issues',
  'payments_recharge',
  'coins_gifts',
  'live_streaming',
  'agency_support',
  'other',
];

function generateTicketNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const randomSuffix = crypto.randomInt(1000, 9999);
  return `TK-${yyyy}${mm}${dd}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req).catch(() => null);
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const {
      fullName,
      email,
      poppoId,
      category,
      subject,
      description,
      attachmentUrl,
    } = body;

    // 1. Validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json({ error: 'Please provide your full name (at least 2 characters).' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (poppoId && typeof poppoId === 'string' && !/^\d{4,12}$/.test(poppoId.trim())) {
      return NextResponse.json({ error: 'Popo Live User ID must be a numeric ID.' }, { status: 400 });
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Please select a valid inquiry category.' }, { status: 400 });
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length < 4) {
      return NextResponse.json({ error: 'Subject must be at least 4 characters long.' }, { status: 400 });
    }

    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return NextResponse.json({ error: 'Please provide a detailed description (at least 10 characters).' }, { status: 400 });
    }

    // 2. Generate unique Ticket Number
    let ticketNumber = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
      ticketNumber = generateTicketNumber();
      const existing = await query(`SELECT id FROM popolive.support_tickets WHERE ticket_number = $1 LIMIT 1`, [ticketNumber]);
      if (existing.length === 0) isUnique = true;
      attempts++;
    }

    const userId = user?.id || null;
    const finalPoppoId = (poppoId && poppoId.trim()) || user?.poppo_id || null;

    // 3. Save Ticket to database
    const insertRes = await query<{ id: string }>(
      `INSERT INTO popolive.support_tickets (
        ticket_number, user_id, full_name, email, poppo_id, category, subject, description, attachment_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open')
      RETURNING id`,
      [
        ticketNumber,
        userId,
        fullName.trim(),
        email.trim().toLowerCase(),
        finalPoppoId,
        category,
        subject.trim(),
        description.trim(),
        attachmentUrl || null,
      ]
    );

    const ticketId = insertRes[0].id;

    // 4. Save initial message to ticket_replies
    await query(
      `INSERT INTO popolive.ticket_replies (
        ticket_id, sender_id, sender_type, sender_name, message, attachment_url
      ) VALUES ($1, $2, 'user', $3, $4, $5)`,
      [
        ticketId,
        userId,
        fullName.trim(),
        description.trim(),
        attachmentUrl || null,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Support ticket submitted successfully.',
      ticketId,
      ticketNumber,
      status: 'open',
    });
  } catch (err: any) {
    console.error('Error in POST /api/help/tickets:', err);
    return NextResponse.json({ error: 'Internal server error while saving ticket.' }, { status: 500 });
  }
}
