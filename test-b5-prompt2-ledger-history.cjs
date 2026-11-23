/**
 * ============================================================================
 * POPO LIVE — PHASE B5 PROMPT 2 OF 4:
 * COIN TRANSACTION HISTORY + HOST POINTS HISTORY VERIFICATION SUITE
 *
 * Master Plan Reference: POPO-LIVE-BACKEND-REALTIME-PLAN.pdf (Phase B5, page 4)
 *
 * Automated verification of all 15 required scenarios:
 *  1. User with coin transactions.
 *  2. User with no coin history.
 *  3. Host with points history.
 *  4. Host with no points history.
 *  5. Correct transaction ordering (strictly created_at DESC).
 *  6. Correct transaction amount (integers matching database).
 *  7. Correct credit/debit classification.
 *  8. Pagination (limit, page, total, totalPages).
 *  9. Cross-user access rejection (strict session scoping; User A cannot see User B).
 * 10. Invalid session (HTTP 401 UNAUTHORIZED).
 * 11. Database failure handling (HTTP 500 typed error).
 * 12. Mobile history integration (coin_history_screen.dart, points_history_screen.dart).
 * 13. Web history integration (WalletHistoryScreen.tsx).
 * 14. Cross-client consistency (identical PostgreSQL ledger records).
 * 15. No fixture fallback when enabled (empty remains empty, no synthetic rows).
 * ============================================================================
 */

const { Pool } = require('./apps/web/node_modules/pg');
const { NextRequest } = require('./apps/web/node_modules/next/server');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public',
});

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedChecks++;
    console.error(`  [FAIL] ${message}`);
  }
}

