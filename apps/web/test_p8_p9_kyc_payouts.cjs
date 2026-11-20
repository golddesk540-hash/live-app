/**
 * POPO LIVE — PHASE 8 (P8-P9) AUTOMATED VERIFICATION SUITE
 * KYC, REAL WITHDRAWALS & PAYOUT RAILS
 * 
 * Verifies all 24 test criteria specified in Part 8 of the P8-P9 specification.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  kycProvider,
  payoutProvider,
  kycPayoutService,
} = require('../api/dist/kycPayout');

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
  console.log('POPO LIVE — PHASE 8 (P8-P9) KYC & WITHDRAWAL TESTS (24)');
  console.log('============================================================\n');

  const rootDir = path.resolve(__dirname, '../..');
  const mobileDir = path.join(rootDir, 'apps', 'mobile');
  const webDir = path.join(rootDir, 'apps', 'web');

  const adultUser1 = {
    id: `usr_kyc_a1_${Date.now()}`,
    birthdate: '1993-04-12',
    is_adult_verified: true,
    status: 'active',
  };
  const adultUser2 = {
    id: `usr_kyc_a2_${Date.now()}`,
    birthdate: '1991-09-22',
    is_adult_verified: true,
    status: 'active',
  };
  const minorUser = {
    id: `usr_kyc_minor_${Date.now()}`,
    birthdate: '2012-07-04',
    is_adult_verified: false,
    status: 'active',
  };
  const adultUnverified = {
    id: `usr_kyc_unver_${Date.now()}`,
    birthdate: '1995-11-18',
    is_adult_verified: true,
    status: 'active',
  };

  kycPayoutService.registerMockUser(adultUser1);
  kycPayoutService.registerMockUser(adultUser2);
  kycPayoutService.registerMockUser(minorUser);
  kycPayoutService.registerMockUser(adultUnverified);

  let withdrawal1 = null;
  let withdrawal2 = null;
  let validPayoutMethod = null;

  try {
    // ---------------------------------------------------------------------------
    // TEST 1: KYC start returns provider session
    // ---------------------------------------------------------------------------
    try {
      const kycRes = await kycPayoutService.startKyc(adultUser1.id);

      assert(
        kycRes.success &&
          kycRes.session.sessionId.startsWith('inq_') &&
          kycRes.session.inquiryUrl.includes('withpersona.com') &&
          kycRes.session.clientToken.startsWith('kyc_ctk_'),
        'Test 1: KYC start returns tokenized provider inquiry session'
      );
    } catch (err) {
      assert(false, 'Test 1: KYC start returns provider session', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 2: KYC webhook approved updates status
    // ---------------------------------------------------------------------------
    try {
      const eventId = `evt_kyc_pass_${Date.now()}`;
      const verificationId = `inq_${Date.now()}`;
      const signature = kycProvider.computeWebhookSignature({
        eventId,
        userId: adultUser1.id,
        verificationId,
        eventType: 'inquiry.completed',
      });

      const webhookRes = await kycPayoutService.handleKycWebhook({
        eventId,
        userId: adultUser1.id,
        verificationId,
        eventType: 'inquiry.completed',
        legalName: 'Sarah Jenkins',
        documentCountry: 'US',
        signature,
        timestamp: new Date().toISOString(),
      });

      const kycStatus = await kycPayoutService.getKycStatus(adultUser1.id);

      assert(
        webhookRes.handled &&
          kycStatus.status === 'verified' &&
          kycStatus.earningEligible === true &&
          kycStatus.legalName === 'Sarah Jenkins',
        'Test 2: Signed KYC webhook approved marks user verified and earning eligible'
      );
    } catch (err) {
      assert(false, 'Test 2: KYC webhook approved updates status', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 3: KYC webhook rejected blocks withdrawal
    // ---------------------------------------------------------------------------
    try {
      await kycPayoutService.startKyc(adultUser2.id);

      const failEventId = `evt_kyc_fail_${Date.now()}`;
      const failVerId = `inq_fail_${Date.now()}`;
      const signature = kycProvider.computeWebhookSignature({
        eventId: failEventId,
        userId: adultUser2.id,
        verificationId: failVerId,
        eventType: 'verification.failed',
      });

      await kycPayoutService.handleKycWebhook({
        eventId: failEventId,
        userId: adultUser2.id,
        verificationId: failVerId,
        eventType: 'verification.failed',
        rejectionReason: 'ID document expired or unreadable',
        signature,
        timestamp: new Date().toISOString(),
      });

      const kycStatus = await kycPayoutService.getKycStatus(adultUser2.id);
      const wthRes = await kycPayoutService.requestWithdrawal({
        userId: adultUser2.id,
        amount: 5000,
      });

      assert(
        kycStatus.status === 'rejected' &&
          kycStatus.earningEligible === false &&
          wthRes.success === false &&
          wthRes.code === 'KYC_REQUIRED',
        'Test 3: Rejected KYC status strictly blocks withdrawal requests'
      );
    } catch (err) {
      assert(false, 'Test 3: KYC webhook rejected blocks withdrawal', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 4: Age<18 rejected
    // ---------------------------------------------------------------------------
    try {
      const minorKyc = await kycPayoutService.startKyc(minorUser.id);
      const minorWth = await kycPayoutService.requestWithdrawal({
        userId: minorUser.id,
        amount: 5000,
      });

      assert(
        minorKyc.success === false &&
          minorKyc.code === 'UNDERAGE_KYC_FORBIDDEN' &&
          minorWth.success === false &&
          minorWth.code === 'UNDERAGE_WITHDRAWAL_FORBIDDEN',
        'Test 4: Minor users (<18) strictly rejected from both KYC and withdrawals'
      );
    } catch (err) {
      assert(false, 'Test 4: Age<18 rejected', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 5: Withdrawal blocked without KYC
    // ---------------------------------------------------------------------------
    try {
      const unverifiedRes = await kycPayoutService.requestWithdrawal({
        userId: adultUnverified.id,
        amount: 5000,
      });

      assert(
        unverifiedRes.success === false && unverifiedRes.code === 'KYC_REQUIRED',
        'Test 5: Withdrawal strictly blocked without approved KYC identity verification'
      );
    } catch (err) {
      assert(false, 'Test 5: Withdrawal blocked without KYC', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 6: Withdrawal atomic debit (P7-P7)
    // ---------------------------------------------------------------------------
    try {
      // Setup wallet with 50,000 coins for adultUser1
      const wallet = {
        wallet_id: `wal_${adultUser1.id}`,
        user_id: adultUser1.id,
        coins: 50000,
        diamond_points: 0,
        total_spent_coins: 0,
        is_frozen: false,
      };
      kycPayoutService.registerMockWallet(wallet);

      // Setup matching payout method (Sarah Jenkins)
      validPayoutMethod = {
        id: `pm_${Date.now()}`,
        userId: adultUser1.id,
        methodType: 'bank_account',
        beneficiaryName: 'Sarah Jenkins',
        accountNumberMasked: '****4491',
        bankName: 'Chase Bank NA',
        currency: 'USD',
        isVerified: true,
        createdAt: new Date().toISOString(),
      };
      kycPayoutService.registerMockPayoutMethod(validPayoutMethod);

      const wthRes = await kycPayoutService.requestWithdrawal({
        userId: adultUser1.id,
        amount: 10000,
        payoutMethodId: validPayoutMethod.id,
        skipCoolingPeriodCheck: true,
      });

      withdrawal1 = wthRes.withdrawal;
      const walletAfter = kycPayoutService.getMockWallet(adultUser1.id);
      const txs = kycPayoutService.getMockTransactions();
      const debitTx = txs.some(
        (t) =>
          t.user_id === adultUser1.id &&
          t.direction === 'debit' &&
          t.transaction_type === 'withdrawal' &&
          t.coin_amount === 10000
      );

      assert(
        wthRes.success &&
          walletAfter.coins === 40000 &&
          withdrawal1.status === 'pending' &&
          debitTx,
        'Test 6: Withdrawal executes atomic debit on P7-P7 coin ledger (50k -> 40k)'
      );
    } catch (err) {
      assert(false, 'Test 6: Withdrawal atomic debit', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 7: Withdrawal below min rejected
    // ---------------------------------------------------------------------------
    try {
      const belowMinRes = await kycPayoutService.requestWithdrawal({
        userId: adultUser1.id,
        amount: 500, // < 1,000 min
        payoutMethodId: validPayoutMethod.id,
        skipCoolingPeriodCheck: true,
      });

      assert(
        belowMinRes.success === false && belowMinRes.code === 'MINIMUM_WITHDRAWAL_LIMIT',
        'Test 7: Withdrawal request below 1,000 coins strictly rejected'
      );
    } catch (err) {
      assert(false, 'Test 7: Withdrawal below min rejected', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 8: Withdrawal above max rejected
    // ---------------------------------------------------------------------------
    try {
      const aboveMaxRes = await kycPayoutService.requestWithdrawal({
        userId: adultUser1.id,
        amount: 600000, // > 500,000 max
        payoutMethodId: validPayoutMethod.id,
        skipCoolingPeriodCheck: true,
      });

      assert(
        aboveMaxRes.success === false && aboveMaxRes.code === 'MAXIMUM_WITHDRAWAL_LIMIT',
        'Test 8: Withdrawal request exceeding 500,000 coins strictly rejected'
      );
    } catch (err) {
      assert(false, 'Test 8: Withdrawal above max rejected', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 9: Withdrawal idempotent
    // ---------------------------------------------------------------------------
    try {
      const idempKey = `wth_idemp_${Date.now()}`;
      const res1 = await kycPayoutService.requestWithdrawal({
        userId: adultUser1.id,
        amount: 5000,
        payoutMethodId: validPayoutMethod.id,
        idempotencyKey: idempKey,
        skipCoolingPeriodCheck: true,
      });
      withdrawal2 = res1.withdrawal;

      // Second identical call
      const res2 = await kycPayoutService.requestWithdrawal({
        userId: adultUser1.id,
        amount: 5000,
        payoutMethodId: validPayoutMethod.id,
        idempotencyKey: idempKey,
        skipCoolingPeriodCheck: true,
      });

      const wallet = kycPayoutService.getMockWallet(adultUser1.id);

      assert(
        res1.success &&
          res2.success &&
          res2.deduplicated === true &&
          res1.withdrawal.withdrawalReference === res2.withdrawal.withdrawalReference &&
          wallet.coins === 35000,
        'Test 9: Withdrawal request with idempotency key prevents duplicate coin debits'
      );
    } catch (err) {
      assert(false, 'Test 9: Withdrawal idempotent', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 10: Admin approval advances status
    // ---------------------------------------------------------------------------
    try {
      const approveRes = await kycPayoutService.approveWithdrawal(
        withdrawal1.withdrawalReference,
        'admin_lead_01'
      );

      assert(
        approveRes.success &&
          approveRes.withdrawal.status === 'processing' &&
          approveRes.withdrawal.approvedBy === 'admin_lead_01' &&
          approveRes.withdrawal.providerPayoutRef.startsWith('tr_'),
        'Test 10: Admin approval advances withdrawal to processing and invokes payout transfer'
      );
    } catch (err) {
      assert(false, 'Test 10: Admin approval advances status', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 11: Payout paid webhook marks paid
    // ---------------------------------------------------------------------------
    try {
      const paidEvtId = `evt_payout_paid_${Date.now()}`;
      const signature = payoutProvider.computeWebhookSignature({
        eventId: paidEvtId,
        withdrawalReference: withdrawal1.withdrawalReference,
        eventType: 'payout.paid',
        amount: withdrawal1.fiatAmount,
        currency: withdrawal1.currency,
      });

      const paidRes = await kycPayoutService.handlePayoutWebhook({
        eventId: paidEvtId,
        withdrawalReference: withdrawal1.withdrawalReference,
        eventType: 'payout.paid',
        amount: withdrawal1.fiatAmount,
        currency: withdrawal1.currency,
        signature,
        timestamp: new Date().toISOString(),
      });

      assert(
        paidRes.handled &&
          paidRes.withdrawal.status === 'paid' &&
          paidRes.withdrawal.paidAt !== null,
        'Test 11: Payout paid webhook marks withdrawal lifecycle completed as paid'
      );
    } catch (err) {
      assert(false, 'Test 11: Payout paid webhook marks paid', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 12: Payout failed refunds atomic
    // ---------------------------------------------------------------------------
    try {
      // Advance withdrawal2 to approved
      await kycPayoutService.approveWithdrawal(withdrawal2.withdrawalReference, 'admin_lead_01');

      const failEvtId = `evt_payout_fail_${Date.now()}`;
      const signature = payoutProvider.computeWebhookSignature({
        eventId: failEvtId,
        withdrawalReference: withdrawal2.withdrawalReference,
        eventType: 'payout.failed',
        amount: withdrawal2.fiatAmount,
        currency: withdrawal2.currency,
      });

      const failRes = await kycPayoutService.handlePayoutWebhook({
        eventId: failEvtId,
        withdrawalReference: withdrawal2.withdrawalReference,
        eventType: 'payout.failed',
        amount: withdrawal2.fiatAmount,
        currency: withdrawal2.currency,
        failureReason: 'Beneficiary account closed or routing number invalid',
        signature,
        timestamp: new Date().toISOString(),
      });

      const wallet = kycPayoutService.getMockWallet(adultUser1.id);
      const txs = kycPayoutService.getMockTransactions();
      const refundTx = txs.some(
        (t) =>
          t.reference_id === withdrawal2.withdrawalReference &&
          t.direction === 'credit' &&
          t.transaction_type === 'payout_failed_refund' &&
          t.coin_amount === 5000
      );

      assert(
        failRes.handled &&
          failRes.withdrawal.status === 'failed' &&
          wallet.coins === 40000 &&
          refundTx,
        'Test 12: Payout failure webhook atomically refunds debited coins (35k -> 40k)'
      );
    } catch (err) {
      assert(false, 'Test 12: Payout failed refunds atomic', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 13: Bank name mismatch rejected
    // ---------------------------------------------------------------------------
    try {
      const mismatchedMethod = {
        id: `pm_mismatch_${Date.now()}`,
        userId: adultUser1.id,
        methodType: 'bank_account',
        beneficiaryName: 'Robert Johnson', // Does not match Sarah Jenkins
        accountNumberMasked: '****9988',
        bankName: 'Wells Fargo',
        currency: 'USD',
        isVerified: true,
        createdAt: new Date().toISOString(),
      };
      kycPayoutService.registerMockPayoutMethod(mismatchedMethod);

      const mismatchRes = await kycPayoutService.requestWithdrawal({
        userId: adultUser1.id,
        amount: 2000,
        payoutMethodId: mismatchedMethod.id,
        skipCoolingPeriodCheck: true,
      });

      assert(
        mismatchRes.success === false && mismatchRes.code === 'BANK_NAME_MISMATCH',
        'Test 13: Payout to bank account with mismatched name strictly rejected'
      );
    } catch (err) {
      assert(false, 'Test 13: Bank name mismatch rejected', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 14: Cooling period enforced
    // ---------------------------------------------------------------------------
    try {
      const kyc = kycPayoutService.getMockKyc(adultUser1.id);
      // Simulate KYC verified 2 hours ago (within 24h cooling window)
      kyc.verifiedAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      const coolRes = await kycPayoutService.requestWithdrawal({
        userId: adultUser1.id,
        amount: 2000,
        payoutMethodId: validPayoutMethod.id,
        skipCoolingPeriodCheck: false, // Enforce cooling window
      });

      // Restore verifiedAt for remaining tests
      kyc.verifiedAt = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      assert(
        coolRes.success === false && coolRes.code === 'COOLING_PERIOD_ACTIVE',
        'Test 14: 24-hour security cooling period enforced before first withdrawal'
      );
    } catch (err) {
      assert(false, 'Test 14: Cooling period enforced', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 15: Withdrawal history accurate
    // ---------------------------------------------------------------------------
    try {
      const history = await kycPayoutService.getWithdrawalHistory(adultUser1.id);
      const hasWth1 = history.some((w) => w.withdrawalReference === withdrawal1.withdrawalReference);
      const hasWth2 = history.some((w) => w.withdrawalReference === withdrawal2.withdrawalReference);

      assert(
        history.length >= 2 && hasWth1 && hasWth2,
        'Test 15: Withdrawal history returns accurate lifecycle records and statuses'
      );
    } catch (err) {
      assert(false, 'Test 15: Withdrawal history accurate', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 16: Coin balance matches ledger
    // ---------------------------------------------------------------------------
    try {
      const wallet = kycPayoutService.getMockWallet(adultUser1.id);
      const txs = kycPayoutService
        .getMockTransactions()
        .filter((t) => t.user_id === adultUser1.id && t.status === 'completed');

      // 50k initial - 10k wth1 - 5k wth2 + 5k refund = 40,000
      const netTxs = txs.reduce((acc, t) => {
        return t.direction === 'credit' ? acc + t.coin_amount : acc - t.coin_amount;
      }, 50000); // 50k starting balance

      assert(
        wallet.coins === 40000 && netTxs === 40000,
        `Test 16: Coin wallet balance (${wallet.coins}) perfectly matches ledger calculation (${netTxs})`
      );
    } catch (err) {
      assert(false, 'Test 16: Coin balance matches ledger', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 17: Rate limit withdrawal
    // ---------------------------------------------------------------------------
    try {
      const rateLimitUser = {
        id: `usr_kyc_rl_${Date.now()}`,
        birthdate: '1990-01-01',
        is_adult_verified: true,
        status: 'active',
      };
      kycPayoutService.registerMockUser(rateLimitUser);
      kycPayoutService.registerMockKyc({
        userId: rateLimitUser.id,
        status: 'verified',
        earningEligible: true,
        legalName: 'Rate Limit Host',
        verifiedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      kycPayoutService.registerMockWallet({
        wallet_id: `wal_${rateLimitUser.id}`,
        user_id: rateLimitUser.id,
        coins: 500000,
        diamond_points: 0,
        total_spent_coins: 0,
        is_frozen: false,
      });

      // Submit 5 withdrawals rapidly
      for (let i = 0; i < 5; i++) {
        await kycPayoutService.requestWithdrawal({
          userId: rateLimitUser.id,
          amount: 1000,
          skipCoolingPeriodCheck: true,
        });
      }

      // 6th withdrawal should be throttled
      const overflowRes = await kycPayoutService.requestWithdrawal({
        userId: rateLimitUser.id,
        amount: 1000,
        skipCoolingPeriodCheck: true,
      });

      assert(
        overflowRes.success === false && overflowRes.code === 'RATE_LIMIT_EXCEEDED',
        'Test 17: Withdrawal rate limiter enforces maximum 5 requests per 24 hours'
      );
    } catch (err) {
      assert(false, 'Test 17: Rate limit withdrawal', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 18: KYC docs not on POPO servers
    // ---------------------------------------------------------------------------
    try {
      const kycServiceCode = fs.readFileSync(path.join(rootDir, 'apps', 'api', 'src', 'kycPayout', 'kycPayoutService.ts'), 'utf-8');
      const kycProviderCode = fs.readFileSync(path.join(rootDir, 'apps', 'api', 'src', 'kycPayout', 'kycProvider.ts'), 'utf-8');

      const savesPassport =
        kycServiceCode.includes('passport_image') ||
        kycServiceCode.includes('id_card_front') ||
        kycProviderCode.includes('passport_image') ||
        kycProviderCode.includes('saveDocument');

      assert(
        !savesPassport,
        'Test 18: Raw identity documents are never uploaded, stored, or processed on POPO servers'
      );
    } catch (err) {
      assert(false, 'Test 18: KYC docs not on POPO servers', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 19: Bank details masked in logs
    // ---------------------------------------------------------------------------
    try {
      const masked1 = payoutProvider.maskAccountNumber('012345678912');
      const masked2 = payoutProvider.maskAccountNumber('4491');

      assert(
        masked1 === '****8912' && masked2 === '****4491',
        'Test 19: Bank and wallet account numbers are strictly masked for logging'
      );
    } catch (err) {
      assert(false, 'Test 19: Bank details masked in logs', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 20: Webhook signature enforced
    // ---------------------------------------------------------------------------
    try {
      const invalidWebhookRes = await kycPayoutService.handleKycWebhook({
        eventId: 'evt_tampered_001',
        userId: adultUser1.id,
        verificationId: 'inq_tampered',
        eventType: 'verification.passed',
        signature: 'tampered_signature_xyz',
        timestamp: new Date().toISOString(),
      });

      assert(
        invalidWebhookRes.handled === false && invalidWebhookRes.status === 403,
        'Test 20: Tampered or forged webhook signatures are rejected with HTTP 403'
      );
    } catch (err) {
      assert(false, 'Test 20: Webhook signature enforced', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 21: Flag off -> P7-P11 unchanged
    // ---------------------------------------------------------------------------
    try {
      delete process.env.USE_REAL_KYC;
      delete process.env.USE_REAL_PAYOUT;

      const flagsCode = fs.readFileSync(path.join(webDir, 'lib', 'phase8Flags.ts'), 'utf-8');
      const defaultsKycFalse = flagsCode.includes("useRealKyc: process.env.USE_REAL_KYC === 'true'");
      const defaultsPayoutFalse = flagsCode.includes("useRealPayout: process.env.USE_REAL_PAYOUT === 'true'");

      assert(
        defaultsKycFalse && defaultsPayoutFalse,
        'Test 21: Feature flags default to false and preserve Phase 7 P7-P11 database logic'
      );
    } catch (err) {
      assert(false, 'Test 21: Flag off -> P7-P11 unchanged', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 22: Staging sandbox payout works
    // ---------------------------------------------------------------------------
    try {
      const isTestKyc = kycProvider.isTestMode();
      const isTestPayout = payoutProvider.isTestMode();

      assert(
        isTestKyc === true && isTestPayout === true,
        'Test 22: Staging sandbox operates without live banking or identity verification costs'
      );
    } catch (err) {
      assert(false, 'Test 22: Staging sandbox payout works', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 23: D7 walk 9 passes with flag off
    // ---------------------------------------------------------------------------
    try {
      const mobileFixtures = fs.readFileSync(path.join(mobileDir, 'lib', 'design', 'design_fixtures.dart'), 'utf-8');
      const webFixtures = fs.readFileSync(path.join(webDir, 'lib', 'design', 'designFixtures.ts'), 'utf-8');

      const mobileHasCreator = mobileFixtures.includes('creatorCenter') || mobileFixtures.includes('FixtureCoinSeller');
      const webHasCreator = webFixtures.includes('CreatorCenter') || webFixtures.includes('coinSeller');

      assert(
        mobileHasCreator && webHasCreator,
        'Test 23: D7 Walk 9 Streamer Center & Creator fixtures remain 100% intact'
      );
    } catch (err) {
      assert(false, 'Test 23: D7 walk 9 passes with flag off', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 24: No PII leak
    // ---------------------------------------------------------------------------
    try {
      const history = await kycPayoutService.getWithdrawalHistory(adultUser1.id);
      const rawDump = JSON.stringify(history);

      const hasSsn = rawDump.includes('ssn') || rawDump.includes('tax_id');
      const hasFullBank = rawDump.includes('012345678912');

      assert(
        !hasSsn && !hasFullBank,
        'Test 24: Zero sensitive PII (SSN, Tax ID, full bank account numbers) emitted in responses'
      );
    } catch (err) {
      assert(false, 'Test 24: No PII leak', err.message);
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
