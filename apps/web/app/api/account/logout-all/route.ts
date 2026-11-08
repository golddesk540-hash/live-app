import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const currentToken = req.cookies.get('poppo_session')?.value;

    const res = await query(
      `UPDATE popolive.sessions SET is_revoked = true
       WHERE user_id = $1 AND session_token != $2 AND is_revoked = false`,
      [user.id, currentToken || '']
    );

    await query(
      `INSERT INTO popolive.security_events (user_id, event_type, description, device_info)
       VALUES ($1, 'sessions_revoked_all', 'Logged out from all other devices and active sessions', $2)`,
      [user.id, req.headers.get('user-agent') || 'Browser']
    );

    return NextResponse.json({
      success: true,
      message: 'Successfully logged out from all other devices.',
    });
  } catch (err: any) {
    console.error('Error in POST /api/account/logout-all:', err);
    return NextResponse.json({ error: 'Failed to revoke other sessions.' }, { status: 500 });
  }
}
