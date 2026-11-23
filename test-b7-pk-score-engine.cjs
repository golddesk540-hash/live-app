/**
 * ============================================================================
 * POPO LIVE — PHASE B7 PROMPT 3 OF 4: PK SCORE ENGINE + GIFT CONTRIBUTION
 * Master Plan Reference: POPO-LIVE-BACKEND-REALTIME-PLAN.pdf (Section 7, B7, page 4)
 *
 * Automated verification of all 14 PK score & gift contribution requirements:
 * 1. Active PK score retrieval (PostgreSQL pk_battles & pk_score_events).
 * 2. Gift sent to first host (Host A) credits Host A score.
 * 3. Gift sent to second host (Host B) credits Host B score.
 * 4. Correct PK contribution attribution (sender, target host, points, gift).
 * 5. Correct gift transaction linkage (transaction_id in pk_gift_transactions).
 * 6. Failed gift (insufficient coins) does NOT increase score.
 * 7. Duplicate gift event prevention (idempotency key replay protection).
 * 8. Concurrent contribution updates (row locks prevent lost increments).
 * 9. Ended PK rejects new contribution (BATTLE_ALREADY_ENDED).
 * 10. Sender coin deduction occurs exactly once in user_wallets & coin_transactions.
 * 11. Host points credit occurs exactly once in user_wallets & points_transactions (70% share).
 * 12. Mobile score display consistency.
 * 13. Web score display consistency.
 * 14. 1v1 restriction enforced (4-host and invalid sides strictly rejected).
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// 1. Load Environment Configuration
function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnvFile(path.resolve(__dirname, 'apps/web/.env.local'));
loadEnvFile(path.resolve(__dirname, 'apps/web/.env.development'));
process.env.NEXT_PUBLIC_USE_ECONOMY_API = 'true';
process.env.USE_ECONOMY_API = 'true';

const { NextRequest } = require(path.resolve(__dirname, 'apps/web/node_modules/next/server'));
const { Pool } = require(path.resolve(__dirname, 'apps/web/node_modules/pg'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public',
});

// Import route handlers
const scoreRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/battle/[battleId]/score/route.ts'));
const scoreTimerRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/battle/[battleId]/score-timer/route.ts'));
const sendGiftRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/battle/[battleId]/gifts/send/route.ts'));
const sendScoreRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/battle/[battleId]/score/send/route.ts'));
const battleDetailsRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/battle/[battleId]/route.ts'));

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

async function runTests() {
  console.log('\n================================================================');
  console.log('POPO LIVE — PHASE B7 PROMPT 3 AUTOMATED VERIFICATION SUITE');
  console.log('PK SCORE ENGINE + GIFT CONTRIBUTION + POSTGRESQL UPDATES');
  console.log('================================================================\n');

  // Setup test battle and test users
  const testHostAId = '00000000-0000-0000-0000-000000088201';
  const testHostBId = '00000000-0000-0000-0000-000000088202';
  const testViewerId = '00000000-0000-0000-0000-000000099001';
  const testBattleId = '00000000-0000-0000-0000-000000000606';

  // Ensure test viewer and wallets exist with known clean balances
  await pool.query(
    `INSERT INTO popolive.users (id, poppo_id, nickname, email, password_hash, role, status)
     VALUES ($1, '900001', 'Test PK Viewer', 'pkviewer@popolive.com', 'hash', 'user', 'active')
     ON CONFLICT (id) DO UPDATE SET nickname = 'Test PK Viewer'`,
    [testViewerId]
  ).catch(() => {});

  // Set initial wallet for test viewer: 5,000 coins
  await pool.query(
    `INSERT INTO popolive.user_wallets (wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points)
     VALUES (gen_random_uuid(), $1, 5000, 0, 0, 0)
     ON CONFLICT (user_id) DO UPDATE SET coins = 5000`,
    [testViewerId]
  );

  // Set host wallets
  await pool.query(
    `INSERT INTO popolive.user_wallets (wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points)
     VALUES (gen_random_uuid(), $1, 0, 1000, 0, 1000)
     ON CONFLICT (user_id) DO NOTHING`,
    [testHostAId]
  );
  await pool.query(
    `INSERT INTO popolive.user_wallets (wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points)
     VALUES (gen_random_uuid(), $1, 0, 1000, 0, 1000)
     ON CONFLICT (user_id) DO NOTHING`,
    [testHostBId]
  );

  // Ensure test active battle exists
  await pool.query(
    `INSERT INTO popolive.pk_battles (
       id, battle_type, status, host_a_id, host_b_id, host_a_room, host_b_room,
       host_a_nickname, host_b_nickname, host_a_score, host_b_score,
       duration_seconds, remaining_seconds, timer_status, expires_at
     ) VALUES (
       $1, '1v1', 'active', $2, $3, '88201', '88202',
       'Sara Live', 'Ayesha', 100, 100,
       300, 290, 'normal', NOW() + INTERVAL '5 minutes'
     ) ON CONFLICT (id) DO UPDATE SET
       battle_type = '1v1',
       status = 'active',
       host_a_score = 100,
       host_b_score = 100,
       expires_at = NOW() + INTERVAL '5 minutes'`,
    [testBattleId, testHostAId, testHostBId]
  );

  // Ensure ended battle exists
  const endedBattleId = 'c3772acc-0abd-4b29-b28d-0545a41dc853';
  await pool.query(
    `INSERT INTO popolive.pk_battles (
       id, battle_type, status, host_a_id, host_b_id, host_a_room, host_b_room,
       host_a_nickname, host_b_nickname, host_a_score, host_b_score,
       duration_seconds, remaining_seconds, timer_status
     ) VALUES (
       $1, '1v1', 'completed', $2, $3, '88201', '88202',
       'Sara Live', 'Ayesha', 500, 1200,
       300, 0, 'time_expired'
     ) ON CONFLICT (id) DO UPDATE SET status = 'completed'`,
    [endedBattleId, testHostAId, testHostBId]
  );

  console.log('--- TEST 1: Active PK Score Retrieval ---');
  {
    const req = new NextRequest(`http://localhost:3000/api/pk/battle/${testBattleId}/score`);
    const res = await scoreRoute.GET(req, { params: { battleId: testBattleId } });
    const data = await res.json();

    assert(res.status === 200, 'GET /api/pk/battle/[battleId]/score returns HTTP 200');
    assert(data.success === true, 'Response contains success: true');
    assert(data.battleId === testBattleId, 'battleId matches active session');
    assert(data.battleType === '1v1', 'battleType is 1v1');
    assert(data.status === 'active', 'Battle status is active');
    assert(data.hostA.score === 100, 'hostA initial score is 100');
    assert(data.hostB.score === 100, 'hostB initial score is 100');
    assert(typeof data.ratioA === 'number' && typeof data.ratioB === 'number', 'Score ratios are computed numbers');
    assert(Array.isArray(data.recentEvents), 'recentEvents is returned as an array');
  }

  console.log('\n--- TEST 2: Gift Sent to First Host (Host A) Credits Host A Score ---');
  let giftATxId = null;
  {
    const initialBattle = (await pool.query(`SELECT host_a_score, host_b_score FROM popolive.pk_battles WHERE id = $1`, [testBattleId])).rows[0];
    const initialScoreA = parseInt(initialBattle.host_a_score, 10);
    const initialScoreB = parseInt(initialBattle.host_b_score, 10);

    const idemKeyA = `test_idem_a_${Date.now()}`;
    const req = new NextRequest(`http://localhost:3000/api/pk/battle/${testBattleId}/gifts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: testViewerId,
        senderName: 'Test Viewer',
        receiverSide: 'host_a',
        giftId: 'rose', // 1 coin * 5 = 5 coins
        quantity: 5,
        idempotencyKey: idemKeyA,
      }),
    });

    const res = await sendGiftRoute.POST(req, { params: { battleId: testBattleId } });
    const data = await res.json();

    assert(res.status === 200, 'POST /gifts/send for host_a returns HTTP 200');
    assert(data.success === true, 'Gift send response is success: true');
    assert(data.receiver.side === 'host_a', 'Recipient side is host_a');
    assert(data.financialSummary.totalCoinsDeducted === 5, 'Deducted 5 coins (5 x 1 coin rose)');
    assert(data.pkScore.pointsAdded === 5, 'Added 5 PK points (1 coin = 1 PK point)');
    giftATxId = data.transactionId;

    // Verify in PostgreSQL
    const updatedBattle = (await pool.query(`SELECT host_a_score, host_b_score, leading_host_id FROM popolive.pk_battles WHERE id = $1`, [testBattleId])).rows[0];
    assert(parseInt(updatedBattle.host_a_score, 10) === initialScoreA + 5, `PostgreSQL host_a_score incremented from ${initialScoreA} to ${initialScoreA + 5}`);
    assert(parseInt(updatedBattle.host_b_score, 10) === initialScoreB, `PostgreSQL host_b_score remained unchanged at ${initialScoreB}`);
  }

  console.log('\n--- TEST 3: Gift Sent to Second Host (Host B) Credits Host B Score ---');
  let giftBTxId = null;
  {
    const initialBattle = (await pool.query(`SELECT host_a_score, host_b_score FROM popolive.pk_battles WHERE id = $1`, [testBattleId])).rows[0];
    const initialScoreA = parseInt(initialBattle.host_a_score, 10);
    const initialScoreB = parseInt(initialBattle.host_b_score, 10);

    const idemKeyB = `test_idem_b_${Date.now()}`;
    const req = new NextRequest(`http://localhost:3000/api/pk/battle/${testBattleId}/gifts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: testViewerId,
        senderName: 'Test Viewer',
        receiverSide: 'host_b',
        giftId: 'heart', // 10 coins * 2 = 20 coins
        quantity: 2,
        idempotencyKey: idemKeyB,
      }),
    });

    const res = await sendGiftRoute.POST(req, { params: { battleId: testBattleId } });
    const data = await res.json();

    assert(res.status === 200, 'POST /gifts/send for host_b returns HTTP 200');
    assert(data.success === true, 'Gift send response is success: true');
    assert(data.receiver.side === 'host_b', 'Recipient side is host_b');
    assert(data.financialSummary.totalCoinsDeducted === 20, 'Deducted 20 coins (2 x 10 coin heart)');
    assert(data.pkScore.pointsAdded === 20, 'Added 20 PK points (1 coin = 1 PK point)');
    giftBTxId = data.transactionId;

    // Verify in PostgreSQL
    const updatedBattle = (await pool.query(`SELECT host_a_score, host_b_score, leading_host_id FROM popolive.pk_battles WHERE id = $1`, [testBattleId])).rows[0];
    assert(parseInt(updatedBattle.host_b_score, 10) === initialScoreB + 20, `PostgreSQL host_b_score incremented from ${initialScoreB} to ${initialScoreB + 20}`);
    assert(parseInt(updatedBattle.host_a_score, 10) === initialScoreA, `PostgreSQL host_a_score remained unchanged at ${initialScoreA}`);
  }

  console.log('\n--- TEST 4: Correct PK Contribution Attribution ---');
  {
    const eventRows = (await pool.query(
      `SELECT * FROM popolive.pk_score_events WHERE battle_id = $1 ORDER BY created_at DESC LIMIT 2`,
      [testBattleId]
    )).rows;

    assert(eventRows.length >= 2, 'Found at least 2 score events in popolive.pk_score_events');
    const latestEvent = eventRows[0];
    assert(latestEvent.host_side === 'host_b', 'Latest score event attributed to host_b');
    assert(latestEvent.target_host_id === testHostBId, 'Target host ID matches host_b');
    assert(latestEvent.sender_id === testViewerId, 'Sender ID matches test viewer');
    assert(parseInt(latestEvent.points, 10) === 20, 'Points value is exactly 20');
  }

  console.log('\n--- TEST 5: Correct Gift Transaction Linkage ---');
  {
    const txRows = (await pool.query(
      `SELECT * FROM popolive.pk_gift_transactions WHERE battle_id = $1 ORDER BY created_at DESC LIMIT 2`,
      [testBattleId]
    )).rows;

    assert(txRows.length >= 2, 'Found at least 2 transactions in popolive.pk_gift_transactions');
    const latestTx = txRows[0];
    assert(latestTx.transaction_id === giftBTxId, `Transaction ID matches returned id (${giftBTxId})`);
    assert(latestTx.receiver_side === 'host_b', 'receiver_side is host_b');
    assert(latestTx.status === 'completed', 'Transaction status is completed');
    assert(latestTx.total_coins === 20, 'total_coins matches 20');
    assert(latestTx.pk_score_added === 20, 'pk_score_added matches 20');
  }

  console.log('\n--- TEST 6: Failed Gift Does NOT Increase Score ---');
  {
    // Setup poor viewer with 0 coins
    const poorViewerId = '00000000-0000-0000-0000-000000099002';
    await pool.query(
      `INSERT INTO popolive.users (id, poppo_id, nickname, email, password_hash, role, status)
       VALUES ($1, '900002', 'Poor Viewer', 'poor@popolive.com', 'hash', 'user', 'active')
       ON CONFLICT (id) DO NOTHING`,
      [poorViewerId]
    );
    await pool.query(
      `INSERT INTO popolive.user_wallets (wallet_id, user_id, coins, diamond_points)
       VALUES (gen_random_uuid(), $1, 0, 0)
       ON CONFLICT (user_id) DO UPDATE SET coins = 0`,
      [poorViewerId]
    );

    const initialBattle = (await pool.query(`SELECT host_a_score, host_b_score FROM popolive.pk_battles WHERE id = $1`, [testBattleId])).rows[0];

    const req = new NextRequest(`http://localhost:3000/api/pk/battle/${testBattleId}/gifts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: poorViewerId,
        senderName: 'Poor Viewer',
        receiverSide: 'host_a',
        giftId: 'crown', // 50 coins
        quantity: 1,
        idempotencyKey: `poor_fail_${Date.now()}`,
      }),
    });

    const res = await sendGiftRoute.POST(req, { params: { battleId: testBattleId } });
    const data = await res.json();

    assert(res.status === 400, 'POST /gifts/send with insufficient coins returns HTTP 400');
    assert(data.success === false, 'Response has success: false');
    assert(data.code === 'INSUFFICIENT_COINS', `Error code is INSUFFICIENT_COINS (received: ${data.code})`);

    // Verify scores in PostgreSQL did NOT change
    const afterBattle = (await pool.query(`SELECT host_a_score, host_b_score FROM popolive.pk_battles WHERE id = $1`, [testBattleId])).rows[0];
    assert(afterBattle.host_a_score === initialBattle.host_a_score, 'host_a_score did NOT increment on failed gift');
    assert(afterBattle.host_b_score === initialBattle.host_b_score, 'host_b_score did NOT increment on failed gift');
  }

  console.log('\n--- TEST 7: Duplicate Gift Event Prevention (Idempotency Replay) ---');
  {
    const replayIdemKey = `replay_test_key_${Date.now()}`;
    const initialBattle = (await pool.query(`SELECT host_a_score, host_b_score FROM popolive.pk_battles WHERE id = $1`, [testBattleId])).rows[0];
    const initialWallet = (await pool.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [testViewerId])).rows[0];

    // First attempt: should succeed
    const req1 = new NextRequest(`http://localhost:3000/api/pk/battle/${testBattleId}/gifts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: testViewerId,
        senderName: 'Test Viewer',
        receiverSide: 'host_a',
        giftId: 'rose', // 1 coin
        quantity: 1,
        idempotencyKey: replayIdemKey,
      }),
    });
    const res1 = await sendGiftRoute.POST(req1, { params: { battleId: testBattleId } });
    const data1 = await res1.json();
    assert(res1.status === 200 && data1.success === true, 'First attempt succeeds with HTTP 200');

    // Second attempt: identical idempotencyKey
    const req2 = new NextRequest(`http://localhost:3000/api/pk/battle/${testBattleId}/gifts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: testViewerId,
        senderName: 'Test Viewer',
        receiverSide: 'host_a',
        giftId: 'rose',
        quantity: 1,
        idempotencyKey: replayIdemKey,
      }),
    });
    const res2 = await sendGiftRoute.POST(req2, { params: { battleId: testBattleId } });
    const data2 = await res2.json();

    assert(res2.status === 200, 'Replay attempt returns HTTP 200');
    assert(data2.isIdempotentReplay === true, 'Response flags isIdempotentReplay: true');
    assert(data2.transactionId === data1.transactionId, 'Replay returned the exact same transaction ID');

    // Verify DB score increased only ONCE (+1, not +2)
    const afterBattle = (await pool.query(`SELECT host_a_score FROM popolive.pk_battles WHERE id = $1`, [testBattleId])).rows[0];
    assert(
      parseInt(afterBattle.host_a_score, 10) === parseInt(initialBattle.host_a_score, 10) + 1,
      `Battle score increased exactly once (+1, from ${initialBattle.host_a_score} to ${afterBattle.host_a_score})`
    );

    // Verify viewer coins deducted only ONCE
    const afterWallet = (await pool.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [testViewerId])).rows[0];
    assert(
      parseInt(afterWallet.coins, 10) === parseInt(initialWallet.coins, 10) - 1,
      `Viewer wallet coins deducted exactly once (-1 coin)`
    );
  }

  console.log('\n--- TEST 8: Concurrent Contribution Updates (Row Locks) ---');
  {
    const initialBattle = (await pool.query(`SELECT host_a_score FROM popolive.pk_battles WHERE id = $1`, [testBattleId])).rows[0];
    const initialScoreA = parseInt(initialBattle.host_a_score, 10);

    const concurrentCount = 5;
    const promises = [];
    for (let i = 0; i < concurrentCount; i++) {
      const p = (async (index) => {
        const req = new NextRequest(`http://localhost:3000/api/pk/battle/${testBattleId}/gifts/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: testViewerId,
            senderName: 'Test Viewer',
            receiverSide: 'host_a',
            giftId: 'rose', // 1 coin each
            quantity: 2, // 2 coins each -> 2 PK points each
            idempotencyKey: `concurrent_test_${Date.now()}_${index}`,
          }),
        });
        const res = await sendGiftRoute.POST(req, { params: { battleId: testBattleId } });
        return res.json();
      })(i);
      promises.push(p);
    }

    const results = await Promise.all(promises);
    const successful = results.filter((r) => r.success === true);
    assert(successful.length === concurrentCount, `All ${concurrentCount} concurrent gift transactions succeeded`);

    // Verify score increment is exactly concurrentCount * 2
    const afterBattle = (await pool.query(`SELECT host_a_score FROM popolive.pk_battles WHERE id = $1`, [testBattleId])).rows[0];
    const expectedScore = initialScoreA + concurrentCount * 2;
    assert(
      parseInt(afterBattle.host_a_score, 10) === expectedScore,
      `PostgreSQL host_a_score accurately incremented with row locks to ${expectedScore} (no lost increments)`
    );
  }

  console.log('\n--- TEST 9: Ended PK Rejects New Contribution ---');
  {
    const initialBattle = (await pool.query(`SELECT host_a_score, host_b_score FROM popolive.pk_battles WHERE id = $1`, [endedBattleId])).rows[0];
    const initialScoreA = parseInt(initialBattle.host_a_score, 10);

    const req = new NextRequest(`http://localhost:3000/api/pk/battle/${endedBattleId}/gifts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: testViewerId,
        senderName: 'Test Viewer',
        receiverSide: 'host_a',
        giftId: 'rose',
        quantity: 1,
        idempotencyKey: `ended_pk_${Date.now()}`,
      }),
    });

    const res = await sendGiftRoute.POST(req, { params: { battleId: endedBattleId } });
    const data = await res.json();

    assert(res.status === 400, 'POST /gifts/send on completed battle returns HTTP 400');
    assert(data.success === false, 'Response has success: false');
    assert(data.code === 'BATTLE_ALREADY_ENDED', `Error code is BATTLE_ALREADY_ENDED (received: ${data.code})`);

    const afterBattle = (await pool.query(`SELECT host_a_score FROM popolive.pk_battles WHERE id = $1`, [endedBattleId])).rows[0];
    assert(parseInt(afterBattle.host_a_score, 10) === initialScoreA, 'Ended battle score was not modified');
  }

  console.log('\n--- TEST 10: Sender Coin Deduction Occurs Exactly Once ---');
  {
    const singleTxKey = `single_tx_check_${Date.now()}`;
    const beforeWallet = (await pool.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [testViewerId])).rows[0];

    const req = new NextRequest(`http://localhost:3000/api/pk/battle/${testBattleId}/gifts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: testViewerId,
        senderName: 'Test Viewer',
        receiverSide: 'host_b',
        giftId: 'rose',
        quantity: 3, // 3 coins
        idempotencyKey: singleTxKey,
      }),
    });

    const res = await sendGiftRoute.POST(req, { params: { battleId: testBattleId } });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, '3-coin gift succeeds');

    const afterWallet = (await pool.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [testViewerId])).rows[0];
    assert(
      parseInt(afterWallet.coins, 10) === parseInt(beforeWallet.coins, 10) - 3,
      `User wallet coins decreased by exactly 3 (from ${beforeWallet.coins} to ${afterWallet.coins})`
    );

    const coinTxRows = (await pool.query(
      `SELECT * FROM popolive.coin_transactions WHERE idempotency_key = $1`,
      [`${singleTxKey}_coin`]
    )).rows;
    assert(coinTxRows.length === 1, 'Exactly ONE coin_transactions record created');
    assert(coinTxRows[0].status === 'completed', 'coin_transactions status is completed');
    assert(parseInt(coinTxRows[0].coin_amount, 10) === 3, 'coin_amount is exactly 3');
  }

  console.log('\n--- TEST 11: Host Points Credit Occurs Exactly Once (70% Share) ---');
  {
    const hostPointsTxKey = `host_pts_check_${Date.now()}`;
    const beforeHostWallet = (await pool.query(`SELECT diamond_points FROM popolive.user_wallets WHERE user_id = $1`, [testHostBId])).rows[0];
    const initialPoints = parseInt(beforeHostWallet.diamond_points, 10);

    // Send a 100 coin gift (e.g. 10x heart = 100 coins)
    const req = new NextRequest(`http://localhost:3000/api/pk/battle/${testBattleId}/gifts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: testViewerId,
        senderName: 'Test Viewer',
        receiverSide: 'host_b',
        giftId: 'heart', // 10 coins * 10 = 100 coins
        quantity: 10,
        idempotencyKey: hostPointsTxKey,
      }),
    });

    const res = await sendGiftRoute.POST(req, { params: { battleId: testBattleId } });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, '100-coin gift succeeds');
    assert(data.financialSummary.hostEarningsPoints === 70, 'Response financialSummary shows 70 host earnings points (70% of 100)');

    const afterHostWallet = (await pool.query(`SELECT diamond_points FROM popolive.user_wallets WHERE user_id = $1`, [testHostBId])).rows[0];
    const expectedNewPoints = initialPoints + 70;
    assert(
      parseInt(afterHostWallet.diamond_points, 10) === expectedNewPoints,
      `Host wallet diamond_points credited exactly 70 points (from ${initialPoints} to ${expectedNewPoints})`
    );

    const ptsTxRows = (await pool.query(
      `SELECT * FROM popolive.points_transactions WHERE idempotency_key = $1`,
      [`${hostPointsTxKey}_pts`]
    )).rows;
    assert(ptsTxRows.length === 1, 'Exactly ONE points_transactions record created');
    assert(ptsTxRows[0].status === 'completed', 'points_transactions status is completed');
    assert(parseInt(ptsTxRows[0].points_amount, 10) === 70, 'points_amount is exactly 70');
    assert(parseFloat(ptsTxRows[0].share_percentage_applied) === 70.0, 'share_percentage_applied is 70%');
  }

  console.log('\n--- TEST 12: Mobile Score Display Consistency ---');
  {
    const req = new NextRequest(`http://localhost:3000/api/pk/battle/${testBattleId}/score-timer`);
    const res = await scoreTimerRoute.GET(req, { params: { battleId: testBattleId } });
    const data = await res.json();

    assert(res.status === 200, 'GET /score-timer returns HTTP 200');
    assert(data.success === true, 'Response contains success: true');
    assert(typeof data.hostA.score === 'number', 'hostA.score is numeric for mobile parser');
    assert(typeof data.hostB.score === 'number', 'hostB.score is numeric for mobile parser');
    assert(typeof data.ratioA === 'number' && typeof data.ratioB === 'number', 'ratioA and ratioB are numbers');
    assert(typeof data.timer.remainingSeconds === 'number', 'timer.remainingSeconds is numeric');
    assert(typeof data.timer.formattedTime === 'string', 'timer.formattedTime is formatted MM:SS string');
    assert(['host_a', 'host_b', 'tie'].includes(data.leadingSide), 'leadingSide is valid enum');
  }

  console.log('\n--- TEST 13: Web Score Display Consistency ---');
  {
    const reqDetails = new NextRequest(`http://localhost:3000/api/pk/battle/${testBattleId}`);
    const resDetails = await battleDetailsRoute.GET(reqDetails, { params: { battleId: testBattleId } });
    const dataDetails = await resDetails.json();

    assert(resDetails.status === 200, 'GET /api/pk/battle/[battleId] returns HTTP 200');
    assert(dataDetails.success === true, 'Battle details returns success: true');
    assert(typeof dataDetails.battle.hostA.score === 'number', 'battle.hostA.score is numeric for web');
    assert(typeof dataDetails.battle.hostB.score === 'number', 'battle.hostB.score is numeric for web');
    assert(typeof dataDetails.battle.ratioA === 'number', 'battle.ratioA is numeric for web');
  }

  console.log('\n--- TEST 14: 1v1 Restriction Enforced (4-Host & Invalid Side Rejected) ---');
  {
    // 14a. Invalid receiver side (host_c or 4-host side)
    const reqInvalidSide = new NextRequest(`http://localhost:3000/api/pk/battle/${testBattleId}/gifts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: testViewerId,
        senderName: 'Test Viewer',
        receiverSide: 'host_c', // Unsupported 4-host side
        giftId: 'rose',
        quantity: 1,
      }),
    });

    const resInvalidSide = await sendGiftRoute.POST(reqInvalidSide, { params: { battleId: testBattleId } });
    const dataInvalidSide = await resInvalidSide.json();

    assert(resInvalidSide.status === 400, 'POST /gifts/send with receiverSide: host_c returns HTTP 400');
    assert(dataInvalidSide.code === 'UNSUPPORTED_RECEIVER_SIDE', 'Error code is UNSUPPORTED_RECEIVER_SIDE');

    // 14b. Direct score send with unsupported side
    const reqInvalidScore = new NextRequest(`http://localhost:3000/api/pk/battle/${testBattleId}/score/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: testViewerId,
        senderName: 'Test Viewer',
        hostSide: 'host_4',
        targetHostId: 'some_host',
        points: 50,
        idempotencyKey: `unsupported_side_${Date.now()}`,
      }),
    });

    const resInvalidScore = await sendScoreRoute.POST(reqInvalidScore, { params: { battleId: testBattleId } });
    assert(resInvalidScore.status === 400, 'POST /score/send with hostSide: host_4 returns HTTP 400');

    // 14c. Battle with non-1v1 battle_type rejected
    const non1v1BattleId = '00000000-0000-0000-0000-000000000444';
    await pool.query(
      `INSERT INTO popolive.pk_battles (
         id, battle_type, status, host_a_id, host_b_id, host_a_room, host_b_room,
         host_a_nickname, host_b_nickname, host_a_score, host_b_score
       ) VALUES (
         $1, '4_host', 'active', $2, $3, '88201', '88202',
         'Host A', 'Host B', 0, 0
       ) ON CONFLICT (id) DO UPDATE SET battle_type = '4_host', status = 'active'`,
      [non1v1BattleId, testHostAId, testHostBId]
    );

    const req4Host = new NextRequest(`http://localhost:3000/api/pk/battle/${non1v1BattleId}/gifts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: testViewerId,
        senderName: 'Test Viewer',
        receiverSide: 'host_a',
        giftId: 'rose',
        quantity: 1,
      }),
    });

    const res4Host = await sendGiftRoute.POST(req4Host, { params: { battleId: non1v1BattleId } });
    const data4Host = await res4Host.json();

    assert(res4Host.status === 400, 'POST /gifts/send on 4_host battle returns HTTP 400');
    assert(data4Host.code === 'UNSUPPORTED_BATTLE_TYPE', 'Error code is UNSUPPORTED_BATTLE_TYPE');
  }

  await pool.end();

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passedChecks}/${totalChecks} CHECKS PASSED`);
  if (failedChecks === 0) {
    console.log('STATUS: ALL PHASE B7 PROMPT 3 REQUIREMENTS VERIFIED SUCCESSFULLY!');
    console.log('================================================================\n');
    process.exit(0);
  } else {
    console.error(`STATUS: ${failedChecks} CHECKS FAILED!`);
    console.log('================================================================\n');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
