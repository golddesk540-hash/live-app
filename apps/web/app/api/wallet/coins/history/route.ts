import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_DEMO_WALLET_USER_ID, getCoinHistory, getWalletSummary } from '@/lib/wallet';
import { canAccessPrivateWallet, resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isPreviewDemo = searchParams.get('preview') === 'demo';
    const actor = await resolveWalletActor(req);

    const requestedUserId = searchParams.get('userId');
    const targetUserId = requestedUserId || (actor.user ? actor.user.id : DEFAULT_DEMO_WALLET_USER_ID);

    if (!canAccessPrivateWallet(actor, targetUserId, isPreviewDemo)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Cannot read another user coin transaction history.',
          code: 'PRIVATE_WALLET_ACCESS_DENIED',
        },
        { status: 403 }
      );
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') || undefined;
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;

    const wallet = await getWalletSummary(targetUserId);
    const history = await getCoinHistory(targetUserId, { page, limit, status, type, search });

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      walletId: wallet.walletId,
      currentCoins: wallet.coins,
      transactions: history.transactions,
      pagination: history.pagination,
    });
  } catch (err: any) {
    console.error('GET /api/wallet/coins/history error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve coin transaction history.' },
      { status: 500 }
    );
  }
}
