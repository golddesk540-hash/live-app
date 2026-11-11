import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_DEMO_WALLET_USER_ID, getPointsHistory, getWalletSummary } from '@/lib/wallet';
import { canAccessPrivateWallet, resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isPreviewDemo = searchParams.get('preview') === 'demo';
    const actor = await resolveWalletActor(req);

    const requestedUserId = searchParams.get('userId') || searchParams.get('hostUserId');
    const targetHostId = requestedUserId || (actor.user ? actor.user.id : DEFAULT_DEMO_WALLET_USER_ID);

    if (!canAccessPrivateWallet(actor, targetHostId, isPreviewDemo)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Cannot view private host points earning history for another user.',
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
    const maskSender = searchParams.get('maskSender') === 'true';

    const wallet = await getWalletSummary(targetHostId);
    const history = await getPointsHistory(targetHostId, {
      page,
      limit,
      status,
      type,
      search,
      maskSender,
    });

    return NextResponse.json({
      success: true,
      hostUserId: targetHostId,
      walletId: wallet.walletId,
      currentPoints: wallet.points,
      totalReceivedPoints: wallet.totalReceivedPoints,
      hostSharePercentage: wallet.hostSharePercentage,
      transactions: history.transactions,
      pagination: history.pagination,
    });
  } catch (err: any) {
    console.error('GET /api/wallet/points/history error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve host points earning history.' },
      { status: 500 }
    );
  }
}
