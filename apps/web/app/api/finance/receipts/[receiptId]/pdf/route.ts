import { NextRequest, NextResponse } from 'next/server';
import { resolveWalletActor } from '@/lib/walletAuth';
import { generateReceiptPdfDownload } from '@/lib/receipts';
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
    const inline = url.searchParams.get('inline') === '1';
    const actor = await resolveWalletActor(req);

    if (!actor.user && !isPreviewDemo) {
      return NextResponse.json(
        { success: false, errorCode: 'UNAUTHORIZED', error: 'Authentication required to download receipt PDF.' },
        { status: 401 }
      );
    }

    const { buffer, fileName } = await generateReceiptPdfDownload({
      receiptOrTxId: resolvedParams.receiptId,
      actor,
      isPreviewDemo,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${fileName}"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    return financeErrorJson(err, 'Failed to generate receipt PDF.');
  }
}
