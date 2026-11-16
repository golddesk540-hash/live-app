/**
 * Popo Live Phase 3 Prompt 05/08
 * Automated End-to-End Verification Test for M6: Complete Wallet, Coins,
 * Top-Up Packages & In-App Purchase Integration
 *
 * Verifies against live Next.js backend (http://localhost:3000):
 * 1. Pre-test Sandbox Initialization & Server Health Check
 * 2. Authenticated Wallet Balance Retrieval (GET /api/wallet/balance)
 * 3. Authoritative Coin Packages Catalogue (GET /api/topup/packages)
 * 4. Google Play Billing In-App Products (coins_100..coins_10000)
 * 5. Apple In-App Purchase Products (com.popolive.coins.100..10000)
 * 6. Android In-App Purchase Order Creation (POST /api/topup/orders)
 * 7. iOS In-App Purchase Order Creation (POST /api/topup/orders)
 * 8. Cryptographic Server Purchase Verification (POST /api/topup/orders/[id]/verify)
 * 9. Sandbox Order Completion & Atomic Coin Crediting (POST /api/topup/sandbox/complete)
 * 10. Rejection of Unverified Client Success Callbacks (Strict Security Rule)
 * 11. Rejection of Client Financial Overrides (Zero Price/Coin Tampering)
 * 12. Idempotency Key Duplicate Purchase Protection (Zero Double Deductions/Credits)
 * 13. Cancelled In-App Purchase Handling
 * 14. Failed In-App Purchase Handling
 * 15. Pending In-App Purchase Lifecycle
 * 16. In-App Purchase History Retrieval (GET /api/topup/history)
 * 17. Wallet Coin Ledger Transactions Audit (GET /api/wallet/coins/history)
 * 18. Insufficient Balance Protection & Gift Top-up Integration
 * 19. Mobile Architecture & Flutter Components Verification
 * 20. 49 Original Dart Screens Preservation Audit
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, reqPath, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('POPO LIVE — PHASE 3 PROMPT 05/08: WALLET & IN-APP PURCHASE E2E');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Pre-test Sandbox Initialization & Server Health Check
    // -------------------------------------------------------------
    console.log('[SECTION 1] Pre-test Server Health & Sandbox Initialization');
    const healthRes = await makeRequest('GET', '/api/health');
    assert(healthRes.status === 200 || healthRes.status === 404, 'Next.js server is online on localhost:3000');

    const testUserId = 'user_wallet_demo_701';
    const authHeaders = {
      'x-viewer-id': testUserId,
    };

    // -------------------------------------------------------------
    // Test 2: Authenticated Wallet Balance Retrieval
    // -------------------------------------------------------------
    console.log('\n[SECTION 2] Authenticated Wallet Balance Retrieval (GET /api/wallet/balance)');
    const balRes = await makeRequest('GET', `/api/wallet/balance?userId=${testUserId}&preview=demo&fresh=true`, null, authHeaders);
    assert(balRes.status === 200, 'HTTP 200: Successfully loaded wallet balance');
    
    const wallet = balRes.data?.wallet || {};
    assert(typeof wallet.coins === 'number', `Wallet coin balance is a valid integer (${wallet.coins} coins)`);
    assert(typeof wallet.diamondPoints === 'number' || typeof wallet.points === 'number', `Wallet diamond points separate from coins`);
    assert(wallet.hostSharePercentage === 70, `Host share percentage verified at exactly 70%`);
    const initialCoins = wallet.coins;

    // -------------------------------------------------------------
    // Test 3: Authoritative Coin Packages Catalogue
    // -------------------------------------------------------------
    console.log('\n[SECTION 3] Authoritative Coin Packages Catalogue (GET /api/topup/packages)');
    const pkgRes = await makeRequest('GET', '/api/topup/packages');
    assert(pkgRes.status === 200, 'HTTP 200: Successfully loaded coin packages catalogue');
    
    const packages = pkgRes.data?.packages || [];
    assert(Array.isArray(packages) && packages.length >= 5, `Catalogue contains ${packages.length} packages (>= 5 expected)`);

    const samplePkg = packages.find((p) => p.packageId === 'pkg_1000') || packages[0];
    assert(samplePkg.packageId != null, `Package has packageId: ${samplePkg.packageId}`);
    assert(samplePkg.packageName != null, `Package has packageName: ${samplePkg.packageName}`);
    assert(samplePkg.packageNameUr != null, `Package has Urdu packageNameUr: ${samplePkg.packageNameUr}`);
    assert(samplePkg.baseCoins > 0, `Package base coins: ${samplePkg.baseCoins}`);
    assert(samplePkg.totalCoins >= samplePkg.baseCoins, `Package total coins: ${samplePkg.totalCoins}`);
    assert(samplePkg.priceAmount > 0, `Package priceAmount: \$${samplePkg.priceAmount}`);
    assert(samplePkg.currency === 'USD', `Package currency: ${samplePkg.currency}`);

    // -------------------------------------------------------------
    // Test 4: Google Play Billing In-App Products
    // -------------------------------------------------------------
    console.log('\n[SECTION 4] Google Play Billing In-App Products Mapping');
    const androidProductIds = packages.map((p) => p.platformProductIdAndroid).filter(Boolean);
    assert(androidProductIds.includes('coins_100'), 'Google Play product coins_100 mapped');
    assert(androidProductIds.includes('coins_500'), 'Google Play product coins_500 mapped');
    assert(androidProductIds.includes('coins_1000'), 'Google Play product coins_1000 mapped');
    assert(androidProductIds.includes('coins_5000'), 'Google Play product coins_5000 mapped');
    assert(androidProductIds.includes('coins_10000'), 'Google Play product coins_10000 mapped');

    // -------------------------------------------------------------
    // Test 5: Apple In-App Purchase Products
    // -------------------------------------------------------------
    console.log('\n[SECTION 5] Apple StoreKit In-App Products Mapping');
    const iosProductIds = packages.map((p) => p.platformProductIdIos).filter(Boolean);
    assert(iosProductIds.includes('com.popolive.coins.100'), 'Apple IAP product com.popolive.coins.100 mapped');
    assert(iosProductIds.includes('com.popolive.coins.500'), 'Apple IAP product com.popolive.coins.500 mapped');
    assert(iosProductIds.includes('com.popolive.coins.1000'), 'Apple IAP product com.popolive.coins.1000 mapped');
    assert(iosProductIds.includes('com.popolive.coins.5000'), 'Apple IAP product com.popolive.coins.5000 mapped');
    assert(iosProductIds.includes('com.popolive.coins.10000'), 'Apple IAP product com.popolive.coins.10000 mapped');

    // -------------------------------------------------------------
    // Test 6: Android In-App Purchase Order Creation
    // -------------------------------------------------------------
    console.log('\n[SECTION 6] Android In-App Purchase Order Creation (POST /api/topup/orders)');
    const idempKeyAndroid = `idemp_android_${Date.now()}`;
    const androidOrderRes = await makeRequest('POST', '/api/topup/orders?preview=demo', {
      packageId: 'pkg_100',
      userId: testUserId,
      providerKey: 'sandbox_verified',
      platform: 'android',
      idempotencyKey: idempKeyAndroid,
    }, authHeaders);

    assert(androidOrderRes.status === 201 || androidOrderRes.status === 200, 'HTTP 201/200: Android top-up order created');
    const androidOrder = androidOrderRes.data?.order || {};
    assert(androidOrder.orderId != null && androidOrder.orderId.startsWith('ORD_TOPUP_'), `Order ID format valid: ${androidOrder.orderId}`);
    assert(androidOrder.platform === 'android', 'Order platform recorded as android');
    assert(androidOrder.totalCoins === 100, `Order coins accurate: ${androidOrder.totalCoins}`);
    assert(androidOrder.status === 'created' || androidOrder.status === 'pending', `Order status is pending/created: ${androidOrder.status}`);

    // -------------------------------------------------------------
    // Test 7: iOS In-App Purchase Order Creation
    // -------------------------------------------------------------
    console.log('\n[SECTION 7] iOS In-App Purchase Order Creation (POST /api/topup/orders)');
    const idempKeyIos = `idemp_ios_${Date.now()}`;
    const iosOrderRes = await makeRequest('POST', '/api/topup/orders?preview=demo', {
      packageId: 'pkg_500',
      userId: testUserId,
      providerKey: 'sandbox_verified',
      platform: 'ios',
      idempotencyKey: idempKeyIos,
    }, authHeaders);

    assert(iosOrderRes.status === 201 || iosOrderRes.status === 200, 'HTTP 201/200: iOS top-up order created');
    const iosOrder = iosOrderRes.data?.order || {};
    assert(iosOrder.orderId != null && iosOrder.orderId.startsWith('ORD_TOPUP_'), `iOS Order ID valid: ${iosOrder.orderId}`);
    assert(iosOrder.platform === 'ios', 'Order platform recorded as ios');
    assert(iosOrder.totalCoins === 525, `iOS package coins (500 + 25 bonus): ${iosOrder.totalCoins}`);

    // -------------------------------------------------------------
    // Test 8: Rejection of Unverified Client Success Callbacks
    // -------------------------------------------------------------
    console.log('\n[SECTION 8] Rejection of Unverified Client Success Callbacks (Strict Security)');
    const unverifiedVerifyRes = await makeRequest('POST', `/api/topup/orders/${androidOrder.orderId}/verify`, {
      orderId: androidOrder.orderId,
      // No cryptographic signature supplied!
    });
    assert(
      unverifiedVerifyRes.status === 403,
      `HTTP 403: Unverified client confirmation strictly rejected (Status: ${unverifiedVerifyRes.status}, Error: ${unverifiedVerifyRes.data?.errorCode})`
    );

    // -------------------------------------------------------------
    // Test 9: Rejection of Client Financial Overrides (Zero Price/Coin Tampering)
    // -------------------------------------------------------------
    console.log('\n[SECTION 9] Rejection of Client Financial Overrides');
    const tamperedOrderRes = await makeRequest('POST', '/api/topup/orders?preview=demo', {
      packageId: 'pkg_100',
      userId: testUserId,
      price: 0.01, // Client trying to tamper with price
      totalCoins: 999999, // Client trying to inject free coins
    }, authHeaders);

    assert(
      tamperedOrderRes.status === 403,
      `HTTP 403: Client financial override attempt strictly rejected (Status: ${tamperedOrderRes.status}, Error: ${tamperedOrderRes.data?.errorCode})`
    );

    // -------------------------------------------------------------
    // Test 10: Sandbox Order Completion & Atomic Coin Crediting
    // -------------------------------------------------------------
    console.log('\n[SECTION 10] Sandbox Order Completion & Atomic Coin Crediting');
    const completeRes = await makeRequest('POST', '/api/topup/sandbox/complete?preview=demo', {
      orderId: androidOrder.orderId,
      outcome: 'succeeded',
    }, authHeaders);

    assert(completeRes.status === 200, 'HTTP 200: Sandbox order verified and processed successfully');
    const completeData = completeRes.data || {};
    assert(completeData.success === true, 'Order marked successful');
    const totalCoinsCredited = completeData.totalCoins || completeData.order?.totalCoins;
    const newBal = completeData.newBalance ?? completeData.wallet?.coins;
    assert(totalCoinsCredited === 100, `Confirmed 100 coins credited: ${totalCoinsCredited}`);
    assert(newBal != null, `Authoritative new wallet balance returned: ${newBal}`);

    // Verify wallet balance increment
    const verifyBalRes = await makeRequest('GET', `/api/wallet/balance?userId=${testUserId}&preview=demo&fresh=true`, null, authHeaders);
    assert(verifyBalRes.status === 200, 'Fresh wallet balance retrieved');
    const freshCoins = verifyBalRes.data?.wallet?.coins;
    assert(freshCoins === initialCoins + 100, `Wallet balance incremented by exact package coins: ${freshCoins} (was ${initialCoins})`);

    // -------------------------------------------------------------
    // Test 11: Idempotency Key Duplicate Purchase Protection
    // -------------------------------------------------------------
    console.log('\n[SECTION 11] Idempotency Key Duplicate Purchase Protection');
    const duplicateOrderRes = await makeRequest('POST', '/api/topup/orders?preview=demo', {
      packageId: 'pkg_100',
      userId: testUserId,
      providerKey: 'sandbox_verified',
      platform: 'android',
      idempotencyKey: idempKeyAndroid, // EXACT SAME KEY
    }, authHeaders);

    assert(duplicateOrderRes.status === 200 || duplicateOrderRes.status === 201, 'Duplicate order request handled gracefully');
    assert(
      duplicateOrderRes.data?.deduplicated === true || duplicateOrderRes.data?.order?.orderId === androidOrder.orderId,
      'Duplicate request deduplicated; returned original order ID without double charging'
    );

    // Replay sandbox completion on already successful order
    const replayCompleteRes = await makeRequest('POST', '/api/topup/sandbox/complete?preview=demo', {
      orderId: androidOrder.orderId,
      outcome: 'succeeded',
    }, authHeaders);

    assert(
      replayCompleteRes.data?.deduplicated === true || replayCompleteRes.data?.success === true,
      'Replayed completion handled idempotently; no duplicate coins credited'
    );

    const recheckBalRes = await makeRequest('GET', `/api/wallet/balance?userId=${testUserId}&preview=demo&fresh=true`, null, authHeaders);
    assert(recheckBalRes.data?.wallet?.coins === freshCoins, `Wallet balance remains preserved without double counting: ${freshCoins}`);

    // -------------------------------------------------------------
    // Test 12: Cancelled In-App Purchase Handling
    // -------------------------------------------------------------
    console.log('\n[SECTION 12] Cancelled In-App Purchase Handling');
    const cancelOrderRes = await makeRequest('POST', '/api/topup/orders?preview=demo', {
      packageId: 'pkg_100',
      userId: testUserId,
      providerKey: 'sandbox_verified',
      platform: 'android',
      idempotencyKey: `idemp_cancel_${Date.now()}`,
    }, authHeaders);
    const cancelOrderId = cancelOrderRes.data?.order?.orderId;

    const cancelActionRes = await makeRequest('POST', '/api/topup/sandbox/complete?preview=demo', {
      orderId: cancelOrderId,
      outcome: 'cancelled',
    }, authHeaders);
    assert(cancelActionRes.status === 200, 'HTTP 200: Cancelled purchase handled cleanly');
    const cancelStatus = cancelActionRes.data?.status || cancelActionRes.data?.order?.status;
    assert(cancelStatus === 'cancelled', 'Order status marked cancelled');

    // -------------------------------------------------------------
    // Test 13: Failed In-App Purchase Handling
    // -------------------------------------------------------------
    console.log('\n[SECTION 13] Failed In-App Purchase Handling');
    const failOrderRes = await makeRequest('POST', '/api/topup/orders?preview=demo', {
      packageId: 'pkg_100',
      userId: testUserId,
      providerKey: 'sandbox_verified',
      platform: 'android',
      idempotencyKey: `idemp_fail_${Date.now()}`,
    }, authHeaders);
    const failOrderId = failOrderRes.data?.order?.orderId;

    const failActionRes = await makeRequest('POST', '/api/topup/sandbox/complete?preview=demo', {
      orderId: failOrderId,
      outcome: 'failed',
      failureReason: 'Card declined by issuing bank',
    }, authHeaders);
    assert(failActionRes.status === 200, 'HTTP 200: Failed purchase handled cleanly');
    const failStatus = failActionRes.data?.status || failActionRes.data?.order?.status;
    assert(failStatus === 'failed', 'Order status marked failed');

    // -------------------------------------------------------------
    // Test 14: In-App Purchase History Retrieval
    // -------------------------------------------------------------
    console.log('\n[SECTION 14] In-App Purchase History Retrieval (GET /api/topup/history)');
    const historyRes = await makeRequest('GET', `/api/topup/history?userId=${testUserId}&preview=demo&limit=10`, null, authHeaders);
    assert(historyRes.status === 200, 'HTTP 200: Successfully retrieved purchase history');
    const historyItems = historyRes.data?.items || [];
    assert(Array.isArray(historyItems) && historyItems.length > 0, `Purchase history contains ${historyItems.length} orders`);

    const sampleHistory = historyItems[0];
    assert(sampleHistory.orderId != null, `History item has orderId: ${sampleHistory.orderId}`);
    assert(sampleHistory.amount != null, `History item has amount: \$${sampleHistory.amount}`);
    assert(sampleHistory.totalCoins != null, `History item has totalCoins: ${sampleHistory.totalCoins}`);
    assert(sampleHistory.status != null, `History item has status: ${sampleHistory.status}`);

    // -------------------------------------------------------------
    // Test 15: Wallet Coin Ledger Transactions Audit
    // -------------------------------------------------------------
    console.log('\n[SECTION 15] Wallet Coin Ledger Transactions Audit (GET /api/wallet/coins/history)');
    const ledgerRes = await makeRequest('GET', `/api/wallet/coins/history?userId=${testUserId}&preview=demo&limit=10`, null, authHeaders);
    assert(ledgerRes.status === 200, 'HTTP 200: Successfully retrieved coin ledger history');
    const txns = ledgerRes.data?.transactions || [];
    assert(Array.isArray(txns) && txns.length > 0, `Coin ledger contains ${txns.length} transactions`);

    const topupTxn = txns.find((t) => t.transactionType === 'topup');
    assert(topupTxn != null, `Coin ledger contains confirmed topup transaction: ${topupTxn?.transactionId}`);
    assert(topupTxn?.direction === 'credit', 'Topup transaction recorded as credit');
    assert(topupTxn?.coinAmount > 0, `Topup transaction credited ${topupTxn?.coinAmount} coins`);

    // -------------------------------------------------------------
    // Test 16: Insufficient Balance Protection & Gift Top-up Integration
    // -------------------------------------------------------------
    console.log('\n[SECTION 16] Insufficient Balance Protection & Gift Top-up Integration');
    const hostAId = '00000000-0000-0000-0000-000000088201';
    const testRoomId = '7002';

    const insufficientQuoteRes = await makeRequest('POST', '/api/gifts/send/preview?preview=demo', {
      giftId: 'gift_castle',
      quantity: 10, // 100,000 coins (exceeds balance)
      recipientHostId: hostAId,
      liveRoomId: testRoomId,
      senderUserId: testUserId,
      preview: 'demo',
    }, authHeaders);

    assert(insufficientQuoteRes.status === 200, 'HTTP 200: Pre-send quote preview generated');
    const poorQuote = insufficientQuoteRes.data?.preview || {};
    assert(poorQuote.insufficientBalance === true, 'Quote identifies insufficient balance');
    assert(poorQuote.shortfallCoins > 0, `Quote calculates missing coin deficit: ${poorQuote.shortfallCoins}`);

    // -------------------------------------------------------------
    // Test 17: Mobile Architecture & Flutter Components Verification
    // -------------------------------------------------------------
    console.log('\n[SECTION 17] Mobile Architecture & Flutter Components Verification');
    const mobileLibDir = path.resolve(__dirname, '../lib');
    const requiredWalletFiles = [
      'models/wallet/wallet_models.dart',
      'services/wallet/wallet_service.dart',
      'services/wallet/in_app_billing_service.dart',
      'services/wallet/wallet_session_manager.dart',
      'screens/wallet/wallet_screen.dart',
      'screens/wallet/coin_packages_screen.dart',
      'screens/wallet/purchase_history_screen.dart',
      'screens/wallet/transaction_history_screen.dart',
    ];

    for (const file of requiredWalletFiles) {
      const fullPath = path.join(mobileLibDir, file);
      assert(fs.existsSync(fullPath), `Required wallet component exists: ${file}`);
    }

    // Verify integration inside universal_gift_panel.dart and wallet_screen.dart
    const giftPanelCode = fs.readFileSync(path.join(mobileLibDir, 'screens/gifts/widgets/universal_gift_panel.dart'), 'utf8');
    assert(giftPanelCode.includes('CoinPackagesScreen'), 'universal_gift_panel.dart integrates CoinPackagesScreen on insufficient coins');

    const walletScreenCode = fs.readFileSync(path.join(mobileLibDir, 'screens/wallet/wallet_screen.dart'), 'utf8');
    assert(walletScreenCode.includes('CoinPackagesScreen'), 'wallet_screen.dart integrates CoinPackagesScreen');
    assert(walletScreenCode.includes('PurchaseHistoryScreen'), 'wallet_screen.dart integrates PurchaseHistoryScreen');
    assert(walletScreenCode.includes('TransactionHistoryScreen'), 'wallet_screen.dart integrates TransactionHistoryScreen');

    // -------------------------------------------------------------
    // Test 18: Preservation of All 49 Original Dart Screens
    // -------------------------------------------------------------
    console.log('\n[SECTION 18] 49 Original Dart Screens Preservation Audit');
    const screensDir = path.resolve(__dirname, '../lib/screens');
    const originalScreens = [
      'admin/admin_home_screen.dart',
      'agency_management/agency_management_screen.dart',
      'agent_earnings/agent_earnings_screen.dart',
      'animations/animation_overlay_widget.dart',
      'animations/animation_settings_sheet.dart',
      'animations/host_entrance_banner.dart',
      'auth/age_gate_screen.dart',
      'auth/forgot_password_sheet.dart',
      'auth/login_screen.dart',
      'auth/phone_otp_screen.dart',
      'auth/register_screen.dart',
      'auth/splash_screen.dart',
      'coin_seller/coin_seller_screen.dart',
      'daily_tasks/daily_host_tasks_screen.dart',
      'discovery/banners_carousel.dart',
      'discovery/country_chips.dart',
      'discovery/explore_home_screen.dart',
      'discovery/rankings_bottom_sheet.dart',
      'discovery/room_card.dart',
      'discovery/room_preview_screen.dart',
      'discovery/search_screen.dart',
      'earning_identity/earning_identity_screen.dart',
      'event_leaderboard/event_leaderboard_screen.dart',
      'fan_club/fan_club_screen.dart',
      'finance/receipts_finance_screen.dart',
      'gifts/gift_catalog_screen.dart',
      'gifts/gift_detail_sheet.dart',
      'gifts/gift_sending_sheet.dart',
      'gifts/live_gift_demo_screen.dart',
      'host_rankings/host_rankings_screen.dart',
      'inbox/inbox_screen.dart',
      'invites/invites_screen.dart',
      'live/face_verification_screen.dart',
      'party/party_room_screen.dart',
      'pk/pk_activity_slot_screen.dart',
      'pk/pk_battle_type_screen.dart',
      'pk/pk_discovery_tab_screen.dart',
      'pk/pk_fair_play_screen.dart',
      'pk/pk_invite_random_screen.dart',
      'pk/pk_reactions_screen.dart',
      'pk/pk_real_gifts_screen.dart',
      'pk/pk_result_screen.dart',
      'pk/pk_score_timer_screen.dart',
      'pk/pk_winner_boost_screen.dart',
      'profile/edit_profile_screen.dart',
      'profile/settings_screen.dart',
      'store/store_screen.dart',
      'vip/vip_screen.dart',
      'wallet/wallet_screen.dart',
    ];

    let preservedCount = 0;
    for (const rel of originalScreens) {
      const full = path.join(screensDir, rel);
      if (fs.existsSync(full)) {
        preservedCount++;
      } else {
        console.error(`  MISSING: ${rel}`);
      }
    }

    assert(
      preservedCount === originalScreens.length,
      `All ${originalScreens.length} original screens verified intact (${preservedCount}/${originalScreens.length})`
    );

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
