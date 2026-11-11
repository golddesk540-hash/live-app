import { NextRequest, NextResponse } from 'next/server';
import {
  GiftSendValidationError,
  assertNoClientFinancialOverrides,
  previewGiftSend,
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
        reason: `Rejected client override field '${tamperedKey}' on gift preview`,
        ipAddress: access.actor.ipAddress,
      });
      return NextResponse.json(
        {
          success: false,
          errorCode: 'CLIENT_FINANCIAL_OVERRIDE_FORBIDDEN',
          error: `Client override field '${tamperedKey}' is strictly prohibited. All prices and balances are computed server-side.`,
        },
        { status: 403 }
      );
    }

    const preview = await previewGiftSend({
      senderUserId: access.senderUserId,
      giftId: String(body.giftId || ''),
      quantity: body.quantity !== undefined ? Number(body.quantity) : 1,
      recipientHostId: String(body.recipientHostId || ''),
      roomId: body.roomId || null,
      liveRoomId: body.liveRoomId || null,
      pkBattleId: body.pkBattleId || null,
    });

    return NextResponse.json({
      success: true,
      preview,
    });
  } catch (err: any) {
    if (err instanceof GiftSendValidationError) {
      return NextResponse.json(
        {
          success: false,
          errorCode: err.errorCode,
          error: err.message,
          ...(err.details ? { details: err.details } : {}),
        },
        { status: err.statusCode }
      );
    }
    console.error('POST /api/gifts/send/preview error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to compute gift preview.' },
      { status: 500 }
    );
  }
}
