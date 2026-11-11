const http = require('http');
const https = require('https');

const BASE_URL = process.env.TEST_BASE_URL || process.argv[2] || 'http://127.0.0.1:3006';
const RUN_ID = Date.now();
const SARA_HOST_ID = '00000000-0000-0000-0000-000000088201';
const AYESHA_HOST_ID = '00000000-0000-0000-0000-000000088202';
const PK_BATTLE_ID = '00000000-0000-0000-0000-000000000603';
const LIVE_ROOM_ID = '880219';

let passed = 0;
let failed = 0;

function assert(cond, label, extra = '') {
  if (cond) {
    passed++;
    console.log(`  ✓ PASS: ${label}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${label}${extra ? ` (${extra})` : ''}`);
  }
}

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const mod = url.protocol === 'https:' ? https : http;
    const payload = body !== null ? JSON.stringify(body) : null;
    const reqHeaders = {
      Accept: 'application/json, text/html, text/csv',
      ...headers,
    };
    if (payload !== null) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = mod.request(
      {
        method,
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        headers: reqHeaders,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let json = null;
          try {
            json = JSON.parse(text);
          } catch {}
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            text,
            json,
          });
        });
      }
    );
    req.on('error', reject);
    if (payload !== null) req.write(payload);
    req.end();
  });
}

function collectEarningsSse(path, durationMs, triggerFn, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const mod = url.protocol === 'https:' ? https : http;
    const events = [];
    let buffer = '';
    let triggered = false;

    const req = mod.request(
      {
        method: 'GET',
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        headers: { Accept: 'text/event-stream', ...headers },
      },
      (res) => {
        if (res.statusCode !== 200) {
          resolve({ statusCode: res.statusCode, events: [] });
          req.destroy();
          return;
        }
        res.on('data', async (chunk) => {
          buffer += chunk.toString('utf8');
          const frames = buffer.split('\n\n');
          buffer = frames.pop() || '';
          for (const frame of frames) {
            if (!frame.trim() || frame.startsWith(':')) continue;
            let eventType = 'message';
            let dataStr = '';
            for (const line of frame.split('\n')) {
              if (line.startsWith('event:')) eventType = line.slice(6).trim();
              else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
            }
            let parsed = null;
            try {
              parsed = JSON.parse(dataStr);
            } catch {}
            events.push({ event: eventType, data: parsed });

            if (!triggered && eventType === 'earnings:state_sync' && triggerFn) {
              triggered = true;
              try {
                await triggerFn();
              } catch (e) {
                reject(e);
              }
            }
          }
        });
      }
    );
    req.on('error', reject);
    req.end();

    setTimeout(() => {
      try {
        req.destroy();
      } catch {}
      resolve({ statusCode: 200, events });
    }, durationMs);
  });
}

async function loginAs(email, password) {
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

  const consentRes = await request('POST', '/api/consent', {
    action: 'accept',
    termsAccepted: true,
    privacyAccepted: true,
    isAdultConfirmed: true,
  });
  extract(consentRes.headers['set-cookie']);

  const loginRes = await request(
    'POST',
    '/api/auth/login',
    { email, password },
    { Cookie: cookieStr() }
  );
  extract(loginRes.headers['set-cookie']);
  return { statusCode: loginRes.statusCode, user: loginRes.json?.user || null, cookie: cookieStr() };
}

