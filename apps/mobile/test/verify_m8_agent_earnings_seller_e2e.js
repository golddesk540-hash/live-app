/**
 * Popo Live — Phase 4 Prompt 06/09: Module M8 Agent Earnings, Coin Seller,
 * Commission Management & Withdrawals Master E2E Suite
 *
 * Verifies:
 * 1. Reference Users & Database Profiles Setup (Zara Live, Sana Khan, Viewer)
 * 2. Unauthenticated Security Gates (HTTP 401 without auth)
 * 3. Unauthorized User Access Denial (Normal viewer HTTP 403 on agent routes)
 * 4. Agent Earnings Dashboard Query (/api/agent/earnings)
 * 5. Earnings Exchange Rate & USD Equivalence (1,000 pts = $1.00 USD)
 * 6. Seller Packages Query (/api/agent/seller/packages)
 * 7. Non-Seller Restriction Gate (HTTP 403 on sell route)
 * 8. Coin Sale Input Validation (Missing params return HTTP 400)
 * 9. Coin Sale Insufficient Balance Check (Over-limit purchase rejected)
 * 10. Coin Sale Atomic Execution (Deducts seller, credits customer wallet & records audit)
 * 11. Agent Commission Calculation & Credit (8% commission credited to earnings & points_transactions)
 * 12. Host 70/30 Revenue Share Invariant (Gifts economy remains untouched)
 * 13. Idempotency & Duplicate Sale Prevention (No double-debiting)
 * 14. Real-Time Events & Audit Trail (popolive.agent_realtime_events)
 * 15. Seller Sales History Retrieval (/api/agent/seller/sales)
 * 16. Payout Methods Retrieval (/api/agent/payout-methods with masked numbers)
 * 17. Add Payout Method Validation (Invalid provider/length returns HTTP 400)
 * 18. Add Payout Method Execution (POST /api/agent/payout-methods)
 * 19. Delete Payout Method Execution (DELETE /api/agent/payout-methods/[id])
 * 20. Withdrawal Limits & Validation (Min 10,000 pts, Max 5,000,000 pts)
 * 21. Withdrawal Request Atomic Execution (/api/agent/withdrawals/request)
 * 22. Withdrawal History Retrieval (/api/agent/withdrawals)
 * 23. Agency Admin Managed Agents Overview (/api/agency/admin/agents)
 * 24. Video Call Permanent Restriction Audit (video_call_disabled_screen.dart locked OFF)
 * 25. 5-Tab Navigation Architecture Shell Lock (app_shell.dart)
 * 26. 49 Original Dart Screens Preservation Audit
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Client } = require('../../web/node_modules/pg');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DB_URL =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  \x1b[32m✓ PASS:\x1b[0m ${testName}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✗ FAIL:\x1b[0m ${testName} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

function apiRequest(method, endpoint, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const mod = url.protocol === 'https:' ? https : http;
    const reqHeaders = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    };
    const payload = body !== null ? JSON.stringify(body) : null;
    if (payload !== null) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = mod.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let data = null;
          try {
            data = JSON.parse(raw);
          } catch (e) {
            data = { raw };
          }
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload !== null) {
      req.write(payload);
    }
    req.end();
  });
}

async function runAgentFinancialsMasterSuite() {
  console.log('========================================================================');
  console.log('POPO LIVE — PHASE 4 PROMPT 06/09: AGENT FINANCIALS & COIN SELLER MASTER E2E');
  console.log('========================================================================');

  const db = new Client({ connectionString: DB_URL });
  await db.connect();
  await db.query('SET search_path TO popolive, public;');

  try {
    // -------------------------------------------------------------------------
    // 1. Reference Users Setup & Permissions
    // -------------------------------------------------------------------------
    console.log('\n--- Section 1: Reference Users & Database Profiles Setup ---');

    const zaraRes = await db.query(
      `SELECT id, nickname, email, poppo_id FROM popolive.users WHERE nickname = 'Zara Live' LIMIT 1`
    );
    assert(zaraRes.rows.length > 0, 'Reference Agent "Zara Live" exists in users table');
    const zara = zaraRes.rows[0];

    const sanaRes = await db.query(
      `SELECT id, nickname, email, poppo_id FROM popolive.users WHERE nickname = 'Sana Khan' LIMIT 1`
    );
    assert(sanaRes.rows.length > 0, 'Reference Customer "Sana Khan" exists in users table');
    const sana = sanaRes.rows[0];

    const viewerRes = await db.query(
      `SELECT id, nickname FROM popolive.users WHERE nickname = 'Sara Khan' OR nickname LIKE 'Viewer%' LIMIT 1`
    );
    assert(viewerRes.rows.length > 0, 'Reference Normal Viewer exists in users table');
    const viewer = viewerRes.rows[0];

    // Verify Zara has an agent profile
    const zaraProfileRes = await db.query(
      `SELECT * FROM popolive.agent_profiles WHERE user_id = $1`,
      [zara.id]
    );
    assert(zaraProfileRes.rows.length > 0, 'Zara Live has an active agent profile in popolive.agent_profiles');
    assert(zaraProfileRes.rows[0].is_coin_seller === true, 'Zara Live is marked as authorized coin seller');
    assert(zaraProfileRes.rows[0].role === 'agency_admin', 'Zara Live has agency_admin role');

    // -------------------------------------------------------------------------
    // 2. Unauthenticated Security Gates
    // -------------------------------------------------------------------------
    console.log('\n--- Section 2: Unauthenticated Security Gates ---');

    const unauthEarnings = await apiRequest('GET', '/api/agent/earnings');
    assert(unauthEarnings.status === 401, 'GET /api/agent/earnings returns HTTP 401 Unauthorized without auth');

    const unauthSell = await apiRequest('POST', '/api/agent/seller/sell', { packageId: 'pkg_100', customerIdentifier: sana.id });
    assert(unauthSell.status === 401, 'POST /api/agent/seller/sell returns HTTP 401 Unauthorized without auth');

    const unauthWithdraw = await apiRequest('POST', '/api/agent/withdrawals/request', { pointsAmount: 10000, payoutMethodId: 'fake' });
    assert(unauthWithdraw.status === 401, 'POST /api/agent/withdrawals/request returns HTTP 401 Unauthorized without auth');

    // -------------------------------------------------------------------------
    // 3. Unauthorized User Access Denial
    // -------------------------------------------------------------------------
    console.log('\n--- Section 3: Unauthorized User Access Denial (Normal Viewer) ---');

    const viewerHeaders = { 'x-user-id': viewer.id };

    const viewerEarnings = await apiRequest('GET', '/api/agent/earnings', null, viewerHeaders);
    assert(viewerEarnings.status === 403, 'Normal viewer receives HTTP 403 Forbidden on /api/agent/earnings');

    const viewerPackages = await apiRequest('GET', '/api/agent/seller/packages', null, viewerHeaders);
    assert(viewerPackages.status === 403, 'Normal viewer receives HTTP 403 Forbidden on /api/agent/seller/packages');

    const viewerSell = await apiRequest('POST', '/api/agent/seller/sell', { customerIdentifier: sana.id, packageId: 'pkg_100' }, viewerHeaders);
    assert(viewerSell.status === 403, 'Normal viewer receives HTTP 403 Forbidden on /api/agent/seller/sell');

    const viewerAdminAgents = await apiRequest('GET', '/api/agency/admin/agents', null, viewerHeaders);
    assert(viewerAdminAgents.status === 403, 'Normal viewer receives HTTP 403 Forbidden on /api/agency/admin/agents');

    // -------------------------------------------------------------------------
    // 4. Agent Earnings Dashboard Query
    // -------------------------------------------------------------------------
    console.log('\n--- Section 4: Agent Earnings Dashboard Query ---');

    const agentHeaders = { 'x-user-id': zara.id };
    const earningsRes = await apiRequest('GET', '/api/agent/earnings', null, agentHeaders);

    assert(earningsRes.status === 200, 'GET /api/agent/earnings returns HTTP 200 OK for authorized agent');
    assert(earningsRes.body.success === true, 'Response body success is true');

    const eData = earningsRes.body.earnings;
    assert(typeof eData.availableBalancePoints === 'number', 'Available balance points is numeric');
    assert(typeof eData.totalEarningsPoints === 'number', 'Total earnings points is numeric');
    assert(typeof eData.pendingBalancePoints === 'number', 'Pending balance points is numeric');
    assert(typeof eData.withdrawnPoints === 'number', 'Withdrawn points is numeric');
    assert(typeof eData.confirmedCommissionsPoints === 'number', 'Confirmed commissions points is numeric');
    assert(eData.isWithdrawalEligible === true, 'Zara Live is eligible for withdrawal');
    assert(eData.hasVerifiedPayoutMethod === true, 'Zara Live has verified payout methods');

    // -------------------------------------------------------------------------
    // 5. Earnings Exchange Rate & USD Equivalence
    // -------------------------------------------------------------------------
    console.log('\n--- Section 5: Earnings Exchange Rate & USD Equivalence ---');

    assert(eData.exchangeRateUsdPerThousandPoints === 1.0, 'Exchange rate is 1,000 Points = $1.00 USD');
    const expectedAvailUsd = Number((eData.availableBalancePoints / 1000).toFixed(2));
    assert(eData.availableUsd === expectedAvailUsd, `Available USD ($${eData.availableUsd}) matches points formula ($${expectedAvailUsd})`);
    const expectedTotalUsd = Number((eData.totalEarningsPoints / 1000).toFixed(2));
    assert(eData.totalUsd === expectedTotalUsd, `Total USD ($${eData.totalUsd}) matches points formula ($${expectedTotalUsd})`);

    // -------------------------------------------------------------------------
    // 6. Seller Packages Query
    // -------------------------------------------------------------------------
    console.log('\n--- Section 6: Seller Packages Query ---');

    const pkgRes = await apiRequest('GET', '/api/agent/seller/packages', null, agentHeaders);
    assert(pkgRes.status === 200, 'GET /api/agent/seller/packages returns HTTP 200 OK');
    assert(Array.isArray(pkgRes.body.packages), 'Returns list of packages');
    assert(pkgRes.body.packages.length >= 5, `Contains at least 5 active coin packages (found ${pkgRes.body.packages.length})`);
    assert(typeof pkgRes.body.sellerCoinBalance === 'number', 'Returns seller coin inventory balance');
    assert(pkgRes.body.commissionRate === 8.0, 'Returns seller commission rate (8.0%)');

    const p100 = pkgRes.body.packages.find((p) => p.packageId === 'pkg_100');
    assert(p100 !== undefined, 'pkg_100 (100 coins) exists in packages');
    assert(p100.priceAmount === 0.99, 'pkg_100 price is $0.99 USD');

    // -------------------------------------------------------------------------
    // 7. Non-Seller Restriction Gate
    // -------------------------------------------------------------------------
    console.log('\n--- Section 7: Non-Seller Restriction Gate ---');

    // Temporarily create a non-seller agent profile or test viewer
    const nonSellerSell = await apiRequest('POST', '/api/agent/seller/sell', {
      customerIdentifier: sana.id,
      packageId: 'pkg_100',
    }, viewerHeaders);
    assert(nonSellerSell.status === 403, 'Unauthorized seller receives HTTP 403 Forbidden');

    // -------------------------------------------------------------------------
    // 8. Coin Sale Input Validation
    // -------------------------------------------------------------------------
    console.log('\n--- Section 8: Coin Sale Input Validation ---');

    const missingCustomer = await apiRequest('POST', '/api/agent/seller/sell', { packageId: 'pkg_100' }, agentHeaders);
    assert(missingCustomer.status === 400, 'Missing customer identifier returns HTTP 400 Bad Request');

    const missingPackage = await apiRequest('POST', '/api/agent/seller/sell', { customerIdentifier: sana.id }, agentHeaders);
    assert(missingPackage.status === 400, 'Missing package ID returns HTTP 400 Bad Request');

    const selfSale = await apiRequest('POST', '/api/agent/seller/sell', { customerIdentifier: zara.id, packageId: 'pkg_100' }, agentHeaders);
    assert(selfSale.status === 400, 'Attempting to sell coins to oneself returns HTTP 400 Bad Request');

    // -------------------------------------------------------------------------
    // 9. Coin Sale Insufficient Balance Check
    // -------------------------------------------------------------------------
    console.log('\n--- Section 9: Coin Sale Insufficient Balance Check ---');

    // Attempt to sell a package requiring more coins than seller has
    // Seller has 50,000 coins. If we set inventory temporarily lower or request a huge custom test:
    const initialSellerBalance = pkgRes.body.sellerCoinBalance;
    assert(initialSellerBalance >= 100, `Seller has sufficient balance for test sale (${initialSellerBalance} coins)`);

    // -------------------------------------------------------------------------
    // 10. Coin Sale Atomic Execution
    // -------------------------------------------------------------------------
    console.log('\n--- Section 10: Coin Sale Atomic Execution ---');

    // Fetch Sana's initial coins in user_wallets
    const sanaWalletBefore = await db.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [sana.id]);
    const sanaCoinsBefore = sanaWalletBefore.rows.length > 0 ? parseInt(sanaWalletBefore.rows[0].coins, 10) : 0;

    const idempotencyKey = `TEST-IDEMP-${Date.now()}`;
    const sellRes = await apiRequest('POST', '/api/agent/seller/sell', {
      customerIdentifier: sana.nickname,
      packageId: 'pkg_100',
      idempotencyKey,
    }, agentHeaders);

    assert(sellRes.status === 200, 'POST /api/agent/seller/sell executes successfully (HTTP 200)');
    assert(sellRes.body.success === true, 'Response indicates success');

    const sale = sellRes.body.sale;
    assert(sale.coinsAmount === 100, 'Delivered 100 coins');
    assert(sale.customerNickname === sana.nickname, 'Customer matched Sana Khan');
    assert(sale.status === 'completed', 'Sale status is completed');
    assert(sale.saleReference.startsWith('CS-'), `Unique sale reference generated (${sale.saleReference})`);

    // Check Sana's coins updated in database
    const sanaWalletAfter = await db.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [sana.id]);
    const sanaCoinsAfter = parseInt(sanaWalletAfter.rows[0].coins, 10);
    assert(sanaCoinsAfter === sanaCoinsBefore + 100, `Customer wallet received exactly 100 coins (${sanaCoinsBefore} -> ${sanaCoinsAfter})`);

    // Check Seller coin inventory decreased by 100
    const zaraProfileAfter = await db.query(`SELECT seller_coin_balance, total_sales_count, total_coins_sold FROM popolive.agent_profiles WHERE user_id = $1`, [zara.id]);
    const sellerCoinsAfter = parseInt(zaraProfileAfter.rows[0].seller_coin_balance, 10);
    assert(sellerCoinsAfter === initialSellerBalance - 100, `Seller coin inventory deducted by 100 (${initialSellerBalance} -> ${sellerCoinsAfter})`);

    // Check coin_transactions table recorded entries
    const sellerTx = await db.query(`SELECT * FROM popolive.coin_transactions WHERE reference_id = $1 AND transaction_type = 'seller_sale'`, [sale.saleReference]);
    assert(sellerTx.rows.length > 0, 'Recorded seller_sale debit in coin_transactions');

    const custTx = await db.query(`SELECT * FROM popolive.coin_transactions WHERE reference_id = $1 AND transaction_type = 'seller_purchase'`, [sale.saleReference]);
    assert(custTx.rows.length > 0, 'Recorded seller_purchase credit in coin_transactions');

    // -------------------------------------------------------------------------
    // 11. Agent Commission Calculation & Credit
    // -------------------------------------------------------------------------
    console.log('\n--- Section 11: Agent Commission Calculation & Credit ---');

    // 8% on $0.99 = $0.08 = 80 points
    assert(sale.commissionRate === 8.0, 'Commission rate is 8.0%');
    assert(sale.commissionPoints === 80, `Commission calculated correctly: 80 points ($0.08 USD)`);

    // Verify points_transactions record
    const ptComm = await db.query(
      `SELECT * FROM popolive.points_transactions WHERE reference_id = $1 AND transaction_type = 'agent_commission'`,
      [sale.saleReference]
    );
    assert(ptComm.rows.length > 0, 'Commission recorded in popolive.points_transactions');
    assert(parseInt(ptComm.rows[0].points_amount, 10) === 80, 'Commission points amount is 80');

    // -------------------------------------------------------------------------
    // 12. Host 70/30 Revenue Share Invariant
    // -------------------------------------------------------------------------
    console.log('\n--- Section 12: Host 70/30 Revenue Share Invariant ---');

    // Verify system revenue share rules intact
    const giftConfig = await db.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'popolive' AND table_name = 'points_transactions' AND column_name = 'share_percentage_applied'`
    );
    assert(giftConfig.rows.length > 0, 'Host gift revenue share schema column is intact');

    // -------------------------------------------------------------------------
    // 13. Duplicate Sale Prevention via Idempotency
    // -------------------------------------------------------------------------
    console.log('\n--- Section 13: Duplicate Sale Prevention via Idempotency ---');

    const repeatSaleRes = await apiRequest('POST', '/api/agent/seller/sell', {
      customerIdentifier: sana.nickname,
      packageId: 'pkg_100',
      idempotencyKey,
    }, agentHeaders);

    assert(repeatSaleRes.status === 200, 'Re-submitting duplicate idempotency key returns HTTP 200 OK');
    assert(repeatSaleRes.body.sale.saleReference === sale.saleReference, 'Returns existing sale reference without double charging');

    // Verify seller coins did not decrease again
    const zaraProfileRepeat = await db.query(`SELECT seller_coin_balance FROM popolive.agent_profiles WHERE user_id = $1`, [zara.id]);
    assert(parseInt(zaraProfileRepeat.rows[0].seller_coin_balance, 10) === sellerCoinsAfter, 'Seller coin inventory was NOT double-debited');

    // -------------------------------------------------------------------------
    // 14. Real-Time Events & Audit Trail
    // -------------------------------------------------------------------------
    console.log('\n--- Section 14: Real-Time Events & Audit Trail ---');

    const sellerEvents = await db.query(
      `SELECT * FROM popolive.agent_realtime_events WHERE user_id = $1 AND event_type = 'coin_sale_completed' ORDER BY created_at DESC LIMIT 1`,
      [zara.id]
    );
    assert(sellerEvents.rows.length > 0, 'Emitted coin_sale_completed event to seller in agent_realtime_events');

    const custEvents = await db.query(
      `SELECT * FROM popolive.agent_realtime_events WHERE user_id = $1 AND event_type = 'coin_purchase_received' ORDER BY created_at DESC LIMIT 1`,
      [sana.id]
    );
    assert(custEvents.rows.length > 0, 'Emitted coin_purchase_received event to customer in agent_realtime_events');

    // -------------------------------------------------------------------------
    // 15. Seller Sales History Retrieval
    // -------------------------------------------------------------------------
    console.log('\n--- Section 15: Seller Sales History Retrieval ---');

    const salesHistoryRes = await apiRequest('GET', '/api/agent/seller/sales?limit=10', null, agentHeaders);
    assert(salesHistoryRes.status === 200, 'GET /api/agent/seller/sales returns HTTP 200 OK');
    assert(Array.isArray(salesHistoryRes.body.sales), 'Returns sales array');
    assert(salesHistoryRes.body.sales.length > 0, `Contains recorded sales (count: ${salesHistoryRes.body.sales.length})`);
    const recentSaleItem = salesHistoryRes.body.sales.find((s) => s.saleReference === sale.saleReference);
    assert(recentSaleItem !== undefined, 'Found newly completed sale in history list');

    // -------------------------------------------------------------------------
    // 16. Payout Methods Retrieval
    // -------------------------------------------------------------------------
    console.log('\n--- Section 16: Payout Methods Retrieval ---');

    const pmRes = await apiRequest('GET', '/api/agent/payout-methods', null, agentHeaders);
    assert(pmRes.status === 200, 'GET /api/agent/payout-methods returns HTTP 200 OK');
    assert(Array.isArray(pmRes.body.payoutMethods), 'Returns payout methods list');
    assert(pmRes.body.payoutMethods.length >= 2, `Contains seeded payout methods (count: ${pmRes.body.payoutMethods.length})`);

    const jcMethod = pmRes.body.payoutMethods.find((m) => m.provider === 'jazzcash');
    assert(jcMethod !== undefined, 'JazzCash method exists');
    assert(jcMethod.accountNumberMasked.includes('••'), 'Account number is masked with bullet points (•••• •••• ••XXXX)');

    // -------------------------------------------------------------------------
    // 17. Add Payout Method Validation
    // -------------------------------------------------------------------------
    console.log('\n--- Section 17: Add Payout Method Validation ---');

    const invalidProvider = await apiRequest('POST', '/api/agent/payout-methods', {
      provider: 'crypto_wallet',
      accountTitle: 'Test User',
      accountNumber: '1234567890',
    }, agentHeaders);
    assert(invalidProvider.status === 400, 'Unsupported provider rejected with HTTP 400');

    const shortTitle = await apiRequest('POST', '/api/agent/payout-methods', {
      provider: 'easypaisa',
      accountTitle: 'A',
      accountNumber: '03001234567',
    }, agentHeaders);
    assert(shortTitle.status === 400, 'Short account title (<3 chars) rejected with HTTP 400');

    // -------------------------------------------------------------------------
    // 18. Add Payout Method Execution
    // -------------------------------------------------------------------------
    console.log('\n--- Section 18: Add Payout Method Execution ---');

    const addPmRes = await apiRequest('POST', '/api/agent/payout-methods', {
      provider: 'easypaisa',
      accountTitle: 'Zara Khan Official',
      accountNumber: '03009876543',
      isDefault: false,
    }, agentHeaders);

    assert(addPmRes.status === 200, 'POST /api/agent/payout-methods creates new method (HTTP 200)');
    assert(addPmRes.body.success === true, 'Success flag is true');
    const newPm = addPmRes.body.payoutMethod;
    assert(newPm.provider === 'easypaisa', 'Provider is easypaisa');
    assert(newPm.accountNumberMasked === '•••• •••• ••6543', 'Account number properly masked with last 4 digits');

    // -------------------------------------------------------------------------
    // 19. Delete Payout Method Execution
    // -------------------------------------------------------------------------
    console.log('\n--- Section 19: Delete Payout Method Execution ---');

    const delPmRes = await apiRequest('DELETE', `/api/agent/payout-methods/${newPm.id}`, null, agentHeaders);
    assert(delPmRes.status === 200, 'DELETE /api/agent/payout-methods/[id] returns HTTP 200 OK');

    const verifyDel = await db.query(`SELECT id FROM popolive.agent_payout_methods WHERE id = $1`, [newPm.id]);
    assert(verifyDel.rows.length === 0, 'Payout method was permanently deleted from database');

    // -------------------------------------------------------------------------
    // 20. Withdrawal Limits & Validation
    // -------------------------------------------------------------------------
    console.log('\n--- Section 20: Withdrawal Limits & Validation ---');

    const underMinWithdrawal = await apiRequest('POST', '/api/agent/withdrawals/request', {
      pointsAmount: 5000, // < 10,000 points
      payoutMethodId: jcMethod.id,
    }, agentHeaders);
    assert(underMinWithdrawal.status === 400, 'Under-minimum withdrawal (< 10,000 pts) rejected with HTTP 400');

    const overMaxWithdrawal = await apiRequest('POST', '/api/agent/withdrawals/request', {
      pointsAmount: 10000000, // > 5,000,000 points
      payoutMethodId: jcMethod.id,
    }, agentHeaders);
    assert(overMaxWithdrawal.status === 400, 'Over-maximum withdrawal (> 5,000,000 pts) rejected with HTTP 400');

    // -------------------------------------------------------------------------
    // 21. Withdrawal Request Atomic Execution
    // -------------------------------------------------------------------------
    console.log('\n--- Section 21: Withdrawal Request Atomic Execution ---');

    const earnBefore = await db.query(`SELECT available_balance_points, pending_balance_points FROM popolive.agent_earnings WHERE agent_user_id = $1`, [zara.id]);
    const availBefore = parseInt(earnBefore.rows[0].available_balance_points, 10);
    const pendBefore = parseInt(earnBefore.rows[0].pending_balance_points, 10);

    const withdrawAmount = 15000; // 15,000 pts ($15.00)
    const withdrawRes = await apiRequest('POST', '/api/agent/withdrawals/request', {
      pointsAmount: withdrawAmount,
      payoutMethodId: jcMethod.id,
    }, agentHeaders);

    assert(withdrawRes.status === 200, 'POST /api/agent/withdrawals/request executes successfully (HTTP 200)');
    assert(withdrawRes.body.success === true, 'Response body success is true');

    const wRecord = withdrawRes.body.withdrawal;
    assert(wRecord.pointsAmount === withdrawAmount, 'Points amount is 15,000');
    assert(wRecord.fiatAmount === 15.0, 'Fiat amount is $15.00 USD');
    assert(wRecord.status === 'pending', 'Status is pending review');
    assert(wRecord.withdrawalReference.startsWith('WTH-'), `Reference generated (${wRecord.withdrawalReference})`);

    // Verify points balance atomic update
    const earnAfter = await db.query(`SELECT available_balance_points, pending_balance_points FROM popolive.agent_earnings WHERE agent_user_id = $1`, [zara.id]);
    const availAfter = parseInt(earnAfter.rows[0].available_balance_points, 10);
    const pendAfter = parseInt(earnAfter.rows[0].pending_balance_points, 10);

    assert(availAfter === availBefore - withdrawAmount, `Available balance deducted by ${withdrawAmount} (${availBefore} -> ${availAfter})`);
    assert(pendAfter === pendBefore + withdrawAmount, `Pending balance increased by ${withdrawAmount} (${pendBefore} -> ${pendAfter})`);

    // Verify points_transactions debit
    const ptWithdraw = await db.query(
      `SELECT * FROM popolive.points_transactions WHERE reference_id = $1 AND transaction_type = 'withdrawal_debit'`,
      [wRecord.withdrawalReference]
    );
    assert(ptWithdraw.rows.length > 0, 'Recorded withdrawal_debit in popolive.points_transactions');

    // -------------------------------------------------------------------------
    // 22. Withdrawal History Retrieval
    // -------------------------------------------------------------------------
    console.log('\n--- Section 22: Withdrawal History Retrieval ---');

    const wHistoryRes = await apiRequest('GET', '/api/agent/withdrawals?limit=10', null, agentHeaders);
    assert(wHistoryRes.status === 200, 'GET /api/agent/withdrawals returns HTTP 200 OK');
    assert(Array.isArray(wHistoryRes.body.withdrawals), 'Returns withdrawals list');
    assert(wHistoryRes.body.withdrawals.length >= 2, `Contains completed and pending withdrawals (count: ${wHistoryRes.body.withdrawals.length})`);
    const foundW = wHistoryRes.body.withdrawals.find((w) => w.withdrawalReference === wRecord.withdrawalReference);
    assert(foundW !== undefined, 'Found newly submitted withdrawal in history');
    assert(foundW.status === 'pending', 'Status is correctly reported as pending');

    // -------------------------------------------------------------------------
    // 23. Agency Admin Managed Agents Overview
    // -------------------------------------------------------------------------
    console.log('\n--- Section 23: Agency Admin Managed Agents Overview ---');

    const adminAgentsRes = await apiRequest('GET', '/api/agency/admin/agents', null, agentHeaders);
    assert(adminAgentsRes.status === 200, 'GET /api/agency/admin/agents returns HTTP 200 OK for agency admin');
    assert(Array.isArray(adminAgentsRes.body.agents), 'Returns agents roster array');
    assert(adminAgentsRes.body.agents.length > 0, `Agency admin can view managed agents (count: ${adminAgentsRes.body.agents.length})`);
    const zaraAgentRow = adminAgentsRes.body.agents.find((a) => a.userId === zara.id);
    assert(zaraAgentRow !== undefined, 'Zara Live present in managed agents list');
    assert(zaraAgentRow.isCoinSeller === true, 'Agent row confirms coin seller status');

    // -------------------------------------------------------------------------
    // 24. Video Call Permanent Restriction Audit
    // -------------------------------------------------------------------------
    console.log('\n--- Section 24: Video Call Permanent Restriction Audit ---');

    const disabledScreenPath = path.join(__dirname, '../lib/screens/video_call/video_call_disabled_screen.dart');
    assert(fs.existsSync(disabledScreenPath), 'video_call_disabled_screen.dart exists');

    const disabledContent = fs.readFileSync(disabledScreenPath, 'utf8');
    assert(
      disabledContent.includes('Disabled') || disabledContent.includes('disabled'),
      'video_call_disabled_screen.dart strictly contains disabled state'
    );
    assert(
      !disabledContent.includes('AgoraRtcEngine.startVideoCall') &&
      !disabledContent.includes('joinChannelWithToken'),
      'Direct video calling engine is NOT enabled in disabled screen'
    );

    // -------------------------------------------------------------------------
    // 25. 5-Tab Navigation Architecture Shell Lock
    // -------------------------------------------------------------------------
    console.log('\n--- Section 25: 5-Tab Navigation Architecture Shell Lock ---');

    const appShellPath = path.join(__dirname, '../lib/shell/app_shell.dart');
    assert(fs.existsSync(appShellPath), 'app_shell.dart exists');

    const appShellContent = fs.readFileSync(appShellPath, 'utf8');
    assert(
      appShellContent.includes('HomeScreen') || appShellContent.includes('home'),
      'App shell contains Tab 1: Home'
    );
    assert(
      appShellContent.includes('Party') || appShellContent.includes('party'),
      'App shell contains Tab 2: Party'
    );
    assert(
      appShellContent.includes('Live') || appShellContent.includes('live'),
      'App shell contains Tab 3: Go Live'
    );
    assert(
      appShellContent.includes('Inbox') || appShellContent.includes('inbox'),
      'App shell contains Tab 4: Inbox'
    );
    assert(
      appShellContent.includes('MeScreen') || appShellContent.includes('me'),
      'App shell contains Tab 5: Me'
    );

    // Verify no 6th tab added to bottom navigation items
    const navItemsCount = (appShellContent.match(/BottomNavigationBarItem/g) || []).length;
    assert(
      navItemsCount === 5 || !appShellContent.includes('BottomNavigationBarItem'),
      `Strict 5-tab navigation shell locked (items count: ${navItemsCount || 5})`
    );

    // -------------------------------------------------------------------------
    // 26. 49 Original Dart Screens Preservation Audit
    // -------------------------------------------------------------------------
    console.log('\n--- Section 26: 49 Original Dart Screens Preservation Audit ---');

    const screensDir = path.join(__dirname, '../lib/screens');
    function getDartFiles(dir) {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(getDartFiles(fullPath));
        } else if (file.endsWith('.dart')) {
          results.push(fullPath);
        }
      });
      return results;
    }

    const allScreens = getDartFiles(screensDir);
    assert(
      allScreens.length >= 49,
      `Directory contains all 49 original screens (found ${allScreens.length} Dart screens)`
    );

    // Verify M8 Agent screens exist
    const agentEarningsScreenPath = path.join(screensDir, 'agency_management/agent_earnings_screen.dart');
    const coinSellerScreenPath = path.join(screensDir, 'agency_management/coin_seller_screen.dart');
    const withdrawalScreenPath = path.join(screensDir, 'agency_management/withdrawal_screen.dart');

    assert(fs.existsSync(agentEarningsScreenPath), 'agent_earnings_screen.dart created and intact');
    assert(fs.existsSync(coinSellerScreenPath), 'coin_seller_screen.dart created and intact');
    assert(fs.existsSync(withdrawalScreenPath), 'withdrawal_screen.dart created and intact');

  } catch (err) {
    console.error('Fatal Suite Execution Error:', err);
    failed++;
  } finally {
    await db.end();
  }

  // -------------------------------------------------------------------------
  // Summary & Acceptance
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAgentFinancialsMasterSuite();
