import { NextRequest, NextResponse } from 'next/server';
import { getGiftCatalog, getGiftCategories } from '@/lib/giftCatalog';
import { DEFAULT_DEMO_WALLET_USER_ID, getWalletSummary } from '@/lib/wallet';
import { canAccessPrivateWallet, resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('category') || 'all';
    const search = searchParams.get('search') || searchParams.get('q') || '';
    const giftType = searchParams.get('giftType') || '';
    const popularOnly = searchParams.get('popularOnly') === 'true';
    const newOnly = searchParams.get('newOnly') === 'true';
    const featuredOnly = searchParams.get('featuredOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '24', 10);

    const [catalog, categories] = await Promise.all([
      getGiftCatalog({
        categoryId,
        search,
        giftType,
        popularOnly,
        newOnly,
        featuredOnly,
        page,
        limit,
        includeInactive: false,
      }),
      getGiftCategories({ includeInactive: false }),
    ]);

    // Optional read-only balance lookup from Module 7.1 (NEVER mutates coins)
    let viewerCoinBalance: number | null = null;
    const requestedUserId = searchParams.get('userId');
    const isPreviewDemo = searchParams.get('preview') === 'demo';
    if (requestedUserId || isPreviewDemo) {
      const actor = await resolveWalletActor(req);
      const targetUserId = requestedUserId || (actor.user ? actor.user.id : DEFAULT_DEMO_WALLET_USER_ID);
      if (canAccessPrivateWallet(actor, targetUserId, isPreviewDemo)) {
        const wallet = await getWalletSummary(targetUserId).catch(() => null);
        viewerCoinBalance = wallet ? wallet.coins : null;
      }
    }

    return NextResponse.json({
      success: true,
      gifts: catalog.gifts,
      categories,
      pagination: catalog.pagination,
      viewerCoinBalance,
    });
  } catch (err: any) {
    console.error('GET /api/gifts/catalog error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load virtual gift catalog.' },
      { status: 500 }
    );
  }
}
