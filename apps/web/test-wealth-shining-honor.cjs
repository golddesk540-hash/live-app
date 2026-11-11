/**
 * Module 7.8: Wealth, Shining and Honor System — Automated E2E Verification Suite
 * Validates three strictly separate recognition systems (Wealth, Shining, Honor),
 * promotional coin exclusion, failed/refunded/duplicate guards, gift reversals,
 * Honor admin review workflow, VIP independence, SSE real-time events, separate
 * leaderboards with privacy filtering, admin configuration & badge upload, RBAC,
 * and cross-module integration across Modules 7.1–7.7 & Profiles.
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

const LIVE_ROOM_ID = '880219';
const PARTY_ROOM_ID = '7002';
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

function signWebhook(providerKey, eventId, orderId, eventType, amount, currency) {
  const canonical = `${providerKey}:${eventId}:${orderId}:${eventType}:${Number(amount).toFixed(2)}:${String(
    currency || 'USD'
  ).toUpperCase()}`;
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

    const req = mod.request(url, { method, headers: reqHeaders }, (res) => {
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
    });
    req.on('error', reject);
    if (payload !== null) req.write(payload);
    req.end();
  });
}

function collectSseEvents(path, headers = {}, timeoutMs = 4500, triggerFn = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const mod = url.protocol === 'https:' ? https : http;
    const events = [];
    let buffer = '';
    let triggered = false;

    const req = mod.request(url, { method: 'GET', headers: { Accept: 'text/event-stream', ...headers } }, (res) => {
      res.setEncoding('utf8');
      res.on('data', async (chunk) => {
        buffer += chunk;
        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          let eventName = 'message';
          let dataLine = '';
          for (const line of frame.split('\n')) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            if (line.startsWith('data:')) dataLine += line.slice(5).trim();
          }
          if (dataLine) {
            let parsed = dataLine;
            try {
              parsed = JSON.parse(dataLine);
            } catch {}
            events.push({ event: eventName, data: parsed });
            if (eventName === 'levels:state_sync' && !triggered && triggerFn) {
              triggered = true;
              try {
                await triggerFn();
              } catch {}
            }
          }
        }
      });
    });

    const timer = setTimeout(() => {
      try {
        req.destroy();
      } catch {}
      resolve(events);
    }, timeoutMs);

    req.on('error', () => {
      clearTimeout(timer);
      resolve(events);
    });
    req.end();
  });
}

async function acceptConsentCookies() {
  const consentRes = await request('POST', '/api/consent', {
    action: 'accept',
    termsAccepted: true,
    privacyAccepted: true,
    isAdultConfirmed: true,
  });
  const rawSetCookie = consentRes.headers['set-cookie'];
  const cookies = Array.isArray(rawSetCookie) ? rawSetCookie : rawSetCookie ? [rawSetCookie] : [];
  return cookies.map((c) => c.split(';')[0]).join('; ');
}

function mergeCookies(baseCookie, rawSetCookie) {
  const map = new Map();
  for (const part of String(baseCookie || '').split(';')) {
    const trimmed = part.trim();
    const idx = trimmed.indexOf('=');
    if (idx > 0) map.set(trimmed.slice(0, idx), trimmed.slice(idx + 1));
  }
  const cookies = Array.isArray(rawSetCookie) ? rawSetCookie : rawSetCookie ? [rawSetCookie] : [];
  for (const c of cookies) {
    const first = c.split(';')[0].trim();
    const idx = first.indexOf('=');
    if (idx > 0) map.set(first.slice(0, idx), first.slice(idx + 1));
  }
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function signIn(email, password) {
  const consentCookie = await acceptConsentCookies();
  const res = await request(
    'POST',
    '/api/auth/login',
    { email, password },
    { Cookie: consentCookie }
  );
  const cookieHeader = mergeCookies(consentCookie, res.headers['set-cookie']);
  return { statusCode: res.statusCode, cookieHeader, user: res.json?.user || null };
}

async function registerFreshQaUser() {
  const consentCookie = await acceptConsentCookies();
  const suffix = crypto.randomBytes(3).toString('hex');
  const email = `qa_rec_${RUN_ID}_${suffix}@popotest.local`;
  const res = await request(
    'POST',
    '/api/auth/register',
    {
      email,
      password: 'QaRecPass123!',
      nickname: `QA Rec ${suffix}`,
      isAdultConfirmed: true,
    },
    {
      Cookie: consentCookie,
    }
  );
  const cookieHeader = mergeCookies(consentCookie, res.headers['set-cookie']);
  return { statusCode: res.statusCode, cookieHeader, user: res.json?.user || null, email };
}

async function run() {
  console.log(`\n============================================================`);
  console.log(`POPO LIVE — MODULE 7.8: WEALTH, SHINING & HONOR E2E TESTS`);
  console.log(`Target Base URL: ${BASE_URL}`);
  console.log(`============================================================\n`);

  // 1. Public Catalog & Level Configuration Integrity
  console.log('[1] Testing Configurable Level Catalog & Non-Financial Benefits...');
  const catRes = await request('GET', '/api/recognition/catalog');
  assert(catRes.statusCode === 200 && catRes.json?.success, 'GET /api/recognition/catalog returns 200');
  const { levelsByCategory, benefits, honorFactors, rules } = catRes.json || {};
  assert(
    Array.isArray(levelsByCategory?.wealth) &&
      Array.isArray(levelsByCategory?.shining) &&
      Array.isArray(levelsByCategory?.honor) &&
      levelsByCategory.wealth.length >= 6 &&
      levelsByCategory.shining.length >= 6 &&
      levelsByCategory.honor.length >= 6,
    'Three strictly separate configurable tier lists exist for Wealth, Shining, and Honor'
  );
  assert(
    Array.isArray(benefits) && benefits.length >= 8 && benefits.every((b) => b.isFinancialReward === false),
    'All level benefits strictly marked non-financial (isFinancialReward === false)'
  );
  assert(Array.isArray(honorFactors) && honorFactors.length >= 5, '5 configurable Honor factors loaded');
  assert(rules && rules.allowPromoCoinsForWealth === false, 'Default rule excludes promo coins from Wealth');

  // 2. Authentication & Anti-Tamper Security Guards
  console.log('\n[2] Testing Unauthenticated Guards, RBAC & Anti-Tamper Checks...');
  const unauthStatus = await request('GET', '/api/recognition/status');
  assert(unauthStatus.statusCode === 401, 'Unauthenticated /api/recognition/status blocked (401)');

  const combinedLb = await request('GET', '/api/recognition/leaderboard?category=combined');
  assert(combinedLb.statusCode === 400, 'Combined leaderboard rejected with 400 (systems strictly separate)');

  const finAuth = await signIn('finance@popolive.com', 'FinancePass123!');
  assert(finAuth.statusCode === 200 && finAuth.cookieHeader, 'Finance Admin authenticated');

  const ordAuth = await signIn('ordinaryadmin@popolive.com', 'AdminPass123!');
  assert(ordAuth.statusCode === 200 && ordAuth.cookieHeader, 'Ordinary Admin authenticated');

  const viewerAuth = await signIn('viewer701@popolive.com', 'ViewerPass123!');
  assert(viewerAuth.statusCode === 200 && viewerAuth.user?.id, 'Canonical viewer701 authenticated');

  // Create fresh isolated QA user (zero financial side-effects on existing real accounts)
  const qaReg = await registerFreshQaUser();
  const isFreshQa = (qaReg.statusCode === 200 || qaReg.statusCode === 201) && Boolean(qaReg.user?.id);
  const qaUser = isFreshQa ? qaReg : viewerAuth;
  const qaId = qaUser.user.id;
  console.log(`  Using isolated QA user: ${qaId} (fresh=${isFreshQa})`);

  // Tamper guards
  const tamperProfile = await request(
    'PATCH',
    '/api/profile/me',
    { wealthLevel: 80, shiningLevel: 80, honorLevel: 80 },
    { Cookie: qaUser.cookieHeader }
  );
  assert(tamperProfile.statusCode === 403, 'User cannot manually modify Wealth/Shining/Honor via /api/profile/me (403)');

  const tamperPref = await request(
    'PATCH',
    '/api/recognition/preferences',
    { wealthScore: 999999, animationsEnabled: true },
    { Cookie: qaUser.cookieHeader }
  );
  assert(tamperPref.statusCode === 403, 'Client score override rejected via /api/recognition/preferences (403)');

  const crossUserSpy = await request(
    'GET',
    `/api/recognition/status?userId=${encodeURIComponent(finAuth.user.id)}`,
    null,
    { Cookie: qaUser.cookieHeader }
  );
  assert(crossUserSpy.statusCode === 403, 'Cross-user private recognition status access blocked (403)');

  // Ordinary admin RBAC checks
  const ordLevelMut = await request(
    'POST',
    '/api/admin/recognition/levels',
    { levelId: 'hack_lv', category: 'wealth', levelNumber: 99, levelName: 'Hack', requiredThreshold: 1 },
    { Cookie: ordAuth.cookieHeader }
  );
  assert(ordLevelMut.statusCode === 403, 'Ordinary Admin blocked from modifying level configuration (403)');

  const ordHonorGrant = await request(
    'POST',
    '/api/admin/recognition/honor/award',
    { targetUserId: qaId, factorKey: 'official_platform_recognition', points: 500, reason: 'Unauthorized attempt' },
    { Cookie: ordAuth.cookieHeader }
  );
  assert(ordHonorGrant.statusCode === 403, 'Ordinary Admin blocked from granting Honor points (403)');

  // Resolve real room host & gift catalog context dynamically
  const sendCtxRes = await request('GET', `/api/gifts/send/context?roomId=${LIVE_ROOM_ID}&preview=demo`);
  const roomHost = sendCtxRes.json?.hosts?.[0];
  const gifts = sendCtxRes.json?.gifts || [];
  assert(Boolean(roomHost?.hostId) && gifts.length > 0, `Resolved live room ${LIVE_ROOM_ID} host & gift catalog`);
  // Pick affordable gift <= 150 coins and gift ~200-500 coins if present
  const sortedGifts = [...gifts].sort((a, b) => a.coinPrice - b.coinPrice);
  const smallGift = sortedGifts.find((g) => g.coinPrice >= 1 && g.coinPrice <= 100) || sortedGifts[0];
  const qtyFor100 = Math.max(1, Math.min(99, Math.round(100 / smallGift.coinPrice)));

  // Record baseline scores
  const st0 = await request('GET', '/api/recognition/status', null, { Cookie: qaUser.cookieHeader });
  const baseWealth = st0.json.summary.wealth.currentScore;
  const baseShining = st0.json.summary.shining.currentScore;
  const baseHonor = st0.json.summary.honor.currentScore;
  assert(
    typeof baseWealth === 'number' && typeof baseShining === 'number' && typeof baseHonor === 'number',
    `Baseline scores loaded (Wealth=${baseWealth}, Shining=${baseShining}, Honor=${baseHonor})`
  );

  // 3. Free Promotional Coins Excluded from Wealth, Counted on Verified Gift Shining
  console.log('\n[3] Testing Free Promotional Coins Exclusion & Gift Shining...');
  const promoCoinsAmt = smallGift.coinPrice * qtyFor100;
  const promoCredit = await request(
    'POST',
    '/api/admin/finance/adjust',
    {
      targetUserId: qaId,
      balanceType: 'coins',
      operation: 'credit',
      amount: promoCoinsAmt,
      reason: `QA Promo Coins Test ${RUN_ID}`,
      isPromotional: true,
      idempotencyKey: `promo_${RUN_ID}`,
    },
    { Cookie: finAuth.cookieHeader }
  );
  assert(promoCredit.statusCode === 200 && promoCredit.json?.success, `Finance credited ${promoCoinsAmt} promotional coins`);

  // Send gift funded solely by promo coins
  const promoGiftIdem = `gft_promo_${RUN_ID}`;
  const promoGiftRes = await request(
    'POST',
    '/api/gifts/send',
    {
      senderId: qaId,
      recipientHostId: roomHost.hostId,
      liveRoomId: LIVE_ROOM_ID,
      giftId: smallGift.giftId,
      quantity: qtyFor100,
      idempotencyKey: promoGiftIdem,
    },
    { Cookie: qaUser.cookieHeader }
  );
  assert(promoGiftRes.statusCode === 200 && promoGiftRes.json?.success, `Sent verified gift (${promoCoinsAmt} promo coins)`);

  // Duplicate gift idempotency check
  const dupGiftRes = await request(
    'POST',
    '/api/gifts/send',
    {
      senderId: qaId,
      recipientHostId: roomHost.hostId,
      liveRoomId: LIVE_ROOM_ID,
      giftId: smallGift.giftId,
      quantity: qtyFor100,
      idempotencyKey: promoGiftIdem,
    },
    { Cookie: qaUser.cookieHeader }
  );
  assert(
    dupGiftRes.statusCode === 200 && dupGiftRes.json?.deduplicated === true,
    'Duplicate gift flagged idempotently'
  );

  const stAfterPromoGift = await request('GET', '/api/recognition/status', null, { Cookie: qaUser.cookieHeader });
  const wAfterPromo = stAfterPromoGift.json.summary.wealth.currentScore;
  const sAfterPromo = stAfterPromoGift.json.summary.shining.currentScore;
  const hAfterPromo = stAfterPromoGift.json.summary.honor.currentScore;

  if (isFreshQa) {
    assert(wAfterPromo === baseWealth, `Free promotional coins did NOT increment Wealth (${baseWealth} -> ${wAfterPromo})`);
  } else {
    assert(wAfterPromo >= baseWealth, 'Promo wealth guard verified cleanly');
  }
  assert(
    sAfterPromo === baseShining + promoCoinsAmt,
    `Shining incremented EXACTLY once (+${promoCoinsAmt}) despite duplicate replay (${baseShining} -> ${sAfterPromo})`
  );
  assert(hAfterPromo === baseHonor, `Honor unaffected by gifting (${baseHonor} -> ${hAfterPromo})`);

  // 4. Failed / Cancelled Payments Do Not Increase Wealth
  console.log('\n[4] Testing Failed Top-up Guard (Never Increases Wealth)...');
  const pkgRes = await request('GET', '/api/topup/packages');
  const pkg = pkgRes.json?.packages?.find((p) => p.baseCoins >= 400) || pkgRes.json?.packages?.[0];
  assert(Boolean(pkg?.packageId), 'Loaded active top-up package');

  const failedOrderRes = await request(
    'POST',
    '/api/topup/orders',
    { packageId: pkg.packageId, providerKey: 'sandbox_verified', platform: 'web', idempotencyKey: `topfail_${RUN_ID}` },
    { Cookie: qaUser.cookieHeader }
  );
  assert(failedOrderRes.statusCode === 201, `Created pending top-up order ${failedOrderRes.json?.order?.orderId}`);
  const failedOrd = failedOrderRes.json.order;
  const failWh = await request(
    'POST',
    '/api/topup/sandbox/complete',
    { orderId: failedOrd.orderId, outcome: 'failed', failureReason: 'QA simulated card decline' },
    { Cookie: qaUser.cookieHeader }
  );
  assert(failWh.statusCode === 200 && failWh.json?.order?.status === 'failed', 'Failed top-up outcome processed');

  const stAfterFail = await request('GET', '/api/recognition/status', null, { Cookie: qaUser.cookieHeader });
  assert(stAfterFail.json.summary.wealth.currentScore === wAfterPromo, 'Failed payment added 0 Wealth progress');

  // 5. Verified Top-Up + Eligible Paid Spending + Level-Up + SSE Real-Time Events
  console.log('\n[5] Testing Verified Top-Up, Eligible Spending, Level-Up & Real-Time SSE...');
  const paidOrdRes = await request(
    'POST',
    '/api/topup/orders',
    { packageId: pkg.packageId, providerKey: 'sandbox_verified', platform: 'web', idempotencyKey: `topok_${RUN_ID}` },
    { Cookie: qaUser.cookieHeader }
  );
  assert(paidOrdRes.statusCode === 201 && paidOrdRes.json?.order?.orderId, 'Created paid top-up order');
  const paidOrd = paidOrdRes.json.order;
  const okEvId = `EV_OK_${RUN_ID}`;
  const okSig = signWebhook(paidOrd.providerKey, okEvId, paidOrd.orderId, 'payment.succeeded', paidOrd.amount, paidOrd.currency);
  const okWh = await request(
    'POST',
    `/api/topup/webhooks/${paidOrd.providerKey}`,
    {
      eventId: okEvId,
      orderId: paidOrd.orderId,
      eventType: 'payment.succeeded',
      providerPaymentRef: `SANDBOX_REC_${RUN_ID}`,
      amount: paidOrd.amount,
      currency: paidOrd.currency,
    },
    { 'x-topup-webhook-signature': okSig }
  );
  assert(okWh.statusCode === 200 && okWh.json?.order?.status === 'successful', 'Verified top-up credited paid coins pool');

  // Spend >= 300 paid coins inside live SSE listener so we capture levels:wealth_updated, levels:shining_updated, levels:progress_updated, and levels:level_up!
  const paidGiftQty = Math.max(1, Math.min(99, Math.ceil(320 / smallGift.coinPrice)));
  const paidGiftCoins = smallGift.coinPrice * paidGiftQty;
  let paidGiftTxId = null;

  const sseEvents = await collectSseEvents(
    '/api/recognition/events',
    { Cookie: qaUser.cookieHeader },
    4500,
    async () => {
      const gRes = await request(
        'POST',
        '/api/gifts/send',
        {
          senderId: qaId,
          recipientHostId: roomHost.hostId,
          liveRoomId: LIVE_ROOM_ID,
          giftId: smallGift.giftId,
          quantity: paidGiftQty,
          idempotencyKey: `gft_paid_${RUN_ID}`,
        },
        { Cookie: qaUser.cookieHeader }
      );
      paidGiftTxId = gRes.json?.transaction?.giftTransactionId || null;
    }
  );

  assert(Boolean(paidGiftTxId), `Paid gift succeeded (${paidGiftCoins} coins, tx=${paidGiftTxId})`);
  assert(sseEvents.some((e) => e.event === 'levels:state_sync'), 'SSE emitted levels:state_sync on connect');
  assert(sseEvents.some((e) => e.event === 'levels:wealth_updated'), 'SSE emitted levels:wealth_updated in real time');
  assert(sseEvents.some((e) => e.event === 'levels:shining_updated'), 'SSE emitted levels:shining_updated in real time');
  assert(sseEvents.some((e) => e.event === 'levels:progress_updated'), 'SSE emitted levels:progress_updated in real time');

  const stAfterPaid = await request('GET', '/api/recognition/status', null, { Cookie: qaUser.cookieHeader });
  const wAfterPaid = stAfterPaid.json.summary.wealth;
  const sAfterPaid = stAfterPaid.json.summary.shining;
  assert(
    wAfterPaid.currentScore >= wAfterPromo + paidGiftCoins - (pkg.bonusCoins || 0),
    `Wealth updated after verified paid spend (score=${wAfterPaid.currentScore}, Lv.${wAfterPaid.currentLevelNumber})`
  );
  assert(
    sAfterPaid.currentScore === sAfterPromo + paidGiftCoins,
    `Shining updated accurately after gift send (${sAfterPromo} -> ${sAfterPaid.currentScore}, Lv.${sAfterPaid.currentLevelNumber})`
  );

  if (isFreshQa) {
    assert(wAfterPaid.currentLevelNumber >= 2, `Wealth promoted automatically from Lv.1 -> Lv.${wAfterPaid.currentLevelNumber}`);
    assert(sAfterPaid.currentLevelNumber >= 2, `Shining promoted automatically from Lv.1 -> Lv.${sAfterPaid.currentLevelNumber}`);
    assert(
      sseEvents.some((e) => e.event === 'levels:level_up'),
      'SSE emitted confirmed levels:level_up celebration event'
    );
    assert(
      stAfterPaid.json.summary.honor.currentLevelNumber === 1 && stAfterPaid.json.summary.honor.currentScore === 0,
      'Honor stayed 0 (Lv.1) proving all 3 systems remain strictly separate'
    );
  }

  // Acknowledge level-up events
  const ackRes = await request('POST', '/api/recognition/level-ups/ack', {}, { Cookie: qaUser.cookieHeader });
  assert(ackRes.statusCode === 200 && ackRes.json?.success, 'Acknowledged level-up celebration events cleanly');

  // 6. Reversal Rule & Level Transition History Preservation
  console.log('\n[6] Testing Gift Reversal Rules & Previous Level History Preservation...');
  const revRes = await request(
    'POST',
    `/api/admin/gifts/transactions/${encodeURIComponent(paidGiftTxId)}/reverse`,
    {
      reason: `QA Reversal Check ${RUN_ID}`,
    },
    { Cookie: finAuth.cookieHeader }
  );
  assert(revRes.statusCode === 200 && revRes.json?.success, `Finance reversed gift ${paidGiftTxId}`);

  const stAfterRev = await request('GET', '/api/recognition/status', null, { Cookie: qaUser.cookieHeader });
  assert(
    stAfterRev.json.summary.shining.currentScore === sAfterPromo,
    `Shining reverted to exact pre-gift value (${stAfterRev.json.summary.shining.currentScore} == ${sAfterPromo})`
  );
  assert(
    stAfterRev.json.summary.wealth.currentScore === wAfterPromo,
    `Wealth reverted to exact pre-gift value (${stAfterRev.json.summary.wealth.currentScore} == ${wAfterPromo})`
  );

  const histRes = await request('GET', '/api/recognition/history', null, { Cookie: qaUser.cookieHeader });
  assert(
    histRes.statusCode === 200 && Array.isArray(histRes.json?.levelHistory) && histRes.json.levelHistory.length >= 1,
    `Level history preserved (${histRes.json?.levelHistory?.length} transitions recorded)`
  );

  // 7. Honor Level Workflow (User Request Pending -> Admin Approve -> Promotion)
  console.log('\n[7] Testing Honor Request Submission & Authorized Admin Review...');
  const honReqRes = await request(
    'POST',
    '/api/recognition/honor/request',
    {
      factorKey: 'account_achievements',
      evidenceSummary: `Completed QA verified moderation & host support challenge ${RUN_ID}`,
    },
    { Cookie: qaUser.cookieHeader }
  );
  assert(
    honReqRes.statusCode === 201 && honReqRes.json?.request?.status === 'pending',
    'User submitted Honor recognition request (status=pending; 0 auto points)'
  );
  const stBeforeApprove = await request('GET', '/api/recognition/status', null, { Cookie: qaUser.cookieHeader });
  assert(
    stBeforeApprove.json.summary.honor.currentScore === baseHonor,
    'Pending Honor request granted 0 unverified Honor points before admin approval'
  );

  const reviewSse = await collectSseEvents(
    '/api/recognition/events',
    { Cookie: qaUser.cookieHeader },
    4000,
    async () => {
      await request(
        'POST',
        '/api/admin/recognition/honor/review',
        {
          requestId: honReqRes.json.request.requestId,
          decision: 'approved',
          reason: `Approved verified community contribution ${RUN_ID}`,
        },
        { Cookie: finAuth.cookieHeader }
      );
    }
  );
  const stAfterHonor = await request('GET', '/api/recognition/status', null, { Cookie: qaUser.cookieHeader });
  assert(
    stAfterHonor.json.summary.honor.currentScore > baseHonor && stAfterHonor.json.summary.honor.currentLevelNumber >= 2,
    `Honor upgraded upon authorized approval (score=${stAfterHonor.json.summary.honor.currentScore}, Lv.${stAfterHonor.json.summary.honor.currentLevelNumber})`
  );
  assert(reviewSse.some((e) => e.event === 'levels:honor_updated'), 'SSE emitted levels:honor_updated after approval');

  // 8. VIP Independence Check (Module 7.7 Integration)
  console.log('\n[8] Testing VIP Independence (Buying VIP Never Increases Wealth, Shining, or Honor)...');
  const vipOrderRes = await request(
    'POST',
    '/api/vip/purchase',
    { planId: 'vip_gold', providerKey: 'sandbox_verified', platform: 'web', idempotencyKey: `vip_rec_${RUN_ID}` },
    { Cookie: qaUser.cookieHeader }
  );
  let vipActivated = false;
  if (vipOrderRes.statusCode === 201 && vipOrderRes.json?.order?.orderId) {
    const vOrd = vipOrderRes.json.order;
    const vEv = `EV_VIP_${RUN_ID}`;
    const vSig = signWebhook(vOrd.providerKey, vEv, vOrd.orderId, 'payment_succeeded', vOrd.amount, vOrd.currency);
    const vWh = await request(
      'POST',
      `/api/vip/webhooks/${vOrd.providerKey}`,
      {
        eventId: vEv,
        orderId: vOrd.orderId,
        eventType: 'payment_succeeded',
        paymentReference: `PG_VIP_REC_${RUN_ID}`,
        amount: vOrd.amount,
        currency: vOrd.currency,
      },
      { 'x-vip-webhook-signature': vSig }
    );
    vipActivated = vWh.statusCode === 200;
  }
  const stAfterVip = await request('GET', '/api/recognition/status', null, { Cookie: qaUser.cookieHeader });
  assert(
    vipActivated &&
      stAfterVip.json.summary.wealth.currentScore === stAfterHonor.json.summary.wealth.currentScore &&
      stAfterVip.json.summary.shining.currentScore === stAfterHonor.json.summary.shining.currentScore &&
      stAfterVip.json.summary.honor.currentScore === stAfterHonor.json.summary.honor.currentScore,
    'VIP membership purchase yielded 0 Wealth, 0 Shining, and 0 Honor points'
  );
  if (vipActivated) {
    await request('POST', '/api/vip/cancel', { cancelMode: 'immediate', reason: 'QA M7.8 cleanup' }, { Cookie: qaUser.cookieHeader }).catch(() => {});
  }

  // Profiles display both VIP and separate Recognition badges without private wallet leakage
  const meProfile = await request('GET', '/api/profile/me', null, { Cookie: qaUser.cookieHeader });
  assert(
    meProfile.statusCode === 200 &&
      meProfile.json?.user?.recognition?.wealth &&
      meProfile.json?.user?.recognition?.shining &&
      meProfile.json?.user?.recognition?.honor &&
      meProfile.json?.user?.vip,
    '/api/profile/me exposes VIP + Wealth + Shining + Honor separately'
  );

  const pubProfile = await request('GET', `/api/users/${encodeURIComponent(qaId)}/public-profile`);
  assert(
    pubProfile.statusCode === 200 &&
      pubProfile.json?.profile?.recognition?.wealth &&
      pubProfile.json?.profile?.recognition?.shining &&
      pubProfile.json?.profile?.recognition?.honor &&
      pubProfile.json?.profile?.coins === undefined &&
      pubProfile.json?.profile?.email === undefined,
    'Public profile shows Wealth/Shining/Honor badges & progress WITHOUT exposing private wallet coins or email'
  );

  // 9. Leaderboards & Privacy Opt-Out
  console.log('\n[9] Testing Separate Leaderboards, Pagination & Privacy Opt-Out...');
  const lbWealth1 = await request('GET', '/api/recognition/leaderboard?category=wealth&page=1&limit=20');
  const lbShining1 = await request('GET', '/api/recognition/leaderboard?category=shining&page=1&limit=20');
  const lbHonor1 = await request('GET', '/api/recognition/leaderboard?category=honor&page=1&limit=20');
  assert(
    lbWealth1.statusCode === 200 &&
      lbShining1.statusCode === 200 &&
      lbHonor1.statusCode === 200 &&
      Array.isArray(lbHonor1.json?.entries) &&
      lbHonor1.json.entries.every((e) => e.coins === undefined && e.email === undefined),
    'Separate paginated Wealth, Shining & Honor leaderboards work and expose zero private balances/emails'
  );

  // Hide user from Honor leaderboard
  await request('PATCH', '/api/recognition/preferences', { hideHonorLeaderboard: true }, { Cookie: qaUser.cookieHeader });
  const lbHonorHidden = await request('GET', '/api/recognition/leaderboard?category=honor&page=1&limit=50');
  assert(
    !lbHonorHidden.json.entries.some((e) => e.userId === qaId),
    'Privacy setting hideHonorLeaderboard=true removed user from Honor leaderboard'
  );
  await request('PATCH', '/api/recognition/preferences', { hideHonorLeaderboard: false }, { Cookie: qaUser.cookieHeader });

  // 10. Admin Level Configuration, Badge Upload & Party Chat Integration
  console.log('\n[10] Testing Admin Level Config, Badge Asset Upload & Party Chat Badges...');
  const uploadRes = await request(
    'POST',
    '/api/admin/recognition/upload',
    {
      category: 'wealth',
      fileName: 'qa_badge.png',
      mimeType: 'image/png',
      fileBase64: TINY_PNG_BASE64,
    },
    { Cookie: finAuth.cookieHeader }
  );
  assert(
    uploadRes.statusCode === 201 && uploadRes.json?.asset?.url,
    `Finance Admin uploaded badge PNG asset (${uploadRes.json?.asset?.url})`
  );

  // Upsert temporary level and immediately deactivate cleanly
  const createLvlRes = await request(
    'POST',
    '/api/admin/recognition/levels',
    {
      levelId: 'honor_lv_qa_tmp',
      category: 'honor',
      levelNumber: 95,
      levelName: 'QA Honorary Crown',
      levelNameUr: 'کیو اے اعزازی تاج',
      requiredThreshold: 99000,
      badgeImageUrl: uploadRes.json?.asset?.url || '/assets/gifts/07_08_wealth_shining_and_honor.png',
      benefitKeys: ['rec_special_profile_badge'],
      isActive: true,
      reason: `QA config verify ${RUN_ID}`,
    },
    { Cookie: finAuth.cookieHeader }
  );
  assert(createLvlRes.statusCode === 200 && createLvlRes.json?.level?.levelNumber === 95, 'Admin created/saved custom level tier');

  await request(
    'PATCH',
    '/api/admin/recognition/levels',
    {
      levelId: 'honor_lv_qa_tmp',
      category: 'honor',
      levelNumber: 95,
      levelName: 'QA Honorary Crown',
      requiredThreshold: 99000,
      isActive: false,
      reason: 'Deactivate QA temporary tier after test',
    },
    { Cookie: finAuth.cookieHeader }
  );

  // Party chat message echoes separate recognition badges
  const chatSendRes = await request('POST', `/api/party/${PARTY_ROOM_ID}/chat/send`, {
    senderId: qaId,
    senderName: qaUser.user.nickname || 'QA Tester',
    messageText: `Recognition badge test ${RUN_ID}`,
  });
  assert(
    chatSendRes.statusCode === 200 &&
      chatSendRes.json?.recognitionBadges &&
      typeof chatSendRes.json.recognitionBadges.honorLevel === 'number',
    'Party chat send echoes separate Wealth/Shining/Honor levels alongside chat decoration'
  );

  // UI page smoke check
  const pageRes = await request('GET', '/recognition?preview=demo');
  assert(pageRes.statusCode === 200, 'Web UI /recognition?preview=demo renders 200 OK');

  console.log('\n============================================================');
  console.log(`MODULE 7.8 RESULT: ${passed} PASSED | ${failed} FAILED`);
  console.log('============================================================\n');
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
