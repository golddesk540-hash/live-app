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

    const currentToken = req.cookies.get('poppo_session')?.value || '';

    const sessions = await query(
      `SELECT id, session_token, device_type, browser_name, os_name, location, ip_hash,
              created_at, last_active_at, expires_at
       FROM popolive.sessions
       WHERE user_id = $1 AND is_revoked = false AND expires_at > CURRENT_TIMESTAMP
       ORDER BY last_active_at DESC`,
      [user.id]
    );

    const formattedSessions = sessions.map((s: any) => ({
      id: s.id,
      isCurrent: s.session_token === currentToken,
      deviceType: s.device_type || 'desktop',
      browserName: s.browser_name || 'Chrome',
      osName: s.os_name || 'Windows',
      location: s.location || 'Pakistan',
      ipMasked: s.ip_hash ? `192.168.***.${s.ip_hash.substring(0, 3)}` : '127.0.0.1',
      createdAt: s.created_at ? s.created_at.toISOString() : '',
      lastActiveAt: s.last_active_at ? s.last_active_at.toISOString() : '',
      expiresAt: s.expires_at ? s.expires_at.toISOString() : '',
    }));

    return NextResponse.json({
      success: true,
      sessions: formattedSessions,
      totalActive: formattedSessions.length,
    });
  } catch (err: any) {
    console.error('Error in GET /api/account/sessions:', err);
    return NextResponse.json({ error: 'Failed to retrieve active sessions.' }, { status: 500 });
  }
}
