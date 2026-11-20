import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { assertAdultEconomy, getCoinHistory } from '@/lib/economyApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/economy/coins/history
 * Returns paginated coin transaction history for the authenticated user.
 * Enforces:
 * - Authentication required (HTTP 401)
 * - Server-side Age 18+ check (HTTP 403)
 * - Pagination parameters (page, limit)
 * - Privacy protection (only user's own ledger entries)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view coin history.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    assertAdultEconomy(user, 'view coin history');

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '20', 10)));

    const result = await getCoinHistory(user.id, page, limit);

    return NextResponse.json({
      success: true,
      userId: user.id,
      ...result,
    });
  } catch (err: any) {
    if (err.code === 'AGE_RESTRICTION_18_PLUS') {
      return NextResponse.json(
        { success: false, error: err.message, code: 'AGE_RESTRICTION_18_PLUS' },
        { status: 403 }
      );
    }
    console.error('GET /api/economy/coins/history error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve coin history.' },
      { status: err.status || 500 }
    );
  }
}
