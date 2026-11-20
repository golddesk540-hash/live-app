import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { assertAdultEconomy, getOrCreateUserWallet } from '@/lib/economyApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/economy/coins/balance
 * Returns the current authenticated user's coin balance.
 * Enforces:
 * - Authentication required (HTTP 401)
 * - Server-side Age 18+ check (HTTP 403)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to access coin balance.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    assertAdultEconomy(user, 'access coin balance');

    const wallet = await getOrCreateUserWallet(user.id);

    return NextResponse.json({
      success: true,
      userId: user.id,
      walletId: wallet.walletId,
      coins: wallet.coins,
      currency: 'coins',
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
    console.error('GET /api/economy/coins/balance error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve coin balance.' },
      { status: err.status || 500 }
    );
  }
}
