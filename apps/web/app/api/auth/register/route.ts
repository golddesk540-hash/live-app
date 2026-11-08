import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  hashPassword,
  generatePoppoId,
  createSession,
  setAuthSessionCookie,
  verifyTermsGateCompliance,
  checkRateLimit,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Terms Gate & 18+ compliance first
    const termsCheck = verifyTermsGateCompliance(req);
    if (!termsCheck.compliant) {
      return NextResponse.json(
        { error: termsCheck.error, code: 'TERMS_NOT_ACCEPTED' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email, phone, password, nickname, isAdultConfirmed } = body;

    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedPhone = (phone || '').trim();

    if (!trimmedEmail && !trimmedPhone) {
      return NextResponse.json(
        { error: 'Please provide either an email address or a phone number.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (!isAdultConfirmed) {
      return NextResponse.json(
        { error: 'You must confirm that you are at least 18 years of age to register on Popo Live.' },
        { status: 400 }
      );
    }

    // Rate limit registrations: max 5 per hour per IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateCheck = await checkRateLimit(`reg_${clientIp}`, 5, 3600);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many registrations from this IP address. Please try again later.' },
        { status: 429 }
      );
    }

    // Check existing email
    if (trimmedEmail) {
      const emailCheck = await query('SELECT id FROM popolive.users WHERE LOWER(email) = $1 LIMIT 1', [trimmedEmail]);
      if (emailCheck.length > 0) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please log in.', code: 'EMAIL_EXISTS' },
          { status: 409 }
        );
      }
    }

    // Check existing phone
    if (trimmedPhone) {
      const phoneCheck = await query('SELECT id FROM popolive.users WHERE phone = $1 LIMIT 1', [trimmedPhone]);
      if (phoneCheck.length > 0) {
        return NextResponse.json(
          { error: 'An account with this phone number already exists. Please log in.', code: 'PHONE_EXISTS' },
          { status: 409 }
        );
      }
    }

    // Hash password & generate unique numeric Poppo ID
    const passwordHash = await hashPassword(password);
    const poppoId = await generatePoppoId();
    const displayName = (nickname || '').trim() || `User_${poppoId.slice(-4)}`;

    const userRows = await query(
      `INSERT INTO popolive.users (
        poppo_id, email, phone, password_hash, nickname, is_adult_verified, status
      ) VALUES ($1, $2, $3, $4, $5, true, 'active')
      RETURNING id, poppo_id, email, phone, nickname, avatar_url, gender, is_adult_verified, status, created_at`,
      [poppoId, trimmedEmail || null, trimmedPhone || null, passwordHash, displayName]
    );

    const newUser = userRows[0];

    // Create session
    const { sessionToken, expiresAt } = await createSession(newUser.id, req, false);

    const res = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        poppoId: newUser.poppo_id,
        email: newUser.email,
        phone: newUser.phone,
        nickname: newUser.nickname,
        avatarUrl: newUser.avatar_url,
        gender: newUser.gender,
        isAdultVerified: newUser.is_adult_verified,
        isProfileCompleted: false,
        status: newUser.status,
      },
    });

    setAuthSessionCookie(res, sessionToken, expiresAt);

    return res;
  } catch (err: any) {
    console.error('Error in POST /api/auth/register:', err);
    return NextResponse.json(
      { error: 'Internal server error creating account.' },
      { status: 500 }
    );
  }
}
