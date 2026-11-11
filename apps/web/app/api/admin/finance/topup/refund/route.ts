import { NextRequest, NextResponse } from 'next/server';
import { adminRefundTopupOrder } from '@/lib/topup';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveWalletActor(req);
    if (!actor.isFinanceAdmin) {
      return NextResponse.json(
        { success: false, errorCode: 'FINANCE_ADMIN_REQUIRED', error: 'Forbidden: Finance admin access required.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const res = await adminRefundTopupOrder({
      orderId: String(body.orderId || '').trim(),
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      reason: String(body.reason || ''),
      ipAddress: actor.ipAddress,
    });

    return NextResponse.json(res);
  } catch (err: any) {
    console.error('POST /api/admin/finance/topup/refund error:', err);
    return NextResponse.json(
      { success: false, errorCode: err?.code, error: err?.message || 'Top-up refund failed.' },
      { status: err?.status || 500 }
    );
  }
}
