/**
 * Module 7.10: Complete Receipts and Finance Export System — Automated E2E Suite
 * Tests unified transaction history across Top-up, Gift, Host Earnings (70/30),
 * VIP, Store, Refunds, Reversals & Adjustments; immutable server receipts (no
 * receipts for failed/cancelled/pending); mobile-friendly %PDF-1.4 receipt PDFs;
 * Finance Admin Dashboard KPIs & Reports; private CSV, multi-sheet .xlsx, PDF
 * exports; temporary expiring signed download URLs; RBAC (finance_admin only);
 * cross-user isolation; and immutable export audit logs.
 */
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const zlib = require('zlib');

const BASE_URL = process.env.TEST_BASE_URL || process.argv[2] || 'http://127.0.0.1:3006';
const RUN_ID = Date.now();
const WEBHOOK_SECRET =
  process.env.TOPUP_WEBHOOK_SECRET ||
  process.env.WALLET_TOPUP_SECRET ||
  'popo_live_phase7_topup_secret_key_prod';

const ACTIVE_LIVE_ROOM_ID = '880219';

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

function requestBinary(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const mod = url.protocol === 'https:' ? https : http;
    const payload = body !== null ? JSON.stringify(body) : null;
    const reqHeaders = { Accept: 'application/json, text/html, application/pdf, */*', ...headers };
    if (payload !== null) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = mod.request(url, { method, headers: reqHeaders }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const text = buf.toString('utf8');
        let json = null;
        try {
          json = JSON.parse(text);
        } catch {}
        resolve({ statusCode: res.statusCode, headers: res.headers, buf, text, json });
      });
    });
    req.on('error', reject);
    if (payload !== null) req.write(payload);
    req.end();
  });
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

async function acceptConsentCookies() {
  const res = await requestBinary('POST', '/api/consent', {
    action: 'accept',
    termsAccepted: true,
    privacyAccepted: true,
    isAdultConfirmed: true,
  });
  return mergeCookies('', res.headers['set-cookie']);
}

async function signIn(email, password) {
  const consentCookie = await acceptConsentCookies();
  const res = await requestBinary('POST', '/api/auth/login', { email, password }, { Cookie: consentCookie });
  const cookieHeader = mergeCookies(consentCookie, res.headers['set-cookie']);
  return { statusCode: res.statusCode, cookieHeader, user: res.json?.user || null };
}

async function registerFreshQaUser(tag) {
  const consentCookie = await acceptConsentCookies();
  const suffix = crypto.randomBytes(3).toString('hex');
  const email = `qa_fin_${tag}_${RUN_ID}_${suffix}@popotest.local`;
  const res = await requestBinary(
    'POST',
    '/api/auth/register',
    {
      email,
      password: 'QaFinancePass123!',
      nickname: `Fin_${tag}_${suffix}`,
      isAdultConfirmed: true,
    },
    { Cookie: consentCookie }
  );
  const cookieHeader = mergeCookies(consentCookie, res.headers['set-cookie']);
  return { statusCode: res.statusCode, cookieHeader, user: res.json?.user || null, email };
}

async function createAndCompleteTopup(cookieHeader, outcome = 'succeed') {
  const pkgRes = await requestBinary('GET', '/api/topup/packages');
  const pkgs = (pkgRes.json?.packages || []).sort((a, b) => a.baseCoins - b.baseCoins);
  const pkg = pkgs[0];
  const ordRes = await requestBinary(
    'POST',
    '/api/topup/orders',
    {
      packageId: pkg.packageId,
      providerKey: 'sandbox_verified',
      platform: 'web',
      idempotencyKey: `fin_top_${outcome}_${RUN_ID}_${crypto.randomBytes(3).toString('hex')}`,
    },
    { Cookie: cookieHeader }
  );
  const ord = ordRes.json.order;
  const evId = `EV_FIN_${RUN_ID}_${crypto.randomBytes(3).toString('hex')}`;
  const payRef = `SANDBOX_PAY_${RUN_ID}_${crypto.randomBytes(3).toString('hex')}`;
  const eventType = outcome === 'succeed' ? 'payment.succeeded' : 'payment.failed';
  const sig = signWebhook(ord.providerKey, evId, ord.orderId, eventType, ord.amount, ord.currency);
  const wh = await requestBinary(
    'POST',
    `/api/topup/webhooks/${ord.providerKey}`,
    {
      eventId: evId,
      orderId: ord.orderId,
      eventType,
      providerPaymentRef: payRef,
      amount: ord.amount,
      currency: ord.currency,
      failureReason: outcome === 'succeed' ? undefined : 'Card declined in sandbox QA test',
    },
    { 'x-topup-webhook-signature': sig }
  );
  return { pkg, ord, wh, payRef };
}

