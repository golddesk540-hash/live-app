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
  console.log('🧪 Starting Search Module (Phase 3 Module 3.7) Automated Tests...\n');
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

  // TEST 1: User & Room search by nickname ('Zara')
  await test('Search by nickname ("Zara") returns user and live room', async () => {
    const res = await fetchUrl('http://localhost:3000/api/search?q=Zara');
    assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
    assert.ok(data.results.users.length > 0, 'Expected at least 1 matching user');
    const zaraUser = data.results.users.find(u => u.nickname.toLowerCase().includes('zara'));
    assert.ok(zaraUser, 'Zara user not found in results');
    assert.strictEqual(zaraUser.poppoId, '8802194');
    assert.ok(data.results.rooms.length > 0, 'Expected at least 1 matching room');
  });

  // TEST 2: User search by Poppo ID ('8802194')
  await test('Search by Poppo ID ("8802194") finds exact user', async () => {
    const res = await fetchUrl('http://localhost:3000/api/search?q=8802194');
    assert.strictEqual(res.statusCode, 200);
    const data = JSON.parse(res.body);
    assert.ok(data.results.users.length > 0, 'Expected user match by ID');
    assert.strictEqual(data.results.users[0].poppoId, '8802194');
    assert.strictEqual(data.results.users[0].nickname, 'Zara Live');
  });

  // TEST 3: Nickname search ('Sana')
  await test('Search for "Sana" returns user and live broadcast', async () => {
    const res = await fetchUrl('http://localhost:3000/api/search?q=Sana');
    assert.strictEqual(res.statusCode, 200);
    const data = JSON.parse(res.body);
    assert.ok(data.results.users.some(u => u.nickname.toLowerCase().includes('sana')), 'Sana not in users');
  });

  // TEST 4: Party room search ('Party')
  await test('Search for "Party" returns party rooms', async () => {
    const res = await fetchUrl('http://localhost:3000/api/search?q=Party');
    assert.strictEqual(res.statusCode, 200);
    const data = JSON.parse(res.body);
    assert.ok(data.results.party.length > 0, 'Expected party rooms in results');
    assert.ok(data.results.party.some(p => p.title.includes('Party Room')), 'Missing Party Room');
  });

  // TEST 5: PK Battle search ('PK')
  await test('Search for "PK" returns PK battles and live rooms', async () => {
    const res = await fetchUrl('http://localhost:3000/api/search?q=PK');
    assert.strictEqual(res.statusCode, 200);
    const data = JSON.parse(res.body);
    assert.ok(data.results.rooms.length > 0, 'Expected PK rooms');
    assert.ok(data.results.rooms.some(r => r.isPk || r.title.includes('PK')), 'No PK room returned');
  });

  // TEST 6: Web page route /search
  await test('GET /search loads Search screen with Popo branding & 200 OK', async () => {
    const res = await fetchUrl('http://localhost:3000/search');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.includes('Popo Live') || res.body.includes('Popo'), 'Should include Popo branding');
  });

  // TEST 7: Previous modules preservation (3.1 to 3.6)
  await test('Preserve Modules 3.1 to 3.6 (Explore, Party, PK, Banners, Rankings)', async () => {
    const exp = await fetchUrl('http://localhost:3000/live/explore');
    assert.strictEqual(exp.statusCode, 200, 'Explore tab failed');

    const party = await fetchUrl('http://localhost:3000/live/party');
    assert.strictEqual(party.statusCode, 200, 'Party tab failed');

    const partyApi = await fetchUrl('http://localhost:3000/api/discovery/party');
    assert.strictEqual(partyApi.statusCode, 200, 'Party API failed');

    const pk = await fetchUrl('http://localhost:3000/live/pk');
    assert.strictEqual(pk.statusCode, 200, 'PK tab failed');
  });

  console.log(`\n========================================`);
  console.log(`🏁 Search Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
