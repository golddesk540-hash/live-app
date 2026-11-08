import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const token = req.cookies.get('poppo_session')?.value;

    if (token) {
      await query(`UPDATE popolive.sessions SET is_revoked = true WHERE session_token = $1`, [token]);
    }

    if (user) {
      await query(
        `INSERT INTO popolive.security_events (user_id, event_type, description, device_info)
         VALUES ($1, 'logout', 'Session terminated by user', $2)`,
        [user.id, req.headers.get('user-agent') || 'Browser']
      );
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
    response.cookies.set('poppo_session', '', { path: '/', httpOnly: true, maxAge: 0 });
    return response;
  } catch (err: any) {
    console.error('Error in POST /api/account/logout:', err);
    return NextResponse.json({ error: 'Failed to logout session.' }, { status: 500 });
  }
}
