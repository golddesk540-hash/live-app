/**
 * Module 7.7: Complete VIP Membership System — Automated E2E Verification Suite
 * Validates configurable VIP plans, non-financial benefits, provider readiness,
 * webhook signature/amount verification, zero-benefit guards, optional coin purchase,
 * renewals, cancellations, refunds, server-time expiry, SSE events, RBAC, privacy,
 * and integrations with Modules 7.1, 7.3, 7.4, 7.5, User Profiles & Party Chat.
 */
const http = require('http');
const https = require('https');
const crypto = require('crypto');

const BASE_URL = process.env.TEST_BASE_URL || process.argv[2] || 'http://127.0.0.1:3006';
const RUN_ID = Date.now();
const WEBHOOK_SECRET =
  process.env.TOPUP_WEBHOOK_SECRET ||
  process.env.WALLET_TOPUP_SECRET ||
  'popo_live_phase7_topup_secret_key_prod';

const SARA_HOST_ID = '00000000-0000-0000-0000-000000088201';
const ZARA_HOST_ID = '45495810-f5fb-46ec-8c81-f29932411c07';
const AYESHA_HOST_ID = '00000000-0000-0000-0000-000000088202';
const LIVE_ROOM_ID = '880219';
const PARTY_ROOM_ID = '7001';

// Valid minimal 1x1 transparent PNG bytes for asset upload test
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

let passed = 0;
let failed = 0;

function assert(cond, label, detail = '') {
  if (cond) {
    console.log(`  \x1b[32m✓ PASS:\x1b[0m ${label}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✗ FAIL:\x1b[0m ${label}${detail ? ` (${detail})` : ''}`);
    failed++;
  }
}

function signVipWebhook(providerKey, eventId, orderId, eventType, amount, currency) {
  const canonical = `${providerKey}:${eventId}:${orderId}:${eventType}:${Number(amount).toFixed(
    2
  )}:${String(currency || 'USD').toUpperCase()}`;
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(canonical).digest('hex');
}

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const mod = url.protocol === 'https:' ? https : http;
    const payload = body !== null ? JSON.stringify(body) : null;
    const reqHeaders = { Accept: 'application/json, text/html, text/plain', ...headers };
    if (payload !== null) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = mod.request(
      url,
      { method, headers: reqHeaders },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let json = null;
          try {
            json = JSON.parse(text);
          } catch {}
          resolve({ statusCode: res.statusCode, headers: res.headers, text, json });
        });
      }
    );
    req.on('error', reject);
    if (payload !== null) req.write(payload);
    req.end();
  });
}

function collectSseEvents(
  path,
  headers = {},
  timeoutMs = 4500,
  triggerFn = null,
  readyEvent = 'vip:state_sync'
) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const mod = url.protocol === 'https:' ? https : http;
    const events = [];
    let buffer = '';
    let triggered = false;

    const req = mod.get(url, { headers: { Accept: 'text/event-stream', ...headers } }, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        buffer += chunk;
        const frames = buffer.split('\n\n');
        buffer = frames.pop() || '';
        for (const frame of frames) {
          const lines = frame.split('\n');
          let eventName = 'message';
          let dataStr = '';
          for (const line of lines) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            if (line.startsWith('data:')) dataStr += line.slice(5).trim();
          }
          if (dataStr) {
            let parsed = dataStr;
            try {
              parsed = JSON.parse(dataStr);
            } catch {}
            events.push({ event: eventName, data: parsed });
          }
        }
        if (!triggered && events.some((e) => e.event === readyEvent)) {
          triggered = true;
          if (triggerFn) Promise.resolve(triggerFn()).catch(() => {});
        }
      });
    });

    req.on('error', () => resolve(events));
    setTimeout(() => {
      try {
        req.destroy();
      } catch {}
      resolve(events);
    }, timeoutMs);
  });
}

