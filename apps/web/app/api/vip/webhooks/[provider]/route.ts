import { NextRequest, NextResponse } from 'next/server';
import { handleVipWebhook } from '@/lib/vip';
import { vipErrorJson } from '@/lib/vipRouteHelpers';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: { provider: string } }
) {
  try {
    const providerKey = String(context.params.provider || '').trim();
    const body = await req.json().catch(() => ({}));
    const sig =
      req.headers.get('x-vip-webhook-signature') ||
      req.headers.get('x-topup-webhook-signature') ||
      body.signature ||
      null;

    const rawEvent = String(body.eventType || 'payment_succeeded').toLowerCase();
    const eventType: 'payment_succeeded' | 'payment_failed' | 'payment_cancelled' =
      rawEvent.includes('fail')
        ? 'payment_failed'
        : rawEvent.includes('cancel')
        ? 'payment_cancelled'
        : 'payment_succeeded';

    const result = await handleVipWebhook({
      providerKey,
      eventId: String(body.eventId || ''),
      eventType,
      orderId: String(body.orderId || ''),
      paymentReference: String(body.paymentReference || body.providerPaymentRef || ''),
      amount: body.amount,
      currency: String(body.currency || 'USD'),
      signature: sig,
    });

    return NextResponse.json({ module: '7.7', ...result });
  } catch (err: any) {
    console.error('POST /api/vip/webhooks/[provider] error:', err);
    return vipErrorJson(err, 'VIP webhook processing failed.');
  }
}
