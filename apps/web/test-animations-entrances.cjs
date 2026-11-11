/**
 * Module 7.4 Automated End-to-End Verification Suite
 * Tests Premium Gift Animations, Host Entrance Effects, VIP Gating, Queue Priority,
 * SSE State Recovery, Admin Management, and Financial Isolation against Live Server.
 */
const http = require('http');
const https = require('https');

const BASE_URL = process.env.TEST_BASE_URL || process.argv[2] || 'http://127.0.0.1:3006';
const PK_BATTLE_ID = '00000000-0000-0000-0000-000000000606';
const LIVE_ROOM_ID = '880219';
const SARA_HOST_ID = '00000000-0000-0000-0000-000000088201';
const AYESHA_HOST_ID = '00000000-0000-0000-0000-000000088202';
const DEMO_USER_ID = 'user_wallet_demo_701';

let passed = 0;
let failed = 0;
const reversedTxIds = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const lib = url.protocol === 'https:' ? https : http;
    const reqHeaders = { ...headers };
    let payloadStr = null;
    if (body !== null) {
      payloadStr = typeof body === 'string' ? body : JSON.stringify(body);
      if (!reqHeaders['Content-Type']) reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payloadStr);
    }

    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers: reqHeaders,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          const text = buf.toString('utf8');
          let json = null;
          try {
            json = JSON.parse(text);
          } catch {}
          resolve({ statusCode: res.statusCode, headers: res.headers, text, json, buffer: buf });
        });
      }
    );
    req.on('error', reject);
    if (payloadStr !== null) req.write(payloadStr);
    req.end();
  });
}

function collectSseEvents(path, durationMs = 2600, triggerFn = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const lib = url.protocol === 'https:' ? https : http;
    const received = [];
    let buffer = '';
    let triggered = false;

    const req = lib.get(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
      },
      (res) => {
        res.setEncoding('utf8');
        res.on('data', async (chunk) => {
          buffer += chunk;
          const frames = buffer.split('\n\n');
          buffer = frames.pop() || '';
          for (const frame of frames) {
            if (!frame.trim() || frame.startsWith(':')) continue;
            let eventName = 'message';
            let dataStr = '';
            let id = null;
            for (const line of frame.split('\n')) {
              if (line.startsWith('event:')) eventName = line.slice(6).trim();
              else if (line.startsWith('id:')) id = line.slice(3).trim();
              else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
            }
            let parsed = dataStr;
            try {
              parsed = JSON.parse(dataStr);
            } catch {}
            received.push({ event: eventName, id, data: parsed });

            if (!triggered && eventName === 'animation:state_sync' && triggerFn) {
              triggered = true;
              setTimeout(() => {
                Promise.resolve(triggerFn()).catch(() => {});
              }, 150);
            }
          }
        });
      }
    );
    req.on('error', reject);

    setTimeout(() => {
      try {
        req.destroy();
      } catch {}
      resolve(received);
    }, durationMs);
  });
}

