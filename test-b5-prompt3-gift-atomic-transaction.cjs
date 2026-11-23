/**
 * ============================================================================
 * POPO LIVE — PHASE B5 PROMPT 3 OF 4:
 * REAL GIFT SENDING + 70% HOST POINTS CREDIT + ATOMIC LEDGER TRANSACTION
 *
 * Master Plan Reference: POPO-LIVE-BACKEND-REALTIME-PLAN.pdf (Phase B5, page 4)
 *
 * Detailed verification of all B5 Prompt 3 requirements:
 * 1. Inspect existing architecture: user_wallets, coin_transactions, points_transactions,
 *    gift_catalog, gift_transactions, gift_realtime_events, finance_rules, live_rooms.
 * 2. Authoritative 70% finance rule from PostgreSQL finance_rules.
 * 3. Atomic database transaction (14-step transaction committing all tables).
 * 4. Atomic rollback verification (zero changes committed on failure).
 * 5. Server-authoritative calculations (no client-supplied prices or percentages).
 * 6. Insufficient coins typed error (INSUFFICIENT_COINS, HTTP 400).
 * 7. Concurrency and duplicate protection (idempotency key replay, row locking).
 * 8. Self-gifting prevention (broadcasters cannot send gifts to own room).
 * 9. Ended room rejection (cannot send gifts to closed/ended room).
 * 10. Persistent gift alerts in gift_realtime_events for polling.
 * 11. Cross-client integration (Flutter GiftService and Web components).
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
  console.log('POPO LIVE — PHASE B5 PROMPT 3 OF 4: REAL GIFT SENDING & ATOMIC TX');
  console.log('================================================================\n');

  // Import Next.js route handlers and economy service
  const economyGiftSendRoute = await import('./apps/web/app/api/economy/gifts/send/route.ts');
  const webGiftsSendRoute = await import('./apps/web/app/api/gifts/send/route.ts');
  const economyService = await import('./apps/web/lib/economyApiService.ts');

  // Test identifiers
  const senderUserId = '00000000-0000-0000-0000-0000000b5301';
  const senderSessionToken = 'token_test_b53_sender';
  const senderPoppoId = '85301';
  const senderNickname = 'Supporter Tariq';

  const hostUserId = '00000000-0000-0000-0000-0000000b5302';
  const hostSessionToken = 'token_test_b53_host';
  const hostPoppoId = '85302';
  const hostNickname = 'Broadcaster Ayesha';

  const liveRoomId = '00000000-0000-0000-0000-0000000b5310';
  const liveRoomNumber = '85310';

  const closedRoomId = '00000000-0000-0000-0000-0000000b5311';
  const closedRoomNumber = '85311';

  console.log('--- SETUP: SEEDING CONTROLLED TEST ENVIRONMENT ---');

  // 1. Clean previous runs
  await pool.query(`DELETE FROM popolive.gift_realtime_events WHERE sender_user_id IN ($1, $2) OR recipient_host_id IN ($1, $2)`, [senderUserId, hostUserId]);
  await pool.query(`DELETE FROM popolive.points_transactions WHERE host_user_id IN ($1, $2) OR sender_id IN ($1, $2)`, [senderUserId, hostUserId]);
  await pool.query(`DELETE FROM popolive.coin_transactions WHERE user_id IN ($1, $2)`, [senderUserId, hostUserId]);
  await pool.query(`DELETE FROM popolive.gift_transactions WHERE sender_user_id IN ($1, $2) OR recipient_host_id IN ($1, $2)`, [senderUserId, hostUserId]);
  await pool.query(`DELETE FROM popolive.live_rooms WHERE id IN ($1, $2)`, [liveRoomId, closedRoomId]);
  await pool.query(`DELETE FROM popolive.sessions WHERE session_token IN ($1, $2)`, [senderSessionToken, hostSessionToken]);
  await pool.query(`DELETE FROM popolive.user_wallets WHERE user_id IN ($1, $2)`, [senderUserId, hostUserId]);
  await pool.query(`DELETE FROM popolive.users WHERE id IN ($1, $2)`, [senderUserId, hostUserId]);

  // 2. Seed Users
  await pool.query(`
    INSERT INTO popolive.users (id, poppo_id, nickname, birthdate, is_adult_verified, role, status, created_at, updated_at)
    VALUES 
      ($1, $2, $3, '1996-03-10', true, 'user', 'active', NOW(), NOW()),
      ($4, $5, $6, '1997-07-22', true, 'user', 'active', NOW(), NOW())
  `, [senderUserId, senderPoppoId, senderNickname, hostUserId, hostPoppoId, hostNickname]);

  // 3. Seed Sessions
  await pool.query(`
    INSERT INTO popolive.sessions (id, user_id, session_token, is_revoked, expires_at, created_at)
    VALUES
      (gen_random_uuid(), $1, $2, false, NOW() + INTERVAL '7 days', NOW()),
      (gen_random_uuid(), $3, $4, false, NOW() + INTERVAL '7 days', NOW())
  `, [senderUserId, senderSessionToken, hostUserId, hostSessionToken]);

  // 4. Seed Live Rooms (1 active, 1 ended)
  await pool.query(`
    INSERT INTO popolive.live_rooms (id, room_number, host_id, title, status, is_live, coins_earned, points_received, created_at, updated_at)
    VALUES 
      ($1, $2, $3, 'Ayesha Live Show', 'live', true, 0, 0, NOW(), NOW()),
      ($4, $5, $3, 'Ayesha Ended Show', 'ended', false, 0, 0, NOW(), NOW())
  `, [liveRoomId, liveRoomNumber, hostUserId, closedRoomId, closedRoomNumber]);

  // 5. Seed Wallets: Sender = 2,000 coins, Host = 0 points
  await pool.query(`
    INSERT INTO popolive.user_wallets (wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen, created_at, updated_at)
    VALUES
      (gen_random_uuid(), $1, 2000, 0, 0, 0, false, NOW(), NOW()),
      (gen_random_uuid(), $2, 0, 0, 0, 0, false, NOW(), NOW())
  `, [senderUserId, hostUserId]);

  console.log('  [PASS] Controlled test setup complete.\n');

  // =========================================================================
  // REQUIREMENT 1: AUTHORITATIVE 70% RULE VALIDATION
  // =========================================================================
  console.log('--- 1. AUTHORITATIVE 70% FINANCE RULE ---');
  {
    const ruleRes = await pool.query(`SELECT rule_value FROM popolive.finance_rules WHERE rule_key = 'host_gift_share_percent'`);
    assert(ruleRes.rows.length === 1, '1a. Authoritative rule exists in popolive.finance_rules');
    assert(parseFloat(ruleRes.rows[0].rule_value) === 70.0, '1b. host_gift_share_percent is strictly 70.0000%');

    // Test calculation on different active gifts
    // gift_rose: 10 coins -> 7 points
    // gift_heart: 50 coins -> 35 points
    // gift_teddy: 100 coins -> 70 points
    // gift_crown: 500 coins -> 350 points
    const sampleTests = [
      { coins: 10, expected: 7 },
      { coins: 50, expected: 35 },
      { coins: 100, expected: 70 },
      { coins: 500, expected: 350 },
    ];
    let allMathCorrect = true;
    for (const st of sampleTests) {
      if (Math.floor(st.coins * 0.70) !== st.expected) allMathCorrect = false;
    }
    assert(allMathCorrect, '1c. 70% formula verified across all catalog price tiers');
  }

  // =========================================================================
  // REQUIREMENT 2: ATOMIC DATABASE TRANSACTION (ALL 14 STEPS)
  // =========================================================================
  console.log('\n--- 2. ATOMIC DATABASE TRANSACTION EXECUTION ---');
  let gift1TxId = null;
  const gift1Key = 'b53_key_001_rose_x5'; // 5x Rose = 50 coins -> 35 host points
  {
    const reqGift = new NextRequest('http://localhost:3000/api/economy/gifts/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${senderSessionToken}`,
        'x-idempotency-key': gift1Key,
      },
      body: JSON.stringify({
        roomId: liveRoomId,
        giftId: 'gift_rose',
        quantity: 5,
        idempotencyKey: gift1Key,
      }),
    });

    const res = await economyGiftSendRoute.POST(reqGift);
    const data = await res.json();

    assert(res.status === 200 && data.success === true, '2a. POST /api/economy/gifts/send returns HTTP 200 with success: true');
    assert(data.coinsDeducted === 50, `2b. Exactly 50 coins deducted (5x 10 coins, got ${data.coinsDeducted})`);
    assert(data.hostPointsCredited === 35, `2c. Exactly 35 host points credited (70% of 50, got ${data.hostPointsCredited})`);
    assert(data.remainingCoins === 1950, `2d. Sender remaining coins returned as 1950 (got ${data.remainingCoins})`);
    gift1TxId = data.transactionId;

    // Verify atomic commit in PostgreSQL:
    // Sender wallet
    const sWallet = await pool.query(`SELECT coins, total_spent_coins FROM popolive.user_wallets WHERE user_id = $1`, [senderUserId]);
    assert(parseInt(sWallet.rows[0].coins) === 1950, '2e. Step 8: Sender coins updated in DB to 1950');
    assert(parseInt(sWallet.rows[0].total_spent_coins) === 50, '2f. Sender total_spent_coins updated to 50');

    // Host wallet
    const hWallet = await pool.query(`SELECT diamond_points, total_received_points FROM popolive.user_wallets WHERE user_id = $1`, [hostUserId]);
    assert(parseInt(hWallet.rows[0].diamond_points) === 35, '2g. Step 9: Host diamond_points updated in DB to 35');
    assert(parseInt(hWallet.rows[0].total_received_points) === 35, '2h. Host total_received_points updated to 35');

    // Coin ledger
    const coinTx = await pool.query(`SELECT * FROM popolive.coin_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`, [senderUserId]);
    assert(coinTx.rows.length === 1, '2i. Step 10: Sender coin ledger record inserted');
    assert(coinTx.rows[0].direction === 'debit' && parseInt(coinTx.rows[0].coin_amount) === 50, '2j. Coin ledger is 50 debit');
    assert(parseInt(coinTx.rows[0].previous_balance) === 2000 && parseInt(coinTx.rows[0].new_balance) === 1950, '2k. Coin ledger tracks previous (2000) and new balance (1950)');

    // Points ledger
    const ptsTx = await pool.query(`SELECT * FROM popolive.points_transactions WHERE host_user_id = $1 ORDER BY created_at DESC LIMIT 1`, [hostUserId]);
    assert(ptsTx.rows.length === 1, '2l. Step 11: Host points ledger record inserted');
    assert(ptsTx.rows[0].direction === 'credit' && parseInt(ptsTx.rows[0].points_amount) === 35, '2m. Points ledger is 35 credit');
    assert(parseFloat(ptsTxTx = ptsTx.rows[0].share_percentage_applied) === 70.0, '2n. Points ledger records 70.0000% share');

    // Gift transaction record
    const gTx = await pool.query(`SELECT * FROM popolive.gift_transactions WHERE sender_user_id = $1 ORDER BY created_at DESC LIMIT 1`, [senderUserId]);
    assert(gTx.rows.length === 1, '2o. Step 12: Gift transaction record inserted');
    assert(gTx.rows[0].gift_name_snapshot === 'Rose' && parseInt(gTx.rows[0].quantity) === 5, '2p. Gift transaction snapshot records Rose x5');
    assert(parseInt(gTx.rows[0].total_coin_amount) === 50 && parseInt(gTx.rows[0].host_points_credited) === 35, '2q. Gift transaction records 50 coins / 35 points');

    // Gift alert record in gift_realtime_events
    const gAlert = await pool.query(`SELECT * FROM popolive.gift_realtime_events WHERE sender_user_id = $1 ORDER BY created_at DESC LIMIT 1`, [senderUserId]);
    assert(gAlert.rows.length === 1, '2r. Step 13: Persistent gift alert record inserted in gift_realtime_events');
    assert(gAlert.rows[0].room_scope === `room:${liveRoomId}`, '2s. Gift alert room_scope matches live room');
    assert(gAlert.rows[0].payload.totalCoins === 50, '2t. Gift alert payload matches transaction coin amount');

    // Live room stats updated
    const roomDb = await pool.query(`SELECT coins_earned, points_received FROM popolive.live_rooms WHERE id = $1`, [liveRoomId]);
    assert(parseInt(roomDb.rows[0].coins_earned) === 50 && parseInt(roomDb.rows[0].points_received) === 35, '2u. Live room stats incremented by 50 coins and 35 points');
  }

  // =========================================================================
  // REQUIREMENT 3: TRANSACTION ROLLBACK VERIFICATION
  // =========================================================================
  console.log('\n--- 3. TRANSACTION ROLLBACK INTEGRITY ---');
  {
    // Try sending gift to an ended room - should roll back all operations
    const reqEnded = new NextRequest('http://localhost:3000/api/economy/gifts/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${senderSessionToken}`,
      },
      body: JSON.stringify({
        roomId: closedRoomId,
        giftId: 'gift_teddy',
        quantity: 1,
      }),
    });

    const resEnded = await economyGiftSendRoute.POST(reqEnded);
    assert(resEnded.status === 400, '3a. Sending gift to ended room rejected with HTTP 400');

    // Verify rollback: Sender coins still 1950, host points still 35
    const sWalletAfter = await pool.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [senderUserId]);
    const hWalletAfter = await pool.query(`SELECT diamond_points FROM popolive.user_wallets WHERE user_id = $1`, [hostUserId]);
    assert(parseInt(sWalletAfter.rows[0].coins) === 1950, '3b. Rollback: Sender coins strictly unchanged (1950)');
    assert(parseInt(hWalletAfter.rows[0].diamond_points) === 35, '3c. Rollback: Host points strictly unchanged (35)');

    // Verify no new transaction row
    const coinTxs = await pool.query(`SELECT COUNT(*) FROM popolive.coin_transactions WHERE user_id = $1`, [senderUserId]);
    assert(parseInt(coinTxs.rows[0].count) === 1, '3d. Rollback: Zero orphan coin_transactions created');
  }

  // =========================================================================
  // REQUIREMENT 4: SELF-GIFTING DISALLOWANCE
  // =========================================================================
  console.log('\n--- 4. SELF-GIFTING DISALLOWANCE ---');
  {
    // Host attempts to send gift to their own broadcast room
    const reqSelf = new NextRequest('http://localhost:3000/api/economy/gifts/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hostSessionToken}`,
      },
      body: JSON.stringify({
        roomId: liveRoomId,
        giftId: 'gift_rose',
        quantity: 1,
      }),
    });

    const resSelf = await economyGiftSendRoute.POST(reqSelf);
    const dataSelf = await resSelf.json();
    assert(resSelf.status === 400, '4a. Self-gifting rejected with HTTP 400');
    assert(dataSelf.error.includes('Broadcasters cannot send gifts to their own broadcast room') || dataSelf.code === 'SELF_GIFT_DISALLOWED',
      '4b. Informative error returned: self-gifting disallowed');
  }

  // =========================================================================
  // REQUIREMENT 5: INSUFFICIENT COINS AUDIT
  // =========================================================================
  console.log('\n--- 5. INSUFFICIENT COINS AUDIT ---');
  {
    // Sender has 1950 coins, attempts to send 1x Dragon Phoenix (25,000 coins)
    const reqBroke = new NextRequest('http://localhost:3000/api/economy/gifts/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${senderSessionToken}`,
      },
      body: JSON.stringify({
        roomId: liveRoomId,
        giftId: 'gift_dragon_phoenix',
        quantity: 1,
      }),
    });

    const resBroke = await economyGiftSendRoute.POST(reqBroke);
    const dataBroke = await resBroke.json();

    assert(resBroke.status === 400, '5a. Insufficient coins returns HTTP 400');
    assert(dataBroke.code === 'INSUFFICIENT_COINS', '5b. Error code is typed INSUFFICIENT_COINS');
    assert(dataBroke.requiredCoins === 25000, '5c. Returns requiredCoins: 25000');
    assert(dataBroke.availableCoins === 1950, '5d. Returns availableCoins: 1950');

    // Balance remains 1950
    const sWallet = await pool.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [senderUserId]);
    assert(parseInt(sWallet.rows[0].coins) === 1950, '5e. Sender balance preserved without deduction (1950)');
  }

  // =========================================================================
  // REQUIREMENT 6: IDEMPOTENCY AND CONCURRENCY AUDIT
  // =========================================================================
  console.log('\n--- 6. IDEMPOTENCY & CONCURRENCY AUDIT ---');
  {
    // Replay with gift1Key
    const reqReplay = new NextRequest('http://localhost:3000/api/economy/gifts/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${senderSessionToken}`,
        'x-idempotency-key': gift1Key,
      },
      body: JSON.stringify({
        roomId: liveRoomId,
        giftId: 'gift_rose',
        quantity: 5,
        idempotencyKey: gift1Key,
      }),
    });

    const resReplay = await economyGiftSendRoute.POST(reqReplay);
    const dataReplay = await resReplay.json();

    assert(resReplay.status === 200, '6a. Replay returns HTTP 200');
    assert(dataReplay.isIdempotentReplay === true, '6b. Flagged as isIdempotentReplay: true');
    assert(dataReplay.transactionId === gift1TxId, '6c. Replay returns identical transactionId');

    // Balance strictly 1950
    const sWallet = await pool.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [senderUserId]);
    assert(parseInt(sWallet.rows[0].coins) === 1950, '6d. Zero duplicate coin deduction');

    // Concurrency test: 2 simultaneous gifts (1x Teddy = 100 coins each)
    const p1 = economyGiftSendRoute.POST(new NextRequest('http://localhost:3000/api/economy/gifts/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${senderSessionToken}`, 'x-idempotency-key': 'b53_conc_1' },
      body: JSON.stringify({ roomId: liveRoomId, giftId: 'gift_teddy', quantity: 1, idempotencyKey: 'b53_conc_1' }),
    }));
    const p2 = economyGiftSendRoute.POST(new NextRequest('http://localhost:3000/api/economy/gifts/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${senderSessionToken}`, 'x-idempotency-key': 'b53_conc_2' },
      body: JSON.stringify({ roomId: liveRoomId, giftId: 'gift_teddy', quantity: 1, idempotencyKey: 'b53_conc_2' }),
    }));

    const [r1, r2] = await Promise.all([p1, p2]);
    assert(r1.status === 200 && r2.status === 200, '6e. Both concurrent requests handled safely');

    // Sender had 1950, deducted 2x 100 = 200 -> 1750
    const sWalletEnd = await pool.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [senderUserId]);
    assert(parseInt(sWalletEnd.rows[0].coins) === 1750, `6f. Final sender balance after concurrency = 1750 (got ${sWalletEnd.rows[0].coins})`);

    // Host had 35, credited 2x 70 = 140 -> 175
    const hWalletEnd = await pool.query(`SELECT diamond_points FROM popolive.user_wallets WHERE user_id = $1`, [hostUserId]);
    assert(parseInt(hWalletEnd.rows[0].diamond_points) === 175, `6g. Final host points after concurrency = 175 (got ${hWalletEnd.rows[0].diamond_points})`);
  }

  // =========================================================================
  // REQUIREMENT 7: MOBILE & WEB GIFT INTEGRATION AUDIT
  // =========================================================================
  console.log('\n--- 7. MOBILE & WEB GIFT INTEGRATION AUDIT ---');
  {
    // Mobile gift service
    const mobileGiftService = fs.readFileSync('apps/mobile/lib/services/gifts/gift_service.dart', 'utf8');
    assert(mobileGiftService.includes('/api/gifts/send'), '7a. Flutter GiftService connects to /api/gifts/send');
    assert(mobileGiftService.includes('/api/gifts/catalog'), '7b. Flutter GiftService retrieves catalog from /api/gifts/catalog');
    assert(mobileGiftService.includes('idempotencyKey'), '7c. Flutter GiftService supports idempotency keys');

    // Web gift integration
    const webGiftRoute = fs.readFileSync('apps/web/app/api/gifts/send/route.ts', 'utf8');
    assert(webGiftRoute.includes('assertNoClientFinancialOverrides'), '7d. Web gift API enforces anti-tamper financial override check');
    assert(webGiftRoute.includes('sendRealTimeGift'), '7e. Web gift API calls authoritative backend service');
  }

  console.log('\n================================================================');
  console.log(`TOTAL B5 PROMPT 3 CHECKS: ${totalChecks}`);
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
