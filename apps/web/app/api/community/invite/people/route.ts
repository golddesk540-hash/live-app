import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getInvitedPeople } from '@/lib/communityApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/community/invite/people
 * Returns list of people invited by the caller.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view invited people.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const people = await getInvitedPeople(user.id);

    return NextResponse.json({
      success: true,
      inviterId: user.id,
      invitedPeople: people,
      people,
      count: people.length,
    });
  } catch (err: any) {
    console.error('GET /api/community/invite/people error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve invited people.' },
      { status: err.status || 500 }
    );
  }
}
