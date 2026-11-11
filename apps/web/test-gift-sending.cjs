const http = require('http');
const https = require('https');

const baseUrl = (
  process.argv[2] ||
  process.env.TEST_BASE_URL ||
  'http://127.0.0.1:3000'
).trim();
const isHttps = baseUrl.startsWith('https');
const client = isHttps ? https : http;

const RUN_ID = Date.now();
const ACTIVE_PK_BATTLE_ID = '00000000-0000-0000-0000-000000000603';
const COMPLETED_PK_BATTLE_ID = '00000000-0000-0000-0000-000000000604';
const ACTIVE_LIVE_ROOM_ID = '880219';
const ENDED_LIVE_ROOM_ID = '990703';
const SARA_HOST_ID = '00000000-0000-0000-0000-000000088201';
const AYESHA_HOST_ID = '00000000-0000-0000-0000-000000088202';
let ZARA_HOST_ID = '';

let passed = 0;
let failed = 0;

function assert(condition, message, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}${detail ? ` (${detail})` : ''}`);
    failed++;
  }
}

function extractCookies(setCookieHeaders, existingMap = {}) {
  if (!Array.isArray(setCookieHeaders)) return existingMap;
  for (const header of setCookieHeaders) {
    const firstPart = header.split(';')[0];
    const eqIdx = firstPart.indexOf('=');
    if (eqIdx > 0) {
      const name = firstPart.slice(0, eqIdx).trim();
      const val = firstPart.slice(eqIdx + 1).trim();
      existingMap[name] = val;
    }
  }
  return existingMap;
}

function formatCookieHeader(cookieMap) {
  return Object.entries(cookieMap)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      headers: { ...headers },
    };

    let payload = null;
    if (body !== null && body !== undefined) {
      payload = typeof body === 'string' ? body : JSON.stringify(body);
      if (!options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
      }
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json,
        });
      });
    });

    req.on('error', reject);
    if (payload !== null) req.write(payload);
    req.end();
  });
}

async function loginAs(email, password) {
  const cookieJar = {};
  const consentRes = await request('POST', '/api/consent', {
    action: 'accept',
    termsAccepted: true,
    privacyAccepted: true,
    isAdultConfirmed: true,
    language: 'en',
  });
  extractCookies(consentRes.headers['set-cookie'], cookieJar);

  const loginRes = await request(
    'POST',
    '/api/auth/login',
    { email, password },
    { Cookie: formatCookieHeader(cookieJar) }
  );
  extractCookies(loginRes.headers['set-cookie'], cookieJar);

  return {
    statusCode: loginRes.statusCode,
    user: loginRes.json?.user || null,
    cookieHeader: formatCookieHeader(cookieJar),
  };
}

function openGiftSseAndTrigger(path, triggerAction) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method: 'GET',
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      headers: { Accept: 'text/event-stream' },
    };

    let buffer = '';
    const events = [];
    let triggered = false;
    let settled = false;

    const req = client.request(options, (res) => {
      res.on('data', async (chunk) => {
        buffer += chunk.toString();
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';
        for (const block of blocks) {
          const lines = block.split('\n').filter((l) => !l.startsWith(':'));
          let evtName = 'message';
          let dataStr = '';
          for (const line of lines) {
            if (line.startsWith('event:')) evtName = line.slice(6).trim();
            else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
          }
          if (dataStr) {
            try {
              events.push({ event: evtName, data: JSON.parse(dataStr) });
            } catch {}
          }
        }

        if (!triggered && events.some((e) => e.event === 'gift:state_sync')) {
          triggered = true;
          try {
            await triggerAction();
          } catch (err) {
            if (!settled) {
              settled = true;
              req.destroy();
              reject(err);
            }
          }
        }

        if (
          events.some((e) => e.event === 'gift:animation_broadcast') &&
          !settled
        ) {
          // Wait briefly for private balance event too
          setTimeout(() => {
            if (!settled) {
              settled = true;
              req.destroy();
              resolve(events);
            }
          }, 1100);
        }
      });
    });

    req.on('error', (err) => {
      if (!settled) reject(err);
    });

    setTimeout(() => {
      if (!settled) {
        settled = true;
        req.destroy();
        resolve(events);
      }
    }, 6500);

    req.end();
  });
}

async function runTests() {
  console.log(`\n🚀 Running Popo Live Module 7.3 Gift Sending Test Suite against: ${baseUrl}\n`);

  // --------------------------------------------------------------------------
  // 0. Sign in RBAC test accounts (finance_admin, ordinary admin, viewer)
  // --------------------------------------------------------------------------
  console.log('[Auth] Signing in finance@popolive.com, ordinaryadmin@popolive.com, viewer701@popolive.com');
  const [financeAuth, ordinaryAuth, viewerAuth] = await Promise.all([
    loginAs('finance@popolive.com', 'FinancePass123!'),
    loginAs('ordinaryadmin@popolive.com', 'AdminPass123!'),
    loginAs('viewer701@popolive.com', 'ViewerPass123!'),
  ]);
  assert(financeAuth.statusCode === 200 && Boolean(financeAuth.cookieHeader), 'Finance admin logged in');
  assert(ordinaryAuth.statusCode === 200 && Boolean(ordinaryAuth.cookieHeader), 'Ordinary admin logged in');
  assert(viewerAuth.statusCode === 200 && Boolean(viewerAuth.cookieHeader), 'Viewer logged in');

  const senderA = `test_sender_a_${RUN_ID}`;
  const senderB = `test_sender_b_${RUN_ID}`;
  const lowCoinSender = `test_low_coin_${RUN_ID}`;
  const burstSender = `test_burst_${RUN_ID}`;

  // Provision isolated sender wallets via finance_admin adjustment
  for (const [uid, amt] of [
    [senderA, 5000],
    [senderB, 500],
    [lowCoinSender, 25],
    [burstSender, 2000],
  ]) {
    const adjRes = await request(
      'POST',
      '/api/admin/finance/adjust',
      {
        targetUserId: uid,
        balanceType: 'coins',
        operation: 'credit',
        amount: amt,
        reason: `Module 7.3 Automated Test Seed (${RUN_ID})`,
        idempotencyKey: `TEST_73_SEED_${uid}_${RUN_ID}`,
      },
      { Cookie: financeAuth.cookieHeader }
    );
    assert(adjRes.statusCode === 200 && adjRes.json?.success === true, `Funded ${uid} with ${amt} coins`);
  }

  // --------------------------------------------------------------------------
  // TEST 1 & 2: Viewer Opens Gift Panel in Active Live Room & Selects Gift + Quantity
  // --------------------------------------------------------------------------
  console.log('\n[Test 1 & 2] Context Load (Live Room 880219 & PK Battle 603) + Quantity Rules');
  const [roomCtxRes, pkCtxRes] = await Promise.all([
    request('GET', `/api/gifts/send/context?roomId=${ACTIVE_LIVE_ROOM_ID}&userId=${senderA}&preview=demo`),
    request('GET', `/api/gifts/send/context?pkBattleId=${ACTIVE_PK_BATTLE_ID}&userId=${senderA}&preview=demo`),
  ]);

  ZARA_HOST_ID = roomCtxRes.json?.hosts?.[0]?.hostId || '';
  assert(roomCtxRes.statusCode === 200 && roomCtxRes.json?.mode === 'live_room', 'Live room 880219 context loads');
  assert(Boolean(ZARA_HOST_ID && roomCtxRes.json?.hosts?.[0]?.nickname === 'Zara Live'), `Zara Live resolved as Live Room host (${ZARA_HOST_ID})`);
  assert((roomCtxRes.json?.gifts || []).length >= 8, `Catalog gifts loaded (${(roomCtxRes.json?.gifts || []).length})`);
  assert(roomCtxRes.json?.senderWallet?.availableCoins === 5000, 'Read-only Coin balance = 5000');

  assert(pkCtxRes.statusCode === 200 && pkCtxRes.json?.mode === 'pk_battle', 'PK battle 603 context loads');
  assert(pkCtxRes.json?.hosts?.length === 2, 'PK context exposes both Host A & Host B');

  // --------------------------------------------------------------------------
  // TEST 3: Confirmation Modal Preview Without Deducting Coins
  // --------------------------------------------------------------------------
  console.log('\n[Test 3] Gift Preview Calculation (Zero Coin Deduction)');
  const prevRes = await request('POST', '/api/gifts/send/preview', {
    senderUserId: senderA,
    recipientHostId: ZARA_HOST_ID,
    liveRoomId: ACTIVE_LIVE_ROOM_ID,
    giftId: 'gift_rose',
    quantity: 5,
    preview: 'demo',
  });
  assert(prevRes.statusCode === 200 && prevRes.json?.preview?.totalCoinAmount === 50, 'Preview computes Rose (10) x 5 = 50 coins');
  assert(prevRes.json?.preview?.currentCoinBalance === 5000, 'Preview reports currentCoinBalance = 5000');
  assert(prevRes.json?.preview?.remainingCoinBalance === 4950, 'Preview reports remainingCoinBalance = 4950');
  assert(prevRes.json?.preview?.hostPointsToCredit === 35, 'Preview computes exact 70% share = 35 points');
  assert(prevRes.json?.preview?.platformShareCoins === 15, 'Preview computes exact 30% platform share = 15 coins');

  const balAfterPreview = await request('GET', `/api/wallet/balance?userId=${senderA}&preview=demo&fresh=true`);
  assert(balAfterPreview.json?.wallet?.coins === 5000, 'Preview caused ZERO coin deduction');

  // --------------------------------------------------------------------------
  // TEST 4 & 5: Real Atomic Gift Send in Live Room + Private vs Public SSE Scoping
  // --------------------------------------------------------------------------
  console.log('\n[Test 4 & 5] Atomic Live Room Gift Send + Private vs Public SSE Scoping');
  const zaraBefore = await request('GET', `/api/wallet/balance?userId=${ZARA_HOST_ID}&preview=demo&fresh=true`);
  const zaraPointsBefore = zaraBefore.json?.wallet?.points || 0;

  let sendLiveRes = null;
  const senderEventsPromise = openGiftSseAndTrigger(
    `/api/gifts/live/events?roomId=${ACTIVE_LIVE_ROOM_ID}&userId=${senderA}&preview=demo`,
    async () => {
      sendLiveRes = await request('POST', '/api/gifts/send', {
        senderUserId: senderA,
        senderNickname: 'TestViewerA',
        recipientHostId: ZARA_HOST_ID,
        liveRoomId: ACTIVE_LIVE_ROOM_ID,
        giftId: 'gift_heart', // 50 coins
        quantity: 2, // Total = 100 coins -> 70 host points, 30 platform share
        idempotencyKey: `IDEM_LIVE_${RUN_ID}_1`,
        preview: 'demo',
      });
    }
  );
  const publicOtherObserverPromise = openGiftSseAndTrigger(
    `/api/gifts/live/events?roomId=${ACTIVE_LIVE_ROOM_ID}&userId=${senderB}&preview=demo`,
    async () => {}
  );

  const [senderEvents, otherEvents] = await Promise.all([senderEventsPromise, publicOtherObserverPromise]);

  assert(sendLiveRes && sendLiveRes.statusCode === 200 && sendLiveRes.json?.success === true, 'Gift send Heart x2 succeeded');
  assert(sendLiveRes.json?.transaction?.totalCoinAmount === 100, 'Total coin amount = 100');
  assert(sendLiveRes.json?.transaction?.hostPointsCredited === 70, 'Host points credited = 70 (70%)');
  assert(sendLiveRes.json?.transaction?.platformShare === 30, 'Platform share = 30 (30%)');
  assert(sendLiveRes.json?.updatedSenderWallet?.availableCoins === 4900, 'Sender coins deducted atomically (5000 -> 4900)');

  const zaraAfter = await request('GET', `/api/wallet/balance?userId=${ZARA_HOST_ID}&preview=demo&fresh=true`);
  assert((zaraAfter.json?.wallet?.points || 0) === zaraPointsBefore + 70, 'Host points balance increased by exact +70');

  assert(
    senderEvents.some((e) => e.event === 'gift:animation_broadcast'),
    'SSE broadcast gift:animation_broadcast received'
  );
  assert(
    senderEvents.some((e) => e.event === 'gift:coin_balance_updated' && e.data?.availableCoins === 4900),
    'Sender received private gift:coin_balance_updated'
  );
  assert(
    otherEvents.some((e) => e.event === 'gift:animation_broadcast'),
    'Other viewer in room received public gift:animation_broadcast'
  );
  assert(
    !otherEvents.some((e) => e.event === 'gift:coin_balance_updated'),
    'Other viewer NEVER received sender private coin_balance_updated event'
  );

  // --------------------------------------------------------------------------
  // TEST 6: Insufficient Coins Rejection + Failed Ledger Logging
  // --------------------------------------------------------------------------
  console.log('\n[Test 6] Insufficient Coins Rejection (25 coins trying to send Teddy = 100 coins)');
  const lowFailRes = await request('POST', '/api/gifts/send', {
    senderUserId: lowCoinSender,
    recipientHostId: ZARA_HOST_ID,
    liveRoomId: ACTIVE_LIVE_ROOM_ID,
    giftId: 'gift_teddy', // 100 coins
    quantity: 1,
    idempotencyKey: `IDEM_LOW_${RUN_ID}`,
    preview: 'demo',
  });
  assert(lowFailRes.statusCode === 400 && lowFailRes.json?.errorCode === 'INSUFFICIENT_COINS', 'Rejected with 400 INSUFFICIENT_COINS');
  assert(lowFailRes.json?.topUpRecommended === true && lowFailRes.json?.shortfallCoins === 75, 'Returns Top-up flag & shortfall = 75');
  assert(lowFailRes.json?.transaction?.status === 'failed', 'Failed gift recorded with status = failed');

  const lowBalCheck = await request('GET', `/api/wallet/balance?userId=${lowCoinSender}&preview=demo&fresh=true`);
  assert(lowBalCheck.json?.wallet?.coins === 25, 'Low-coin sender balance completely unchanged (25)');
  const zaraAfterFail = await request('GET', `/api/wallet/balance?userId=${ZARA_HOST_ID}&preview=demo&fresh=true`);
  assert((zaraAfterFail.json?.wallet?.points || 0) === zaraPointsBefore + 70, 'Host points completely unchanged after failed send');

  // --------------------------------------------------------------------------
  // TEST 7: Duplicate Submit / Same Idempotency Key Deduplication
  // --------------------------------------------------------------------------
  console.log('\n[Test 7] Duplicate Request / Idempotency Protection');
  const dupRes = await request('POST', '/api/gifts/send', {
    senderUserId: senderA,
    recipientHostId: ZARA_HOST_ID,
    liveRoomId: ACTIVE_LIVE_ROOM_ID,
    giftId: 'gift_heart',
    quantity: 2,
    idempotencyKey: `IDEM_LIVE_${RUN_ID}_1`, // exact same key as Test 4
    preview: 'demo',
  });
  assert(dupRes.statusCode === 200 && dupRes.json?.deduplicated === true, 'Duplicate idempotencyKey safely deduplicated');
  assert(dupRes.json?.updatedSenderWallet?.availableCoins === 4900, 'No double coin deduction on replay');
  const zaraAfterDup = await request('GET', `/api/wallet/balance?userId=${ZARA_HOST_ID}&preview=demo&fresh=true`);
  assert((zaraAfterDup.json?.wallet?.points || 0) === zaraPointsBefore + 70, 'No double host points credit on replay');

  // --------------------------------------------------------------------------
  // TEST 8 & 9: Invalid Quantity + Client Financial Override Tampering
  // --------------------------------------------------------------------------
  console.log('\n[Test 8 & 9] Invalid Quantities & Client Financial Override Blocking');
  for (const [label, qty] of [
    ['zero', 0],
    ['negative', -3],
    ['fractional', 1.5],
    ['excessive (>99)', 105],
    ['luxury cap exceeded (Sports Car >10)', 15],
  ]) {
    const qGift = label.includes('Sports Car') ? 'gift_sports_car' : 'gift_rose';
    const qRes = await request('POST', '/api/gifts/send', {
      senderUserId: senderA,
      recipientHostId: ZARA_HOST_ID,
      liveRoomId: ACTIVE_LIVE_ROOM_ID,
      giftId: qGift,
      quantity: qty,
      idempotencyKey: `IDEM_QTY_${RUN_ID}_${qty}`,
      preview: 'demo',
    });
    assert(qRes.statusCode === 400 && qRes.json?.errorCode === 'INVALID_QUANTITY', `Rejected ${label} quantity=${qty} (${qRes.statusCode})`);
  }

  for (const field of ['coinPriceOverride', 'coinPrice', 'hostPoints', 'sharePercentage', 'senderBalance']) {
    const tamperRes = await request('POST', '/api/gifts/send', {
      senderUserId: senderA,
      recipientHostId: ZARA_HOST_ID,
      liveRoomId: ACTIVE_LIVE_ROOM_ID,
      giftId: 'gift_rose',
      quantity: 1,
      [field]: 1,
      preview: 'demo',
    });
    assert(tamperRes.statusCode === 403 && tamperRes.json?.errorCode === 'CLIENT_FINANCIAL_OVERRIDE_FORBIDDEN', `Tamper '${field}' rejected with 403`);
  }

  // --------------------------------------------------------------------------
  // TEST 10, 11, 12: Unauthorized Recipient, Ended Room, Completed PK Battle
  // --------------------------------------------------------------------------
  console.log('\n[Test 10, 11 & 12] Recipient Membership, Ended Room (990703) & Completed PK Battle (604)');
  const wrongRecipRes = await request('POST', '/api/gifts/send', {
    senderUserId: senderA,
    recipientHostId: AYESHA_HOST_ID, // NOT in room 880219 (Zara's room)
    liveRoomId: ACTIVE_LIVE_ROOM_ID,
    giftId: 'gift_rose',
    quantity: 1,
    idempotencyKey: `IDEM_WRONG_RECIP_${RUN_ID}`,
    preview: 'demo',
  });
  assert(wrongRecipRes.statusCode === 403 && wrongRecipRes.json?.errorCode === 'INVALID_RECIPIENT', 'Unrelated recipient host rejected with 403');

  const endedRoomRes = await request('POST', '/api/gifts/send', {
    senderUserId: senderA,
    recipientHostId: ZARA_HOST_ID,
    liveRoomId: ENDED_LIVE_ROOM_ID,
    giftId: 'gift_rose',
    quantity: 1,
    idempotencyKey: `IDEM_ENDED_ROOM_${RUN_ID}`,
    preview: 'demo',
  });
  assert(endedRoomRes.statusCode === 400 && endedRoomRes.json?.errorCode === 'ROOM_ENDED', 'Ended live room 990703 rejected with 400 ROOM_ENDED');

  const completedPkRes = await request('POST', '/api/gifts/send', {
    senderUserId: senderA,
    recipientHostId: SARA_HOST_ID,
    pkBattleId: COMPLETED_PK_BATTLE_ID,
    giftId: 'gift_rose',
    quantity: 1,
    idempotencyKey: `IDEM_ENDED_PK_${RUN_ID}`,
    preview: 'demo',
  });
  assert(completedPkRes.statusCode === 400 && completedPkRes.json?.errorCode === 'BATTLE_ENDED', 'Completed PK battle 604 rejected with 400 BATTLE_ENDED');

  // --------------------------------------------------------------------------
  // TEST 13: Active PK Battle Gift Sending -> Host A & Host B Attribution & Scores
  // --------------------------------------------------------------------------
  console.log('\n[Test 13] Active PK Battle 603 — Send to Host A (Sara) & Host B (Ayesha)');
  const pkBefore = (await request('GET', `/api/gifts/send/context?pkBattleId=${ACTIVE_PK_BATTLE_ID}&userId=${senderA}&preview=demo`)).json;
  const scoreABefore = pkBefore.pkHostAScore;
  const scoreBBefore = pkBefore.pkHostBScore;

  const pkSendARes = await request('POST', '/api/gifts/send', {
    senderUserId: senderA,
    recipientHostId: SARA_HOST_ID,
    pkBattleId: ACTIVE_PK_BATTLE_ID,
    giftId: 'gift_crown', // 500 coins
    quantity: 1,
    idempotencyKey: `IDEM_PK_A_${RUN_ID}`,
    preview: 'demo',
  });
  const pkSendBRes = await request('POST', '/api/gifts/send', {
    senderUserId: senderA,
    recipientHostId: AYESHA_HOST_ID,
    pkBattleId: ACTIVE_PK_BATTLE_ID,
    giftId: 'gift_teddy', // 100 coins
    quantity: 2, // 200 coins
    idempotencyKey: `IDEM_PK_B_${RUN_ID}`,
    preview: 'demo',
  });

  assert(pkSendARes.statusCode === 200 && pkSendARes.json?.transaction?.pkHostSide === 'host_a', 'PK gift sent to Host A (Sara Live)');
  assert(pkSendARes.json?.updatedHostStats?.pointsCredited === 350, 'Host A earned exact 70% = 350 points');
  assert(pkSendARes.json?.updatedHostStats?.pkHostAScore === scoreABefore + 500, 'Host A PK score increased by +500');

  assert(pkSendBRes.statusCode === 200 && pkSendBRes.json?.transaction?.pkHostSide === 'host_b', 'PK gift sent to Host B (Ayesha)');
  assert(pkSendBRes.json?.updatedHostStats?.pointsCredited === 140, 'Host B earned exact 70% = 140 points');
  assert(pkSendBRes.json?.updatedHostStats?.pkHostBScore === scoreBBefore + 200, 'Host B PK score increased by +200');

  // --------------------------------------------------------------------------
  // TEST 14: Concurrent Parallel Gift Sending Consistency (senderB starts with 500 coins)
  // --------------------------------------------------------------------------
  console.log('\n[Test 14] Concurrency Consistency Check (5 parallel 150-coin sends on 500-coin wallet -> max 3 succeed)');
  const concurrentCalls = [];
  for (let i = 0; i < 5; i++) {
    concurrentCalls.push(
      request('POST', '/api/gifts/send', {
        senderUserId: senderB,
        recipientHostId: ZARA_HOST_ID,
        liveRoomId: ACTIVE_LIVE_ROOM_ID,
        giftId: 'gift_heart', // 50 coins
        quantity: 3, // 150 coins each -> max 3 can succeed (450 coins), remaining 50 coins fails 4th & 5th
        idempotencyKey: `IDEM_CONC_${RUN_ID}_${i}`,
        preview: 'demo',
      })
    );
  }
  const concResults = await Promise.all(concurrentCalls);
  const concSuccesses = concResults.filter((r) => r.statusCode === 200 && r.json?.success === true).length;
  const concFails = concResults.filter((r) => r.statusCode === 400 && r.json?.errorCode === 'INSUFFICIENT_COINS').length;
  const senderBAfter = (await request('GET', `/api/wallet/balance?userId=${senderB}&preview=demo&fresh=true`)).json?.wallet?.coins;

  assert(concSuccesses === 3, `Exactly 3 parallel 150-coin gifts succeeded on 500-coin balance (got ${concSuccesses})`);
  assert(concFails === 2, `Exactly 2 parallel gifts rejected cleanly for insufficient funds (got ${concFails})`);
  assert(senderBAfter === 50, `Final balance strictly = 50 coins with zero negative overdraft (got ${senderBAfter})`);

  // --------------------------------------------------------------------------
  // TEST 15: Rate Limiting / Anti-Spam Burst Guard (30 per 10s limit)
  // --------------------------------------------------------------------------
  console.log('\n[Test 15] Anti-Spam Rate Limiting (>30 requests within 10s returns 429)');
  let hit429 = false;
  for (let i = 0; i < 34; i++) {
    const r = await request('POST', '/api/gifts/send', {
      senderUserId: burstSender,
      recipientHostId: ZARA_HOST_ID,
      liveRoomId: ACTIVE_LIVE_ROOM_ID,
      giftId: 'gift_rose',
      quantity: 1,
      idempotencyKey: `IDEM_BURST_${RUN_ID}_${i}`,
      preview: 'demo',
    });
    if (r.statusCode === 429 && r.json?.errorCode === 'RATE_LIMIT_EXCEEDED') {
      hit429 = true;
      break;
    }
  }
  assert(hit429 === true, 'Rapid spam burst hit 429 RATE_LIMIT_EXCEEDED');

  // --------------------------------------------------------------------------
  // TEST 16 & 17: Admin RBAC, Gift Ledger Search & Full Atomic Reversal
  // --------------------------------------------------------------------------
  console.log('\n[Test 16 & 17] Finance Admin Ledger Inspection + RBAC Enforcement + Reversal');
  const publicAdminRes = await request('GET', '/api/admin/gifts/transactions');
  const viewerAdminRes = await request('GET', '/api/admin/gifts/transactions', null, { Cookie: viewerAuth.cookieHeader });
  assert(publicAdminRes.statusCode === 403, 'Anonymous caller blocked from admin gift ledger (403)');
  assert(viewerAdminRes.statusCode === 403, 'Standard viewer blocked from admin gift ledger (403)');

  const targetTxId = pkSendARes.json?.transaction?.giftTransactionId;
  const finListRes = await request(
    'GET',
    `/api/admin/gifts/transactions?search=${encodeURIComponent(targetTxId)}`,
    null,
    { Cookie: financeAuth.cookieHeader }
  );
  assert(finListRes.statusCode === 200 && finListRes.json?.transactions?.[0]?.platformShare === 150, 'Finance admin views exact platformShare (150)');

  // Ordinary admin & viewer CANNOT reverse gifts (403)
  const ordRevRes = await request(
    'POST',
    `/api/admin/gifts/transactions/${encodeURIComponent(targetTxId)}/reverse`,
    { reason: 'Ordinary admin unauthorized test' },
    { Cookie: ordinaryAuth.cookieHeader }
  );
  assert(ordRevRes.statusCode === 403, 'Ordinary admin blocked from reversing gifts (403)');

  const senderACoinsBeforeRev = pkSendBRes.json?.updatedSenderWallet?.availableCoins; // after A & B pk sends
  const saraPointsBeforeRev = (await request('GET', `/api/wallet/balance?userId=${SARA_HOST_ID}&preview=demo&fresh=true`)).json?.wallet?.points;

  const finRevRes = await request(
    'POST',
    `/api/admin/gifts/transactions/${encodeURIComponent(targetTxId)}/reverse`,
    { reason: `Automated reversal verification (${RUN_ID})` },
    { Cookie: financeAuth.cookieHeader }
  );
  assert(finRevRes.statusCode === 200 && finRevRes.json?.transaction?.status === 'reversed', 'Finance admin reversed PK gift transaction cleanly');
  assert(finRevRes.json?.senderWallet?.coins === senderACoinsBeforeRev + 500, 'Reversal refunded exact +500 coins to sender');
  assert(finRevRes.json?.hostWallet?.points === saraPointsBeforeRev - 350, 'Reversal deducted exact -350 points from host');

  // Double reversal blocked
  const doubleRevRes = await request(
    'POST',
    `/api/admin/gifts/transactions/${encodeURIComponent(targetTxId)}/reverse`,
    { reason: 'Duplicate reversal test' },
    { Cookie: financeAuth.cookieHeader }
  );
  assert(doubleRevRes.statusCode === 400 && doubleRevRes.json?.errorCode === 'CANNOT_REVERSE_STATUS', 'Duplicate reversal rejected cleanly (400)');

  // --------------------------------------------------------------------------
  // TEST 18: Web Pages Accessibility (/gifts/send & /live/room/880219 & /pk/gifts)
  // --------------------------------------------------------------------------
  console.log('\n[Test 18] Web Page Route Health Checks (200 OK)');
  const [sendPageRes, liveRoomRes, adminFinanceRes] = await Promise.all([
    request('GET', '/gifts/send?preview=demo'),
    request('GET', '/live/room/880219?preview=demo'),
    request('GET', '/admin/finance'),
  ]);
  assert(sendPageRes.statusCode === 200 && sendPageRes.data.includes('Popo Live'), '/gifts/send?preview=demo returns 200 OK');
  assert(liveRoomRes.statusCode === 200, '/live/room/880219?preview=demo returns 200 OK');
  assert(adminFinanceRes.statusCode === 200, '/admin/finance returns 200 OK');

  // Spoofing senderUserId while signed in as viewer701 rejected 403
  const spoofRes = await request(
    'POST',
    '/api/gifts/send',
    {
      senderUserId: senderA, // spoofing another user while signed in as viewer701
      recipientHostId: ZARA_HOST_ID,
      liveRoomId: ACTIVE_LIVE_ROOM_ID,
      giftId: 'gift_rose',
      quantity: 1,
      preview: 'demo',
    },
    { Cookie: viewerAuth.cookieHeader }
  );
  assert(spoofRes.statusCode === 403 && spoofRes.json?.errorCode === 'UNAUTHORIZED_SENDER_SPOOF', 'Sender identity spoofing rejected with 403');

  // --------------------------------------------------------------------------
  // TEST 19: SSE Reconnect & Authoritative State Recovery (gift:state_sync)
  // --------------------------------------------------------------------------
  console.log('\n[Test 19] SSE Reconnect Synchronization (gift:state_sync returns fresh balances & PK scores)');
  const reconnectEvents = await openGiftSseAndTrigger(
    `/api/gifts/live/events?pkBattleId=${ACTIVE_PK_BATTLE_ID}&userId=${senderA}&lastEventId=1&preview=demo`,
    async () => {}
  );
  const syncEvt = reconnectEvents.find((e) => e.event === 'gift:state_sync');
  assert(
    Boolean(syncEvt && typeof syncEvt.data?.pkHostAScore === 'number' && typeof syncEvt.data?.senderAvailableCoins === 'number'),
    'SSE reconnect emits authoritative gift:state_sync with fresh coin balance & PK scores'
  );

  console.log(`\n==================================================================`);
  console.log(`Module 7.3 Results: ${passed} PASSED | ${failed} FAILED`);
  console.log(`==================================================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
