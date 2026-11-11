import { NextRequest, NextResponse } from 'next/server';
import { getStoreCatalog } from '@/lib/store';
import { getWalletSummary } from '@/lib/wallet';
import { resolveStoreUserScope, storeErrorJson } from '@/lib/storeRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const scope = await resolveStoreUserScope(req, undefined, { allowAnonymousNull: true });
    if (!scope.ok) return scope.response;

    const categoryId = url.searchParams.get('categoryId') || undefined;
    const search = url.searchParams.get('search') || url.searchParams.get('q') || undefined;
    const rawFilter = (url.searchParams.get('filter') || 'all').toLowerCase();
    const filter = (['all', 'featured', 'popular', 'new'].includes(rawFilter)
      ? rawFilter
      : 'all') as 'all' | 'featured' | 'popular' | 'new';
    const page = parseInt(url.searchParams.get('page') || '1', 10) || 1;
    const limit = parseInt(url.searchParams.get('limit') || '24', 10) || 24;

    const catalog = await getStoreCatalog({
      categoryId,
      search,
      filter,
      page,
      limit,
      userId: scope.targetUserId,
    });

    let wallet: any = null;
    if (scope.targetUserId) {
      wallet = await getWalletSummary(scope.targetUserId, true).catch(() => null);
    }

    return NextResponse.json({
      success: true,
      userId: scope.targetUserId,
      isPreviewDemo: scope.isPreviewDemo,
      wallet: wallet ? { walletId: wallet.walletId, coins: wallet.coins, points: wallet.points } : null,
      ...catalog,
    });
  } catch (err: any) {
    return storeErrorJson(err, 'Failed to load Virtual Store catalog.');
  }
}
