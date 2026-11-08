import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  getAuthenticatedUser,
  validateNicknameFormat,
  calculateAge,
  verifyTermsGateCompliance,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to view profile setup.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      needsSetup: !user.is_profile_completed,
      user: {
        id: user.id,
        poppoId: user.poppo_id,
        email: user.email,
        phone: user.phone,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
        gender: user.gender,
        birthdate: user.birthdate,
        country: user.country,
        countryCode: user.country_code,
        isProfileCompleted: user.is_profile_completed,
        isAdultVerified: user.is_adult_verified,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/profile/setup:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve profile setup state.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Terms Gate compliance
    const termsCheck = verifyTermsGateCompliance(req);
    if (!termsCheck.compliant) {
      return NextResponse.json(
        { error: termsCheck.error, code: 'TERMS_NOT_ACCEPTED' },
        { status: 403 }
      );
    }

    // 2. Verify Session
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to complete profile setup.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      nickname,
      birthdate,
      country = 'Pakistan',
      countryCode = 'PK',
      gender = 'unspecified',
      avatarUrl,
    } = body;

    // 3. Nickname Validation
    const trimmedNickname = (nickname || '').trim();
    const nicknameValidation = validateNicknameFormat(trimmedNickname);
    if (!nicknameValidation.valid) {
      return NextResponse.json(
        { error: nicknameValidation.error, code: 'INVALID_NICKNAME' },
        { status: 400 }
      );
    }

    // Check duplicate nickname against other users
    const duplicateCheck = await query(
      `SELECT id FROM popolive.users WHERE LOWER(nickname) = LOWER($1) AND id != $2 LIMIT 1`,
      [trimmedNickname, user.id]
    );
    if (duplicateCheck.length > 0) {
      return NextResponse.json(
        { error: 'This nickname is already in use by another user.', code: 'NICKNAME_TAKEN' },
        { status: 409 }
      );
    }

    // 4. Birthday Validation & Strict 18+ Age Calculation
    if (!birthdate) {
      return NextResponse.json(
        { error: 'Please select your date of birth.', code: 'MISSING_BIRTHDATE' },
        { status: 400 }
      );
    }

    const parsedDate = new Date(birthdate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid calendar date format for birthday.', code: 'INVALID_DATE' },
        { status: 400 }
      );
    }

    const today = new Date();
    if (parsedDate > today) {
      return NextResponse.json(
        { error: 'Birthdate cannot be in the future.', code: 'FUTURE_DATE' },
        { status: 400 }
      );
    }

    // Calculate age on the backend
    const age = calculateAge(birthdate);
    if (age < 18) {
      return NextResponse.json(
        {
          error: 'You must be at least 18 years of age to register and stream on Popo Live.',
          code: 'UNDER_18_RESTRICTION',
          calculatedAge: age,
        },
        { status: 400 }
      );
    }

    // 5. Gender Validation
    const validGenders = ['male', 'female', 'other', 'unspecified'];
    const sanitizedGender = validGenders.includes(gender?.toLowerCase()) ? gender.toLowerCase() : 'unspecified';

    // 6. Country Validation
    const sanitizedCountry = (country || 'Pakistan').trim();
    const sanitizedCountryCode = (countryCode || 'PK').trim().toUpperCase();

    // 7. Avatar URL handling (preserve default or existing if not provided)
    const finalAvatar = avatarUrl && typeof avatarUrl === 'string' && avatarUrl.length > 3
      ? avatarUrl
      : user.avatar_url || '/avatars/default.png';

    // 8. Update in PostgreSQL
    const updatedRows = await query(
      `UPDATE popolive.users
       SET nickname = $1,
           birthdate = $2,
           country = $3,
           country_code = $4,
           gender = $5,
           avatar_url = $6,
           is_profile_completed = true,
           is_adult_verified = true,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate, country, country_code, is_profile_completed, is_adult_verified, status`,
      [
        trimmedNickname,
        birthdate,
        sanitizedCountry,
        sanitizedCountryCode,
        sanitizedGender,
        finalAvatar,
        user.id,
      ]
    );

    const updatedUser = updatedRows[0];

    return NextResponse.json({
      success: true,
      message: 'Profile completed successfully!',
      user: {
        id: updatedUser.id,
        poppoId: updatedUser.poppo_id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        nickname: updatedUser.nickname,
        avatarUrl: updatedUser.avatar_url,
        gender: updatedUser.gender,
        birthdate: updatedUser.birthdate ? updatedUser.birthdate.toISOString().split('T')[0] : null,
        country: updatedUser.country,
        countryCode: updatedUser.country_code,
        isProfileCompleted: updatedUser.is_profile_completed,
        isAdultVerified: updatedUser.is_adult_verified,
        status: updatedUser.status,
      },
    });
  } catch (err: any) {
    console.error('Error in POST /api/profile/setup:', err);
    return NextResponse.json(
      { error: 'Failed to update profile. Please try again.' },
      { status: 500 }
    );
  }
}
