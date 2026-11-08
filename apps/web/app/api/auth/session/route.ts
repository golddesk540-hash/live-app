import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('poppo_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const user = await validateSessionToken(sessionToken);

    if (!user) {
      const res = NextResponse.json({ authenticated: false, user: null });
      // Clear expired / invalid cookie
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
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/auth/session:', err);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
