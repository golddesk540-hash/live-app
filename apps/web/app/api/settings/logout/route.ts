import { NextRequest, NextResponse } from 'next/server';
import { clearAuthSessionCookie, destroySession } from '@/lib/auth';
import { logoutUser } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const sessionToken = req.cookies.get('poppo_session')?.value || bearerToken;

    if (sessionToken) {
      await logoutUser(sessionToken);
      await destroySession(sessionToken);
    }

    const res = NextResponse.json({
      success: true,
      message: 'Logged out successfully.',
    });

    clearAuthSessionCookie(res);
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'LOGOUT_ERROR' },
      { status: err.status || 500 }
    );
  }
}
