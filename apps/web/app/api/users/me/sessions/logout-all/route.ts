import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, revokeAllOtherSessions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentToken = req.cookies.get('poppo_session')?.value || '';
    const terminatedCount = await revokeAllOtherSessions(user.id, currentToken);

    return NextResponse.json({
      success: true,
      message: `Terminated ${terminatedCount} other active session(s). Your current session remains active.`,
      terminatedCount,
    });
  } catch (err: any) {
    console.error('Error in POST /api/users/me/sessions/logout-all:', err);
    return NextResponse.json({ error: 'Failed to revoke other sessions.' }, { status: 500 });
  }
}
