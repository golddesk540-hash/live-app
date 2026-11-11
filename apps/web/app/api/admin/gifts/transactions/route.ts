import { NextRequest, NextResponse } from 'next/server';
import { queryGiftTransactions } from '@/lib/giftSending';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveWalletActor(req);
    if (!actor.isAdminReadOnly && !actor.isFinanceAdmin) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'ADMIN_ACCESS_REQUIRED',
          error: 'Unauthorized: Administrator access required to inspect all gift transactions.',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const result = await queryGiftTransactions({
      senderUserId: searchParams.get('senderUserId'),
      recipientHostId: searchParams.get('recipientHostId'),
      liveRoomId: searchParams.get('liveRoomId'),
      pkBattleId: searchParams.get('pkBattleId'),
      giftTransactionId: searchParams.get('giftTransactionId'),
      status: searchParams.get('status'),
      search: searchParams.get('search'),
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '30', 10),
      includeFinancialBreakdown: true,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error('GET /api/admin/gifts/transactions error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to query admin gift transactions.' },
      { status: 500 }
    );
  }
}
