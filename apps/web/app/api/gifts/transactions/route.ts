import { NextRequest, NextResponse } from 'next/server';
import { queryGiftTransactions } from '@/lib/giftSending';
import { DEFAULT_DEMO_WALLET_USER_ID } from '@/lib/wallet';
import { canAccessPrivateWallet, resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');
    const roleFilter = searchParams.get('role') || 'all';
    const liveRoomId = searchParams.get('liveRoomId');
    const pkBattleId = searchParams.get('pkBattleId');
    const giftTransactionId = searchParams.get('giftTransactionId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const isPreviewDemo = searchParams.get('preview') === 'demo';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);

    const actor = await resolveWalletActor(req);
    const targetUserId =
      actor.user?.id && !actor.isAdminReadOnly
        ? actor.user.id
        : requestedUserId ||
          actor.user?.id ||
          (actor.actorId !== 'anonymous' ? actor.actorId : DEFAULT_DEMO_WALLET_USER_ID);

    if (!canAccessPrivateWallet(actor, targetUserId, isPreviewDemo)) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'FORBIDDEN_TRANSACTION_HISTORY',
          error: 'Unauthorized: Cannot view private gift transactions for another account.',
        },
        { status: 403 }
      );
    }

    const res = await queryGiftTransactions({
      senderUserId: roleFilter === 'sender' ? targetUserId : null,
      recipientHostId: roleFilter === 'recipient' ? targetUserId : null,
      participantUserId: roleFilter === 'all' ? targetUserId : null,
      liveRoomId,
      pkBattleId,
      giftTransactionId,
      status,
      search,
      page,
      limit,
      includeFinancialBreakdown: actor.isFinanceAdmin || actor.isAdminReadOnly,
    });

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      ...res,
    });
  } catch (err: any) {
    console.error('GET /api/gifts/transactions error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to query gift transactions.' },
      { status: 500 }
    );
  }
}
