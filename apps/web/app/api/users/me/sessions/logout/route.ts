import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, revokeSpecificSession, clearAuthSessionCookie } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 });
    }

    const currentToken = req.cookies.get('poppo_session')?.value;

    // Check if sessionId is current session
    const targetRows = await query(
      `SELECT session_token FROM popolive.sessions WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [sessionId, user.id]
    );

    const revoked = await revokeSpecificSession(user.id, sessionId);
    if (!revoked) {
      return NextResponse.json({ error: 'Session not found or already revoked.' }, { status: 404 });
    }

    const res = NextResponse.json({
      success: true,
      message: 'Session revoked successfully.',
    });

    if (targetRows.length > 0 && targetRows[0].session_token === currentToken) {
      clearAuthSessionCookie(res);
    }

    return res;
  } catch (err: any) {
    console.error('Error in POST /api/users/me/sessions/logout:', err);
    return NextResponse.json({ error: 'Failed to revoke session.' }, { status: 500 });
  }
}
