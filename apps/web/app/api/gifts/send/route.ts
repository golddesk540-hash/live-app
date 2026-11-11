import { NextRequest, NextResponse } from 'next/server';
import {
  assertNoClientFinancialOverrides,
  sendRealTimeGift,
} from '@/lib/giftSending';
import { logWalletAudit } from '@/lib/wallet';
import { resolveGiftSenderAccess } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const isPreviewDemo =
      body.preview === 'demo' || new URL(req.url).searchParams.get('preview') === 'demo';

    const access = await resolveGiftSenderAccess(
      req,
      body.senderUserId || body.userId,
      isPreviewDemo
    );

    if (!access.allowed) {
      return NextResponse.json(
        { success: false, errorCode: access.errorCode, error: access.message },
        { status: access.statusCode }
      );
    }

    const tamperedKey = assertNoClientFinancialOverrides(body);
    if (tamperedKey) {
      await logWalletAudit({
        targetUserId: access.senderUserId,
        actionType: 'client_financial_override_attempt',
        actorId: access.actor.actorId,
        actorRole: access.actor.actorRole,
        reason: `Rejected client financial override field '${tamperedKey}' on gift send`,
        ipAddress: access.actor.ipAddress,
      });
      return NextResponse.json(
        {
          success: false,
          errorCode: 'CLIENT_FINANCIAL_OVERRIDE_FORBIDDEN',
          error: `Client override field '${tamperedKey}' is strictly prohibited. All gift prices, coins, and host points are calculated on the backend.`,
        },
        { status: 403 }
      );
    }

    const result = await sendRealTimeGift({
      senderUserId: access.senderUserId,
      senderNickname: access.actor.user?.nickname || body.senderNickname || null,
      recipientHostId: String(body.recipientHostId || ''),
      giftId: String(body.giftId || ''),
      quantity: body.quantity !== undefined ? Number(body.quantity) : 1,
      roomId: body.roomId || null,
      liveRoomId: body.liveRoomId || null,
      pkBattleId: body.pkBattleId || null,
      idempotencyKey: body.idempotencyKey ? String(body.idempotencyKey) : null,
      ipAddress: access.actor.ipAddress,
    });

    return NextResponse.json(
      {
        ...result,
        error: result.success ? undefined : result.message,
      },
      { status: result.statusCode }
    );
  } catch (err: any) {
    console.error('POST /api/gifts/send error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Gift sending failed unexpectedly.' },
      { status: 500 }
    );
  }
}
