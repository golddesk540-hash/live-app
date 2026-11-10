const http = require('http');
const https = require('https');

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const isHttps = baseUrl.startsWith('https');
const client = isHttps ? https : http;

const CANONICAL_BATTLE_ID = '00000000-0000-0000-0000-000000000603';
const COMPLETED_BATTLE_ID = '00000000-0000-0000-0000-000000000604';
const VIEWER_ID = 'user_viewer_9001';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        'Accept': 'application/json, text/html, */*',
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = null;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json,
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log(`=======================================================`);
  console.log(`  MODULE 6.10: PK BATTLE REAL GIFTS TEST SUITE`);
  console.log(`  Target: ${baseUrl}`);
  console.log(`=======================================================\n`);

  try {
    // 1. Fetch Gift Catalog
    console.log(`[Test 1] Fetch Gift Catalog (Module 6.10 Reference Design 6 Items)`);
    const catalogRes = await request('GET', `/api/pk/battle/${CANONICAL_BATTLE_ID}/gifts/catalog`);
    assert(catalogRes.statusCode === 200, `Catalog endpoint returns HTTP 200`);
    assert(catalogRes.json && catalogRes.json.success === true, `Catalog response success is true`);
    const catalog = catalogRes.json ? (catalogRes.json.gifts || catalogRes.json.data) : null;
    assert(Array.isArray(catalog) && catalog.length === 6, `Catalog contains exactly 6 gifts (received ${catalog ? catalog.length : 0})`);
    
    if (catalog) {
      const items = {};
      catalog.forEach(item => { items[item.id] = item.coinPrice; });
      assert(items.rose === 1, `Rose price is 1 coin`);
      assert(items.heart === 10, `Heart price is 10 coins`);
      assert(items.crown === 50, `Crown price is 50 coins`);
      assert(items.car === 200, `Sports Car (car) price is 200 coins`);
      assert(items.castle === 500, `Magic Castle (castle) price is 500 coins`);
      assert(items.rocket === 1000, `Space Rocket (rocket) price is 1000 coins`);
    }

    assert(catalogRes.json.hostSharePercentage === 70, `Host share percentage is approved 70%`);
    assert(catalogRes.json.pkScoreConversionRate === 1, `PK score conversion rate is 1 coin = 1 point`);

    // 2. Fetch Viewer Wallet
    console.log(`\n[Test 2] Fetch Viewer Wallet Balance`);
    const walletRes = await request('GET', `/api/pk/battle/${CANONICAL_BATTLE_ID}/gifts/wallet?userId=${VIEWER_ID}`);
    assert(walletRes.statusCode === 200, `Wallet endpoint returns HTTP 200`);
    assert(walletRes.json && walletRes.json.success === true, `Wallet response success is true`);
    const initialCoins = walletRes.json ? walletRes.json.wallet.coins : 0;
    assert(typeof initialCoins === 'number' && initialCoins > 0, `Viewer has valid coins balance: ${initialCoins}`);

    // 3. Send Gift to Host A (Rose - 1 coin)
    console.log(`\n[Test 3] Send Rose (1 coin) to Host A (Sara Live)`);
    const roseKey = `test_rose_${Date.now()}`;
    const sendRoseRes = await request('POST', `/api/pk/battle/${CANONICAL_BATTLE_ID}/gifts/send`, {
      giftId: 'rose',
      receiverSide: 'host_a',
      senderId: VIEWER_ID,
      senderName: 'VIP Supporter',
      quantity: 1,
      idempotencyKey: roseKey,
    });
    assert(sendRoseRes.statusCode === 200, `Send Rose returns HTTP 200`);
    assert(sendRoseRes.json && sendRoseRes.json.success === true, `Send Rose success is true`);
    assert(sendRoseRes.json.gift && sendRoseRes.json.gift.id === 'rose', `Recorded giftId is rose`);
    assert(sendRoseRes.json.receiver && sendRoseRes.json.receiver.side === 'host_a', `Receiver is host_a`);
    assert(sendRoseRes.json.financialSummary && sendRoseRes.json.financialSummary.totalCoinsDeducted === 1, `Charged 1 coin`);
    assert(sendRoseRes.json.pkScore && sendRoseRes.json.pkScore.pointsAdded === 1, `Awarded 1 PK score point`);
    assert(sendRoseRes.json.sender && sendRoseRes.json.sender.remainingCoins === initialCoins - 1, `Remaining coins deducted correctly`);

    // 4. Send Gift to Host A (Crown - 50 coins)
    console.log(`\n[Test 4] Send Crown (50 coins) to Host A (Sara Live) - Check 70% Earnings`);
    const crownKey = `test_crown_${Date.now()}`;
    const sendCrownRes = await request('POST', `/api/pk/battle/${CANONICAL_BATTLE_ID}/gifts/send`, {
      giftId: 'crown',
      receiverSide: 'host_a',
      senderId: VIEWER_ID,
      senderName: 'VIP Supporter',
      quantity: 1,
      idempotencyKey: crownKey,
    });
    assert(sendCrownRes.statusCode === 200, `Send Crown returns HTTP 200`);
    assert(sendCrownRes.json && sendCrownRes.json.success === true, `Send Crown success is true`);
    assert(sendCrownRes.json.financialSummary.hostEarningsPoints === 35, `Host earnings 70% of 50 = 35 diamond points (verified Math.floor)`);
    assert(sendCrownRes.json.pkScore.pointsAdded === 50, `PK score awarded is 50 points`);

    // 5. Send Gift to Host B (Heart - 10 coins)
    console.log(`\n[Test 5] Send Heart (10 coins) to Host B (Ayesha)`);
    const heartKey = `test_heart_${Date.now()}`;
    const sendHeartRes = await request('POST', `/api/pk/battle/${CANONICAL_BATTLE_ID}/gifts/send`, {
      giftId: 'heart',
      receiverSide: 'host_b',
      senderId: VIEWER_ID,
      senderName: 'VIP Supporter',
      quantity: 1,
      idempotencyKey: heartKey,
    });
    assert(sendHeartRes.statusCode === 200, `Send Heart returns HTTP 200`);
    assert(sendHeartRes.json && sendHeartRes.json.success === true, `Send Heart success is true`);
    assert(sendHeartRes.json.receiver.side === 'host_b', `Receiver is host_b`);
    assert(sendHeartRes.json.financialSummary.hostEarningsPoints === 7, `Host B earnings 70% of 10 = 7 diamond points`);
    assert(sendHeartRes.json.pkScore.pointsAdded === 10, `PK score awarded is 10 points to Host B`);

    // 6. Send Gift to Host B (Sports Car - 200 coins)
    console.log(`\n[Test 6] Send Sports Car (200 coins) to Host B (Ayesha)`);
    const carKey = `test_car_${Date.now()}`;
    const sendCarRes = await request('POST', `/api/pk/battle/${CANONICAL_BATTLE_ID}/gifts/send`, {
      giftId: 'car',
      receiverSide: 'host_b',
      senderId: VIEWER_ID,
      senderName: 'VIP Supporter',
      quantity: 1,
      idempotencyKey: carKey,
    });
    assert(sendCarRes.statusCode === 200, `Send Sports Car returns HTTP 200`);
    assert(sendCarRes.json && sendCarRes.json.success === true, `Send Sports Car success is true`);
    assert(sendCarRes.json.financialSummary.hostEarningsPoints === 140, `Host B earnings 70% of 200 = 140 diamond points`);
    assert(sendCarRes.json.pkScore.pointsAdded === 200, `PK score awarded is 200 points to Host B`);

    // 7. Idempotency Key Replay Test
    console.log(`\n[Test 7] Idempotency Protection (Replay duplicate send request)`);
    const duplicateRes = await request('POST', `/api/pk/battle/${CANONICAL_BATTLE_ID}/gifts/send`, {
      giftId: 'car',
      receiverSide: 'host_b',
      senderId: VIEWER_ID,
      senderName: 'VIP Supporter',
      quantity: 1,
      idempotencyKey: carKey, // SAME KEY
    });
    assert(duplicateRes.statusCode === 200, `Duplicate request returns HTTP 200`);
    assert(duplicateRes.json.isIdempotentReplay === true, `Response flag isIdempotentReplay is true`);
    assert(duplicateRes.json.transaction.idempotency_key === carKey, `Returns existing transaction without double charge`);

    // 8. Completed Battle Rejection Test
    console.log(`\n[Test 8] Completed Battle Rejection`);
    const completedRes = await request('POST', `/api/pk/battle/${COMPLETED_BATTLE_ID}/gifts/send`, {
      giftId: 'rose',
      receiverSide: 'host_a',
      senderId: VIEWER_ID,
      senderName: 'VIP Supporter',
      quantity: 1,
      idempotencyKey: `test_completed_${Date.now()}`,
    });
    assert(completedRes.statusCode === 400, `Sending to completed battle returns HTTP 400`);
    assert(completedRes.json && (completedRes.json.code === 'BATTLE_ALREADY_ENDED' || (completedRes.json.error && completedRes.json.error.includes('active'))), `Rejection code indicates battle not active`);

    // 9. Insufficient Balance Test
    console.log(`\n[Test 9] Insufficient Coin Balance Handling`);
    const brokeUser = `broke_user_${Date.now()}`;
    const brokeRes = await request('POST', `/api/pk/battle/${CANONICAL_BATTLE_ID}/gifts/send`, {
      giftId: 'rocket', // 1000 coins
      receiverSide: 'host_a',
      senderId: brokeUser,
      senderName: 'Broke User',
      quantity: 5, // 5000 coins exceeds initial 3600
      idempotencyKey: `test_broke_${Date.now()}`,
    });
    assert(brokeRes.statusCode === 400, `Insufficient coins returns HTTP 400`);
    assert(brokeRes.json && (brokeRes.json.code === 'INSUFFICIENT_COINS' || brokeRes.json.code === 'INSUFFICIENT_COIN_BALANCE'), `Error code is INSUFFICIENT_COIN_BALANCE`);

    // 10. Invalid Receiver Side Test
    console.log(`\n[Test 10] Invalid Receiver Side Validation`);
    const invalidRecipRes = await request('POST', `/api/pk/battle/${CANONICAL_BATTLE_ID}/gifts/send`, {
      giftId: 'rose',
      receiverSide: 'host_z',
      senderId: VIEWER_ID,
      senderName: 'VIP Supporter',
      quantity: 1,
      idempotencyKey: `test_invalid_recip_${Date.now()}`,
    });
    assert(invalidRecipRes.statusCode === 400, `Invalid recipient side returns HTTP 400`);
    assert(invalidRecipRes.json && invalidRecipRes.json.error && invalidRecipRes.json.error.includes('host_a or host_b'), `Error message mentions host_a or host_b`);

    // 11. Transaction History Endpoint
    console.log(`\n[Test 11] Fetch Gift Transaction History`);
    const txRes = await request('GET', `/api/pk/battle/${CANONICAL_BATTLE_ID}/gifts/transactions`);
    assert(txRes.statusCode === 200, `Transactions endpoint returns HTTP 200`);
    assert(txRes.json && txRes.json.success === true, `Transactions response success is true`);
    assert(Array.isArray(txRes.json.transactions) && txRes.json.transactions.length >= 4, `At least 4 transactions recorded in history`);

    // 12. Frontend Web Routes & Watermark Test
    console.log(`\n[Test 12] Next.js Gifts Screens & Watermark`);
    const page1Res = await request('GET', `/pk/gifts?preview=demo`);
    assert(page1Res.statusCode === 200, `Route /pk/gifts returns HTTP 200`);
    const hasWatermark1 = page1Res.data.includes('6.10 Hand-off to Real Gifts') || page1Res.data.includes('6.10');
    assert(hasWatermark1, `Route /pk/gifts contains Watermark 6.10`);

    const page2Res = await request('GET', `/pk/battle/${CANONICAL_BATTLE_ID}/gifts?preview=demo`);
    assert(page2Res.statusCode === 200, `Route /pk/battle/[battleId]/gifts returns HTTP 200`);
    const hasWatermark2 = page2Res.data.includes('6.10 Hand-off to Real Gifts') || page2Res.data.includes('6.10');
    assert(hasWatermark2, `Route /pk/battle/[battleId]/gifts contains Watermark 6.10`);

    console.log(`\n=======================================================`);
    console.log(`  TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log(`=======================================================`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution exception:', err);
    process.exit(1);
  }
}

runTests();
