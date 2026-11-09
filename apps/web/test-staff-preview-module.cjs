const http = require('http');
const https = require('https');
const assert = require('assert');

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const parsed = new URL(url);
    const reqOptions = {
      method: options.method || 'GET',
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      headers: options.headers || {},
    };

    const req = client.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Staff Preview Tool (Phase 3 Module 3.10) Automated Tests...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     ${err.message}`);
      failed++;
    }
  }

  // TEST 1: Unauthenticated access control (403 Forbidden)
  await test('GET /api/staff/test-rooms without auth returns 403 Forbidden', async () => {
    const res = await fetchUrl('http://localhost:3000/api/staff/test-rooms');
    assert.strictEqual(res.statusCode, 403, `Expected 403, got ${res.statusCode}`);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, false);
    assert.ok(data.error.includes('Staff authorization required'));
  });

  // TEST 2: Demo/Preview mode access for UI previews
  await test('GET /api/staff/test-rooms?preview=demo returns test room records', async () => {
    const res = await fetchUrl('http://localhost:3000/api/staff/test-rooms?preview=demo');
    assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.rooms), 'Expected rooms array');
    assert.ok(data.rooms.length >= 4, `Expected at least 4 test rooms, got ${data.rooms.length}`);

    const room1 = data.rooms.find(r => r.testRoomId === 'TEST-9001');
    assert.ok(room1, 'TEST-9001 missing');
    assert.ok(room1.title.includes('TEST DATA'), 'Must have TEST DATA label');
    assert.strictEqual(room1.isTestData, true);
    assert.strictEqual(room1.environment, 'staging');
  });

  // TEST 3: Authenticated Staff login & access
  let staffCookie = '';
  await test('Login as authorized staff (staff@popolive.com) and fetch test rooms', async () => {
    // 1. Accept terms to get valid consent cookie
    const consentRes = await fetchUrl('http://localhost:3000/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        action: 'accept',
        termsAccepted: true,
        privacyAccepted: true,
        isAdultConfirmed: true,
        anonymousSessionId: 'staff_test_anon_' + Date.now(),
      },
    });
    const termsCookie = consentRes.headers['set-cookie']?.[0]?.split(';')[0] || '';

    // 2. Perform staff login with terms cookie
    const loginRes = await fetchUrl('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: termsCookie,
      },
      body: { identifier: 'staff@popolive.com', password: 'StaffPass123!' },
    });
    assert.strictEqual(loginRes.statusCode, 200, `Login failed: ${loginRes.body}`);
    const sessionCookie = loginRes.headers['set-cookie']?.[0]?.split(';')[0] || '';
    assert.ok(sessionCookie, 'Expected session cookie');
    staffCookie = `${termsCookie}; ${sessionCookie}`;

    const staffRes = await fetchUrl('http://localhost:3000/api/staff/test-rooms', {
      headers: { Cookie: staffCookie },
    });
    assert.strictEqual(staffRes.statusCode, 200, `Expected 200 for staff, got ${staffRes.statusCode}`);
    const data = JSON.parse(staffRes.body);
    assert.strictEqual(data.success, true);
    assert.ok(data.rooms.length > 0);
  });

  // TEST 4: Create new test room via staff POST API
  await test('POST /api/staff/test-rooms creates new test room successfully', async () => {
    const createRes = await fetchUrl('http://localhost:3000/api/staff/test-rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: staffCookie,
      },
      body: {
        title: 'Hardware Video Acceleration Benchmark',
        category: 'live',
        hostNickname: 'QA Engineer',
      },
    });
    assert.strictEqual(createRes.statusCode, 200);
    const data = JSON.parse(createRes.body);
    assert.strictEqual(data.success, true);
    assert.ok(data.room.test_room_id.startsWith('TEST-'));
  });

  // TEST 5: Single test room preview endpoint
  await test('GET /api/staff/test-rooms/TEST-9001 returns room preview data safely', async () => {
    const res = await fetchUrl('http://localhost:3000/api/staff/test-rooms/TEST-9001?preview=demo');
    assert.strictEqual(res.statusCode, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.room.testRoomId, 'TEST-9001');
    assert.strictEqual(data.room.isTestData, true);
  });

  // TEST 6: Staff assets return 200 OK
  await test('Staff shield assets (1x and 2x) return 200 OK', async () => {
    const assets = [
      'http://localhost:3000/assets/staff/staff_shield.png',
      'http://localhost:3000/assets/staff/staff_shield@2x.png',
    ];
    for (const url of assets) {
      const res = await fetchUrl(url);
      assert.strictEqual(res.statusCode, 200, `Asset ${url} returned ${res.statusCode}`);
      assert.ok(parseInt(res.headers['content-length'] || '0') > 500, `Asset ${url} is empty`);
    }
  });

  // TEST 7: Route /staff renders
  await test('GET /staff renders Staff Preview page', async () => {
    const res = await fetchUrl('http://localhost:3000/staff');
    assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
    assert.ok(res.body.includes('Staff') || res.body.includes('Popo'), 'Should include Staff elements');
  });

  // TEST 8: Preservation of Modules 3.1 to 3.9
  await test('Preserve Modules 3.1 to 3.9 (Explore, Following, Party, Search, Near, PK, Ranking)', async () => {
    const explore = await fetchUrl('http://localhost:3000/api/discovery/explore');
    assert.strictEqual(explore.statusCode, 200, 'Explore failed');

    const following = await fetchUrl('http://localhost:3000/api/discovery/following');
    assert.strictEqual(following.statusCode, 200, 'Following failed');

    const party = await fetchUrl('http://localhost:3000/api/discovery/party');
    assert.strictEqual(party.statusCode, 200, 'Party failed');

    const search = await fetchUrl('http://localhost:3000/api/search?q=Zara');
    assert.strictEqual(search.statusCode, 200, 'Search failed');

    const near = await fetchUrl('http://localhost:3000/api/discovery/near');
    assert.strictEqual(near.statusCode, 200, 'Near failed');
    const nearData = JSON.parse(near.body);
    assert.strictEqual(nearData.enabled, false, 'Near must remain OFF');

    const pk = await fetchUrl('http://localhost:3000/api/discovery/pk');
    assert.strictEqual(pk.statusCode, 200, 'PK failed');

    const ranking = await fetchUrl('http://localhost:3000/api/discovery/rankings/preview');
    assert.strictEqual(ranking.statusCode, 200, 'Ranking failed');
  });

  console.log(`\n===========================================`);
  console.log(`Staff Preview Module Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`===========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