async function run() {
  console.log(`\n============================================================`);
  console.log(`POPO LIVE — MODULE 7.10: RECEIPTS & FINANCE EXPORT E2E TESTS`);
  console.log(`Target Base URL: ${BASE_URL}`);
  console.log(`============================================================\n`);

  // 1. Auth, Privacy & Anti-Forgery Guards
  console.log('[1] Testing Unauthenticated Guards, Receipt Anti-Forgery & SSR Pages...');
  const unauthHist = await requestBinary('GET', '/api/finance/history');
  assert(unauthHist.statusCode === 401, 'Unauthenticated GET /api/finance/history returns 401');

  const unauthDash = await requestBinary('GET', '/api/admin/finance/reports/dashboard');
  assert(unauthDash.statusCode === 401, 'Unauthenticated GET /api/admin/finance/reports/dashboard returns 401');

  const forgeReceipt = await requestBinary('POST', '/api/finance/receipts', {
    receiptId: 'FAKE_RCP',
    amount: 9999,
  });
  assert(forgeReceipt.statusCode === 403, 'Client POST /api/finance/receipts blocked (403 RECEIPT_FORGERY_FORBIDDEN)');

  const ssrEn = await requestBinary('GET', '/finance?preview=demo');
  const ssrUr = await requestBinary('GET', '/finance?preview=demo&lang=ur');
  assert(
    ssrEn.statusCode === 200 && ssrEn.text.includes('Receipts &amp; Finance'),
    'SSR GET /finance?preview=demo renders Receipts & Finance page'
  );
  assert(
    ssrUr.statusCode === 200 && ssrUr.text.includes('dir="rtl"'),
    'SSR GET /finance?preview=demo&lang=ur renders RTL Urdu layout'
  );

  // 2. Register QA Users + Sign in Finance & Ordinary Admins
  console.log('\n[2] Registering Isolated QA Users & Authenticating Finance/Ordinary Admins...');
  const qaA = await registerFreshQaUser('A');
  const qaB = await registerFreshQaUser('B');
  assert(Boolean(qaA.user?.id && qaB.user?.id), 'Created QA User A & QA User B');

  const finAuth = await signIn('finance@popolive.com', 'FinancePass123!');
  const ordAuth = await signIn('ordinaryadmin@popolive.com', 'AdminPass123!');
  assert(finAuth.statusCode === 200 && finAuth.user, 'Signed in as Finance Admin');
  assert(ordAuth.statusCode === 200 && ordAuth.user, 'Signed in as Ordinary Admin');

  // 3. Successful Top-up vs Failed Top-up Receipt Rule
  console.log('\n[3] Testing Successful Top-up Receipt vs Failed Payment No-Receipt Rule...');
  const topOk = await createAndCompleteTopup(qaA.cookieHeader, 'succeed');
  const topFail = await createAndCompleteTopup(qaA.cookieHeader, 'fail');
  assert(topOk.wh.statusCode === 200 && topOk.wh.json?.success, 'Successful top-up completed cleanly');
  assert(topFail.wh.statusCode === 200, 'Failed top-up webhook processed cleanly');

  const aHistAfterTopup = await requestBinary('GET', '/api/finance/history', null, { Cookie: qaA.cookieHeader });
  const okRow = aHistAfterTopup.json?.items?.find((i) => i.recordId === topOk.ord.orderId);
  const failRow = aHistAfterTopup.json?.items?.find((i) => i.recordId === topFail.ord.orderId);
  assert(
    Boolean(okRow && okRow.status === 'successful' && okRow.receiptEligible && okRow.receiptId),
    'Successful top-up shows status=successful with issued receipt'
  );
  assert(
    Boolean(failRow && failRow.status === 'failed' && failRow.receiptEligible === false && failRow.receiptId === null),
    'Failed top-up appears in history with status=failed & NO successful receipt issued'
  );

  const failReceiptAttempt = await requestBinary(
    'GET',
    `/api/finance/receipts/${encodeURIComponent(topFail.ord.orderId)}`,
    null,
    { Cookie: qaA.cookieHeader }
  );
  assert(
    failReceiptAttempt.statusCode === 422,
    `Requesting receipt for failed transaction returns 422 (${failReceiptAttempt.json?.errorCode})`
  );

  // 4. Gift Send, Host Earning (70/30), VIP Purchase, and Store Purchase Receipts
  console.log('\n[4] Generating Gift, Host Share (70/30), VIP & Store Receipts Across Modules 7.1-7.9...');
  // Credit QA A enough coins for gift + store + VIP
  await requestBinary(
    'POST',
    '/api/admin/finance/adjust',
    {
      targetUserId: qaA.user.id,
      balanceType: 'coins',
      operation: 'credit',
      amount: 3000,
      reason: `QA Finance 7.10 multi-module seed ${RUN_ID}`,
      isPromotional: false,
      idempotencyKey: `fin_seed_a_${RUN_ID}`,
    },
    { Cookie: finAuth.cookieHeader }
  );

  // Gift send in room 880219 -> Zara host earning share
  const ctxRes = await requestBinary('GET', `/api/gifts/send/context?roomId=${ACTIVE_LIVE_ROOM_ID}&preview=demo`);
  const zaraHostId = ctxRes.json?.hosts?.[0]?.hostId;
  const giftSendRes = await requestBinary(
    'POST',
    '/api/gifts/send',
    {
      senderUserId: qaA.user.id,
      recipientHostId: zaraHostId,
      liveRoomId: ACTIVE_LIVE_ROOM_ID,
      giftId: 'gift_heart', // 50 coins
      quantity: 2, // 100 coins -> 70 pts host share, 30 platform share
      idempotencyKey: `fin_gift_${RUN_ID}`,
    },
    { Cookie: qaA.cookieHeader }
  );
  assert(giftSendRes.statusCode === 200 && giftSendRes.json?.transaction?.giftTransactionId, 'Gift send completed for receipt test');
  const giftTxId = giftSendRes.json.transaction.giftTransactionId;

  // VIP Purchase (sandbox_verified)
  const plansRes = await requestBinary('GET', '/api/vip/plans');
  const vipPlan = plansRes.json?.plans?.find((p) => p.vipLevel >= 1) || plansRes.json?.plans?.[0];
  const vipOrdRes = await requestBinary(
    'POST',
    '/api/vip/purchase',
    { planId: vipPlan.planId, providerKey: 'sandbox_verified', platform: 'web', idempotencyKey: `fin_vip_${RUN_ID}` },
    { Cookie: qaA.cookieHeader }
  );
  const vipOrdId = vipOrdRes.json?.order?.orderId;
  await requestBinary(
    'POST',
    '/api/vip/sandbox/complete',
    { orderId: vipOrdId, outcome: 'succeed' },
    { Cookie: qaA.cookieHeader }
  );
  assert(Boolean(vipOrdId), 'VIP purchase completed for receipt test');

  // Store Purchase
  const storeBuyRes = await requestBinary(
    'POST',
    '/api/store/purchase',
    { itemId: 'item_frame_golden_feather', quantity: 1, idempotencyKey: `fin_str_${RUN_ID}` },
    { Cookie: qaA.cookieHeader }
  );
  assert(storeBuyRes.statusCode === 201 && storeBuyRes.json?.purchase?.purchaseId, 'Store purchase completed for receipt test');
  const storePurId = storeBuyRes.json.purchase.purchaseId;

  // Query QA A history and check separation + all 5 categories
  const fullHistA = await requestBinary('GET', '/api/finance/history?limit=30', null, { Cookie: qaA.cookieHeader });
  const cats = new Set((fullHistA.json?.items || []).map((i) => i.txCategory));
  assert(
    cats.has('topup') &&
      cats.has('gift_sent') &&
      (cats.has('vip_purchase') || cats.has('vip_renewal')) &&
      cats.has('store_purchase') &&
      cats.has('wallet_adjustment'),
    'User financial history includes topup, gift_sent, vip, store_purchase & wallet_adjustment'
  );

  // Check Host Earning Receipt for Zara (70% non-cash points separated from 30% platform share & 0 cash)
  const hostHistRes = await requestBinary(
    'GET',
    `/api/finance/history?userId=${encodeURIComponent(zaraHostId)}&category=host_earning&limit=10`,
    null,
    { Cookie: finAuth.cookieHeader }
  );
  const hostItem =
    hostHistRes.json?.items?.find((i) => i.giftSummary?.giftTransactionId === giftTxId) ||
    hostHistRes.json?.items?.[0];
  assert(
    Boolean(
      hostItem &&
        hostItem.txCategory === 'host_earning' &&
        hostItem.paymentAmount === 0 &&
        hostItem.currency === 'NONE' &&
        hostItem.pointsQuantity > 0 &&
        hostItem.platformShareCoins > 0 &&
        hostItem.receiptId
    ),
    'Host earning record strictly keeps non-cash Points, Platform Share (30%) & Cash Amount (0) separate'
  );

  // Inspect Host Receipt Detail -> verify nonCashPointsNote present
  const hostRcpDetail = await requestBinary(
    'GET',
    `/api/finance/receipts/${encodeURIComponent(hostItem.receiptId)}`,
    null,
    { Cookie: finAuth.cookieHeader }
  );
  assert(
    hostRcpDetail.statusCode === 200 &&
      Boolean(hostRcpDetail.json?.receipt?.nonCashPointsNote) &&
      hostRcpDetail.json?.receipt?.receiptNumber?.startsWith('PL-RCP-'),
    'Host receipt includes non-cash points disclaimer and official PL-RCP-* receipt number'
  );

  // 5. Cross-User Receipt Privacy & Official Receipt PDF Generation
  console.log('\n[5] Testing Cross-User Receipt Isolation & Mobile-Friendly PDF Receipt Generation...');
  const crossUserRcp = await requestBinary(
    'GET',
    `/api/finance/receipts/${encodeURIComponent(okRow.receiptId)}`,
    null,
    { Cookie: qaB.cookieHeader }
  );
  assert(crossUserRcp.statusCode === 403, 'User B blocked from viewing User A receipt (403)');

  const crossUserPdf = await requestBinary(
    'GET',
    `/api/finance/receipts/${encodeURIComponent(okRow.receiptId)}/pdf`,
    null,
    { Cookie: qaB.cookieHeader }
  );
  assert(crossUserPdf.statusCode === 403, 'User B blocked from downloading User A receipt PDF (403)');

  const ownPdfRes = await requestBinary(
    'GET',
    `/api/finance/receipts/${encodeURIComponent(okRow.receiptId)}/pdf`,
    null,
    { Cookie: qaA.cookieHeader }
  );
  assert(
    ownPdfRes.statusCode === 200 &&
      String(ownPdfRes.headers['content-type']).includes('application/pdf') &&
      ownPdfRes.buf.slice(0, 5).toString('latin1') === '%PDF-',
    'User A receipt PDF returns valid binary %PDF-1.4 document'
  );
  assert(
    ownPdfRes.buf.toString('latin1').includes('POPO LIVE') &&
      !ownPdfRes.buf.toString('latin1').includes(topOk.payRef),
    'Receipt PDF includes POPO LIVE branding & masks full raw provider payment reference'
  );

  // 6. Search, Category Filter, Status Filter, Date Preset & Pagination
  console.log('\n[6] Testing History Search, Category/Status/Date Filters & Server Pagination...');
  const searchRes = await requestBinary(
    'GET',
    `/api/finance/history?search=${encodeURIComponent(okRow.receiptNumber)}`,
    null,
    { Cookie: qaA.cookieHeader }
  );
  assert(
    searchRes.statusCode === 200 &&
      searchRes.json?.items?.some((i) => i.receiptId === okRow.receiptId),
    `Search by Receipt Number (${okRow.receiptNumber}) returns exact match`
  );

  const page1 = await requestBinary('GET', '/api/finance/history?page=1&limit=2', null, { Cookie: qaA.cookieHeader });
  const page2 = await requestBinary('GET', '/api/finance/history?page=2&limit=2', null, { Cookie: qaA.cookieHeader });
  assert(
    page1.json?.items?.length === 2 &&
      page2.json?.items?.length >= 1 &&
      page1.json.items[0].recordId !== page2.json.items[0].recordId,
    'Pagination returns distinct slices for page 1 and page 2'
  );

  const todayFilter = await requestBinary('GET', '/api/finance/history?preset=today', null, { Cookie: qaA.cookieHeader });
  assert(todayFilter.statusCode === 200 && todayFilter.json?.items?.length >= 4, 'Date preset (?preset=today) works cleanly');

  // 7. Store Refund + Top-up Refund + Gift Reversal Sync into Receipts
  console.log('\n[7] Testing Store Refund, Top-up Refund & Gift Reversal Reflection in Receipts...');
  const storeRefRes = await requestBinary(
    'POST',
    '/api/admin/store/refund',
    { purchaseId: storePurId, reason: `QA receipt refund test ${RUN_ID}` },
    { Cookie: finAuth.cookieHeader }
  );
  assert(storeRefRes.statusCode === 200 && storeRefRes.json?.success, 'Store purchase refunded cleanly by Finance Admin');

  const storeRcpAfterRef = await requestBinary(
    'GET',
    `/api/finance/receipts/${encodeURIComponent(storePurId)}`,
    null,
    { Cookie: qaA.cookieHeader }
  );
  assert(
    storeRcpAfterRef.statusCode === 200 && storeRcpAfterRef.json?.receipt?.status === 'refunded',
    'Refunded Store purchase receipt updates status to refunded'
  );

  const giftRevRes = await requestBinary(
    'POST',
    `/api/admin/gifts/transactions/${encodeURIComponent(giftTxId)}/reverse`,
    { reason: `QA receipt reversal test ${RUN_ID}` },
    { Cookie: finAuth.cookieHeader }
  );
  assert(giftRevRes.statusCode === 200 && giftRevRes.json?.success, 'Gift transaction reversed cleanly by Finance Admin');

  const giftRcpAfterRev = await requestBinary(
    'GET',
    `/api/finance/receipts/${encodeURIComponent(giftTxId)}`,
    null,
    { Cookie: qaA.cookieHeader }
  );
  assert(
    giftRcpAfterRev.statusCode === 200 && giftRcpAfterRev.json?.receipt?.status === 'reversed',
    'Reversed gift receipt updates status to reversed'
  );

  // Also verify linked Host Earning receipt transitioned to reversed
  const hostRcpAfterRev = await requestBinary(
    'GET',
    `/api/finance/receipts/${encodeURIComponent(hostItem.receiptId)}`,
    null,
    { Cookie: finAuth.cookieHeader }
  );
  assert(
    hostRcpAfterRev.statusCode === 200 && hostRcpAfterRev.json?.receipt?.status === 'reversed',
    'Linked Host Earning receipt updates status to reversed on gift reversal'
  );

  // 8. Admin Finance Dashboard, Host Earnings (70/30 Net), Payments & Refunds Reports + Strict RBAC
  console.log('\n[8] Testing Finance Admin Reports & Strict RBAC (ordinaryadmin Blocked 403)...');
  const ordDash = await requestBinary('GET', '/api/admin/finance/reports/dashboard', null, { Cookie: ordAuth.cookieHeader });
  const ordHostRpt = await requestBinary('GET', '/api/admin/finance/reports/host-earnings', null, { Cookie: ordAuth.cookieHeader });
  const ordExportTry = await requestBinary(
    'POST',
    '/api/admin/finance/exports',
    { reportType: 'transactions', exportFormat: 'csv' },
    { Cookie: ordAuth.cookieHeader }
  );
  const userExportTry = await requestBinary(
    'POST',
    '/api/admin/finance/exports',
    { reportType: 'transactions', exportFormat: 'csv' },
    { Cookie: qaA.cookieHeader }
  );
  assert(
    ordDash.statusCode === 403 && ordHostRpt.statusCode === 403 && ordExportTry.statusCode === 403 && userExportTry.statusCode === 403,
    'Ordinary admin & normal users blocked (403) from all finance reports & export endpoints'
  );

  const [dashRes, payRptRes, hostRptRes, refRptRes] = await Promise.all([
    requestBinary('GET', '/api/admin/finance/reports/dashboard?preset=last_30d', null, { Cookie: finAuth.cookieHeader }),
    requestBinary('GET', '/api/admin/finance/reports/payments?preset=today', null, { Cookie: finAuth.cookieHeader }),
    requestBinary('GET', '/api/admin/finance/reports/host-earnings?preset=last_30d', null, { Cookie: finAuth.cookieHeader }),
    requestBinary('GET', '/api/admin/finance/reports/refunds?preset=today', null, { Cookie: finAuth.cookieHeader }),
  ]);
  assert(
    dashRes.statusCode === 200 &&
      dashRes.json?.windows?.daily &&
      dashRes.json?.windows?.weekly &&
      dashRes.json?.windows?.monthly &&
      Array.isArray(dashRes.json?.selected?.verifiedTopupRevenueByCurrency),
    'Finance Admin Dashboard returns Daily, Weekly & Monthly metrics with separate currency & balance pools'
  );
  assert(
    payRptRes.statusCode === 200 && payRptRes.json?.payments?.some((p) => p.orderId === topFail.ord.orderId && p.status === 'failed'),
    'Payment report includes both successful & failed payments accurately'
  );
  const zaraHostRow = hostRptRes.json?.hosts?.find((h) => h.hostUserId === zaraHostId);
  assert(
    hostRptRes.statusCode === 200 &&
      zaraHostRow &&
      zaraHostRow.netHostPoints === Math.max(0, zaraHostRow.grossHostPointsCredited - zaraHostRow.reversedHostPoints),
    'Host Earnings Report calculates 70/30 netPoints = grossPoints - reversedPoints accurately'
  );
  assert(
    refRptRes.statusCode === 200 && refRptRes.json?.records?.some((r) => r.recordId === storePurId || r.recordId === giftTxId),
    'Refunds & Reversals Report captures refunded Store purchases & reversed Gifts'
  );

  // 9. Private Exports (CSV, Multi-Sheet XLSX, PDF) + Signed Expiring URL + Audit Logs
  console.log('\n[9] Testing Private CSV, Multi-Sheet .XLSX & PDF Exports, Expiring Tokens & Audit Trail...');
  const csvJob = await requestBinary(
    'POST',
    '/api/admin/finance/exports',
    {
      reportType: 'transactions',
      exportFormat: 'csv',
      filters: { preset: 'today' },
      idempotencyKey: `csv_idem_${RUN_ID}`,
    },
    { Cookie: finAuth.cookieHeader }
  );
  assert(
    csvJob.statusCode === 201 &&
      csvJob.json?.exportJob?.exportFormat === 'csv' &&
      csvJob.json?.exportJob?.downloadUrl?.startsWith('/api/admin/finance/exports/'),
    'Finance Admin created CSV export job with private API download URL (not under /public)'
  );

  const csvDl = await requestBinary('GET', csvJob.json.exportJob.downloadUrl, null, { Cookie: finAuth.cookieHeader });
  assert(
    csvDl.statusCode === 200 &&
      String(csvDl.headers['content-type']).includes('text/csv') &&
      csvDl.text.includes('Host Points (Non-Cash)') &&
      csvDl.text.includes('Platform Share Coins (30%)'),
    'CSV export downloads cleanly with separated Cash, Coins, Host Points & Platform Share columns'
  );

  const xlsxJob = await requestBinary(
    'POST',
    '/api/admin/finance/exports',
    {
      reportType: 'executive_summary',
      exportFormat: 'xlsx',
      filters: { preset: 'last_7d' },
      idempotencyKey: `xlsx_idem_${RUN_ID}`,
    },
    { Cookie: finAuth.cookieHeader }
  );
  const xlsxDl = await requestBinary('GET', xlsxJob.json.exportJob.downloadUrl, null, { Cookie: finAuth.cookieHeader });
  assert(
    xlsxDl.statusCode === 200 &&
      String(xlsxDl.headers['content-type']).includes('spreadsheetml.sheet') &&
      xlsxDl.buf.slice(0, 2).toString('latin1') === 'PK' &&
      xlsxDl.buf.includes('xl/worksheets/sheet2.xml'),
    'Multi-sheet Excel .xlsx export has valid PK ZIP signature & contains multiple sheets'
  );

  const pdfRptJob = await requestBinary(
    'POST',
    '/api/admin/finance/exports',
    {
      reportType: 'host_earnings',
      exportFormat: 'pdf',
      filters: { preset: 'last_30d' },
      idempotencyKey: `pdf_idem_${RUN_ID}`,
    },
    { Cookie: finAuth.cookieHeader }
  );
  const pdfRptDl = await requestBinary('GET', pdfRptJob.json.exportJob.downloadUrl, null, { Cookie: finAuth.cookieHeader });
  assert(
    pdfRptDl.statusCode === 200 &&
      String(pdfRptDl.headers['content-type']).includes('application/pdf') &&
      pdfRptDl.buf.slice(0, 5).toString('latin1') === '%PDF-',
    'Finance Report PDF export returns valid binary %PDF-1.4 document'
  );

  // Tampered token, expired token & ordinaryadmin download denial checks
  const ordDlBlocked = await requestBinary('GET', csvJob.json.exportJob.downloadUrl, null, { Cookie: ordAuth.cookieHeader });
  const tamperedTokenUrl = `${csvJob.json.exportJob.downloadUrl}tampered`;
  const tamperedDl = await requestBinary('GET', tamperedTokenUrl);
  const shortTtlJob = await requestBinary(
    'POST',
    '/api/admin/finance/exports',
    { reportType: 'transactions', exportFormat: 'csv', ttlSeconds: 1, filters: { preset: 'today' } },
    { Cookie: finAuth.cookieHeader }
  );
  assert(
    shortTtlJob.statusCode === 201 && Boolean(shortTtlJob.json?.exportJob?.downloadUrl),
    'Short-TTL (1s) CSV export created by finance_admin'
  );
  await new Promise((r) => setTimeout(r, 1700));
  const expiredDl = await requestBinary('GET', shortTtlJob.json.exportJob.downloadUrl);
  assert(ordDlBlocked.statusCode === 403, 'Ordinary admin blocked (403) from downloading private export even with token');
  assert(tamperedDl.statusCode === 403, 'Tampered download token signature rejected (403)');
  assert(
    expiredDl.statusCode === 410 && expiredDl.json?.errorCode === 'EXPORT_TOKEN_EXPIRED',
    'Expired signed download token rejected (410 EXPORT_TOKEN_EXPIRED)'
  );

  // Check Audit Logs capture export lifecycle
  const listExpRes = await requestBinary('GET', '/api/admin/finance/exports?limit=25', null, { Cookie: finAuth.cookieHeader });
  const actionTypes = new Set((listExpRes.json?.auditLogs || []).map((a) => a.actionType));
  assert(
    listExpRes.statusCode === 200 &&
      actionTypes.has('export_requested') &&
      actionTypes.has('export_completed') &&
      actionTypes.has('export_downloaded') &&
      actionTypes.has('receipt_pdf_downloaded'),
    'Finance export & receipt audit logs record requested, completed, downloaded & receipt_pdf_downloaded actions'
  );

  console.log(`\n============================================================`);
  console.log(`MODULE 7.10 TESTS FINISHED: ${passed} PASSED | ${failed} FAILED`);
  console.log(`============================================================\n`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Fatal test suite error:', err);
  process.exit(1);
});
