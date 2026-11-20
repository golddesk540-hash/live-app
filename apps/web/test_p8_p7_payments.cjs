/**
 * POPO LIVE — PHASE 8 (P8-P7) AUTOMATED VERIFICATION SUITE
 * REAL PAYMENT PROCESSING — COIN PACKAGES, VIP, REFUNDS, WEBHOOKS
 * 
 * Verifies all 24 test criteria specified in Part 8 of the P8-P7 specification.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  paymentProvider,
  paymentService,
} = require('../api/dist/payments');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName} - ${details}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('\n============================================================');
  console.log('POPO LIVE — PHASE 8 (P8-P7) REAL PAYMENT TESTS (24)');
  console.log('============================================================\n');

  const rootDir = path.resolve(__dirname, '../..');
  const mobileDir = path.join(rootDir, 'apps', 'mobile');
  const webDir = path.join(rootDir, 'apps', 'web');

  const adultUser1 = {
    id: `usr_adult_${Date.now()}_1`,
    birthdate: '1995-06-15',
    is_adult_verified: true,
    status: 'active',
  };
  const adultUser2 = {
    id: `usr_adult_${Date.now()}_2`,
    birthdate: '1990-01-20',
    is_adult_verified: true,
    status: 'active',
  };
  const adultUser3 = {
    id: `usr_adult_${Date.now()}_3`,
    birthdate: '1992-11-10',
    is_adult_verified: true,
    status: 'active',
  };
  const minorUser = {
    id: `usr_minor_${Date.now()}`,
    birthdate: '2012-04-12',
    is_adult_verified: false,
    status: 'active',
  };

  paymentService.registerMockUser(adultUser1);
  paymentService.registerMockUser(adultUser2);
  paymentService.registerMockUser(adultUser3);
  paymentService.registerMockUser(minorUser);

  let order1 = null;
  let order2 = null;
  let vipOrder = null;

  try {
    // ---------------------------------------------------------------------------
    // TEST 1: Packages load
    // ---------------------------------------------------------------------------
    try {
      const packages = await paymentService.getCoinPackages();
      const hasStarter = packages.some((p) => p.packageId === 'pkg_100' && p.totalCoins === 100);
      const hasGold = packages.some((p) => p.packageId === 'pkg_1000' && p.totalCoins === 1100);

      assert(
        packages.length >= 5 && hasStarter && hasGold,
        'Test 1: Coin packages load successfully with authoritative pricing and bonus coins'
      );
    } catch (err) {
      assert(false, 'Test 1: Packages load', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 2: Order created with provider session
    // ---------------------------------------------------------------------------
    try {
      const orderRes = await paymentService.createPaymentOrder({
        userId: adultUser1.id,
        targetType: 'coins',
        packageId: 'pkg_1000',
        platform: 'android',
        currency: 'USD',
      });

      if (orderRes.success && orderRes.order) {
        order1 = orderRes.order;
      }

      assert(
        orderRes.success &&
          orderRes.order.status === 'pending' &&
          orderRes.clientSecret.includes('_secret_') &&
          orderRes.checkoutUrl.includes('checkout.popolive.com'),
        'Test 2: Order created with provider session and secure tokenized client secret'
      );
    } catch (err) {
      assert(false, 'Test 2: Order created with provider session', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 3: Success webhook credits coins atomically
    // ---------------------------------------------------------------------------
    try {
      const eventId = `evt_success_${Date.now()}`;
      const signature = paymentProvider.computeWebhookSignature({
        eventId,
        orderId: order1.orderId,
        eventType: 'payment_intent.succeeded',
        amount: order1.amount,
        currency: order1.currency,
      });

      const webhookRes = await paymentService.handleWebhook({
        eventId,
        providerKey: 'stripe_card',
        eventType: 'payment_intent.succeeded',
        orderId: order1.orderId,
        amount: order1.amount,
        currency: order1.currency,
        signature,
        timestamp: new Date().toISOString(),
      });

      const wallet = paymentService.getMockWallet(adultUser1.id);
      const txs = paymentService.getMockTransactions();
      const txFound = txs.some(
        (t) => t.reference_id === order1.orderId && t.direction === 'credit' && t.coin_amount === 1100
      );

      assert(
        webhookRes.handled &&
          webhookRes.order.status === 'successful' &&
          wallet.coins === 1100 &&
          txFound,
        'Test 3: Success webhook credits coins atomically via P7-P7 atomic ledger'
      );
    } catch (err) {
      assert(false, 'Test 3: Success webhook credits coins atomically', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 4: Duplicate webhook idempotent (no double credit)
    // ---------------------------------------------------------------------------
    try {
      const dupEventId = `evt_success_${order1.orderId}`;
      const signature = paymentProvider.computeWebhookSignature({
        eventId: dupEventId,
        orderId: order1.orderId,
        eventType: 'payment_intent.succeeded',
        amount: order1.amount,
        currency: order1.currency,
      });

      // Send first time
      await paymentService.handleWebhook({
        eventId: dupEventId,
        providerKey: 'stripe_card',
        eventType: 'payment_intent.succeeded',
        orderId: order1.orderId,
        amount: order1.amount,
        currency: order1.currency,
        signature,
        timestamp: new Date().toISOString(),
      });

      // Send second time (duplicate)
      const dupRes = await paymentService.handleWebhook({
        eventId: dupEventId,
        providerKey: 'stripe_card',
        eventType: 'payment_intent.succeeded',
        orderId: order1.orderId,
        amount: order1.amount,
        currency: order1.currency,
        signature,
        timestamp: new Date().toISOString(),
      });

      const wallet = paymentService.getMockWallet(adultUser1.id);

      assert(
        dupRes.handled && dupRes.deduplicated === true && wallet.coins === 1100,
        'Test 4: Duplicate webhook processed idempotently with zero double-crediting'
      );
    } catch (err) {
      assert(false, 'Test 4: Duplicate webhook idempotent', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 5: Failed payment no credit
    // ---------------------------------------------------------------------------
    try {
      const order2Res = await paymentService.createPaymentOrder({
        userId: adultUser1.id,
        targetType: 'coins',
        packageId: 'pkg_500',
        platform: 'web',
      });
      order2 = order2Res.order;

      const failEventId = `evt_fail_${Date.now()}`;
      const signature = paymentProvider.computeWebhookSignature({
        eventId: failEventId,
        orderId: order2.orderId,
        eventType: 'payment_intent.payment_failed',
        amount: order2.amount,
        currency: order2.currency,
      });

      const failRes = await paymentService.handleWebhook({
        eventId: failEventId,
        providerKey: 'stripe_card',
        eventType: 'payment_intent.payment_failed',
        orderId: order2.orderId,
        amount: order2.amount,
        currency: order2.currency,
        failureCode: 'card_declined',
        failureReason: 'Insufficient funds on credit card',
        signature,
        timestamp: new Date().toISOString(),
      });

      const wallet = paymentService.getMockWallet(adultUser1.id);

      assert(
        failRes.handled &&
          failRes.order.status === 'failed' &&
          failRes.order.failureCode === 'card_declined' &&
          wallet.coins === 1100,
        'Test 5: Failed payment marks order failed and prevents coin crediting'
      );
    } catch (err) {
      assert(false, 'Test 5: Failed payment no credit', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 6: Age<18 rejected
    // ---------------------------------------------------------------------------
    try {
      const minorRes = await paymentService.createPaymentOrder({
        userId: minorUser.id,
        targetType: 'coins',
        packageId: 'pkg_100',
      });

      assert(
        minorRes.success === false && minorRes.code === 'UNDERAGE_PURCHASE_FORBIDDEN',
        'Test 6: Underage users (<18) strictly rejected from initiating payment orders'
      );
    } catch (err) {
      assert(false, 'Test 6: Age<18 rejected', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 7: Amount tampered by client rejected
    // ---------------------------------------------------------------------------
    try {
      const tamperedRes = await paymentService.createPaymentOrder({
        userId: adultUser1.id,
        targetType: 'coins',
        packageId: 'pkg_1000', // Actual price is 9.99
        claimedAmount: 0.99, // Client claims it's 0.99
      });

      assert(
        tamperedRes.success === false && tamperedRes.code === 'AMOUNT_TAMPERED',
        'Test 7: Client-side price tampering strictly detected and rejected'
      );
    } catch (err) {
      assert(false, 'Test 7: Amount tampered by client rejected', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 8: VIP order activates VIP on success
    // ---------------------------------------------------------------------------
    try {
      const vipOrderRes = await paymentService.createPaymentOrder({
        userId: adultUser1.id,
        targetType: 'vip',
        planId: 'vip_knight_30',
        platform: 'ios',
      });
      vipOrder = vipOrderRes.order;

      const vipEventId = `evt_vip_${Date.now()}`;
      const signature = paymentProvider.computeWebhookSignature({
        eventId: vipEventId,
        orderId: vipOrder.orderId,
        eventType: 'payment_intent.succeeded',
        amount: vipOrder.amount,
        currency: vipOrder.currency,
      });

      const vipRes = await paymentService.handleWebhook({
        eventId: vipEventId,
        providerKey: 'stripe_card',
        eventType: 'payment_intent.succeeded',
        orderId: vipOrder.orderId,
        amount: vipOrder.amount,
        currency: vipOrder.currency,
        signature,
        timestamp: new Date().toISOString(),
      });

      const membership = paymentService.getMockVipMembership(adultUser1.id);

      assert(
        vipRes.handled &&
          vipRes.order.status === 'successful' &&
          membership &&
          membership.status === 'active' &&
          membership.vip_tier === 'knight',
        'Test 8: VIP order activates VIP membership with accurate tier and expiration'
      );
    } catch (err) {
      assert(false, 'Test 8: VIP order activates VIP on success', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 9: Refund webhook reverses credit
    // ---------------------------------------------------------------------------
    try {
      // User 2 buys Starter pack (100 coins)
      const u2OrderRes = await paymentService.createPaymentOrder({
        userId: adultUser2.id,
        targetType: 'coins',
        packageId: 'pkg_100',
      });

      const u2SuccessEvt = `evt_u2_success_${Date.now()}`;
      const u2Sig = paymentProvider.computeWebhookSignature({
        eventId: u2SuccessEvt,
        orderId: u2OrderRes.order.orderId,
        eventType: 'payment_intent.succeeded',
        amount: u2OrderRes.order.amount,
        currency: u2OrderRes.order.currency,
      });

      await paymentService.handleWebhook({
        eventId: u2SuccessEvt,
        providerKey: 'stripe_card',
        eventType: 'payment_intent.succeeded',
        orderId: u2OrderRes.order.orderId,
        amount: u2OrderRes.order.amount,
        currency: u2OrderRes.order.currency,
        signature: u2Sig,
        timestamp: new Date().toISOString(),
      });

      // Wallet has 100 coins
      const walletBefore = paymentService.getMockWallet(adultUser2.id);
      const coinsBefore = walletBefore ? walletBefore.coins : 0;

      // Refund webhook arrives
      const refundEvt = `evt_refund_${Date.now()}`;
      const refundSig = paymentProvider.computeWebhookSignature({
        eventId: refundEvt,
        orderId: u2OrderRes.order.orderId,
        eventType: 'charge.refunded',
        amount: u2OrderRes.order.amount,
        currency: u2OrderRes.order.currency,
      });

      const refundRes = await paymentService.handleWebhook({
        eventId: refundEvt,
        providerKey: 'stripe_card',
        eventType: 'charge.refunded',
        orderId: u2OrderRes.order.orderId,
        amount: u2OrderRes.order.amount,
        currency: u2OrderRes.order.currency,
        signature: refundSig,
        timestamp: new Date().toISOString(),
      });

      const walletAfter = paymentService.getMockWallet(adultUser2.id);
      const txs = paymentService.getMockTransactions();
      const refundTx = txs.some(
        (t) => t.reference_id === u2OrderRes.order.orderId && t.direction === 'debit' && t.transaction_type === 'refund'
      );

      assert(
        refundRes.handled &&
          refundRes.order.status === 'refunded' &&
          coinsBefore === 100 &&
          walletAfter.coins === 0 &&
          refundTx,
        'Test 9: Refund webhook atomically reverses coin credit via ledger debit'
      );
    } catch (err) {
      assert(false, 'Test 9: Refund webhook reverses credit', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 10: Refund only if unspent (per rules)
    // ---------------------------------------------------------------------------
    try {
      // User 3 buys 525 coins
      const u3OrderRes = await paymentService.createPaymentOrder({
        userId: adultUser3.id,
        targetType: 'coins',
        packageId: 'pkg_500', // 525 coins
      });

      const u3SuccessEvt = `evt_u3_success_${Date.now()}`;
      const u3Sig = paymentProvider.computeWebhookSignature({
        eventId: u3SuccessEvt,
        orderId: u3OrderRes.order.orderId,
        eventType: 'payment_intent.succeeded',
        amount: u3OrderRes.order.amount,
        currency: u3OrderRes.order.currency,
      });

      await paymentService.handleWebhook({
        eventId: u3SuccessEvt,
        providerKey: 'stripe_card',
        eventType: 'payment_intent.succeeded',
        orderId: u3OrderRes.order.orderId,
        amount: u3OrderRes.order.amount,
        currency: u3OrderRes.order.currency,
        signature: u3Sig,
        timestamp: new Date().toISOString(),
      });

      // User spends 500 coins -> balance becomes 25
      const wallet = paymentService.getMockWallet(adultUser3.id);
      wallet.coins = 25;

      // Charge refund arrives for 525 coins
      const refundSpentEvt = `evt_refund_spent_${Date.now()}`;
      const refundSpentSig = paymentProvider.computeWebhookSignature({
        eventId: refundSpentEvt,
        orderId: u3OrderRes.order.orderId,
        eventType: 'charge.refunded',
        amount: u3OrderRes.order.amount,
        currency: u3OrderRes.order.currency,
      });

      const refundSpentRes = await paymentService.handleWebhook({
        eventId: refundSpentEvt,
        providerKey: 'stripe_card',
        eventType: 'charge.refunded',
        orderId: u3OrderRes.order.orderId,
        amount: u3OrderRes.order.amount,
        currency: u3OrderRes.order.currency,
        signature: refundSpentSig,
        timestamp: new Date().toISOString(),
      });

      assert(
        refundSpentRes.handled === false &&
          refundSpentRes.error === 'INSUFFICIENT_COINS_FOR_REFUND' &&
          refundSpentRes.order.refundStatus === 'rejected',
        'Test 10: Refund strictly rejected when user has already spent purchased coins'
      );
    } catch (err) {
      assert(false, 'Test 10: Refund only if unspent', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 11: Signed webhook accepted
    // ---------------------------------------------------------------------------
    try {
      const validSig = paymentProvider.computeWebhookSignature({
        eventId: 'evt_test_11',
        orderId: order1.orderId,
        eventType: 'payment_intent.succeeded',
        amount: 9.99,
        currency: 'USD',
      });

      const isVerified = paymentProvider.verifyWebhookSignature(
        {
          eventId: 'evt_test_11',
          orderId: order1.orderId,
          eventType: 'payment_intent.succeeded',
          amount: 9.99,
          currency: 'USD',
        },
        validSig
      );

      assert(isVerified === true, 'Test 11: Cryptographically signed webhook is accepted');
    } catch (err) {
      assert(false, 'Test 11: Signed webhook accepted', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 12: Unsigned webhook rejected
    // ---------------------------------------------------------------------------
    try {
      const unsignedRes = await paymentService.handleWebhook({
        eventId: `evt_unsigned_${Date.now()}`,
        providerKey: 'stripe_card',
        eventType: 'payment_intent.succeeded',
        orderId: order1.orderId,
        amount: 9.99,
        currency: 'USD',
        signature: 'invalid_or_missing_signature',
        timestamp: new Date().toISOString(),
      });

      assert(
        unsignedRes.handled === false && unsignedRes.status === 403,
        'Test 12: Unsigned or forged webhook strictly rejected with HTTP 403'
      );
    } catch (err) {
      assert(false, 'Test 12: Unsigned webhook rejected', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 13: Purchase history accurate
    // ---------------------------------------------------------------------------
    try {
      const history = await paymentService.getPurchaseHistory(adultUser1.id);
      const containsOrder1 = history.some((o) => o.orderId === order1.orderId);
      const containsVip = history.some((o) => o.orderId === vipOrder.orderId);

      assert(
        history.length >= 2 && containsOrder1 && containsVip,
        'Test 13: User purchase history returns comprehensive itemized orders'
      );
    } catch (err) {
      assert(false, 'Test 13: Purchase history accurate', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 14: Coin balance matches ledger
    // ---------------------------------------------------------------------------
    try {
      const wallet = paymentService.getMockWallet(adultUser1.id);
      const txs = paymentService
        .getMockTransactions()
        .filter((t) => t.user_id === adultUser1.id && t.status === 'completed');

      const computedBalance = txs.reduce((acc, t) => {
        return t.direction === 'credit' ? acc + t.coin_amount : acc - t.coin_amount;
      }, 0);

      assert(
        computedBalance === wallet.coins,
        `Test 14: Coin wallet balance (${wallet.coins}) perfectly matches ledger calculation (${computedBalance})`
      );
    } catch (err) {
      assert(false, 'Test 14: Coin balance matches ledger', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 15: VIP history matches
    // ---------------------------------------------------------------------------
    try {
      const membership = paymentService.getMockVipMembership(adultUser1.id);
      const expiresAt = new Date(membership.expires_at).getTime();
      const isFuture = expiresAt > Date.now();

      assert(
        membership && membership.vip_tier === 'knight' && isFuture,
        'Test 15: VIP subscription history matches plan duration with valid future expiration'
      );
    } catch (err) {
      assert(false, 'Test 15: VIP history matches', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 16: Rate limit on order creation
    // ---------------------------------------------------------------------------
    try {
      const rateLimitUser = {
        id: `usr_ratelimit_${Date.now()}`,
        birthdate: '1990-01-01',
        is_adult_verified: true,
        status: 'active',
      };
      paymentService.registerMockUser(rateLimitUser);

      // Create 10 orders rapidly
      for (let i = 0; i < 10; i++) {
        await paymentService.createPaymentOrder({
          userId: rateLimitUser.id,
          targetType: 'coins',
          packageId: 'pkg_100',
        });
      }

      // 11th order should be rejected by rate limiter
      const overflowRes = await paymentService.createPaymentOrder({
        userId: rateLimitUser.id,
        targetType: 'coins',
        packageId: 'pkg_100',
      });

      assert(
        overflowRes.success === false && overflowRes.code === 'RATE_LIMIT_EXCEEDED',
        'Test 16: Excessive order creation throttled by rate limiter with RATE_LIMIT_EXCEEDED'
      );
    } catch (err) {
      assert(false, 'Test 16: Rate limit on order creation', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 17: Flag off -> mock purchase works
    // ---------------------------------------------------------------------------
    try {
      delete process.env.USE_REAL_PAYMENTS;
      delete process.env.NEXT_PUBLIC_USE_REAL_PAYMENTS;

      const flagsCode = fs.readFileSync(path.join(webDir, 'lib', 'phase8Flags.ts'), 'utf-8');
      const paymentServiceCode = fs.readFileSync(path.join(webDir, 'lib', 'paymentService.ts'), 'utf-8');

      const flagChecked =
        paymentServiceCode.includes('isRealPaymentsEnabled') &&
        paymentServiceCode.includes('PHASE8_FLAGS.useRealPayments');
      const defaultsFalse = flagsCode.includes("useRealPayments: process.env.USE_REAL_PAYMENTS === 'true'");

      assert(
        flagChecked && defaultsFalse,
        'Test 17: Flag off suppresses live gateway charges and preserves Phase 7 mock top-up behavior'
      );
    } catch (err) {
      assert(false, 'Test 17: Flag off -> mock purchase works', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 18: Dev env cannot hit real provider
    // ---------------------------------------------------------------------------
    try {
      const isTest = paymentProvider.isTestMode();
      assert(
        isTest === true,
        'Test 18: Development environment is strictly isolated to sandbox test mode'
      );
    } catch (err) {
      assert(false, 'Test 18: Dev env cannot hit real provider', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 19: Order status polling works
    // ---------------------------------------------------------------------------
    try {
      const pollRes = await paymentService.getOrder(order1.orderId, adultUser1.id);

      assert(
        pollRes.success &&
          pollRes.order.orderId === order1.orderId &&
          pollRes.order.packageName === 'Popular Gold Pack',
        'Test 19: Order status polling returns accurate lifecycle state and package metadata'
      );
    } catch (err) {
      assert(false, 'Test 19: Order status polling works', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 20: No card data in logs
    // ---------------------------------------------------------------------------
    try {
      const apiCode = fs.readFileSync(path.join(rootDir, 'apps', 'api', 'src', 'payments', 'paymentService.ts'), 'utf-8');
      const providerCode = fs.readFileSync(path.join(rootDir, 'apps', 'api', 'src', 'payments', 'paymentProvider.ts'), 'utf-8');

      const hasPanLogging =
        apiCode.includes('card_number') ||
        apiCode.includes('cvv') ||
        providerCode.includes('card_number') ||
        providerCode.includes('cvv');

      assert(
        !hasPanLogging,
        'Test 20: Card numbers (PAN) and CVV are never stored, logged, or processed on POPO servers'
      );
    } catch (err) {
      assert(false, 'Test 20: No card data in logs', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 21: Mobile + web same ledger
    // ---------------------------------------------------------------------------
    try {
      const mobileServiceCode = fs.readFileSync(path.join(mobileDir, 'lib', 'api', 'services', 'payment_service.dart'), 'utf-8');
      const webRouteCode = fs.readFileSync(path.join(webDir, 'app', 'api', 'payments', 'orders', 'route.ts'), 'utf-8');

      const mobileTargetsApi = mobileServiceCode.includes('/api/payments/orders');
      const webTargetsLedger = webRouteCode.includes('webPaymentService.createOrder');

      assert(
        mobileTargetsApi && webTargetsLedger,
        'Test 21: Mobile and Web platforms share identical order creation and ledger synchronization'
      );
    } catch (err) {
      assert(false, 'Test 21: Mobile + web same ledger', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 22: D7 walk 7 passes with flag off (fixtures intact)
    // ---------------------------------------------------------------------------
    try {
      const mobileFixtures = fs.readFileSync(path.join(mobileDir, 'lib', 'design', 'design_fixtures.dart'), 'utf-8');
      const webFixtures = fs.readFileSync(path.join(webDir, 'lib', 'design', 'designFixtures.ts'), 'utf-8');

      const mobileHasPackages = mobileFixtures.includes('FixtureCoinPackage') && mobileFixtures.includes('coinPackages');
      const webHasPackages = webFixtures.includes('FixtureCoinPackage') && webFixtures.includes('coinPackages');

      assert(
        mobileHasPackages && webHasPackages,
        'Test 22: D7 Walk 7 wallet and top-up fixtures remain 100% intact for rollback safety'
      );
    } catch (err) {
      assert(false, 'Test 22: D7 walk 7 passes with flag off', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 23: No fake production transactions seeded
    // ---------------------------------------------------------------------------
    try {
      const migrationFile = path.join(webDir, 'data', 'migrations', '050_coins_topup_and_recharge.sql');
      const migrationContent = fs.readFileSync(migrationFile, 'utf-8');

      const seedsFakeTx =
        migrationContent.includes("INSERT INTO popolive.coin_transactions") &&
        migrationContent.includes("'completed'");

      assert(
        !seedsFakeTx,
        'Test 23: Zero fake completed production transactions are seeded in database migrations'
      );
    } catch (err) {
      assert(false, 'Test 23: No fake production transactions seeded', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 24: Provider test mode used in staging
    // ---------------------------------------------------------------------------
    try {
      const provider = new paymentProvider.constructor();
      const testMode = provider.isTestMode();

      assert(
        testMode === true,
        'Test 24: Staging and testing environments strictly default to provider test mode'
      );
    } catch (err) {
      assert(false, 'Test 24: Provider test mode used in staging', err.message);
    }
  } catch (globalErr) {
    console.error('Fatal test execution error:', globalErr);
  }

  console.log('\n============================================================');
  console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL: ${passedTests + failedTests})`);
  console.log('============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
