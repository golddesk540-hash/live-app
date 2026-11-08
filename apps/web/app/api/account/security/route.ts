import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const userRows = await query(
      `SELECT is_pin_enabled, pin_locked_until, (password_hash IS NOT NULL) as has_password,
              updated_at, created_at
       FROM popolive.users WHERE id = $1 LIMIT 1`,
      [user.id]
    );

    const sessionCountRes = await query(
      `SELECT COUNT(*)::int as count FROM popolive.sessions
       WHERE user_id = $1 AND is_revoked = false AND expires_at > CURRENT_TIMESTAMP`,
      [user.id]
    );

    const recentEvents = await query(
      `SELECT event_type, description, created_at
       FROM popolive.security_events
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 5`,
      [user.id]
    );

    const u = userRows[0];
    const isPinLocked = u?.pin_locked_until ? new Date(u.pin_locked_until) > new Date() : false;

    return NextResponse.json({
      success: true,
      security: {
        hasPassword: Boolean(u?.has_password),
        isPinEnabled: Boolean(u?.is_pin_enabled),
        isPinLocked,
        activeSessionsCount: sessionCountRes[0]?.count || 1,
        lastSecurityUpdate: u?.updated_at || u?.created_at,
        recentEvents,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/account/security:', err);
    return NextResponse.json({ error: 'Failed to retrieve security status.' }, { status: 500 });
  }
}
