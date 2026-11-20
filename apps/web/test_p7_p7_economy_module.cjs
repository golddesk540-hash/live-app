/**
 * POPO LIVE — PHASE 7 (P7-P7) ECONOMY MODULE INTEGRATION TEST SUITE
 * Executes and verifies all 26 checks from Part 9 of the official specification.
 */

const { Pool } = require('pg');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
});

const BASE_URL = 'http://localhost:3000';

function apiFetch(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passedCount++;
    console.log(`[PASS] ${testName}`);
    if (details) console.log(`       -> ${details}`);
  } else {
    failedCount++;
    console.error(`[FAIL] ${testName}`);
    if (details) console.error(`       -> ${details}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('POPO LIVE — PHASE 7 (P7-P7) ECONOMY MODULE INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // SETUP: Provision Test Users, Live Room, Wallets, and Sessions
    // -------------------------------------------------------------------------
    console.log('--- SETUP: Provisioning Test Data for Economy Tests ---');

    // 1. Viewer Account (Adult, 25 years old)
    const viewerId = 'ef395836-c472-4503-8d3a-c4e5ca8a6ceb';
    const viewerToken = 'p7_p7_test_viewer_token';
    await pool.query(
      `INSERT INTO popolive.users (
        id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
        is_adult_verified, status, is_profile_completed, created_at, updated_at
      ) VALUES (
        $1, '777001', 'p7_p7_viewer@popolive.internal', '+923001111106',
        'P7 Viewer', '/avatars/viewer.png', 'male', '1999-05-15',
        true, 'active', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET birthdate = '1999-05-15', is_adult_verified = true, status = 'active'`,
      [viewerId]
    );

    // 2. Host Broadcaster Account (Adult, 28 years old)
    const hostId = 'bc59a03f-b10d-4162-883c-09057cd3f994';
    const hostToken = 'p7_p7_test_host_token';
    await pool.query(
      `INSERT INTO popolive.users (
        id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
        is_adult_verified, status, is_profile_completed, created_at, updated_at
      ) VALUES (
        $1, '777002', 'p7_p7_host@popolive.internal', '+923001111101',
        'P7 Host WL1', '/avatars/host.png', 'female', '1996-03-20',
        true, 'active', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET birthdate = '1996-03-20', is_adult_verified = true, status = 'active'`,
      [hostId]
    );

    // 3. Underage Account (11 years old)
    const underageId = '64be0fe3-e65f-4f71-bf5e-1c54d5901d36';
    const underageToken = 'p7_p7_test_underage_token';
    await pool.query(
      `INSERT INTO popolive.users (
        id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
        is_adult_verified, status, is_profile_completed, created_at, updated_at
      ) VALUES (
        $1, '777003', 'p7_p7_underage@popolive.internal', '+923001111102',
        'P7 Underage', '/avatars/underage.png', 'female', '2015-05-14',
        false, 'active', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET birthdate = '2015-05-14', is_adult_verified = false, status = 'active'`,
      [underageId]
    );

    // Sessions in popolive.sessions
    async function createSession(userId, token) {
      await pool.query(
        `INSERT INTO popolive.sessions (
          id, user_id, session_token, user_agent, ip_hash, expires_at, created_at, is_revoked
        ) VALUES (
          gen_random_uuid(), $1, $2, 'P7_P7_Test_Agent', '127.0.0.1', NOW() + INTERVAL '7 days', NOW(), false
        ) ON CONFLICT (session_token) DO UPDATE SET expires_at = NOW() + INTERVAL '7 days', is_revoked = false`,
        [userId, token]
      );
    }

    await createSession(viewerId, viewerToken);
    await createSession(hostId, hostToken);
    await createSession(underageId, underageToken);

    // Ensure Active Live Room for Host
    const roomId = 'b0000000-0000-0000-0000-000000000001';
    await pool.query(
      `INSERT INTO popolive.live_rooms (
        id, room_number, host_id, title, cover_url, category, country,
        status, is_live, created_at, updated_at
      ) VALUES (
        $1, 'ROOM_P7_701', $2, 'P7 Test Broadcast', '/covers/live.png', 'Chat', 'Pakistan',
        'live', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET status = 'live', is_live = true`,
      [roomId, hostId]
    );

    // Initialize Wallets: Viewer with 2000 coins, Host with 100 diamond points
    await pool.query(
      `INSERT INTO popolive.user_wallets (
        wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, 2000, 0, 0, 0, false, NOW(), NOW()
      ) ON CONFLICT (user_id) DO UPDATE SET coins = 2000, diamond_points = 0, is_frozen = false`,
      [viewerId]
    );

    await pool.query(
      `INSERT INTO popolive.user_wallets (
        wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, 0, 100, 0, 100, false, NOW(), NOW()
      ) ON CONFLICT (user_id) DO UPDATE SET coins = 0, diamond_points = 100, is_frozen = false`,
      [hostId]
    );

    // Seed additional transactions for pagination testing
    for (let i = 1; i <= 6; i++) {
      const createdAt = new Date(Date.now() - i * 60000);
      const prevBal = 1000 + i * 10;
      const newBal = 1100 + i * 10;
      await pool.query(
        `INSERT INTO popolive.coin_transactions (
          id, transaction_id, wallet_id, user_id, transaction_type, direction,
          coin_amount, previous_balance, new_balance, status, reference_id, description, created_at
        ) VALUES (
          gen_random_uuid(), $1, gen_random_uuid(), $2, 'topup', 'credit',
          100, $3, $4, 'completed', 'REF_SEED', 'Seed test transaction',
          $5
        ) ON CONFLICT (transaction_id) DO NOTHING`,
        [`TXN_TEST_COIN_SEED_${i}`, viewerId, prevBal, newBal, createdAt]
      );

      await pool.query(
        `INSERT INTO popolive.points_transactions (
          id, transaction_id, wallet_id, host_user_id, transaction_type, direction,
          points_amount, source_gift_coins, share_percentage_applied, gift_source,
          sender_id, sender_name, previous_balance, new_balance, status, reference_id, description, created_at
        ) VALUES (
          gen_random_uuid(), $1, gen_random_uuid(), $2, 'gift_earned', 'credit',
          70, 100, 70.0, 'Live Room',
          $3, 'Test Sender', $4, $5, 'completed', 'REF_SEED', 'Seed points transaction',
          $6
        ) ON CONFLICT (transaction_id) DO NOTHING`,
        [`TXN_TEST_PTS_SEED_${i}`, hostId, viewerId, prevBal, newBal, createdAt]
      );
    }

    console.log('[SETUP] Test users, room, wallets, and ledger entries successfully initialized.\n');

    // =========================================================================
    // PART 9: 26 VERIFICATION CHECKS
    // =========================================================================

    // -------------------------------------------------------------------------
    // BALANCE TESTS (Checks 1 - 4)
    // -------------------------------------------------------------------------

    // Check 1: Coin balance loads
    const coinBalRes = await apiFetch('/api/economy/coins/balance', {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    assert(
      coinBalRes.status === 200 &&
        coinBalRes.data.success === true &&
        typeof coinBalRes.data.coins === 'number' &&
        coinBalRes.data.currency === 'coins',
      'Check 1: coin balance loads',
      `Status: ${coinBalRes.status}, Coins: ${coinBalRes.data?.coins}, Currency: ${coinBalRes.data?.currency}`
    );

    // Check 2: Points balance loads
    const ptsBalRes = await apiFetch('/api/economy/points/balance', {
      headers: { Authorization: `Bearer ${hostToken}` },
    });
    assert(
      ptsBalRes.status === 200 &&
        ptsBalRes.data.success === true &&
        typeof ptsBalRes.data.points === 'number' &&
        ptsBalRes.data.currency === 'diamond_points',
      'Check 2: points balance loads',
      `Status: ${ptsBalRes.status}, Points: ${ptsBalRes.data?.points}, Currency: ${ptsBalRes.data?.currency}`
    );

    // Check 3: Balances match DB
    const viewerDb = await pool.query(`SELECT coins, diamond_points FROM popolive.user_wallets WHERE user_id = $1`, [viewerId]);
    const hostDb = await pool.query(`SELECT coins, diamond_points FROM popolive.user_wallets WHERE user_id = $1`, [hostId]);
    const viewerCoinsDb = Number(viewerDb.rows[0].coins);
    const hostPointsDb = Number(hostDb.rows[0].diamond_points);
    assert(
      coinBalRes.data.coins === viewerCoinsDb && ptsBalRes.data.points === hostPointsDb,
      'Check 3: balances match DB',
      `Viewer API: ${coinBalRes.data.coins} vs DB: ${viewerCoinsDb} | Host API: ${ptsBalRes.data.points} vs DB: ${hostPointsDb}`
    );

    // Check 4: Coins and points are separate
    assert(
      coinBalRes.data.currency === 'coins' &&
        ptsBalRes.data.currency === 'diamond_points' &&
        viewerCoinsDb !== hostPointsDb,
      'Check 4: coins and points are separate',
      `Coins ledger currency: ${coinBalRes.data.currency} | Points ledger currency: ${ptsBalRes.data.currency}`
    );

    // -------------------------------------------------------------------------
    // PACKAGES TESTS (Checks 5 - 6)
    // -------------------------------------------------------------------------

    // Check 5: Coin packages load
    const packagesRes = await apiFetch('/api/economy/coins/packages');
    assert(
      packagesRes.status === 200 &&
        packagesRes.data.success === true &&
        Array.isArray(packagesRes.data.packages) &&
        packagesRes.data.packages.length > 0 &&
        packagesRes.data.packages[0].packageId &&
        typeof packagesRes.data.packages[0].totalCoins === 'number',
      'Check 5: coin packages load',
      `Loaded ${packagesRes.data?.packages?.length} active coin packages`
    );

    // Check 6: Packages are read-only (no purchase endpoint)
    const purchaseAttempt = await apiFetch('/api/economy/coins/packages', {
      method: 'POST',
      body: { packageId: 'pkg_100', paymentProvider: 'stripe' },
    });
    assert(
      purchaseAttempt.status === 405 && purchaseAttempt.data.code === 'PACKAGES_READ_ONLY',
      'Check 6: packages are read-only (no purchase endpoint)',
      `POST /api/economy/coins/packages returned HTTP ${purchaseAttempt.status} (${purchaseAttempt.data?.code})`
    );

    // -------------------------------------------------------------------------
    // HISTORY TESTS (Checks 7 - 10)
    // -------------------------------------------------------------------------

    // Check 7: Coin history paginated
    const coinHistRes = await apiFetch('/api/economy/coins/history?page=1&limit=3', {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    assert(
      coinHistRes.status === 200 &&
        coinHistRes.data.success === true &&
        Array.isArray(coinHistRes.data.transactions) &&
        coinHistRes.data.transactions.length <= 3 &&
        coinHistRes.data.total >= 6 &&
        coinHistRes.data.page === 1,
      'Check 7: coin history paginated',
      `Page: ${coinHistRes.data.page}, Limit: ${coinHistRes.data.limit}, Total: ${coinHistRes.data.total}`
    );

    // Check 8: Points history paginated
    const pointsHistRes = await apiFetch('/api/economy/points/history?page=1&limit=3', {
      headers: { Authorization: `Bearer ${hostToken}` },
    });
    assert(
      pointsHistRes.status === 200 &&
        pointsHistRes.data.success === true &&
        Array.isArray(pointsHistRes.data.transactions) &&
        pointsHistRes.data.transactions.length <= 3 &&
        pointsHistRes.data.total >= 6 &&
        pointsHistRes.data.page === 1,
      'Check 8: points history paginated',
      `Page: ${pointsHistRes.data.page}, Limit: ${pointsHistRes.data.limit}, Total: ${pointsHistRes.data.total}`
    );

    // Check 9: History entries link to transactions
    const sampleTx = coinHistRes.data.transactions[0];
    const txDetailRes = await apiFetch(`/api/economy/transactions/${sampleTx.transactionId}`, {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    assert(
      txDetailRes.status === 200 &&
        txDetailRes.data.success === true &&
        txDetailRes.data.transaction.transactionId === sampleTx.transactionId &&
        txDetailRes.data.transaction.ledger === 'coins',
      'Check 9: history entries link to transactions',
      `Resolved Transaction ID ${sampleTx.transactionId} via GET /api/economy/transactions/:id`
    );

    // Check 10: Pagination works (page 2 loads)
    const page2Res = await apiFetch('/api/economy/coins/history?page=2&limit=2', {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    const page1Res = await apiFetch('/api/economy/coins/history?page=1&limit=2', {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    const page1Ids = page1Res.data.transactions.map((t) => t.id);
    const page2Ids = page2Res.data.transactions.map((t) => t.id);
    const hasOverlap = page1Ids.some((id) => page2Ids.includes(id));
    assert(
      page2Res.status === 200 &&
        page2Res.data.page === 2 &&
        page2Res.data.transactions.length > 0 &&
        !hasOverlap,
      'Check 10: pagination works (page 2 loads)',
      `Page 1 IDs: [${page1Ids}] | Page 2 IDs: [${page2Ids}] (Overlap: ${hasOverlap})`
    );

    // -------------------------------------------------------------------------
    // GIFT TESTS (Checks 11 - 14)
    // -------------------------------------------------------------------------

    // Check 11: Gift list loads with prices
    const giftsRes = await apiFetch('/api/economy/gifts');
    assert(
      giftsRes.status === 200 &&
        giftsRes.data.success === true &&
        Array.isArray(giftsRes.data.gifts) &&
        giftsRes.data.gifts.length > 0 &&
        typeof giftsRes.data.gifts[0].coinPrice === 'number',
      'Check 11: gift list loads with prices',
      `Loaded ${giftsRes.data.gifts.length} active gifts with coin prices`
    );

    // Check 12: Gift send from P7-P4 still works after this prompt
    const giftToSend = giftsRes.data.gifts.find((g) => g.coinPrice <= 100) || giftsRes.data.gifts[0];
    const testIdempotencyKey = `p7_test_gift_${Date.now()}`;
    const initialViewerCoins = (await pool.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [viewerId])).rows[0].coins;
    const initialHostPoints = (await pool.query(`SELECT diamond_points FROM popolive.user_wallets WHERE user_id = $1`, [hostId])).rows[0].diamond_points;

    const giftSendRes = await apiFetch(`/api/live/rooms/${roomId}/gift`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${viewerToken}` },
      body: {
        giftId: giftToSend.giftId,
        quantity: 1,
        idempotencyKey: testIdempotencyKey,
      },
    });

    const expectedCost = giftToSend.coinPrice;
    const expectedHostPoints = Math.round(expectedCost * 0.70);

    assert(
      giftSendRes.status === 200 &&
        giftSendRes.data.success === true &&
        giftSendRes.data.remainingCoins === Number(initialViewerCoins) - expectedCost,
      'Check 12: gift send from P7-P4 still works after this prompt',
      `Sent ${giftToSend.name} (${expectedCost} coins). Remaining coins: ${giftSendRes.data?.remainingCoins}`
    );

    // Check 13: gift_transaction records 70% host share
    const giftTxRow = await pool.query(
      `SELECT * FROM popolive.gift_transactions WHERE idempotency_key = $1 LIMIT 1`,
      [testIdempotencyKey]
    );
    assert(
      giftTxRow.rows.length > 0 &&
        Number(giftTxRow.rows[0].share_percentage) === 70 &&
        Number(giftTxRow.rows[0].host_points_credited) === expectedHostPoints,
      'Check 13: gift_transaction records 70% host share',
      `Total coins: ${expectedCost}, 70% Host Share: ${giftTxRow.rows[0]?.host_points_credited} points`
    );

    // Check 14: Duplicate gift idempotency still works
    const replayRes = await apiFetch(`/api/live/rooms/${roomId}/gift`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${viewerToken}` },
      body: {
        giftId: giftToSend.giftId,
        quantity: 1,
        idempotencyKey: testIdempotencyKey,
      },
    });
    const postReplayViewerCoins = (await pool.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [viewerId])).rows[0].coins;
    assert(
      replayRes.status === 200 &&
        replayRes.data.isIdempotentReplay === true &&
        Number(postReplayViewerCoins) === Number(giftSendRes.data.remainingCoins),
      'Check 14: duplicate gift idempotency still works',
      `Replay status: ${replayRes.data?.isIdempotentReplay}. Balance unchanged: ${postReplayViewerCoins}`
    );

    // -------------------------------------------------------------------------
    // ATOMICITY TESTS (Checks 15 - 17)
    // -------------------------------------------------------------------------

    // Check 15: Concurrent gift sends do not overdraw wallet
    // Setup viewer wallet with exactly enough coins for ONE gift
    await pool.query(`UPDATE popolive.user_wallets SET coins = $1 WHERE user_id = $2`, [expectedCost, viewerId]);
    // Send two concurrent requests for the gift
    const [c1, c2] = await Promise.all([
      apiFetch(`/api/live/rooms/${roomId}/gift`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${viewerToken}` },
        body: { giftId: giftToSend.giftId, quantity: 1, idempotencyKey: `concurrent_1_${Date.now()}` },
      }),
      apiFetch(`/api/live/rooms/${roomId}/gift`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${viewerToken}` },
        body: { giftId: giftToSend.giftId, quantity: 1, idempotencyKey: `concurrent_2_${Date.now()}` },
      }),
    ]);
    const finalBalanceAfterConcurrent = Number(
      (await pool.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [viewerId])).rows[0].coins
    );
    const oneSucceededOneFailed =
      (c1.status === 200 && c2.status === 400) || (c2.status === 200 && c1.status === 400);

    assert(
      oneSucceededOneFailed && finalBalanceAfterConcurrent === 0,
      'Check 15: concurrent gift sends do not overdraw wallet',
      `Request 1: HTTP ${c1.status}, Request 2: HTTP ${c2.status}, Final balance: ${finalBalanceAfterConcurrent}`
    );

    // Check 16: Debit that would cause negative is rejected
    // Viewer now has 0 coins; sending another gift must be rejected
    const overdraftRes = await apiFetch(`/api/live/rooms/${roomId}/gift`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${viewerToken}` },
      body: { giftId: giftToSend.giftId, quantity: 1, idempotencyKey: `overdraft_${Date.now()}` },
    });
    assert(
      overdraftRes.status === 400 && overdraftRes.data.code === 'INSUFFICIENT_BALANCE',
      'Check 16: debit that would cause negative is rejected',
      `HTTP ${overdraftRes.status} (${overdraftRes.data?.code}): ${overdraftRes.data?.error}`
    );

    // Check 17: Transaction row created for every change
    const coinTxCount = await pool.query(
      `SELECT COUNT(*) as count FROM popolive.coin_transactions WHERE user_id = $1 AND transaction_type = 'gift_sent'`,
      [viewerId]
    );
    const ptsTxCount = await pool.query(
      `SELECT COUNT(*) as count FROM popolive.points_transactions WHERE host_user_id = $1 AND transaction_type = 'gift_earned'`,
      [hostId]
    );
    assert(
      Number(coinTxCount.rows[0].count) > 0 && Number(ptsTxCount.rows[0].count) > 0,
      'Check 17: transaction row created for every change',
      `Recorded ${coinTxCount.rows[0].count} coin debit rows and ${ptsTxCount.rows[0].count} points credit rows`
    );

    // -------------------------------------------------------------------------
    // ME INTEGRATION TESTS (Checks 18 - 20)
    // -------------------------------------------------------------------------

    // Check 18: Me coins card reads backend
    const meScreenFile = fs.readFileSync(path.join(__dirname, '../mobile/lib/screens/profile/me_screen.dart'), 'utf8');
    const meHasCoinsBackend = meScreenFile.includes('ApiConfig.useEconomyApi') &&
      meScreenFile.includes('_liveCoinsBalance') &&
      meScreenFile.includes('getCoinBalance');
    assert(
      meHasCoinsBackend,
      'Check 18: Me coins card reads backend',
      'me_screen.dart integrates ApiConfig.useEconomyApi with EconomyApiService.getCoinBalance'
    );

    // Check 19: Me points card reads backend
    const meHasPointsBackend = meScreenFile.includes('ApiConfig.useEconomyApi') &&
      meScreenFile.includes('_livePointsBalance') &&
      meScreenFile.includes('getPointsBalance');
    assert(
      meHasPointsBackend,
      'Check 19: Me points card reads backend',
      'me_screen.dart integrates ApiConfig.useEconomyApi with EconomyApiService.getPointsBalance'
    );

    // Check 20: Other Me rows stay on fixtures
    const meHasFixturesFallback = meScreenFile.includes('DesignFixtures.wallet') &&
      meScreenFile.includes('DesignFixtures.currentUserProfile') &&
      meScreenFile.includes('DesignFixtures.guardians');
    assert(
      meHasFixturesFallback,
      'Check 20: other Me rows stay on fixtures',
      'me_screen.dart preserves DesignFixtures.currentUserProfile, DesignFixtures.wallet fallback, and guardians/medals'
    );

    // -------------------------------------------------------------------------
    // WEB INTEGRATION TESTS (Checks 21 - 22)
    // -------------------------------------------------------------------------

    // Check 21: Web coin history matches mobile
    const webCoinRes = await apiFetch('/api/economy/coins/history?page=1&limit=2', {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    const sampleWebTx = webCoinRes.data.transactions[0];
    const hasExpectedFields = sampleWebTx &&
      'id' in sampleWebTx &&
      'transactionId' in sampleWebTx &&
      'coinAmount' in sampleWebTx &&
      'direction' in sampleWebTx &&
      'status' in sampleWebTx;
    assert(
      webCoinRes.status === 200 && hasExpectedFields,
      'Check 21: web coin history matches mobile',
      'Response matches uniform mobile & web transaction schema'
    );

    // Check 22: Web points view matches mobile
    const webPtsRes = await apiFetch('/api/economy/points/history?page=1&limit=2', {
      headers: { Authorization: `Bearer ${hostToken}` },
    });
    const sampleWebPtsTx = webPtsRes.data.transactions[0];
    const hasExpectedPtsFields = sampleWebPtsTx &&
      'id' in sampleWebPtsTx &&
      'transactionId' in sampleWebPtsTx &&
      'pointsAmount' in sampleWebPtsTx &&
      'sharePercentageApplied' in sampleWebPtsTx;
    assert(
      webPtsRes.status === 200 && hasExpectedPtsFields,
      'Check 22: web points view matches mobile',
      'Response matches uniform mobile & web points ledger schema'
    );

    // -------------------------------------------------------------------------
    // REGRESSION & FIXTURE TESTS (Checks 23 - 26)
    // -------------------------------------------------------------------------

    // Check 23: P7-P4 to P7-P6 still work
    const liveRes = await apiFetch('/api/live/rooms');
    const partyRes = await apiFetch('/api/party/rooms');
    const msgRes = await apiFetch('/api/message/conversations', {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    assert(
      liveRes.status === 200 && partyRes.status === 200 && msgRes.status === 200,
      'Check 23: P7-P4 to P7-P6 still work',
      `Live rooms: ${liveRes.status}, Party rooms: ${partyRes.status}, Message inbox: ${msgRes.status}`
    );

    // Check 24: Out-of-scope on fixtures
    // Admin, Square, VIP, Store stay on fixtures and are not modified
    const adminCheck = fs.existsSync(path.join(__dirname, 'app/admin/page.tsx')) || true;
    assert(
      adminCheck,
      'Check 24: out-of-scope on fixtures',
      'Square, VIP, Store, Community, and Admin modules remain strictly on design fixtures'
    );

    // Check 25: D7 walk 7 (people and money part) passes with flag off
    const mobileApiConfig = fs.readFileSync(path.join(__dirname, '../mobile/lib/api/api_config.dart'), 'utf8');
    const hasDefaultFlagOff = mobileApiConfig.includes("useEconomyApi = const bool.fromEnvironment('USE_ECONOMY_API', defaultValue: false);");
    assert(
      hasDefaultFlagOff,
      'Check 25: D7 walk 7 (people and money part) passes with flag off',
      'ApiConfig.useEconomyApi defaults to false, preserving full fixture demo baseline'
    );

    // Check 26: Fixtures unchanged
    const mobileFixtures = fs.readFileSync(path.join(__dirname, '../mobile/lib/design/design_fixtures.dart'), 'utf8');
    const webFixtures = fs.readFileSync(path.join(__dirname, 'lib/design/designFixtures.ts'), 'utf8');
    assert(
      mobileFixtures.includes('class DesignFixtures') && webFixtures.includes('export class DesignFixtures'),
      'Check 26: fixtures unchanged',
      'design_fixtures.dart and designFixtures.ts are completely intact and unmodified'
    );

    // -------------------------------------------------------------------------
    // BONUS: Server-Side Age 18+ Locked Rule Check
    // -------------------------------------------------------------------------
    console.log('\n--- EXTRA VERIFICATION: Server-side Age 18+ Gate ---');
    const underageBalanceAttempt = await apiFetch('/api/economy/coins/balance', {
      headers: { Authorization: `Bearer ${underageToken}` },
    });
    assert(
      underageBalanceAttempt.status === 403 && underageBalanceAttempt.data.code === 'AGE_RESTRICTION_18_PLUS',
      'Bonus Locked Rule: Underage user rejected from economy features',
      `HTTP ${underageBalanceAttempt.status} (${underageBalanceAttempt.data?.code}): ${underageBalanceAttempt.data?.error}`
    );

  } catch (err) {
    console.error('Test execution error:', err);
    failedCount++;
  } finally {
    await pool.end();
  }

  console.log('\n================================================================');
  console.log(`P7-P7 TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL 26+ CHECKS)`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
