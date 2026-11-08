const http = require('http');
const { Client } = require('pg');

const BASE_URL = 'http://localhost:3000';
const DB_URL = 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?sslmode=disable';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url || (BASE_URL + options.path));
    const reqOptions = {
      method: options.method || 'GET',
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      if (typeof body === 'string') {
        req.write(body);
      } else if (Buffer.isBuffer(body)) {
        req.write(body);
      } else {
        req.setHeader('Content-Type', 'application/json');
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(message);
  } else {
    console.log(`✅ [PASS] ${message}`);
  }
}

async function runTests() {
  console.log('=======================================================');
  console.log('🧪 RUNNING POPO LIVE PHASE 2 PROMPT 10 TEST SUITE');
  console.log('   Complete Account Closure and Deletion Request System');
  console.log('=======================================================\n');

  // Step 1: Connect to DB and set up test user
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  const testEmail = 'closure_test_user@example.com';
  const testPassword = 'PasswordClosure123!';
  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash(testPassword, 10);
  const testPoppoId = '99001122';

  // Clean up any existing test user & related records
  await client.query('SET search_path TO popolive, public');
  await client.query(`DELETE FROM popolive.users WHERE email = $1 OR poppo_id = $2`, [testEmail, testPoppoId]);

  const insertUserRes = await client.query(
    `INSERT INTO popolive.users (
      email, nickname, password_hash, poppo_id, status, is_profile_completed,
      gender, country, country_code, birthdate, bio
    ) VALUES (
      $1, 'Ayla Malik', $2, $3, 'active', true,
      'female', 'Pakistan', 'PK', '1998-05-14', 'Singer, Host, Creator'
    ) RETURNING id`,
    [testEmail, passwordHash, testPoppoId]
  );
  const testUserId = insertUserRes.rows[0].id;
  console.log(`👤 Created test closure user: ${testUserId} (Poppo ID: ${testPoppoId})`);

  // Step 2: Accept Terms to get consent cookie
  const consentRes = await request(
    { path: '/api/consent', method: 'POST' },
    {
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'closure_test_' + Date.now(),
    }
  );
  assert(consentRes.statusCode === 200, 'Accept terms to obtain consent cookie');
  const consentCookie = (consentRes.headers['set-cookie'] || [])
    .map(c => c.split(';')[0])
    .find(c => c.startsWith('poppo_terms_consent='));
  assert(!!consentCookie, 'Consent cookie found');

  // Step 3: Login as test user to get session cookie
  const loginRes = await request(
    {
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': consentCookie,
      },
    },
    { email: testEmail, password: testPassword }
  );
  assert(loginRes.statusCode === 200, 'Test user login successful');
  const sessionCookie = (loginRes.headers['set-cookie'] || [])
    .map(c => c.split(';')[0])
    .find(c => c.startsWith('poppo_session='));
  assert(!!sessionCookie, 'Session cookie found');

  const authCookies = `${consentCookie}; ${sessionCookie}`;

  // Step 4: Test unauthenticated access to closure status -> 401
  const unauthRes = await request({ path: '/api/account/closure/status', method: 'GET' });
  assert(unauthRes.statusCode === 401, 'Unauthenticated status request returns 401');

  // Step 5: Test initial status -> no active request
  const initialStatusRes = await request({
    path: '/api/account/closure/status',
    method: 'GET',
    headers: { 'Cookie': authCookies },
  });
  assert(initialStatusRes.statusCode === 200, 'Initial status returns 200');
  assert(initialStatusRes.json?.hasRequest === false, 'Initial state hasRequest is false');

  // Step 6: Test identity verification endpoint POST /api/account/closure/verify
  const badVerifyRes = await request(
    {
      path: '/api/account/closure/verify',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookies },
    },
    { password: 'WrongPassword999!' }
  );
  assert(badVerifyRes.statusCode === 400, 'Verify rejects incorrect password');

  const goodVerifyRes = await request(
    {
      path: '/api/account/closure/verify',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookies },
    },
    { password: testPassword }
  );
  assert(goodVerifyRes.statusCode === 200, 'Verify succeeds with correct password');
  assert(goodVerifyRes.json?.verified === true, 'Verification returns verified: true');

  // Step 7: Test closure request validation errors
  const noAckRes = await request(
    {
      path: '/api/account/closure/request',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookies },
    },
    { reason: 'no_longer_use', password: testPassword, confirmationAcknowledged: false }
  );
  assert(noAckRes.statusCode === 400, 'Closure request without acknowledgment returns 400');

  const badReasonRes = await request(
    {
      path: '/api/account/closure/request',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookies },
    },
    { reason: 'invalid_reason_code', password: testPassword, confirmationAcknowledged: true }
  );
  assert(badReasonRes.statusCode === 400, 'Closure request with invalid reason returns 400');

  const wrongPassRes = await request(
    {
      path: '/api/account/closure/request',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookies },
    },
    { reason: 'no_longer_use', password: 'WrongPassword!', confirmationAcknowledged: true }
  );
  assert(wrongPassRes.statusCode === 400, 'Closure request with wrong password returns 400');

  // Step 8: Submit valid closure request
  const submitRes = await request(
    {
      path: '/api/account/closure/request',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookies },
    },
    {
      reason: 'no_longer_use',
      additionalExplanation: 'Switching to another platform temporarily.',
      confirmationAcknowledged: true,
      password: testPassword,
    }
  );
  assert(submitRes.statusCode === 200, 'Valid closure request submitted with 200');
  assert(submitRes.json?.success === true, 'Response contains success: true');
  assert(typeof submitRes.json?.requestNumber === 'string', 'Generated requestNumber is string');
  assert(submitRes.json?.requestNumber.startsWith('CR-'), `requestNumber starts with CR-: ${submitRes.json?.requestNumber}`);
  assert(submitRes.json?.status === 'pending', 'Status is pending');
  const requestNumber = submitRes.json?.requestNumber;

  // Step 9: Test duplicate closure request prevention (409 Conflict)
  const dupRes = await request(
    {
      path: '/api/account/closure/request',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookies },
    },
    {
      reason: 'privacy_concerns',
      confirmationAcknowledged: true,
      password: testPassword,
    }
  );
  assert(dupRes.statusCode === 409, 'Duplicate closure request returns 409 Conflict');

  // Step 10: Test closure status endpoint GET /api/account/closure/status
  const statusRes = await request({
    path: '/api/account/closure/status',
    method: 'GET',
    headers: { 'Cookie': authCookies },
  });
  assert(statusRes.statusCode === 200, 'Closure status returns 200');
  assert(statusRes.json?.hasRequest === true, 'hasRequest is true');
  assert(statusRes.json?.request?.requestNumber === requestNumber, 'requestNumber matches');
  assert(statusRes.json?.request?.status === 'pending', 'Request status is pending');
  assert(statusRes.json?.request?.canCancel === true, 'canCancel is true for pending request');
  assert(!!statusRes.json?.request?.statusDescription?.en, 'Status description (en) provided');
  assert(!!statusRes.json?.request?.statusDescription?.ur, 'Status description (ur) provided');

  // Step 11: Test closure history and audit log GET /api/account/closure/history
  const histRes = await request({
    path: '/api/account/closure/history',
    method: 'GET',
    headers: { 'Cookie': authCookies },
  });
  assert(histRes.statusCode === 200, 'Closure history returns 200');
  assert(Array.isArray(histRes.json?.requests) && histRes.json.requests.length >= 1, 'Requests history returned');
  assert(Array.isArray(histRes.json?.auditLog) && histRes.json.auditLog.length >= 1, 'Audit log returned');
  const auditEntry = histRes.json.auditLog[0];
  assert(auditEntry.action === 'request_submitted', `Audit record action is request_submitted: ${auditEntry.action}`);

  // Step 12: Test cancelling closure request POST /api/account/closure/cancel
  const cancelRes = await request({
    path: '/api/account/closure/cancel',
    method: 'POST',
    headers: { 'Cookie': authCookies },
  });
  assert(cancelRes.statusCode === 200, 'Cancel closure request returns 200');
  assert(cancelRes.json?.success === true, 'Cancel response contains success: true');
  assert(cancelRes.json?.status === 'cancelled', 'Status changed to cancelled');

  // Step 13: Test status after cancellation
  const afterCancelStatusRes = await request({
    path: '/api/account/closure/status',
    method: 'GET',
    headers: { 'Cookie': authCookies },
  });
  assert(afterCancelStatusRes.statusCode === 200, 'Status after cancellation returns 200');
  assert(afterCancelStatusRes.json?.request?.status === 'cancelled', 'Status is cancelled');
  assert(afterCancelStatusRes.json?.request?.canCancel === false, 'canCancel is now false');

  // Step 14: Test cancelling when no pending request exists -> 400
  const secondCancelRes = await request({
    path: '/api/account/closure/cancel',
    method: 'POST',
    headers: { 'Cookie': authCookies },
  });
  assert(secondCancelRes.statusCode === 400, 'Second cancel returns 400 (no pending request)');

  // Step 15: Test Frontend Pages load (status 200)
  const pageCloseRes = await request({
    path: '/account/close',
    method: 'GET',
    headers: { 'Cookie': authCookies },
  });
  assert(pageCloseRes.statusCode === 200, 'GET /account/close returns 200 HTML');
  assert(pageCloseRes.headers['content-type']?.includes('text/html'), 'GET /account/close returns text/html');

  const pageStatusRes = await request({
    path: '/account/close/status',
    method: 'GET',
    headers: { 'Cookie': authCookies },
  });
  assert(pageStatusRes.statusCode === 200, 'GET /account/close/status returns 200 HTML');
  assert(pageStatusRes.headers['content-type']?.includes('text/html'), 'GET /account/close/status returns text/html');

  // Step 16: Verify DB audit trail records
  const dbAudits = await client.query(
    `SELECT action, previous_status, new_status FROM popolive.closure_audit_records WHERE user_id = $1 ORDER BY action_date ASC`,
    [testUserId]
  );
  assert(dbAudits.rows.length >= 2, `DB audit records recorded: ${dbAudits.rows.length}`);
  assert(dbAudits.rows[0].action === 'request_submitted', 'DB has request_submitted audit');
  assert(dbAudits.rows[1].action === 'request_cancelled', 'DB has request_cancelled audit');

  // Clean up test records
  await client.query(`DELETE FROM popolive.users WHERE id = $1`, [testUserId]);
  await client.end();

  console.log('\n=======================================================');
  console.log('🎉 ALL 22 ACCOUNT CLOSURE SYSTEM TESTS PASSED SUCCESSFULLY!');
  console.log('=======================================================');
}

runTests().catch((err) => {
  console.error('\n💥 TEST RUNNER FAILED:', err);
  process.exit(1);
});
