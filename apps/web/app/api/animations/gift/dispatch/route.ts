import { NextRequest, NextResponse } from 'next/server';
import {
  AnimationValidationError,
  dispatchGiftAnimationFromTransaction,
} from '@/lib/animations';
import { resolveGiftSenderAccess } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    const isPreviewDemo = searchParams.get('preview') === 'demo' || body.preview === 'demo';
    const access = await resolveGiftSenderAccess(req, body.userId, isPreviewDemo);
    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: access.message, code: access.errorCode },
        { status: access.statusCode }
      );
    }

    const result = await dispatchGiftAnimationFromTransaction({
      giftTransactionId: String(body.giftTransactionId || ''),
      roomId: body.roomId || null,
      pkBattleId: body.pkBattleId || null,
      allowIdempotentReturn: false,
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof AnimationValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: err.message,
          code: err.errorCode,
          details: err.details,
        },
        { status: err.statusCode }
      );
    }
    console.error('POST /api/animations/gift/dispatch error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to dispatch gift animation.' },
      { status: err?.statusCode || 500 }
    );
  }
}
