import { NextRequest, NextResponse } from 'next/server';
import { handleTopupWebhook } from '@/lib/topup';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: { provider: string } }
) {
  try {
    const providerKey = String(context.params.provider || '').trim();
    const body = await req.json().catch(() => ({}));
    const sig =
      req.headers.get('x-topup-webhook-signature') ||
      req.headers.get('x-webhook-signature') ||
      body.signature ||
      null;

    const eventId = String(body.eventId || '').trim();
    const orderId = String(body.orderId || '').trim();
    const eventType = String(body.eventType || 'payment.succeeded').trim() as any;
    const amount = Number(body.amount);
    const currency = String(body.currency || 'USD').trim();

    if (!providerKey || !eventId || !orderId || !Number.isFinite(amount)) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'INVALID_WEBHOOK_PAYLOAD',
          error: 'providerKey, eventId, orderId, and numeric amount are required.',
        },
        { status: 400 }
      );
    }

    const result = await handleTopupWebhook({
      providerKey,
      eventId,
      orderId,
      eventType,
      amount,
      currency,
      providerPaymentRef: body.providerPaymentRef ? String(body.providerPaymentRef) : null,
      failureCode: body.failureCode ? String(body.failureCode) : null,
      failureReason: body.failureReason ? String(body.failureReason) : null,
      signature: sig,
      rawPayload: body,
    });

    return NextResponse.json(result, { status: result.statusCode });
  } catch (err: any) {
    console.error('POST /api/topup/webhooks/[provider] error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Webhook processing failed.' },
      { status: 500 }
    );
  }
}
