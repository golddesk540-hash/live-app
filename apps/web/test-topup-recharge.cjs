const http = require('http');
const https = require('https');
const crypto = require('crypto');

const BASE_URL = process.env.TEST_BASE_URL || process.argv[2] || 'http://127.0.0.1:3006';
const RUN_ID = Date.now();
const TOPUP_WEBHOOK_SECRET =
  process.env.TOPUP_WEBHOOK_SECRET ||
  process.env.WALLET_TOPUP_SECRET ||
  'popo_live_phase7_topup_secret_key_prod';

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  \x1b[32m✓ PASS:\x1b[0m ${msg}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✗ FAIL:\x1b[0m ${msg}`);
    failed++;
  }
}

function signWebhook(providerKey, eventId, orderId, eventType, amount, currency) {
  const canonical = `${providerKey}:${eventId}:${orderId}:${eventType}:${Number(amount).toFixed(2)}:${String(
    currency || 'USD'
  ).toUpperCase()}`;
  return crypto.createHmac('sha256', TOPUP_WEBHOOK_SECRET).update(canonical).digest('hex');
}

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const mod = url.protocol === 'https:' ? https : http;
    const payload = body !== null ? JSON.stringify(body) : null;
    const reqHeaders = { ...headers };
    if (payload !== null) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = mod.request(
      url,
      { method, headers: reqHeaders },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch (_) {}
          resolve({ statusCode: res.statusCode, headers: res.headers, text: data, json });
        });
      }
    );
    req.on('error', reject);
    if (payload !== null) req.write(payload);
    req.end();
  });
}

function readSseEvents(path, headers = {}, timeoutMs = 4500, triggerFn = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const mod = url.protocol === 'https:' ? https : http;
    const events = [];
    let buffer = '';
    let triggered = false;

    const req = mod.get(url, { headers }, (res) => {
      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';
        for (const block of blocks) {
          const lines = block.split('\n');
          let eventName = 'message';
          let dataStr = '';
          for (const line of lines) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            if (line.startsWith('data:')) dataStr += line.slice(5).trim();
          }
          if (dataStr) {
            try {
              events.push({ event: eventName, data: JSON.parse(dataStr) });
            } catch {
              events.push({ event: eventName, data: dataStr });
            }
          }
        }
        if (!triggered && events.some((e) => e.event === 'wallet:topup_state_sync')) {
          triggered = true;
          if (triggerFn) Promise.resolve(triggerFn()).catch(() => {});
        }
      });
    });

    req.on('error', () => resolve(events));
    setTimeout(() => {
      try {
        req.destroy();
      } catch (_) {}
      resolve(events);
    }, timeoutMs);
  });
}

async function loginAs(email, password) {
  const cookies = {};
  const extract = (setCookieArr) => {
    if (!Array.isArray(setCookieArr)) return;
    for (const sc of setCookieArr) {
      const first = sc.split(';')[0];
      const idx = first.indexOf('=');
      if (idx > 0) cookies[first.slice(0, idx).trim()] = first.slice(idx + 1).trim();
    }
  };
  const cookieStr = () => Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');

  const consentRes = await request('POST', '/api/consent', {
    action: 'accept',
    termsAccepted: true,
    privacyAccepted: true,
    isAdultConfirmed: true,
  });
  extract(consentRes.headers['set-cookie']);

  const loginRes = await request(
    'POST',
    '/api/auth/login',
    { email, password },
    { Cookie: cookieStr() }
  );
  extract(loginRes.headers['set-cookie']);
  return { statusCode: loginRes.statusCode, user: loginRes.json?.user || null, cookie: cookieStr() };
}

async function runTests() {
  console.log(`\n=== MODULE 7.6 COINS TOP-UP & RECHARGE VERIFICATION (${BASE_URL}) ===\n`);

  // Suite 0: Auth
  console.log('[Suite 0] Authenticate Finance Admin, Ordinary Admin, and Regular Viewer');
  const [financeAuth, ordinaryAuth, viewerAuth] = await Promise.all([
    loginAs('finance@popolive.com', 'FinancePass123!'),
    loginAs('ordinaryadmin@popolive.com', 'AdminPass123!'),
    loginAs('viewer701@popolive.com', 'ViewerPass123!'),
  ]);
  assert(financeAuth.statusCode === 200 && Boolean(financeAuth.cookie), 'Finance admin signed in');
  assert(ordinaryAuth.statusCode === 200 && Boolean(ordinaryAuth.cookie), 'Ordinary admin signed in');
  assert(viewerAuth.statusCode === 200 && Boolean(viewerAuth.cookie), 'Standard viewer signed in');

  const viewerId = viewerAuth.user?.id;
  assert(Boolean(viewerId), `Resolved authenticated viewer ID (${viewerId})`);

  // Snapshot viewer starting wallet
  const viewerStartRes = await request('GET', '/api/wallet/balance?fresh=true', null, {
    Cookie: viewerAuth.cookie,
  });
  const startCoins = viewerStartRes.json?.wallet?.coins ?? 0;
  const startPoints = viewerStartRes.json?.wallet?.points ?? 0;

  // Suite 1: UI Routes
  console.log('\n[Suite 1] UI Routes (/recharge & /topup)');
  const [rechargeUi, topupUi] = await Promise.all([
    request('GET', '/recharge?preview=demo'),
    request('GET', '/topup?preview=demo'),
  ]);
  assert(
    rechargeUi.statusCode === 200 &&
      rechargeUi.text.includes('Top-up Coins') &&
      rechargeUi.text.includes('P7.6'),
    'GET /recharge?preview=demo returns 200 OK with Top-up Coins UI & P7.6 badge'
  );
  assert(
    topupUi.statusCode === 200 && topupUi.text.includes('Top-up Coins'),
    'GET /topup?preview=demo returns 200 OK cleanly'
  );

  // Suite 2: Packages & Honest Payment Providers
  console.log('\n[Suite 2] Backend Coin Packages & Honest Multi-Provider Readiness');
  const [pkgRes, provRes] = await Promise.all([
    request('GET', '/api/topup/packages'),
    request('GET', '/api/topup/methods?platform=web'),
  ]);
  const pkgs = pkgRes.json?.packages || [];
  const provs = provRes.json?.providers || [];
  const popularPkg = pkgs.find((p) => p.packageId === 'pkg_1000');
  const sandboxProv = provs.find((p) => p.providerKey === 'sandbox_verified');
  const stripeProv = provs.find((p) => p.providerKey === 'stripe_card');

  assert(
    pkgRes.statusCode === 200 &&
      pkgs.length >= 5 &&
      popularPkg &&
      popularPkg.baseCoins === 1000 &&
      popularPkg.bonusCoins === 100 &&
      popularPkg.totalCoins === 1100 &&
      popularPkg.priceAmount === 9.99 &&
      popularPkg.isPopular === true,
    'Backend coin packages loaded with approved values (1,000 + 100 bonus = 1,100 Coins @ $9.99)'
  );
  assert(
    provRes.statusCode === 200 &&
      sandboxProv?.isReadyForPayment === true &&
      sandboxProv?.isSandbox === true &&
      stripeProv?.configurationStatus === 'credentials_pending' &&
      stripeProv?.isReadyForPayment === false,
    'Payment providers expose honest readiness (sandbox ready; unconfigured real providers flagged credentials_pending)'
  );

  // Suite 3: Block Unconfigured Provider & Client Price/Bonus Override Tampering
  console.log('\n[Suite 3] Credential-Pending Provider Block & Client Override Tamper Protection');
  const unconfiguredOrderRes = await request(
    'POST',
    '/api/topup/orders',
    { packageId: 'pkg_1000', providerKey: 'stripe_card', platform: 'web' },
    { Cookie: viewerAuth.cookie }
  );
  assert(
    unconfiguredOrderRes.statusCode === 503 &&
      unconfiguredOrderRes.json?.errorCode === 'PROVIDER_CREDENTIALS_PENDING',
    'Selecting unconfigured live gateway strictly returns 503 PROVIDER_CREDENTIALS_PENDING'
  );

  const tamperedPriceRes = await request(
    'POST',
    '/api/topup/orders',
    { packageId: 'pkg_1000', providerKey: 'sandbox_verified', amount: 0.01, bonusCoins: 999999 },
    { Cookie: viewerAuth.cookie }
  );
  assert(
    tamperedPriceRes.statusCode === 403 &&
      tamperedPriceRes.json?.errorCode === 'CLIENT_FINANCIAL_OVERRIDE_FORBIDDEN',
    'Client tampering with amount/bonusCoins/status strictly rejected (403 CLIENT_FINANCIAL_OVERRIDE_FORBIDDEN)'
  );

  const anonOrderRes = await request('POST', '/api/topup/orders', {
    packageId: 'pkg_1000',
    providerKey: 'sandbox_verified',
  });
  assert(
    anonOrderRes.statusCode === 401 || anonOrderRes.statusCode === 403,
    `Anonymous top-up creation without preview/session rejected (${anonOrderRes.statusCode})`
  );

  // Suite 4: Pending Order = 0 Coins + Forged Verify / Invalid Signature Rejected
  console.log('\n[Suite 4] Pending Order Crediting Guard & Forged Signature Blocking');
  const createRes = await request(
    'POST',
    '/api/topup/orders',
    {
      packageId: 'pkg_1000',
      providerKey: 'sandbox_verified',
      platform: 'web',
      idempotencyKey: `M76_ORD_1000_${RUN_ID}`,
    },
    { Cookie: viewerAuth.cookie }
  );
  const order1000 = createRes.json?.order;
  assert(
    createRes.statusCode === 201 &&
      Boolean(order1000?.orderId) &&
      order1000.status === 'pending' &&
      order1000.amount === 9.99 &&
      order1000.totalCoins === 1100,
    `Created pending payment order ${order1000?.orderId} ($9.99 -> 1,100 coins pending)`
  );

  const afterPendingBal = await request('GET', '/api/wallet/balance?fresh=true', null, {
    Cookie: viewerAuth.cookie,
  });
  assert(
    afterPendingBal.json?.wallet?.coins === startCoins,
    `Pending order grants ZERO coins before verified webhook (${startCoins})`
  );

  const fakeClientVerify = await request(
    'POST',
    `/api/topup/orders/${order1000.orderId}/verify`,
    { status: 'successful' },
    { Cookie: viewerAuth.cookie }
  );
  assert(
    fakeClientVerify.statusCode === 403 &&
      fakeClientVerify.json?.errorCode === 'PROVIDER_VERIFICATION_REQUIRED',
    'Unsigned client verify call rejected (403 PROVIDER_VERIFICATION_REQUIRED)'
  );

  const forgedSigRes = await request(
    'POST',
    '/api/topup/webhooks/sandbox_verified',
    {
      eventId: `FORGED_${RUN_ID}`,
      orderId: order1000.orderId,
      eventType: 'payment.succeeded',
      amount: 9.99,
      currency: 'USD',
    },
    { 'x-topup-webhook-signature': '0000forgedsignature1111' }
  );
  assert(
    forgedSigRes.statusCode === 403 && forgedSigRes.json?.errorCode === 'INVALID_WEBHOOK_SIGNATURE',
    'Webhook with invalid HMAC signature strictly rejected (403 INVALID_WEBHOOK_SIGNATURE)'
  );

  // Suite 5: Amount/Currency Mismatch Guard
  console.log('\n[Suite 5] Amount & Currency Mismatch Rejection');
  const mismatchSig = signWebhook(
    'sandbox_verified',
    `MISMATCH_${RUN_ID}`,
    order1000.orderId,
    'payment.succeeded',
    0.99,
    'USD'
  );
  const mismatchRes = await request(
    'POST',
    '/api/topup/webhooks/sandbox_verified',
    {
      eventId: `MISMATCH_${RUN_ID}`,
      orderId: order1000.orderId,
      eventType: 'payment.succeeded',
      amount: 0.99,
      currency: 'USD',
    },
    { 'x-topup-webhook-signature': mismatchSig }
  );
  assert(
    mismatchRes.statusCode === 400 && mismatchRes.json?.errorCode === 'AMOUNT_OR_CURRENCY_MISMATCH',
    'Amount mismatch ($0.99 vs $9.99) rejected even with valid HMAC (400 AMOUNT_OR_CURRENCY_MISMATCH)'
  );

  // Suite 6: Failed Payment Order Credits Zero Coins
  console.log('\n[Suite 6] Failed Payment Webhook Credits ZERO Coins & Creates ZERO Receipt');
  const failOrderRes = await request(
    'POST',
    '/api/topup/orders',
    {
      packageId: 'pkg_100',
      providerKey: 'sandbox_verified',
      platform: 'android',
      idempotencyKey: `M76_FAIL_${RUN_ID}`,
    },
    { Cookie: viewerAuth.cookie }
  );
  const failOrderId = failOrderRes.json?.order?.orderId;
  const failComplete = await request(
    'POST',
    '/api/topup/sandbox/complete',
    { orderId: failOrderId, outcome: 'failed', failureReason: 'QA simulated decline' },
    { Cookie: viewerAuth.cookie }
  );
  const balAfterFail = await request('GET', '/api/wallet/balance?fresh=true', null, {
    Cookie: viewerAuth.cookie,
  });
  assert(
    failComplete.statusCode === 200 &&
      failComplete.json?.order?.status === 'failed' &&
      !failComplete.json?.receipt &&
      balAfterFail.json?.wallet?.coins === startCoins,
    'Failed payment marks order failed cleanly with 0 coins and 0 receipt'
  );

  // Suite 7: Cryptographically Signed Webhook Fulfillment & Strict Zero Host Points
  console.log('\n[Suite 7] Verified Payment Settlement, Bonus Coins, Receipt & Zero Host Points');
  const validEvtId = `EVT_OK_${RUN_ID}`;
  const validPayRef = `PAY_OK_${RUN_ID}`;
  const validSig = signWebhook(
    'sandbox_verified',
    validEvtId,
    order1000.orderId,
    'payment.succeeded',
    9.99,
    'USD'
  );
  const webhookOkRes = await request(
    'POST',
    '/api/topup/webhooks/sandbox_verified',
    {
      eventId: validEvtId,
      orderId: order1000.orderId,
      eventType: 'payment.succeeded',
      amount: 9.99,
      currency: 'USD',
      providerPaymentRef: validPayRef,
    },
    { 'x-topup-webhook-signature': validSig }
  );
  const settledOrder = webhookOkRes.json?.order;
  const issuedReceipt = webhookOkRes.json?.receipt;

  const balAfterSuccess = await request('GET', '/api/wallet/balance?fresh=true', null, {
    Cookie: viewerAuth.cookie,
  });
  assert(
    webhookOkRes.statusCode === 200 &&
      settledOrder?.status === 'successful' &&
      Boolean(issuedReceipt?.receiptId) &&
      balAfterSuccess.json?.wallet?.coins === startCoins + 1100,
    `Verified webhook credited exact +1,100 coins (1,000 base + 100 bonus) -> ${balAfterSuccess.json?.wallet?.coins}`
  );
  assert(
    balAfterSuccess.json?.wallet?.points === startPoints,
    `Top-up added ZERO host points (${balAfterSuccess.json?.wallet?.points} === ${startPoints})`
  );

  // Receipt JSON & TXT export
  const [rcptJsonRes, rcptTxtRes] = await Promise.all([
    request('GET', `/api/topup/receipts/${issuedReceipt.receiptId}`, null, { Cookie: viewerAuth.cookie }),
    request('GET', `/api/topup/receipts/${issuedReceipt.receiptId}?format=txt`, null, { Cookie: viewerAuth.cookie }),
  ]);
  assert(
    rcptJsonRes.statusCode === 200 &&
      rcptJsonRes.json?.receipt?.totalCoins === 1100 &&
      rcptTxtRes.statusCode === 200 &&
      rcptTxtRes.text.includes(issuedReceipt.receiptId),
    `Receipt ${issuedReceipt.receiptId} verified in JSON & downloadable TXT formats`
  );

  // Suite 8: Replay Duplicate Protection
  console.log('\n[Suite 8] Duplicate Webhook Event & Order Replay Protection');
  const replaySameEvt = await request(
    'POST',
    '/api/topup/webhooks/sandbox_verified',
    {
      eventId: validEvtId,
      orderId: order1000.orderId,
      eventType: 'payment.succeeded',
      amount: 9.99,
      currency: 'USD',
      providerPaymentRef: validPayRef,
    },
    { 'x-topup-webhook-signature': validSig }
  );
  const newEvtId = `EVT_DUP2_${RUN_ID}`;
  const replayNewEvtSig = signWebhook(
    'sandbox_verified',
    newEvtId,
    order1000.orderId,
    'payment.succeeded',
    9.99,
    'USD'
  );
  const replayNewEvt = await request(
    'POST',
    '/api/topup/webhooks/sandbox_verified',
    {
      eventId: newEvtId,
      orderId: order1000.orderId,
      eventType: 'payment.succeeded',
      amount: 9.99,
      currency: 'USD',
    },
    { 'x-topup-webhook-signature': replayNewEvtSig }
  );
  const balAfterReplay = await request('GET', '/api/wallet/balance?fresh=true', null, {
    Cookie: viewerAuth.cookie,
  });
  assert(
    replaySameEvt.json?.deduplicated === true &&
      replayNewEvt.json?.deduplicated === true &&
      balAfterReplay.json?.wallet?.coins === startCoins + 1100,
    'Duplicate webhook replays strictly ignored without double-crediting coins'
  );

  // Suite 9: Privacy & RBAC Enforcement
  console.log('\n[Suite 9] Privacy Isolation & Finance Admin RBAC');
  const [otherHistRes, otherSseRes, ordPkgAdm, ordOrdersAdm] = await Promise.all([
    request('GET', '/api/topup/history?userId=user_wallet_demo_701', null, { Cookie: viewerAuth.cookie }),
    request('GET', '/api/topup/events?userId=user_wallet_demo_701', null, { Cookie: viewerAuth.cookie }),
    request('POST', '/api/admin/finance/topup/packages', {
      packageId: 'pkg_tamper',
      packageName: 'Tamper',
      baseCoins: 100,
      priceAmount: 1,
    }, { Cookie: ordinaryAuth.cookie }),
    request('GET', '/api/admin/finance/topup/orders', null, { Cookie: ordinaryAuth.cookie }),
  ]);
  assert(otherHistRes.statusCode === 403, 'Viewer blocked from viewing another user top-up history (403)');
  assert(otherSseRes.statusCode === 403, 'Viewer blocked from subscribing to another user top-up SSE (403)');
  assert(ordPkgAdm.statusCode === 403 && ordOrdersAdm.statusCode === 403, 'Ordinary admin blocked from finance top-up controls (403)');

  // Suite 10: Real-time SSE Delivery (using sandbox checkout on pkg_100)
  console.log('\n[Suite 10] Real-Time Top-up SSE Events (created -> pending -> successful -> coins_credited -> receipt)');
  let sseOrderId = null;
  const sseEvents = await readSseEvents('/api/topup/events', { Cookie: viewerAuth.cookie }, 4500, async () => {
    const oRes = await request(
      'POST',
      '/api/topup/orders',
      {
        packageId: 'pkg_100',
        providerKey: 'sandbox_verified',
        platform: 'ios',
        idempotencyKey: `M76_SSE_${RUN_ID}`,
      },
      { Cookie: viewerAuth.cookie }
    );
    sseOrderId = oRes.json?.order?.orderId;
    if (sseOrderId) {
      await request(
        'POST',
        '/api/topup/sandbox/complete',
        { orderId: sseOrderId, outcome: 'succeeded' },
        { Cookie: viewerAuth.cookie }
      );
    }
  });
  const names = new Set(sseEvents.map((e) => e.event));
  assert(names.has('wallet:topup_state_sync'), 'SSE delivers wallet:topup_state_sync on connect');
  assert(names.has('wallet:topup_created') && names.has('wallet:payment_pending'), 'SSE delivers wallet:topup_created & wallet:payment_pending');
  assert(names.has('wallet:payment_successful') && names.has('wallet:coins_credited'), 'SSE delivers wallet:payment_successful & wallet:coins_credited');
  assert(names.has('wallet:balance_updated') && names.has('wallet:receipt_created'), 'SSE delivers wallet:balance_updated & wallet:receipt_created');

  // Suite 11: Finance Admin Package Config + Top-up Refund & Canonical Balance Restoration
  console.log('\n[Suite 11] Finance Admin Package Config & Refund Reversal Cleanup');
  const customPkgId = `pkg_qa_${RUN_ID}`;
  const createPkgRes = await request(
    'POST',
    '/api/admin/finance/topup/packages',
    {
      packageId: customPkgId,
      packageName: 'QA Custom Pack',
      baseCoins: 250,
      bonusCoins: 50,
      priceAmount: 2.99,
      currency: 'USD',
      isActive: true,
      displayOrder: 99,
    },
    { Cookie: financeAuth.cookie }
  );
  const disablePkgRes = await request(
    'PATCH',
    '/api/admin/finance/topup/packages',
    { packageId: customPkgId, isActive: false },
    { Cookie: financeAuth.cookie }
  );
  assert(
    createPkgRes.statusCode === 200 &&
      createPkgRes.json?.package?.totalCoins === 300 &&
      disablePkgRes.statusCode === 200 &&
      disablePkgRes.json?.package?.isActive === false,
    'Finance admin creates & disables backend coin package cleanly'
  );

  // Refund both verified test orders so viewer balance returns strictly to startCoins!
  const [refund1, refund2] = await Promise.all([
    request(
      'POST',
      '/api/admin/finance/topup/refund',
      { orderId: order1000.orderId, reason: `Module 7.6 QA cleanup (${RUN_ID})` },
      { Cookie: financeAuth.cookie }
    ),
    sseOrderId
      ? request(
          'POST',
          '/api/admin/finance/topup/refund',
          { orderId: sseOrderId, reason: `Module 7.6 SSE QA cleanup (${RUN_ID})` },
          { Cookie: financeAuth.cookie }
        )
      : Promise.resolve({ statusCode: 200, json: { success: true } }),
  ]);

  const balAfterRefund = await request('GET', '/api/wallet/balance?fresh=true', null, {
    Cookie: viewerAuth.cookie,
  });
  const demoCheck = await request('GET', '/api/wallet/balance?userId=user_wallet_demo_701&preview=demo&fresh=true');

  assert(
    refund1.statusCode === 200 &&
      refund1.json?.order?.status === 'refunded' &&
      refund2.statusCode === 200 &&
      balAfterRefund.json?.wallet?.coins === startCoins,
    `Finance admin refunds verified orders & restores exact pre-test viewer balance (${balAfterRefund.json?.wallet?.coins})`
  );
  assert(
    demoCheck.json?.wallet?.coins === 12500 && demoCheck.json?.wallet?.points === 8420,
    'Canonical demo wallet untouched (12,500 coins, 8,420 points)'
  );

  console.log('\n========================================');
  console.log(`Module 7.6 Results: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Module 7.6 test suite error:', err);
  process.exit(1);
});
