import { NextRequest, NextResponse } from 'next/server';
import { destroySession, clearAuthSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const sessionToken = req.cookies.get('poppo_session')?.value || bearerToken;
    if (sessionToken) {
      await destroySession(sessionToken);
    }

    const res = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    clearAuthSessionCookie(res);

    return res;
  } catch (err: any) {
    console.error('Error in POST /api/auth/logout:', err);
    return NextResponse.json({ error: 'Failed to log out.' }, { status: 500 });
  }
}
