import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DEFAULT_DEMO_WALLET_USER_ID, getFinanceRules, getWalletSummary } from '@/lib/wallet';
import { canAccessPrivateWallet, resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

/**
 * Server-Authoritative Wallet Reconciliation API
 * GET /api/wallet/reconcile?userId=<id>&preview=demo
 * 
 * Verifies consistency across:
 * 1. Confirmed purchases (popolive.topup_payment_orders)
 * 2. Credited coins (popolive.coin_transactions)
 * 3. Gift deductions (popolive.gift_transactions)
 * 4. Host earnings (popolive.host_earning_shares, 70% share rule)
 * 5. Platform revenue (30% share rule)
 * 6. Store / VIP purchases
 * 7. Refunds & Reversals
 * 8. Current wallet balance (popolive.user_wallets)
 * 
 * Identifies:
 * - Missing credits
 * - Duplicate credits (idempotency violations)
 * - Duplicate deductions
 * - Pending transactions
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const actor = await resolveWalletActor(req);
    const isPreviewDemo = searchParams.get('preview') === 'demo';

    const targetUserId =
      searchParams.get('userId') ||
      (actor.user ? actor.user.id : DEFAULT_DEMO_WALLET_USER_ID);

    if (!canAccessPrivateWallet(actor, targetUserId, isPreviewDemo)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Unauthorized wallet reconciliation request.',
          code: 'PRIVATE_WALLET_ACCESS_DENIED',
        },
        { status: 403 }
      );
    }

    const forceRefresh = searchParams.get('refresh') === 'true';
    const wallet = await getWalletSummary(targetUserId, forceRefresh);
    const rules = await getFinanceRules();

    // 1. Confirmed Top-up Purchases
    const topupPurchases = await query<any>(
      `SELECT
         COUNT(*)::int AS count,
         COALESCE(SUM(total_coins), 0)::bigint AS total_coins,
         COALESCE(SUM(amount), 0)::numeric(12,2) AS total_amount
       FROM popolive.topup_payment_orders
       WHERE user_id = $1 AND status = 'successful'`,
      [targetUserId]
    );

    // 2. Pending Top-up Purchases
    const pendingPurchases = await query<any>(
      `SELECT
         order_id,
         package_id,
         total_coins,
         amount,
         currency,
         platform,
         provider_key,
         created_at
       FROM popolive.topup_payment_orders
       WHERE user_id = $1 AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 10`,
      [targetUserId]
    );

    // 3. Refunded & Reversed Purchases
    const refundedPurchases = await query<any>(
      `SELECT
         COUNT(*)::int AS count,
         COALESCE(SUM(total_coins), 0)::bigint AS total_coins,
         COALESCE(SUM(amount), 0)::numeric(12,2) AS total_amount
       FROM popolive.topup_payment_orders
       WHERE user_id = $1 AND status IN ('refunded', 'reversed')`,
      [targetUserId]
    );

    // 4. Gift Coins Deducted
    const giftDeductions = await query<any>(
      `SELECT
         COUNT(*)::int AS count,
         COALESCE(SUM(total_coin_amount), 0)::bigint AS total_coins
       FROM popolive.gift_transactions
       WHERE sender_user_id = $1 AND status = 'completed'`,
      [targetUserId]
    );

    // 5. Store & VIP Expenditures
    const storeVipExpenditures = await query<any>(
      `SELECT
         COUNT(*)::int AS count,
         COALESCE(SUM(coin_amount), 0)::bigint AS total_coins
       FROM popolive.coin_transactions
       WHERE user_id = $1
         AND transaction_type IN ('store_purchase', 'vip_purchase')
         AND status = 'completed'`,
      [targetUserId]
    );

    // 6. Authorized Wallet Adjustments & Reversals
    const adjustments = await query<any>(
      `SELECT
         COUNT(*)::int AS count,
         COALESCE(SUM(CASE WHEN direction = 'credit' THEN coin_amount ELSE -coin_amount END), 0)::bigint AS net_adjustment
       FROM popolive.coin_transactions
       WHERE user_id = $1
         AND transaction_type IN ('reversal', 'admin_credit', 'admin_debit', 'wallet_adjustment', 'initial_credit')
         AND status = 'completed'`,
      [targetUserId]
    );

    // 7. Host Gift Earnings & 70/30 Distribution Audit (if user is also a host)
    const hostEarnings = await query<any>(
      `SELECT
         COUNT(*)::int AS count,
         COALESCE(SUM(points_credited), 0)::bigint AS total_points,
         COALESCE(SUM(original_coin_amount), 0)::bigint AS total_gift_coins,
         COALESCE(SUM(platform_share_amount), 0)::bigint AS total_platform_coins
       FROM popolive.host_earning_shares
       WHERE host_user_id = $1 AND status = 'credited'`,
      [targetUserId]
    );

    // 8. Audit for Duplicate Deductions
    const duplicateDeductions = await query<any>(
      `SELECT gift_transaction_id, COUNT(*)
       FROM popolive.gift_transactions
       WHERE sender_user_id = $1 AND status = 'completed'
       GROUP BY gift_transaction_id
       HAVING COUNT(*) > 1`,
      [targetUserId]
    );

    // 9. Audit for Duplicate Top-up Credits (Idempotency Key Collisions)
    const duplicateCredits = await query<any>(
      `SELECT idempotency_key, COUNT(*)
       FROM popolive.coin_transactions
       WHERE user_id = $1 AND idempotency_key IS NOT NULL
       GROUP BY idempotency_key
       HAVING COUNT(*) > 1`,
      [targetUserId]
    );

    // 10. Missing Credits Audit: Verified orders with zero coin transaction record
    const missingCredits = await query<any>(
      `SELECT o.order_id, o.package_id, o.total_coins, o.amount
       FROM popolive.topup_payment_orders o
       LEFT JOIN popolive.coin_transactions ct
         ON ct.reference_id = o.order_id AND ct.transaction_type = 'topup'
       WHERE o.user_id = $1
         AND o.status = 'successful'
         AND ct.transaction_id IS NULL`,
      [targetUserId]
    );

    const totalPurchasedCoins = Number(topupPurchases[0]?.total_coins || 0);
    const totalPurchasedAmount = Number(topupPurchases[0]?.total_amount || 0);
    const totalRefundedCoins = Number(refundedPurchases[0]?.total_coins || 0);
    const totalRefundedAmount = Number(refundedPurchases[0]?.total_amount || 0);
    const totalGiftSpent = Number(giftDeductions[0]?.total_coins || 0);
    const totalStoreVipSpent = Number(storeVipExpenditures[0]?.total_coins || 0);
    const netAdjustmentCoins = Number(adjustments[0]?.net_adjustment || 0);

    // Initial base coins
    const baseCoins = rules.newUserInitialCoins || 0;
    const expectedCoins =
      baseCoins + totalPurchasedCoins + netAdjustmentCoins - totalGiftSpent - totalStoreVipSpent;
    const currentCoins = wallet.coins;

    const duplicateCreditsCount = duplicateCredits.length;
    const duplicateDeductionsCount = duplicateDeductions.length;
    const missingCreditsCount = missingCredits.length;
    const pendingCount = pendingPurchases.length;

    const discrepancyCoins = currentCoins - expectedCoins;
    const isReconciled =
      Math.abs(discrepancyCoins) === 0 &&
      duplicateCreditsCount === 0 &&
      duplicateDeductionsCount === 0 &&
      missingCreditsCount === 0;

    // 70/30 Revenue Sharing Audit
    const totalHostGiftCoins = Number(hostEarnings[0]?.total_gift_coins || 0);
    const totalHostPoints = Number(hostEarnings[0]?.total_points || 0);
    const totalPlatformCoins = Number(hostEarnings[0]?.total_platform_coins || 0);

    const expectedHostPoints = Math.floor((totalHostGiftCoins * rules.hostGiftSharePercent) / 100);
    const revenueSharingRuleVerified =
      totalHostPoints === expectedHostPoints &&
      (totalHostGiftCoins === 0 || totalPlatformCoins === totalHostGiftCoins - expectedHostPoints);

    const issues: string[] = [];
    if (discrepancyCoins !== 0) {
      issues.push(`Coin balance discrepancy: ${discrepancyCoins > 0 ? '+' : ''}${discrepancyCoins} coins difference from ledger`);
    }
    if (duplicateCreditsCount > 0) {
      issues.push(`${duplicateCreditsCount} duplicate credit transaction(s) detected`);
    }
    if (duplicateDeductionsCount > 0) {
      issues.push(`${duplicateDeductionsCount} duplicate deduction(s) detected`);
    }
    if (missingCreditsCount > 0) {
      issues.push(`${missingCreditsCount} verified order(s) missing coin ledger entry`);
    }
    if (pendingCount > 0) {
      issues.push(`${pendingCount} pending purchase(s) awaiting provider confirmation`);
    }

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      reconciliationStatus: isReconciled ? 'reconciled' : 'discrepancy_detected',
      reconciledAt: new Date().toISOString(),
      wallet: {
        walletId: wallet.walletId,
        coins: wallet.coins,
        points: wallet.points,
        diamonds: wallet.diamondPoints,
        totalSpentCoins: wallet.totalSpentCoins,
        totalReceivedPoints: wallet.totalReceivedPoints,
      },
      audit: {
        baseInitialCoins: baseCoins,
        totalPurchasedCoins,
        totalPurchasedAmount,
        totalRefundedCoins,
        totalRefundedAmount,
        totalGiftCoinsSpent: totalGiftSpent,
        totalStoreVipCoinsSpent: totalStoreVipSpent,
        netAdjustments: netAdjustmentCoins,
        expectedCoins,
        currentCoins,
        discrepancyCoins,
      },
      integrityChecks: {
        missingCreditsCount,
        duplicateCreditsCount,
        duplicateDeductionsCount,
        pendingTransactionsCount: pendingCount,
        isZeroDiscrepancy: Math.abs(discrepancyCoins) === 0,
      },
      revenueSharing: {
        hostSharePercent: rules.hostGiftSharePercent, // strictly 70%
        platformSharePercent: 100 - rules.hostGiftSharePercent, // strictly 30%
        confirmedGiftCoins: totalHostGiftCoins,
        hostPointsCredited: totalHostPoints,
        platformCoinsCredited: totalPlatformCoins,
        ruleFormulaVerified: revenueSharingRuleVerified,
      },
      pendingTransactions: pendingPurchases.map((p) => ({
        orderId: p.order_id,
        packageId: p.package_id,
        totalCoins: Number(p.total_coins),
        amount: Number(p.amount),
        currency: p.currency,
        platform: p.platform,
        providerKey: p.provider_key,
        createdAt: p.created_at,
      })),
      issues,
    });
  } catch (err: any) {
    console.error('GET /api/wallet/reconcile error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Wallet reconciliation failed.' },
      { status: 500 }
    );
  }
}
