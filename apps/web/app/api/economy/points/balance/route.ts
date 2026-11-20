import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { assertAdultEconomy, getOrCreateUserWallet } from '@/lib/economyApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/economy/points/balance
 * Returns the current authenticated host user's points balance.
 * Enforces:
 * - Authentication required (HTTP 401)
 * - Server-side Age 18+ check (HTTP 403)
 * - Strict ledger separation (diamond_points only)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to access points balance.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    assertAdultEconomy(user, 'access points balance');

    const wallet = await getOrCreateUserWallet(user.id);

    return NextResponse.json({
      success: true,
      userId: user.id,
      walletId: wallet.walletId,
      points: wallet.diamondPoints,
      diamondPoints: wallet.diamondPoints,
      currency: 'diamond_points',
      hostSharePercent: 70.0,
      isFrozen: wallet.isFrozen,
      updatedAt: wallet.updatedAt,
    });
  } catch (err: any) {
    if (err.code === 'AGE_RESTRICTION_18_PLUS') {
      return NextResponse.json(
        { success: false, error: err.message, code: 'AGE_RESTRICTION_18_PLUS' },
        { status: 403 }
      );
    }
    console.error('GET /api/economy/points/balance error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve points balance.' },
      { status: err.status || 500 }
    );
  }
}
