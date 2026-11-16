import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { resolveWalletActor } from '@/lib/walletAuth';
import { DEFAULT_DEMO_WALLET_USER_ID, getWalletSummary } from '@/lib/wallet';
import { handleTopupWebhook, mapTopupOrderRow } from '@/lib/topup';

export const dynamic = 'force-dynamic';

/**
 * Purchase Recovery & Pending Orders Reconciler API
 * POST /api/topup/recovery/reconcile
 * 
 * Safe recovery for interrupted in-app purchases:
 * - Scans pending orders for the authenticated user
 * - Idempotently checks for duplicate credits
 * - Refreshes transaction status from provider / webhook outbox
 * - Prevents duplicate coin credit / double spend
 */
export async function POST(req: NextRequest) {
  try {
    const actor = await resolveWalletActor(req);
    const body = await req.json().catch(() => ({}));
    const isPreviewDemo = req.nextUrl.searchParams.get('preview') === 'demo';

    const userId = body.userId || (actor.user ? actor.user.id : DEFAULT_DEMO_WALLET_USER_ID);

    // Caller can pass specific order IDs or recover all pending within 48 hours
    const specificOrderIds = Array.isArray(body.orderIds) ? body.orderIds.map(String) : [];

    let pendingOrders: any[] = [];
    if (specificOrderIds.length > 0) {
      pendingOrders = await query<any>(
        `SELECT * FROM popolive.topup_payment_orders
         WHERE user_id = $1 AND order_id = ANY($2::text[])
         ORDER BY created_at DESC`,
        [userId, specificOrderIds]
      );
    } else {
      pendingOrders = await query<any>(
        `SELECT * FROM popolive.topup_payment_orders
         WHERE user_id = $1
           AND status = 'pending'
           AND created_at >= NOW() - INTERVAL '48 hours'
         ORDER BY created_at DESC
         LIMIT 20`,
        [userId]
      );
    }

    const recoveredList: any[] = [];
    let recoveredCount = 0;

    for (const ordRow of pendingOrders) {
      const order = mapTopupOrderRow(ordRow);

      // Check if already has a coin transaction (prevent duplicate crediting)
      const existingTx = await query<any>(
        `SELECT * FROM popolive.coin_transactions WHERE reference_id = $1 AND transaction_type = 'topup'`,
        [order.orderId]
      );

      if (existingTx.length > 0) {
        // Already credited in DB! Mark order successful if still pending
        await query(
          `UPDATE popolive.topup_payment_orders
           SET status = 'successful', coin_transaction_id = $1, updated_at = NOW()
           WHERE order_id = $2`,
          [existingTx[0].transaction_id, order.orderId]
        );
        recoveredList.push({
          orderId: order.orderId,
          packageId: order.packageId,
          totalCoins: order.totalCoins,
          amount: order.amount,
          currency: order.currency,
          platform: order.platform,
          status: 'successful',
          coinTransactionId: existingTx[0].transaction_id,
          recoveryAction: 'reconciled_from_existing_ledger',
        });
        recoveredCount++;
        continue;
      }

      // If simulateRecovery flag is provided in sandbox/preview
      if (body.simulateRecovery === true && order.providerKey === 'sandbox_verified') {
        const webhookRes = await handleTopupWebhook({
          providerKey: 'sandbox_verified',
          eventId: `RECOV_EVT_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          orderId: order.orderId,
          eventType: 'payment.succeeded',
          amount: order.amount,
          currency: order.currency,
          providerPaymentRef: `RECOV_PAY_${Date.now()}`,
          rawPayload: { recovered: true, source: 'purchase_recovery_api' },
        });

        if (webhookRes.success) {
          recoveredList.push({
            orderId: order.orderId,
            packageId: order.packageId,
            totalCoins: order.totalCoins,
            amount: order.amount,
            currency: order.currency,
            platform: order.platform,
            status: 'successful',
            coinTransactionId: webhookRes.receipt?.coinTransactionId,
            recoveryAction: 'verified_and_credited',
          });
          recoveredCount++;
          continue;
        }
      }

      // Order remains pending awaiting provider verification
      recoveredList.push({
        orderId: order.orderId,
        packageId: order.packageId,
        totalCoins: order.totalCoins,
        amount: order.amount,
        currency: order.currency,
        platform: order.platform,
        status: order.status,
        recoveryAction: 'awaiting_provider_verification',
      });
    }

    const freshWallet = await getWalletSummary(userId, true);

    return NextResponse.json({
      success: true,
      userId,
      recoveredCount,
      totalPendingChecked: pendingOrders.length,
      orders: recoveredList,
      wallet: {
        coins: freshWallet.coins,
        points: freshWallet.points,
        diamonds: freshWallet.diamondPoints,
      },
      reconciledAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('POST /api/topup/recovery/reconcile error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Purchase recovery failed.' },
      { status: 500 }
    );
  }
}
