import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getVipOrderAndReceipt, handleVipWebhook } from '@/lib/vip';
import { vipErrorJson } from '@/lib/vipRouteHelpers';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: { orderId: string } }
) {
  try {
    const actor = await resolveWalletActor(req);
    const result = await getVipOrderAndReceipt({
      actor,
      orderId: String(context.params.orderId || '').trim(),
    });
    return NextResponse.json({ success: true, module: '7.7', ...result });
  } catch (err: any) {
    return vipErrorJson(err, 'Failed to fetch VIP order.');
  }
}

export async function POST(
  req: NextRequest,
  context: { params: { orderId: string } }
) {
  try {
    const orderId = String(context.params.orderId || '').trim();
    const body = await req.json().catch(() => ({}));
    const sig =
      req.headers.get('x-vip-webhook-signature') ||
      req.headers.get('x-topup-webhook-signature') ||
      body.signature ||
      null;

    if (!sig) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'PROVIDER_VERIFICATION_REQUIRED',
          error:
            'Forbidden: VIP membership cannot be activated from an unverified client success call. Cryptographic provider webhook verification is required.',
        },
        { status: 403 }
      );
    }

    const orderRows = await query<any>(
      `SELECT provider_key, amount, currency FROM popolive.vip_membership_orders WHERE order_id = $1`,
      [orderId]
    );
    if (orderRows.length === 0) {
      return NextResponse.json(
        { success: false, errorCode: 'VIP_ORDER_NOT_FOUND', error: 'VIP order not found.' },
        { status: 404 }
      );
    }

    const res = await handleVipWebhook({
      providerKey: String(body.providerKey || orderRows[0].provider_key),
      eventId: String(body.eventId || ''),
      eventType: (body.eventType || 'payment_succeeded') as any,
      orderId,
      paymentReference: String(body.paymentReference || ''),
      amount: body.amount !== undefined ? body.amount : orderRows[0].amount,
      currency: String(body.currency || orderRows[0].currency || 'USD'),
      signature: String(sig),
    });

    return NextResponse.json({ module: '7.7', ...res });
  } catch (err: any) {
    return vipErrorJson(err, 'VIP order verification failed.');
  }
}
