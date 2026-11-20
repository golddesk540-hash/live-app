import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { webPaymentService } from '@/lib/paymentService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let authUser = await getAuthenticatedUser(req);
    const body = await req.json().catch(() => ({}));

    const userId = authUser?.id || body.userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to initiate checkout.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const {
      targetType = 'coins',
      packageId,
      planId,
      providerKey = 'stripe_card',
      platform = 'web',
      currency = 'USD',
      idempotencyKey,
      claimedAmount,
      claimedCoins,
    } = body;

    const result = await webPaymentService.createOrder({
      userId,
      targetType,
      packageId,
      planId,
      providerKey,
      platform,
      currency,
      idempotencyKey,
      claimedAmount,
      claimedCoins,
    });

    if (!result.success) {
      const status =
        result.code === 'UNDERAGE_PURCHASE_FORBIDDEN'
          ? 403
          : result.code === 'RATE_LIMIT_EXCEEDED'
          ? 429
          : result.code === 'AMOUNT_TAMPERED'
          ? 400
          : 400;

      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      clientSecret: result.clientSecret,
      checkoutUrl: result.checkoutUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create payment order.' },
      { status: 500 }
    );
  }
}
