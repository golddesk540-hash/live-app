import { NextRequest, NextResponse } from 'next/server';
import { GiftSendValidationError, getGiftSendingContext } from '@/lib/giftSending';
import { DEFAULT_DEMO_WALLET_USER_ID } from '@/lib/wallet';
import { canAccessPrivateWallet, resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    const liveRoomId = searchParams.get('liveRoomId');
    const pkBattleId = searchParams.get('pkBattleId');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const requestedUserId = searchParams.get('userId');
    const isPreviewDemo = searchParams.get('preview') === 'demo';

    const actor = await resolveWalletActor(req);
    const targetUserId =
      actor.user?.id ||
      requestedUserId ||
      (actor.actorId !== 'anonymous' ? actor.actorId : DEFAULT_DEMO_WALLET_USER_ID);

    const canReadPrivateBalance = canAccessPrivateWallet(actor, targetUserId, isPreviewDemo);

    const context = await getGiftSendingContext({
      senderUserId: targetUserId,
      roomId,
      liveRoomId,
      pkBattleId,
      categoryId,
      search,
      canReadPrivateBalance,
    });

    return NextResponse.json({
      success: true,
      ...context,
    });
  } catch (err: any) {
    if (err instanceof GiftSendValidationError) {
      return NextResponse.json(
        {
          success: false,
          errorCode: err.errorCode,
          error: err.message,
        },
        { status: err.statusCode }
      );
    }
    console.error('GET /api/gifts/send/context error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load gift sending context.' },
      { status: 500 }
    );
  }
}
