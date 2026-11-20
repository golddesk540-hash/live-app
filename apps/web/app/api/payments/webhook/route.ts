import { NextRequest, NextResponse } from 'next/server';
import { webPaymentService } from '@/lib/paymentService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const signature =
      req.headers.get('stripe-signature') ||
      req.headers.get('x-signature') ||
      req.headers.get('x-webhook-signature');

    const body = await req.json().catch(() => ({}));
    const {
      eventId,
      providerKey = 'stripe_card',
      eventType,
      orderId,
      amount,
      currency = 'USD',
      providerPaymentRef,
      failureCode,
      failureReason,
      rawPayload,
      timestamp,
    } = body;

    if (!eventId || !orderId || !eventType) {
      return NextResponse.json(
        { success: false, error: 'eventId, orderId, and eventType are required.' },
        { status: 400 }
      );
    }

    const result = await webPaymentService.handleWebhook({
      eventId,
      providerKey,
      eventType,
      orderId,
      amount: Number(amount) || 0,
      currency,
      providerPaymentRef,
      failureCode,
      failureReason,
      signature: signature || body.signature,
      rawPayload,
      timestamp: timestamp || new Date().toISOString(),
    });

    if (!result.handled) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to handle webhook.' },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      deduplicated: result.deduplicated || false,
      order: result.order,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Webhook processing failed.' },
      { status: 500 }
    );
  }
}
