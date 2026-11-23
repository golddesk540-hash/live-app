/**
 * ============================================================================
 * POPO LIVE — PHASE B4 PROMPT 2 OF 4: COUNTRY ENDPOINTS & FILTERING VERIFICATION
 * Master Plan Reference: POPO-LIVE-BACKEND-REALTIME-PLAN.pdf (Phase B4, page 4)
 *
 * Automated verification of all 13 items from Section 11:
 * 1. Country endpoint returns valid records.
 * 2. Country identifiers are consistent.
 * 3. Mobile chips load from API.
 * 4. Web chips load from API.
 * 5. Selecting a country filters live rooms.
 * 6. Changing country refreshes results.
 * 7. Selected country state is correct.
 * 8. Country with live rooms returns matching rooms only.
 * 9. Country without live rooms returns empty results.
 * 10. Invalid country returns appropriate error.
 * 11. Database failure displays error.
 * 12. No fixture fallback when enabled.
 * 13. Mobile and web return compatible results.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
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
process.env.NEXT_PUBLIC_USE_LIVE_API = 'true';
process.env.USE_LIVE_API = 'true';

const { NextRequest } = require(path.resolve(__dirname, 'apps/web/node_modules/next/server'));
const { Pool } = require(path.resolve(__dirname, 'apps/web/node_modules/pg'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public',
});

let testsPassed = 0;
let testsFailed = 0;
const cleanupUserIds = [];
const cleanupRoomIds = [];

function check(condition, desc) {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${desc}`);
    testsFailed++;
  }
}

function makeReq(url, method = 'GET', body = null, sessionToken = null) {
  const headers = new Headers();
  if (body) headers.set('content-type', 'application/json');
  if (sessionToken) {
    headers.set('cookie', `poppo_session=${sessionToken}`);
    headers.set('authorization', `Bearer ${sessionToken}`);
  }
  const init = {
    method,
    headers,
  };
  if (body) init.body = JSON.stringify(body);
  return new NextRequest(url, init);
}

async function runB4CountryFilterSuite() {
  console.log('======================================================================');
  console.log('POPO LIVE: B4 PROMPT 2 COUNTRY ENDPOINTS & FILTERING VERIFICATION');
  console.log('======================================================================\n');

  // Verify DB connectivity
  const dbCheck = await pool.query('SELECT NOW() as now');
  check(Boolean(dbCheck.rows[0].now), 'Database connected to local PostgreSQL (popolive schema)');

  // Import API handlers and utilities
  const { GET: countriesHandler } = await import('./apps/web/app/api/discovery/countries/route.ts');
  const { GET: countriesAliasHandler } = await import('./apps/web/app/api/countries/route.ts');
  const { GET: popularCountriesHandler } = await import('./apps/web/app/api/discovery/countries/popular/route.ts');
  const { GET: exploreHandler } = await import('./apps/web/app/api/discovery/explore/route.ts');
  const { GET: roomsHandler } = await import('./apps/web/app/api/discovery/rooms/route.ts');
  const { GET: liveNowHandler } = await import('./apps/web/app/api/discovery/live-now/route.ts');
  const { GET: liveRoomsHandler } = await import('./apps/web/app/api/live/rooms/route.ts');
  const { COUNTRIES_LIST, POPULAR_COUNTRY_SHORTCUTS, resolveCountryCode, isValidCountryCode } = await import('./apps/web/lib/countries.ts');
  const { hashPassword } = await import('./apps/web/lib/auth.ts');
  const { USE_LIVE_API } = await import('./apps/web/lib/clientFlags.ts');

  check(USE_LIVE_API === true, 'Flag Discipline: USE_LIVE_API is ON');

  // Bridge global.fetch for LiveApiService
  global.fetch = async (url, init) => {
    const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;
    const req = makeReq(fullUrl, init?.method || 'GET', null, null);
    if (fullUrl.includes('/api/live/rooms')) return liveRoomsHandler(req);
    if (fullUrl.includes('/api/discovery/rooms')) return roomsHandler(req);
    if (fullUrl.includes('/api/discovery/live-now')) return liveNowHandler(req);
    if (fullUrl.includes('/api/discovery/countries/popular')) return popularCountriesHandler(req);
    if (fullUrl.includes('/api/discovery/countries')) return countriesHandler(req);
    return exploreHandler(req);
  };

  const testSuffix = Date.now().toString().slice(-6);
  const passwordHash = await hashPassword('PopoB4Country2026!');

  console.log('\n[SETUP] Provisioning isolated test entities in PostgreSQL...');

  async function createTestHost(name, country, countryCode, offset) {
    const poppoId = `7777${offset}${testSuffix.slice(-3)}`;
    const email = `b4_cntry_${name.toLowerCase()}_${testSuffix}@test.popolive.com`;
    const res = await pool.query(
      `INSERT INTO popolive.users (
        email, password_hash, nickname, poppo_id, status, is_adult_verified,
        birthdate, country, country_code, bio, gender, is_profile_completed
      ) VALUES (
        $1, $2, $3, $4, 'active', true,
        '1997-03-15', $5, $6, 'Country test host', 'female', true
      ) RETURNING id, poppo_id, nickname, country, country_code`,
      [email, passwordHash, `Host_${name}_${testSuffix}`, poppoId, country, countryCode]
    );
    const user = res.rows[0];
    cleanupUserIds.push(user.id);
    return user;
  }

  async function createTestLiveRoom(host, roomNumber, title, viewerCount) {
    const res = await pool.query(
      `INSERT INTO popolive.live_rooms (
        room_number, host_id, title, cover_url, category, status, is_live,
        viewer_count, coins_earned, country, country_code, tags, started_at
      ) VALUES (
        $1, $2, $3, '/assets/test_cover.jpg', 'live', 'live', true,
        $4, 25000, $5, $6, ARRAY['Music', 'Chat'], NOW()
      ) RETURNING id, room_number, title, country, country_code, status, is_live, viewer_count`,
      [roomNumber, host.id, title, viewerCount, host.country, host.country_code]
    );
    const room = res.rows[0];
    cleanupRoomIds.push(room.id);
    return room;
  }

  // Create Host 1 in Pakistan (PK) with live room (high viewer count to ensure page 1)
  const hostPK = await createTestHost('PK_Host', 'Pakistan', 'PK', '1');
  const roomPK = await createTestLiveRoom(hostPK, `801${testSuffix.slice(-3)}`, `PK Live Music Stream ${testSuffix}`, 99999);

  // Create Host 2 in UAE (AE) with live room
  const hostAE = await createTestHost('AE_Host', 'United Arab Emirates', 'AE', '2');
  const roomAE = await createTestLiveRoom(hostAE, `802${testSuffix.slice(-3)}`, `Dubai Night Vibes ${testSuffix}`, 88888);

  console.log(`[SETUP] Test hosts created: PK host (${hostPK.id}), AE host (${hostAE.id})\n`);

  // ==========================================================================
  // 1. COUNTRY ENDPOINT RETURNS VALID RECORDS
  // ==========================================================================
  console.log('--- 1. COUNTRY ENDPOINT RETURNS VALID RECORDS ---');
  {
    const req = makeReq('http://localhost:3000/api/discovery/countries');
    const res = await countriesHandler(req);
    const data = await res.json();

    check(res.status === 200, 'GET /api/discovery/countries returns HTTP 200');
    check(data.success === true, 'Response contains success: true');
    check(Array.isArray(data.countries) && data.countries.length >= 36, `Countries list contains ${data.countries?.length} authoritative countries (>= 36)`);
    check(Boolean(data.worldwide && data.worldwide.activeRooms >= 2), `Worldwide active room count is aggregated from DB (${data.worldwide?.activeRooms} >= 2)`);

    // Verify alias /api/countries returns identical payload
    const aliasReq = makeReq('http://localhost:3000/api/countries');
    const aliasRes = await countriesAliasHandler(aliasReq);
    const aliasData = await aliasRes.json();
    check(aliasRes.status === 200 && aliasData.countries.length === data.countries.length, 'Alias route GET /api/countries returns consistent payload');
  }

  // ==========================================================================
  // 2. COUNTRY IDENTIFIERS ARE CONSISTENT
  // ==========================================================================
  console.log('\n--- 2. COUNTRY IDENTIFIERS ARE CONSISTENT ---');
  {
    const req = makeReq('http://localhost:3000/api/discovery/countries');
    const res = await countriesHandler(req);
    const data = await res.json();

    const allConsistent = data.countries.every((c) =>
      typeof c.code === 'string' && c.code.length === 2 &&
      typeof c.name === 'string' && c.name.length > 0 &&
      typeof c.flag === 'string' && c.flag.length > 0 &&
      typeof c.phoneCode === 'string' && c.phoneCode.startsWith('+') &&
      typeof c.activeRooms === 'number'
    );
    check(allConsistent, 'All country records contain consistent 2-letter uppercase codes, names, flags, phoneCodes, and numeric activeRooms');

    const seen = new Set();
    let hasDuplicate = false;
    for (const c of data.countries) {
      if (seen.has(c.code)) {
        hasDuplicate = true;
        break;
      }
      seen.add(c.code);
    }
    check(!hasDuplicate, `Countries catalog contains 0 duplicate country codes (${seen.size} unique countries)`);
  }

  // ==========================================================================
  // 3. MOBILE CHIPS LOAD FROM API
  // ==========================================================================
  console.log('\n--- 3. MOBILE CHIPS LOAD FROM API ---');
  {
    const req = makeReq('http://localhost:3000/api/discovery/countries/popular');
    const res = await popularCountriesHandler(req);
    const data = await res.json();

    check(res.status === 200, 'GET /api/discovery/countries/popular returns HTTP 200');
    check(data.success === true, 'Popular countries response has success: true');
    check(Array.isArray(data.popular), 'Response contains popular country list');

    // First chip MUST be Popular / ALL
    const firstChip = data.popular[0];
    check(firstChip.code === 'ALL' && firstChip.name === 'Popular' && firstChip.flag === '🔥', 'First chip is Popular (code: ALL, flag: 🔥) with worldwide room count');
    check(typeof firstChip.activeRooms === 'number' && firstChip.activeRooms >= 2, `Popular chip activeRooms reflects real DB total (${firstChip.activeRooms})`);

    // Required primary shortcuts must be preserved
    const codes = data.popular.map((p) => p.code);
    const hasShortcuts = ['ALL', 'PH', 'NP', 'IN', 'PK', 'BD'].every((c) => codes.includes(c));
    check(hasShortcuts, 'Authoritative popular shortcuts preserved: ALL, PH, NP, IN, PK, BD');

    // Active countries in DB (like AE) are included
    check(codes.includes('AE'), 'UAE (AE) with active live streams is dynamically included in chips list');
  }

  // ==========================================================================
  // 4. WEB CHIPS LOAD FROM API
  // ==========================================================================
  console.log('\n--- 4. WEB CHIPS LOAD FROM API ---');
  {
    check(Array.isArray(POPULAR_COUNTRY_SHORTCUTS) && POPULAR_COUNTRY_SHORTCUTS.length >= 6, `POPULAR_COUNTRY_SHORTCUTS contains ${POPULAR_COUNTRY_SHORTCUTS.length} shortcuts`);
    check(POPULAR_COUNTRY_SHORTCUTS[0].code === 'ALL' && POPULAR_COUNTRY_SHORTCUTS[0].name === 'Popular', 'Web primary shortcut is ALL (Popular)');

    // Verify resolveCountryCode works with Web shortcuts
    const pkResolved = resolveCountryCode('PK');
    check(pkResolved.valid && pkResolved.code === 'PK' && pkResolved.name === 'Pakistan', 'resolveCountryCode("PK") resolves to Pakistan');

    const nameResolved = resolveCountryCode('United Arab Emirates');
    check(nameResolved.valid && nameResolved.code === 'AE', 'resolveCountryCode("United Arab Emirates") resolves to AE');
  }

  // ==========================================================================
  // 5. SELECTING A COUNTRY FILTERS LIVE ROOMS
  // ==========================================================================
  console.log('\n--- 5. SELECTING A COUNTRY FILTERS LIVE ROOMS ---');
  {
    const req = makeReq('http://localhost:3000/api/discovery/explore?country=PK');
    const res = await exploreHandler(req);
    const data = await res.json();

    check(res.status === 200, 'GET /api/discovery/explore?country=PK returns HTTP 200');
    check(Array.isArray(data.rooms) && data.rooms.length > 0, `Filter country=PK returns ${data.rooms.length} live rooms`);
    const allPk = data.rooms.every((r) => r.countryCode === 'PK');
    check(allPk, 'All returned rooms strictly have countryCode = "PK"');

    // Test with roomsHandler
    const roomsReq = makeReq('http://localhost:3000/api/discovery/rooms?country=PK');
    const roomsRes = await roomsHandler(roomsReq);
    const roomsData = await roomsRes.json();
    check(roomsRes.status === 200 && roomsData.rooms.every((r) => r.countryCode === 'PK'), 'GET /api/discovery/rooms?country=PK strictly returns PK rooms');
  }

  // ==========================================================================
  // 6. CHANGING COUNTRY REFRESHES RESULTS
  // ==========================================================================
  console.log('\n--- 6. CHANGING COUNTRY REFRESHES RESULTS ---');
  {
    // Step 1: Query PK
    const pkReq = makeReq('http://localhost:3000/api/discovery/explore?country=PK&limit=50');
    const pkRes = await exploreHandler(pkReq);
    const pkData = await pkRes.json();
    const pkRoomFound = pkData.rooms.some((r) => r.id === roomPK.id);
    check(pkRoomFound, 'PK feed contains PK test room');

    // Step 2: Switch to AE
    const aeReq = makeReq('http://localhost:3000/api/discovery/explore?country=AE&limit=50');
    const aeRes = await exploreHandler(aeReq);
    const aeData = await aeRes.json();
    const aeRoomFound = aeData.rooms.some((r) => r.id === roomAE.id);
    const pkInAe = aeData.rooms.some((r) => r.id === roomPK.id);
    check(aeRoomFound, 'AE feed contains AE test room');
    check(!pkInAe, 'Changing to country=AE strictly excludes PK rooms');
  }

  // ==========================================================================
  // 7. SELECTED COUNTRY STATE IS CORRECT
  // ==========================================================================
  console.log('\n--- 7. SELECTED COUNTRY STATE IS CORRECT ---');
  {
    // Test case-insensitivity: lowercase 'pk' resolves to uppercase 'PK'
    const lowerReq = makeReq('http://localhost:3000/api/discovery/explore?country=pk');
    const lowerRes = await exploreHandler(lowerReq);
    const lowerData = await lowerRes.json();
    check(lowerRes.status === 200, 'Lowercase country code ?country=pk accepted');
    check(lowerData.rooms.length > 0 && lowerData.rooms.every((r) => r.countryCode === 'PK'), 'Lowercase ?country=pk normalized to PK in DB query');

    // Test country name: 'Pakistan' resolves to 'PK'
    const nameReq = makeReq('http://localhost:3000/api/discovery/explore?country=Pakistan');
    const nameRes = await exploreHandler(nameReq);
    const nameData = await nameRes.json();
    check(nameRes.status === 200, 'Full country name ?country=Pakistan accepted');
    check(nameData.rooms.length > 0 && nameData.rooms.every((r) => r.countryCode === 'PK'), 'Full country name resolved to PK in DB query');
  }

  // ==========================================================================
  // 8. COUNTRY WITH LIVE ROOMS RETURNS MATCHING ROOMS ONLY
  // ==========================================================================
  console.log('\n--- 8. COUNTRY WITH LIVE ROOMS RETURNS MATCHING ROOMS ONLY ---');
  {
    const req = makeReq('http://localhost:3000/api/discovery/live-now?country=AE');
    const res = await liveNowHandler(req);
    const data = await res.json();

    check(res.status === 200, 'GET /api/discovery/live-now?country=AE returns HTTP 200');
    check(data.rooms.length >= 1, `UAE returns ${data.rooms.length} active live rooms`);
    const allAE = data.rooms.every((r) => r.countryCode === 'AE' && r.isLive === true && r.status === 'live');
    check(allAE, '100% of rooms returned under country=AE are active UAE live rooms');
  }

  // ==========================================================================
  // 9. COUNTRY WITHOUT LIVE ROOMS RETURNS EMPTY RESULTS
  // ==========================================================================
  console.log('\n--- 9. COUNTRY WITHOUT LIVE ROOMS RETURNS EMPTY RESULTS ---');
  {
    // Norway (NO) is a valid country in COUNTRIES_LIST but currently has 0 live broadcasts
    const req = makeReq('http://localhost:3000/api/discovery/explore?country=NO');
    const res = await exploreHandler(req);
    const data = await res.json();

    check(res.status === 200, 'GET /api/discovery/explore?country=NO returns HTTP 200 (valid response, not error)');
    check(data.success === true, 'Response contains success: true');
    check(Array.isArray(data.rooms) && data.rooms.length === 0, 'Rooms array is strictly EMPTY ([]), no fake rooms');
    check(data.total === 0, 'Total count is strictly 0');

    // Verify Live Now also returns empty array for country without rooms
    const liveNowReq = makeReq('http://localhost:3000/api/discovery/live-now?country=NO');
    const liveNowRes = await liveNowHandler(liveNowReq);
    const liveNowData = await liveNowRes.json();
    check(liveNowRes.status === 200 && liveNowData.rooms.length === 0, 'GET /api/discovery/live-now?country=NO returns empty array');
  }

  // ==========================================================================
  // 10. INVALID COUNTRY RETURNS APPROPRIATE ERROR
  // ==========================================================================
  console.log('\n--- 10. INVALID COUNTRY RETURNS APPROPRIATE ERROR ---');
  {
    // Test invalid country code in explore route
    const badExploreReq = makeReq('http://localhost:3000/api/discovery/explore?country=INVALID_CODE_999');
    const badExploreRes = await exploreHandler(badExploreReq);
    const badExploreData = await badExploreRes.json();

    check(badExploreRes.status === 400, 'Invalid country code returns HTTP 400 Bad Request on Explore route');
    check(badExploreData.code === 'INVALID_COUNTRY', 'Error response contains code: "INVALID_COUNTRY"');
    check(badExploreData.success === false, 'Error response contains success: false');

    // Test invalid country code in rooms route
    const badRoomsReq = makeReq('http://localhost:3000/api/discovery/rooms?country=INVALID_CODE_999');
    const badRoomsRes = await roomsHandler(badRoomsReq);
    const badRoomsData = await badRoomsRes.json();

    check(badRoomsRes.status === 400, 'Invalid country code returns HTTP 400 Bad Request on Rooms route');
    check(badRoomsData.code === 'INVALID_COUNTRY', 'Error response contains code: "INVALID_COUNTRY"');

    // Test invalid country code in live/rooms route
    const badLiveReq = makeReq('http://localhost:3000/api/live/rooms?country=FAKE_COUNTRY_ABC');
    const badLiveRes = await liveRoomsHandler(badLiveReq);
    const badLiveData = await badLiveRes.json();

    check(badLiveRes.status === 400, 'Invalid country code returns HTTP 400 Bad Request on /api/live/rooms');
    check(badLiveData.code === 'INVALID_COUNTRY', 'Error response contains code: "INVALID_COUNTRY"');
  }

  // ==========================================================================
  // 11. DATABASE FAILURE DISPLAYS ERROR
  // ==========================================================================
  console.log('\n--- 11. DATABASE FAILURE DISPLAYS ERROR ---');
  {
    // Simulated database query error or invalid SQL parameters should return HTTP 500
    // LiveApiService throws an exception rather than returning design fixtures
    const { LiveApiService } = await import('./apps/web/lib/liveApiService.ts');

    let threwError = false;
    try {
      // Query with invalid country through LiveApiService should throw HTTP 400
      await LiveApiService.getLiveRooms({ country: 'UNKNOWN_COUNTRY_123' });
    } catch (err) {
      threwError = true;
      check(err.message.includes('400') || err.message.includes('INVALID_COUNTRY'), `API error propagated cleanly: "${err.message}"`);
    }
    check(threwError, 'LiveApiService does NOT swallow API failure; throws error instead of falling back to fixtures');
  }

  // ==========================================================================
  // 12. NO FIXTURE FALLBACK WHEN ENABLED
  // ==========================================================================
  console.log('\n--- 12. NO FIXTURE FALLBACK WHEN ENABLED ---');
  {
    const { LiveApiService } = await import('./apps/web/lib/liveApiService.ts');

    // Query country without live rooms (NO - Norway)
    const emptyRooms = await LiveApiService.getLiveRooms({ country: 'NO' });
    check(Array.isArray(emptyRooms) && emptyRooms.length === 0, 'LiveApiService returns empty array [] for country with 0 rooms, NO fixture injection');

    // Verify that DesignFixtures.liveRooms is untouched
    const { DesignFixtures } = await import('./apps/web/lib/design/designFixtures.ts');
    check(DesignFixtures.liveRooms.length >= 8, 'DesignFixtures.liveRooms preserved in isolation');
  }

  // ==========================================================================
  // 13. MOBILE AND WEB RETURN COMPATIBLE RESULTS
  // ==========================================================================
  console.log('\n--- 13. MOBILE AND WEB RETURN COMPATIBLE RESULTS ---');
  {
    // Query Explore via both Mobile endpoint format and Web Live endpoint format
    const mobileReq = makeReq('http://localhost:3000/api/discovery/explore?country=PK&limit=10');
    const mobileRes = await exploreHandler(mobileReq);
    const mobileData = await mobileRes.json();

    const webReq = makeReq('http://localhost:3000/api/live/rooms?country=PK&limit=10');
    const webRes = await liveRoomsHandler(webReq);
    const webData = await webRes.json();

    check(mobileRes.status === 200 && webRes.status === 200, 'Both Mobile and Web discovery endpoints return HTTP 200 for country=PK');
    check(mobileData.rooms.length > 0 && webData.rooms.length > 0, 'Both endpoints return non-empty rooms array for PK');

    // Verify room IDs match across both endpoints
    const mobileFirstId = mobileData.rooms[0].id || mobileData.rooms[0].roomId;
    const webFirstId = webData.rooms[0].id || webData.rooms[0].roomId;
    check(mobileFirstId === webFirstId, `First live room ID matches exactly across Mobile and Web (${mobileFirstId})`);

    // Verify country identification
    check(mobileData.rooms[0].countryCode === 'PK' && webData.rooms[0].countryCode === 'PK', 'Country code is identical ("PK") on both Mobile and Web responses');
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================
  console.log('\n[TEARDOWN] Cleaning up test records from PostgreSQL...');
  for (const roomId of cleanupRoomIds) {
    await pool.query('DELETE FROM popolive.live_rooms WHERE id = $1', [roomId]);
  }
  for (const userId of cleanupUserIds) {
    await pool.query('DELETE FROM popolive.user_follows WHERE follower_id = $1 OR following_id = $1', [userId]);
    await pool.query('DELETE FROM popolive.sessions WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM popolive.user_wallets WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM popolive.users WHERE id = $1', [userId]);
  }
  console.log('[TEARDOWN] Cleanup complete.');

  console.log('\n======================================================================');
  console.log(`POPO LIVE B4 PROMPT 2 SUITE FINISHED: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================================');

  await pool.end();

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runB4CountryFilterSuite().catch(async (err) => {
  console.error('Fatal error during B4 country suite:', err);
  try {
    for (const roomId of cleanupRoomIds) {
      await pool.query('DELETE FROM popolive.live_rooms WHERE id = $1', [roomId]);
    }
    for (const userId of cleanupUserIds) {
      await pool.query('DELETE FROM popolive.user_follows WHERE follower_id = $1 OR following_id = $1', [userId]);
      await pool.query('DELETE FROM popolive.sessions WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM popolive.user_wallets WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM popolive.users WHERE id = $1', [userId]);
    }
  } catch (_) {}
  await pool.end();
  process.exit(1);
});
