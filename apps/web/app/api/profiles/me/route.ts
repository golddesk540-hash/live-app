import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getMyProfile, updateMyProfile } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

const RESTRICTED_FIELDS = [
  'role',
  'status',
  'wealth_level',
  'wealthLevel',
  'host_level',
  'hostLevel',
  'coins',
  'coinBalance',
  'coin_balance',
  'points',
  'diamond_points',
  'diamondPoints',
  'points_balance',
  'pointsBalance',
  'is_adult_verified',
  'isAdultVerified',
  'is_staff',
  'isStaff',
  'poppo_id',
  'poppoId',
  'go_live_eligible',
  'isHostEligible',
  'vip_level',
  'vipLevel',
  'vip_status',
  'vipStatus',
  'created_at',
  'createdAt',
  'updated_at',
  'updatedAt',
];

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED', error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const profile = await getMyProfile(user);
    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'GET_PROFILE_ERROR' },
      { status: err.status || 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED', error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, code: 'INVALID_PAYLOAD', error: 'Invalid JSON body.' },
        { status: 400 }
      );
    }

    // 1. Ownership & Identity check: Cannot modify another user's profile
    if (
      (body.id !== undefined && body.id !== user.id) ||
      (body.userId !== undefined && body.userId !== user.id) ||
      (body.user_id !== undefined && body.user_id !== user.id)
    ) {
      return NextResponse.json(
        { success: false, code: 'FORBIDDEN', error: "You cannot modify another user's profile." },
        { status: 403 }
      );
    }

    // 2. Restricted fields check: Cannot modify privileged, financial, or internal fields
    for (const field of RESTRICTED_FIELDS) {
      if (body[field] !== undefined) {
        return NextResponse.json(
          {
            success: false,
            code: 'RESTRICTED_FIELD',
            error: `Cannot modify privileged or internal account fields (${field}).`,
          },
          { status: 400 }
        );
      }
    }

    // 3. Field validation: nickname (3-30 chars)
    if (body.nickname !== undefined) {
      if (typeof body.nickname !== 'string' || body.nickname.trim().length < 3 || body.nickname.trim().length > 30) {
        return NextResponse.json(
          { success: false, code: 'INVALID_NICKNAME', error: 'Nickname must be between 3 and 30 characters.' },
          { status: 400 }
        );
      }
    }

    // 4. Field validation: bio (max 500 chars)
    if (body.bio !== undefined) {
      if (typeof body.bio !== 'string' || body.bio.length > 500) {
        return NextResponse.json(
          { success: false, code: 'INVALID_BIO', error: 'Bio cannot exceed 500 characters.' },
          { status: 400 }
        );
      }
    }

    // 5. Field validation: gender (male, female, other, unspecified)
    if (body.gender !== undefined) {
      const g = String(body.gender).toLowerCase().trim();
      if (!['male', 'female', 'other', 'unspecified'].includes(g)) {
        return NextResponse.json(
          { success: false, code: 'INVALID_GENDER', error: 'Gender must be male, female, other, or unspecified.' },
          { status: 400 }
        );
      }
    }

    // 6. Field validation: birthdate (must be valid date and >= 18 years old)
    if (body.birthdate !== undefined && body.birthdate !== null) {
      const dob = new Date(body.birthdate);
      if (isNaN(dob.getTime())) {
        return NextResponse.json(
          { success: false, code: 'INVALID_BIRTHDATE', error: 'Invalid birthdate format.' },
          { status: 400 }
        );
      }
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 18) {
        return NextResponse.json(
          { success: false, code: 'UNDERAGE', error: 'Users must be at least 18 years old.' },
          { status: 400 }
        );
      }
    }

    const updated = await updateMyProfile(user.id, body);

    return NextResponse.json({
      success: true,
      profile: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'UPDATE_PROFILE_ERROR' },
      { status: err.status || 500 }
    );
  }
}
