/**
 * Module 7.9: Complete Virtual Store System — Automated E2E Verification Suite
 * Validates configurable Store categories, catalog search/filter/pagination,
 * item preview (0 coin deduction), anti-tamper & RBAC guards, atomic idempotent
 * coin purchase, insufficient balance protection, Wealth paid-spend sync,
 * VIP-only & Wealth/Shining/Honor gating (kept strictly independent),
 * My Inventory + Equip/Unequip/Replace/Slot compatibility, live Profile/Chat/Entrance
 * restoration, server-time expiry auto-unequip, usage limits, Admin catalog &
 * upload + refund/revocation, real-time SSE events, and SSR bilingual Store pages.
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

const PARTY_ROOM_ID = '880219';
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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

function collectSseEvents(path, headers = {}, waitMs = 3000, onConnectAction = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const mod = url.protocol === 'https:' ? https : http;
    const events = [];
    let buffer = '';
    let settled = false;

    const req = mod.request(url, { method: 'GET', headers: { Accept: 'text/event-stream', ...headers } }, (res) => {
      if (onConnectAction) {
        setTimeout(() => {
          onConnectAction().catch(() => {});
        }, 350);
      }

      res.on('data', (chunk) => {
        buffer += chunk.toString('utf8');
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';
        for (const blk of blocks) {
          if (!blk.trim() || blk.startsWith(':')) continue;
          let ev = 'message';
          let dataStr = '';
          for (const line of blk.split('\n')) {
            if (line.startsWith('event:')) ev = line.slice(6).trim();
            else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
          }
          if (dataStr) {
            try {
              events.push({ event: ev, data: JSON.parse(dataStr) });
            } catch {
              events.push({ event: ev, data: dataStr });
            }
          }
        }
      });

      setTimeout(() => {
        if (!settled) {
          settled = true;
          try {
            req.destroy();
          } catch {}
          resolve(events);
        }
      }, waitMs);
    });

    req.on('error', () => {
      if (!settled) {
        settled = true;
        resolve(events);
      }
    });
    req.end();
  });
}

async function acceptConsentCookies() {
  const res = await request('POST', '/api/consent', {
    action: 'accept',
    termsAccepted: true,
    privacyAccepted: true,
    isAdultConfirmed: true,
  });
  return mergeCookies('', res.headers['set-cookie']);
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
  const res = await request('POST', '/api/auth/login', { email, password }, { Cookie: consentCookie });
  const cookieHeader = mergeCookies(consentCookie, res.headers['set-cookie']);
  return { statusCode: res.statusCode, cookieHeader, user: res.json?.user || null };
}

async function registerFreshQaUser(tag) {
  const consentCookie = await acceptConsentCookies();
  const suffix = crypto.randomBytes(3).toString('hex');
  const email = `qa_store_${tag}_${RUN_ID}_${suffix}@popotest.local`;
  const res = await request(
    'POST',
    '/api/auth/register',
    {
      email,
      password: 'QaStorePass123!',
      nickname: `Store_${tag}_${suffix}`,
      isAdultConfirmed: true,
    },
    { Cookie: consentCookie }
  );
  const cookieHeader = mergeCookies(consentCookie, res.headers['set-cookie']);
  return { statusCode: res.statusCode, cookieHeader, user: res.json?.user || null, email };
}

async function topUpPaidCoins(cookieHeader, minTargetPackageCoins = 1000) {
  const pkgRes = await request('GET', '/api/topup/packages');
  const pkgs = (pkgRes.json?.packages || []).sort((a, b) => a.baseCoins - b.baseCoins);
  const pkg = pkgs.find((p) => p.baseCoins >= minTargetPackageCoins) || pkgs[pkgs.length - 1];
  const ordRes = await request(
    'POST',
    '/api/topup/orders',
    {
      packageId: pkg.packageId,
      providerKey: 'sandbox_verified',
      platform: 'web',
      idempotencyKey: `store_topup_${RUN_ID}_${crypto.randomBytes(3).toString('hex')}`,
    },
    { Cookie: cookieHeader }
  );
  const ord = ordRes.json.order;
  const evId = `EV_STR_${RUN_ID}_${crypto.randomBytes(3).toString('hex')}`;
  const payRef = `SANDBOX_${RUN_ID}_${crypto.randomBytes(3).toString('hex')}`;
  const sig = signWebhook(ord.providerKey, evId, ord.orderId, 'payment.succeeded', ord.amount, ord.currency);
  const wh = await request(
    'POST',
    `/api/topup/webhooks/${ord.providerKey}`,
    {
      eventId: evId,
      orderId: ord.orderId,
      eventType: 'payment.succeeded',
      providerPaymentRef: payRef,
      amount: ord.amount,
      currency: ord.currency,
    },
    { 'x-topup-webhook-signature': sig }
  );
  return { pkg, ord, wh };
}

async function run() {
  console.log(`\n============================================================`);
  console.log(`POPO LIVE — MODULE 7.9: VIRTUAL STORE SYSTEM E2E TESTS`);
  console.log(`Target Base URL: ${BASE_URL}`);
  console.log(`============================================================\n`);

  // 1. Configurable Categories & Catalog Search/Filter/Preview (No Deduction)
  console.log('[1] Testing Configurable Store Categories, Search, Filters & Non-Deducting Preview...');
  const catRes = await request('GET', '/api/store/categories');
  assert(catRes.statusCode === 200 && catRes.json?.success, 'GET /api/store/categories returns 200');
  const categories = catRes.json?.categories || [];
  assert(categories.length >= 10, `Loaded >= 10 configurable categories from backend (got ${categories.length})`);

  const requiredSlugs = [
    'profile-frames',
    'name-decorations',
    'chat-decorations',
    'entrance-effects',
    'special-badges',
    'themes',
    'virtual-accessories',
    'exclusive-items',
    'seasonal-items',
    'special-event-items',
  ];
  assert(
    requiredSlugs.every((s) => categories.some((c) => c.slug === s)),
    'All 10 required configurable categories are active and approved in DB'
  );

  const catalogRes = await request('GET', '/api/store/catalog?preview=demo');
  assert(
    catalogRes.statusCode === 200 &&
      Array.isArray(catalogRes.json?.items) &&
      catalogRes.json.items.length >= 12 &&
      catalogRes.json.featuredItems?.length >= 3 &&
      catalogRes.json.popularItems?.length >= 3 &&
      catalogRes.json.newArrivals?.length >= 3,
    'Store catalog returns items, featuredItems, popularItems & newArrivals'
  );

  const searchRes = await request('GET', '/api/store/catalog?search=Bubble');
  assert(
    searchRes.statusCode === 200 && searchRes.json?.items?.some((i) => i.itemId === 'item_bubble_neon_spark'),
    'Store item search filters correctly (?search=Bubble)'
  );

  const catFilterRes = await request('GET', '/api/store/catalog?categoryId=profile_frames');
  assert(
    catFilterRes.statusCode === 200 &&
      catFilterRes.json?.items?.length >= 1 &&
      catFilterRes.json.items.every((i) => i.categoryId === 'profile_frames'),
    'Store category filter works cleanly (?categoryId=profile_frames)'
  );

  const demoBalBeforePreview = catalogRes.json?.wallet?.coins;
  const detailRes = await request('GET', '/api/store/items/item_frame_golden_feather?preview=demo');
  assert(
    detailRes.statusCode === 200 &&
      detailRes.json?.item?.coinPrice === 300 &&
      detailRes.json?.wallet?.coins === demoBalBeforePreview,
    'Item detail preview loads backend price & deducts 0 coins'
  );

  // 2. Auth, Direct Inventory & Anti-Tamper Security Guards
  console.log('\n[2] Testing Authentication, Anti-Tamper & Direct Inventory Guards...');
  const unauthBuy = await request('POST', '/api/store/purchase', { itemId: 'item_frame_golden_feather' });
  assert(unauthBuy.statusCode === 401, 'Unauthenticated POST /api/store/purchase blocked (401)');

  const unauthInv = await request('GET', '/api/store/inventory');
  assert(unauthInv.statusCode === 401, 'Unauthenticated GET /api/store/inventory blocked (401)');

  const qaA = await registerFreshQaUser('A');
  const qaB = await registerFreshQaUser('B');
  assert(Boolean(qaA.user?.id && qaB.user?.id), 'Created 2 isolated synthetic QA test accounts');

  const directInvAttempt = await request(
    'POST',
    '/api/store/inventory',
    { itemId: 'item_frame_golden_feather' },
    { Cookie: qaA.cookieHeader }
  );
  assert(directInvAttempt.statusCode === 403, 'Users cannot directly create inventory items (403)');

  const tamperPrice = await request(
    'POST',
    '/api/store/purchase',
    { itemId: 'item_frame_golden_feather', coinPrice: 1 },
    { Cookie: qaA.cookieHeader }
  );
  assert(tamperPrice.statusCode === 403, 'Client-submitted price override rejected (403 STORE_TAMPERING_FORBIDDEN)');

  const tamperVip = await request(
    'POST',
    '/api/store/purchase',
    { itemId: 'item_exclusive_vip_dragon', vipLevel: 99, wealthLevel: 50 },
    { Cookie: qaA.cookieHeader }
  );
  assert(tamperVip.statusCode === 403, 'Client VIP/Wealth override rejected (403)');

  // 3. Insufficient Balance Failure Protection (0 Coins Deducted, 0 Inventory Created)
  console.log('\n[3] Testing Insufficient Balance Purchase Failure Guard...');
  const balA0Res = await request('GET', '/api/wallet/balance', null, { Cookie: qaA.cookieHeader });
  const coinsA0 = balA0Res.json.wallet.coins;
  const failBuyRes = await request(
    'POST',
    '/api/store/purchase',
    { itemId: 'item_frame_golden_feather', idempotencyKey: `fail_insuff_${RUN_ID}` },
    { Cookie: qaA.cookieHeader }
  );
  assert(
    failBuyRes.statusCode === 402 &&
      failBuyRes.json?.success === false &&
      failBuyRes.json?.code === 'INSUFFICIENT_COINS' &&
      failBuyRes.json?.inventory === null,
    'Purchase with insufficient coins fails cleanly (402 INSUFFICIENT_COINS, no inventory)'
  );
  const balA1Res = await request('GET', '/api/wallet/balance', null, { Cookie: qaA.cookieHeader });
  assert(balA1Res.json.wallet.coins === coinsA0, `Failed purchase deducted 0 coins (remains ${coinsA0})`);

  // 4. Paid Top-Up + Atomic Purchase + Idempotency Duplicate Prevention + Wealth Integration
  console.log('\n[4] Testing Atomic Purchase, Duplicate Idempotency & Module 7.8 Wealth Sync...');
  const finAuth = await signIn('finance@popolive.com', 'FinancePass123!');
  const ordAuth = await signIn('ordinaryadmin@popolive.com', 'AdminPass123!');
  assert(finAuth.statusCode === 200 && ordAuth.statusCode === 200, 'Signed in Finance Admin & Ordinary Admin');

  const topA = await topUpPaidCoins(qaA.cookieHeader, 1000);
  assert(topA.wh.statusCode === 200 && topA.wh.json?.order?.status === 'successful', 'QA User A topped up verified paid coins');
  // Ensure plenty of coins for multi-item tests
  await request(
    'POST',
    '/api/admin/finance/adjust',
    {
      targetUserId: qaA.user.id,
      balanceType: 'coins',
      operation: 'credit',
      amount: 3000,
      reason: `QA Store balance seed ${RUN_ID}`,
      isPromotional: false,
      idempotencyKey: `store_seed_a_${RUN_ID}`,
    },
    { Cookie: finAuth.cookieHeader }
  );

  const wBeforeBuy = (await request('GET', '/api/wallet/balance', null, { Cookie: qaA.cookieHeader })).json.wallet.coins;
  const recBeforeBuy = (await request('GET', '/api/recognition/status', null, { Cookie: qaA.cookieHeader })).json.summary.wealth.currentScore;

  const idempKey1 = `buy_frame_${RUN_ID}`;
  const buy1 = await request(
    'POST',
    '/api/store/purchase',
    { itemId: 'item_frame_golden_feather', quantity: 1, idempotencyKey: idempKey1 },
    { Cookie: qaA.cookieHeader }
  );
  assert(
    buy1.statusCode === 201 &&
      buy1.json?.success === true &&
      buy1.json?.purchase?.totalCoins === 300 &&
      buy1.json?.inventory?.itemId === 'item_frame_golden_feather' &&
      buy1.json?.wallet?.coins === wBeforeBuy - 300,
    'Purchase succeeded atomically, deducted exact backend price (300 Coins) & created inventory'
  );
  const frameInvId = buy1.json.inventory.inventoryId;
  const framePurchaseId = buy1.json.purchase.purchaseId;

  const recAfterBuy = (await request('GET', '/api/recognition/status', null, { Cookie: qaA.cookieHeader })).json.summary.wealth.currentScore;
  assert(recAfterBuy >= recBeforeBuy + 300, `Store coin spend incremented Wealth score cleanly (${recBeforeBuy} -> ${recAfterBuy})`);

  // Duplicate idempotency replay
  const buy1Replay = await request(
    'POST',
    '/api/store/purchase',
    { itemId: 'item_frame_golden_feather', quantity: 1, idempotencyKey: idempKey1 },
    { Cookie: qaA.cookieHeader }
  );
  assert(
    buy1Replay.statusCode === 200 &&
      buy1Replay.json?.deduplicated === true &&
      buy1Replay.json?.wallet?.coins === wBeforeBuy - 300 &&
      buy1Replay.json?.inventory?.inventoryId === frameInvId,
    'Duplicate purchase request deduplicated cleanly (0 extra coins deducted, same inventory ID)'
  );

  // 5. VIP Store Integration (Non-VIP Blocked -> Active VIP Unlocks Purchase)
  console.log('\n[5] Testing VIP-Only Item Gating & Integration with Module 7.7...');
  const nonVipBuy = await request(
    'POST',
    '/api/store/purchase',
    { itemId: 'item_exclusive_vip_dragon', idempotencyKey: `vip_fail_${RUN_ID}` },
    { Cookie: qaA.cookieHeader }
  );
  assert(
    nonVipBuy.statusCode === 403 && nonVipBuy.json?.code === 'STORE_VIP_REQUIRED',
    'Non-VIP user blocked from purchasing VIP-only store item (403 STORE_VIP_REQUIRED)'
  );

  const plansRes = await request('GET', '/api/vip/plans');
  const vipPlan = plansRes.json?.plans?.find((p) => p.vipLevel >= 1) || plansRes.json?.plans?.[0];
  const vipOrdRes = await request(
    'POST',
    '/api/vip/purchase',
    { planId: vipPlan.planId, providerKey: 'sandbox_verified', platform: 'web', idempotencyKey: `vip_str_${RUN_ID}` },
    { Cookie: qaA.cookieHeader }
  );
  const vipOrd = vipOrdRes.json?.order;
  await request(
    'POST',
    '/api/vip/sandbox/complete',
    { orderId: vipOrd.orderId, outcome: 'succeed' },
    { Cookie: qaA.cookieHeader }
  );

  const vipBuy = await request(
    'POST',
    '/api/store/purchase',
    { itemId: 'item_exclusive_vip_dragon', idempotencyKey: `vip_ok_${RUN_ID}` },
    { Cookie: qaA.cookieHeader }
  );
  assert(
    vipBuy.statusCode === 201 && vipBuy.json?.success === true,
    'Active VIP user can purchase VIP-only Store item cleanly'
  );

  // 6. Strict Independence: Wealth / Shining / Honor Store Restrictions
  console.log('\n[6] Testing Wealth, Shining & Honor Strict Independent Store Restrictions...');
  const topB = await topUpPaidCoins(qaB.cookieHeader, 1000);
  assert(topB.wh.statusCode === 200, 'QA User B topped up paid coins');
  await request(
    'POST',
    '/api/admin/finance/adjust',
    {
      targetUserId: qaB.user.id,
      balanceType: 'coins',
      operation: 'credit',
      amount: 4000,
      reason: `QA Store B seed ${RUN_ID}`,
      isPromotional: false,
      idempotencyKey: `store_seed_b_${RUN_ID}`,
    },
    { Cookie: finAuth.cookieHeader }
  );

  const bWealthBlock = await request(
    'POST',
    '/api/store/purchase',
    { itemId: 'item_exclusive_wealth_sovereign', idempotencyKey: `b_w0_${RUN_ID}` },
    { Cookie: qaB.cookieHeader }
  );
  const bShiningBlock = await request(
    'POST',
    '/api/store/purchase',
    { itemId: 'item_exclusive_shining_aurora', idempotencyKey: `b_s0_${RUN_ID}` },
    { Cookie: qaB.cookieHeader }
  );
  const bHonorBlock = await request(
    'POST',
    '/api/store/purchase',
    { itemId: 'item_exclusive_honor_crest', idempotencyKey: `b_h0_${RUN_ID}` },
    { Cookie: qaB.cookieHeader }
  );
  assert(bWealthBlock.statusCode === 403 && bWealthBlock.json?.code === 'STORE_WEALTH_LEVEL_REQUIRED', 'Low Wealth blocked (403)');
  assert(bShiningBlock.statusCode === 403 && bShiningBlock.json?.code === 'STORE_SHINING_LEVEL_REQUIRED', 'Low Shining blocked (403)');
  assert(bHonorBlock.statusCode === 403 && bHonorBlock.json?.code === 'STORE_HONOR_LEVEL_REQUIRED', 'Low Honor blocked (403)');

  // Spend paid coins in Store (Theme 1000 + Frame 300 + Star 400 + Mic 350 = 2050) -> raises Wealth Lv only, NOT Shining/Honor!
  for (const [idx, itId] of ['item_theme_starry_stage', 'item_frame_golden_feather', 'item_badge_founder_star', 'item_acc_diamond_mic'].entries()) {
    await request(
      'POST',
      '/api/store/purchase',
      { itemId: itId, idempotencyKey: `b_spend_${idx}_${RUN_ID}` },
      { Cookie: qaB.cookieHeader }
    );
  }
  const bRecAfterSpend = (await request('GET', '/api/recognition/status', null, { Cookie: qaB.cookieHeader })).json.summary;
  assert(
    bRecAfterSpend.wealth.currentLevelNumber >= 3 && bRecAfterSpend.shining.currentLevelNumber === 1,
    `User B reached Wealth Lv.${bRecAfterSpend.wealth.currentLevelNumber} while Shining remains Lv.${bRecAfterSpend.shining.currentLevelNumber}`
  );

  const bWealthOk = await request(
    'POST',
    '/api/store/purchase',
    { itemId: 'item_exclusive_wealth_sovereign', idempotencyKey: `b_w1_${RUN_ID}` },
    { Cookie: qaB.cookieHeader }
  );
  const bStillShiningBlocked = await request(
    'POST',
    '/api/store/purchase',
    { itemId: 'item_exclusive_shining_aurora', idempotencyKey: `b_s1_${RUN_ID}` },
    { Cookie: qaB.cookieHeader }
  );
  const bStillHonorBlocked = await request(
    'POST',
    '/api/store/purchase',
    { itemId: 'item_exclusive_honor_crest', idempotencyKey: `b_h1_${RUN_ID}` },
    { Cookie: qaB.cookieHeader }
  );
  assert(bWealthOk.statusCode === 201, 'Wealth Lv.3+ unlocked Wealth Sovereign Store item');
  assert(bStillShiningBlocked.statusCode === 403, 'Shining Store item remains blocked when only Wealth is high');
  assert(bStillHonorBlocked.statusCode === 403, 'Honor Store item remains blocked when only Wealth is high');

  // Grant Honor Lv.2 directly via Admin -> Honor item unlocks while Shining still stays blocked!
  await request(
    'POST',
    '/api/admin/recognition/honor/award',
    { targetUserId: qaB.user.id, factorKey: 'official_platform_recognition', points: 450, reason: `QA Store Honor test ${RUN_ID}` },
    { Cookie: finAuth.cookieHeader }
  );
  const bHonorOk = await request(
    'POST',
    '/api/store/purchase',
    { itemId: 'item_exclusive_honor_crest', idempotencyKey: `b_hon_${RUN_ID}` },
    { Cookie: qaB.cookieHeader }
  );
  const bStillShiningOnly = await request(
    'POST',
    '/api/store/purchase',
    { itemId: 'item_exclusive_shining_aurora', idempotencyKey: `b_s2_${RUN_ID}` },
    { Cookie: qaB.cookieHeader }
  );
  assert(bHonorOk.statusCode === 201, 'Honor Lv.2+ unlocked Honor Champion Crest Store item');
  assert(bStillShiningOnly.statusCode === 403, 'Shining item remains strictly separated until Shining gifts are sent');

  // 7. Equipment, Slot Compatibility, Cross-User Ownership, Profile/Chat/Entrance Sync & Reconnect
  console.log('\n[7] Testing Item Equipment, Slot Replacement, Cross-Module Sync & Reconnection...');
  // User B buys Name Deco, Chat Bubble, Entrance Effect for full loadout verification
  const buyBubble = await request('POST', '/api/store/purchase', { itemId: 'item_bubble_neon_spark', autoEquip: true, idempotencyKey: `b_bub_${RUN_ID}` }, { Cookie: qaB.cookieHeader });
  const buyName = await request('POST', '/api/store/purchase', { itemId: 'item_name_neon_crimson', autoEquip: true, idempotencyKey: `b_nam_${RUN_ID}` }, { Cookie: qaB.cookieHeader });
  const buyEnter = await request('POST', '/api/store/purchase', { itemId: 'item_enter_royal_supercar', autoEquip: true, idempotencyKey: `b_ent_${RUN_ID}` }, { Cookie: qaB.cookieHeader });
  assert(buyBubble.statusCode === 201 && buyName.statusCode === 201 && buyEnter.statusCode === 201, 'User B bought Chat Bubble, Name Deco & Entrance Effect');

  const invBRes = await request('GET', '/api/store/inventory', null, { Cookie: qaB.cookieHeader });
  const invBFrame1 = invBRes.json.items.find((i) => i.itemId === 'item_frame_golden_feather');
  const invBFrame2 = invBRes.json.items.find((i) => i.itemId === 'item_exclusive_wealth_sovereign');
  const invBStarBadge = invBRes.json.items.find((i) => i.itemId === 'item_badge_founder_star');

  // Incompatible slot check
  const badSlotEquip = await request(
    'POST',
    '/api/store/equip',
    { inventoryId: invBFrame1.inventoryId, expectedSlot: 'chat_decoration' },
    { Cookie: qaB.cookieHeader }
  );
  assert(badSlotEquip.statusCode === 400 && badSlotEquip.json?.code === 'STORE_INCOMPATIBLE_SLOT', 'Incompatible equipment slot rejected cleanly (400)');

  // Cross-user ownership theft blocked
  const hijackEquip = await request(
    'POST',
    '/api/store/equip',
    { inventoryId: frameInvId },
    { Cookie: qaB.cookieHeader }
  );
  assert(hijackEquip.statusCode === 403 && hijackEquip.json?.code === 'STORE_OWNERSHIP_FORBIDDEN', 'Equipping another user inventory item rejected (403)');

  // Equip Frame 1 then replace with Frame 2
  const eq1 = await request('POST', '/api/store/equip', { inventoryId: invBFrame1.inventoryId }, { Cookie: qaB.cookieHeader });
  assert(eq1.statusCode === 200 && eq1.json?.equipped?.profileFrame?.itemId === 'item_frame_golden_feather', 'Equipped Profile Frame 1');

  const eq2 = await request('POST', '/api/store/equip', { inventoryId: invBFrame2.inventoryId }, { Cookie: qaB.cookieHeader });
  assert(eq2.statusCode === 200 && eq2.json?.equipped?.profileFrame?.itemId === 'item_exclusive_wealth_sovereign', 'Replacing same slot equips Frame 2 automatically');

  const invAfterReplace = await request('GET', '/api/store/inventory', null, { Cookie: qaB.cookieHeader });
  const f1Row = invAfterReplace.json.items.find((i) => i.inventoryId === invBFrame1.inventoryId);
  const f2Row = invAfterReplace.json.items.find((i) => i.inventoryId === invBFrame2.inventoryId);
  assert(f1Row.isEquipped === false && f2Row.isEquipped === true, 'Old frame unequipped cleanly when slot replaced');

  // Verify live Profile, Public Profile, Chat Messages & Entrance Eligibility
  const profMe = await request('GET', '/api/profile/me', null, { Cookie: qaB.cookieHeader });
  assert(
    profMe.statusCode === 200 &&
      profMe.json?.user?.storeEquipment?.profileFrame?.itemId === 'item_exclusive_wealth_sovereign' &&
      profMe.json?.user?.storeEquipment?.chatDecoration?.itemId === 'item_bubble_neon_spark' &&
      profMe.json?.user?.storeEquipment?.nameDecoration?.itemId === 'item_name_neon_crimson',
    'GET /api/profile/me & reconnection loadout restores equipped frame, name & chat bubble'
  );

  const pubProf = await request('GET', `/api/users/${encodeURIComponent(qaB.user.id)}/public-profile`);
  assert(
    pubProf.statusCode === 200 &&
      pubProf.json?.profile?.storeEquipment?.profileFrame?.itemId === 'item_exclusive_wealth_sovereign',
    'GET /api/users/:id/public-profile shows equipped Store frame'
  );

  const patchTamperStore = await request(
    'PATCH',
    '/api/profile/me',
    { equippedFrame: 'fake_hack_frame' },
    { Cookie: qaB.cookieHeader }
  );
  assert(patchTamperStore.statusCode === 403, 'PATCH /api/profile/me rejects manual equippedFrame spoofing (403)');

  // Chat integration
  const chatSend = await request(
    'POST',
    `/api/party/${PARTY_ROOM_ID}/chat/send`,
    {
      senderId: qaB.user.id,
      senderName: qaB.user.nickname,
      messageText: `Store test message ${RUN_ID}`,
    },
    { Cookie: qaB.cookieHeader }
  );
  assert(
    chatSend.statusCode === 200 &&
      chatSend.json?.storeEquipment?.chatDecoration?.itemId === 'item_bubble_neon_spark',
    'Party chat send reflects active equipped Store Chat Bubble'
  );

  // Entrance integration
  const entRes = await request(
    'POST',
    '/api/animations/entrance/trigger',
    { hostUserId: qaB.user.id, entranceType: 'standard', roomId: PARTY_ROOM_ID, idempotencyKey: `ent_str_${RUN_ID}` },
    { Cookie: qaB.cookieHeader }
  );
  assert(
    entRes.statusCode === 201 &&
      entRes.json?.eligibility?.equippedStoreEntrance?.itemId === 'item_enter_royal_supercar',
    'Host entrance reflects active equipped Store Entrance Effect'
  );

  // Unequip check
  const eqBadge = await request('POST', '/api/store/equip', { inventoryId: invBStarBadge.inventoryId }, { Cookie: qaB.cookieHeader });
  assert(eqBadge.statusCode === 200 && eqBadge.json?.equipped?.specialBadge?.itemId === 'item_badge_founder_star', 'Equipped special badge');
  const uneqBadge = await request('POST', '/api/store/unequip', { inventoryId: invBStarBadge.inventoryId }, { Cookie: qaB.cookieHeader });
  assert(uneqBadge.statusCode === 200 && uneqBadge.json?.equipped?.specialBadge === null, 'Unequipped special badge cleanly');

  // 8. Usage Limit Per User (Max 1 per user on item_event_pk_wing_crest)
  console.log('\n[8] Testing Usage Limitation Enforcement (Max 1 per User)...');
  const lim1 = await request(
    'POST',
    '/api/store/purchase',
    { itemId: 'item_event_pk_wing_crest', idempotencyKey: `lim1_${RUN_ID}` },
    { Cookie: qaA.cookieHeader }
  );
  const lim2 = await request(
    'POST',
    '/api/store/purchase',
    { itemId: 'item_event_pk_wing_crest', idempotencyKey: `lim2_${RUN_ID}` },
    { Cookie: qaA.cookieHeader }
  );
  assert(lim1.statusCode === 201, 'First purchase within usage limit (1/1) succeeded');
  assert(lim2.statusCode === 409 && lim2.json?.code === 'STORE_USAGE_LIMIT_REACHED', 'Second purchase exceeding usage_limit_per_user rejected (409)');

  // 9. Admin Management, Asset Upload, Short Expiry Auto-Removal & Refund/Revocation
  console.log('\n[9] Testing Admin RBAC, Upload, Server-Time Expiry Auto-Unequip & Refund...');
  const ordStoreMut = await request(
    'POST',
    '/api/admin/store/items',
    { categoryId: 'themes', name: 'Hack Item', thumbnailUrl: '/assets/store/theme_starry_stage.png', coinPrice: 1, durationType: 'permanent' },
    { Cookie: ordAuth.cookieHeader }
  );
  assert(ordStoreMut.statusCode === 403, 'Ordinary admin blocked from modifying Store items (403)');

  const upRes = await request(
    'POST',
    '/api/admin/store/upload',
    { fileBase64: TINY_PNG_BASE64, fileName: `qa_store_${RUN_ID}.png`, mimeType: 'image/png', kind: 'thumbnail' },
    { Cookie: finAuth.cookieHeader }
  );
  assert(upRes.statusCode === 200 && Boolean(upRes.json?.asset?.url), 'Admin uploaded store item asset cleanly');

  const tempItemId = `item_qa_flash_${RUN_ID}`;
  const createTemp = await request(
    'POST',
    '/api/admin/store/items',
    {
      itemId: tempItemId,
      categoryId: 'virtual_accessories',
      name: `QA 1s Accessory ${RUN_ID}`,
      thumbnailUrl: upRes.json.asset.url,
      coinPrice: 50,
      durationType: 'limited_duration',
      durationValue: 1,
      durationUnit: 'seconds',
      equipSlot: 'accessory',
    },
    { Cookie: finAuth.cookieHeader }
  );
  assert(createTemp.statusCode === 200 && createTemp.json?.item?.itemId === tempItemId, 'Admin created temporary 1s store item');

  const buyTemp = await request(
    'POST',
    '/api/store/purchase',
    { itemId: tempItemId, autoEquip: true, idempotencyKey: `tmp_${RUN_ID}` },
    { Cookie: qaA.cookieHeader }
  );
  assert(buyTemp.statusCode === 201 && buyTemp.json?.inventory?.inventoryId, 'User A bought & auto-equipped 1s temporary accessory');
  const tempInvId = buyTemp.json.inventory.inventoryId;

  await sleep(1800);
  const invAExp = await request('GET', '/api/store/inventory', null, { Cookie: qaA.cookieHeader });
  const expRow = invAExp.json.items.find((i) => i.inventoryId === tempInvId);
  assert(
    expRow && expRow.status === 'expired' && expRow.isEquipped === false && invAExp.json.equipped.accessory === null,
    'Expired store item auto-transitions to status=expired & is removed from active equipment'
  );
  assert(
    invAExp.json.purchaseHistory.some((p) => p.purchaseId === buyTemp.json.purchase.purchaseId),
    'Expired item preserves permanent financial purchase history'
  );

  const reEquipExpired = await request(
    'POST',
    '/api/store/equip',
    { inventoryId: tempInvId },
    { Cookie: qaA.cookieHeader }
  );
  assert(reEquipExpired.statusCode === 400 && reEquipExpired.json?.code === 'STORE_ITEM_EXPIRED', 'Re-equipping expired item rejected cleanly (400)');

  // Disable temp item & confirm unavailable
  const disRes = await request(
    'PATCH',
    '/api/admin/store/items',
    { itemId: tempItemId, isActive: false, reason: 'QA cleanup disable' },
    { Cookie: finAuth.cookieHeader }
  );
  assert(disRes.statusCode === 200 && disRes.json?.item?.isActive === false, 'Admin disabled store item');

  const buyDisabled = await request(
    'POST',
    '/api/store/purchase',
    { itemId: tempItemId, idempotencyKey: `dis_${RUN_ID}` },
    { Cookie: qaA.cookieHeader }
  );
  assert(buyDisabled.statusCode === 400 && buyDisabled.json?.code === 'STORE_ITEM_UNAVAILABLE', 'Purchasing disabled store item blocked (400)');

  // Audited Store Purchase Refund & Inventory Revocation
  const aBalPreRefund = (await request('GET', '/api/wallet/balance', null, { Cookie: qaA.cookieHeader })).json.wallet.coins;
  const refundRes = await request(
    'POST',
    '/api/admin/store/refund',
    { purchaseId: framePurchaseId, reason: `QA store refund verification ${RUN_ID}` },
    { Cookie: finAuth.cookieHeader }
  );
  assert(
    refundRes.statusCode === 200 &&
      refundRes.json?.refundedCoins === 300 &&
      refundRes.json?.purchase?.status === 'refunded',
    'Admin refunded Store purchase (+300 coins)'
  );
  const aBalPostRefund = (await request('GET', '/api/wallet/balance', null, { Cookie: qaA.cookieHeader })).json.wallet.coins;
  assert(aBalPostRefund === aBalPreRefund + 300, 'Wallet balance restored accurately on Store refund');

  // 10. Real-Time SSE Events & UI Pages Smoke Checks
  console.log('\n[10] Testing Real-Time Store SSE Events & SSR Store Pages...');
  const sseList = await collectSseEvents(
    '/api/store/events',
    { Cookie: qaA.cookieHeader },
    3500,
    async () => {
      await request(
        'POST',
        '/api/store/purchase',
        { itemId: 'item_bubble_neon_spark', autoEquip: true, idempotencyKey: `sse_pur_${RUN_ID}` },
        { Cookie: qaA.cookieHeader }
      );
    }
  );
  assert(sseList.some((e) => e.event === 'store:state_sync'), 'SSE emitted store:state_sync on connect');
  assert(sseList.some((e) => e.event === 'store:purchase_completed'), 'SSE emitted store:purchase_completed on purchase');
  assert(sseList.some((e) => e.event === 'store:inventory_updated'), 'SSE emitted store:inventory_updated on purchase');

  for (const pagePath of ['/store?preview=demo', '/store?lang=ur&preview=demo', '/store?tab=inventory&preview=demo']) {
    const pg = await request('GET', pagePath);
    assert(pg.statusCode === 200 && pg.text.length > 500, `SSR page ${pagePath} rendered 200 OK`);
  }

  console.log(`\n============================================================`);
  console.log(`SUMMARY (Module 7.9): ${passed} PASSED | ${failed} FAILED`);
  console.log(`============================================================\n`);

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Fatal Store E2E failure:', err);
  process.exit(1);
});