async function loginAs(email, password) {
  const cookies = {};
  const extract = (arr) => {
    if (!Array.isArray(arr)) return;
    for (const sc of arr) {
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
  return {
    statusCode: loginRes.statusCode,
    user: loginRes.json?.user || null,
    cookie: cookieStr(),
  };
}

async function runTests() {
  console.log(`\n=== MODULE 7.7 COMPLETE VIP MEMBERSHIP SYSTEM VERIFICATION (${BASE_URL}) ===\n`);

  let viewerId = '';
  let financeCookie = '';
  let viewerCookie = '';
  let startCoins = 0;
  let startPoints = 0;
  let addedFloatCoins = 0;
  let tempCoinPlanId = '';
  const createdOrderIdsForRefundOrCleanup = [];
  const reversedGiftTxIds = [];

  try {
    // ------------------------------------------------------------------
    // Suite 0: Authentication + Baseline Wallet/VIP + UI Routes
    // ------------------------------------------------------------------
    console.log('[Suite 0] Authenticate Accounts, Inspect Baseline & Verify UI Routes');
    const [financeAuth, ordinaryAuth, viewerAuth] = await Promise.all([
      loginAs('finance@popolive.com', 'FinancePass123!'),
      loginAs('ordinaryadmin@popolive.com', 'AdminPass123!'),
      loginAs('viewer701@popolive.com', 'ViewerPass123!'),
    ]);
    assert(financeAuth.statusCode === 200 && Boolean(financeAuth.cookie), 'Finance admin signed in');
    assert(ordinaryAuth.statusCode === 200 && Boolean(ordinaryAuth.cookie), 'Ordinary admin signed in');
    assert(viewerAuth.statusCode === 200 && Boolean(viewerAuth.cookie), 'Regular viewer signed in');

    financeCookie = financeAuth.cookie;
    viewerCookie = viewerAuth.cookie;
    viewerId = viewerAuth.user?.id || '';
    assert(Boolean(viewerId), `Resolved authenticated viewer UUID (${viewerId})`);

    const [balRes, viewerStartVip, saraProfileRes, ayeshaProfileRes, vipPage, historyPage, assetRes] =
      await Promise.all([
        request('GET', '/api/wallet/balance?fresh=true', null, { Cookie: viewerCookie }),
        request('GET', '/api/vip/status', null, { Cookie: viewerCookie }),
        request('GET', `/api/users/${SARA_HOST_ID}/public-profile`),
        request('GET', `/api/users/${AYESHA_HOST_ID}/public-profile`),
        request('GET', '/vip?preview=demo'),
        request('GET', '/vip/history?preview=demo'),
        request('GET', '/assets/gifts/07_07_vip.png'),
      ]);

    startCoins = Number(balRes.json?.wallet?.coins ?? 0);
    startPoints = Number(balRes.json?.wallet?.points ?? 0);

    // Ensure clean starting VIP state for viewer701 before running assertions
    if (viewerStartVip.json?.vip?.hasActiveVip) {
      await request('POST', '/api/vip/cancel', { cancelMode: 'immediate' }, { Cookie: viewerCookie });
    }

    assert(
      saraProfileRes.statusCode === 200 &&
        saraProfileRes.json?.profile?.vip?.hasActiveVip === true &&
        Number(saraProfileRes.json?.profile?.vip?.vipLevel) >= 3,
      `Seeded VIP Host Sara has active VIP III+ on public profile (level=${saraProfileRes.json?.profile?.vip?.vipLevel})`
    );
    assert(
      ayeshaProfileRes.statusCode === 200 && ayeshaProfileRes.json?.profile?.vip?.hasActiveVip === false,
      'Non-VIP Host Ayesha has hasActiveVip=false on public profile'
    );
    assert(
      vipPage.statusCode === 200 && vipPage.text.includes('VIP Membership') && vipPage.text.includes('P7.7'),
      'GET /vip?preview=demo returns 200 OK with VIP Membership UI & P7.7 badge'
    );
    assert(
      historyPage.statusCode === 200 && historyPage.text.includes('VIP'),
      'GET /vip/history?preview=demo returns 200 OK'
    );
    assert(assetRes.statusCode === 200, 'Local VIP design reference asset /assets/gifts/07_07_vip.png served cleanly');

    // ------------------------------------------------------------------
    // Suite 1: Configurable VIP Plans, 10 Benefits & Payment Providers
    // ------------------------------------------------------------------
    console.log('\n[Suite 1] Backend VIP Plans, 10 Non-Financial Benefits & Payment Providers');
    const plansRes = await request('GET', '/api/vip/plans?platform=web');
    const plans = plansRes.json?.plans || [];
    const benefitCatalog = plansRes.json?.benefitCatalog || [];
    const providers = plansRes.json?.providers || [];

    const goldPlan = plans.find((p) => p.planId === 'vip_gold');
    const diamondPlan = plans.find((p) => p.planId === 'vip_diamond');
    const sandboxProv = providers.find((p) => p.providerKey === 'sandbox_verified');
    const stripeProv = providers.find((p) => p.providerKey === 'stripe_card');

    assert(
      plansRes.statusCode === 200 &&
        plans.length >= 5 &&
        Boolean(goldPlan) &&
        goldPlan.vipLevel === 3 &&
        goldPlan.priceAmount === 19.99 &&
        goldPlan.durationDays === 30 &&
        Boolean(goldPlan.planNameUr),
      'Backend returned >=5 bilingual VIP plans including VIP Gold ($19.99 / 30d / VIP III)'
    );
    assert(
      benefitCatalog.length >= 10 &&
        benefitCatalog.every((b) => b.isFinancialReward === false) &&
        benefitCatalog.some((b) => b.benefitKey === 'special_entrance_animation') &&
        benefitCatalog.some((b) => b.benefitKey === 'vip_profile_badge'),
      `All ${benefitCatalog.length} VIP benefits strictly marked isFinancialReward=false (non-financial only)`
    );
    assert(
      Boolean(sandboxProv?.isReadyForPayment) &&
        stripeProv?.configurationStatus === 'credentials_pending' &&
        stripeProv?.isReadyForPayment === false,
      'Payment provider readiness honest (sandbox ready; live card credentials_pending)'
    );

    // ------------------------------------------------------------------
    // Suite 2: Security & Client Override / Manual Assignment Blocking
    // ------------------------------------------------------------------
    console.log('\n[Suite 2] Client Tamper Protection, Unconfigured Provider & Manual VIP Blocking');
    const [pendingProvRes, tamperRes, directStatusPost, manualProfilePatch, anonPurchaseRes] =
      await Promise.all([
        request(
          'POST',
          '/api/vip/purchase',
          { planId: 'vip_gold', providerKey: 'stripe_card', platform: 'web' },
          { Cookie: viewerCookie }
        ),
        request(
          'POST',
          '/api/vip/purchase',
          {
            planId: 'vip_gold',
            providerKey: 'sandbox_verified',
            priceAmount: 0.01,
            vipLevel: 5,
            grantedBenefits: ['free_coins'],
          },
          { Cookie: viewerCookie }
        ),
        request('POST', '/api/vip/status', { hasActiveVip: true, vipLevel: 5 }, { Cookie: viewerCookie }),
        request('PATCH', '/api/profile/me', { vipLevel: 5, hasActiveVip: true }, { Cookie: viewerCookie }),
        request('POST', '/api/vip/purchase', { planId: 'vip_gold', providerKey: 'sandbox_verified' }),
      ]);

    assert(
      pendingProvRes.statusCode === 503 && pendingProvRes.json?.errorCode === 'PROVIDER_CREDENTIALS_PENDING',
      'Live provider missing credentials blocked with 503 PROVIDER_CREDENTIALS_PENDING'
    );
    assert(
      tamperRes.statusCode === 403 && tamperRes.json?.errorCode === 'CLIENT_VIP_OVERRIDE_FORBIDDEN',
      'Client override of priceAmount/vipLevel/grantedBenefits blocked (403 CLIENT_VIP_OVERRIDE_FORBIDDEN)'
    );
    assert(
      directStatusPost.statusCode === 403 &&
        directStatusPost.json?.errorCode === 'CLIENT_VIP_OVERRIDE_FORBIDDEN',
      'Direct POST /api/vip/status blocked (403 CLIENT_VIP_OVERRIDE_FORBIDDEN)'
    );
    assert(
      manualProfilePatch.statusCode === 403 &&
        (manualProfilePatch.json?.code === 'VIP_MANUAL_ASSIGNMENT_FORBIDDEN' ||
          manualProfilePatch.json?.errorCode === 'VIP_MANUAL_ASSIGNMENT_FORBIDDEN'),
      'Manual VIP assignment via PATCH /api/profile/me rejected (403 VIP_MANUAL_ASSIGNMENT_FORBIDDEN)'
    );
    assert(
      anonPurchaseRes.statusCode === 401 || anonPurchaseRes.statusCode === 403,
      `Anonymous purchase without session or demo preview blocked (${anonPurchaseRes.statusCode})`
    );

    // ------------------------------------------------------------------
    // Suite 3: Coin Purchase Guard & Admin-Approved Coin Purchase + Refund
    // ------------------------------------------------------------------
    console.log('\n[Suite 3] Coin VIP Purchase Guard, Admin Approval Flow & Full Coin Refund');
    const unapprovedCoinRes = await request(
      'POST',
      '/api/vip/purchase',
      { planId: 'vip_gold', providerKey: 'wallet_coins', platform: 'web' },
      { Cookie: viewerCookie }
    );
    assert(
      unapprovedCoinRes.statusCode === 403 &&
        unapprovedCoinRes.json?.errorCode === 'COIN_VIP_PURCHASE_NOT_APPROVED',
      'Unapproved coin VIP purchase blocked cleanly (403 COIN_VIP_PURCHASE_NOT_APPROVED)'
    );

    // Admin creates temporary coin-purchasable plan & viewer tests exact coin deduction + refund
    tempCoinPlanId = `vip_coin_probe_${RUN_ID}`;
    const createCoinPlanRes = await request(
      'POST',
      '/api/admin/vip/plans',
      {
        planId: tempCoinPlanId,
        planTier: 'vip_silver',
        vipLevel: 2,
        planName: `Coin Probe ${RUN_ID}`,
        planNameUr: 'ٹیسٹ سکہ پلان',
        durationDays: 15,
        priceAmount: 9.99,
        currency: 'USD',
        allowCoinPurchase: true,
        coinPrice: 50,
        badgeLabel: 'VIP COIN',
        entranceId: 'ent_vip',
        benefitKeys: ['vip_profile_badge', 'special_entrance_animation', 'vip_gift_effects'],
        isActive: true,
      },
      { Cookie: financeCookie }
    );
    assert(
      createCoinPlanRes.statusCode === 201 && createCoinPlanRes.json?.plan?.allowCoinPurchase === true,
      `Finance admin configured temporary coin-enabled plan ${tempCoinPlanId} (50 coins)`
    );

    if (startCoins < 100) {
      const creditRes = await request(
        'POST',
        '/api/admin/finance/adjust',
        {
          targetUserId: viewerId,
          balanceType: 'coins',
          operation: 'credit',
          amount: 100,
          reason: `M7.7 test float (${RUN_ID})`,
          idempotencyKey: `M77_FLOAT_${RUN_ID}`,
        },
        { Cookie: financeCookie }
      );
      if (creditRes.statusCode === 200) addedFloatCoins = 100;
    }

    const coinBeforeRes = await request('GET', '/api/wallet/balance?fresh=true', null, {
      Cookie: viewerCookie,
    });
    const coinsBeforeBuy = Number(coinBeforeRes.json?.wallet?.coins ?? 0);

    const coinBuyRes = await request(
      'POST',
      '/api/vip/purchase',
      {
        planId: tempCoinPlanId,
        providerKey: 'wallet_coins',
        platform: 'web',
        idempotencyKey: `M77_COIN_BUY_${RUN_ID}`,
      },
      { Cookie: viewerCookie }
    );
    const coinOrder = coinBuyRes.json?.order;
    const coinMem = coinBuyRes.json?.membership;
    const coinAfterBuyRes = await request('GET', '/api/wallet/balance?fresh=true', null, {
      Cookie: viewerCookie,
    });
    const coinsAfterBuy = Number(coinAfterBuyRes.json?.wallet?.coins ?? 0);
    const pointsAfterCoinBuy = Number(coinAfterBuyRes.json?.wallet?.points ?? 0);

    assert(
      coinBuyRes.statusCode === 201 &&
        coinBuyRes.json?.activatedImmediately === true &&
        coinOrder?.coinsCharged === 50 &&
        coinMem?.vipLevel === 2 &&
        coinsAfterBuy === coinsBeforeBuy - 50 &&
        pointsAfterCoinBuy === startPoints,
      `Coin VIP purchase deducted exact 50 coins (${coinsBeforeBuy} -> ${coinsAfterBuy}), 0 points touched, VIP II activated`
    );

    if (coinOrder?.orderId) {
      const coinRefundRes = await request(
        'POST',
        '/api/admin/vip/refund',
        { orderId: coinOrder.orderId, reason: 'M7.7 automated coin refund verification' },
        { Cookie: financeCookie }
      );
      const afterCoinRefundBal = await request('GET', '/api/wallet/balance?fresh=true', null, {
        Cookie: viewerCookie,
      });
      const vipAfterRefund = await request('GET', '/api/vip/status', null, { Cookie: viewerCookie });
      assert(
        coinRefundRes.statusCode === 200 &&
          coinRefundRes.json?.order?.status === 'refunded' &&
          Number(afterCoinRefundBal.json?.wallet?.coins) === coinsBeforeBuy &&
          vipAfterRefund.json?.vip?.hasActiveVip === false,
        'Finance admin refund restored exact 50 coins & immediately revoked VIP status'
      );
    }

    await request(
      'PATCH',
      '/api/admin/vip/plans',
      { planId: tempCoinPlanId, isActive: false },
      { Cookie: financeCookie }
    );
    tempCoinPlanId = '';

    // ------------------------------------------------------------------
    // Suite 4: Pending Order Zero-Benefit Guard, Forged Webhook & Failed Payment
    // ------------------------------------------------------------------
    console.log('\n[Suite 4] Pending Order Zero-Benefit Guard, Forged Verify/HMAC & Mismatch Rejection');
    const pendingRes = await request(
      'POST',
      '/api/vip/purchase',
      {
        planId: 'vip_gold',
        providerKey: 'sandbox_verified',
        platform: 'web',
        autoRenewConsent: true,
        idempotencyKey: `M77_GOLD_${RUN_ID}`,
      },
      { Cookie: viewerCookie }
    );
    const goldOrder = pendingRes.json?.order;
    assert(
      pendingRes.statusCode === 201 &&
        goldOrder?.status === 'pending' &&
        pendingRes.json?.activatedImmediately === false &&
        goldOrder?.amount === 19.99,
      `Pending VIP Gold order created (${goldOrder?.orderId}) @ $19.99`
    );

    const pendingVipStatus = await request('GET', '/api/vip/status', null, { Cookie: viewerCookie });
    assert(
      pendingVipStatus.json?.vip?.hasActiveVip === false &&
        pendingVipStatus.json?.vip?.pendingOrder?.orderId === goldOrder?.orderId,
      'Pending VIP order grants ZERO active VIP benefits before webhook verification'
    );

    const [unsignedVerify, forgedWebhook, mismatchAmtWebhook, mismatchCurrWebhook] = await Promise.all([
      request('POST', `/api/vip/orders/${goldOrder.orderId}/verify`, { status: 'verified' }, { Cookie: viewerCookie }),
      request(
        'POST',
        '/api/vip/webhooks/sandbox_verified',
        {
          eventId: `FORGED_VIP_${RUN_ID}`,
          orderId: goldOrder.orderId,
          eventType: 'payment_succeeded',
          amount: 19.99,
          currency: 'USD',
        },
        { 'x-vip-webhook-signature': 'deadbeef0000forgedsignature' }
      ),
      request(
        'POST',
        '/api/vip/webhooks/sandbox_verified',
        {
          eventId: `BAD_AMT_${RUN_ID}`,
          orderId: goldOrder.orderId,
          eventType: 'payment_succeeded',
          amount: 0.01,
          currency: 'USD',
        },
        {
          'x-vip-webhook-signature': signVipWebhook(
            'sandbox_verified',
            `BAD_AMT_${RUN_ID}`,
            goldOrder.orderId,
            'payment_succeeded',
            0.01,
            'USD'
          ),
        }
      ),
      request(
        'POST',
        '/api/vip/webhooks/sandbox_verified',
        {
          eventId: `BAD_CURR_${RUN_ID}`,
          orderId: goldOrder.orderId,
          eventType: 'payment_succeeded',
          amount: 19.99,
          currency: 'PKR',
        },
        {
          'x-vip-webhook-signature': signVipWebhook(
            'sandbox_verified',
            `BAD_CURR_${RUN_ID}`,
            goldOrder.orderId,
            'payment_succeeded',
            19.99,
            'PKR'
          ),
        }
      ),
    ]);

    assert(
      unsignedVerify.statusCode === 403 &&
        unsignedVerify.json?.errorCode === 'PROVIDER_VERIFICATION_REQUIRED',
      'Unsigned client verify call rejected (403 PROVIDER_VERIFICATION_REQUIRED)'
    );
    assert(
      forgedWebhook.statusCode === 403 && forgedWebhook.json?.errorCode === 'INVALID_WEBHOOK_SIGNATURE',
      'Forged HMAC webhook signature rejected (403 INVALID_WEBHOOK_SIGNATURE)'
    );
    assert(
      mismatchAmtWebhook.statusCode === 400 &&
        mismatchAmtWebhook.json?.errorCode === 'AMOUNT_OR_CURRENCY_MISMATCH',
      'Webhook amount mismatch ($0.01 vs $19.99) rejected (400 AMOUNT_OR_CURRENCY_MISMATCH)'
    );
    assert(
      mismatchCurrWebhook.statusCode === 400 &&
        mismatchCurrWebhook.json?.errorCode === 'AMOUNT_OR_CURRENCY_MISMATCH',
      'Webhook currency mismatch (PKR vs USD) rejected (400 AMOUNT_OR_CURRENCY_MISMATCH)'
    );

    // Failed payment webhook activates ZERO benefits & ZERO receipt
    const failOrderRes = await request(
      'POST',
      '/api/vip/purchase',
      {
        planId: 'vip_basic',
        providerKey: 'sandbox_verified',
        platform: 'web',
        idempotencyKey: `M77_FAIL_${RUN_ID}`,
      },
      { Cookie: viewerCookie }
    );
    const failOrderId = failOrderRes.json?.order?.orderId;
    const failSbxRes = await request(
      'POST',
      '/api/vip/sandbox/complete',
      { orderId: failOrderId, outcome: 'fail' },
      { Cookie: viewerCookie }
    );
    const vipAfterFail = await request('GET', '/api/vip/status', null, { Cookie: viewerCookie });
    assert(
      failSbxRes.statusCode === 200 &&
        failSbxRes.json?.status === 'failed' &&
        failSbxRes.json?.membership === null &&
        failSbxRes.json?.receipt === null &&
        vipAfterFail.json?.vip?.hasActiveVip === false,
      'Failed payment simulation leaves ZERO active VIP & ZERO receipt'
    );

    // ------------------------------------------------------------------
    // Suite 5: Verified Webhook Activation + SSE + Idempotent Replay + Receipt + Profile/Party
    // ------------------------------------------------------------------
    console.log('\n[Suite 5] Verified Webhook Activation, SSE Events, Idempotency, Receipt & Profile/Chat');
    const goldEventId = `VIP_EVT_${RUN_ID}`;
    const goldSig = signVipWebhook(
      'sandbox_verified',
      goldEventId,
      goldOrder.orderId,
      'payment_succeeded',
      19.99,
      'USD'
    );

    let webhookRes = null;
    const sseActivationEvents = await collectSseEvents(
      '/api/vip/events',
      { Cookie: viewerCookie },
      3600,
      async () => {
        webhookRes = await request(
          'POST',
          '/api/vip/webhooks/sandbox_verified',
          {
            eventId: goldEventId,
            orderId: goldOrder.orderId,
            eventType: 'payment_succeeded',
            paymentReference: `PG_VIP_${RUN_ID}`,
            amount: 19.99,
            currency: 'USD',
          },
          { 'x-vip-webhook-signature': goldSig }
        );
      }
    );

    const goldMembership = webhookRes?.json?.membership;
    const goldReceipt = webhookRes?.json?.receipt;
    if (goldOrder?.orderId) createdOrderIdsForRefundOrCleanup.push(goldOrder.orderId);

    assert(
      webhookRes?.statusCode === 200 &&
        webhookRes.json?.status === 'verified' &&
        goldMembership?.status === 'active' &&
        goldMembership?.vipLevel === 3 &&
        Boolean(goldReceipt?.receiptId),
      `Verified webhook activated VIP Gold (${goldMembership?.membershipId}) + receipt ${goldReceipt?.receiptId}`
    );

    const sseNames = sseActivationEvents.map((e) => e.event);
    assert(
      sseNames.includes('vip:state_sync') &&
        sseNames.includes('vip:purchase_completed') &&
        sseNames.includes('vip:membership_activated') &&
        sseNames.includes('vip:benefits_updated'),
      `SSE streamed live VIP lifecycle events (${[...new Set(sseNames)].join(', ')})`
    );

    // Replay same webhook eventId & idempotencyKey
    const [replayWebhookRes, replayOrderRes] = await Promise.all([
      request(
        'POST',
        '/api/vip/webhooks/sandbox_verified',
        {
          eventId: goldEventId,
          orderId: goldOrder.orderId,
          eventType: 'payment_succeeded',
          paymentReference: `PG_VIP_${RUN_ID}`,
          amount: 19.99,
          currency: 'USD',
        },
        { 'x-vip-webhook-signature': goldSig }
      ),
      request(
        'POST',
        '/api/vip/purchase',
        {
          planId: 'vip_gold',
          providerKey: 'sandbox_verified',
          platform: 'web',
          autoRenewConsent: true,
          idempotencyKey: `M77_GOLD_${RUN_ID}`,
        },
        { Cookie: viewerCookie }
      ),
    ]);
    assert(
      replayWebhookRes.json?.deduplicated === true && replayOrderRes.json?.deduplicated === true,
      'Duplicate webhook & order idempotency replay prevented without double billing or double activation'
    );

    // Profile, Public Profile, JSON Receipt, TXT Receipt & Party Chat badge
    const [meRes, pubProfileRes, jsonReceiptRes, txtReceiptRes, chatSendRes] = await Promise.all([
      request('GET', '/api/profile/me', null, { Cookie: viewerCookie }),
      request('GET', `/api/users/${viewerId}/public-profile`),
      request('GET', `/api/vip/receipts/${goldReceipt.receiptId}`, null, { Cookie: viewerCookie }),
      request('GET', `/api/vip/receipts/${goldReceipt.receiptId}?format=txt`, null, {
        Cookie: viewerCookie,
      }),
      request('POST', `/api/party/${PARTY_ROOM_ID}/chat/send`, {
        senderId: viewerId,
        senderName: 'Viewer 701',
        messageText: `M7.7 VIP badge check ${RUN_ID}`,
      }),
    ]);

    assert(
      meRes.statusCode === 200 &&
        meRes.json?.user?.vip?.hasActiveVip === true &&
        meRes.json?.user?.vip?.vipLevel === 3 &&
        Boolean(meRes.json?.user?.vip?.profileFrameAssetUrl) &&
        pubProfileRes.json?.profile?.vip?.hasActiveVip === true &&
        pubProfileRes.json?.profile?.vip?.badgeLabel === 'VIP III',
      'User profile & public profile expose active VIP III badge, frame & decoration automatically'
    );
    assert(
      jsonReceiptRes.statusCode === 200 &&
        jsonReceiptRes.json?.receipt?.receiptId === goldReceipt.receiptId &&
        txtReceiptRes.statusCode === 200 &&
        txtReceiptRes.text.includes('OFFICIAL VIP MEMBERSHIP RECEIPT') &&
        txtReceiptRes.text.includes(goldReceipt.receiptId),
      'VIP payment receipt available in both structured JSON and downloadable .TXT format'
    );

    const chatMsgsRes = await request('GET', `/api/party/${PARTY_ROOM_ID}/chat/messages`);
    const myChatMsg = (chatMsgsRes.json?.messages || []).find(
      (m) => String(m.senderId) === viewerId && String(m.messageText || '').includes(`${RUN_ID}`)
    );
    assert(
      chatSendRes.statusCode === 200 &&
        Boolean(myChatMsg) &&
        myChatMsg.vipLevel === 3 &&
        myChatMsg.vipBadgeLabel === 'VIP III',
      'Party room chat dynamically attaches VIP III badge & decoration to active VIP sender'
    );

    // ------------------------------------------------------------------
    // Suite 6: Module 7.4 Host Entrance Effect Gating & Module 7.3+7.5 Gift Integration (70/30)
    // ------------------------------------------------------------------
    console.log('\n[Suite 6] Module 7.4 VIP Entrance Unlock & Module 7.3/7.5 Gift Effect (70/30 Preserved)');
    const [vipEntSuccess, nonVipEntBlock] = await Promise.all([
      request(
        'POST',
        '/api/animations/entrance/trigger',
        { hostUserId: viewerId, entranceType: 'vip', roomId: LIVE_ROOM_ID },
        { Cookie: viewerCookie }
      ),
      request(
        'POST',
        '/api/animations/entrance/trigger?preview=demo',
        { hostUserId: AYESHA_HOST_ID, entranceType: 'vip', roomId: LIVE_ROOM_ID }
      ),
    ]);

    assert(
      vipEntSuccess.statusCode === 201 &&
        vipEntSuccess.json?.success === true &&
        vipEntSuccess.json?.queueItem?.eventCategory === 'host_entrance' &&
        vipEntSuccess.json?.queueItem?.entranceType === 'vip' &&
        vipEntSuccess.json?.queueItem?.entranceId === 'ent_vip' &&
        vipEntSuccess.json?.queueItem?.vipBadgeLabel === 'VIP III',
      'Active VIP Gold unlocks Module 7.4 VIP Host Entrance Animation cleanly'
    );
    assert(
      nonVipEntBlock.statusCode === 403 && nonVipEntBlock.json?.code === 'VIP_STATUS_REQUIRED',
      'Non-VIP Host Ayesha still blocked from triggering VIP entrance (403 VIP_STATUS_REQUIRED)'
    );

    // Send 10-coin gift while VIP active -> check 70/30 math unchanged & vipGiftEffect broadcast on SSE
    const zaraBalBefore = await request(
      'GET',
      `/api/wallet/balance?userId=${ZARA_HOST_ID}&preview=demo&fresh=true`
    );
    let giftSendRes = null;
    const giftSseEvents = await collectSseEvents(
      `/api/gifts/live/events?roomId=${LIVE_ROOM_ID}`,
      { Cookie: viewerCookie },
      3500,
      async () => {
        giftSendRes = await request(
          'POST',
          '/api/gifts/send',
          {
            recipientHostId: ZARA_HOST_ID,
            giftId: 'gift_rose',
            quantity: 1,
            roomId: LIVE_ROOM_ID,
            idempotencyKey: `M77_GIFT_${RUN_ID}`,
          },
          { Cookie: viewerCookie }
        );
      },
      'gift:state_sync'
    );
    const sentTx = giftSendRes?.json?.transaction;
    if (sentTx?.giftTransactionId) reversedGiftTxIds.push(sentTx.giftTransactionId);

    const zaraBalAfter = await request(
      'GET',
      `/api/wallet/balance?userId=${ZARA_HOST_ID}&preview=demo&fresh=true`
    );
    const giftAnimBroadcast = giftSseEvents.find(
      (e) =>
        e.event === 'gift:animation_broadcast' &&
        e.data?.giftTransactionId === sentTx?.giftTransactionId
    );
    assert(
      giftSendRes?.statusCode === 200 &&
        sentTx?.totalCoinAmount === 10 &&
        sentTx?.hostPointsCredited === 7 &&
        sentTx?.platformShare === 3 &&
        Number(zaraBalAfter.json?.wallet?.points) === Number(zaraBalBefore.json?.wallet?.points) + 7 &&
        Number(giftAnimBroadcast?.data?.senderVipLevel) === 3 &&
        giftAnimBroadcast?.data?.vipGiftEffect?.enabled === true,
      'VIP gift send broadcasts vipGiftEffect on live SSE while strictly preserving 70% host points (7) + 30% platform (3)'
    );

    // ------------------------------------------------------------------
    // Suite 7: Sandbox Renewal Extension + Auto-Renew Cancel + Immediate Cancel
    // ------------------------------------------------------------------
    console.log('\n[Suite 7] Verified Membership Renewal, Expiry Extension & Cancellation');
    const renewOrderRes = await request(
      'POST',
      '/api/vip/renew',
      {
        planId: 'vip_gold',
        providerKey: 'sandbox_verified',
        membershipId: goldMembership.membershipId,
        platform: 'web',
        idempotencyKey: `M77_RENEW_${RUN_ID}`,
      },
      { Cookie: viewerCookie }
    );
    const renewOrder = renewOrderRes.json?.order;
    if (renewOrder?.orderId) createdOrderIdsForRefundOrCleanup.push(renewOrder.orderId);

    let renewCompleteRes = null;
    const sseRenewEvents = await collectSseEvents(
      '/api/vip/events',
      { Cookie: viewerCookie },
      3600,
      async () => {
        renewCompleteRes = await request(
          'POST',
          '/api/vip/sandbox/complete',
          { orderId: renewOrder.orderId, outcome: 'succeed' },
          { Cookie: viewerCookie }
        );
      }
    );

    const renewedMem = renewCompleteRes?.json?.membership;
    const renewReceipt = renewCompleteRes?.json?.receipt;
    const prevExpiryMs = new Date(goldMembership.expiryDate).getTime();
    const renewedExpiryMs = new Date(renewedMem?.expiryDate || 0).getTime();

    assert(
      renewOrderRes.statusCode === 201 &&
        renewCompleteRes?.statusCode === 200 &&
        renewedMem?.renewalReference === goldMembership.membershipId &&
        renewReceipt?.receiptType === 'renewal' &&
        renewedExpiryMs > prevExpiryMs + 25 * 86400_000 &&
        sseRenewEvents.some((e) => e.event === 'vip:membership_renewed'),
      `Renewal extended expiry from ${goldMembership.expiryDate.slice(0, 10)} to ${renewedMem?.expiryDate?.slice(0, 10)} with vip:membership_renewed SSE`
    );

    const historyRes = await request('GET', '/api/vip/history?page=1&limit=20', null, {
      Cookie: viewerCookie,
    });
    assert(
      historyRes.statusCode === 200 &&
        (historyRes.json?.records || []).length >= 2 &&
        (historyRes.json?.orders || []).length >= 2,
      `VIP membership history lists both initial purchase & renewal records (${(historyRes.json?.records || []).length})`
    );

    // Auto-renew off preserves active VIP, immediate cancel revokes VIP & 7.4 entrance
    const autoOffRes = await request(
      'POST',
      '/api/vip/cancel',
      { membershipId: renewedMem.membershipId, cancelMode: 'auto_renew_only' },
      { Cookie: viewerCookie }
    );
    assert(
      autoOffRes.statusCode === 200 &&
        autoOffRes.json?.membership?.status === 'active' &&
        autoOffRes.json?.membership?.autoRenewEnabled === false,
      'cancelMode=auto_renew_only disables auto-renew while keeping active VIP until expiry'
    );

    const immediateCancelRes = await request(
      'POST',
      '/api/vip/cancel',
      { membershipId: renewedMem.membershipId, cancelMode: 'immediate', reason: 'M7.7 test cancel' },
      { Cookie: viewerCookie }
    );
    const vipEntAfterCancel = await request(
      'POST',
      '/api/animations/entrance/trigger',
      { hostUserId: viewerId, entranceType: 'vip', roomId: LIVE_ROOM_ID },
      { Cookie: viewerCookie }
    );
    assert(
      immediateCancelRes.statusCode === 200 &&
        immediateCancelRes.json?.statusProfile?.hasActiveVip === false &&
        vipEntAfterCancel.statusCode === 403,
      'Immediate cancel disables VIP profile & immediately revokes Module 7.4 VIP entrance access'
    );

    // ------------------------------------------------------------------
    // Suite 8: Finance Admin Status Lifecycle (Reactivate / Suspend / Expire), Upload, RBAC & Privacy
    // ------------------------------------------------------------------
    console.log('\n[Suite 8] Admin Status Controls, Asset Upload, RBAC Enforcement & Privacy Isolation');
    const [
      rbacPlansGet,
      rbacPlansPost,
      rbacMembersGet,
      rbacRefundPost,
      rbacUploadPost,
      privHistory,
      privReceipt,
      privSse,
    ] = await Promise.all([
      request('GET', '/api/admin/vip/plans', null, { Cookie: ordinaryAuth.cookie }),
      request(
        'POST',
        '/api/admin/vip/plans',
        { planTier: 'vip_basic', vipLevel: 1, planName: 'Hacker VIP', durationDays: 30, priceAmount: 1 },
        { Cookie: ordinaryAuth.cookie }
      ),
      request('GET', '/api/admin/vip/memberships', null, { Cookie: ordinaryAuth.cookie }),
      request(
        'POST',
        '/api/admin/vip/refund',
        { orderId: renewOrder.orderId },
        { Cookie: ordinaryAuth.cookie }
      ),
      request(
        'POST',
        '/api/admin/vip/upload',
        {
          fileName: 'unauth.png',
          mimeType: 'image/png',
          assetKind: 'badge',
          fileBase64: TINY_PNG_BASE64,
        },
        { Cookie: ordinaryAuth.cookie }
      ),
      request('GET', `/api/vip/history?userId=${viewerId}`, null, { Cookie: ordinaryAuth.cookie }),
      request('GET', `/api/vip/receipts/${renewReceipt.receiptId}`, null, {
        Cookie: ordinaryAuth.cookie,
      }),
      request('GET', `/api/vip/events?userId=${viewerId}`, null, { Cookie: ordinaryAuth.cookie }),
    ]);

    assert(
      rbacPlansGet.statusCode === 403 &&
        rbacPlansPost.statusCode === 403 &&
        rbacMembersGet.statusCode === 403 &&
        rbacRefundPost.statusCode === 403 &&
        rbacUploadPost.statusCode === 403,
      'Ordinary Admin receives strict 403 on all Finance Admin /api/admin/vip/* endpoints'
    );
    assert(
      privHistory.statusCode === 403 && privReceipt.statusCode === 403 && privSse.statusCode === 403,
      'Cross-user VIP privacy enforced (403 on another user history, receipt, and SSE stream)'
    );

    // Finance Admin Reactivate -> Suspend -> Reactivate -> Expire (checks SSE vip:membership_expired)
    const reactivateRes = await request(
      'POST',
      '/api/admin/vip/memberships',
      { membershipId: renewedMem.membershipId, action: 'reactivate', reason: 'M7.7 admin reactivate test' },
      { Cookie: financeCookie }
    );
    const suspendRes = await request(
      'POST',
      '/api/admin/vip/memberships',
      { membershipId: renewedMem.membershipId, action: 'suspend', reason: 'M7.7 admin suspend test' },
      { Cookie: financeCookie }
    );
    const statusWhileSuspended = await request('GET', '/api/vip/status', null, { Cookie: viewerCookie });

    await request(
      'POST',
      '/api/admin/vip/memberships',
      { membershipId: renewedMem.membershipId, action: 'reactivate', reason: 'M7.7 restore before expire' },
      { Cookie: financeCookie }
    );

    let expireRes = null;
    const sseExpireEvents = await collectSseEvents(
      '/api/vip/events',
      { Cookie: viewerCookie },
      3200,
      async () => {
        expireRes = await request(
          'POST',
          '/api/admin/vip/memberships',
          { membershipId: renewedMem.membershipId, action: 'expire', reason: 'M7.7 server expiry test' },
          { Cookie: financeCookie }
        );
      }
    );
    const statusAfterExpire = await request('GET', '/api/vip/status', null, { Cookie: viewerCookie });

    assert(
      reactivateRes.statusCode === 200 &&
        reactivateRes.json?.membership?.status === 'active' &&
        suspendRes.statusCode === 200 &&
        statusWhileSuspended.json?.vip?.hasActiveVip === false &&
        expireRes?.statusCode === 200 &&
        expireRes.json?.membership?.status === 'expired' &&
        statusAfterExpire.json?.vip?.hasActiveVip === false &&
        sseExpireEvents.some((e) => e.event === 'vip:membership_expired'),
      'Finance admin reactivate/suspend/expire lifecycle revokes privileges cleanly & emits vip:membership_expired'
    );

    // Finance Admin asset upload + membership query check
    const [adminMemList, uploadRes] = await Promise.all([
      request('GET', `/api/admin/vip/memberships?userId=${viewerId}`, null, { Cookie: financeCookie }),
      request(
        'POST',
        '/api/admin/vip/upload',
        {
          fileName: `vip_badge_${RUN_ID}.png`,
          mimeType: 'image/png',
          assetKind: 'badge',
          fileBase64: TINY_PNG_BASE64,
        },
        { Cookie: financeCookie }
      ),
    ]);
    assert(
      adminMemList.statusCode === 200 &&
        (adminMemList.json?.memberships || []).length >= 2 &&
        uploadRes.statusCode === 201 &&
        Boolean(uploadRes.json?.asset?.fileUrl),
      'Finance Admin can list VIP memberships/audits & upload verified VIP badge PNG asset'
    );
  } finally {
    // ------------------------------------------------------------------
    // Clean Teardown (restore viewer701 wallet, gift tx & VIP clean state)
    // ------------------------------------------------------------------
    for (const txId of reversedGiftTxIds) {
      await request(
        'POST',
        `/api/admin/gifts/transactions/${txId}/reverse`,
        { reason: `M7.7 cleanup (${RUN_ID})` },
        { Cookie: financeCookie }
      ).catch(() => {});
    }
    if (tempCoinPlanId && financeCookie) {
      await request(
        'PATCH',
        '/api/admin/vip/plans',
        { planId: tempCoinPlanId, isActive: false },
        { Cookie: financeCookie }
      ).catch(() => {});
    }
    if (viewerCookie) {
      await request(
        'POST',
        '/api/vip/cancel',
        { cancelMode: 'immediate', reason: 'M7.7 teardown reset' },
        { Cookie: viewerCookie }
      ).catch(() => {});
    }
    if (addedFloatCoins > 0 && financeCookie && viewerId) {
      await request(
        'POST',
        '/api/admin/finance/adjust',
        {
          targetUserId: viewerId,
          balanceType: 'coins',
          operation: 'debit',
          amount: addedFloatCoins,
          reason: `M7.7 cleanup float debit (${RUN_ID})`,
          idempotencyKey: `M77_CLEAN_${RUN_ID}`,
        },
        { Cookie: financeCookie }
      ).catch(() => {});
    }
  }

  console.log(`\n--------------------------------------------------------------`);
  console.log(`Module 7.7 Results: ${passed} PASSED | ${failed} FAILED`);
  console.log(`--------------------------------------------------------------\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
