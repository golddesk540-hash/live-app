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
  console.log('🧪 Starting Near (Default OFF) Module 3.9 Automated Tests...\n');
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

  // TEST 1: Feature Flag & API Default OFF
  await test('GET /api/discovery/near confirms feature flag defaults to OFF', async () => {
    const res = await fetchUrl('http://localhost:3000/api/discovery/near');
    assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.enabled, false, 'Near feature MUST be disabled by default');
    assert.strictEqual(data.status, 'OFF');
    assert.ok(data.message.includes('OFF'), 'Expected OFF status message');
    assert.strictEqual(data.hosts.length, 0, 'Must NOT return nearby hosts');
    assert.strictEqual(data.users.length, 0, 'Must NOT return nearby users');
    assert.strictEqual(data.gpsRequested, false, 'Must NOT request GPS');
    assert.strictEqual(data.locationCollection, false, 'Must NOT collect location');
  });

  // TEST 2: Location Submission Rejected
  await test('POST /api/discovery/near strictly rejects location data submission (403)', async () => {
    const res = await fetchUrl('http://localhost:3000/api/discovery/near', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { latitude: 31.5204, longitude: 74.3587 },
    });
    assert.strictEqual(res.statusCode, 403, `Expected 403 Forbidden, got ${res.statusCode}`);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.enabled, false);
    assert.ok(data.error.includes('OFF'), 'Expected rejection error message');
  });

  // TEST 3: Route /live/near renders Near Screen
  await test('GET /live/near renders official Near screen with OFF status', async () => {
    const res = await fetchUrl('http://localhost:3000/live/near');
    assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
    assert.ok(res.body.includes('Near') || res.body.includes('Location'), 'Should contain Near title');
    assert.ok(res.body.includes('Popo'), 'Should contain Popo Live branding');
  });

  // TEST 4: Direct route /near renders Near Screen
  await test('GET /near renders direct route with Near screen', async () => {
    const res = await fetchUrl('http://localhost:3000/near');
    assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
  });

  // TEST 5: Location Icon Assets return 200 OK
  await test('Location 3D pin assets (1x and 2x) return 200 OK', async () => {
    const assets = [
      'http://localhost:3000/assets/near/near_location_pin.png',
      'http://localhost:3000/assets/near/near_location_pin@2x.png',
    ];

    for (const url of assets) {
      const res = await fetchUrl(url);
      assert.strictEqual(res.statusCode, 200, `Asset ${url} returned ${res.statusCode}`);
      assert.ok(parseInt(res.headers['content-length'] || '0') > 500, `Asset ${url} is empty`);
    }
  });

  // TEST 6: Preservation of Previous Modules (3.1 to 3.8)
  await test('Preserve Modules 3.1 to 3.8 (Explore, Following, Party, Search, PK, Ranking)', async () => {
    const explore = await fetchUrl('http://localhost:3000/api/discovery/explore');
    assert.strictEqual(explore.statusCode, 200, 'Explore API failed');

    const following = await fetchUrl('http://localhost:3000/api/discovery/following');
    assert.strictEqual(following.statusCode, 200, 'Following API failed');

    const party = await fetchUrl('http://localhost:3000/api/discovery/party');
    assert.strictEqual(party.statusCode, 200, 'Party API failed');

    const search = await fetchUrl('http://localhost:3000/api/search?q=Zara');
    assert.strictEqual(search.statusCode, 200, 'Search API failed');

    const pk = await fetchUrl('http://localhost:3000/api/discovery/pk');
    assert.strictEqual(pk.statusCode, 200, 'PK API failed');

    const ranking = await fetchUrl('http://localhost:3000/api/discovery/rankings/preview');
    assert.strictEqual(ranking.statusCode, 200, 'Ranking preview failed');

    const followingPage = await fetchUrl('http://localhost:3000/live/following');
    assert.strictEqual(followingPage.statusCode, 200, 'Following page failed');
  });

  console.log(`\n===========================================`);
  console.log(`Near Module (3.9) Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`===========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
