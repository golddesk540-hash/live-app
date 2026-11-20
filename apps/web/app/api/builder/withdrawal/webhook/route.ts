import { NextRequest, NextResponse } from 'next/server';
import { webKycPayoutService } from '@/lib/kycPayoutService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const signature =
      req.headers.get('stripe-signature') ||
      req.headers.get('x-payout-signature') ||
      req.headers.get('x-signature');

    const body = await req.json().catch(() => ({}));
    const { eventId, withdrawalReference, eventType, amount, currency = 'USD', failureReason } = body;

    if (!eventId || !withdrawalReference || !eventType) {
      return NextResponse.json(
        { success: false, error: 'eventId, withdrawalReference, and eventType are required.' },
        { status: 400 }
      );
    }

    const result = await webKycPayoutService.handlePayoutWebhook({
      eventId,
      withdrawalReference,
      eventType,
      amount: Number(amount) || 0,
      currency,
      failureReason,
      signature: signature || body.signature,
      timestamp: new Date().toISOString(),
    });

    if (!result.handled) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to process payout webhook.' },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      deduplicated: result.deduplicated || false,
      withdrawal: result.withdrawal,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Payout webhook processing failed.' },
      { status: 500 }
    );
  }
}
