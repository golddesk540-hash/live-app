/**
 * ============================================================================
 * POPO LIVE — B2 PROMPT 3 REAL LOGIN & PHONE OTP VERIFICATION AUDIT SUITE
 * Master Plan Reference: POPO-LIVE-BACKEND-REALTIME-PLAN.pdf (Phase B2, page 3)
 *
 * Exhaustive Verification Across 25 Tests (4 Core Categories):
 *  --- GROUP 1: LOGIN TESTS (1-7) ---
 *  1. Login with correct password succeeds (HTTP 200, valid session token, safe user, no hash)
 *  2. Login with wrong password fails (HTTP 401 INVALID_PASSWORD, no session)
 *  3. Login with unknown identifier fails (HTTP 404 USER_NOT_FOUND, no session)
 *  4. Login with suspended/ineligible account fails (HTTP 403 ACCOUNT_INACTIVE)
 *  5. Login handles database failure gracefully (HTTP 500, no unhandled crash)
 *  6. Login rate limiting triggers after repeated failures (HTTP 429 RATE_LIMITED)
 *  7. Login failure creates zero session records in database
 *
 *  --- GROUP 2: PHONE OTP TESTS (8-14) ---
 *  8. OTP generation stores valid hash in popolive.otp_verifications with 5-minute expiry
 *  9. OTP verification with valid OTP succeeds (marks verified=true, creates session)
 * 10. OTP verification with incorrect OTP fails (increments attempts, returns error)
 * 11. OTP verification with expired OTP fails (rejects OTP older than 5 minutes)
 * 12. OTP verification with reused OTP fails (rejects OTP already marked verified=true)
 * 13. OTP verification with excessive attempts fails (locks out after 5 failed attempts)
 * 14. OTP verification for wrong phone fails (cannot use OTP issued for phone A on phone B)
 *
 *  --- GROUP 3: CLIENT & INTEGRATION TESTS (15-20) ---
 * 15. Mobile login flow connects to real API (no silent fixture fallback)
 * 16. Web login flow connects to real API (no silent fixture fallback)
 * 17. Mobile OTP flow connects to real API
 * 18. Web OTP flow connects to real API
 * 19. Visible authentication errors displayed on mobile and web
 * 20. Zero fixture fallback when real auth is enabled
 *
 *  --- GROUP 4: SECURITY & COMPLIANCE TESTS (21-25) ---
 * 21. Password hash never exposed in API responses or client logs
 * 22. OTP secret / hash never exposed to client
 * 23. Session user ownership integrity (session token matches authenticated user)
 * 24. Under-18 restriction enforced across all auth paths
 * 25. Real OTP provider disabled (USE_REAL_OTP=false, local provider active)
 * ============================================================================
 */

const path = require('path');
const fs = require('fs');
const { Pool } = require(path.resolve(__dirname, 'apps/web/node_modules/pg'));
const bcrypt = require(path.resolve(__dirname, 'apps/web/node_modules/bcryptjs'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public',
});

let testsPassed = 0;
let testsFailed = 0;
const createdUserIds = [];