async function runTests() {
  console.log(`\n=== MODULE 7.5 HOST GIFT SHARE INTO POINTS VERIFICATION (${BASE_URL}) ===\n`);

  // 0. Sign in RBAC test accounts
  console.log('[Suite 0] Sign in Finance Admin, Ordinary Admin, and Regular Viewer');
  const [financeAuth, ordinaryAuth, viewerAuth] = await Promise.all([
    loginAs('finance@popolive.com', 'FinancePass123!'),
    loginAs('ordinaryadmin@popolive.com', 'AdminPass123!'),
    loginAs('viewer701@popolive.com', 'ViewerPass123!'),
  ]);
  assert(financeAuth.statusCode === 200 && Boolean(financeAuth.cookie), 'Finance admin signed in');
  assert(ordinaryAuth.statusCode === 200 && Boolean(ordinaryAuth.cookie), 'Ordinary admin signed in');
  assert(viewerAuth.statusCode === 200 && Boolean(viewerAuth.cookie), 'Standard viewer signed in');

  const testSenderId = `m75_sender_${RUN_ID}`;
  const emptySenderId = `m75_lowcoin_${RUN_ID}`;
  const seeded = await request(
    'POST',
    '/api/admin/finance/adjust',
    {
      targetUserId: testSenderId,
      balanceType: 'coins',
      operation: 'credit',
      amount: 5000,
      reason: `Module 7.5 verification seed (${RUN_ID})`,
      idempotencyKey: `M75_SEED_${RUN_ID}`,
    },
    { Cookie: financeAuth.cookie }
  );
  const lowSeed = await request(
    'POST',
    '/api/admin/finance/adjust',
    {
      targetUserId: emptySenderId,
      balanceType: 'coins',
      operation: 'credit',
      amount: 5,
      reason: `Module 7.5 low-coin test seed (${RUN_ID})`,
      idempotencyKey: `M75_LOW_${RUN_ID}`,
    },
    { Cookie: financeAuth.cookie }
  );
  assert(seeded.statusCode === 200 && lowSeed.statusCode === 200, 'Isolated test wallets seeded via finance admin');

  const createdTxIds = [];

  // 1. UI Page Route & Non-Cash Disclosure
  console.log('\n[Suite 1] UI Dashboard Route & Approved Rules Check');
  const uiRes = await request('GET', '/earnings?preview=demo');
  assert(uiRes.statusCode === 200, 'GET /earnings?preview=demo returns 200 OK');
  assert(
    uiRes.text.includes('Host Points Share') && uiRes.text.includes('P7.5'),
    'Dashboard page renders Host Points Share title and P7.5 badge'
  );

  // Resolve Zara host ID for Room 880219
  const ctxRes = await request('GET', `/api/gifts/send/context?roomId=${LIVE_ROOM_ID}&preview=demo`);
  const zaraHostId = ctxRes.json?.hosts?.[0]?.hostId;
  assert(Boolean(zaraHostId), `Resolved live room 880219 host (${zaraHostId})`);

  const hostDashBefore = await request(
    'GET',
    `/api/earnings/dashboard?hostUserId=${SARA_HOST_ID}&preview=demo&fresh=true`
  );
  const startSaraPoints = hostDashBefore.json?.dashboard?.currentPointsBalance ?? 0;
  const startSaraToday = hostDashBefore.json?.dashboard?.todayEarnedPoints ?? 0;
  assert(
    hostDashBefore.statusCode === 200 &&
      hostDashBefore.json?.dashboard?.hostSharePercentage === 70 &&
      hostDashBefore.json?.dashboard?.platformSharePercentage === 30 &&
      hostDashBefore.json?.dashboard?.pointsAreNonCash === true &&
      hostDashBefore.json?.dashboard?.coinsAndPointsSeparate === true,
    'Dashboard verifies approved 70% host share, 30% platform share, and strict non-cash separation'
  );

  // 2. Live Gift Share Math: 1,000 coins -> 700 Host Points + 300 Platform Share
  console.log('\n[Suite 2] 70% Host Share & 30% Platform Share Calculation (1,000 Coins -> 700 Points)');
  const pkSend1000 = await request(
    'POST',
    '/api/gifts/send?preview=demo',
    {
      senderUserId: testSenderId,
      senderNickname: 'M75Tester',
      recipientHostId: SARA_HOST_ID,
      giftId: 'gift_crown', // 500 coins x 2 = 1,000 coins
      quantity: 2,
      pkBattleId: PK_BATTLE_ID,
    },
    { 'X-Idempotency-Key': `M75_1000_${RUN_ID}` }
  );
  const tx1000 = pkSend1000.json?.transaction;
  if (tx1000?.giftTransactionId) createdTxIds.push(tx1000.giftTransactionId);

  assert(pkSend1000.statusCode === 200 && pkSend1000.json?.success === true, '1,000-coin PK gift sent cleanly');
  assert(
    tx1000?.totalCoinAmount === 1000 &&
      tx1000?.hostPointsCredited === 700 &&
      tx1000?.platformShare === 300,
    `Exact split recorded: 1000 coins -> 700 host points (70%) + 300 platform share (30%)`
  );

  const saraWalletCheck = await request(
    'GET',
    `/api/wallet/balance?userId=${SARA_HOST_ID}&preview=demo&fresh=true`
  );
  assert(
    saraWalletCheck.json?.wallet?.points === startSaraPoints + 700,
    `Host points balance credited exact +700 (${saraWalletCheck.json?.wallet?.points})`
  );

  const dashAfter1000 = await request(
    'GET',
    `/api/earnings/dashboard?hostUserId=${SARA_HOST_ID}&preview=demo&fresh=true`
  );
  assert(
    dashAfter1000.json?.dashboard?.todayEarnedPoints === startSaraToday + 700 &&
      dashAfter1000.json?.dashboard?.latestBreakdown?.giftTransactionId === tx1000?.giftTransactionId &&
      dashAfter1000.json?.dashboard?.latestBreakdown?.platformShareAmount === 300,
    'Dashboard today stats & latestBreakdown updated atomically with 700 pts / 300 platform share'
  );

  // 3. Duplicate Gift Transaction Prevention (Idempotency Replay = 0 duplicate share credit)
  console.log('\n[Suite 3] Duplicate Share Prevention (Idempotency Replay)');
  const replayRes = await request(
    'POST',
    '/api/gifts/send?preview=demo',
    {
      senderUserId: testSenderId,
      senderNickname: 'M75Tester',
      recipientHostId: SARA_HOST_ID,
      giftId: 'gift_crown',
      quantity: 2,
      pkBattleId: PK_BATTLE_ID,
    },
    { 'X-Idempotency-Key': `M75_1000_${RUN_ID}` }
  );
  const saraAfterReplay = await request(
    'GET',
    `/api/wallet/balance?userId=${SARA_HOST_ID}&preview=demo&fresh=true`
  );
  assert(
    replayRes.statusCode === 200 &&
      replayRes.json?.deduplicated === true &&
      replayRes.json?.updatedHostStats?.pointsCredited === 0 &&
      replayRes.json?.transaction?.giftTransactionId === tx1000?.giftTransactionId &&
      saraAfterReplay.json?.wallet?.points === startSaraPoints + 700,
    'Replaying duplicate gift request NEVER double-credits host points or host_earning_shares'
  );

  // 4. Failed Gift Sends 0 Points & 0 Host Shares
  console.log('\n[Suite 4] Failed Gift Transaction Must Credit ZERO Host Points');
  const failedRes = await request(
    'POST',
    '/api/gifts/send?preview=demo',
    {
      senderUserId: emptySenderId,
      senderNickname: 'LowCoinTester',
      recipientHostId: SARA_HOST_ID,
      giftId: 'gift_rose', // 10 coins > 5 balance
      quantity: 1,
      pkBattleId: PK_BATTLE_ID,
    },
    { 'X-Idempotency-Key': `M75_FAIL_${RUN_ID}` }
  );
  const saraAfterFail = await request(
    'GET',
    `/api/wallet/balance?userId=${SARA_HOST_ID}&preview=demo&fresh=true`
  );
  assert(
    failedRes.statusCode === 400 &&
      failedRes.json?.transaction?.status === 'failed' &&
      saraAfterFail.json?.wallet?.points === startSaraPoints + 700,
    'Failed gift attempt strictly awards 0 points & leaves host balance untouched'
  );

  // Verify failed gift is NOT in host_earning_shares credited history
  const histAfterFail = await request(
    'GET',
    `/api/earnings/history?hostUserId=${SARA_HOST_ID}&search=${encodeURIComponent(
      failedRes.json?.transaction?.giftTransactionId || 'NONE'
    )}&preview=demo`
  );
  assert(
    (histAfterFail.json?.items || []).length === 0,
    'Failed gift transaction does not appear in host earned shares ledger'
  );

  // 5. Client Tampering Protection
  console.log('\n[Suite 5] Client Financial Override & Direct Mutation Blocking');
  const postDashBlock = await request('POST', '/api/earnings/dashboard', { pointsCredited: 999999 });
  assert(postDashBlock.statusCode === 403, 'Direct POST /api/earnings/dashboard blocked (403)');

  const tamperSend = await request(
    'POST',
    '/api/gifts/send?preview=demo',
    {
      senderUserId: testSenderId,
      recipientHostId: zaraHostId,
      liveRoomId: LIVE_ROOM_ID,
      giftId: 'gift_rose',
      quantity: 1,
      hostSharePercentage: 99,
      pointsCredited: 9999,
      platformShareAmount: 0,
    },
    { 'X-Idempotency-Key': `M75_TAMPER_${RUN_ID}` }
  );
  assert(tamperSend.statusCode === 403, 'Client override of hostSharePercentage/pointsCredited/platformShare blocked (403)');

  // 6. Strict Privacy & RBAC Checks
  console.log('\n[Suite 6] Host Privacy & Finance Admin RBAC Enforcement');
  const anonPrivateDash = await request('GET', `/api/earnings/dashboard?hostUserId=${SARA_HOST_ID}`);
  assert(anonPrivateDash.statusCode === 403, 'Anonymous request without preview rejected (403 EARNINGS_ACCESS_DENIED)');

  const viewerSpyDash = await request(
    'GET',
    `/api/earnings/dashboard?hostUserId=${SARA_HOST_ID}`,
    null,
    { Cookie: viewerAuth.cookie }
  );
  assert(viewerSpyDash.statusCode === 403, 'Authenticated viewer blocked from viewing another host earnings (403)');

  const viewerSpySse = await collectEarningsSse(
    `/api/earnings/events?hostUserId=${SARA_HOST_ID}`,
    500,
    null,
    { Cookie: viewerAuth.cookie }
  );
  assert(viewerSpySse.statusCode === 403, 'Authenticated viewer blocked from subscribing to another host SSE events (403)');

  const ordAdminReport = await request('GET', '/api/admin/finance/earnings', null, {
    Cookie: ordinaryAuth.cookie,
  });
  assert(ordAdminReport.statusCode === 403, 'Ordinary admin blocked from finance host-share report (403)');

  const ordAdminExport = await request('GET', '/api/admin/finance/earnings/export', null, {
    Cookie: ordinaryAuth.cookie,
  });
  assert(ordAdminExport.statusCode === 403, 'Ordinary admin blocked from finance CSV export (403)');

  // 7. Charts, Date Filters, Pagination & Source Filtering
  console.log('\n[Suite 7] Dashboard Charts, Date Filters & Pagination');
  const todayUtc = new Date().toISOString().slice(0, 10);
  const filteredHist = await request(
    'GET',
    `/api/earnings/history?hostUserId=${SARA_HOST_ID}&status=credited&sourceType=pk_battle&fromDate=${todayUtc}&toDate=${todayUtc}&limit=5&page=1&preview=demo`
  );
  assert(
    filteredHist.statusCode === 200 &&
      (filteredHist.json?.items || []).some((r) => r.giftTransactionId === tx1000?.giftTransactionId),
    'History endpoint filters cleanly by status=credited, sourceType=pk_battle, and UTC date range'
  );
  assert(
    Array.isArray(dashAfter1000.json?.dashboard?.dailySeries) &&
      dashAfter1000.json.dashboard.dailySeries.length === 7 &&
      Array.isArray(dashAfter1000.json?.dashboard?.topGiftsSeries),
    '7-day daily chart series and top gift breakdown populated from backend aggregations'
  );

  // 8. Real-Time SSE Streaming & Host-Scoped Events + Reconnect
  console.log('\n[Suite 8] Real-Time SSE Host-Scoped Events & Finance Admin Report + Reversal');
  let sseTxId = null;
  const sseStreamRes = await collectEarningsSse(
    `/api/earnings/events?hostUserId=${AYESHA_HOST_ID}&preview=demo`,
    2600,
    async () => {
      const ayeshaSend = await request(
        'POST',
        '/api/gifts/send?preview=demo',
        {
          senderUserId: testSenderId,
          senderNickname: 'M75Tester',
          recipientHostId: AYESHA_HOST_ID,
          giftId: 'gift_rose',
          quantity: 10, // 100 coins -> 70 points + 30 platform share
          pkBattleId: PK_BATTLE_ID,
        },
        { 'X-Idempotency-Key': `M75_ROSE10_${RUN_ID}` }
      );
      if (ayeshaSend.json?.transaction?.giftTransactionId) {
        sseTxId = ayeshaSend.json.transaction.giftTransactionId;
        createdTxIds.push(sseTxId);
      }
    }
  );
  const evNames = sseStreamRes.events.map((e) => e.event);
  assert(evNames.includes('earnings:state_sync'), 'SSE delivers earnings:state_sync on connect/reconnect');
  assert(evNames.includes('earnings:gift_received'), 'SSE delivers earnings:gift_received strictly to host');
  assert(evNames.includes('earnings:points_credited'), 'SSE delivers earnings:points_credited (+70 points)');
  assert(evNames.includes('earnings:balance_updated'), 'SSE delivers earnings:balance_updated');
  assert(evNames.includes('earnings:history_updated'), 'SSE delivers earnings:history_updated');

  // Finance Admin Report + CSV Export verification
  const finReport = await request(
    'GET',
    `/api/admin/finance/earnings?search=${encodeURIComponent(tx1000?.giftTransactionId || '')}`,
    null,
    { Cookie: financeAuth.cookie }
  );
  assert(
    finReport.statusCode === 200 &&
      finReport.json?.records?.[0]?.pointsCredited === 700 &&
      finReport.json?.records?.[0]?.platformShareAmount === 300 &&
      finReport.json?.summary?.totalPlatformShare >= 300,
    'Finance admin inspects host share (700) & platform share (300) cleanly'
  );

  const finCsv = await request(
    'GET',
    `/api/admin/finance/earnings/export?search=${encodeURIComponent(tx1000?.giftTransactionId || '')}`,
    null,
    { Cookie: financeAuth.cookie }
  );
  assert(
    finCsv.statusCode === 200 &&
      (finCsv.headers['content-type'] || '').includes('text/csv') &&
      finCsv.text.includes(tx1000?.giftTransactionId || '') &&
      finCsv.text.includes('700'),
    'Finance admin exports RFC-4180 CSV report with exact 70/30 columns'
  );

  // 9. Reversal Safety Check + Cleanup
  console.log('\n[Suite 9] Gift Reversal Safety & Canonical Balance Restoration');
  const revTxRes = await request(
    'POST',
    `/api/admin/gifts/transactions/${encodeURIComponent(tx1000.giftTransactionId)}/reverse`,
    { reason: `Module 7.5 reversal audit test (${RUN_ID})` },
    { Cookie: financeAuth.cookie }
  );
  assert(revTxRes.statusCode === 200, 'Finance admin reverses 1,000-coin gift transaction cleanly');

  const dashAfterRev = await request(
    'GET',
    `/api/earnings/dashboard?hostUserId=${SARA_HOST_ID}&preview=demo&fresh=true`
  );
  assert(
    dashAfterRev.json?.dashboard?.currentPointsBalance === startSaraPoints &&
      dashAfterRev.json?.dashboard?.todayEarnedPoints === startSaraToday,
    'After reversal: Host balance & daily stats return to exact pre-gift state without negative drift'
  );

  const revHistCheck = await request(
    'GET',
    `/api/earnings/history?hostUserId=${SARA_HOST_ID}&status=reversed&search=${encodeURIComponent(
      tx1000.giftTransactionId
    )}&preview=demo`
  );
  assert(
    revHistCheck.json?.items?.[0]?.status === 'reversed' &&
      Boolean(revHistCheck.json?.items?.[0]?.reversalReference),
    'host_earning_shares preserves reversed audit status with linked reversalReference'
  );

  // Reverse the SSE Rose x10 test gift too so Ayesha & battle scores stay clean
  if (sseTxId) {
    const revRose = await request(
      'POST',
      `/api/admin/gifts/transactions/${encodeURIComponent(sseTxId)}/reverse`,
      { reason: `Module 7.5 QA cleanup (${RUN_ID})` },
      { Cookie: financeAuth.cookie }
    );
    assert(revRose.statusCode === 200, 'Cleaned up secondary Rose x10 verification transaction');
  }

  console.log(`\n========================================`);
  console.log(`Module 7.5 Results: ${passed} PASSED | ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal Module 7.5 test runner error:', err);
  process.exit(1);
});