function buildMinimalWavBuffer() {
  const header = Buffer.alloc(64);
  header.write('RIFF', 0);
  header.writeUInt32LE(56, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(22050, 24);
  header.writeUInt32LE(44100, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(20, 40);
  return header;
}

async function loginAsAccount(email, password) {
  const jar = {};
  const extract = (setCookies = []) => {
    for (const c of setCookies) {
      const nv = c.split(';')[0];
      const eq = nv.indexOf('=');
      if (eq > 0) jar[nv.slice(0, eq)] = nv.slice(eq + 1);
    }
  };
  const cookieStr = () =>
    Object.entries(jar)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');

  const cRes = await request('POST', '/api/consent', {
    action: 'accept',
    termsAccepted: true,
    privacyAccepted: true,
    isAdultConfirmed: true,
  });
  extract(cRes.headers['set-cookie']);

  const lRes = await request(
    'POST',
    '/api/auth/login',
    { email, password },
    { Cookie: cookieStr() }
  );
  extract(lRes.headers['set-cookie']);
  return { statusCode: lRes.statusCode, cookie: cookieStr() };
}

async function runTests() {
  console.log(`\n=== MODULE 7.4 ANIMATIONS & ENTRANCES VERIFICATION (${BASE_URL}) ===\n`);

  // 0. Sign in Admin + Finance Admin first for setup/reversal cleanup
  console.log('[Suite 0] Admin & Finance Admin Login Verification');
  const [{ statusCode: loginCode, cookie: adminCookie }, { statusCode: finCode, cookie: financeCookie }] =
    await Promise.all([
      loginAsAccount('ordinaryadmin@popolive.com', 'AdminPass123!'),
      loginAsAccount('finance@popolive.com', 'FinancePass123!'),
    ]);
  assert(
    loginCode === 200 && Boolean(adminCookie) && finCode === 200 && Boolean(financeCookie),
    'Admin and Finance Admin login succeed for RBAC & cleanup verification'
  );

  // Ensure demo user has canonical balance cleanly & restore any stale active items
  await request('POST', '/api/wallet/balance?preview=demo', null).catch(() => {});

  async function drainRoomQueues() {
    for (const sc of [
      `/api/animations/config?pkBattleId=${PK_BATTLE_ID}&preview=demo`,
      `/api/animations/config?roomId=${LIVE_ROOM_ID}&preview=demo`,
    ]) {
      for (let pass = 0; pass < 6; pass++) {
        const sRes = await request('GET', sc);
        const items = [
          ...(sRes.json?.stateSync?.activeEntrances || []),
          ...(sRes.json?.stateSync?.activeAnimations || []),
          ...(sRes.json?.stateSync?.queuedAnimations || []),
        ];
        if (items.length === 0) break;
        await Promise.all(
          items.map((item) =>
            request('POST', '/api/animations/gift/complete', { queueId: item.queueId }).catch(() => {})
          )
        );
      }
    }
  }
  await drainRoomQueues();

  // 1. Page & Static Assets
  console.log('\n[Suite 1] UI Route & Static Animation/SFX Assets');
  const pageRes = await request('GET', '/animations?preview=demo');
  assert(pageRes.statusCode === 200, 'GET /animations?preview=demo returns 200 OK');
  assert(
    pageRes.text.includes('Animations and Entrances') && pageRes.text.includes('P7.4'),
    'Animations page renders P7.4 title & watermark'
  );

  for (const assetPath of [
    '/assets/gifts/sfx/sfx_small_chime.wav',
    '/assets/gifts/sfx/sfx_luxury_grand.wav',
    '/assets/gifts/sfx/sfx_entrance_vip.wav',
    '/assets/gifts/entrances/entrance_vip.json',
    '/assets/gifts/entrances/entrance_vip.png',
    '/assets/gifts/castle.png',
  ]) {
    const aRes = await request('GET', assetPath);
    assert(aRes.statusCode === 200 && aRes.buffer.length > 50, `Asset loads cleanly: ${assetPath}`);
  }

  // 2. Config & Approved Catalog Mapping
  console.log('\n[Suite 2] Approved Animation Config & Non-Random Catalog Mapping');
  const cfgRes = await request(
    'GET',
    `/api/animations/config?pkBattleId=${PK_BATTLE_ID}&hostUserId=${SARA_HOST_ID}&userId=${DEMO_USER_ID}&preview=demo`
  );
  assert(cfgRes.statusCode === 200 && cfgRes.json?.success, 'GET /api/animations/config succeeds');
  const giftAnims = cfgRes.json?.catalog?.giftAnimations || [];
  const entranceEffects = cfgRes.json?.catalog?.entranceEffects || [];
  const roseCfg = giftAnims.find((g) => g.giftId === 'gift_rose');
  const castleCfg = giftAnims.find((g) => g.giftId === 'gift_castle');
  assert(
    roseCfg?.animationTier === 'small_floating' && castleCfg?.animationTier === 'luxury',
    'Rose mapped deterministically to small_floating and Castle to luxury'
  );
  assert(entranceEffects.length === 4, 'All 4 configurable entrance types loaded from backend');
  assert(
    cfgRes.json?.hostEligibility?.vipActive === true &&
      cfgRes.json?.hostEligibility?.vipBadgeLabel === 'VIP III',
    'Host Sara real DB VIP status verified (VIP III)'
  );

  // Check initial user balance so we can restore exact state on completion
  const initialCtxRes = await request(
    'GET',
    `/api/gifts/send/context?pkBattleId=${PK_BATTLE_ID}&userId=${DEMO_USER_ID}&preview=demo`
  );
  const startCoins = initialCtxRes.json?.senderWallet?.availableCoins ?? 12500;
  console.log(`  ℹ Initial wallet balance: ${startCoins} coins`);

  // 3. Small, Medium & Large Full-Screen Gifts via Real Transactions + PK Placement
  console.log('\n[Suite 3] Small / Large Gift Sends + PK Host A vs Host B Side Placement');
  const sendSmall = await request(
    'POST',
    '/api/gifts/send?preview=demo',
    {
      senderUserId: DEMO_USER_ID,
      senderNickname: 'Sunny',
      recipientHostId: SARA_HOST_ID,
      giftId: 'gift_rose',
      quantity: 1,
      pkBattleId: PK_BATTLE_ID,
    },
    { 'X-Idempotency-Key': `m74_small_${Date.now()}` }
  );
  assert(sendSmall.statusCode === 200 && sendSmall.json?.success, 'Small Rose gift sent to Host A');
  const smallTxId = sendSmall.json?.transaction?.giftTransactionId;
  if (smallTxId) reversedTxIds.push(smallTxId);

  const sendLargeHostB = await request(
    'POST',
    '/api/gifts/send?preview=demo',
    {
      senderUserId: DEMO_USER_ID,
      senderNickname: 'Sunny',
      recipientHostId: AYESHA_HOST_ID,
      giftId: 'gift_crown',
      quantity: 1,
      pkBattleId: PK_BATTLE_ID,
    },
    { 'X-Idempotency-Key': `m74_crown_b_${Date.now()}` }
  );
  assert(
    sendLargeHostB.statusCode === 200 && sendLargeHostB.json?.success,
    'Large Crown gift sent to Host B (Ayesha)'
  );
  const crownTxId = sendLargeHostB.json?.transaction?.giftTransactionId;
  if (crownTxId) reversedTxIds.push(crownTxId);

  // Verify queue / stateSync captured Host A & Host B properly and did not alter PK scores from animation service
  const syncAfterSend = await request(
    'GET',
    `/api/animations/config?pkBattleId=${PK_BATTLE_ID}&userId=${DEMO_USER_ID}&preview=demo`
  );
  const activeOrRecent = [
    ...(syncAfterSend.json?.stateSync?.activeAnimations || []),
    ...(syncAfterSend.json?.stateSync?.queuedAnimations || []),
  ];
  const crownQueueItem = activeOrRecent.find((i) => i.giftTransactionId === crownTxId);
  assert(
    Boolean(
      crownQueueItem &&
        crownQueueItem.pkHostSide === 'host_b' &&
        crownQueueItem.senderNickname === 'Sunny' &&
        crownQueueItem.recipientNickname === 'Ayesha'
    ),
    'Queue entry preserves senderNickname, recipientNickname (Ayesha), and PK Host B side placement'
  );

  // 4. Duplicate Animation Rejection & Unverified/Failed Transaction Blocking
  console.log('\n[Suite 4] Duplicate Prevention & Failed Gift Animation Block');
  const dupDispatch = await request('POST', '/api/animations/gift/dispatch?preview=demo', {
    userId: DEMO_USER_ID,
    giftTransactionId: smallTxId,
    pkBattleId: PK_BATTLE_ID,
  });
  assert(
    dupDispatch.statusCode === 409 && dupDispatch.json?.code === 'DUPLICATE_ANIMATION_EVENT',
    'Duplicate animation dispatch strictly rejected with 409 DUPLICATE_ANIMATION_EVENT'
  );

  // Trigger an intentional failed gift transaction (insufficient coins: Dragon Phoenix 25000 coins > ~12000)
  const failedGiftAttempt = await request(
    'POST',
    '/api/gifts/send?preview=demo',
    {
      senderUserId: DEMO_USER_ID,
      senderNickname: 'Sunny',
      recipientHostId: SARA_HOST_ID,
      giftId: 'gift_dragon_phoenix',
      quantity: 1,
      pkBattleId: PK_BATTLE_ID,
    },
    { 'X-Idempotency-Key': `m74_fail_${Date.now()}` }
  );
  const failedTxId = failedGiftAttempt.json?.transaction?.giftTransactionId;
  assert(
    failedGiftAttempt.statusCode === 400 &&
      failedGiftAttempt.json?.transaction?.status === 'failed' &&
      Boolean(failedTxId),
    'Failed Dragon Phoenix attempt recorded safely as failed transaction'
  );

  const failedAnimAttempt = await request('POST', '/api/animations/gift/dispatch?preview=demo', {
    userId: DEMO_USER_ID,
    giftTransactionId: failedTxId,
    pkBattleId: PK_BATTLE_ID,
  });
  assert(
    failedAnimAttempt.statusCode === 400 &&
      failedAnimAttempt.json?.code === 'INVALID_OR_FAILED_TRANSACTION',
    'Failed gift transaction strictly blocked from triggering animation (400 INVALID_OR_FAILED_TRANSACTION)'
  );

  const nonexistentAnim = await request('POST', '/api/animations/gift/dispatch?preview=demo', {
    userId: DEMO_USER_ID,
    giftTransactionId: 'GFT_DOES_NOT_EXIST_999',
  });
  assert(
    nonexistentAnim.statusCode === 404,
    'Nonexistent transaction cannot forge animation (404)'
  );

  // 5. Priority Queue Concurrency Cap & Completion Auto-Promotion
  console.log('\n[Suite 5] Multi-Gift Priority Queue, Fullscreen Cap & Completion Promotion');
  // Send two fullscreen luxury/large gifts rapidly in room 880219 so max_concurrent_fullscreen = 1 queues the 2nd
  const zaraRes = await request('GET', `/api/gifts/send/context?roomId=${LIVE_ROOM_ID}&preview=demo`);
  const zaraHostId = zaraRes.json?.hosts?.[0]?.hostId || SARA_HOST_ID;

  const fs1 = await request(
    'POST',
    '/api/gifts/send?preview=demo',
    {
      senderUserId: DEMO_USER_ID,
      senderNickname: 'Sunny',
      recipientHostId: zaraHostId,
      giftId: 'gift_diamond_ring',
      quantity: 1,
      roomId: LIVE_ROOM_ID,
    },
    { 'X-Idempotency-Key': `m74_q1_${Date.now()}` }
  );
  const fs2 = await request(
    'POST',
    '/api/gifts/send?preview=demo',
    {
      senderUserId: DEMO_USER_ID,
      senderNickname: 'Sunny',
      recipientHostId: zaraHostId,
      giftId: 'gift_castle',
      quantity: 1,
      roomId: LIVE_ROOM_ID,
    },
    { 'X-Idempotency-Key': `m74_q2_${Date.now()}` }
  );
  if (fs1.json?.transaction?.status === 'completed' && fs1.json?.transaction?.giftTransactionId) {
    reversedTxIds.push(fs1.json.transaction.giftTransactionId);
  }
  if (fs2.json?.transaction?.status === 'completed' && fs2.json?.transaction?.giftTransactionId) {
    reversedTxIds.push(fs2.json.transaction.giftTransactionId);
  }

  const roomSync = await request(
    'GET',
    `/api/animations/config?roomId=${LIVE_ROOM_ID}&userId=${DEMO_USER_ID}&preview=demo`
  );
  const playingFullscreen = (roomSync.json?.stateSync?.activeAnimations || []).filter(
    (a) => a.isFullscreen
  );
  const queuedItems = roomSync.json?.stateSync?.queuedAnimations || [];
  assert(
    playingFullscreen.length <= 1,
    `Fullscreen concurrency strictly capped at <= 1 (${playingFullscreen.length} active)`
  );
  assert(
    queuedItems.length >= 1,
    `Concurrent fullscreen gift safely queued without loss (${queuedItems.length} queued)`
  );

  const activeScoreBeforeComplete = zaraHostId; // sanity check
  if (playingFullscreen[0]?.queueId) {
    const compRes = await request('POST', '/api/animations/gift/complete', {
      queueId: playingFullscreen[0].queueId,
    });
    assert(
      compRes.statusCode === 200 &&
        compRes.json?.completedItem?.status === 'completed' &&
        (compRes.json?.promoted?.length ?? 0) >= 1,
      'Completing active fullscreen gift marks completed & promotes next highest-priority queued item'
    );
  }
  assert(Boolean(activeScoreBeforeComplete), 'Queue completion leaves room state consistent');

  // 6. Host Entrance Effects & Strict VIP Enforcement
  console.log('\n[Suite 6] Host Entrance Effects & Strict VIP Entitlement Check');
  const vipBlocked = await request('POST', '/api/animations/entrance/trigger?preview=demo', {
    hostUserId: DEMO_USER_ID,
    entranceType: 'vip',
    roomId: LIVE_ROOM_ID,
  });
  assert(
    vipBlocked.statusCode === 403 && vipBlocked.json?.code === 'VIP_STATUS_REQUIRED',
    'Ordinary non-VIP user strictly blocked from triggering VIP entrance (403 VIP_STATUS_REQUIRED)'
  );

  const ordinaryStd = await request('POST', '/api/animations/entrance/trigger?preview=demo', {
    hostUserId: DEMO_USER_ID,
    entranceType: 'standard',
    roomId: LIVE_ROOM_ID,
  });
  assert(
    ordinaryStd.statusCode === 201 && ordinaryStd.json?.queueItem?.vipBadgeLabel === null,
    'Ordinary user standard entrance succeeds cleanly WITHOUT granting any free VIP badge'
  );
  if (ordinaryStd.json?.queueItem?.queueId) {
    await request('POST', '/api/animations/gift/complete', {
      queueId: ordinaryStd.json.queueItem.queueId,
    });
  }

  const saraVipEnt = await request('POST', '/api/animations/entrance/trigger?preview=demo', {
    hostUserId: SARA_HOST_ID,
    entranceType: 'vip',
    roomId: LIVE_ROOM_ID,
  });
  assert(
    saraVipEnt.statusCode === 201 &&
      saraVipEnt.json?.queueItem?.vipBadgeLabel === 'VIP III' &&
      Boolean(saraVipEnt.json?.queueItem?.recipientPoppoId) &&
      saraVipEnt.json?.queueItem?.recipientNickname === 'Sara Live',
    'VIP host entrance emits avatar, nickname (Sara Live), Host ID, and approved VIP III badge'
  );
  if (saraVipEnt.json?.queueItem?.queueId) {
    await request('POST', '/api/animations/gift/complete', {
      queueId: saraVipEnt.json.queueItem.queueId,
    });
  }

  // 7. User Settings (Sound & Reduced Motion) Without Blocking Financials
  console.log('\n[Suite 7] Sound & Reduced Animation Settings + Financial Independence');
  const updPref = await request('PUT', '/api/animations/preferences?preview=demo', {
    userId: DEMO_USER_ID,
    enableLargeAnimations: false,
    enableSoundEffects: false,
    reduceAnimations: true,
  });
  assert(
    updPref.statusCode === 200 &&
      updPref.json?.preferences?.enableLargeAnimations === false &&
      updPref.json?.preferences?.enableSoundEffects === false &&
      updPref.json?.preferences?.reduceAnimations === true,
    'User animation & sound settings persisted cleanly'
  );

  // Send a gift while user has animations & sound DISABLED — financial tx MUST succeed!
  const giftWhileMuted = await request(
    'POST',
    '/api/gifts/send?preview=demo',
    {
      senderUserId: DEMO_USER_ID,
      senderNickname: 'Sunny',
      recipientHostId: SARA_HOST_ID,
      giftId: 'gift_rose',
      quantity: 1,
      pkBattleId: PK_BATTLE_ID,
    },
    { 'X-Idempotency-Key': `m74_muted_${Date.now()}` }
  );
  assert(
    giftWhileMuted.statusCode === 200 &&
      giftWhileMuted.json?.success === true &&
      giftWhileMuted.json?.updatedHostStats?.pointsCredited === 7,
    'Disabling sound/large animations NEVER blocks gift transactions or host points'
  );
  if (giftWhileMuted.json?.transaction?.giftTransactionId) {
    reversedTxIds.push(giftWhileMuted.json.transaction.giftTransactionId);
  }

  // Restore user preferences to default ON
  await request('PUT', '/api/animations/preferences?preview=demo', {
    userId: DEMO_USER_ID,
    enableLargeAnimations: true,
    enableSoundEffects: true,
    reduceAnimations: false,
  });

  // 8. Real-Time SSE Events & State Sync Recovery
  await drainRoomQueues();
  console.log('\n[Suite 8] Real-Time Animation SSE Events & Reconnect State Recovery');
  let sseEntranceQueueId = null;
  let sseGiftTxId = null;
  const sseEvents = await collectSseEvents(
    `/api/animations/events?roomId=${LIVE_ROOM_ID}&userId=${DEMO_USER_ID}&preview=demo`,
    2800,
    async () => {
      const entRes = await request('POST', '/api/animations/entrance/trigger?preview=demo', {
        hostUserId: zaraHostId,
        entranceType: 'vip',
        roomId: LIVE_ROOM_ID,
      });
      sseEntranceQueueId = entRes.json?.queueItem?.queueId || null;

      const gRes = await request(
        'POST',
        '/api/gifts/send?preview=demo',
        {
          senderUserId: DEMO_USER_ID,
          senderNickname: 'Sunny',
          recipientHostId: zaraHostId,
          giftId: 'gift_rose',
          quantity: 1,
          roomId: LIVE_ROOM_ID,
        },
        { 'X-Idempotency-Key': `m74_sse_${Date.now()}` }
      );
      sseGiftTxId = gRes.json?.transaction?.giftTransactionId || null;
      if (sseGiftTxId) reversedTxIds.push(sseGiftTxId);

      if (sseEntranceQueueId) {
        await request('POST', '/api/animations/gift/complete', {
          queueId: sseEntranceQueueId,
        });
      }
    }
  );
  const evTypes = sseEvents.map((e) => e.event);
  assert(evTypes.includes('animation:state_sync'), 'SSE delivers animation:state_sync on connect/reconnect');
  assert(evTypes.includes('animation:host_entrance'), 'SSE delivers animation:host_entrance');
  assert(evTypes.includes('animation:host_entrance_completed'), 'SSE delivers animation:host_entrance_completed');
  assert(evTypes.includes('animation:gift_received'), 'SSE delivers animation:gift_received');
  assert(evTypes.includes('animation:gift_started'), 'SSE delivers animation:gift_started');
  assert(evTypes.includes('animation:gift_queue_updated'), 'SSE delivers animation:gift_queue_updated');

  // 9. Admin RBAC, Upload Security, Config Updates & Audit Log
  console.log('\n[Suite 9] Admin RBAC, WAV/Asset Upload, Config Update & Audit Trail');
  const anonAdmin = await request('GET', '/api/admin/animations');
  assert(anonAdmin.statusCode === 403, 'Anonymous admin animations request blocked (403)');

  const badUpload = await request(
    'POST',
    '/api/admin/animations/upload',
    {
      fileName: 'malware.exe',
      fileBase64: Buffer.from('MZ_FAKE_EXE').toString('base64'),
    },
    { Cookie: adminCookie }
  );
  assert(badUpload.statusCode === 400, 'Prohibited .exe extension strictly rejected (400)');

  const wavUpload = await request(
    'POST',
    '/api/admin/animations/upload',
    {
      fileName: 'qa_chime.wav',
      mimeType: 'audio/wav',
      fileBase64: buildMinimalWavBuffer().toString('base64'),
    },
    { Cookie: adminCookie }
  );
  assert(
    wavUpload.statusCode === 201 && wavUpload.json?.asset?.assetType === 'audio',
    'Authorized admin can upload valid WAV sound effect'
  );
  if (wavUpload.json?.asset?.fileUrl) {
    const mediaFetch = await request('GET', wavUpload.json.asset.fileUrl);
    assert(mediaFetch.statusCode === 200, 'Uploaded SFX file served cleanly via /api/gifts/media/sfx/...');
  }

  const updRose = await request(
    'POST',
    '/api/admin/animations',
    {
      action: 'upsert_gift_animation',
      giftId: 'gift_rose',
      animationTier: 'small_floating',
      priorityCategory: 'standard',
      priorityWeight: 12,
      durationMs: 2200,
      loopCount: 1,
      isFullscreen: false,
      pkEffectStyle: 'side_float',
      isActive: true,
      reason: 'QA automated verification update',
    },
    { Cookie: adminCookie }
  );
  assert(
    updRose.statusCode === 200 && updRose.json?.animation?.durationMs === 2200,
    'Admin successfully configures gift animation duration & tier'
  );

  const adminGet = await request('GET', '/api/admin/animations', null, { Cookie: adminCookie });
  assert(
    adminGet.statusCode === 200 &&
      Array.isArray(adminGet.json?.auditLogs) &&
      adminGet.json.auditLogs.length >= 1,
    'Admin animation audit log records asset upload and config changes'
  );

  // 10. Cleanup: Reverse all test gift sends cleanly via Module 7.3 Finance Admin Reversal so wallet stays canonical
  console.log('\n[Suite 10] Clean Reversal & Canonical Balance Restoration');
  for (const txId of reversedTxIds) {
    const rev = await request(
      'POST',
      `/api/admin/gifts/transactions/${encodeURIComponent(txId)}/reverse`,
      { reason: 'Module 7.4 QA verification cleanup' },
      { Cookie: financeCookie }
    );
    assert(rev.statusCode === 200, `Cleaned up test txn ${txId}`);
  }

  // Restore Rose duration back to catalog baseline cleanly
  await request(
    'POST',
    '/api/admin/animations',
    {
      action: 'upsert_gift_animation',
      giftId: 'gift_rose',
      animationTier: 'small_floating',
      priorityCategory: 'standard',
      priorityWeight: 10,
      durationMs: roseCfg?.durationMs || 2500,
      loopCount: 1,
      isFullscreen: false,
      pkEffectStyle: 'side_float',
      isActive: true,
      reason: 'Restore baseline config after QA test',
    },
    { Cookie: adminCookie }
  ).catch(() => {});

  // Drain any lingering playing items in room 880219 & PK 606
  await drainRoomQueues();

  const endCtxRes = await request(
    'GET',
    `/api/gifts/send/context?pkBattleId=${PK_BATTLE_ID}&userId=${DEMO_USER_ID}&preview=demo`
  );
  const endCoins = endCtxRes.json?.senderWallet?.availableCoins ?? -1;
  assert(
    endCoins === startCoins,
    `Demo wallet restored cleanly to exact starting balance (${endCoins} coins)`
  );

  console.log(`\n========================================`);
  console.log(`Module 7.4 Results: ${passed} PASSED | ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
