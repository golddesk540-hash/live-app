const http = require('http');
const https = require('https');

const BASE_URL = (process.env.TEST_URL || 'http://localhost:3000').trim();

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      rejectUnauthorized: false,
    };

    if (body) {
      const data = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

async function runTests() {
  console.log('==================================================');
  console.log('POPO LIVE: Phase 6 Module 6.1 Test Suite');
  console.log('Target:', BASE_URL);
  console.log('==================================================\n');

  try {
    // 1. GET /api/pk/battle-types
    const r1 = await request('GET', '/api/pk/battle-types');
    assert(r1.status === 200, 'TEST 01: GET /api/pk/battle-types returns 200 OK');
    assert(r1.body?.success === true, 'TEST 02: Returns success: true');
    assert(r1.body?.defaultType === '1v1', 'TEST 03: Default battle type is 1v1');

    const types = r1.body?.battleTypes || [];
    assert(types.length >= 2, `TEST 04: Contains at least 2 battle types (Found ${types.length})`);

    // 2. Validate 1v1 Battle Type
    const t1v1 = types.find((t) => t.id === '1v1');
    assert(Boolean(t1v1), 'TEST 05: 1v1 battle type exists in catalog');
    assert(t1v1?.isEnabled === true, 'TEST 06: 1v1 isEnabled is true');
    assert(t1v1?.isLocked === false, 'TEST 07: 1v1 isLocked is false');
    assert(t1v1?.maxHosts === 2, 'TEST 08: 1v1 maxHosts is 2');
    assert(t1v1?.name === '1 vs 1', 'TEST 09: 1v1 English name is "1 vs 1"');
    assert(Boolean(t1v1?.nameUr), 'TEST 10: 1v1 Urdu name is present');

    // 3. Validate 4-Host Battle Type (Locked at launch)
    const t4h = types.find((t) => t.id === '4_host');
    assert(Boolean(t4h), 'TEST 11: 4-Host battle type exists in catalog');
    assert(t4h?.isEnabled === false, 'TEST 12: 4-Host isEnabled is false (locked at launch)');
    assert(t4h?.isLocked === true, 'TEST 13: 4-Host isLocked is true');
    assert(t4h?.maxHosts === 4, 'TEST 14: 4-Host maxHosts is 4');
    assert(t4h?.name === '4-Host Battle', 'TEST 15: 4-Host English name is "4-Host Battle"');
    assert(Boolean(t4h?.nameUr), 'TEST 16: 4-Host Urdu name is present');

    // 4. Feature Flags check
    const flags = r1.body?.featureFlags;
    assert(flags?.pk1v1Enabled === true, 'TEST 17: Feature flag pk1v1Enabled is true');
    assert(flags?.pk4hostEnabled === false, 'TEST 18: Feature flag pk4hostEnabled is false (locked)');

    // 5. POST validation: missing roomNumber
    const r2 = await request('POST', '/api/pk/battle-types/select', {
      battleType: '1v1',
    });
    assert(r2.status === 400, 'TEST 19: Rejects missing roomNumber (400 Bad Request)');

    // 6. POST validation: missing battleType
    const r3 = await request('POST', '/api/pk/battle-types/select', {
      roomNumber: '7001',
    });
    assert(r3.status === 400, 'TEST 20: Rejects missing battleType (400 Bad Request)');

    // 7. POST validation: unsupported / random battle type
    const r4 = await request('POST', '/api/pk/battle-types/select', {
      roomNumber: '7001',
      battleType: 'unsupported_10_hosts',
    });
    assert(r4.status === 400, 'TEST 21: Rejects unsupported battle type (400 Bad Request)');
    assert(r4.body?.code === 'UNSUPPORTED_BATTLE_TYPE', 'TEST 22: Returns UNSUPPORTED_BATTLE_TYPE error code');

    // 8. Strict Protection: 4-Host selection rejection on backend
    const r5 = await request('POST', '/api/pk/battle-types/select', {
      roomNumber: '7001',
      battleType: '4_host',
    });
    assert(r5.status === 403, 'TEST 23: Rejects locked 4-Host battle type (403 Forbidden)');
    assert(r5.body?.code === 'BATTLE_TYPE_LOCKED', 'TEST 24: Returns BATTLE_TYPE_LOCKED error code');
    assert(Boolean(r5.body?.errorUr), 'TEST 25: Returns localized Urdu rejection notice');

    // 9. Valid 1v1 selection
    const r6 = await request('POST', '/api/pk/battle-types/select', {
      roomNumber: '7001',
      hostId: 'host_maria_7001',
      battleType: '1v1',
      language: 'en',
    });
    assert(r6.status === 200, 'TEST 26: POST select 1v1 battle type returns 200 OK');
    assert(r6.body?.success === true, 'TEST 27: Select 1v1 returns success: true');
    assert(r6.body?.battleType === '1v1', 'TEST 28: Returns confirmed battleType: "1v1"');
    assert(Boolean(r6.body?.sessionId), 'TEST 29: Records valid PK battle sessionId');
    assert(r6.body?.status === 'configured', 'TEST 30: PK battle session status is "configured"');

    // 10. Valid 1v1 selection with Urdu language
    const r7 = await request('POST', '/api/pk/battle-types/select', {
      roomNumber: '7001',
      hostId: 'host_maria_7001',
      battleType: '1v1',
      language: 'ur',
    });
    assert(r7.status === 200, 'TEST 31: POST select 1v1 with Urdu returns 200 OK');
    assert(Boolean(r7.body?.messageUr), 'TEST 32: Returns localized messageUr');

    // 11. GET active session for room
    const r8 = await request('GET', '/api/pk/battle-types/session?roomNumber=7001');
    assert(r8.status === 200, 'TEST 33: GET /api/pk/battle-types/session returns 200 OK');
    assert(r8.body?.hasConfiguredSession === true, 'TEST 34: Room 7001 has configured PK session');
    assert(r8.body?.battleType === '1v1', 'TEST 35: Active battleType in session is 1v1');

    // 12. Web UI Page Loading
    const r9 = await request('GET', '/pk/battle-types?preview=demo');
    assert(r9.status === 200, 'TEST 36: GET /pk/battle-types loads successfully (200 OK)');

    const r10 = await request('GET', '/pk/room/7001/battle-types');
    assert(r10.status === 200, 'TEST 37: GET /pk/room/7001/battle-types loads successfully (200 OK)');

    const html = typeof r9.body === 'string' ? r9.body : JSON.stringify(r9.body);
    assert(
      html.includes('PK Battle') || html.includes('Select Battle Type'),
      'TEST 38: Web UI contains PK Battle Type heading and elements'
    );
  } catch (err) {
    console.error('Test suite execution error:', err);
    failCount++;
  }

  console.log('\n==================================================');
  console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('==================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests();
