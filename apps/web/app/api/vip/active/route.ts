import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getActiveVipMembership } from '@/lib/vipApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/vip/active
 * PART 4 & Test 2: Active VIP membership status for authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view active VIP status.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const membership = await getActiveVipMembership(user.id);

    return NextResponse.json({
      success: true,
      userId: user.id,
      vip: membership,
      membership,
    });
  } catch (err: any) {
    console.error('GET /api/vip/active error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve active VIP status.' },
      { status: 500 }
    );
  }
}
