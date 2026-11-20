const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public'
});

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('========================================================================');
  console.log('POPO LIVE — PHASE 7 (P7-P4) LIVE ROOMS & VIEWER SYSTEM INTEGRATION TESTS');
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

  // Helper for HTTP requests
  async function apiFetch(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
    return { status: res.status, ok: res.ok, data };
  }

  try {
    // ------------------------------------------------------------------------
    // SETUP: Create or retrieve test users and auth sessions in database
    // ------------------------------------------------------------------------
    console.log('--- SETUP: Initializing Test Users & Authenticated Sessions ---');

    // 1. Host with Wealth Level 1 (Under-wealth)
    const userWl1Res = await pool.query(`
      INSERT INTO popolive.users (
        id, poppo_id, email, phone, password_hash, nickname,
        wealth_level, host_level, birthdate, status, country, country_code
      ) VALUES (
        gen_random_uuid(), '8800101', 'p7_wl1@popolive.internal', '+923001111101', 'hash123',
        'Host WL1', 1, 1, '1998-05-15', 'active', 'Pakistan', 'PK'
      )
      ON CONFLICT (email) DO UPDATE SET wealth_level = 1, status = 'active', birthdate = '1998-05-15'
      RETURNING id, poppo_id;
    `);
    const userWl1 = userWl1Res.rows[0];

    // 2. Host Underage (<18 years old)
    const userUnderageRes = await pool.query(`
      INSERT INTO popolive.users (
        id, poppo_id, email, phone, password_hash, nickname,
        wealth_level, host_level, birthdate, status, country, country_code
      ) VALUES (
        gen_random_uuid(), '8800102', 'p7_underage@popolive.internal', '+923001111102', 'hash123',
        'Host Underage', 10, 1, '2015-05-15', 'active', 'Pakistan', 'PK'
      )
      ON CONFLICT (email) DO UPDATE SET wealth_level = 10, status = 'active', birthdate = '2015-05-15'
      RETURNING id, poppo_id;
    `);
    const userUnderage = userUnderageRes.rows[0];

    // 3. Host Suspended Account
    const userSuspendedRes = await pool.query(`
      INSERT INTO popolive.users (
        id, poppo_id, email, phone, password_hash, nickname,
        wealth_level, host_level, birthdate, status, country, country_code
      ) VALUES (
        gen_random_uuid(), '8800103', 'p7_suspended@popolive.internal', '+923001111103', 'hash123',
        'Host Suspended', 10, 1, '1995-05-15', 'suspended', 'Pakistan', 'PK'
      )
      ON CONFLICT (email) DO UPDATE SET wealth_level = 10, status = 'suspended', birthdate = '1995-05-15'
      RETURNING id, poppo_id;
    `);
    const userSuspended = userSuspendedRes.rows[0];

    // 4. Eligible Host (Wealth Level 5, Age >18, Active)
    const userEligibleRes = await pool.query(`
      INSERT INTO popolive.users (
        id, poppo_id, email, phone, password_hash, nickname,
        wealth_level, host_level, birthdate, status, country, country_code
      ) VALUES (
        gen_random_uuid(), '8800104', 'p7_eligible@popolive.internal', '+923001111104', 'hash123',
        'Host Eligible WL5', 5, 2, '1996-03-20', 'active', 'Pakistan', 'PK'
      )
      ON CONFLICT (email) DO UPDATE SET wealth_level = 5, status = 'active', birthdate = '1996-03-20'
      RETURNING id, poppo_id;
    `);
    const userEligible = userEligibleRes.rows[0];

    // 5. Another Host (for unauthorized operations test)
    const userOtherHostRes = await pool.query(`
      INSERT INTO popolive.users (
        id, poppo_id, email, phone, password_hash, nickname,
        wealth_level, host_level, birthdate, status, country, country_code
      ) VALUES (
        gen_random_uuid(), '8800105', 'p7_other_host@popolive.internal', '+923001111105', 'hash123',
        'Other Host', 8, 3, '1994-08-10', 'active', 'Pakistan', 'PK'
      )
      ON CONFLICT (email) DO UPDATE SET wealth_level = 8, status = 'active', birthdate = '1994-08-10'
      RETURNING id, poppo_id;
    `);
    const userOtherHost = userOtherHostRes.rows[0];

    // 6. Viewer User
    const userViewerRes = await pool.query(`
      INSERT INTO popolive.users (
        id, poppo_id, email, phone, password_hash, nickname,
        wealth_level, host_level, birthdate, status, country, country_code
      ) VALUES (
        gen_random_uuid(), '8800106', 'p7_viewer@popolive.internal', '+923001111106', 'hash123',
        'Active Viewer', 2, 0, '2000-01-01', 'active', 'Pakistan', 'PK'
      )
      ON CONFLICT (email) DO UPDATE SET wealth_level = 2, status = 'active', birthdate = '2000-01-01'
      RETURNING id, poppo_id;
    `);
    const userViewer = userViewerRes.rows[0];

    // Create active sessions with token
    async function createSession(userId, token) {
      await pool.query(`
        INSERT INTO popolive.sessions (id, user_id, session_token, expires_at, created_at, is_revoked)
        VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL '7 days', NOW(), false)
        ON CONFLICT (session_token) DO UPDATE SET expires_at = NOW() + INTERVAL '7 days', is_revoked = false
      `, [userId, token]);
      return token;
    }

    const tokenWl1 = await createSession(userWl1.id, 'p7_token_wl1');
    const tokenUnderage = await createSession(userUnderage.id, 'p7_token_underage');
    const tokenSuspended = await createSession(userSuspended.id, 'p7_token_suspended');
    const tokenEligible = await createSession(userEligible.id, 'p7_token_eligible');
    const tokenOtherHost = await createSession(userOtherHost.id, 'p7_token_other_host');
    const tokenViewer = await createSession(userViewer.id, 'p7_token_viewer');

    console.log(`[SETUP] Seeded 6 test users and sessions successfully.\n`);

    // ------------------------------------------------------------------------
    // GROUP 1: Live Categories Endpoint
    // ------------------------------------------------------------------------
    console.log('--- GROUP 1: Live Categories API (GET /api/live/categories) ---');
    const catRes = await apiFetch('/api/live/categories');
    assert(catRes.status === 200, 'Categories API returns HTTP 200', `Status: ${catRes.status}`);
    assert(catRes.data?.success === true, 'Categories response success is true');
    assert(Array.isArray(catRes.data?.categories), 'Categories is an array');
    assert(catRes.data?.categories.length > 0, 'Categories array is non-empty', `Found ${catRes.data?.categories.length} categories`);
    console.log('');

    // ------------------------------------------------------------------------
    // GROUP 2: Host Gate & Wealth Level 5 Enforcement (LOCKED RULE)
    // ------------------------------------------------------------------------
    console.log('--- GROUP 2: Host Gate & Wealth Level 5 Enforcement (LOCKED RULE) ---');

    // Test 2.1: Wealth Level 1 attempt (should fail 403 WEALTH_LEVEL_INSUFFICIENT)
    const wl1RoomRes = await apiFetch('/api/live/rooms', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenWl1}` },
      body: JSON.stringify({ title: 'Under-wealth Stream', category: 'Chat' })
    });
    assert(wl1RoomRes.status === 403, 'Wealth Level < 5 rejected with HTTP 403', `Status: ${wl1RoomRes.status}`);
    assert(wl1RoomRes.data?.code === 'WEALTH_LEVEL_INSUFFICIENT', 'ErrorCode is WEALTH_LEVEL_INSUFFICIENT', wl1RoomRes.data?.error);

    // Test 2.2: Underage attempt (should fail 403)
    const underageRoomRes = await apiFetch('/api/live/rooms', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenUnderage}` },
      body: JSON.stringify({ title: 'Underage Stream', category: 'Chat' })
    });
    assert(underageRoomRes.status === 403, 'Age < 18 rejected with HTTP 403', `Status: ${underageRoomRes.status}`);
    assert(
      underageRoomRes.data?.code === 'AGE_VERIFICATION_FAILED' || underageRoomRes.data?.code === 'AGE_RESTRICTION',
      'ErrorCode indicates age restriction',
      underageRoomRes.data?.error
    );

    // Test 2.3: Suspended account attempt (should fail 403)
    const suspendedRoomRes = await apiFetch('/api/live/rooms', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenSuspended}` },
      body: JSON.stringify({ title: 'Suspended Stream', category: 'Chat' })
    });
    assert(suspendedRoomRes.status === 403, 'Suspended account rejected with HTTP 403', `Status: ${suspendedRoomRes.status}`);
    assert(
      suspendedRoomRes.data?.code === 'ACCOUNT_RESTRICTED' || suspendedRoomRes.data?.code === 'ACCOUNT_NOT_ACTIVE',
      'ErrorCode indicates restricted/suspended account',
      suspendedRoomRes.data?.error
    );

    // Test 2.4: Eligible Host (Wealth Level 5, Age >= 18, Active) creates room
    const eligibleRoomRes = await apiFetch('/api/live/rooms', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenEligible}` },
      body: JSON.stringify({
        title: 'P7 Live Studio Showcase',
        category: 'Music',
        coverUrl: '/assets/viewer/sample_viewer_broadcast.png',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
      })
    });
    assert(eligibleRoomRes.status === 201, 'Eligible Host (Wealth Level >= 5) creates room with HTTP 201', `Status: ${eligibleRoomRes.status}`);
    assert(eligibleRoomRes.data?.success === true, 'Room creation success is true');
    assert(Boolean(eligibleRoomRes.data?.room?.id), 'Room has valid UUID id', eligibleRoomRes.data?.room?.id);
    assert(eligibleRoomRes.data?.room?.status === 'live', 'Created room initial status is live');
    assert(Boolean(eligibleRoomRes.data?.agora?.token), 'Agora RTC token generated for broadcaster');

    const createdRoomId = eligibleRoomRes.data?.room?.id;
    const createdRoomNumber = eligibleRoomRes.data?.room?.roomNumber;

    // Verify stream key in DB
    const dbRoom = await pool.query(`SELECT stream_key FROM popolive.live_rooms WHERE id = $1`, [createdRoomId]);
    assert(
      dbRoom.rows.length > 0 && dbRoom.rows[0].stream_key.startsWith('live_'),
      'Stream key generated securely in database with prefix live_',
      dbRoom.rows[0]?.stream_key?.substring(0, 12) + '...'
    );
    console.log(`       Room ID: ${createdRoomId}, Room Number: ${createdRoomNumber}\n`);

    // ------------------------------------------------------------------------
    // GROUP 3: Live Room Retrieval (GET /api/live/rooms/[roomId])
    // ------------------------------------------------------------------------
    console.log('--- GROUP 3: Live Room Retrieval & Host Profile Join ---');

    // Test 3.1: Retrieve by Room UUID
    const getByIdRes = await apiFetch(`/api/live/rooms/${createdRoomId}`);
    assert(getByIdRes.status === 200, 'Retrieve room by UUID returns HTTP 200');
    assert(getByIdRes.data?.room?.id === createdRoomId, 'Returned room ID matches requested');
    assert(getByIdRes.data?.room?.host?.nickname === 'Host Eligible WL5', 'Host nickname joined from users table');
    assert(getByIdRes.data?.room?.host?.wealthLevel >= 5, 'Host wealth level verified >= 5', `Level: ${getByIdRes.data?.room?.host?.wealthLevel}`);

    // Test 3.2: Retrieve by Room Number
    const getByNumRes = await apiFetch(`/api/live/rooms/${createdRoomNumber}`);
    assert(getByNumRes.status === 200, 'Retrieve room by room_number returns HTTP 200');
    assert(getByNumRes.data?.room?.roomNumber === createdRoomNumber, 'Returned room number matches requested');

    // Test 3.3: Retrieve non-existent room
    const getNotFoundRes = await apiFetch('/api/live/rooms/non_existent_room_9999');
    assert(getNotFoundRes.status === 404, 'Non-existent room returns HTTP 404', `Status: ${getNotFoundRes.status}`);
    console.log('');

    // ------------------------------------------------------------------------
    // GROUP 4: Room Modification & Host Ownership Validation
    // ------------------------------------------------------------------------
    console.log('--- GROUP 4: Room Modification & Ownership Validation ---');

    // Test 4.1: Unauthorized user attempts PATCH
    const patchUnauthorized = await apiFetch(`/api/live/rooms/${createdRoomId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${tokenOtherHost}` },
      body: JSON.stringify({ title: 'Hacked Title' })
    });
    assert(patchUnauthorized.status === 403, 'Unauthorized user PATCH rejected with HTTP 403', `Status: ${patchUnauthorized.status}`);
    assert(patchUnauthorized.data?.code?.startsWith('FORBIDDEN'), 'Error code starts with FORBIDDEN', patchUnauthorized.data?.code);

    // Test 4.2: Authorized room owner updates title and category
    const patchOwner = await apiFetch(`/api/live/rooms/${createdRoomId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${tokenEligible}` },
      body: JSON.stringify({
        title: 'Updated P7 Live Concert',
        category: 'Talent'
      })
    });
    assert(patchOwner.status === 200, 'Room owner PATCH succeeds with HTTP 200');
    assert(patchOwner.data?.room?.title === 'Updated P7 Live Concert', 'Room title successfully updated');
    assert(patchOwner.data?.room?.category === 'Talent', 'Room category successfully updated');
    console.log('');

    // ------------------------------------------------------------------------
    // GROUP 5: Broadcast Session Start Endpoint
    // ------------------------------------------------------------------------
    console.log('--- GROUP 5: Broadcast Session Start (POST /api/live/rooms/[roomId]/start) ---');

    // Test 5.1: Owner starts broadcast session
    const startRes = await apiFetch(`/api/live/rooms/${createdRoomId}/start`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenEligible}` },
    });
    assert(startRes.status === 200, 'Start broadcast succeeds with HTTP 200');
    assert(startRes.data?.isLive === true || startRes.data?.room?.isLive === true, 'Room isLive flag is true');
    assert(startRes.data?.status === 'live' || startRes.data?.room?.status === 'live', 'Room status is live');
    assert(Boolean(startRes.data?.agora?.token), 'Start broadcast returns refreshed Agora token');

    // Test 5.2: Wealth Level 1 user attempts start broadcast
    // Temporarily degrade user eligible to WL 4 to verify locked rule gate on start
    await pool.query(`UPDATE popolive.users SET wealth_level = 4 WHERE id = $1`, [userEligible.id]);
    const startDegraded = await apiFetch(`/api/live/rooms/${createdRoomId}/start`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenEligible}` },
    });
    assert(startDegraded.status === 403, 'Start broadcast rejected when Wealth Level < 5', `Status: ${startDegraded.status}`);
    assert(startDegraded.data?.code === 'WEALTH_LEVEL_INSUFFICIENT', 'Code is WEALTH_LEVEL_INSUFFICIENT');

    // Restore eligible user wealth level to 5
    await pool.query(`UPDATE popolive.users SET wealth_level = 5 WHERE id = $1`, [userEligible.id]);
    console.log('');

    // ------------------------------------------------------------------------
    // GROUP 6: Viewer Presence & Atomic Counter Tracking
    // ------------------------------------------------------------------------
    console.log('--- GROUP 6: Viewer Presence & Atomic Viewer Counting ---');

    // Reset room viewer count to 0 to verify clean counter operations
    await pool.query(`UPDATE popolive.live_rooms SET viewer_count = 0 WHERE id = $1`, [createdRoomId]);

    // Test 6.1: Viewer joins room
    const joinRes1 = await apiFetch(`/api/live/rooms/${createdRoomId}/viewers`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenViewer}` },
      body: JSON.stringify({ sessionId: 'viewer_session_alpha' })
    });
    assert(joinRes1.status === 200, 'Viewer join succeeds with HTTP 200');
    assert(joinRes1.data?.viewerCount === 1, 'Viewer count incremented to 1', `Viewer count: ${joinRes1.data?.viewerCount}`);

    // Test 6.2: Duplicate join with same user/sessionId (should not double count)
    const joinResDup = await apiFetch(`/api/live/rooms/${createdRoomId}/viewers`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenViewer}` },
      body: JSON.stringify({ sessionId: 'viewer_session_alpha' })
    });
    assert(joinResDup.status === 200, 'Duplicate viewer join succeeds without error');
    assert(joinResDup.data?.viewerCount === 1, 'Duplicate join does NOT double count (remains 1)', `Viewer count: ${joinResDup.data?.viewerCount}`);

    // Test 6.3: Viewer leaves room
    const leaveRes1 = await apiFetch(`/api/live/rooms/${createdRoomId}/viewers`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenViewer}` },
      body: JSON.stringify({ sessionId: 'viewer_session_alpha' })
    });
    assert(leaveRes1.status === 200, 'Viewer leave succeeds with HTTP 200');
    assert(leaveRes1.data?.viewerCount === 0, 'Viewer count decremented to 0', `Viewer count: ${leaveRes1.data?.viewerCount}`);

    // Test 6.4: Non-negative viewer count guard
    // Calling leave when count is already 0 must NOT go below 0
    const leaveResZeroGuard = await apiFetch(`/api/live/rooms/${createdRoomId}/viewers`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenViewer}` },
      body: JSON.stringify({ sessionId: 'viewer_session_dummy' })
    });
    assert(leaveResZeroGuard.status === 200, 'Leave on 0 count succeeds with HTTP 200');
    assert(leaveResZeroGuard.data?.viewerCount >= 0, 'Viewer count is never negative (guard GREATEST(0, viewer_count - 1))', `Viewer count: ${leaveResZeroGuard.data?.viewerCount}`);
    console.log('');

    // ------------------------------------------------------------------------
    // GROUP 7: Live Discovery & Query Filters
    // ------------------------------------------------------------------------
    console.log('--- GROUP 7: Live Discovery & Filters (GET /api/live/rooms) ---');

    // Test 7.1: General Live Discovery
    const discoveryAll = await apiFetch('/api/live/rooms');
    assert(discoveryAll.status === 200, 'GET /api/live/rooms returns HTTP 200');
    assert(discoveryAll.data?.success === true, 'Discovery success is true');
    assert(Array.isArray(discoveryAll.data?.rooms), 'Rooms is an array');
    const foundCreated = discoveryAll.data?.rooms.some(r => r.id === createdRoomId);
    assert(foundCreated, 'Newly created live room is listed in active discovery');

    // Test 7.2: Country Filter (?country=PK)
    const discoveryCountry = await apiFetch('/api/live/rooms?country=PK');
    assert(discoveryCountry.status === 200, 'Country filter returns HTTP 200');
    const allPK = discoveryCountry.data?.rooms.every(r => r.countryCode === 'PK' || r.country === 'PK');
    assert(allPK, 'All returned rooms belong to country PK');

    // Test 7.3: Category Filter
    const discoveryCategory = await apiFetch('/api/live/rooms?category=Talent');
    assert(discoveryCategory.status === 200, 'Category filter returns HTTP 200');
    const allTalent = discoveryCategory.data?.rooms.every(r => r.category.toLowerCase().includes('talent'));
    assert(allTalent, 'All returned rooms match category Talent');
    console.log('');

    // ------------------------------------------------------------------------
    // GROUP 8: End Broadcast Session
    // ------------------------------------------------------------------------
    console.log('--- GROUP 8: End Broadcast Session (POST /api/live/rooms/[roomId]/end) ---');

    // Test 8.1: Unauthorized user attempts to end room
    const endUnauthorized = await apiFetch(`/api/live/rooms/${createdRoomId}/end`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenOtherHost}` },
    });
    assert(endUnauthorized.status === 403, 'Unauthorized user ending room rejected with HTTP 403');
    assert(endUnauthorized.data?.code?.startsWith('FORBIDDEN'), 'Error code starts with FORBIDDEN', endUnauthorized.data?.code);

    // Test 8.2: Room owner ends broadcast session
    const endOwner = await apiFetch(`/api/live/rooms/${createdRoomId}/end`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenEligible}` },
    });
    assert(endOwner.status === 200, 'Room owner end broadcast succeeds with HTTP 200');
    assert(
      endOwner.data?.summary?.status === 'ended' || endOwner.data?.room?.status === 'ended',
      'Room status updated to ended'
    );
    assert(
      endOwner.data?.summary?.isLive === false || endOwner.data?.room?.isLive === false,
      'Room isLive updated to false'
    );
    assert(typeof endOwner.data?.summary?.durationSeconds === 'number', 'Summary includes durationSeconds', `Duration: ${endOwner.data?.summary?.durationSeconds}s`);
    assert(
      typeof (endOwner.data?.summary?.peakViewers ?? endOwner.data?.summary?.peakViewerCount) === 'number',
      'Summary includes peak viewers count'
    );

    // Test 8.3: Verify ended room is excluded from active live discovery
    const discoveryAfterEnd = await apiFetch('/api/live/rooms');
    const foundEndedInLive = discoveryAfterEnd.data?.rooms.some(r => r.id === createdRoomId);
    assert(!foundEndedInLive, 'Ended room is excluded from active discovery list');
    console.log('');

    // ------------------------------------------------------------------------
    // GROUP 9: Host Status & Broadcast History
    // ------------------------------------------------------------------------
    console.log('--- GROUP 9: Host Status & Broadcast History ---');

    // Test 9.1: Host Status
    const hostStatusRes = await apiFetch(`/api/live/hosts/${userEligible.id}/status`);
    assert(hostStatusRes.status === 200, 'Host status API returns HTTP 200');
    assert(hostStatusRes.data?.host?.wealthLevel === 5, 'Host status reports wealth level 5', `Level: ${hostStatusRes.data?.host?.wealthLevel}`);
    assert(hostStatusRes.data?.host?.canGoLive === true, 'canGoLive is true for Wealth Level >= 5');
    assert(hostStatusRes.data?.host?.isLive === false, 'isLive is false after room has ended');

    // Test 9.2: Host History
    const hostHistoryRes = await apiFetch(`/api/live/hosts/${userEligible.id}/history`);
    assert(hostHistoryRes.status === 200, 'Host history API returns HTTP 200');
    const historyList = hostHistoryRes.data?.sessions || hostHistoryRes.data?.history || hostHistoryRes.data?.broadcasts || [];
    assert(Array.isArray(historyList), 'Broadcasts history is an array', `Length: ${historyList.length}`);
    const foundInHistory = historyList.some(b => b.id === createdRoomId);
    assert(foundInHistory, 'Ended broadcast session appears in host past broadcasts history');
    console.log('');

    // ------------------------------------------------------------------------
    // SUMMARY
    // ------------------------------------------------------------------------
    console.log('========================================================================');
    console.log(`P7-P4 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
    console.log('========================================================================\n');

    if (failed > 0) {
      console.error(`FAILED: ${failed} tests did not pass.`);
      process.exit(1);
    } else {
      console.log('SUCCESS: All P7-P4 Live Room and Viewer System tests passed with 100% compliance!');
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