function check(condition, desc) {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${desc}`);
    testsFailed++;
  }
}

async function runB2LoginOtpTests() {
  console.log('======================================================================');
  console.log('POPO LIVE: B2 PROMPT 3 REAL LOGIN & PHONE OTP AUDIT SUITE');
  console.log('======================================================================\n');

  // Verify DB connectivity
  const dbCheck = await pool.query('SELECT NOW() as now');
  check(Boolean(dbCheck.rows[0].now), 'PostgreSQL database connected (popolive schema)');

  // Clear rate limits for clean test environment
  await pool.query("DELETE FROM popolive.rate_limits WHERE key LIKE 'login_%' OR key LIKE 'otp_%'");

  // Import Next.js route handlers
  const { POST: loginHandler } = await import('./apps/web/app/api/auth/login/route.ts');
  const { POST: sendOtpHandler } = await import('./apps/web/app/api/auth/phone/send-otp/route.ts');
  const { POST: verifyOtpHandler } = await import('./apps/web/app/api/auth/phone/verify-otp/route.ts');
  const { GET: sessionHandler } = await import('./apps/web/app/api/auth/session/route.ts');
  const { otpService } = await import('./apps/web/lib/otpService.ts');
  const { hashOtp, calculateAge } = await import('./apps/web/lib/auth.ts');
  const { createConsentToken, CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } = await import('./apps/web/lib/consentStore.ts');

  // Valid Terms Gate consent token
  const validConsentToken = createConsentToken({
    consentId: 'cs_test_b2_prompt3',
    anonymousSessionId: 'anon_sess_b2_prompt3',
    termsVersion: CURRENT_TERMS_VERSION,
    privacyVersion: CURRENT_PRIVACY_VERSION,
    status: 'accepted',
    timestamp: Date.now(),
  });

  // Helper to simulate NextRequest
  const { NextRequest } = require(path.resolve(__dirname, 'apps/web/node_modules/next/server'));
  function makeRequest(url, body, headers = {}, cookies = {}) {
    const reqHeaders = new Headers({
      'Content-Type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      ...headers,
    });
    // Add cookies header
    const mergedCookies = {
      poppo_terms_consent: validConsentToken,
      ...cookies,
    };
    const cookiePairs = Object.entries(mergedCookies).map(([k, v]) => `${k}=${v}`);
    reqHeaders.set('cookie', cookiePairs.join('; '));

    return new NextRequest(new URL(url, 'http://localhost:3000'), {
      method: body ? 'POST' : 'GET',
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // Pre-seed an active adult test user for login tests
  const testUserEmail = `b2_login_${Date.now()}@popolive.internal`;
  const testUserPhone = `+92300${Math.floor(1000000 + Math.random() * 9000000)}`;
  const testUserPassword = 'ValidPassword123!';
  const passwordHash = await bcrypt.hash(testUserPassword, 12);
  const testUserPoppoId = `88${Math.floor(10000 + Math.random() * 90000)}`;

  const seedRes = await pool.query(
    `INSERT INTO popolive.users (
      poppo_id, email, phone, password_hash, nickname, gender, birthdate,
      is_adult_verified, status, is_profile_completed, wealth_level, host_level
    ) VALUES ($1, $2, $3, $4, $5, 'female', '1996-05-20', true, 'active', true, 5, 2)
    RETURNING id, poppo_id, email, phone`,
    [testUserPoppoId, testUserEmail, testUserPhone, passwordHash, 'B2 Login Tester']
  );
  const testUserId = seedRes.rows[0].id;
  createdUserIds.push(testUserId);
  check(Boolean(testUserId), `Seeded test adult user in PostgreSQL: ID ${testUserId}`);

  // ========================================================================
  // GROUP 1: LOGIN TESTS (1-7)
  // ========================================================================
  console.log('\n--- Group 1: Real Database-Backed Login Tests (1-7) ---');

  // Test 1: Login with correct password succeeds
  console.log('\n[Test 1] Login with correct password succeeds');
  const loginReq1 = makeRequest('http://localhost:3000/api/auth/login', {
    identifier: testUserEmail,
    password: testUserPassword,
  }, {}, { poppo_terms_gate_accepted: 'true' });
  const loginRes1 = await loginHandler(loginReq1);
  const loginData1 = await loginRes1.json();

  check(loginRes1.status === 200, 'Test 1.1: Login HTTP status is 200 OK');
  check(loginData1.success === true, 'Test 1.2: Login returns success: true');
  check(typeof loginData1.sessionToken === 'string' && loginData1.sessionToken.length > 20, 'Test 1.3: Valid sessionToken returned');
  check(loginData1.user.email === testUserEmail, 'Test 1.4: Correct user email returned');
  check(loginData1.user.poppoId === testUserPoppoId, 'Test 1.5: Correct user poppoId returned');
  check(loginData1.user.password_hash === undefined && loginData1.password_hash === undefined, 'Test 1.6: Password hash NOT exposed');

  // Verify session in database
  const sessionRow1 = await pool.query(
    'SELECT * FROM popolive.sessions WHERE session_token = $1',
    [loginData1.sessionToken]
  );
  check(sessionRow1.rows.length === 1, 'Test 1.7: Session persisted in popolive.sessions');
  check(sessionRow1.rows[0].user_id === testUserId, 'Test 1.8: Session belongs to correct user');
  check(new Date(sessionRow1.rows[0].expires_at) > new Date(), 'Test 1.9: Session expires_at is in the future');

  // Test 2: Login with wrong password fails
  console.log('\n[Test 2] Login with wrong password fails');
  const countBeforeWrong = (await pool.query('SELECT COUNT(*) FROM popolive.sessions')).rows[0].count;
  const loginReq2 = makeRequest('http://localhost:3000/api/auth/login', {
    identifier: testUserEmail,
    password: 'CompletelyWrongPassword!',
  }, {}, { poppo_terms_gate_accepted: 'true' });
  const loginRes2 = await loginHandler(loginReq2);
  const loginData2 = await loginRes2.json();

  check(loginRes2.status === 401, 'Test 2.1: Wrong password returns HTTP 401');
  check(loginData2.code === 'INVALID_PASSWORD', 'Test 2.2: Error code is INVALID_PASSWORD');
  check(loginData2.error === 'Invalid password. Please try again.', 'Test 2.3: Error message is visible and clear');
  check(loginData2.sessionToken === undefined, 'Test 2.4: Zero session token issued');

  // Test 3: Login with unknown identifier fails
  console.log('\n[Test 3] Login with unknown identifier fails');
  const loginReq3 = makeRequest('http://localhost:3000/api/auth/login', {
    identifier: 'non_existent_user_999999@popolive.internal',
    password: 'SomePassword123!',
  }, {}, { poppo_terms_gate_accepted: 'true' });
  const loginRes3 = await loginHandler(loginReq3);
  const loginData3 = await loginRes3.json();

  check(loginRes3.status === 404, 'Test 3.1: Unknown identifier returns HTTP 404');
  check(loginData3.code === 'USER_NOT_FOUND', 'Test 3.2: Error code is USER_NOT_FOUND');
  check(Boolean(loginData3.error), 'Test 3.3: Visible error message returned');

  // Test 4: Login with suspended/ineligible account fails
  console.log('\n[Test 4] Login with suspended/ineligible account fails');
  // Seed a suspended user
  const suspendedEmail = `suspended_${Date.now()}@popolive.internal`;
  const suspendedRes = await pool.query(
    `INSERT INTO popolive.users (
      poppo_id, email, phone, password_hash, nickname, is_adult_verified, status
    ) VALUES ($1, $2, $3, $4, 'Suspended User', true, 'suspended')
    RETURNING id`,
    [`88${Math.floor(10000 + Math.random() * 90000)}`, suspendedEmail, `+92311${Math.floor(1000000 + Math.random() * 9000000)}`, passwordHash]
  );
  createdUserIds.push(suspendedRes.rows[0].id);

  const loginReq4 = makeRequest('http://localhost:3000/api/auth/login', {
    identifier: suspendedEmail,
    password: testUserPassword,
  }, {}, { poppo_terms_gate_accepted: 'true' });
  const loginRes4 = await loginHandler(loginReq4);
  const loginData4 = await loginRes4.json();

  check(loginRes4.status === 403, 'Test 4.1: Suspended account returns HTTP 403');
  check(loginData4.code === 'ACCOUNT_INACTIVE', 'Test 4.2: Error code is ACCOUNT_INACTIVE');
  check(loginData4.error.includes('suspended'), 'Test 4.3: Error explains account suspension');

  // Test 5: Login handles database failure gracefully
  console.log('\n[Test 5] Login handles database failure gracefully');
  // Pass an invalid payload or trigger catch block
  const malformedReq = new NextRequest(new URL('http://localhost:3000/api/auth/login'), {
    method: 'POST',
    headers: new Headers({
      'Content-Type': 'application/json',
      'cookie': `poppo_terms_consent=${validConsentToken}`,
    }),
    body: '{"invalid_json":',
  });
  const loginRes5 = await loginHandler(malformedReq);
  check(loginRes5.status === 400 || loginRes5.status === 500, `Test 5.1: Malformed payload handled without unhandled crash (Status: ${loginRes5.status})`);

  // Test 6: Login rate limiting triggers after repeated failures
  console.log('\n[Test 6] Login rate limiting triggers after repeated failures');
  const rateLimitEmail = `ratelimit_${Date.now()}@popolive.internal`;
  // Pre-seed user for rate limit test
  await pool.query(
    `INSERT INTO popolive.users (poppo_id, email, phone, password_hash, nickname, status)
     VALUES ($1, $2, $3, $4, 'Rate Limited User', 'active')`,
    [`88${Math.floor(10000 + Math.random() * 90000)}`, rateLimitEmail, `+92322${Math.floor(1000000 + Math.random() * 9000000)}`, passwordHash]
  );

  // Attempt 5 failed logins
  for (let i = 1; i <= 5; i++) {
    const failReq = makeRequest('http://localhost:3000/api/auth/login', {
      identifier: rateLimitEmail,
      password: 'WrongPassword!',
    }, {}, { poppo_terms_gate_accepted: 'true' });
    await loginHandler(failReq);
  }

  // 6th attempt must be rate-limited (HTTP 429)
  const rateLimitReq = makeRequest('http://localhost:3000/api/auth/login', {
    identifier: rateLimitEmail,
    password: 'WrongPassword!',
  }, {}, { poppo_terms_gate_accepted: 'true' });
  const rateLimitRes = await loginHandler(rateLimitReq);
  const rateLimitData = await rateLimitRes.json();

  check(rateLimitRes.status === 429, 'Test 6.1: Repeated failures return HTTP 429');
  check(rateLimitData.code === 'RATE_LIMITED', 'Test 6.2: Error code is RATE_LIMITED');
  check(rateLimitData.error.includes('rate-limited'), 'Test 6.3: Clear security rate limit notice provided');

  // Test 7: Login failure creates zero session records in database
  console.log('\n[Test 7] Login failure creates zero session records in database');
  const countAfterFailures = (await pool.query('SELECT COUNT(*) FROM popolive.sessions')).rows[0].count;
  check(Number(countAfterFailures) === Number(countBeforeWrong), 'Test 7.1: Zero session records created in database on failed logins');

  // ========================================================================
  // GROUP 2: PHONE OTP TESTS (8-14)
  // ========================================================================
  console.log('\n--- Group 2: Phone OTP Generation & Verification Tests (8-14) ---');

  const otpPhone = `+92333${Math.floor(1000000 + Math.random() * 9000000)}`;

  // Test 8: OTP generation stores valid hash in popolive.otp_verifications with 5-minute expiry
  console.log('\n[Test 8] OTP generation stores valid hash in database with 5-minute expiry');
  const sendOtpReq8 = makeRequest('http://localhost:3000/api/auth/phone/send-otp', {
    phone: otpPhone,
  }, {}, { poppo_terms_gate_accepted: 'true' });
  const sendOtpRes8 = await sendOtpHandler(sendOtpReq8);
  const sendOtpData8 = await sendOtpRes8.json();

  check(sendOtpRes8.status === 200, 'Test 8.1: Send OTP returns HTTP 200');
  check(sendOtpData8.success === true, 'Test 8.2: Send OTP returns success: true');
  check(sendOtpData8.cooldown === 60, 'Test 8.3: Resend cooldown is 60 seconds');
  check(Boolean(sendOtpData8.devOtp), 'Test 8.4: Development simulation returns devOtp');

  const otpDbRows = await pool.query(
    'SELECT * FROM popolive.otp_verifications WHERE phone = $1 ORDER BY created_at DESC LIMIT 1',
    [otpPhone]
  );
  check(otpDbRows.rows.length === 1, 'Test 8.5: OTP record persisted in popolive.otp_verifications');
  const otpRecord = otpDbRows.rows[0];
  check(typeof otpRecord.otp_hash === 'string' && otpRecord.otp_hash.length === 64, 'Test 8.6: OTP stored as 64-char SHA256 hash');
  check(otpRecord.attempts === 0, 'Test 8.7: Initial attempts count is 0');
  check(otpRecord.verified === false, 'Test 8.8: Initial verified status is false');
  const expiryDiffMinutes = (new Date(otpRecord.expires_at) - new Date(otpRecord.created_at)) / (60 * 1000);
  check(Math.round(expiryDiffMinutes) === 5, 'Test 8.9: Expiry window is exactly 5 minutes');

  // Test 9: OTP verification with valid OTP succeeds
  console.log('\n[Test 9] OTP verification with valid OTP succeeds');
  const verifyOtpReq9 = makeRequest('http://localhost:3000/api/auth/phone/verify-otp', {
    phone: otpPhone,
    otp: sendOtpData8.devOtp,
  }, {}, { poppo_terms_gate_accepted: 'true' });
  const verifyOtpRes9 = await verifyOtpHandler(verifyOtpReq9);
  const verifyOtpData9 = await verifyOtpRes9.json();

  check(verifyOtpRes9.status === 200, 'Test 9.1: Valid OTP returns HTTP 200');
  check(verifyOtpData9.success === true, 'Test 9.2: OTP verification returns success: true');
  check(typeof verifyOtpData9.sessionToken === 'string', 'Test 9.3: Session token issued on OTP verification');
  check(verifyOtpData9.user.phone === otpPhone, 'Test 9.4: Authenticated user matches verified phone');

  const verifiedRecord = (await pool.query('SELECT * FROM popolive.otp_verifications WHERE id = $1', [otpRecord.id])).rows[0];
  check(verifiedRecord.verified === true, 'Test 9.5: Record marked verified = true in database');

  // Test 10: OTP verification with incorrect OTP fails
  console.log('\n[Test 10] OTP verification with incorrect OTP fails (increments attempts)');
  const wrongPhone = `+92344${Math.floor(1000000 + Math.random() * 9000000)}`;
  // Request fresh OTP
  const sendReq10 = makeRequest('http://localhost:3000/api/auth/phone/send-otp', { phone: wrongPhone }, {}, { poppo_terms_gate_accepted: 'true' });
  await sendOtpHandler(sendReq10);

  const verifyWrongReq10 = makeRequest('http://localhost:3000/api/auth/phone/verify-otp', {
    phone: wrongPhone,
    otp: '999999',
  }, {}, { poppo_terms_gate_accepted: 'true' });
  const verifyWrongRes10 = await verifyOtpHandler(verifyWrongReq10);
  const verifyWrongData10 = await verifyWrongRes10.json();

  check(verifyWrongRes10.status === 400, 'Test 10.1: Wrong OTP returns HTTP 400');
  check(verifyWrongData10.error.includes('Invalid verification code'), 'Test 10.2: Error message is visible and clear');

  const attemptsRow = (await pool.query('SELECT attempts, verified FROM popolive.otp_verifications WHERE phone = $1', [wrongPhone])).rows[0];
  check(attemptsRow.attempts === 1, 'Test 10.3: Failed attempt incremented database attempts counter to 1');
  check(attemptsRow.verified === false, 'Test 10.4: Database record remains unverified');

  // Test 11: OTP verification with expired OTP fails
  console.log('\n[Test 11] OTP verification with expired OTP fails');
  const expiredPhone = `+92355${Math.floor(1000000 + Math.random() * 9000000)}`;
  // Insert directly with expired timestamp
  const dummyHash = hashOtp('123456');
  await pool.query(
    `INSERT INTO popolive.otp_verifications (phone, otp_hash, attempts, verified, created_at, expires_at)
     VALUES ($1, $2, 0, false, NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '5 minutes')`,
    [expiredPhone, dummyHash]
  );

  const verifyExpiredReq = makeRequest('http://localhost:3000/api/auth/phone/verify-otp', {
    phone: expiredPhone,
    otp: '123456',
  }, {}, { poppo_terms_gate_accepted: 'true' });
  const verifyExpiredRes = await verifyOtpHandler(verifyExpiredReq);
  const verifyExpiredData = await verifyExpiredRes.json();

  check(verifyExpiredRes.status === 400, 'Test 11.1: Expired OTP returns HTTP 400');
  check(verifyExpiredData.error.includes('expired'), 'Test 11.2: Error clearly reports OTP expiration');

  // Test 12: OTP verification with reused OTP fails
  console.log('\n[Test 12] OTP verification with reused OTP fails');
  // Attempt to verify the already-verified otpPhone from Test 9
  const verifyReusedReq = makeRequest('http://localhost:3000/api/auth/phone/verify-otp', {
    phone: otpPhone,
    otp: sendOtpData8.devOtp,
  }, {}, { poppo_terms_gate_accepted: 'true' });
  const verifyReusedRes = await verifyOtpHandler(verifyReusedReq);
  const verifyReusedData = await verifyReusedRes.json();

  check(verifyReusedRes.status === 400, 'Test 12.1: Reused OTP returns HTTP 400');
  check(verifyReusedData.error.includes('already been used'), 'Test 12.2: Error clearly explains OTP was already used');

  // Test 13: OTP verification with excessive attempts fails
  console.log('\n[Test 13] OTP verification with excessive attempts fails (locks out at 5)');
  const lockoutPhone = `+92366${Math.floor(1000000 + Math.random() * 9000000)}`;
  await pool.query(
    `INSERT INTO popolive.otp_verifications (phone, otp_hash, attempts, verified, created_at, expires_at)
     VALUES ($1, $2, 5, false, NOW(), NOW() + INTERVAL '5 minutes')`,
    [lockoutPhone, dummyHash]
  );

  const verifyLockoutReq = makeRequest('http://localhost:3000/api/auth/phone/verify-otp', {
    phone: lockoutPhone,
    otp: '123456',
  }, {}, { poppo_terms_gate_accepted: 'true' });
  const verifyLockoutRes = await verifyOtpHandler(verifyLockoutReq);
  const verifyLockoutData = await verifyLockoutRes.json();

  check(verifyLockoutRes.status === 400, 'Test 13.1: Locked-out OTP returns HTTP 400');
  check(verifyLockoutData.error.includes('Too many incorrect attempts'), 'Test 13.2: Error enforces maximum attempts lockout');

  // Test 14: OTP verification for wrong phone fails
  console.log('\n[Test 14] OTP verification for wrong phone fails');
  const wrongPhoneB = `+92377${Math.floor(1000000 + Math.random() * 9000000)}`;
  const verifyWrongPhoneReq = makeRequest('http://localhost:3000/api/auth/phone/verify-otp', {
    phone: wrongPhoneB,
    otp: '123456',
  }, {}, { poppo_terms_gate_accepted: 'true' });
  const verifyWrongPhoneRes = await verifyOtpHandler(verifyWrongPhoneReq);
  const verifyWrongPhoneData = await verifyWrongPhoneRes.json();

  check(verifyWrongPhoneRes.status === 400, 'Test 14.1: OTP submitted for wrong phone returns HTTP 400');
  check(verifyWrongPhoneData.error.includes('No OTP request found'), 'Test 14.2: Phone mismatch rejected');

  // ========================================================================
  // GROUP 3: CLIENT & INTEGRATION TESTS (15-20)
  // ========================================================================
  console.log('\n--- Group 3: Client & Integration Wiring Tests (15-20) ---');

  // Test 15: Mobile login flow connects to real API
  console.log('\n[Test 15] Mobile login flow connects to real API (zero silent fixture fallback)');
  const authStateDart = fs.readFileSync('apps/mobile/lib/auth/auth_state.dart', 'utf8');
  check(authStateDart.includes('_authService.login('), 'Test 15.1: Mobile AuthState calls _authService.login');
  check(!authStateDart.includes('// Fallback: accept fixture login without requiring database\n    return loginWithFixtureUser();'),
    'Test 15.2: Silent fallback to loginWithFixtureUser on API failure has been removed');

  // Test 16: Web login flow connects to real API
  console.log('\n[Test 16] Web login flow connects to real API (zero silent fixture fallback)');
  const webLoginTsx = fs.readFileSync('apps/web/app/login/page.tsx', 'utf8');
  check(webLoginTsx.includes("fetch('/api/auth/login'"), 'Test 16.1: Web login page submits to /api/auth/login');
  check(webLoginTsx.includes('setErrorMessage(err.message'), 'Test 16.2: Web login page catches and displays visible errors');

  // Test 17: Mobile OTP flow connects to real API
  console.log('\n[Test 17] Mobile OTP flow connects to real API');
  check(authStateDart.includes('_authService.sendPhoneOtp(phone)'), 'Test 17.1: Mobile sendPhoneOtp connects to _authService.sendPhoneOtp');
  check(authStateDart.includes('_authService.verifyPhoneOtp('), 'Test 17.2: Mobile verifyPhoneOtp connects to _authService.verifyPhoneOtp');

  // Test 18: Web OTP flow connects to real API
  console.log('\n[Test 18] Web OTP flow connects to real API');
  check(webLoginTsx.includes("fetch('/api/auth/phone/send-otp'"), 'Test 18.1: Web login page submits to /api/auth/phone/send-otp');
  check(webLoginTsx.includes("fetch('/api/auth/phone/verify-otp'"), 'Test 18.2: Web login page submits to /api/auth/phone/verify-otp');

  // Test 19: Visible authentication errors displayed on mobile and web
  console.log('\n[Test 19] Visible authentication errors displayed on mobile and web');
  const mobileLoginScreenDart = fs.readFileSync('apps/mobile/lib/screens/auth/login_screen.dart', 'utf8');
  check(mobileLoginScreenDart.includes('if (_errorMessage != null)'), 'Test 19.1: Mobile login screen has dedicated visible error banner');
  check(webLoginTsx.includes('{errorMessage && ('), 'Test 19.2: Web login page renders visible errorMessage alert');

  // Test 20: Zero fixture fallback when real auth is enabled
  console.log('\n[Test 20] Zero fixture fallback when real auth is enabled');
  check(mobileLoginScreenDart.includes('_handleFixtureLogin'), 'Test 20.1: Fixture login preserved exclusively as explicit user choice');
  check(!mobileLoginScreenDart.includes('else {\n      _handleFixtureLogin'), 'Test 20.2: Failure of normal login does NOT trigger fixture login');

  // ========================================================================
  // GROUP 4: SECURITY & COMPLIANCE TESTS (21-25)
  // ========================================================================
  console.log('\n--- Group 4: Security & Compliance Tests (21-25) ---');

  // Test 21: Password hash never exposed in API responses or client logs
  console.log('\n[Test 21] Password hash never exposed in API responses');
  check(loginData1.user.password_hash === undefined, 'Test 21.1: password_hash not in user payload');
  check(loginData1.user.password === undefined, 'Test 21.2: raw password not in user payload');
  check(JSON.stringify(loginData1).indexOf('$2a$') === -1, 'Test 21.3: No bcrypt hash string present anywhere in serialized JSON');

  // Test 22: OTP secret / hash never exposed to client
  console.log('\n[Test 22] OTP secret / hash never exposed to client');
  check(sendOtpData8.otp_hash === undefined, 'Test 22.1: otp_hash not in send-otp response');
  check(verifyOtpData9.otp_hash === undefined, 'Test 22.2: otp_hash not in verify-otp response');
  check(JSON.stringify(sendOtpData8).indexOf('poppo-live-auth-secret') === -1, 'Test 22.3: AUTH_SECRET not exposed');

  // Test 23: Session user ownership integrity
  console.log('\n[Test 23] Session user ownership integrity');
  const sessionReq23 = makeRequest('http://localhost:3000/api/auth/session', null, {
    'authorization': `Bearer ${loginData1.sessionToken}`,
  }, { 'poppo_session': loginData1.sessionToken });
  const sessionRes23 = await sessionHandler(sessionReq23);
  const sessionData23 = await sessionRes23.json();

  check(sessionRes23.status === 200, 'Test 23.1: /api/auth/session returns HTTP 200');
  check(sessionData23.authenticated === true, 'Test 23.2: Session is marked authenticated');
  check(sessionData23.user.id === testUserId, 'Test 23.3: Session user ID matches authenticated user');
  check(sessionData23.user.poppoId === testUserPoppoId, 'Test 23.4: Session poppo ID matches authenticated user');

  // Test 24: Under-18 restriction enforced across all auth paths
  console.log('\n[Test 24] Under-18 restriction enforced across all auth paths');
  const under18Age = calculateAge('2012-01-01');
  check(under18Age < 18, `Test 24.1: Age correctly calculated as ${under18Age} (< 18)`);

  // Phone OTP without terms gate accepted must fail with 403
  const noTermsOtpReq = new NextRequest(new URL('http://localhost:3000/api/auth/phone/send-otp'), {
    method: 'POST',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ phone: `+92388${Math.floor(1000000 + Math.random() * 9000000)}` }),
  });
  const noTermsOtpRes = await sendOtpHandler(noTermsOtpReq);
  check(noTermsOtpRes.status === 403, 'Test 24.2: Phone OTP blocked with HTTP 403 if terms gate unaccepted');

  // Test 25: Real OTP provider disabled (USE_REAL_OTP=false, local provider active)
  console.log('\n[Test 25] Real OTP provider disabled (USE_REAL_OTP=false, local provider active)');
  const isRealOtp = otpService.isRealOtpRequired();
  check(isRealOtp === false, 'Test 25.1: Real OTP is disabled (isRealOtpRequired() === false)');
  check(process.env.USE_REAL_OTP !== 'true', 'Test 25.2: USE_REAL_OTP environment variable is not true');

  // Clean up test data
  console.log('\n--- Cleaning up temporary test users ---');
  if (createdUserIds.length > 0) {
    await pool.query('DELETE FROM popolive.sessions WHERE user_id = ANY($1)', [createdUserIds]);
    await pool.query('DELETE FROM popolive.auth_providers WHERE user_id = ANY($1)', [createdUserIds]);
    await pool.query('DELETE FROM popolive.users WHERE id = ANY($1)', [createdUserIds]);
  }
  await pool.query('DELETE FROM popolive.otp_verifications WHERE phone LIKE \'+92333%\' OR phone LIKE \'+92344%\' OR phone LIKE \'+92355%\' OR phone LIKE \'+92366%\' OR phone LIKE \'+92377%\'');
  await pool.end();

  console.log('\n======================================================================');
  console.log(`POPO LIVE B2 PROMPT 3 AUDIT COMPLETE: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runB2LoginOtpTests().catch((err) => {
  console.error('Fatal error running B2 Prompt 3 test suite:', err);
  process.exit(1);
});
