import { NextRequest, NextResponse } from 'next/server';
import { getVipReceiptById } from '@/lib/vip';
import { vipErrorJson } from '@/lib/vipRouteHelpers';
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
      return NextResponse.json(
        { success: false, errorCode: 'RECEIPT_ID_REQUIRED', error: 'receiptId is required.' },
        { status: 400 }
      );
    }

    const r = await getVipReceiptById({ actor, receiptId, isPreviewDemo });

    if (format === 'txt') {
      const lines = [
        '==================================================',
        '       POPO LIVE — OFFICIAL VIP MEMBERSHIP RECEIPT ',
        '==================================================',
        `Receipt ID        : ${r.receiptId}`,
        `Membership ID     : ${r.membershipId}`,
        `Order ID          : ${r.orderId}`,
        `Receipt Type      : ${r.receiptType.toUpperCase()}`,
        `User ID           : ${r.userId}`,
        `VIP Plan          : ${r.planName} (${r.planId})`,
        `Payment Method    : ${r.providerDisplayName} (${r.providerKey})`,
        `Payment Ref       : ${r.paymentReference}`,
        `Amount Charged    : ${r.currency} ${Number(r.amount).toFixed(2)}${r.coinsCharged ? ` (${r.coinsCharged.toLocaleString()} Coins)` : ''}`,
        `Duration          : ${r.durationDays} Days`,
        `Activation (UTC)  : ${r.activationDate}`,
        `Expiry (UTC)      : ${r.expiryDate}`,
        `Status            : ${r.receiptStatus.toUpperCase()}`,
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

    return NextResponse.json({ success: true, module: '7.7', receipt: r });
  } catch (err: any) {
    console.error('GET /api/vip/receipts/[receiptId] error:', err);
    return vipErrorJson(err, 'Failed to fetch VIP receipt.');
  }
}
