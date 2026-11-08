import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  verifyPassword,
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
    const { identifier, email, password, rememberMe = false } = body;

    const loginId = (identifier || email || '').trim().toLowerCase();

    if (!loginId) {
      return NextResponse.json(
        { error: 'Please enter your email or phone number.' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Please enter your password.' },
        { status: 400 }
      );
    }

    // 2. Brute-force rate limiting: 5 failed attempts per 15 minutes per login identifier
    const rateCheck = await checkRateLimit(`login_${loginId}`, 5, 900);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too many failed login attempts. For security, your account has been temporarily rate-limited. Please try again in 15 minutes or use Forgot Password.',
          code: 'RATE_LIMITED',
        },
        { status: 429 }
      );
    }

    // 3. Find user by email, phone, or poppo_id
    const rows = await query(
      `SELECT id, poppo_id, email, phone, password_hash, nickname, avatar_url,
              gender, birthdate, is_adult_verified, status, created_at
       FROM popolive.users
       WHERE LOWER(email) = $1 OR phone = $1 OR poppo_id = $1
       LIMIT 1`,
      [loginId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No account found with this email or phone number.', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const user = rows[0];

    // Check account status
    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Your account is suspended or closed. Please contact support.', code: 'ACCOUNT_INACTIVE' },
        { status: 403 }
      );
    }

    if (!user.password_hash) {
      return NextResponse.json(
        {
          error: 'This account was registered using social login or phone OTP. Please use the appropriate login method or reset your password.',
          code: 'NO_PASSWORD_SET',
        },
        { status: 400 }
      );
    }

    // 4. Verify password hash
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password. Please try again.', code: 'INVALID_PASSWORD' },
        { status: 401 }
      );
    }

    // 5. Create secure session
    const { sessionToken, expiresAt } = await createSession(user.id, req, !!rememberMe);

    const safeUser = {
      id: user.id,
      poppoId: user.poppo_id,
      email: user.email,
      phone: user.phone,
      nickname: user.nickname,
      avatarUrl: user.avatar_url,
      gender: user.gender,
      isAdultVerified: user.is_adult_verified,
      status: user.status,
    };

    const res = NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      user: safeUser,
    });

    setAuthSessionCookie(res, sessionToken, expiresAt);

    return res;
  } catch (err: any) {
    console.error('Error in POST /api/auth/login:', err);
    return NextResponse.json(
      { error: 'Internal server error during authentication.' },
      { status: 500 }
    );
  }
}
