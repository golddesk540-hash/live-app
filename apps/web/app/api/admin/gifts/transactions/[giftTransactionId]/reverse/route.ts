import { NextRequest, NextResponse } from 'next/server';
import { GiftSendValidationError, reverseGiftTransaction } from '@/lib/giftSending';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ giftTransactionId: string }> }
) {
  try {
    const actor = await resolveWalletActor(req);
    const { giftTransactionId } = await context.params;
    const body = await req.json().catch(() => ({}));

    const result = await reverseGiftTransaction({
      giftTransactionId: decodeURIComponent(giftTransactionId || ''),
      reason: String(body.reason || ''),
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      ipAddress: actor.ipAddress,
    });

    return NextResponse.json(result);
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
    console.error('POST /api/admin/gifts/transactions/[giftTransactionId]/reverse error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to reverse gift transaction.' },
      { status: 500 }
    );
  }
}
