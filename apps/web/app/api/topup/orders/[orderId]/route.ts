import { NextRequest, NextResponse } from 'next/server';
import { getTopupOrderAndReceipt } from '@/lib/topup';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: { orderId: string } }
) {
  try {
    const actor = await resolveWalletActor(req);
    const isPreviewDemo = req.nextUrl.searchParams.get('preview') === 'demo';
    const orderId = String(context.params.orderId || '').trim();

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId required' }, { status: 400 });
    }

    const res = await getTopupOrderAndReceipt(orderId, actor, isPreviewDemo);
    if (!res.allowed) {
      return NextResponse.json(
        { success: false, errorCode: 'TOPUP_ACCESS_DENIED', error: 'Forbidden: Cannot inspect another user order.' },
        { status: 403 }
      );
    }
    if (!res.order) {
      return NextResponse.json(
        { success: false, errorCode: 'ORDER_NOT_FOUND', error: 'Top-up order not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: res.order,
      receipt: res.receipt,
    });
  } catch (err: any) {
    console.error('GET /api/topup/orders/[orderId] error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load order.' },
      { status: 500 }
    );
  }
}
