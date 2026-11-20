import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getRewardsList } from '@/lib/vipApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rewards
 * PART 4 & Test 7:
 * Returns task rows with progress, target, and claimable flag.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view rewards.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const tasks = await getRewardsList(user.id);
    const claimableCount = tasks.filter((t) => t.isClaimable).length;

    return NextResponse.json({
      success: true,
      tasks,
      claimableCount,
      total: tasks.length,
      dateLabel: 'Today',
    });
  } catch (err: any) {
    console.error('GET /api/rewards error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve rewards.' },
      { status: 500 }
    );
  }
}
