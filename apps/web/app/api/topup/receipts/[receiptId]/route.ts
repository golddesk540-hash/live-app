import { NextRequest, NextResponse } from 'next/server';
import { getTopupReceiptById } from '@/lib/topup';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: { receiptId: string } }
) {
  try {
    const actor = await resolveWalletActor(req);
    const isPreviewDemo = req.nextUrl.searchParams.get('preview') === 'demo';
    const format = req.nextUrl.searchParams.get('format') || 'json';
    const receiptId = String(context.params.receiptId || '').trim();

    if (!receiptId) {
      return NextResponse.json({ success: false, error: 'receiptId required.' }, { status: 400 });
    }

    const res = await getTopupReceiptById(receiptId, actor, isPreviewDemo);
    if (!res.allowed) {
      return NextResponse.json(
        { success: false, errorCode: 'TOPUP_ACCESS_DENIED', error: 'Forbidden: Cannot access another user receipt.' },
        { status: 403 }
      );
    }
    if (!res.receipt) {
      return NextResponse.json(
        { success: false, errorCode: 'RECEIPT_NOT_FOUND', error: 'Payment receipt not found.' },
        { status: 404 }
      );
    }

    if (format === 'txt') {
      const r = res.receipt;
      const lines = [
        '==================================================',
        '           POPO LIVE — OFFICIAL TOP-UP RECEIPT    ',
        '==================================================',
        `Receipt ID        : ${r.receiptId}`,
        `Order ID          : ${r.orderId}`,
        `User ID           : ${r.userId}`,
        `Package           : ${r.packageName} (${r.packageId})`,
        `Payment Method    : ${r.providerKey}`,
        `Payment Ref       : ${r.providerPaymentRef || 'N/A'}`,
        `Coin Ledger TX    : ${r.coinTransactionId}`,
        `Base Coins        : ${r.baseCoins.toLocaleString()}`,
        `Bonus Coins       : ${r.bonusCoins.toLocaleString()}`,
        `Total Coins Added : ${r.totalCoins.toLocaleString()}`,
        `Amount Charged    : ${r.currency} ${Number(r.amount).toFixed(2)}`,
        `Status            : ${r.status.toUpperCase()}`,
        `Issued At (UTC)   : ${r.issuedAt}`,
        '==================================================',
      ].join('\n');

      return new NextResponse(lines, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${r.receiptId}.txt"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json({
      success: true,
      receipt: res.receipt,
    });
  } catch (err: any) {
    console.error('GET /api/topup/receipts/[receiptId] error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load receipt.' },
      { status: 500 }
    );
  }
}
