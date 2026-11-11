const http = require('http');
const https = require('https');
const crypto = require('crypto');

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const isHttps = baseUrl.startsWith('https');
const client = isHttps ? https : http;

const AUTH_SECRET = process.env.AUTH_SECRET || 'poppo-live-auth-secret-super-secure-key-2026';
const DEMO_USER_ID = 'user_wallet_demo_701';
const RUN_ID = Date.now();

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

function signTopup(userId, amount, referenceId) {
  return crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`${userId}:${amount}:${referenceId}`)
    .digest('hex');
}

function extractCookies(setCookieHeaders, existingMap = {}) {
  if (!Array.isArray(setCookieHeaders)) return existingMap;
  for (const header of setCookieHeaders) {
    const firstPart = header.split(';')[0];
    const eqIdx = firstPart.indexOf('=');
    if (eqIdx > 0) {
      const name = firstPart.slice(0, eqIdx).trim();
      const val = firstPart.slice(eqIdx + 1).trim();
      existingMap[name] = val;
    }
  }
  return existingMap;
}

function formatCookieHeader(cookieMap) {
  return Object.entries(cookieMap)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        Accept: 'application/json, text/html, */*',
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {
          json = null;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json,
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body !== null) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function loginAs(email, password) {
  const cookieJar = {};

  // 1. Accept Terms Gate
  const consentRes = await request('POST', '/api/consent', {
    action: 'accept',
    termsAccepted: true,
    privacyAccepted: true,
    isAdultConfirmed: true,
    language: 'en',
  });
  extractCookies(consentRes.headers['set-cookie'], cookieJar);

  // 2. Authenticate session
  const loginRes = await request(
    'POST',
    '/api/auth/login',
    { email, password },
    { Cookie: formatCookieHeader(cookieJar) }
  );
  extractCookies(loginRes.headers['set-cookie'], cookieJar);

  return {
    statusCode: loginRes.statusCode,
    user: loginRes.json?.user || null,
    cookieHeader: formatCookieHeader(cookieJar),
  };
}

function openSseAndCapture(userId, triggerAction) {
  return new Promise((resolve, reject) => {
    const url = new URL(`/api/wallet/events?userId=${encodeURIComponent(userId)}&preview=demo`, baseUrl);
    const options = {
      method: 'GET',
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      headers: { Accept: 'text/event-stream' },
    };

    let buffer = '';
    let connectedRestored = null;
    let coinUpdatedEvent = null;
    let triggered = false;

    const req = client.request(options, (res) => {
      res.setEncoding('utf8');
      res.on('data', async (chunk) => {
        buffer += chunk;

        // Parse SSE blocks separated by \n\n
        let boundary;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const block = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);

          let eventName = 'message';
          let dataLine = '';
          for (const line of block.split('\n')) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            if (line.startsWith('data:')) dataLine += line.slice(5).trim();
          }

          if (eventName === 'connected' && dataLine) {
            try {
              connectedRestored = JSON.parse(dataLine);
            } catch (_) {}
            if (!triggered) {
              triggered = true;
              triggerAction().catch(() => {});
            }
          }

          if (eventName === 'wallet:coin_balance_updated' && dataLine) {
            try {
              coinUpdatedEvent = JSON.parse(dataLine);
            } catch (_) {}
            clearTimeout(timer);
            req.destroy();
            resolve({ statusCode: res.statusCode, connectedRestored, coinUpdatedEvent });
            return;
          }
        }
      });
    });

    req.on('error', (err) => {
      if (!coinUpdatedEvent) reject(err);
    });

    const timer = setTimeout(() => {
      req.destroy();
      resolve({ statusCode: 200, connectedRestored, coinUpdatedEvent, timedOut: true });
    }, 8000);

    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('  MODULE 7.1: COINS AND POINTS SYSTEM — FULL PRODUCTION TEST SUITE');
  console.log(`  Target: ${baseUrl}`);
  console.log(`  Run ID: ${RUN_ID}`);
  console.log('================================================================\n');

  try {
    // ------------------------------------------------------------------------
    // TEST 1: New test user receives approved initial coin/points balance (0/0)
    // ------------------------------------------------------------------------
    console.log('[Test 1] New user receives approved initial balance (0 coins, 0 points) & single wallet constraint');
    const newUserId = `test_new_${RUN_ID}`;
    const newBalRes1 = await request('GET', `/api/wallet/balance?userId=${newUserId}&preview=demo`);
    const newBalRes2 = await request('GET', `/api/wallet/balance?userId=${newUserId}&preview=demo`);
    assert(newBalRes1.statusCode === 200 && newBalRes1.json?.success === true, 'New wallet provisioned cleanly');
    assert(newBalRes1.json?.wallet?.coins === 0, `Initial coin balance matches finance rule = 0 (got ${newBalRes1.json?.wallet?.coins})`);
    assert(newBalRes1.json?.wallet?.points === 0, `Initial points balance matches finance rule = 0 (got ${newBalRes1.json?.wallet?.points})`);
    assert(
      newBalRes1.json?.wallet?.walletId && newBalRes1.json?.wallet?.walletId === newBalRes2.json?.wallet?.walletId,
      'Single wallet UUID per user enforced across repeated lookups'
    );

    // ------------------------------------------------------------------------
    // TEST 2: Canonical Demo Wallet (12,500 coins, 8,420 points matching 07_01)
    // ------------------------------------------------------------------------
    console.log('\n[Test 2] Canonical Demo Wallet (user_wallet_demo_701) matches 07_01 design (12,500 coins, 8,420 points)');
    const demoBal = await request('GET', `/api/wallet/balance?userId=${DEMO_USER_ID}&preview=demo&fresh=true`);
    assert(demoBal.statusCode === 200 && demoBal.json?.success === true, 'Demo wallet returned HTTP 200');
    assert(demoBal.json?.wallet?.coins === 12500, `Demo wallet coins = 12,500 (got ${demoBal.json?.wallet?.coins})`);
    assert(demoBal.json?.wallet?.points === 8420, `Demo wallet points = 8,420 (got ${demoBal.json?.wallet?.points})`);
    assert(demoBal.json?.wallet?.hostSharePercentage === 70, `Host gift share rule = 70% (got ${demoBal.json?.wallet?.hostSharePercentage}%)`);

    // ------------------------------------------------------------------------
    // Login Finance Admin, Ordinary Admin, and Regular Viewer
    // ------------------------------------------------------------------------
    console.log('\n[Auth] Signing in finance_admin, ordinary admin, and standard viewer...');
    const financeAuth = await loginAs('finance@popolive.com', 'FinancePass123!');
    const ordinaryAdminAuth = await loginAs('ordinaryadmin@popolive.com', 'AdminPass123!');
    const viewerAuth = await loginAs('viewer701@popolive.com', 'ViewerPass123!');
    assert(financeAuth.statusCode === 200 && financeAuth.cookieHeader.includes('poppo_session'), 'finance@popolive.com signed in cleanly');
    assert(ordinaryAdminAuth.statusCode === 200 && ordinaryAdminAuth.cookieHeader.includes('poppo_session'), 'ordinaryadmin@popolive.com signed in cleanly');
    assert(viewerAuth.statusCode === 200 && viewerAuth.cookieHeader.includes('poppo_session'), 'viewer701@popolive.com signed in cleanly');

    // ------------------------------------------------------------------------
    // TEST 8: Unverified top-up fails (403); HMAC-signed top-up succeeds
    // ------------------------------------------------------------------------
    console.log('\n[Test 8] Top-up security: unverified request rejected (403); HMAC-signed top-up succeeds');
    const senderId = `test_sender_${RUN_ID}`;
    const hostId = `test_host_${RUN_ID}`;

    const badTopupRes = await request('POST', '/api/wallet/topup/credit', {
      userId: senderId,
      amount: 1000,
      referenceId: `UNVERIFIED_${RUN_ID}`,
    });
    assert(badTopupRes.statusCode === 403 && badTopupRes.json?.code === 'UNAUTHORIZED_TOPUP_CREDIT', `Unverified top-up rejected with 403 (${badTopupRes.statusCode})`);

    const topupRef = `ORD_VERIFIED_${RUN_ID}`;
    const topupSig = signTopup(senderId, 1000, topupRef);
    const goodTopupRes = await request(
      'POST',
      '/api/wallet/topup/credit',
      {
        userId: senderId,
        amount: 1000,
        referenceId: topupRef,
        idempotencyKey: `IDEMP_TOPUP_${RUN_ID}`,
        description: 'Test Suite Verified Coin Top-up',
      },
      { 'x-topup-signature': topupSig }
    );
    assert(goodTopupRes.statusCode === 200 && goodTopupRes.json?.success === true, 'HMAC-signed top-up credited 1,000 coins');
    assert(goodTopupRes.json?.wallet?.coins === 1000, `Sender balance after top-up = 1,000 (got ${goodTopupRes.json?.wallet?.coins})`);
    assert(goodTopupRes.json?.wallet?.points === 0, 'Top-up did NOT touch host points balance (stays 0)');
    assert(goodTopupRes.json?.transaction?.transactionType === 'topup', 'Transaction logged with type "topup"');

    // ------------------------------------------------------------------------
    // TEST 3: Gift transfer deducts sender coins and credits host 70% points
    // ------------------------------------------------------------------------
    console.log('\n[Test 3] Gift transfer: 500 coin gift deducts 500 sender coins & credits 350 host points (70%)');
    const giftIdemp = `IDEMP_GIFT_1_${RUN_ID}`;
    const giftRes = await request('POST', '/api/wallet/gift-transfer', {
      senderId,
      senderName: 'Suite Sender',
      hostUserId: hostId,
      giftCoins: 500,
      giftName: 'Luxury Car',
      isPkBattle: false,
      referenceId: `GIFT_REF_${RUN_ID}`,
      idempotencyKey: giftIdemp,
    });
    assert(giftRes.statusCode === 200 && giftRes.json?.success === true, 'Gift transfer returned HTTP 200 success');
    assert(giftRes.json?.senderWallet?.coins === 500, `Sender remaining coins = 500 (got ${giftRes.json?.senderWallet?.coins})`);
    assert(giftRes.json?.senderWallet?.points === 0, 'Sender points untouched (strict separation)');
    assert(giftRes.json?.hostWallet?.points === 350, `Host received 70% share = 350 points (got ${giftRes.json?.hostWallet?.points})`);
    assert(giftRes.json?.hostWallet?.coins === 0, 'Host coins untouched by receiving gift points (strict separation)');
    assert(giftRes.json?.financialSummary?.hostSharePercentage === 70, 'Financial summary records 70% share');

    // ------------------------------------------------------------------------
    // TEST 5: Duplicate idempotencyKey rejects/replays without double deduction or double points
    // ------------------------------------------------------------------------
    console.log('\n[Test 5] Idempotency protection: replaying same idempotencyKey prevents double deduction & double points');
    const dupGiftRes = await request('POST', '/api/wallet/gift-transfer', {
      senderId,
      senderName: 'Suite Sender',
      hostUserId: hostId,
      giftCoins: 500,
      giftName: 'Luxury Car',
      isPkBattle: false,
      referenceId: `GIFT_REF_${RUN_ID}`,
      idempotencyKey: giftIdemp,
    });
    assert(dupGiftRes.statusCode === 200 && dupGiftRes.json?.isDuplicate === true, 'Duplicate idempotencyKey flagged isDuplicate=true');
    assert(dupGiftRes.json?.senderWallet?.coins === 500, `Sender coins remain 500 (got ${dupGiftRes.json?.senderWallet?.coins})`);
    assert(dupGiftRes.json?.hostWallet?.points === 350, `Host points remain 350 (got ${dupGiftRes.json?.hostWallet?.points})`);

    // ------------------------------------------------------------------------
    // TEST 4: Insufficient balance gift fails without deducting coins & records 'failed' in Coin History
    // ------------------------------------------------------------------------
    console.log('\n[Test 4] Insufficient balance fails safely without deducting coins & logs "failed" Coin History');
    const failGiftRes = await request('POST', '/api/wallet/gift-transfer', {
      senderId,
      senderName: 'Suite Sender',
      hostUserId: hostId,
      giftCoins: 9999,
      giftName: 'Super Yacht',
      referenceId: `GIFT_FAIL_${RUN_ID}`,
      idempotencyKey: `IDEMP_FAIL_${RUN_ID}`,
    });
    assert(failGiftRes.statusCode === 400 && failGiftRes.json?.code === 'INSUFFICIENT_COINS', `Insufficient funds returned 400 INSUFFICIENT_COINS`);
    assert(failGiftRes.json?.senderWallet?.coins === 500, `Sender balance unchanged at 500 (got ${failGiftRes.json?.senderWallet?.coins})`);
    assert(failGiftRes.json?.transaction?.status === 'failed', 'Returned failed coin transaction record');

    // Verify failed transaction appears when filtering Coin History
    const failedHistRes = await request('GET', `/api/wallet/coins/history?userId=${senderId}&status=failed&preview=demo`);
    assert(
      failedHistRes.statusCode === 200 && failedHistRes.json?.transactions?.some((t) => t.status === 'failed' && t.coinAmount === 9999),
      'Failed 9,999 coin attempt recorded in Coin History with status="failed" & zero balance change'
    );

    // ------------------------------------------------------------------------
    // TEST 6: Negative values rejected on gift transfer & admin debit below zero
    // ------------------------------------------------------------------------
    console.log('\n[Test 6] Negative amount & negative resulting balance protection');
    const negGiftRes = await request('POST', '/api/wallet/gift-transfer', {
      senderId,
      hostUserId: hostId,
      giftCoins: -100,
    });
    assert(negGiftRes.statusCode === 400 && negGiftRes.json?.code === 'INVALID_AMOUNT', `Negative gift amount rejected (400)`);

    const overDebitRes = await request(
      'POST',
      '/api/admin/finance/adjust',
      {
        targetUserId: senderId,
        balanceType: 'coins',
        operation: 'debit',
        amount: 50000,
        reason: 'Attempt debit greater than 500 balance',
      },
      { Cookie: financeAuth.cookieHeader }
    );
    assert(
      overDebitRes.statusCode === 400 && overDebitRes.json?.code === 'NEGATIVE_BALANCE_FORBIDDEN',
      `Admin debit exceeding balance rejected with 400 NEGATIVE_BALANCE_FORBIDDEN`
    );

    // ------------------------------------------------------------------------
    // TEST 7: Direct client balance mutation & spoofed financial overrides blocked (403)
    // ------------------------------------------------------------------------
    console.log('\n[Test 7] Direct client mutation & financial override tamper attempts blocked (403)');
    const postBalRes = await request('POST', '/api/wallet/balance', { userId: senderId, coins: 999999 });
    const putBalRes = await request('PUT', '/api/wallet/balance', { userId: senderId, points: 999999 });
    const spoofShareRes = await request('POST', '/api/wallet/gift-transfer', {
      senderId,
      hostUserId: hostId,
      giftCoins: 10,
      hostPoints: 999999,
      sharePercentage: 100,
    });
    assert(postBalRes.statusCode === 403 && postBalRes.json?.code === 'DIRECT_CLIENT_MUTATION_FORBIDDEN', 'POST /api/wallet/balance blocked (403)');
    assert(putBalRes.statusCode === 403 && putBalRes.json?.code === 'DIRECT_CLIENT_MUTATION_FORBIDDEN', 'PUT /api/wallet/balance blocked (403)');
    assert(
      spoofShareRes.statusCode === 403 && spoofShareRes.json?.code === 'CLIENT_FINANCIAL_OVERRIDE_FORBIDDEN',
      'Spoofed hostPoints/sharePercentage in gift-transfer blocked (403)'
    );

    // ------------------------------------------------------------------------
    // TEST 9: Coin History & Points History pagination, filtering, source, prev/new balance
    // ------------------------------------------------------------------------
    console.log('\n[Test 9] Coin History & Points History pagination, status filtering, and balance snapshots');
    const coinHistPage = await request('GET', `/api/wallet/coins/history?userId=${senderId}&page=1&limit=2&preview=demo`);
    assert(coinHistPage.statusCode === 200 && coinHistPage.json?.transactions?.length === 2, 'Coin history pagination limit=2 respected');
    assert(coinHistPage.json?.pagination?.total >= 3, `Total coin ledger count >= 3 (got ${coinHistPage.json?.pagination?.total})`);
    const giftCoinTx = coinHistPage.json?.transactions?.find((t) => t.transactionType === 'gift_sent' && t.status === 'completed');
    assert(
      giftCoinTx && giftCoinTx.previousBalance === 1000 && giftCoinTx.newBalance === 500,
      'Completed coin transaction displays exact previousBalance (1000) -> newBalance (500)'
    );

    const ptsHistPage = await request('GET', `/api/wallet/points/history?userId=${hostId}&status=completed&preview=demo`);
    assert(ptsHistPage.statusCode === 200 && ptsHistPage.json?.transactions?.length >= 1, 'Host points history returned completed earnings');
    const ptsTx = ptsHistPage.json?.transactions?.[0];
    assert(
      ptsTx && ptsTx.pointsAmount === 350 && ptsTx.sourceGiftCoins === 500 && ptsTx.sharePercentageApplied === 70,
      'Points history shows 350 points = 70% share of 500 gift coins & gift source'
    );

    // ------------------------------------------------------------------------
    // TEST 10: Privacy isolation: regular user rejected 403 when reading another real user's wallet
    // ------------------------------------------------------------------------
    console.log('\n[Test 10] Private financial isolation: viewer701 rejected 403 on another user balance & SSE');
    const financeAdminUuid = 'a0000000-0000-0000-0000-000000000097';
    const ownWalletRes = await request(
      'GET',
      `/api/wallet/balance?userId=${viewerAuth.user?.id}`,
      null,
      { Cookie: viewerAuth.cookieHeader }
    );
    const otherWalletRes = await request(
      'GET',
      `/api/wallet/balance?userId=${financeAdminUuid}`,
      null,
      { Cookie: viewerAuth.cookieHeader }
    );
    const otherSseRes = await request(
      'GET',
      `/api/wallet/events?userId=${financeAdminUuid}`,
      null,
      { Cookie: viewerAuth.cookieHeader }
    );
    assert(ownWalletRes.statusCode === 200 && ownWalletRes.json?.success === true, 'Logged-in viewer can view their own wallet');
    assert(otherWalletRes.statusCode === 403 && otherWalletRes.json?.code === 'PRIVATE_WALLET_ACCESS_DENIED', 'Viewer blocked (403) reading another user balance');
    assert(otherSseRes.statusCode === 403 && otherSseRes.json?.code === 'PRIVATE_WALLET_ACCESS_DENIED', 'Viewer blocked (403) subscribing to another user wallet SSE');

    // ------------------------------------------------------------------------
    // TEST 11: RBAC: ordinary admin & user get 403 on finance controls; finance_admin succeeds & logs audit
    // ------------------------------------------------------------------------
    console.log('\n[Test 11] RBAC: ordinary admin/viewer rejected (403); finance_admin succeeds with mandatory audit log');
    const userAdjustRes = await request(
      'POST',
      '/api/admin/finance/adjust',
      { targetUserId: senderId, balanceType: 'coins', operation: 'credit', amount: 100, reason: 'Unauthorized attempt' },
      { Cookie: viewerAuth.cookieHeader }
    );
    const ordinaryAdjustRes = await request(
      'POST',
      '/api/admin/finance/adjust',
      { targetUserId: senderId, balanceType: 'coins', operation: 'credit', amount: 100, reason: 'Ordinary admin attempt' },
      { Cookie: ordinaryAdminAuth.cookieHeader }
    );
    assert(userAdjustRes.statusCode === 403 && userAdjustRes.json?.code === 'FINANCE_ADMIN_REQUIRED', 'Regular user rejected (403) on /api/admin/finance/adjust');
    assert(ordinaryAdjustRes.statusCode === 403 && ordinaryAdjustRes.json?.code === 'FINANCE_ADMIN_REQUIRED', 'Ordinary admin rejected (403) on /api/admin/finance/adjust');

    const auditReason = `Finance approved test bonus ${RUN_ID}`;
    const financeAdjustRes = await request(
      'POST',
      '/api/admin/finance/adjust',
      {
        targetUserId: senderId,
        balanceType: 'coins',
        operation: 'credit',
        amount: 200,
        reason: auditReason,
        idempotencyKey: `IDEMP_ADM_${RUN_ID}`,
      },
      { Cookie: financeAuth.cookieHeader }
    );
    assert(financeAdjustRes.statusCode === 200 && financeAdjustRes.json?.success === true, 'Authorized finance_admin credited 200 coins');
    assert(financeAdjustRes.json?.wallet?.coins === 700, `Sender balance now 700 (500 + 200, got ${financeAdjustRes.json?.wallet?.coins})`);

    const auditLogRes = await request(
      'GET',
      `/api/admin/finance/audit-logs?userId=${senderId}&limit=10`,
      null,
      { Cookie: financeAuth.cookieHeader }
    );
    assert(
      auditLogRes.statusCode === 200 &&
        auditLogRes.json?.logs?.some(
          (l) => l.reason === auditReason && l.actorId === financeAuth.user?.id && l.actionType === 'admin_coin_adjustment'
        ),
      'Wallet audit log captured finance_admin actorId and exact reason'
    );

    // ------------------------------------------------------------------------
    // TEST 12: Transaction reversal creates linked reversal tx, restores balance, marks original 'reversed'
    // ------------------------------------------------------------------------
    console.log('\n[Test 12] Transaction reversal: restores balance, keeps original row with status="reversed", creates linked reversal');
    const adjTxId = financeAdjustRes.json?.transaction?.transactionId;
    const revOrdAdmin = await request(
      'POST',
      '/api/admin/finance/reverse',
      { transactionId: adjTxId, ledgerType: 'coins', reason: 'Ordinary admin cannot reverse' },
      { Cookie: ordinaryAdminAuth.cookieHeader }
    );
    assert(revOrdAdmin.statusCode === 403 && revOrdAdmin.json?.code === 'FINANCE_ADMIN_REQUIRED', 'Ordinary admin blocked from reversing transactions (403)');

    const revRes = await request(
      'POST',
      '/api/admin/finance/reverse',
      { transactionId: adjTxId, ledgerType: 'coins', reason: `Chargeback test reversal ${RUN_ID}` },
      { Cookie: financeAuth.cookieHeader }
    );
    assert(revRes.statusCode === 200 && revRes.json?.success === true, 'Finance admin reversed adjustment transaction cleanly');
    assert(revRes.json?.wallet?.coins === 500, `Balance restored to 500 after reversal (got ${revRes.json?.wallet?.coins})`);
    assert(revRes.json?.reversalTransaction?.relatedTxId === adjTxId, 'Linked reversal references original transactionId');
    assert(revRes.json?.reversalTransaction?.transactionType === 'reversal', 'Linked reversal typed "reversal"');

    const postRevHist = await request('GET', `/api/wallet/coins/history?userId=${senderId}&status=reversed&preview=demo`);
    assert(
      postRevHist.statusCode === 200 && postRevHist.json?.transactions?.some((t) => t.transactionId === adjTxId && t.status === 'reversed'),
      'Original transaction preserved in ledger with status="reversed"'
    );

    // ------------------------------------------------------------------------
    // TEST 13: Simultaneous concurrent gift transfers produce exact balance (zero race conditions / lost updates)
    // ------------------------------------------------------------------------
    console.log('\n[Test 13] Concurrency lock test: 8 simultaneous parallel gift transfers preserve exact math');
    const concSender = `test_conc_sender_${RUN_ID}`;
    const concHost = `test_conc_host_${RUN_ID}`;
    const concRef = `CONC_TOPUP_${RUN_ID}`;
    await request(
      'POST',
      '/api/wallet/topup/credit',
      { userId: concSender, amount: 1000, referenceId: concRef, idempotencyKey: concRef },
      { 'x-topup-signature': signTopup(concSender, 1000, concRef) }
    );

    const parallelGiftCalls = Array.from({ length: 8 }, (_, idx) =>
      request('POST', '/api/wallet/gift-transfer', {
        senderId: concSender,
        senderName: 'Concurrent Sender',
        hostUserId: concHost,
        giftCoins: 100,
        giftName: 'Rose Pack',
        isPkBattle: true,
        referenceId: `CONC_GIFT_${RUN_ID}_${idx}`,
        idempotencyKey: `IDEMP_CONC_${RUN_ID}_${idx}`,
      })
    );
    const concResults = await Promise.all(parallelGiftCalls);
    const concSuccessCount = concResults.filter((r) => r.statusCode === 200 && r.json?.success === true).length;
    assert(concSuccessCount === 8, `All 8 simultaneous gift transfers completed cleanly (${concSuccessCount}/8)`);

    const finalConcSender = await request('GET', `/api/wallet/balance?userId=${concSender}&preview=demo&fresh=true`);
    const finalConcHost = await request('GET', `/api/wallet/balance?userId=${concHost}&preview=demo&fresh=true`);
    assert(finalConcSender.json?.wallet?.coins === 200, `Concurrent sender final coins = 1000 - 800 = 200 (got ${finalConcSender.json?.wallet?.coins})`);
    assert(finalConcHost.json?.wallet?.points === 560, `Concurrent host final points = 8 * 70 = 560 (got ${finalConcHost.json?.wallet?.points})`);

    // ------------------------------------------------------------------------
    // TEST 14: SSE /api/wallet/events delivers connected recovery + wallet:coin_balance_updated
    // ------------------------------------------------------------------------
    console.log('\n[Test 14] Real-time SSE /api/wallet/events delivers connected restore & wallet:coin_balance_updated');
    const sseResult = await openSseAndCapture(concSender, async () => {
      const topRef2 = `SSE_TOPUP_${RUN_ID}`;
      await request(
        'POST',
        '/api/wallet/topup/credit',
        { userId: concSender, amount: 50, referenceId: topRef2, idempotencyKey: topRef2 },
        { 'x-topup-signature': signTopup(concSender, 50, topRef2) }
      );
    });
    assert(sseResult.statusCode === 200 && sseResult.connectedRestored?.restoredWallet?.coins === 200, 'SSE connected event restored latest wallet balance (200)');
    assert(
      sseResult.coinUpdatedEvent && sseResult.coinUpdatedEvent.coins === 250 && sseResult.coinUpdatedEvent.delta === 50,
      `SSE streamed live wallet:coin_balance_updated (200 -> 250, delta +50)`
    );

    // ------------------------------------------------------------------------
    // TEST 15: Frontend pages load cleanly (HTTP 200) with P7.1 watermark
    // ------------------------------------------------------------------------
    console.log('\n[Test 15] Frontend pages (/wallet, /wallet/coin-history, /wallet/points-history, /admin/finance)');
    const walletPage = await request('GET', '/wallet?preview=demo');
    const coinHistPageHtml = await request('GET', '/wallet/coin-history?preview=demo');
    const ptsHistPageHtml = await request('GET', '/wallet/points-history?preview=demo');
    const adminFinPage = await request('GET', '/admin/finance');

    assert(walletPage.statusCode === 200 && walletPage.data.includes('P7.1'), '/wallet?preview=demo returns HTTP 200 with P7.1 watermark');
    assert(coinHistPageHtml.statusCode === 200 && coinHistPageHtml.data.includes('P7.1'), '/wallet/coin-history?preview=demo returns HTTP 200 with P7.1 watermark');
    assert(ptsHistPageHtml.statusCode === 200 && ptsHistPageHtml.data.includes('P7.1'), '/wallet/points-history?preview=demo returns HTTP 200 with P7.1 watermark');
    assert(adminFinPage.statusCode === 200, '/admin/finance returns HTTP 200 cleanly');

    // Refresh endpoint check
    const refreshRes = await request('POST', '/api/wallet/refresh?preview=demo', { userId: DEMO_USER_ID });
    assert(refreshRes.statusCode === 200 && refreshRes.json?.wallet?.coins === 12500, 'POST /api/wallet/refresh returns fresh demo balance (12,500)');
  } catch (err) {
    console.error('\nFatal test execution error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`  MODULE 7.1 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
