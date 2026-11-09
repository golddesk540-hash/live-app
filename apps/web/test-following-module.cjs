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
  console.log('🧪 Starting Following Module (Phase 3 Module 3.8) Automated Tests...\n');
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

  // TEST 1: Following API guest/demo mode returns 4 reference creators
  await test('GET /api/discovery/following returns 4 reference creators (Zara, Sana, Alina, Mehak)', async () => {
    const res = await fetchUrl('http://localhost:3000/api/discovery/following');
    assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
    assert.strictEqual(typeof data.authenticated, 'boolean');
    assert.ok(Array.isArray(data.users), 'Expected users array');
    assert.strictEqual(data.users.length, 4, `Expected 4 users, got ${data.users.length}`);

    const nicknames = data.users.map(u => u.nickname);
    assert.ok(nicknames.includes('Zara Live'), 'Missing Zara Live');
    assert.ok(nicknames.includes('Sana Khan'), 'Missing Sana Khan');
    assert.ok(nicknames.includes('Alina'), 'Missing Alina');
    assert.ok(nicknames.includes('Mehak'), 'Missing Mehak');

    const zara = data.users.find(u => u.nickname === 'Zara Live');
    assert.strictEqual(zara.isLive, true);
    assert.strictEqual(zara.viewersFormatted, '1.8K');

    const sana = data.users.find(u => u.nickname === 'Sana Khan');
    assert.strictEqual(sana.isLive, true);
    assert.strictEqual(sana.viewersFormatted, '892');

    const alina = data.users.find(u => u.nickname === 'Alina');
    assert.strictEqual(alina.isLive, true);
    assert.strictEqual(alina.viewersFormatted, '725');

    const mehak = data.users.find(u => u.nickname === 'Mehak');
    assert.strictEqual(mehak.isLive, true);
    assert.strictEqual(mehak.viewersFormatted, '602');
  });

  // TEST 2: Avatar assets return 200 OK
  await test('Following avatars 1x and 2x retina exist and return 200 OK', async () => {
    const assets = [
      'http://localhost:3000/assets/following/zara_live.png',
      'http://localhost:3000/assets/following/zara_live@2x.png',
      'http://localhost:3000/assets/following/sana_khan.png',
      'http://localhost:3000/assets/following/sana_khan@2x.png',
      'http://localhost:3000/assets/following/alina.png',
      'http://localhost:3000/assets/following/alina@2x.png',
      'http://localhost:3000/assets/following/mehak.png',
      'http://localhost:3000/assets/following/mehak@2x.png',
    ];

    for (const url of assets) {
      const res = await fetchUrl(url);
      assert.strictEqual(res.statusCode, 200, `Asset ${url} returned ${res.statusCode}`);
      assert.ok(parseInt(res.headers['content-length'] || '0') > 1000, `Asset ${url} is empty`);
    }
  });

  // TEST 3: Route /live/following renders
  await test('GET /live/following renders discovery shell with Following tab', async () => {
    const res = await fetchUrl('http://localhost:3000/live/following');
    assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
    assert.ok(res.body.includes('Popo') || res.body.includes('Live'), 'Should include Popo Live branding');
  });

  // TEST 4: Notification toggle POST API
  await test('POST /api/discovery/following toggles notification bell preference', async () => {
    const res = await fetchUrl('http://localhost:3000/api/discovery/following', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { targetUserId: '8802194', enabled: true },
    });
    assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.enabled, true);
  });

  // TEST 5: Preservation of Previous Modules (Explore, Party, Search, PK, Ranking)
  await test('Preserve Modules 3.1 to 3.7 (Explore, Party, Search, PK, Ranking)', async () => {
    const explore = await fetchUrl('http://localhost:3000/api/discovery/explore');
    assert.strictEqual(explore.statusCode, 200, 'Explore API failed');

    const party = await fetchUrl('http://localhost:3000/api/discovery/party');
    assert.strictEqual(party.statusCode, 200, 'Party API failed');

    const search = await fetchUrl('http://localhost:3000/api/search?q=Zara');
    assert.strictEqual(search.statusCode, 200, 'Search API failed');

    const pk = await fetchUrl('http://localhost:3000/api/discovery/pk');
    assert.strictEqual(pk.statusCode, 200, 'PK API failed');

    const ranking = await fetchUrl('http://localhost:3000/api/discovery/rankings/preview');
    assert.strictEqual(ranking.statusCode, 200, 'Ranking preview API failed');

    const liveParty = await fetchUrl('http://localhost:3000/live/party');
    assert.strictEqual(liveParty.statusCode, 200, 'Live party route failed');
  });

  console.log(`\n===========================================`);
  console.log(`Following Module Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`===========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
