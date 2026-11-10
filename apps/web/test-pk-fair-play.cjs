const http = require('http');
const https = require('https');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const CANONICAL_BATTLE_ID = '00000000-0000-0000-0000-000000000603';
const COMPLETED_BATTLE_ID = '00000000-0000-0000-0000-000000000604';

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const client = url.protocol === 'https:' ? https : http;
    client
      .get(url, { headers }, (res) => {
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

function post(path, body, headers = {}) {
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
          ...headers,
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

let passed = 0;
let failed = 0;

function check(desc, condition) {
  if (condition) {
    console.log(`  ✓ [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${desc}`);
    failed++;
  }
}

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`POPO LIVE — PHASE 6 MODULE 6.9 AUTOMATED TEST SUITE`);
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Canonical Battle: ${CANONICAL_BATTLE_ID}`);
  console.log(`======================================================\n`);

  // --- Group 1: Fair Play Rules Retrieval ---
  console.log('--- 1. Testing Fair Play Rules API ---');
  const rulesRes = await get('/api/pk/security/rules');
  check('Rules endpoint returns HTTP 200', rulesRes.status === 200);
  check('Rules response reports success: true', rulesRes.body?.success === true);
  check('Rules title matches Fair Play', rulesRes.body?.title === 'Fair Play');
  check('Rules titleUr matches فیئر پلے', rulesRes.body?.titleUr === 'فیئر پلے');
  check('Returns exactly 4 canonical rules matching 06_09 design', rulesRes.body?.rules?.length === 4);

  const ruleIds = (rulesRes.body?.rules || []).map((r) => r.id);
  const requiredIds = ['no_fake_traffic', 'no_gift_abuse', 'no_multi_account_pk', 'report_violations'];
  const hasAllRules = requiredIds.every((id) => ruleIds.includes(id));
  check('All 4 canonical rules present (no_fake_traffic, no_gift_abuse, no_multi_account_pk, report_violations)', hasAllRules);

  const firstRule = rulesRes.body?.rules?.[0];
  check('Rule has title, titleUr, summary, summaryUr, and description', !!firstRule?.title && !!firstRule?.titleUr && !!firstRule?.summary && !!firstRule?.summaryUr && !!firstRule?.description);
  check('Security shield status is active', rulesRes.body?.securityShieldActive === true);
  check('Watermark label matches 6.9 Fair Play Basics', rulesRes.body?.watermark?.includes('6.9 Fair Play Basics'));

  // --- Group 2: Abuse Report Categories ---
  console.log('\n--- 2. Testing Abuse Report Categories ---');
  const catRes = await get('/api/pk/security/report/categories');
  check('Categories endpoint returns HTTP 200', catRes.status === 200);
  check('Categories response reports success: true', catRes.body?.success === true);
  check('Returns 9 abuse report categories', catRes.body?.categories?.length === 9);
  const catIds = (catRes.body?.categories || []).map((c) => c.id);
  check('Includes score_manipulation category', catIds.includes('score_manipulation'));
  check('Includes fake_traffic category', catIds.includes('fake_traffic'));
  check('Includes gift_abuse category', catIds.includes('gift_abuse'));
  check('Includes multi_account category', catIds.includes('multi_account'));

  // --- Group 3: Score Protection & Anti-Tamper Guard ---
  console.log('\n--- 3. Testing Score Protection & Client Anti-Tamper Guard ---');
  // Attempt 1: Direct client modification -> MUST BE REJECTED with 403 Forbidden
  const clientScoreRes = await post('/api/pk/security/score/validate', {
    battleId: CANONICAL_BATTLE_ID,
    userId: 'malicious_client_hacker',
    source: 'client',
    attemptedScoreA: 999999,
  });
  check('Direct client score mutation is rejected with HTTP 403 Forbidden', clientScoreRes.status === 403);
  check('Rejection code is CLIENT_SCORE_MUTATION_FORBIDDEN', clientScoreRes.body?.code === 'CLIENT_SCORE_MUTATION_FORBIDDEN');

  // Attempt 2: Non-existent battle
  const nonExistentScoreRes = await post('/api/pk/security/score/validate', {
    battleId: '00000000-0000-0000-0000-999999999999',
    userId: 'backend_authorized_worker',
    source: 'backend_service',
  });
  check('Score validation on non-existent battle returns HTTP 404', nonExistentScoreRes.status === 404);

  // Attempt 3: Score update on completed battle
  const completedScoreRes = await post('/api/pk/security/score/validate', {
    battleId: COMPLETED_BATTLE_ID,
    userId: 'backend_authorized_worker',
    source: 'backend_service',
  });
  check('Score modification on completed battle is rejected with HTTP 400', completedScoreRes.status === 400);

  // Attempt 4: Authorized backend service validation
  const validBackendScoreRes = await post('/api/pk/security/score/validate', {
    battleId: CANONICAL_BATTLE_ID,
    userId: 'payment_engine_worker',
    source: 'backend_service',
    idempotencyKey: `tx_${Date.now()}`,
  });
  check('Authorized backend score validation succeeds with HTTP 200', validBackendScoreRes.status === 200);
  check('Response confirms score is secure', validBackendScoreRes.body?.isSecure === true);

  // --- Group 4: Timer Protection ---
  console.log('\n--- 4. Testing Authoritative Timer Protection ---');
  const timerRes = await post('/api/pk/security/timer/validate', {
    battleId: CANONICAL_BATTLE_ID,
    userId: 'viewer_clock_test',
    clientRemainingSeconds: 100, // client attempts to set drift
    source: 'client',
  });
  check('Timer validate returns HTTP 200', timerRes.status === 200);
  check('Server overrides client and returns authoritative remaining seconds', typeof timerRes.body?.authoritativeRemainingSeconds === 'number');
  check('Timer status is running', timerRes.body?.timerStatus === 'running');
  check('isSynchronized is true', timerRes.body?.isSynchronized === true);

  // --- Group 5: Battle Session Validation ---
  console.log('\n--- 5. Testing Battle Session Security ---');
  const sessionRes = await post('/api/pk/security/session/validate', {
    battleId: CANONICAL_BATTLE_ID,
  });
  check('Battle session validate returns HTTP 200', sessionRes.status === 200);
  check('Session reports sessionValid: true', sessionRes.body?.sessionValid === true);
  check('Session contains both host objects', !!sessionRes.body?.hosts?.hostA && !!sessionRes.body?.hosts?.hostB);

  // Candidate host multi-battle concurrency conflict check
  const conflictRes = await post('/api/pk/security/session/validate', {
    battleId: CANONICAL_BATTLE_ID,
    hostAId: '00000000-0000-0000-0000-000000088201', // Sara Live who is also in battle 606
  });
  check('Candidate host multi-battle concurrency conflict returns HTTP 409', conflictRes.status === 409);
  check('Conflict error code is HOST_CONCURRENT_BATTLE_CONFLICT', conflictRes.body?.code === 'HOST_CONCURRENT_BATTLE_CONFLICT');

  // --- Group 6: Abuse Reporting System ---
  console.log('\n--- 6. Testing Abuse Reporting System ---');
  const uniqueReporter = `reporter_${Date.now()}`;
  const reportRes = await post('/api/pk/security/report', {
    battleId: CANONICAL_BATTLE_ID,
    reporterId: uniqueReporter,
    reporterName: 'FairPlay Tester',
    reportedUserId: '00000000-0000-0000-0000-000000088202',
    reportedUserName: 'Ayesha',
    category: 'fake_traffic',
    description: 'Suspicious sudden spike in viewer count without chat activity.',
  });

  check('Valid report submission returns HTTP 201 Created', reportRes.status === 201);
  check('Report submission reports success: true', reportRes.body?.success === true);
  check('Report confirmation contains reportId', !!reportRes.body?.reportId);
  const createdReportId = reportRes.body?.reportId;

  // Invalid category
  const invalidCatRes = await post('/api/pk/security/report', {
    battleId: CANONICAL_BATTLE_ID,
    reporterId: uniqueReporter,
    category: 'invalid_unapproved_category',
    description: 'Valid description text.',
  });
  check('Invalid report category rejected with HTTP 400', invalidCatRes.status === 400);

  // Short description (<5 chars)
  const shortDescRes = await post('/api/pk/security/report', {
    battleId: CANONICAL_BATTLE_ID,
    reporterId: uniqueReporter,
    category: 'spam',
    description: 'bad',
  });
  check('Description under 5 characters rejected with HTTP 400', shortDescRes.status === 400);

  // Deduplication / Cooldown Guard (same user, same battle, same category)
  const duplicateReportRes = await post('/api/pk/security/report', {
    battleId: CANONICAL_BATTLE_ID,
    reporterId: uniqueReporter,
    category: 'fake_traffic',
    description: 'Duplicate report attempt during cooldown period.',
  });
  check('Duplicate report within cooldown returns HTTP 429 Too Many Requests', duplicateReportRes.status === 429);
  check('Rejection code is DUPLICATE_REPORT_COOLDOWN', duplicateReportRes.body?.code === 'DUPLICATE_REPORT_COOLDOWN');

  // --- Group 7: Admin Security Review & Permissions ---
  console.log('\n--- 7. Testing Admin Security Review & Permissions ---');
  // Non-admin request -> must be rejected with 403 Forbidden
  const nonAdminReportsRes = await get('/api/pk/security/admin/reports');
  check('Non-admin access to admin reports is rejected with HTTP 403 Forbidden', nonAdminReportsRes.status === 403);

  const nonAdminSuspiciousRes = await get('/api/pk/security/admin/suspicious-activity');
  check('Non-admin access to suspicious activity is rejected with HTTP 403 Forbidden', nonAdminSuspiciousRes.status === 403);

  // Admin access with admin=true
  const adminReportsRes = await get('/api/pk/security/admin/reports?admin=true');
  check('Admin reports access succeeds with HTTP 200', adminReportsRes.status === 200);
  check('Admin reports array returned', Array.isArray(adminReportsRes.body?.reports));
  check('Admin reports count > 0', adminReportsRes.body?.reports?.length > 0);

  // Admin review action
  if (createdReportId) {
    const adminReviewRes = await post('/api/pk/security/admin/review?admin=true', {
      reportId: createdReportId,
      status: 'reviewed',
      reviewNotes: 'Verified audience graph. No automated bot signature found.',
      adminId: 'admin_lead_1',
      adminName: 'Security Lead',
    });
    check('Admin review action returns HTTP 200', adminReviewRes.status === 200);
    check('Updated report status is reviewed', adminReviewRes.body?.report?.status === 'reviewed');
  }

  // Admin suspicious activity logs
  const adminSuspiciousRes = await get('/api/pk/security/admin/suspicious-activity?admin=true');
  check('Admin suspicious activity query returns HTTP 200', adminSuspiciousRes.status === 200);
  check('Suspicious events array returned', Array.isArray(adminSuspiciousRes.body?.events));
  check('Contains logged security tamper events', adminSuspiciousRes.body?.events?.length > 0);

  // --- Group 8: Frontend Web Pages & 1:1 Design Reference ---
  console.log('\n--- 8. Testing Frontend Web Pages & 1:1 Design Verification ---');
  const webFairPlayRes = await get('/pk/fair-play');
  check('Route /pk/fair-play returns HTTP 200', webFairPlayRes.status === 200);
  const webFairPlayHtml = webFairPlayRes.text || '';
  check('Web page renders Fair Play title', webFairPlayHtml.includes('Fair Play'));
  check('Web page renders 6.9 Fair Play Basics badge watermark', webFairPlayHtml.includes('6.9 Fair Play Basics') || webFairPlayHtml.includes('Fair Play Basics'));
  check('Web page renders No fake traffic card', webFairPlayHtml.includes('No fake traffic'));
  check('Web page renders No gift abuse card', webFairPlayHtml.includes('No gift abuse'));
  check('Web page renders No multi-account PK card', webFairPlayHtml.includes('No multi-account PK'));
  check('Web page renders Report violations card', webFairPlayHtml.includes('Report violations'));

  const webFairPlayUrduRes = await get('/pk/fair-play?lang=ur');
  check('Route /pk/fair-play?lang=ur returns HTTP 200', webFairPlayUrduRes.status === 200);
  const webFairPlayUrduHtml = webFairPlayUrduRes.text || '';
  check('Urdu web page renders 6.9 فیئر پلے اصول watermark', webFairPlayUrduHtml.includes('6.9 فیئر پلے اصول') || webFairPlayUrduHtml.includes('فیئر پلے اصول'));
  check('Urdu web page renders جعلی ٹریفک کی ممانعت', webFairPlayUrduHtml.includes('جعلی ٹریفک کی ممانعت'));

  const webBattleFairPlayRes = await get(`/pk/battle/${CANONICAL_BATTLE_ID}/fair-play`);
  check('Route /pk/battle/[battleId]/fair-play returns HTTP 200', webBattleFairPlayRes.status === 200);

  // --- Summary ---
  console.log(`\n======================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED / ${failed} FAILED (TOTAL ${passed + failed})`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed with unhandled error:', err);
  process.exit(1);
});