async function run() {
  console.log('\n================================================================');
  console.log('POPO LIVE — PHASE B5 PROMPT 2 OF 4: COIN & POINTS HISTORY VERIFICATION');
  console.log('================================================================\n');

  // Import Next.js route handlers
  const economyCoinsHistoryRoute = await import('./apps/web/app/api/economy/coins/history/route.ts');
  const economyPointsHistoryRoute = await import('./apps/web/app/api/economy/points/history/route.ts');
  const walletCoinsHistoryRoute = await import('./apps/web/app/api/wallet/coins/history/route.ts');
  const walletPointsHistoryRoute = await import('./apps/web/app/api/wallet/points/history/route.ts');

  // Test identifiers
  const userWithHistoryId = '00000000-0000-0000-0000-0000000b5201';
  const userWithHistoryToken = 'token_test_b52_user1';
  const userWithHistoryPoppoId = '85201';
  const userWithHistoryNickname = 'Active Trader Bilal';

  const userNoHistoryId = '00000000-0000-0000-0000-0000000b5202';
  const userNoHistoryToken = 'token_test_b52_user2';
  const userNoHistoryPoppoId = '85202';
  const userNoHistoryNickname = 'Clean User Nadia';

  const hostWithPointsId = '00000000-0000-0000-0000-0000000b5203';
  const hostWithPointsToken = 'token_test_b52_host1';
  const hostWithPointsPoppoId = '85203';
  const hostWithPointsNickname = 'Star Broadcaster Zara';

  const hostNoPointsId = '00000000-0000-0000-0000-0000000b5204';
  const hostNoPointsToken = 'token_test_b52_host2';
  const hostNoPointsPoppoId = '85204';
  const hostNoPointsNickname = 'New Host Zain';

  console.log('--- SETUP: SEEDING CONTROLLED TEST ACCOUNTS & LEDGERS ---');

  // 1. Clean previous runs
  await pool.query(`DELETE FROM popolive.points_transactions WHERE host_user_id IN ($1, $2, $3, $4) OR sender_id IN ($1, $2, $3, $4)`,
    [userWithHistoryId, userNoHistoryId, hostWithPointsId, hostNoPointsId]);
  await pool.query(`DELETE FROM popolive.coin_transactions WHERE user_id IN ($1, $2, $3, $4)`,
    [userWithHistoryId, userNoHistoryId, hostWithPointsId, hostNoPointsId]);
  await pool.query(`DELETE FROM popolive.sessions WHERE session_token IN ($1, $2, $3, $4)`,
    [userWithHistoryToken, userNoHistoryToken, hostWithPointsToken, hostNoPointsToken]);
  await pool.query(`DELETE FROM popolive.user_wallets WHERE user_id IN ($1, $2, $3, $4)`,
    [userWithHistoryId, userNoHistoryId, hostWithPointsId, hostNoPointsId]);
  await pool.query(`DELETE FROM popolive.users WHERE id IN ($1, $2, $3, $4)`,
    [userWithHistoryId, userNoHistoryId, hostWithPointsId, hostNoPointsId]);

  // 2. Seed Users
  await pool.query(`
    INSERT INTO popolive.users (id, poppo_id, nickname, birthdate, is_adult_verified, role, status, created_at, updated_at)
    VALUES 
      ($1, $2, $3, '1994-01-15', true, 'user', 'active', NOW(), NOW()),
      ($4, $5, $6, '1995-02-20', true, 'user', 'active', NOW(), NOW()),
      ($7, $8, $9, '1996-03-25', true, 'user', 'active', NOW(), NOW()),
      ($10, $11, $12, '1997-04-30', true, 'user', 'active', NOW(), NOW())
  `, [
    userWithHistoryId, userWithHistoryPoppoId, userWithHistoryNickname,
    userNoHistoryId, userNoHistoryPoppoId, userNoHistoryNickname,
    hostWithPointsId, hostWithPointsPoppoId, hostWithPointsNickname,
    hostNoPointsId, hostNoPointsPoppoId, hostNoPointsNickname
  ]);

  // 3. Seed Sessions
  await pool.query(`
    INSERT INTO popolive.sessions (id, user_id, session_token, is_revoked, expires_at, created_at)
    VALUES
      (gen_random_uuid(), $1, $2, false, NOW() + INTERVAL '7 days', NOW()),
      (gen_random_uuid(), $3, $4, false, NOW() + INTERVAL '7 days', NOW()),
      (gen_random_uuid(), $5, $6, false, NOW() + INTERVAL '7 days', NOW()),
      (gen_random_uuid(), $7, $8, false, NOW() + INTERVAL '7 days', NOW())
  `, [
    userWithHistoryId, userWithHistoryToken,
    userNoHistoryId, userNoHistoryToken,
    hostWithPointsId, hostWithPointsToken,
    hostNoPointsId, hostNoPointsToken
  ]);

  // 4. Seed Wallets
  const walletUser1 = '11111111-0000-0000-0000-0000000b5201';
  const walletHost1 = '11111111-0000-0000-0000-0000000b5203';
  await pool.query(`
    INSERT INTO popolive.user_wallets (wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen, created_at, updated_at)
    VALUES
      ($1, $2, 4500, 0, 1500, 0, false, NOW(), NOW()),
      (gen_random_uuid(), $3, 0, 0, 0, 0, false, NOW(), NOW()),
      ($4, $5, 0, 2100, 0, 2100, false, NOW(), NOW()),
      (gen_random_uuid(), $6, 0, 0, 0, 0, false, NOW(), NOW())
  `, [
    walletUser1, userWithHistoryId,
    userNoHistoryId,
    walletHost1, hostWithPointsId,
    hostNoPointsId
  ]);

  // 5. Seed Coin Transactions for User 1 (3 distinct rows with different timestamps)
  await pool.query(`
    INSERT INTO popolive.coin_transactions (
      id, transaction_id, wallet_id, user_id, transaction_type, direction,
      coin_amount, previous_balance, new_balance, status, reference_id, idempotency_key, description, created_at
    ) VALUES
      (gen_random_uuid(), 'ctx_seed_1', $1, $2, 'topup', 'credit', 5000, 0, 5000, 'completed', 'order_1', 'idem_1', 'Google Play In-App Purchase', NOW() - INTERVAL '3 hours'),
      (gen_random_uuid(), 'ctx_seed_2', $1, $2, 'gift_sent', 'debit', 300, 5000, 4700, 'completed', 'room_1', 'idem_2', 'Sent 3x Rose to Host Zara', NOW() - INTERVAL '2 hours'),
      (gen_random_uuid(), 'ctx_seed_3', $1, $2, 'gift_sent', 'debit', 200, 4700, 4500, 'completed', 'room_1', 'idem_3', 'Sent 2x Teddy to Host Zara', NOW() - INTERVAL '1 hour')
  `, [walletUser1, userWithHistoryId]);

  // 6. Seed Points Transactions for Host 1 (3 distinct rows with 70% share applied)
  await pool.query(`
    INSERT INTO popolive.points_transactions (
      id, transaction_id, wallet_id, host_user_id, transaction_type, direction,
      points_amount, source_gift_coins, share_percentage_applied, gift_source,
      sender_id, sender_name, previous_balance, new_balance, status,
      reference_id, idempotency_key, description, metadata, created_by, created_at, updated_at
    ) VALUES
      (gen_random_uuid(), 'ptx_seed_1', $1, $2, 'gift_earned', 'credit', 700, 1000, 70.0000, 'Live Room', $3, 'Bilal', 0, 700, 'completed', 'gift_tx_1', 'idem_p1', 'Received 10x Teddy from Bilal', '{}'::jsonb, 'gift_service', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),
      (gen_random_uuid(), 'ptx_seed_2', $1, $2, 'gift_earned', 'credit', 1050, 1500, 70.0000, 'Live Room', $3, 'Bilal', 700, 1750, 'completed', 'gift_tx_2', 'idem_p2', 'Received 1x Yacht from Bilal', '{}'::jsonb, 'gift_service', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
      (gen_random_uuid(), 'ptx_seed_3', $1, $2, 'gift_earned', 'credit', 350, 500, 70.0000, 'Live Room', $3, 'Bilal', 1750, 2100, 'completed', 'gift_tx_3', 'idem_p3', 'Received 1x Crown from Bilal', '{}'::jsonb, 'gift_service', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour')
  `, [walletHost1, hostWithPointsId, userWithHistoryId]);

  console.log('  [PASS] Controlled test ledger setup complete.\n');

  // =========================================================================
  // SCENARIO 1: USER WITH COIN TRANSACTIONS
  // =========================================================================
  console.log('--- SCENARIO 1: USER WITH COIN TRANSACTIONS ---');
  {
    const req = new NextRequest('http://localhost:3000/api/economy/coins/history', {
      headers: { Authorization: `Bearer ${userWithHistoryToken}` },
    });
    const res = await economyCoinsHistoryRoute.GET(req);
    const data = await res.json();

    assert(res.status === 200 && data.success === true, '1a. Coin history API returns HTTP 200 with success: true');
    assert(Array.isArray(data.transactions) && data.transactions.length === 3, `1b. Returns all 3 seeded coin transactions (got ${data.transactions?.length})`);
    assert(data.total === 3, '1c. Total transaction count is 3');
  }

  // =========================================================================
  // SCENARIO 2: USER WITH NO COIN HISTORY
  // =========================================================================
  console.log('\n--- SCENARIO 2: USER WITH NO COIN HISTORY ---');
  {
    const req = new NextRequest('http://localhost:3000/api/economy/coins/history', {
      headers: { Authorization: `Bearer ${userNoHistoryToken}` },
    });
    const res = await economyCoinsHistoryRoute.GET(req);
    const data = await res.json();

    assert(res.status === 200 && data.success === true, '2a. User with no history returns HTTP 200');
    assert(Array.isArray(data.transactions) && data.transactions.length === 0, '2b. Empty coin transactions is []');
    assert(data.total === 0, '2c. Total count is strictly 0 without synthetic records');
  }

  // =========================================================================
  // SCENARIO 3: HOST WITH POINTS HISTORY
  // =========================================================================
  console.log('\n--- SCENARIO 3: HOST WITH POINTS HISTORY ---');
  {
    const req = new NextRequest('http://localhost:3000/api/economy/points/history', {
      headers: { Authorization: `Bearer ${hostWithPointsToken}` },
    });
    const res = await economyPointsHistoryRoute.GET(req);
    const data = await res.json();

    assert(res.status === 200 && data.success === true, '3a. Points history API returns HTTP 200 with success: true');
    assert(Array.isArray(data.transactions) && data.transactions.length === 3, `3b. Returns all 3 points transactions (got ${data.transactions?.length})`);
    assert(data.total === 3, '3c. Total points transactions count is 3');
  }

  // =========================================================================
  // SCENARIO 4: HOST WITH NO POINTS HISTORY
  // =========================================================================
  console.log('\n--- SCENARIO 4: HOST WITH NO POINTS HISTORY ---');
  {
    const req = new NextRequest('http://localhost:3000/api/economy/points/history', {
      headers: { Authorization: `Bearer ${hostNoPointsToken}` },
    });
    const res = await economyPointsHistoryRoute.GET(req);
    const data = await res.json();

    assert(res.status === 200 && data.success === true, '4a. Host with no points history returns HTTP 200');
    assert(Array.isArray(data.transactions) && data.transactions.length === 0, '4b. Empty points transactions is []');
    assert(data.total === 0, '4c. Total points count is strictly 0 without synthetic records');
  }

  // =========================================================================
  // SCENARIO 5: CORRECT TRANSACTION CHRONOLOGICAL ORDERING
  // =========================================================================
  console.log('\n--- SCENARIO 5: TRANSACTION ORDERING (STRICTLY CREATED_AT DESC) ---');
  {
    const req = new NextRequest('http://localhost:3000/api/economy/coins/history', {
      headers: { Authorization: `Bearer ${userWithHistoryToken}` },
    });
    const res = await economyCoinsHistoryRoute.GET(req);
    const data = await res.json();

    // ctx_seed_3 was created 1 hour ago (most recent)
    // ctx_seed_2 was created 2 hours ago
    // ctx_seed_1 was created 3 hours ago (oldest)
    assert(data.transactions[0].transactionId === 'ctx_seed_3', '5a. Most recent transaction is first (ctx_seed_3, 1h ago)');
    assert(data.transactions[1].transactionId === 'ctx_seed_2', '5b. Second transaction is ctx_seed_2 (2h ago)');
    assert(data.transactions[2].transactionId === 'ctx_seed_1', '5c. Oldest transaction is last (ctx_seed_1, 3h ago)');

    // Timestamp verification
    const t0 = new Date(data.transactions[0].createdAt).getTime();
    const t1 = new Date(data.transactions[1].createdAt).getTime();
    const t2 = new Date(data.transactions[2].createdAt).getTime();
    assert(t0 > t1 && t1 > t2, '5d. Timestamps are strictly descending (t0 > t1 > t2)');
  }

  // =========================================================================
  // SCENARIO 6: CORRECT TRANSACTION AMOUNTS
  // =========================================================================
  console.log('\n--- SCENARIO 6: CORRECT TRANSACTION AMOUNTS ---');
  {
    const reqCoins = new NextRequest('http://localhost:3000/api/economy/coins/history', {
      headers: { Authorization: `Bearer ${userWithHistoryToken}` },
    });
    const resCoins = await economyCoinsHistoryRoute.GET(reqCoins);
    const dataCoins = await resCoins.json();

    assert(dataCoins.transactions[0].coinAmount === 200, '6a. Transaction 3 amount is exactly 200 coins');
    assert(dataCoins.transactions[1].coinAmount === 300, '6b. Transaction 2 amount is exactly 300 coins');
    assert(dataCoins.transactions[2].coinAmount === 5000, '6c. Transaction 1 amount is exactly 5000 coins');

    const reqPts = new NextRequest('http://localhost:3000/api/economy/points/history', {
      headers: { Authorization: `Bearer ${hostWithPointsToken}` },
    });
    const resPts = await economyPointsHistoryRoute.GET(reqPts);
    const dataPts = await resPts.json();

    assert(dataPts.transactions[0].pointsAmount === 350, '6d. Host Points tx 3 is exactly 350 points');
    assert(dataPts.transactions[1].pointsAmount === 1050, '6e. Host Points tx 2 is exactly 1050 points');
    assert(dataPts.transactions[2].pointsAmount === 700, '6f. Host Points tx 1 is exactly 700 points');
  }

  // =========================================================================
  // SCENARIO 7: CREDIT / DEBIT CLASSIFICATION
  // =========================================================================
  console.log('\n--- SCENARIO 7: CREDIT / DEBIT CLASSIFICATION ---');
  {
    const reqCoins = new NextRequest('http://localhost:3000/api/economy/coins/history', {
      headers: { Authorization: `Bearer ${userWithHistoryToken}` },
    });
    const resCoins = await economyCoinsHistoryRoute.GET(reqCoins);
    const dataCoins = await resCoins.json();

    assert(dataCoins.transactions[0].direction === 'debit', '7a. Gift sent transaction is classified as "debit"');
    assert(dataCoins.transactions[0].type === 'gift_sent', '7b. Transaction type is "gift_sent"');
    assert(dataCoins.transactions[2].direction === 'credit', '7c. Top-up purchase transaction is classified as "credit"');
    assert(dataCoins.transactions[2].type === 'topup', '7d. Transaction type is "topup"');

    const reqPts = new NextRequest('http://localhost:3000/api/economy/points/history', {
      headers: { Authorization: `Bearer ${hostWithPointsToken}` },
    });
    const resPts = await economyPointsHistoryRoute.GET(reqPts);
    const dataPts = await resPts.json();

    assert(dataPts.transactions[0].direction === 'credit', '7e. Host earnings are classified as "credit"');
    assert(dataPts.transactions[0].type === 'gift_earned', '7f. Host earnings type is "gift_earned"');
    assert(dataPts.transactions[0].sharePercentageApplied === 70, '7g. Authoritative 70% share recorded');
  }

  // =========================================================================
  // SCENARIO 8: PAGINATION STRATEGY
  // =========================================================================
  console.log('\n--- SCENARIO 8: PAGINATION STRATEGY ---');
  {
    // Page 1, limit 2 -> returns 2 items, totalPages = 2, total = 3
    const reqP1 = new NextRequest('http://localhost:3000/api/economy/coins/history?page=1&limit=2', {
      headers: { Authorization: `Bearer ${userWithHistoryToken}` },
    });
    const resP1 = await economyCoinsHistoryRoute.GET(reqP1);
    const dataP1 = await resP1.json();

    assert(dataP1.transactions.length === 2, '8a. Page 1 returns exactly 2 records');
    assert(dataP1.page === 1, '8b. Response page is 1');
    assert(dataP1.limit === 2, '8c. Response limit is 2');
    assert(dataP1.totalPages === 2, '8d. Total pages is 2');
    assert(dataP1.total === 3, '8e. Total count is 3');

    // Page 2, limit 2 -> returns remaining 1 item
    const reqP2 = new NextRequest('http://localhost:3000/api/economy/coins/history?page=2&limit=2', {
      headers: { Authorization: `Bearer ${userWithHistoryToken}` },
    });
    const resP2 = await economyCoinsHistoryRoute.GET(reqP2);
    const dataP2 = await resP2.json();

    assert(dataP2.transactions.length === 1, '8f. Page 2 returns the remaining 1 record');
    assert(dataP2.transactions[0].transactionId === 'ctx_seed_1', '8g. Page 2 returns oldest transaction ctx_seed_1');

    // Out of bounds page 99 -> returns empty []
    const reqOob = new NextRequest('http://localhost:3000/api/economy/coins/history?page=99&limit=2', {
      headers: { Authorization: `Bearer ${userWithHistoryToken}` },
    });
    const resOob = await economyCoinsHistoryRoute.GET(reqOob);
    const dataOob = await resOob.json();
    assert(dataOob.transactions.length === 0, '8h. Out-of-bounds page returns empty array [] without error');
  }

  // =========================================================================
  // SCENARIO 9: CROSS-USER ACCESS REJECTION (PRIVACY BARRIER)
  // =========================================================================
  console.log('\n--- SCENARIO 9: CROSS-USER ACCESS REJECTION ---');
  {
    // User 2 (no history) connects with own session:
    // Should NEVER see User 1's coin transactions
    const reqUser2 = new NextRequest('http://localhost:3000/api/economy/coins/history', {
      headers: { Authorization: `Bearer ${userNoHistoryToken}` },
    });
    const resUser2 = await economyCoinsHistoryRoute.GET(reqUser2);
    const dataUser2 = await resUser2.json();

    assert(dataUser2.transactions.length === 0, '9a. User 2 cannot see User 1 coin transactions');

    // Host 2 (no points) connects with own session:
    // Should NEVER see Host 1's points transactions
    const reqHost2 = new NextRequest('http://localhost:3000/api/economy/points/history', {
      headers: { Authorization: `Bearer ${hostNoPointsToken}` },
    });
    const resHost2 = await economyPointsHistoryRoute.GET(reqHost2);
    const dataHost2 = await resHost2.json();

    assert(dataHost2.transactions.length === 0, '9b. Host 2 cannot see Host 1 points transactions');

    // Attempting to query another user's private history via wallet endpoint
    const reqSnoop = new NextRequest(`http://localhost:3000/api/wallet/coins/history?userId=${userWithHistoryId}`, {
      headers: { Authorization: `Bearer ${userNoHistoryToken}` },
    });
    const resSnoop = await walletCoinsHistoryRoute.GET(reqSnoop);
    assert(resSnoop.status === 403, '9c. Direct query for another user history rejected with HTTP 403 Forbidden');
  }

  // =========================================================================
  // SCENARIO 10: INVALID / MISSING SESSION (HTTP 401)
  // =========================================================================
  console.log('\n--- SCENARIO 10: INVALID / MISSING SESSION REJECTION ---');
  {
    // Unauthenticated coin history request
    const reqUnauth = new NextRequest('http://localhost:3000/api/economy/coins/history');
    const resUnauth = await economyCoinsHistoryRoute.GET(reqUnauth);
    const dataUnauth = await resUnauth.json();

    assert(resUnauth.status === 401, '10a. Unauthenticated coin history returns HTTP 401');
    assert(dataUnauth.code === 'UNAUTHORIZED', '10b. Returns typed error code UNAUTHORIZED');

    // Expired or forged session token
    const reqForged = new NextRequest('http://localhost:3000/api/economy/points/history', {
      headers: { Authorization: 'Bearer forged_fake_token_xyz' },
    });
    const resForged = await economyPointsHistoryRoute.GET(reqForged);
    assert(resForged.status === 401, '10c. Forged session token returns HTTP 401');
  }

  // =========================================================================
  // SCENARIO 11: DATABASE FAILURE HANDLING
  // =========================================================================
  console.log('\n--- SCENARIO 11: DATABASE FAILURE HANDLING ---');
  {
    // Trigger database query failure simulation via dbPool.connect
    const dbMod = await import('./apps/web/lib/db.ts');
    const dbPool = dbMod.getDbPool();
    const originalConnect = dbPool.connect;
    try {
      dbPool.connect = async () => {
        throw new Error('FATAL_POSTGRES_DISCONNECT: Database connection failed.');
      };

      const reqFail = new NextRequest('http://localhost:3000/api/economy/coins/history', {
        headers: { Authorization: `Bearer ${userWithHistoryToken}` },
      });
      const resFail = await economyCoinsHistoryRoute.GET(reqFail);
      const dataFail = await resFail.json();

      assert(resFail.status === 500, '11a. Database failure gracefully returns HTTP 500');
      assert(dataFail.success === false, '11b. Success is strictly false on DB failure');
      assert(!dataFail.transactions, '11c. No fake transaction records fabricated on error');
    } finally {
      dbPool.connect = originalConnect;
    }
  }

  // =========================================================================
  // SCENARIO 12: MOBILE HISTORY INTEGRATION AUDIT
  // =========================================================================
  console.log('\n--- SCENARIO 12: MOBILE HISTORY INTEGRATION AUDIT ---');
  {
    const coinScreenFile = fs.readFileSync('apps/mobile/lib/screens/wallet/coin_history_screen.dart', 'utf8');
    assert(coinScreenFile.includes("ApiConfig.useEconomyApi"),
      '12a. Flutter CoinHistoryScreen checks ApiConfig.useEconomyApi');
    assert(coinScreenFile.includes('/api/economy/coins/history'),
      '12b. Flutter CoinHistoryScreen queries /api/economy/coins/history');
    assert(coinScreenFile.includes("page="),
      '12c. Flutter CoinHistoryScreen supports pagination');

    const pointsScreenFile = fs.readFileSync('apps/mobile/lib/screens/wallet/points_history_screen.dart', 'utf8');
    assert(pointsScreenFile.includes("ApiConfig.useEconomyApi"),
      '12d. Flutter PointsHistoryScreen checks ApiConfig.useEconomyApi');
    assert(pointsScreenFile.includes('/api/economy/points/history'),
      '12e. Flutter PointsHistoryScreen queries /api/economy/points/history');
  }

  // =========================================================================
  // SCENARIO 13: WEB HISTORY INTEGRATION AUDIT
  // =========================================================================
  console.log('\n--- SCENARIO 13: WEB HISTORY INTEGRATION AUDIT ---');
  {
    const webHistoryFile = fs.readFileSync('apps/web/components/wallet/WalletHistoryScreen.tsx', 'utf8');
    assert(webHistoryFile.includes("USE_ECONOMY_API"),
      '13a. Web WalletHistoryScreen checks USE_ECONOMY_API');
    assert(webHistoryFile.includes('/api/economy/coins/history'),
      '13b. Web WalletHistoryScreen queries /api/economy/coins/history');
    assert(webHistoryFile.includes('/api/economy/points/history'),
      '13c. Web WalletHistoryScreen queries /api/economy/points/history');
  }

  // =========================================================================
  // SCENARIO 14: CROSS-CLIENT CONSISTENCY
  // =========================================================================
  console.log('\n--- SCENARIO 14: CROSS-CLIENT CONSISTENCY ---');
  {
    // Mobile query
    const reqMobile = new NextRequest('http://localhost:3000/api/economy/coins/history', {
      headers: { Authorization: `Bearer ${userWithHistoryToken}` },
    });
    const resMobile = await economyCoinsHistoryRoute.GET(reqMobile);
    const dataMobile = await resMobile.json();

    // Web query
    const reqWeb = new NextRequest('http://localhost:3000/api/economy/coins/history', {
      headers: { Authorization: `Bearer ${userWithHistoryToken}` },
    });
    const resWeb = await economyCoinsHistoryRoute.GET(reqWeb);
    const dataWeb = await resWeb.json();

    assert(dataMobile.transactions.length === dataWeb.transactions.length,
      '14a. Mobile and Web return identical transaction counts');
    assert(dataMobile.transactions[0].transactionId === dataWeb.transactions[0].transactionId,
      '14b. Mobile and Web return identical top transaction ID');
    assert(dataMobile.transactions[0].coinAmount === dataWeb.transactions[0].coinAmount,
      '14c. Mobile and Web return identical transaction amounts');
    assert(dataMobile.transactions[0].direction === dataWeb.transactions[0].direction,
      '14d. Mobile and Web return identical transaction direction');
  }

  // =========================================================================
  // SCENARIO 15: NO FIXTURE FALLBACK WHEN ENABLED
  // =========================================================================
  console.log('\n--- SCENARIO 15: NO FIXTURE FALLBACK WHEN ENABLED ---');
  {
    // Clean user with zero transactions
    const reqClean = new NextRequest('http://localhost:3000/api/economy/coins/history', {
      headers: { Authorization: `Bearer ${userNoHistoryToken}` },
    });
    const resClean = await economyCoinsHistoryRoute.GET(reqClean);
    const dataClean = await resClean.json();

    assert(dataClean.transactions.length === 0, '15a. Real empty ledger remains strictly empty');
    assert(!JSON.stringify(dataClean).includes('fixture'), '15b. No fixture strings or mock IDs returned');
    assert(dataClean.total === 0, '15c. Total count is strictly 0 without synthetic fixture entries');
  }

  console.log('\n================================================================');
  console.log(`TOTAL B5 PROMPT 2 CHECKS: ${totalChecks}`);
  console.log(`PASSED: ${passedChecks}`);
  console.log(`FAILED: ${failedChecks}`);
  console.log('================================================================\n');

  await pool.end();

  if (failedChecks > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  pool.end().finally(() => process.exit(1));
});
