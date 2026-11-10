const http = require('http');
const https = require('https');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

function get(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const client = url.protocol === 'https:' ? https : http;
    client
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, text: data });
          }
        });
      })
      .on('error', reject);
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const client = url.protocol === 'https:' ? https : http;
    const postData = JSON.stringify(body || {});
    const req = client.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, text: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function check(desc, pass) {
  if (pass) {
    console.log(`  ✓ [PASS] ${desc}`);
  } else {
    console.error(`  ✗ [FAIL] ${desc}`);
    failedTests++;
  }
  totalTests++;
}

let totalTests = 0;
let failedTests = 0;

async function runTests() {
  console.log('======================================================');
  console.log('RUNNING MODULE 6.6 PK DISCOVERY TAB SYSTEM TESTS');
  console.log(`Target: ${BASE_URL}`);
  console.log('======================================================\n');

  // Test 1: Fetch Live PK Battles
  console.log('--- Test 1: Live PK Battles Query ---');
  const liveRes = await get('/api/pk/discovery?tab=live');
  check('Discovery endpoint returns HTTP 200', liveRes.status === 200);
  check('Response reports success: true', liveRes.body?.success === true);
  check('Tab is identified as live', liveRes.body?.tab === 'live');
  check('Battles returned as array', Array.isArray(liveRes.body?.battles));
  check('Live battles count is at least 3', (liveRes.body?.battles?.length || 0) >= 3);

  // Test 2: Verify Exact Matches to 06_06_pk_discovery_tab.png
  console.log('\n--- Test 2: Verify Matches to Reference Design 06_06 ---');
  const battles = liveRes.body?.battles || [];
  const battle1 = battles.find((b) => b.hostA.nickname === 'Sara Live' || b.hostB.nickname === 'Ayesha');
  const battle2 = battles.find((b) => b.hostA.nickname === 'Zoya' || b.hostB.nickname === 'Nimra');
  const battle3 = battles.find((b) => b.hostA.nickname === 'Hira' || b.hostB.nickname === 'Alina');

  check('Battle 1 (Sara Live vs Ayesha) exists', !!battle1);
  if (battle1) {
    check('Battle 1 viewer count matches 24.8K', battle1.viewerCount === 24800);
    check('Battle 1 Host A score is 24,860', battle1.hostA.score === 24860);
    check('Battle 1 Host B score is 18,320', battle1.hostB.score === 18320);
    check('Battle 1 is featured #1', battle1.isFeatured === true && battle1.featuredOrder === 1);
    check('Battle 1 remaining timer is formatted', !!battle1.formattedTimer);
  }

  check('Battle 2 (Zoya vs Nimra) exists', !!battle2);
  if (battle2) {
    check('Battle 2 viewer count matches 11.2K', battle2.viewerCount === 11200);
    check('Battle 2 is featured #2', battle2.isFeatured === true && battle2.featuredOrder === 2);
  }

  check('Battle 3 (Hira vs Alina) exists', !!battle3);
  if (battle3) {
    check('Battle 3 viewer count matches 6.9K', battle3.viewerCount === 6900);
    check('Battle 3 is featured #3', battle3.isFeatured === true && battle3.featuredOrder === 3);
  }

  // Test 3: Fetch Available Hosts
  console.log('\n--- Test 3: Available Eligible Hosts ---');
  const hostRes = await get('/api/pk/discovery?tab=available_hosts');
  check('Available hosts endpoint returns HTTP 200', hostRes.status === 200);
  check('Available hosts returned as array', Array.isArray(hostRes.body?.hosts));
  check('At least 4 available hosts returned', (hostRes.body?.hosts?.length || 0) >= 4);

  const sana = hostRes.body?.hosts?.find((h) => h.poppoId === '88209');
  check('Host Sana Khan (88209) is returned as available', !!sana);
  if (sana) {
    check('Sana Khan is eligible for PK', sana.isEligibleForPk === true);
    check('Sana Khan is not in PK battle', sana.inPkBattle === false);
    check('Sana Khan has room number and viewers', !!sana.roomNumber && sana.viewerCount > 0);
  }

  // Test 4: Popular PK Battles Ranking
  console.log('\n--- Test 4: Popular PK Battles Ranking ---');
  const popularRes = await get('/api/pk/discovery?tab=popular');
  check('Popular battles endpoint returns HTTP 200', popularRes.status === 200);
  const popBattles = popularRes.body?.battles || [];
  check('Popular battles returned', popBattles.length > 0);
  if (popBattles.length > 0) {
    check('Top popular battle has highest viewer count', popBattles[0].viewerCount >= (popBattles[1]?.viewerCount || 0));
  }

  // Test 5: Recent Completed Battles
  console.log('\n--- Test 5: Recent Completed Battles ---');
  const recentRes = await get('/api/pk/discovery?tab=recent');
  check('Recent battles endpoint returns HTTP 200', recentRes.status === 200);
  const recBattles = recentRes.body?.battles || [];
  check('Recent battles array returned', Array.isArray(recBattles));
  if (recBattles.length > 0) {
    check('Recent battle has completed status', recBattles[0].status === 'completed');
  }

  // Test 6: Search by Nickname, Host ID and Country
  console.log('\n--- Test 6: Search & Filtering Precision ---');
  const searchNameRes = await get('/api/pk/discovery?tab=live&search=Sara');
  check('Search by nickname "Sara" returns HTTP 200', searchNameRes.status === 200);
  const searchNameMatches = searchNameRes.body?.battles || [];
  check('Search by "Sara" returns Sara Live', searchNameMatches.some((b) => b.hostA.nickname.includes('Sara')));

  const searchIdRes = await get('/api/pk/discovery?tab=live&search=88203');
  check('Search by Host ID "88203" returns HTTP 200', searchIdRes.status === 200);
  const searchIdMatches = searchIdRes.body?.battles || [];
  check('Search by "88203" returns Zoya', searchIdMatches.some((b) => b.hostA.poppoId === '88203'));

  const countryRes = await get('/api/pk/discovery?tab=live&country=AE');
  check('Country filter "AE" returns HTTP 200', countryRes.status === 200);
  const countryMatches = countryRes.body?.battles || [];
  check('Country filter "AE" returns UAE battle', countryMatches.some((b) => b.hostA.countryCode === 'AE' || b.hostB.countryCode === 'AE'));

  // Test 7: Admin Featured Battles Management
  console.log('\n--- Test 7: Admin Featured Battles Management ---');
  const featuredListRes = await get('/api/pk/discovery/featured');
  check('Admin featured list returns HTTP 200', featuredListRes.status === 200);
  check('Featured battles returned', (featuredListRes.body?.featured?.length || 0) >= 3);

  // Test unfeaturing Battle 3
  const unfeatureRes = await post('/api/pk/discovery/featured', {
    battleId: '00000000-0000-0000-0000-000000000608',
    isFeatured: false,
  });
  check('Unfeature battle returns HTTP 200', unfeatureRes.status === 200);
  check('Battle marked unfeatured', unfeatureRes.body?.isFeatured === false);

  // Re-feature Battle 3
  const refeatureRes = await post('/api/pk/discovery/featured', {
    battleId: '00000000-0000-0000-0000-000000000608',
    isFeatured: true,
    featuredOrder: 3,
  });
  check('Re-feature battle returns HTTP 200', refeatureRes.status === 200);
  check('Battle restored as featured #3', refeatureRes.body?.featuredOrder === 3);

  // Test 8: Watch Battle Session Validation
  console.log('\n--- Test 8: Watch Battle Session Validation ---');
  const watchBattleRes = await get('/api/pk/battle/00000000-0000-0000-0000-000000000606');
  check('Watch battle endpoint returns HTTP 200', watchBattleRes.status === 200);
  check('Battle session found and verified', watchBattleRes.body?.success === true);
  check('Host A room and stream details available', !!watchBattleRes.body?.battle?.hostA?.roomNumber);
  check('Host B room and stream details available', !!watchBattleRes.body?.battle?.hostB?.roomNumber);

  // Test 9: Web Pages Accessibility
  console.log('\n--- Test 9: Web Pages Accessibility ---');
  const pageRes = await get('/pk');
  check('Route /pk returns HTTP 200', pageRes.status === 200);

  const discoveryPageRes = await get('/pk/discovery');
  check('Route /pk/discovery returns HTTP 200', discoveryPageRes.status === 200);

  console.log('\n======================================================');
  if (failedTests === 0) {
    console.log(`ALL TESTS PASSED: ${totalTests}/${totalTests} (100% SUCCESS)`);
  } else {
    console.error(`TESTS FAILED: ${failedTests}/${totalTests}`);
  }
  console.log('======================================================\n');

  process.exit(failedTests > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
