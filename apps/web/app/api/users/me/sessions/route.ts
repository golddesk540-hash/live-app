import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getUserActiveSessions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentToken = req.cookies.get('poppo_session')?.value || '';
    const sessions = await getUserActiveSessions(user.id, currentToken);

    return NextResponse.json({
      success: true,
      totalActiveSessions: sessions.length,
      sessions,
    });
  } catch (err: any) {
    console.error('Error in GET /api/users/me/sessions:', err);
    return NextResponse.json({ error: 'Failed to retrieve active sessions.' }, { status: 500 });
  }
}
