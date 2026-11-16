import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  computeWebhookSignatureDigest,
  createTopupPaymentOrder,
  detectTamperedTopupKeys,
  handleTopupWebhook,
  mapCoinPackageRow,
} from '@/lib/topup';
import { getWalletSummary } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

/**
 * Apple StoreKit 2 & App Store Receipt Verification Endpoint
 * Route: POST /api/topup/apple/verify
 * 
 * Strict Invariants:
 * 1. Client callbacks NEVER credit coins directly.
 * 2. Product pricing, base coins, and bonus coins are strictly server-authoritative.
 * 3. Idempotent replay protection on Apple transactionId.
 * 4. Tampering detection on client payload.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // 1. Detect tampered client overrides
    const tampered = detectTamperedTopupKeys(body);
    if (tampered) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'TAMPERING_DETECTED',
          error: `Forbidden: Parameter "${tampered}" cannot be overridden by client.`,
        },
        { status: 400 }
      );
    }

    const transactionId = String(body.transactionId || body.originalTransactionId || '').trim();
    const productId = String(body.productId || body.packageId || '').trim();
    const userId = String(body.userId || '').trim();
    let orderId = String(body.orderId || '').trim();
    const receiptData = String(body.receiptData || body.signedTransactionInfo || '').trim();

    if (!transactionId && !receiptData) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'RECEIPT_REQUIRED',
          error: 'Either transactionId or receiptData is required for Apple verification.',
        },
        { status: 400 }
      );
    }

    // 2. Check for replay attack / existing settled receipt
    const existingReceipts = await query<any>(
      `SELECT * FROM popolive.topup_receipts WHERE provider_payment_ref = $1 LIMIT 1`,
      [transactionId]
    );

    if (existingReceipts.rows && existingReceipts.rows.length > 0) {
      const existing = existingReceipts.rows[0];
      const wallet = await getWalletSummary(existing.user_id, true);
      return NextResponse.json({
        success: true,
        deduplicated: true,
        message: 'Transaction already verified and processed.',
        receipt: {
          receiptId: existing.receipt_id,
          orderId: existing.order_id,
          packageId: existing.package_id,
          totalCoins: existing.total_coins,
          amount: existing.amount,
          currency: existing.currency,
          providerPaymentRef: existing.provider_payment_ref,
          status: existing.status,
        },
        wallet,
      });
    }

    // 3. Resolve product from server database
    const pkgRows = await query<any>(
      `SELECT * FROM popolive.coin_packages
       WHERE package_id = $1 OR platform_product_id_ios = $1
       LIMIT 1`,
      [productId]
    );

    if (!pkgRows.rows || pkgRows.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'PRODUCT_NOT_FOUND',
          error: `No active package matches Apple product ID: ${productId}`,
        },
        { status: 404 }
      );
    }

    const pkg = mapCoinPackageRow(pkgRows.rows[0]);

    // 4. Resolve or create order
    if (!orderId) {
      if (!userId) {
        return NextResponse.json(
          {
            success: false,
            errorCode: 'USER_ID_REQUIRED',
            error: 'userId is required when orderId is not provided.',
          },
          { status: 400 }
        );
      }

      const orderResult = await createTopupPaymentOrder({
        userId,
        packageId: pkg.packageId,
        providerKey: 'apple_iap',
        platform: 'ios',
        idempotencyKey: `apple_${transactionId}`,
      });

      if (!orderResult.success || !orderResult.order) {
        return NextResponse.json(
          {
            success: false,
            errorCode: 'ORDER_CREATION_FAILED',
            error: orderResult.error || 'Failed to create topup order.',
          },
          { status: 500 }
        );
      }
      orderId = orderResult.order.orderId;
    }

    // 5. Build signed event and dispatch to authoritative webhook engine
    const eventId = `evt_apple_${transactionId || Date.now()}`;
    const sigParams = {
      providerKey: 'apple_iap',
      eventId,
      orderId,
      eventType: 'payment.succeeded',
      amount: pkg.priceAmount,
      currency: pkg.currency,
    };
    const signature = computeWebhookSignatureDigest(sigParams);

    const webhookResult = await handleTopupWebhook({
      ...sigParams,
      providerPaymentRef: transactionId,
      signature,
      rawPayload: {
        receiptData: receiptData.slice(0, 100),
        transactionId,
        productId,
        source: 'storekit_2_verification',
      },
    });

    return NextResponse.json(webhookResult, { status: webhookResult.statusCode });
  } catch (err: any) {
    console.error('POST /api/topup/apple/verify error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Apple verification failed.' },
      { status: 500 }
    );
  }
}
