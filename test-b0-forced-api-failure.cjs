/**
 * ============================================================================
 * POPO LIVE — B0 PROMPT 3 FORCED API FAILURE & FIXTURE FALLBACK VERIFICATION
 * Master Plan Reference: POPO-LIVE-BACKEND-REALTIME-PLAN.pdf (Phase B0 Prompt 3, Section 7)
 *
 * Validates:
 *  1. When module flag is ON:
 *     - API Failure: Error propagates to caller; NEVER silently falls back to DesignFixtures.
 *     - API Empty List: Empty result remains empty []; NEVER substitutes fixture rooms.
 *     - API Success: Returns actual live payload.
 *  2. When module flag is OFF (Default B0 state):
 *     - Fixture filled state returns DesignFixtures.liveRooms.
 *     - Fixture empty state returns [].
 *     - Fixture error state throws DesignFixtureException.
 *  3. Default B0 flag configuration remains strictly OFF across all environments.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const Module = require('module');

// Register Next.js '@/...' path alias for Node.js execution
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    const sub = request.slice(2);
    let target = path.resolve(__dirname, 'apps/web', sub);
    if (!path.extname(target)) {
      if (fs.existsSync(target + '.ts')) target = target + '.ts';
      else if (fs.existsSync(target + '.tsx')) target = target + '.tsx';
      else if (fs.existsSync(target + '.js')) target = target + '.js';
    }
    return target;
  }
  return origResolve.call(this, request, parent, isMain, options);
};

let testsPassed = 0;
let testsFailed = 0;

function check(condition, desc) {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${desc}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log('======================================================================');
  console.log('POPO LIVE: B0 PROMPT 3 FORCED API FAILURE & FALLBACK AUDIT');
  console.log('======================================================================\n');

  // Load DesignFixtures
  const { DesignFixtures } = require('./apps/web/lib/design/designFixtures.ts');

  // ------------------------------------------------------------------------
  // TEST SUITE 1: MODULE FLAG OFF (DEFAULT B0 DESIGN FIXTURE MODE)
  // ------------------------------------------------------------------------
  console.log('--- Test Suite 1: Module Flag OFF (Design Fixture Mode) ---');
  delete process.env.NEXT_PUBLIC_USE_LIVE_API; // defaults to false
  
  delete require.cache[require.resolve('./apps/web/lib/liveApiService.ts')];
  let { LiveApiService, USE_LIVE_API } = require('./apps/web/lib/liveApiService.ts');

  check(USE_LIVE_API === false, 'USE_LIVE_API evaluates strictly to false by default');

  // 1A: Filled fixture state
  DesignFixtures.reset();
  const defaultRooms = await LiveApiService.getLiveRooms();
  check(Array.isArray(defaultRooms) && defaultRooms.length === 8, 'Flag OFF: returns 8 fixture live rooms in filled state');
  check(defaultRooms[0].title.includes('Karachi Nights'), 'Flag OFF: room title includes fixture "Karachi Nights"');

  // 1B: Empty fixture state
  DesignFixtures.setEmpty();
  const emptyRooms = await LiveApiService.getLiveRooms();
  check(Array.isArray(emptyRooms) && emptyRooms.length === 0, 'Flag OFF: returns empty array when DesignFixtures.isEmpty = true');

  // 1C: Error fixture state
  DesignFixtures.setError();
  let threwFixtureErr = false;
  try {
    await LiveApiService.getLiveRooms();
  } catch (err) {
    threwFixtureErr = true;
    check(err.message.includes('ERR_LIVE_ROOMS_503') || err.message.includes('Failed to load live broadcast rooms') || err.name === 'DesignFixtureError', 'Flag OFF: throws DesignFixtureError when DesignFixtures.isError = true');
  }
  check(threwFixtureErr, 'Flag OFF: Error state triggers exception');
  DesignFixtures.reset();

  // 1D: Fixture room details & viewer mocks
  const fixtureDetails = await LiveApiService.getRoomDetails('room_001');
  check(fixtureDetails !== null && fixtureDetails.id === 'room_001', 'Flag OFF: getRoomDetails returns matching fixture room');

  const fixtureJoin = await LiveApiService.joinViewerSession('room_001');
  check(fixtureJoin.success === true && fixtureJoin.viewerCount === 1421, 'Flag OFF: joinViewerSession returns fixture mock count (1421)');

  const fixtureLeave = await LiveApiService.leaveViewerSession('room_001');
  check(fixtureLeave.success === true && fixtureLeave.viewerCount === 1420, 'Flag OFF: leaveViewerSession returns fixture mock count (1420)');

  // ------------------------------------------------------------------------
  // TEST SUITE 2: MODULE FLAG ON + FORCED API FAILURE
  // ------------------------------------------------------------------------
  console.log('\n--- Test Suite 2: Module Flag ON + Forced API Failure ---');
  process.env.NEXT_PUBLIC_USE_LIVE_API = 'true';
  delete require.cache[require.resolve('./apps/web/lib/liveApiService.ts')];
  ({ LiveApiService, USE_LIVE_API } = require('./apps/web/lib/liveApiService.ts'));
  check(USE_LIVE_API === true, 'Test override: USE_LIVE_API enabled for isolated test');

  // Mock global fetch to simulate HTTP 500 internal server error
  const originalFetch = global.fetch;
  global.fetch = async (url, opts) => {
    return {
      ok: false,
      status: 500,
      json: async () => ({ success: false, error: 'Database cluster unreachable [ERR_DB_500]' }),
    };
  };

  let threwOnFailure = false;
  let returnedFallback = false;
  try {
    const res = await LiveApiService.getLiveRooms();
    if (res && res.length > 0) {
      returnedFallback = true;
    }
  } catch (err) {
    threwOnFailure = true;
    check(err.message.includes('500'), 'Flag ON + Failure: Propagates HTTP 500 error cleanly');
  }
  check(threwOnFailure === true, 'Flag ON + Failure: getLiveRooms throws instead of catching silently');
  check(returnedFallback === false, 'Flag ON + Failure: Zero fixture rooms returned during API failure');

  // getRoomDetails on API failure
  let roomDetailsThrew = false;
  try {
    await LiveApiService.getRoomDetails('room_001');
  } catch (err) {
    roomDetailsThrew = true;
    check(err.message.includes('500'), 'Flag ON + Failure: getRoomDetails throws HTTP 500 error');
  }
  check(roomDetailsThrew === true, 'Flag ON + Failure: getRoomDetails does NOT fall back to fixture room');

  // joinViewerSession on API failure
  let joinThrew = false;
  try {
    await LiveApiService.joinViewerSession('room_001');
  } catch (err) {
    joinThrew = true;
    check(err.message.includes('500'), 'Flag ON + Failure: joinViewerSession throws HTTP 500 error');
  }
  check(joinThrew === true, 'Flag ON + Failure: joinViewerSession does NOT return fake 1421 viewers');

  // ------------------------------------------------------------------------
  // TEST SUITE 3: MODULE FLAG ON + EMPTY API RESPONSE
  // ------------------------------------------------------------------------
  console.log('\n--- Test Suite 3: Module Flag ON + Empty API Response ---');
  global.fetch = async (url, opts) => {
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, rooms: [], count: 0 }),
    };
  };

  const emptyLiveRooms = await LiveApiService.getLiveRooms();
  check(Array.isArray(emptyLiveRooms), 'Flag ON + Empty: Returns array');
  check(emptyLiveRooms.length === 0, 'Flag ON + Empty: Array is empty (0 rooms)');
  check(emptyLiveRooms !== DesignFixtures.liveRooms, 'Flag ON + Empty: Does NOT substitute DesignFixtures.liveRooms');

  // ------------------------------------------------------------------------
  // TEST SUITE 4: MODULE FLAG ON + LIVE DATA SUCCESS
  // ------------------------------------------------------------------------
  console.log('\n--- Test Suite 4: Module Flag ON + Live API Success ---');
  const mockLiveRoom = {
    id: 'room_live_real_999',
    roomNumber: '9998881',
    title: 'Lahore Tech Gala Live Stream',
    viewerCount: 88,
    isLive: true,
    category: 'Technology',
    country: 'Pakistan',
    countryCode: 'PK',
    flagEmoji: '🇵🇰',
    host: {
      nickname: 'Zainab Qureshi',
      avatarUrl: '/avatars/zainab.png',
    },
    coverUrl: '/covers/tech_gala.png',
  };

  global.fetch = async (url, opts) => {
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, rooms: [mockLiveRoom], count: 1 }),
    };
  };

  const liveRooms = await LiveApiService.getLiveRooms();
  check(liveRooms.length === 1, 'Flag ON + Success: Returns exactly 1 live room');
  check(liveRooms[0].id === 'room_live_real_999', 'Flag ON + Success: Room ID matches actual API payload');
  check(liveRooms[0].title === 'Lahore Tech Gala Live Stream', 'Flag ON + Success: Room title matches API payload');
  check(liveRooms[0].hostNickname === 'Zainab Qureshi', 'Flag ON + Success: Host nickname matches API payload');

  // ------------------------------------------------------------------------
  // TEST SUITE 5: RESTORE GLOBAL ENVIRONMENT & VERIFY B0 FREEZE
  // ------------------------------------------------------------------------
  console.log('\n--- Test Suite 5: Restore Environment & Confirm B0 Flag Freeze ---');
  global.fetch = originalFetch;
  delete process.env.NEXT_PUBLIC_USE_LIVE_API;
  delete require.cache[require.resolve('./apps/web/lib/liveApiService.ts')];
  ({ LiveApiService, USE_LIVE_API } = require('./apps/web/lib/liveApiService.ts'));

  check(USE_LIVE_API === false, 'After teardown: USE_LIVE_API is safely back to FALSE');
  DesignFixtures.reset();
  const restoredRooms = await LiveApiService.getLiveRooms();
  check(restoredRooms.length === 8, 'After teardown: Fixture mode restored (8 rooms returned)');

  // ------------------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`FORCED API FAILURE TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
