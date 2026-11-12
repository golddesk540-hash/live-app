import { NextRequest, NextResponse } from 'next/server';
import { resolveWalletActor } from '@/lib/walletAuth';
import { getReceiptDetailForActor } from '@/lib/receipts';
import { financeErrorJson } from '@/lib/financeRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ receiptId: string }> | { receiptId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const url = new URL(req.url);
    const isPreviewDemo = url.searchParams.get('preview') === 'demo';
    const actor = await resolveWalletActor(req);

    if (!actor.user && !isPreviewDemo) {
      return NextResponse.json(
        { success: false, errorCode: 'UNAUTHORIZED', error: 'Authentication required to view receipt.' },
        { status: 401 }
      );
    }

    const receipt = await getReceiptDetailForActor({
      receiptOrTxId: resolvedParams.receiptId,
      actor,
      isPreviewDemo,
    });

    return NextResponse.json({ success: true, receipt });
  } catch (err) {
    return financeErrorJson(err, 'Failed to load receipt details.');
  }
}
