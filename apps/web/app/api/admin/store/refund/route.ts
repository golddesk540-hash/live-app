import { NextRequest, NextResponse } from 'next/server';
import { adminRefundStorePurchase } from '@/lib/store';
import { requireStoreFinanceAdmin, storeErrorJson } from '@/lib/storeRouteHelpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireStoreFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    if (!body || !body.purchaseId) {
      return NextResponse.json({ success: false, error: 'purchaseId and reason are required.' }, { status: 400 });
    }

    const result = await adminRefundStorePurchase({
      adminId: auth.actor.actorId,
      actorRole: auth.actor.actorRole,
      purchaseId: String(body.purchaseId),
      reason: String(body.reason || ''),
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return storeErrorJson(err, 'Failed to refund store purchase.');
  }
}
