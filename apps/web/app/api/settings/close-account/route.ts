import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, clearAuthSessionCookie } from '@/lib/auth';
import { closeAccount, assertAdult } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }
    assertAdult(user, 'close account');

    let reason = 'User requested account closure';
    try {
      const body = await req.json();
      if (body?.reason) reason = body.reason;
    } catch {}

    const res = await closeAccount(user, reason);
    const response = NextResponse.json(res);
    clearAuthSessionCookie(response);
    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'CLOSE_ACCOUNT_ERROR' },
      { status: err.status || 500 }
    );
  }
}
