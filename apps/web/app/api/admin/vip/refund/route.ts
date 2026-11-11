import { NextRequest, NextResponse } from 'next/server';
import { adminRefundVipOrder } from '@/lib/vip';
import { requireVipFinanceAdmin, vipErrorJson } from '@/lib/vipRouteHelpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireVipFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const orderId = String(body.orderId || '').trim();
    if (!orderId) {
      return NextResponse.json(
        { success: false, errorCode: 'ORDER_ID_REQUIRED', error: 'orderId is required for refund.' },
        { status: 400 }
      );
    }

    const result = await adminRefundVipOrder({
      actorRole: auth.actor.actorRole,
      actorId: auth.actor.actorId,
      orderId,
      reason: typeof body.reason === 'string' ? body.reason : 'Admin approved VIP refund',
      ipAddress: auth.actor.ipAddress,
    });

    return NextResponse.json({ success: true, module: '7.7', ...result });
  } catch (err: any) {
    return vipErrorJson(err, 'Failed to process VIP refund.');
  }
}
