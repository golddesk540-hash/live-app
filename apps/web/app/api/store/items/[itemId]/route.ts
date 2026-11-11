import { NextRequest, NextResponse } from 'next/server';
import { getStoreItemDetail } from '@/lib/store';
import { getWalletSummary } from '@/lib/wallet';
import { resolveStoreUserScope, storeErrorJson } from '@/lib/storeRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const scope = await resolveStoreUserScope(req, undefined, { allowAnonymousNull: true });
    if (!scope.ok) return scope.response;

    // Preview / item detail strictly never deducts coins or mutates inventory
    const item = await getStoreItemDetail(params.itemId, {
      userId: scope.targetUserId,
    });

    let wallet: any = null;
    if (scope.targetUserId) {
      wallet = await getWalletSummary(scope.targetUserId, true).catch(() => null);
    }

    return NextResponse.json({
      success: true,
      item,
      wallet: wallet ? { walletId: wallet.walletId, coins: wallet.coins, points: wallet.points } : null,
    });
  } catch (err: any) {
    return storeErrorJson(err, 'Failed to fetch store item details.');
  }
}
