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
  console.log('RUNNING MODULE 6.7 PK ACTIVITY SLOT SYSTEM TESTS');
  console.log(`Target: ${BASE_URL}`);
  console.log('======================================================\n');

  // Test 1: Fetch Active Activities
  console.log('--- Test 1: Query Active PK Activities ---');
  const actRes = await get('/api/pk/activities?status=active');
  check('Activities endpoint returns HTTP 200', actRes.status === 200);
  check('Response reports success: true', actRes.body?.success === true);
  check('Activities returned as array', Array.isArray(actRes.body?.activities));
  check('At least 2 active activities returned', (actRes.body?.activities?.length || 0) >= 2);

  // Test 2: Verify Exact Matches to 06_07_activity_slot.png
  console.log('\n--- Test 2: Match Canonical Reference Design 06_07 ---');
  const daily = actRes.body?.activities?.find((a) => a.id === '00000000-0000-0000-0000-000000000607');
  check('Canonical Daily PK Challenge exists', !!daily);
  if (daily) {
    check('Title is "PK Activity"', daily.title === 'PK Activity');
    check('Subtitle is "Daily PK Challenge"', daily.subtitle === 'Daily PK Challenge');
    check('Description is "Join PK battles and win rewards!"', daily.description === 'Join PK battles and win rewards!');
    check('Target battles is 3', daily.targetBattles === 3);
    check('Reward points is +50 Points', daily.rewardPoints === 50);
    check('Reward coins is +100 Coins', daily.rewardCoins === 100);
    check('Status is active', daily.status === 'active');
    check('Remaining seconds is positive', daily.remainingSeconds > 0);
    check('Countdown is formatted (d/h/m)', !!daily.formattedCountdown);
  }

  // Test 3: Fetch Activity Details with Linked Battles
  console.log('\n--- Test 3: Activity Detail & Linked Battles ---');
  const detailRes = await get('/api/pk/activities/00000000-0000-0000-0000-000000000607');
  check('Activity detail endpoint returns HTTP 200', detailRes.status === 200);
  check('Activity detail reports success: true', detailRes.body?.success === true);
  check('Linked battles returned', Array.isArray(detailRes.body?.linkedBattles));
  if (detailRes.body?.linkedBattles?.length > 0) {
    const linked = detailRes.body.linkedBattles[0];
    check('Linked battle contains host nicknames and scores', !!linked.host_a_nickname && !!linked.host_b_nickname);
  }

  // Test 4: User Progress & Rewards Progression
  console.log('\n--- Test 4: User Battle Progress Tracking ---');
  const progRes = await post('/api/pk/activities/progress', {
    activityId: '00000000-0000-0000-0000-000000000607',
    userId: '00000000-0000-0000-0000-000000088201',
    incrementBy: 1,
  });
  check('Progress update returns HTTP 200', progRes.status === 200);
  check('Completed battles updated', typeof progRes.body?.completedBattles === 'number');
  check('Target battles maintained at 3', progRes.body?.targetBattles === 3);
  check('Progress percentage is between 0 and 100', progRes.body?.progressPercentage >= 0 && progRes.body?.progressPercentage <= 100);

  // Test 5: Activity Status Filtering
  console.log('\n--- Test 5: Activity Status & Type Filtering ---');
  const schedRes = await get('/api/pk/activities?status=scheduled');
  check('Scheduled filter returns HTTP 200', schedRes.status === 200);
  const schedActs = schedRes.body?.activities || [];
  check('Scheduled activities found', schedActs.length > 0);
  if (schedActs.length > 0) {
    check('Scheduled activity has status "scheduled"', schedActs[0].status === 'scheduled');
  }

  const compRes = await get('/api/pk/activities?status=completed');
  check('Completed filter returns HTTP 200', compRes.status === 200);
  const compActs = compRes.body?.activities || [];
  check('Completed activities found', compActs.length > 0);

  // Test 6: Admin Activity Management
  console.log('\n--- Test 6: Admin Management & Audit Logging ---');
  const adminListRes = await get('/api/pk/activities/admin');
  check('Admin list returns HTTP 200', adminListRes.status === 200);
  check('Activities and audit logs returned', Array.isArray(adminListRes.body?.activities) && Array.isArray(adminListRes.body?.auditLogs));

  // Admin pauses activity
  const pauseRes = await post('/api/pk/activities/admin', {
    action: 'update_status',
    activityId: '00000000-0000-0000-0000-000000000608',
    status: 'paused',
    adminId: 'test_admin_01',
  });
  check('Admin pause activity returns HTTP 200', pauseRes.status === 200);
  check('Activity marked as paused', pauseRes.body?.newStatus === 'paused');

  // Admin reactivates activity
  const resumeRes = await post('/api/pk/activities/admin', {
    action: 'update_status',
    activityId: '00000000-0000-0000-0000-000000000608',
    status: 'active',
    adminId: 'test_admin_01',
  });
  check('Admin reactivate activity returns HTTP 200', resumeRes.status === 200);
  check('Activity restored to active', resumeRes.body?.newStatus === 'active');

  // Admin creates new campaign activity
  const createRes = await post('/api/pk/activities/admin', {
    action: 'create',
    title: 'Automated Test Championship',
    subtitle: 'Seasonal PK Gauntlet',
    description: 'Join test tournament for rewards',
    activityType: 'challenge',
    targetBattles: 3,
    rewardPoints: 75,
    rewardCoins: 150,
    status: 'active',
    adminId: 'test_admin_01',
  });
  check('Admin create activity returns HTTP 200', createRes.status === 200);
  check('New activity created with ID', !!createRes.body?.activity?.id);

  // Test 7: Web Pages Accessibility & Discovery Integration
  console.log('\n--- Test 7: Web Pages & Discovery Integration ---');
  const slotPageRes = await get('/pk/activity-slot');
  check('Route /pk/activity-slot returns HTTP 200', slotPageRes.status === 200);

  const detailPageRes = await get('/pk/activity/00000000-0000-0000-0000-000000000607');
  check('Route /pk/activity/[id] returns HTTP 200', detailPageRes.status === 200);

  const pkDiscoveryRes = await get('/pk');
  check('PK Discovery route /pk returns HTTP 200', pkDiscoveryRes.status === 200);

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
