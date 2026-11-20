import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      const res = NextResponse.json({ authenticated: false, user: null });
      // Clear expired / invalid cookie if present
      res.cookies.set('poppo_session', '', { path: '/', httpOnly: true, maxAge: 0 });
      return res;
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
        isAdultVerified: user.is_adult_verified,
        status: user.status,
        role: user.role || 'user',
        is_staff: Boolean(user.is_staff),
        wealthLevel: user.wealth_level || 1,
        isFaceVerified: Boolean(user.is_face_verified),
        liveCoverUrl: user.live_cover_url || null,
        goLiveEligible: Boolean(user.go_live_eligible),
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/auth/session:', err);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
