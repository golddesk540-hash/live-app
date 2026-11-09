const http = require('http');
const https = require('https');
const assert = require('assert');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        });
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('🧪 Starting Party Discovery List (Module 3.6) Automated Tests...\n');
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

  // TEST 1: Party Rooms API
  await test('GET /api/discovery/party returns valid JSON and 4 reference rooms', async () => {
    const res = await fetchUrl('http://localhost:3000/api/discovery/party');
    assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true, 'Expected success: true');
    assert.ok(Array.isArray(data.rooms), 'Expected rooms array');
    assert.ok(data.rooms.length >= 4, `Expected at least 4 rooms, got ${data.rooms.length}`);

    // Verify 4 reference rooms
    const titles = data.rooms.map(r => r.title);
    assert.ok(titles.some(t => t.includes('Fun Party Room')), 'Missing Fun Party Room');
    assert.ok(titles.some(t => t.includes('Music Party')), 'Missing Music Party');
    assert.ok(titles.some(t => t.includes('Friends Chat')), 'Missing Friends Chat');
    assert.ok(titles.some(t => t.includes('Global Party')), 'Missing Global Party');

    // Verify member counts
    const funRoom = data.rooms.find(r => r.title.includes('Fun Party Room'));
    assert.strictEqual(funRoom.currentMembers, 9, 'Fun Party Room members should be 9');
    assert.strictEqual(funRoom.maxMembers, 9, 'Fun Party Room max should be 9');

    const musicRoom = data.rooms.find(r => r.title.includes('Music Party'));
    assert.strictEqual(musicRoom.currentMembers, 6, 'Music Party members should be 6');

    const friendsRoom = data.rooms.find(r => r.title.includes('Friends Chat'));
    assert.strictEqual(friendsRoom.currentMembers, 4, 'Friends Chat members should be 4');
  });

  // TEST 2: Assets reachable
  await test('Collage image assets exist and return HTTP 200', async () => {
    const images = [
      'http://localhost:3000/assets/party/fun_party_collage@2x.png',
      'http://localhost:3000/assets/party/music_party_collage@2x.png',
      'http://localhost:3000/assets/party/friends_chat_collage@2x.png',
      'http://localhost:3000/assets/party/global_party_collage@2x.png',
    ];
    for (const imgUrl of images) {
      const res = await fetchUrl(imgUrl);
      assert.strictEqual(res.statusCode, 200, `Asset ${imgUrl} failed with status ${res.statusCode}`);
    }
  });

  // TEST 3: Route /live/party
  await test('GET /live/party renders party discovery page', async () => {
    const res = await fetchUrl('http://localhost:3000/live/party');
    assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
    assert.ok(res.body.includes('Popo'), 'Should include Popo branding');
    assert.ok(res.body.includes('Party') || res.body.includes('live'), 'Should include Party tab elements');
  });

  // TEST 4: Direct route /party
  await test('GET /party renders party discovery page directly', async () => {
    const res = await fetchUrl('http://localhost:3000/party');
    assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
  });

  // TEST 5: Preservation of Previous Modules (3.1 to 3.5)
  await test('Preserve Previous Modules (Explore, Following, New, PK, Ranking)', async () => {
    const exploreRes = await fetchUrl('http://localhost:3000/live/explore');
    assert.strictEqual(exploreRes.statusCode, 200, 'Explore tab failed');

    const followingRes = await fetchUrl('http://localhost:3000/live/following');
    assert.strictEqual(followingRes.statusCode, 200, 'Following tab failed');

    const newRes = await fetchUrl('http://localhost:3000/live/new');
    assert.strictEqual(newRes.statusCode, 200, 'New tab failed');

    const pkRes = await fetchUrl('http://localhost:3000/live/pk');
    assert.strictEqual(pkRes.statusCode, 200, 'PK tab failed');

    const bannersRes = await fetchUrl('http://localhost:3000/api/discovery/banners');
    assert.strictEqual(bannersRes.statusCode, 200, 'Banners API failed');

    const rankingRes = await fetchUrl('http://localhost:3000/api/discovery/rank-doors');
    assert.strictEqual(rankingRes.statusCode, 200, 'Rank doors API failed');
  });

  console.log(`\n========================================`);
  console.log(`🏁 Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
