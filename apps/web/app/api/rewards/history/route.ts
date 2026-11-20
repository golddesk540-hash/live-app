import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getRewardsHistory } from '@/lib/vipApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rewards/history
 * PART 4 & Test 10:
 * Returns task reward claim history for the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view rewards history.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const history = await getRewardsHistory(user.id);

    return NextResponse.json({
      success: true,
      userId: user.id,
      history,
      total: history.length,
    });
  } catch (err: any) {
    console.error('GET /api/rewards/history error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve rewards history.' },
      { status: 500 }
    );
  }
}
