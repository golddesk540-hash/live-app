import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
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
        status: user.status,
        createdAt: user.created_at,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/users/me:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
