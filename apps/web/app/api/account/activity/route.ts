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

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 5), 50);

    // 1. Fetch sessions/logins
    const sessions = await query(
      `SELECT id, 'login' as activity_type,
              'Login from ' || COALESCE(browser_name, 'Web Browser') || ' on ' || COALESCE(os_name, 'Desktop') as title,
              location, device_type, browser_name, os_name,
              last_active_at, created_at, is_revoked,
              CASE WHEN expires_at > CURRENT_TIMESTAMP AND is_revoked = false THEN true ELSE false END as is_active
       FROM popolive.sessions
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2`,
      [user.id, limit]
    );

    // 2. Fetch security events
    const securityEvents = await query(
      `SELECT id, event_type as activity_type, description as title,
              'Security' as location, 'desktop' as device_type, 'System' as browser_name,
              '' as os_name, created_at as last_active_at, created_at, false as is_revoked, false as is_active
       FROM popolive.security_events
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2`,
      [user.id, limit]
    );

    // Merge and sort by timestamp descending
    const merged = [...sessions, ...securityEvents].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, limit);

    return NextResponse.json({
      success: true,
      activities: merged,
      totalCount: merged.length,
    });
  } catch (err: any) {
    console.error('Error in GET /api/account/activity:', err);
    return NextResponse.json({ error: 'Failed to retrieve account activity.' }, { status: 500 });
  }
}
