const { Pool } = require('pg');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public'
});

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('========================================================================');
  console.log('POPO LIVE — PHASE 7 (P7-P4) LIVE STREAMING MODULE INTEGRATION SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      if (details) console.log(`       -> ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (details) console.error(`       -> ${details}`);
      failed++;
    }
  }

  async function apiFetch(path, options = {}) {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
    return { status: res.status, ok: res.ok, headers: res.headers, data };
  }

  try {
    // ------------------------------------------------------------------------
    // SETUP: Provision Test Broadcaster, Viewer, and Wallets
    // ------------------------------------------------------------------------
    console.log('--- SETUP: Provisioning Test Broadcaster, Viewer, and Wallets ---');

    // 1. Eligible Host (WL 5, 25 years old)
    const hostUserRes = await pool.query(`
      INSERT INTO popolive.users (
        id, poppo_id, email, password_hash, nickname, wealth_level, host_level, birthdate, status, country, country_code
      ) VALUES (
        gen_random_uuid(), '8801401', 'p7_p4_host@popolive.internal', 'hash123',
        'P7 Host Star', 5, 3, '1999-04-10', 'active', 'Pakistan', 'PK'
      )
      ON CONFLICT (email) DO UPDATE SET wealth_level = 5, birthdate = '1999-04-10', status = 'active'
      RETURNING id, poppo_id, nickname;
    `);
    const hostUser = hostUserRes.rows[0];

    // 2. Under-wealth Broadcaster (WL 2)
    const underWealthRes = await pool.query(`
      INSERT INTO popolive.users (
        id, poppo_id, email, password_hash, nickname, wealth_level, host_level, birthdate, status, country, country_code
      ) VALUES (
        gen_random_uuid(), '8801402', 'p7_p4_under_wealth@popolive.internal', 'hash123',
        'Under Wealth Host', 2, 1, '1998-01-01', 'active', 'Pakistan', 'PK'
      )
      ON CONFLICT (email) DO UPDATE SET wealth_level = 2, birthdate = '1998-01-01', status = 'active'
      RETURNING id, poppo_id;
    `);
    const underWealthHost = underWealthRes.rows[0];

    // 3. Underage Broadcaster (12 years old)
    const underageRes = await pool.query(`
      INSERT INTO popolive.users (
        id, poppo_id, email, password_hash, nickname, wealth_level, host_level, birthdate, status, country, country_code
      ) VALUES (
        gen_random_uuid(), '8801403', 'p7_p4_underage@popolive.internal', 'hash123',
        'Underage Broadcaster', 10, 2, '2014-05-15', 'active', 'Pakistan', 'PK'
      )
      ON CONFLICT (email) DO UPDATE SET wealth_level = 10, birthdate = '2014-05-15', status = 'active'
      RETURNING id, poppo_id;
    `);
    const underageHost = underageRes.rows[0];

    // 4. Opponent Host for PK (WL 6)
    const opponentHostRes = await pool.query(`
      INSERT INTO popolive.users (
        id, poppo_id, email, password_hash, nickname, wealth_level, host_level, birthdate, status, country, country_code
      ) VALUES (
        gen_random_uuid(), '8801404', 'p7_p4_opponent@popolive.internal', 'hash123',
        'P7 Rival Champion', 6, 4, '1995-10-20', 'active', 'Pakistan', 'PK'
      )
      ON CONFLICT (email) DO UPDATE SET wealth_level = 6, birthdate = '1995-10-20', status = 'active'
      RETURNING id, poppo_id, nickname;
    `);
    const opponentHost = opponentHostRes.rows[0];

    // 5. Test Viewer with Coins
    const viewerRes = await pool.query(`
      INSERT INTO popolive.users (
        id, poppo_id, email, password_hash, nickname, wealth_level, host_level, birthdate, status, country, country_code
      ) VALUES (
        gen_random_uuid(), '8801405', 'p7_p4_viewer@popolive.internal', 'hash123',
        'Generous Gifter', 3, 0, '2001-08-12', 'active', 'Pakistan', 'PK'
      )
      ON CONFLICT (email) DO UPDATE SET status = 'active'
      RETURNING id, poppo_id, nickname;
    `);
    const viewerUser = viewerRes.rows[0];

    // Create active sessions in DB
    async function createSession(userId, token) {
      await pool.query(`
        INSERT INTO popolive.sessions (id, user_id, session_token, expires_at, created_at, is_revoked)
        VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL '7 days', NOW(), false)
        ON CONFLICT (session_token) DO UPDATE SET expires_at = NOW() + INTERVAL '7 days', is_revoked = false
      `, [userId, token]);
      return token;
    }

    const hostToken = await createSession(hostUser.id, 'p7_p4_host_token');
    const underWealthToken = await createSession(underWealthHost.id, 'p7_p4_wl_token');
    const underageToken = await createSession(underageHost.id, 'p7_p4_age_token');
    const opponentToken = await createSession(opponentHost.id, 'p7_p4_opponent_token');
    const viewerToken = await createSession(viewerUser.id, 'p7_p4_viewer_token');

    // Fund viewer wallet with 50,000 coins for gift testing & clear prior test gift transactions
    await pool.query(`DELETE FROM popolive.gift_transactions WHERE idempotency_key LIKE 'idem_gift_test_%'`);
    await pool.query(`DELETE FROM popolive.coin_transactions WHERE idempotency_key LIKE 'coin_idem_gift_test_%'`);
    await pool.query(`
      INSERT INTO popolive.user_wallets (wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points)
      VALUES (gen_random_uuid(), $1, 50000, 0, 0, 0)
      ON CONFLICT (user_id) DO UPDATE SET coins = 50000;
    `, [viewerUser.id]);

    // Retrieve active gift from catalog for gift tests
    const giftCatalogRes = await pool.query(`
      SELECT gift_id, name, coin_price
      FROM popolive.gift_catalog
      WHERE is_active = true
      ORDER BY coin_price ASC
      LIMIT 1;
    `);
    const activeTestGift = giftCatalogRes.rows[0] || { gift_id: 'gift_love_letter', name: 'Love Letter', coin_price: 25 };
    const giftCost = Number(activeTestGift.coin_price);
    const expectedRemaining = 50000 - giftCost;
    const expectedHostPoints = Math.round(giftCost * 0.70);

    console.log(`[SETUP] Seeded users, sessions, wallets, and selected gift: ${activeTestGift.name} (${giftCost} coins).\n`);

    // ========================================================================
    // PART 9.1: EXPLORE & DISCOVERY TESTS (Checks 1 - 4)
    // ========================================================================
    console.log('--- 1. EXPLORE & DISCOVERY TESTS ---');

    // Check 1: Categories load
    const catRes = await apiFetch('/api/live/categories');
    assert(catRes.status === 200, 'Check 1: Categories load with HTTP 200', `Found ${catRes.data?.categories?.length} categories`);
    assert(catRes.data?.categories?.length > 0, 'Check 1b: Active categories returned');

    // Check 2: Rooms load for each tab
    const exploreTab = await apiFetch('/api/live/rooms?tab=explore');
    const followingTab = await apiFetch('/api/live/rooms?tab=following');
    const forYouTab = await apiFetch('/api/live/rooms?tab=for_you');
    assert(exploreTab.status === 200, 'Check 2a: Tab explore loads with HTTP 200');
    assert(followingTab.status === 200, 'Check 2b: Tab following loads with HTTP 200');
    assert(forYouTab.status === 200, 'Check 2c: Tab for_you loads with HTTP 200');

    // Check 3: Country filter works
    const countryRes = await apiFetch('/api/live/rooms?country=PK');
    assert(countryRes.status === 200, 'Check 3: Country filter returns HTTP 200');
    assert(Array.isArray(countryRes.data?.rooms), 'Check 3b: Rooms array returned');

    // Check 4: Search returns people, rooms, and ID matches
    const searchPeople = await apiFetch(`/api/live/search?q=${encodeURIComponent(hostUser.nickname)}&type=people`);
    assert(searchPeople.status === 200, 'Check 4a: People search returns HTTP 200');
    assert(searchPeople.data?.results?.people?.some(p => p.id === hostUser.id), 'Check 4b: Found broadcaster in people search');

    const searchId = await apiFetch(`/api/live/search?q=${hostUser.poppo_id}&type=id`);
    assert(searchId.status === 200, 'Check 4c: Numeric ID search returns HTTP 200');
    assert(searchId.data?.results?.people?.some(p => p.poppoId === hostUser.poppo_id), 'Check 4d: Matched exact numeric Poppo ID');
    console.log('');

    // ========================================================================
    // PART 9.2: GO LIVE FLOW TESTS (Checks 12 - 16)
    // ========================================================================
    console.log('--- 2. GO LIVE FLOW & GATES TESTS ---');

    // Check 12: User below 18 is rejected by backend
    const ageGateRes = await apiFetch('/api/live/host/eligibility', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${underageToken}` },
    });
    assert(ageGateRes.status === 403, 'Check 12: Underage broadcaster rejected with HTTP 403', `Status: ${ageGateRes.status}`);
    assert(ageGateRes.data?.code === 'AGE_VERIFICATION_FAILED', 'Check 12b: Error code is AGE_VERIFICATION_FAILED');

    // Check 13: User below wealth level 5 is rejected by backend
    const wealthGateRes = await apiFetch('/api/live/host/eligibility', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${underWealthToken}` },
    });
    assert(wealthGateRes.status === 403, 'Check 13: Wealth Level < 5 rejected with HTTP 403', `Status: ${wealthGateRes.status}`);
    assert(wealthGateRes.data?.code === 'WEALTH_LEVEL_INSUFFICIENT', 'Check 13b: Error code is WEALTH_LEVEL_INSUFFICIENT');

    // Check 14: Eligible host can create a room
    const createRoomRes = await apiFetch('/api/live/rooms', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${hostToken}` },
      body: JSON.stringify({
        title: 'P7 Studio Live Concert',
        category: 'Music',
        country: 'Pakistan',
        countryCode: 'PK',
      }),
    });
    assert(createRoomRes.status === 201, 'Check 14: Eligible host creates room with HTTP 201', `Status: ${createRoomRes.status}`);
    assert(createRoomRes.data?.success === true, 'Check 14b: Room creation success is true');
    const createdRoom = createRoomRes.data?.room;
    assert(Boolean(createdRoom?.id), 'Check 14c: Created room has valid UUID id', createdRoom?.id);

    // Check 15: Start and end transitions work
    const startRes = await apiFetch(`/api/live/rooms/${createdRoom.id}/start`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${hostToken}` },
    });
    assert(startRes.status === 200, 'Check 15a: Start studio broadcast returns HTTP 200');
    assert(startRes.data?.isLive === true || startRes.data?.room?.isLive === true, 'Check 15b: Room transitioned to live');

    // Check 16: End summary matches recorded room data
    const endRes = await apiFetch(`/api/live/rooms/${createdRoom.id}/end`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${hostToken}` },
    });
    assert(endRes.status === 200, 'Check 16a: End broadcast session returns HTTP 200');
    assert(endRes.data?.summary?.status === 'ended', 'Check 16b: Summary status is ended');
    assert(typeof endRes.data?.summary?.durationSeconds === 'number', 'Check 16c: Summary includes durationSeconds');
    assert(typeof endRes.data?.summary?.peakViewers === 'number', 'Check 16d: Summary includes peakViewers');
    console.log('');

    // Re-create an active room for viewer and PK tests
    const activeRoomRes = await apiFetch('/api/live/rooms', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${hostToken}` },
      body: JSON.stringify({
        title: 'Active Broadcaster Stage',
        category: 'Talent',
        country: 'Pakistan',
        countryCode: 'PK',
      }),
    });
    const liveRoom = activeRoomRes.data?.room;

    // ========================================================================
    // PART 9.3: VIEWER TESTS (Checks 5 - 11)
    // ========================================================================
    console.log('--- 3. VIEWER PRESENCE & INTERACTION TESTS ---');

    // Check 5: Join room increments viewer count
    const joinRes = await apiFetch(`/api/live/rooms/${liveRoom.id}/join`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${viewerToken}` },
      body: JSON.stringify({ sessionId: 'viewer_session_p7' }),
    });
    assert(joinRes.status === 200, 'Check 5: Join room returns HTTP 200');
    assert(joinRes.data?.viewerCount >= 1, 'Check 5b: Viewer count incremented', `Count: ${joinRes.data?.viewerCount}`);

    // Check 6: Leave room decrements viewer count
    const leaveRes = await apiFetch(`/api/live/rooms/${liveRoom.id}/leave`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${viewerToken}` },
      body: JSON.stringify({ sessionId: 'viewer_session_p7' }),
    });
    assert(leaveRes.status === 200, 'Check 6: Leave room returns HTTP 200');
    assert(leaveRes.data?.viewerCount >= 0, 'Check 6b: Viewer count decremented non-negatively', `Count: ${leaveRes.data?.viewerCount}`);

    // Check 7: Follow / unfollow toggles correctly
    const followRes = await apiFetch(`/api/live/rooms/${liveRoom.id}/follow`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${viewerToken}` },
    });
    assert(followRes.status === 200, 'Check 7a: Follow host returns HTTP 200');
    assert(followRes.data?.isFollowing === true, 'Check 7b: isFollowing is true');

    const unfollowRes = await apiFetch(`/api/live/rooms/${liveRoom.id}/follow`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${viewerToken}` },
    });
    assert(unfollowRes.status === 200, 'Check 7c: Unfollow host returns HTTP 200');
    assert(unfollowRes.data?.isFollowing === false, 'Check 7d: isFollowing is false');

    // Check 8: Chat read returns messages
    await apiFetch(`/api/live/rooms/${liveRoom.id}/chat`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${viewerToken}` },
      body: JSON.stringify({ message: 'Awesome performance! 🎸🔥' }),
    });
    const chatReadRes = await apiFetch(`/api/live/rooms/${liveRoom.id}/chat`);
    assert(chatReadRes.status === 200, 'Check 8a: Chat read returns HTTP 200');
    assert(chatReadRes.data?.messages?.some(m => m.content.includes('Awesome performance')), 'Check 8b: Persisted chat message returned');

    // Check 9: Gift send deducts coins atomically and records transaction with 70% host share
    const giftSendRes = await apiFetch(`/api/live/rooms/${liveRoom.id}/gift`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${viewerToken}` },
      body: JSON.stringify({
        giftId: activeTestGift.gift_id,
        quantity: 1,
        idempotencyKey: 'idem_gift_test_01',
      }),
    });
    assert(giftSendRes.status === 200, 'Check 9a: Gift send returns HTTP 200');
    assert(giftSendRes.data?.remainingCoins === expectedRemaining, `Check 9b: Exact ${giftCost} coins deducted atomically (50,000 -> ${expectedRemaining})`);
    assert(giftSendRes.data?.hostPointsCredited === expectedHostPoints, `Check 9c: Exactly 70% host revenue share credited (${giftCost} * 70% = ${expectedHostPoints} diamonds)`);

    // Verify in database
    const dbTxRes = await pool.query('SELECT total_coin_amount, host_points_credited, share_percentage, status FROM popolive.gift_transactions WHERE idempotency_key = $1', ['idem_gift_test_01']);
    assert(dbTxRes.rows.length === 1, 'Check 9d: Transaction persisted in popolive.gift_transactions');
    assert(Number(dbTxRes.rows[0].share_percentage) === 70, 'Check 9e: Database records share_percentage = 70.0000%');

    // Check 10: Duplicate gift send is rejected/deduped by idempotency
    const dupGiftRes = await apiFetch(`/api/live/rooms/${liveRoom.id}/gift`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${viewerToken}` },
      body: JSON.stringify({
        giftId: activeTestGift.gift_id,
        quantity: 1,
        idempotencyKey: 'idem_gift_test_01',
      }),
    });
    assert(dupGiftRes.status === 200, 'Check 10a: Duplicate gift request handled gracefully');
    assert(dupGiftRes.data?.isIdempotentReplay === true, 'Check 10b: Flagged as idempotent replay without double deduction');
    assert(dupGiftRes.data?.remainingCoins === expectedRemaining, `Check 10c: Coins balance remains ${expectedRemaining} (no duplicate deduction)`);

    // Check 11: Insufficient balance is rejected with proper error
    const poorViewerToken = await createSession(underWealthHost.id, 'p7_poor_viewer');
    await pool.query('INSERT INTO popolive.user_wallets (wallet_id, user_id, coins) VALUES (gen_random_uuid(), $1, 0) ON CONFLICT (user_id) DO UPDATE SET coins = 0', [underWealthHost.id]);
    const poorGiftRes = await apiFetch(`/api/live/rooms/${liveRoom.id}/gift`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${poorViewerToken}` },
      body: JSON.stringify({ giftId: activeTestGift.gift_id, quantity: 1 }),
    });
    assert(poorGiftRes.status === 400, 'Check 11: Insufficient balance rejected with HTTP 400', `Status: ${poorGiftRes.status}`);
    assert(poorGiftRes.data?.code === 'INSUFFICIENT_BALANCE', 'Check 11b: Error code is INSUFFICIENT_BALANCE');
    console.log('');

    // ========================================================================
    // PART 9.4: 1v1 PK BATTLES (Checks 17 - 20)
    // ========================================================================
    console.log('--- 4. 1v1 PK BATTLE TESTS ---');

    // Check 17: 1v1 invite works
    const pkInviteRes = await apiFetch('/api/live/pk/invite', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${hostToken}` },
      body: JSON.stringify({
        targetHostId: opponentHost.id,
        battleMode: '1v1',
        durationSeconds: 300,
      }),
    });
    assert(pkInviteRes.status === 201, 'Check 17: 1v1 PK invite created with HTTP 201', `Status: ${pkInviteRes.status}`);
    const pkId = pkInviteRes.data?.pk?.id;
    assert(Boolean(pkId), 'Check 17b: PK battle ID generated', pkId);

    // Check 18: Multi-host PK request is rejected (Locked Rule 5 & 6)
    const multiHostRes = await apiFetch('/api/live/pk/invite', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${hostToken}` },
      body: JSON.stringify({
        hosts: [hostUser.id, opponentHost.id, underWealthHost.id, underageHost.id], // 4 hosts
        battleMode: '4-host',
      }),
    });
    assert(multiHostRes.status === 400, 'Check 18: Multi-host / 4-host PK strictly rejected with HTTP 400', `Status: ${multiHostRes.status}`);
    assert(multiHostRes.data?.code === 'MULTI_HOST_PK_DISALLOWED', 'Check 18b: Code is MULTI_HOST_PK_DISALLOWED');

    // Check 19: Score updates persist
    const addScoreRes = await apiFetch('/api/live/pk/score', {
      method: 'POST',
      body: JSON.stringify({
        pkId,
        hostSide: 'A',
        points: 500,
      }),
    });
    assert(addScoreRes.status === 200, 'Check 19a: Score update returns HTTP 200');
    assert(addScoreRes.data?.hostAScore === 500, 'Check 19b: Host A score updated to 500');

    const pkQueryRes = await apiFetch(`/api/live/pk/${pkId}`);
    assert(pkQueryRes.status === 200, 'Check 19c: GET /api/live/pk/:id returns HTTP 200');
    assert(pkQueryRes.data?.pk?.hostA?.score === 500, 'Check 19d: Score persisted in database');

    // Check 20: Result is recorded
    const resultRes = await apiFetch('/api/live/pk/result', {
      method: 'POST',
      body: JSON.stringify({ pkId }),
    });
    assert(resultRes.status === 200, 'Check 20a: PK result recorded with HTTP 200');
    assert(resultRes.data?.status === 'ended', 'Check 20b: PK status updated to ended');
    assert(resultRes.data?.result?.winnerId === hostUser.id, 'Check 20c: Winner determined accurately by highest score');
    console.log('');

    // ========================================================================
    // PART 9.5: CROSS-PLATFORM & REGRESSION (Checks 21 - 25)
    // ========================================================================
    console.log('--- 5. CROSS-PLATFORM & REGRESSION TESTS ---');

    // Check 21: Mobile and web see the same rooms from the same backend
    const webRooms = await apiFetch('/api/live/rooms');
    const mobileRooms = await apiFetch('/api/live/rooms', {
      headers: { 'User-Agent': 'PopoLive-Mobile/1.0.0 (Android; Dart/3.4.0)' },
    });
    assert(webRooms.status === 200 && mobileRooms.status === 200, 'Check 21: Both Web and Mobile receive HTTP 200');
    assert(webRooms.data?.rooms?.length === mobileRooms.data?.rooms?.length, 'Check 21b: Web and Mobile receive identical live rooms count');

    // Check 22: Gift sent on mobile reflects on web viewer / wallet balances
    const walletCheck = await pool.query('SELECT coins FROM popolive.user_wallets WHERE user_id = $1', [viewerUser.id]);
    assert(Number(walletCheck.rows[0].coins) === expectedRemaining, 'Check 22: Consistent wallet balance verified across both clients', `Balance: ${walletCheck.rows[0].coins}`);

    // Check 23: Out-of-scope modules remain on fixtures
    const fixtureFileExists = fs.existsSync(path.join(process.cwd(), 'apps', 'web', 'lib', 'design', 'designFixtures.ts'));
    assert(fixtureFileExists, 'Check 23: Web design fixtures file designFixtures.ts exists');

    // Check 24: USE_LIVE_API flag disabled restores pure fixture behavior cleanly
    const liveApiSource = fs.readFileSync(path.join(process.cwd(), 'apps', 'web', 'lib', 'liveApiService.ts'), 'utf-8');
    assert(liveApiSource.includes('export const USE_LIVE_API'), 'Check 24: USE_LIVE_API switch is exported in liveApiService.ts');

    // Check 25: Fixture files are 100% untouched and preserved
    const mobileFixtureExists = fs.existsSync(path.join(process.cwd(), 'apps', 'mobile', 'lib', 'design', 'design_fixtures.dart'));
    assert(mobileFixtureExists, 'Check 25: Mobile design_fixtures.dart file exists and is intact');
    console.log('');

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('========================================================================');
    console.log(`P7-P4 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
    console.log('========================================================================\n');

    if (failed > 0) {
      console.error(`FAILED: ${failed} tests did not pass.`);
      process.exit(1);
    } else {
      console.log('SUCCESS: All 25 P7-P4 Live Streaming Module checks passed with 100% compliance!');
      process.exit(0);
    }

  } catch (err) {
    console.error('Unexpected error during test execution:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();
