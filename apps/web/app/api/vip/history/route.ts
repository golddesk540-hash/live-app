import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getVipHistory } from '@/lib/vipApiService';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/vip/history
 * PART 4 & Test 5: Returns VIP subscription history for the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    let user = await getAuthenticatedUser(req);
    let targetUserId = user?.id;

    if (!targetUserId) {
      // Fallback for wallet actor if present
      const actor = await resolveWalletActor(req).catch(() => null);
      if (actor && actor.user && actor.user.id) {
        targetUserId = actor.user.id;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view VIP history.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const history = await getVipHistory(targetUserId);

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      history,
      records: history,
      total: history.length,
    });
  } catch (err: any) {
    console.error('GET /api/vip/history error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve VIP history.' },
      { status: 500 }
    );
  }
}
