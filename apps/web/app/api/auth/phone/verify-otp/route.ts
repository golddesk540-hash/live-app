import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  verifyPhoneOtp,
  generatePoppoId,
  createSession,
  setAuthSessionCookie,
  verifyTermsGateCompliance,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const termsCheck = verifyTermsGateCompliance(req);
    if (!termsCheck.compliant) {
      return NextResponse.json(
        { error: termsCheck.error, code: 'TERMS_NOT_ACCEPTED' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { phone, otp, rememberMe = false } = body;

    const trimmedPhone = (phone || '').replace(/[\s-]/g, '').trim();
    const trimmedOtp = (otp || '').trim();

    if (!trimmedPhone || !trimmedOtp) {
      return NextResponse.json(
        { error: 'Phone number and verification code are required.' },
        { status: 400 }
      );
    }

    // Verify OTP code
    await verifyPhoneOtp(trimmedPhone, trimmedOtp);

    // Find existing user or register new user
    let userRows = await query(
      `SELECT id, poppo_id, email, phone, nickname, avatar_url, gender, is_adult_verified, is_profile_completed, status
       FROM popolive.users
       WHERE phone = $1
       LIMIT 1`,
      [trimmedPhone]
    );

    let user;
    let isNewUser = false;

    if (userRows.length > 0) {
      user = userRows[0];
      if (user.status !== 'active') {
        return NextResponse.json(
          { error: 'This account is suspended or deactivated. Please contact support.', code: 'ACCOUNT_SUSPENDED' },
          { status: 403 }
        );
      }
    } else {
      // Create new user via phone
      isNewUser = true;
      const poppoId = await generatePoppoId();
      const defaultNickname = `Poppo_${poppoId.slice(-4)}`;

      const createdRows = await query(
        `INSERT INTO popolive.users (
          poppo_id, phone, nickname, is_adult_verified, status
        ) VALUES ($1, $2, $3, true, 'active')
        RETURNING id, poppo_id, email, phone, nickname, avatar_url, gender, is_adult_verified, status`,
        [poppoId, trimmedPhone, defaultNickname]
      );
      user = createdRows[0];

      // Link provider
      await query(
        `INSERT INTO popolive.auth_providers (user_id, provider, provider_user_id)
         VALUES ($1, 'phone', $2)`,
        [user.id, trimmedPhone]
      );
    }

    // Create session
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
      isProfileCompleted: Boolean(user.is_profile_completed),
      status: user.status,
      isNewUser,
    };

    const res = NextResponse.json({
      success: true,
      message: isNewUser ? 'Welcome to Popo Live! Account created.' : 'Logged in successfully.',
      user: safeUser,
    });

    setAuthSessionCookie(res, sessionToken, expiresAt);

    return res;
  } catch (err: any) {
    console.error('Error in verify-otp:', err);
    return NextResponse.json(
      { error: err.message || 'OTP verification failed. Please try again.' },
      { status: 400 }
    );
  }
}
