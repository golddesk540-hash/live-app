import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  hashPassword,
  generatePoppoId,
  createSession,
  setAuthSessionCookie,
  verifyTermsGateCompliance,
  checkRateLimit,
  calculateAge,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      email,
      phone,
      password,
      nickname,
      birthdate,
      gender = 'unspecified',
      country = 'Pakistan',
      countryCode = 'PK',
      isAdultConfirmed,
    } = body;

    // 1. Mandatory 18+ check if explicitly submitted as false
    if (isAdultConfirmed === false) {
      return NextResponse.json(
        { error: 'You must confirm that you are at least 18 years of age to register on Popo Live.', code: 'UNDER_18_RESTRICTION' },
        { status: 400 }
      );
    }

    // 2. Verify Terms Gate & 18+ compliance (unless adult confirmation is explicitly accepted)
    const termsCheck = verifyTermsGateCompliance(req);
    if (!termsCheck.compliant && isAdultConfirmed !== true) {
      return NextResponse.json(
        { error: termsCheck.error || 'Terms of Service acceptance required.', code: 'TERMS_NOT_ACCEPTED' },
        { status: 403 }
      );
    }

    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedPhone = (phone || '').replace(/[\s-]/g, '').trim();

    // 2. Identifier validation: at least email or phone required
    if (!trimmedEmail && !trimmedPhone) {
      return NextResponse.json(
        { error: 'Please provide either an email address or a phone number.', code: 'MISSING_IDENTIFIER' },
        { status: 400 }
      );
    }

    if (trimmedEmail && !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address format.', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    if (trimmedPhone && !/^\+?[1-9]\d{6,14}$/.test(trimmedPhone) && !/^03\d{9}$/.test(trimmedPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please enter a valid number.', code: 'INVALID_PHONE' },
        { status: 400 }
      );
    }

    // 3. Password strength check: minimum 8 characters
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.', code: 'WEAK_PASSWORD' },
        { status: 400 }
      );
    }

    // 4. Mandatory 18+ Age Verification
    if (isAdultConfirmed === false) {
      return NextResponse.json(
        { error: 'You must confirm that you are at least 18 years of age to register on Popo Live.', code: 'UNDER_18_RESTRICTION' },
        { status: 400 }
      );
    }

    let isAdultVerified = true;
    let sanitizedBirthdate: string | null = null;

    if (birthdate) {
      const birthStr = String(birthdate).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(birthStr)) {
        return NextResponse.json(
          { error: 'Invalid birthdate format. Please provide a valid date in YYYY-MM-DD format.', code: 'INVALID_BIRTHDATE' },
          { status: 400 }
        );
      }

      const birthDateObj = new Date(birthStr);
      const today = new Date();
      if (isNaN(birthDateObj.getTime()) || birthDateObj > today || birthDateObj.getFullYear() < 1900) {
        return NextResponse.json(
          { error: 'Invalid birthdate. Date cannot be in the future or unrealistic.', code: 'INVALID_BIRTHDATE' },
          { status: 400 }
        );
      }

      const calculatedAge = calculateAge(birthStr);
      if (calculatedAge < 18) {
        return NextResponse.json(
          {
            error: `Registration requires a minimum age of 18 years. Current calculated age: ${calculatedAge}. Accounts for minors are not permitted.`,
            code: 'UNDER_18_RESTRICTION',
            age: calculatedAge,
          },
          { status: 400 }
        );
      }

      sanitizedBirthdate = birthStr;
      isAdultVerified = true;
    } else if (!isAdultConfirmed) {
      return NextResponse.json(
        { error: 'You must confirm that you are at least 18 years of age to register on Popo Live.', code: 'UNDER_18_RESTRICTION' },
        { status: 400 }
      );
    }

    // 5. Rate limit registrations: max 5 per hour per IP (relaxed in development/testing)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const maxRegPerIp = (process.env.NODE_ENV !== 'production' || clientIp === '127.0.0.1' || clientIp === '::1') ? 200 : 5;
    const rateCheck = await checkRateLimit(`reg_${clientIp}`, maxRegPerIp, 3600);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many registrations from this IP address. Please try again later.', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    // 6. Check existing duplicate email
    if (trimmedEmail) {
      const emailCheck = await query('SELECT id FROM popolive.users WHERE LOWER(email) = LOWER($1) LIMIT 1', [trimmedEmail]);
      if (emailCheck.length > 0) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please log in.', code: 'EMAIL_EXISTS' },
          { status: 409 }
        );
      }
    }

    // 7. Check existing duplicate phone
    if (trimmedPhone) {
      const phoneCheck = await query('SELECT id FROM popolive.users WHERE phone = $1 LIMIT 1', [trimmedPhone]);
      if (phoneCheck.length > 0) {
        return NextResponse.json(
          { error: 'An account with this phone number already exists. Please log in.', code: 'PHONE_EXISTS' },
          { status: 409 }
        );
      }
    }

    // 8. Hash password securely & generate unique numeric Poppo ID
    const passwordHash = await hashPassword(password);
    const poppoId = await generatePoppoId();
    const displayName = (nickname || '').trim() || `User_${poppoId.slice(-4)}`;

    // 9. Insert into PostgreSQL popolive.users
    const userRows = await query(
      `INSERT INTO popolive.users (
        poppo_id, email, phone, password_hash, nickname, avatar_url,
        gender, birthdate, is_adult_verified, status,
        country, country_code, is_profile_completed,
        wealth_level, host_level, role, go_live_eligible
      ) VALUES (
        $1, $2, $3, $4, $5, '/avatars/default.png',
        $6, $7, $8, 'active',
        $9, $10, false,
        1, 1, 'user', false
      )
      RETURNING id, poppo_id, email, phone, nickname, avatar_url,
                gender, birthdate, is_adult_verified, status,
                country, country_code, is_profile_completed,
                wealth_level, host_level, role, go_live_eligible, created_at`,
      [
        poppoId,
        trimmedEmail || null,
        trimmedPhone || null,
        passwordHash,
        displayName,
        gender,
        sanitizedBirthdate,
        isAdultVerified,
        country,
        countryCode,
      ]
    );

    const newUser = userRows[0];

    // 10. Create authenticated session in popolive.sessions
    const { sessionToken, expiresAt } = await createSession(newUser.id, req, false);

    const formatIsoDate = (d: any): string | null => {
      if (!d) return null;
      if (typeof d === 'string') return d.split('T')[0];
      if (d instanceof Date) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
      return String(d);
    };

    const safeUser = {
      id: newUser.id,
      poppoId: newUser.poppo_id,
      email: newUser.email,
      phone: newUser.phone,
      nickname: newUser.nickname,
      avatarUrl: newUser.avatar_url,
      gender: newUser.gender,
      birthdate: sanitizedBirthdate || formatIsoDate(newUser.birthdate),
      isAdultVerified: Boolean(newUser.is_adult_verified),
      isProfileCompleted: Boolean(newUser.is_profile_completed),
      status: newUser.status,
      country: newUser.country,
      countryCode: newUser.country_code,
      wealthLevel: Number(newUser.wealth_level || 1),
      hostLevel: Number(newUser.host_level || 1),
      role: newUser.role || 'user',
      goLiveEligible: Boolean(newUser.go_live_eligible),
      createdAt: newUser.created_at ? (typeof newUser.created_at === 'string' ? newUser.created_at : newUser.created_at.toISOString()) : new Date().toISOString(),
    };

    const res = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: safeUser,
      sessionToken,
    });

    setAuthSessionCookie(res, sessionToken, expiresAt);

    return res;
  } catch (err: any) {
    console.error('Error in POST /api/auth/register:', err);
    if (err.code === '23505') {
      if (err.constraint === 'users_email_key' || (err.detail && err.detail.includes('email'))) {
        return NextResponse.json({ error: 'An account with this email already exists.', code: 'EMAIL_EXISTS' }, { status: 409 });
      }
      if (err.constraint === 'users_phone_key' || (err.detail && err.detail.includes('phone'))) {
        return NextResponse.json({ error: 'An account with this phone number already exists.', code: 'PHONE_EXISTS' }, { status: 409 });
      }
    }
    return NextResponse.json(
      { error: 'Internal server error creating account.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
