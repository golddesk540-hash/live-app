import { NextRequest, NextResponse } from 'next/server';
import { handleTopupWebhook } from '@/lib/topup';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Direct client confirmation calls WITHOUT cryptographic provider webhook signature
// or server-verified provider receipt MUST be rejected cleanly.
export async function POST(
  req: NextRequest,
  context: { params: { orderId: string } }
) {
  try {
    const orderId = String(context.params.orderId || '').trim();
    const body = await req.json().catch(() => ({}));
    const sig = req.headers.get('x-topup-webhook-signature') || body.signature || null;

    if (!sig) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'PROVIDER_VERIFICATION_REQUIRED',
          error:
            'Forbidden: Coins cannot be credited from an unverified client success call. Cryptographic provider webhook verification is required.',
        },
        { status: 403 }
      );
    }

    const orderRows = await query<any>(
      `SELECT provider_key, amount, currency FROM popolive.topup_payment_orders WHERE order_id = $1`,
      [orderId]
    );
    if (orderRows.length === 0) {
      return NextResponse.json(
        { success: false, errorCode: 'ORDER_NOT_FOUND', error: 'Top-up order not found.' },
        { status: 404 }
      );
    }

    const res = await handleTopupWebhook({
      providerKey: String(body.providerKey || orderRows[0].provider_key),
      eventId: String(body.eventId || ''),
      orderId,
      eventType: (body.eventType || 'payment.succeeded') as any,
      amount: body.amount !== undefined ? Number(body.amount) : Number(orderRows[0].amount),
      currency: String(body.currency || orderRows[0].currency || 'USD'),
      providerPaymentRef: body.providerPaymentRef || null,
      signature: String(sig),
      rawPayload: body,
    });

    return NextResponse.json(res, { status: res.statusCode });
  } catch (err: any) {
    console.error('POST /api/topup/orders/[orderId]/verify error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Verification failed.' },
      { status: 500 }
    );
  }
}
