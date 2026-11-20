const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public'
});

const BASE_URL = 'http://localhost:3000';
const SECRET_KEY = process.env.CONSENT_SECRET_KEY || 'poppo-live-secure-consent-salt-2026-v4';

function generateTermsToken() {
  const payload = {
    consentId: 'test_consent_' + Date.now(),
    anonymousSessionId: 'anon_' + Date.now(),
    termsVersion: 'v4.2.0',
    privacyVersion: 'v4.2.0',
    status: 'accepted',
    timestamp: Date.now(),
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('base64url');
  return `${data}.${signature}`;
}

async function runTests() {
  console.log('========================================================================');
  console.log('POPO LIVE — PHASE 7 (P7-P3) AUTHENTICATION & PROFILE VERIFICATION SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      if (details) console.log(`       -> ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (details) console.error(`       -> ${details}`);
      failed++;
    }
  }

  const termsToken = generateTermsToken();

  // Helper for API fetch
  async function apiFetch(path, options = {}) {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Terms-Consent': termsToken,
      'Cookie': `poppo_terms_consent=${termsToken}`,
      ...(options.headers || {}),
    };
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
    return { status: res.status, ok: res.ok, headers: res.headers, data };
  }

  try {
    // Clean test rate limits
    await pool.query("DELETE FROM popolive.rate_limits WHERE key LIKE 'reg_%' OR key LIKE 'login_%'");

    const testEmail = `p7_test_${Date.now()}@popolive.internal`;
    const testPhone = `+92300${Math.floor(1000000 + Math.random() * 9000000)}`;
    const testPassword = 'SecurePassword2026!';
    const uniqueNickname = 'Adult_' + Math.floor(100000 + Math.random() * 900000);
    let registeredUser = null;
    let registeredSessionToken = null;

    // ========================================================================
    // 1. REGISTRATION TESTS (Tests 1 - 6)
    // ========================================================================
    console.log('--- 1. REGISTRATION TESTS ---');

    // Test 1: Register valid user
    const regRes = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        nickname: 'P7 Auth Tester',
        isAdultConfirmed: true,
      }),
    });
    assert(regRes.status === 200, 'Test 1: Register valid user returns HTTP 200', `Status: ${regRes.status}`);
    assert(regRes.data?.success === true, 'Test 1b: Register success is true');
    assert(Boolean(regRes.data?.user?.id), 'Test 1c: Registered user has ID', regRes.data?.user?.id);
    assert(Boolean(regRes.data?.sessionToken), 'Test 1d: Registration returns session token');

    registeredUser = regRes.data?.user;
    registeredSessionToken = regRes.data?.sessionToken;

    // Test 2: Test duplicate registration
    const dupRes = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        nickname: 'Another Name',
        isAdultConfirmed: true,
      }),
    });
    assert(dupRes.status === 409, 'Test 2: Duplicate registration returns HTTP 409 Conflict', `Status: ${dupRes.status}`);
    assert(dupRes.data?.code === 'EMAIL_EXISTS', 'Test 2b: Error code is EMAIL_EXISTS');

    // Test 3: Test invalid registration fields (missing email and phone)
    const invalidFieldsRes = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        password: testPassword,
        isAdultConfirmed: true,
      }),
    });
    assert(invalidFieldsRes.status === 400, 'Test 3: Missing email & phone returns HTTP 400', `Status: ${invalidFieldsRes.status}`);

    // Test 4: Weak password rejection (<8 chars)
    const weakPassRes = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: `weak_${Date.now()}@popolive.internal`,
        password: '123',
        isAdultConfirmed: true,
      }),
    });
    assert(weakPassRes.status === 400, 'Test 4: Weak password rejected with HTTP 400', `Status: ${weakPassRes.status}`);

    // Test 5: Verify account created in database
    const dbUserRes = await pool.query('SELECT id, poppo_id, email, password_hash, status FROM popolive.users WHERE id = $1', [registeredUser.id]);
    assert(dbUserRes.rows.length === 1, 'Test 5: Account row exists in PostgreSQL popolive.users');
    assert(dbUserRes.rows[0].password_hash !== testPassword, 'Test 5b: Password is salted hash, not plaintext');

    // Test 6: Verify associated profile initialization
    assert(Boolean(registeredUser.poppoId), 'Test 6: User has unique Poppo ID', registeredUser.poppoId);
    assert(registeredUser.status === 'active', 'Test 6b: User account status is active');
    console.log('');

    // ========================================================================
    // 2. AGE VERIFICATION TESTS (Tests 7 - 10)
    // ========================================================================
    console.log('--- 2. 18+ AGE VERIFICATION TESTS ---');

    // Test 7: Profile setup with age < 18
    const under18Res = await apiFetch('/api/profile/setup', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${registeredSessionToken}` },
      body: JSON.stringify({
        nickname: 'Under18User',
        birthdate: '2016-01-01', // 10 years old
        country: 'Pakistan',
        countryCode: 'PK',
      }),
    });
    assert(under18Res.status === 400, 'Test 7: User under 18 rejected with HTTP 400', `Status: ${under18Res.status}`);
    assert(under18Res.data?.code === 'UNDER_18_RESTRICTION', 'Test 7b: ErrorCode is UNDER_18_RESTRICTION');

    // Test 8: Profile setup with age >= 18
    const adultRes = await apiFetch('/api/profile/setup', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${registeredSessionToken}` },
      body: JSON.stringify({
        nickname: uniqueNickname,
        birthdate: '1998-07-15', // 28 years old
        country: 'Pakistan',
        countryCode: 'PK',
      }),
    });
    assert(adultRes.status === 200, 'Test 8: User 18+ profile setup succeeds with HTTP 200', `Status: ${adultRes.status}`);
    assert(adultRes.data?.success === true, 'Test 8b: Profile setup success is true');

    // Test 9: Verify server-side adult verification in database
    const dbAdultRes = await pool.query('SELECT birthdate, is_adult_verified, is_profile_completed FROM popolive.users WHERE id = $1', [registeredUser.id]);
    assert(dbAdultRes.rows[0].is_adult_verified === true, 'Test 9: Server-side is_adult_verified is true in DB');
    assert(dbAdultRes.rows[0].is_profile_completed === true, 'Test 9b: is_profile_completed is true in DB');

    // Test 10: Attempt to bypass age/terms gate without consent token
    const bypassRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testEmail, password: testPassword }),
    });
    assert(bypassRes.status === 403, 'Test 10: Missing terms consent returns HTTP 403 Forbidden', `Status: ${bypassRes.status}`);
    console.log('');

    // ========================================================================
    // 3. OTP VERIFICATION TESTS (Tests 11 - 16)
    // ========================================================================
    console.log('--- 3. OTP VERIFICATION TESTS ---');

    // Test 11: Send phone OTP
    const otpPhone = `+92301${Math.floor(1000000 + Math.random() * 9000000)}`;
    const sendOtpRes = await apiFetch('/api/auth/phone/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: otpPhone }),
    });
    assert(sendOtpRes.status === 200, 'Test 11: Send OTP returns HTTP 200', `Status: ${sendOtpRes.status}`);
    assert(typeof sendOtpRes.data?.cooldown === 'number', 'Test 11b: Cooldown returned');
    const validOtp = sendOtpRes.data?.devOtp;
    assert(Boolean(validOtp), 'Test 11c: Development OTP generated for test verification', validOtp);

    // Test 12: Invalid OTP
    const invalidOtpRes = await apiFetch('/api/auth/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: otpPhone, otp: '000000' }),
    });
    assert(invalidOtpRes.status === 400, 'Test 12: Invalid OTP rejected with HTTP 400', `Status: ${invalidOtpRes.status}`);

    // Test 13: Expired OTP
    await pool.query('UPDATE popolive.otp_verifications SET expires_at = NOW() - INTERVAL \'5 minutes\' WHERE phone = $1', [otpPhone]);
    const expiredOtpRes = await apiFetch('/api/auth/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: otpPhone, otp: validOtp }),
    });
    assert(expiredOtpRes.status === 400, 'Test 13: Expired OTP rejected with HTTP 400', `Status: ${expiredOtpRes.status}`);

    // Test 14: Resend cooldown
    // Generate new OTP
    const cooldownPhone = `+92302${Math.floor(1000000 + Math.random() * 9000000)}`;
    await apiFetch('/api/auth/phone/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: cooldownPhone }),
    });
    const immediateResend = await apiFetch('/api/auth/phone/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: cooldownPhone }),
    });
    assert(immediateResend.status === 400, 'Test 14: Immediate resend rejected due to cooldown', `Status: ${immediateResend.status}`);

    // Test 15: Maximum attempts reached
    const maxAttemptsPhone = `+92303${Math.floor(1000000 + Math.random() * 9000000)}`;
    const sendMaxRes = await apiFetch('/api/auth/phone/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: maxAttemptsPhone }),
    });
    await pool.query('UPDATE popolive.otp_verifications SET attempts = 5 WHERE phone = $1', [maxAttemptsPhone]);
    const maxAttemptRes = await apiFetch('/api/auth/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: maxAttemptsPhone, otp: sendMaxRes.data?.devOtp }),
    });
    assert(maxAttemptRes.status === 400, 'Test 15: Exceeded maximum attempts rejected with HTTP 400');

    // Test 16: Verification success
    const successPhone = `+92304${Math.floor(1000000 + Math.random() * 9000000)}`;
    const sendSuccessRes = await apiFetch('/api/auth/phone/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: successPhone }),
    });
    const verifySuccessRes = await apiFetch('/api/auth/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: successPhone, otp: sendSuccessRes.data?.devOtp }),
    });
    assert(verifySuccessRes.status === 200, 'Test 16: Valid OTP verified with HTTP 200', `Status: ${verifySuccessRes.status}`);
    assert(verifySuccessRes.data?.success === true, 'Test 16b: OTP verification success is true');
    assert(Boolean(verifySuccessRes.data?.sessionToken), 'Test 16c: Phone verification issued session token');
    console.log('');

    // ========================================================================
    // 4. LOGIN TESTS (Tests 17 - 23)
    // ========================================================================
    console.log('--- 4. LOGIN & SESSION TESTS ---');

    // Test 17: Valid login
    const loginRes = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: testEmail,
        password: testPassword,
      }),
    });
    assert(loginRes.status === 200, 'Test 17: Valid login returns HTTP 200', `Status: ${loginRes.status}`);
    assert(loginRes.data?.success === true, 'Test 17b: Login success is true');
    assert(Boolean(loginRes.data?.sessionToken), 'Test 17c: Login returned session token');
    const activeLoginToken = loginRes.data?.sessionToken;

    // Test 18: Incorrect password
    const badPassRes = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: testEmail,
        password: 'WrongPassword!',
      }),
    });
    assert(badPassRes.status === 401, 'Test 18: Incorrect password rejected with HTTP 401', `Status: ${badPassRes.status}`);
    assert(badPassRes.data?.code === 'INVALID_PASSWORD', 'Test 18b: Error code is INVALID_PASSWORD');

    // Test 19: Nonexistent account
    const noAccountRes = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: 'nonexistent_user_99999@popolive.internal',
        password: 'AnyPassword123!',
      }),
    });
    assert(noAccountRes.status === 404, 'Test 19: Nonexistent account returns HTTP 404', `Status: ${noAccountRes.status}`);
    assert(noAccountRes.data?.code === 'USER_NOT_FOUND', 'Test 19b: Error code is USER_NOT_FOUND');

    // Test 20: Inactive / suspended account
    const suspendedEmail = `suspended_${Date.now()}@popolive.internal`;
    await pool.query(`
      INSERT INTO popolive.users (poppo_id, email, password_hash, nickname, status, is_adult_verified)
      VALUES ($1, $2, $3, 'Suspended User', 'suspended', true)
    `, [String(Math.floor(1000000 + Math.random() * 9000000)), suspendedEmail, await pool.query('SELECT password_hash FROM popolive.users WHERE id = $1', [registeredUser.id]).then(r => r.rows[0].password_hash)]);
    const suspendedLoginRes = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: suspendedEmail, password: testPassword }),
    });
    assert(suspendedLoginRes.status === 403, 'Test 20: Inactive/suspended user login rejected with HTTP 403', `Status: ${suspendedLoginRes.status}`);
    assert(suspendedLoginRes.data?.code === 'ACCOUNT_INACTIVE', 'Test 20b: Error code is ACCOUNT_INACTIVE');

    // Test 21: Authentication token validation (GET /api/auth/session)
    const sessionRes = await apiFetch('/api/auth/session', {
      headers: { 'Authorization': `Bearer ${activeLoginToken}` },
    });
    assert(sessionRes.status === 200, 'Test 21: GET /api/auth/session returns HTTP 200');
    assert(sessionRes.data?.authenticated === true, 'Test 21b: Session reports authenticated = true');
    assert(sessionRes.data?.user?.id === registeredUser.id, 'Test 21c: Session user matches logged-in user');

    // Test 22: Logout endpoint (POST /api/auth/logout)
    const logoutRes = await apiFetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${activeLoginToken}` },
    });
    assert(logoutRes.status === 200, 'Test 22: Logout succeeds with HTTP 200');

    // Test 23: Expired / revoked session
    const postLogoutSession = await apiFetch('/api/auth/session', {
      headers: { 'Authorization': `Bearer ${activeLoginToken}` },
    });
    assert(postLogoutSession.data?.authenticated === false, 'Test 23: Post-logout session is invalid (authenticated = false)');
    console.log('');

    // Re-login to have an active session for profile tests
    const reLogin = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: testEmail, password: testPassword }),
    });
    const currentToken = reLogin.data?.sessionToken;

    // ========================================================================
    // 5. PROFILE TESTS (Tests 24 - 30)
    // ========================================================================
    console.log('--- 5. PROFILE TESTS ---');

    // Test 24: Retrieve own profile (GET /api/profile/me)
    const myProfileRes = await apiFetch('/api/profile/me', {
      headers: { 'Authorization': `Bearer ${currentToken}` },
    });
    assert(myProfileRes.status === 200, 'Test 24: GET /api/profile/me returns HTTP 200');
    assert(myProfileRes.data?.user?.id === registeredUser.id, 'Test 24b: Profile ID matches authenticated user');
    assert(myProfileRes.data?.user?.nickname === uniqueNickname, 'Test 24c: Profile displays completed nickname', myProfileRes.data?.user?.nickname);

    // Test 25: Update own profile (PATCH /api/profile/me)
    const patchProfileRes = await apiFetch('/api/profile/me', {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${currentToken}` },
      body: JSON.stringify({
        bio: 'Official POPO LIVE certified live streamer ✨',
        country: 'Pakistan',
      }),
    });
    assert(patchProfileRes.status === 200, 'Test 25: PATCH /api/profile/me succeeds with HTTP 200');
    assert(patchProfileRes.data?.user?.bio === 'Official POPO LIVE certified live streamer ✨', 'Test 25b: Bio updated successfully');

    // Test 26: Upload profile avatar (POST /api/profile/avatar)
    // Small valid 1x1 PNG base64
    const validPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const uploadAvatarRes = await apiFetch('/api/profile/avatar', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${currentToken}` },
      body: JSON.stringify({ imageBase64: validPngBase64 }),
    });
    assert(uploadAvatarRes.status === 200, 'Test 26: Upload avatar succeeds with HTTP 200', `Status: ${uploadAvatarRes.status}`);
    assert(uploadAvatarRes.data?.avatarUrl?.startsWith('/uploads/avatars/'), 'Test 26b: Avatar URL generated in /uploads/avatars/');

    // Test 27: Reject invalid image format
    const badImageRes = await apiFetch('/api/profile/avatar', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${currentToken}` },
      body: JSON.stringify({ imageBase64: 'data:application/octet-stream;base64,AAAA' }),
    });
    assert(badImageRes.status === 400, 'Test 27: Disallowed file type rejected with HTTP 400', `Status: ${badImageRes.status}`);

    // Test 28: View another user's public profile (GET /api/users/[userId]/public-profile)
    const publicProfileRes = await apiFetch(`/api/users/${registeredUser.id}/public-profile`);
    assert(publicProfileRes.status === 200, 'Test 28: GET public profile returns HTTP 200');
    const pubProfile = publicProfileRes.data?.profile || publicProfileRes.data?.user;
    assert(pubProfile?.nickname === uniqueNickname, 'Test 28b: Public profile includes nickname', pubProfile?.nickname);
    assert(pubProfile?.password_hash === undefined, 'Test 28c: Public profile does not expose password_hash');
    assert(pubProfile?.email === undefined, 'Test 28d: Public profile does not expose private email');

    // Test 29: Unauthorized privileged field modification
    // Attempting to inject VIP or Wealth level in PATCH /api/profile/me
    const exploitPatch = await apiFetch('/api/profile/me', {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${currentToken}` },
      body: JSON.stringify({ vipLevel: 5, wealthLevel: 99 }),
    });
    const checkDbExploit = await pool.query('SELECT wealth_level FROM popolive.users WHERE id = $1', [registeredUser.id]);
    assert(checkDbExploit.rows[0].wealth_level === 1, 'Test 29: Privileged fields protected against client tampering (wealth level remains 1)');

    // Test 30: User ID consistency across database, session, and public profile
    assert(
      registeredUser.id === myProfileRes.data?.user?.id &&
      registeredUser.id === pubProfile?.id,
      'Test 30: User ID consistency verified across all APIs and DB'
    );
    console.log('');

    // ========================================================================
    // 6. CROSS-PLATFORM TESTS (Tests 31 - 35)
    // ========================================================================
    console.log('--- 6. CROSS-PLATFORM INTEGRATION TESTS ---');

    // Test 31: Register via Mobile API pattern (Bearer session, mobile payload)
    const mobileEmail = `mobile_tester_${Date.now()}@popolive.internal`;
    const mobileReg = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: mobileEmail,
        password: testPassword,
        nickname: 'Mobile Cross User',
        gender: 'female',
        isAdultConfirmed: true,
      }),
    });
    assert(mobileReg.status === 200, 'Test 31: Mobile pattern registration succeeds with HTTP 200');
    const crossUserId = mobileReg.data?.user?.id;
    const crossPoppoId = mobileReg.data?.user?.poppoId;
    const mobileToken = mobileReg.data?.sessionToken;

    // Test 32: Web Login using same account
    const webLoginRes = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: mobileEmail,
        password: testPassword,
      }),
    });
    assert(webLoginRes.status === 200, 'Test 32: Web Login using mobile-registered account succeeds with HTTP 200');
    assert(webLoginRes.data?.user?.id === crossUserId, 'Test 32b: Web login resolves identical backend User ID');
    assert(webLoginRes.data?.user?.poppoId === crossPoppoId, 'Test 32c: Web login resolves identical numeric Poppo ID');
    const webToken = webLoginRes.data?.sessionToken;

    // Test 33: Update profile via Web API
    const webUpdateRes = await apiFetch('/api/profile/me', {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${webToken}` },
      body: JSON.stringify({
        bio: 'Profile updated on Web Desktop 💻',
      }),
    });
    assert(webUpdateRes.status === 200, 'Test 33: Profile updated from Web desktop');

    // Test 34: Verify updated profile on Mobile API
    const mobileProfileCheck = await apiFetch('/api/profile/me', {
      headers: { 'Authorization': `Bearer ${mobileToken}` },
    });
    assert(mobileProfileCheck.status === 200, 'Test 34: Mobile API queries profile with HTTP 200');
    assert(
      mobileProfileCheck.data?.user?.bio === 'Profile updated on Web Desktop 💻',
      'Test 34b: Mobile API reads exact updated profile in real time'
    );

    // Test 35: Cross-platform logout & session isolation
    // Logout web session; mobile session should remain valid until explicitly logged out
    const webLogout = await apiFetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${webToken}` },
    });
    assert(webLogout.status === 200, 'Test 35: Web session logout succeeds');
    const checkWebSession = await apiFetch('/api/auth/session', {
      headers: { 'Authorization': `Bearer ${webToken}` },
    });
    assert(checkWebSession.data?.authenticated === false, 'Test 35b: Web session invalidated');
    const checkMobileSession = await apiFetch('/api/auth/session', {
      headers: { 'Authorization': `Bearer ${mobileToken}` },
    });
    assert(checkMobileSession.data?.authenticated === true, 'Test 35c: Mobile session maintains valid persistence independently');
    console.log('');

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('========================================================================');
    console.log(`P7-P3 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
    console.log('========================================================================\n');

    if (failed > 0) {
      console.error(`FAILED: ${failed} tests did not pass.`);
      process.exit(1);
    } else {
      console.log('SUCCESS: All 35 P7-P3 Authentication, Registration, Login & Profile tests passed!');
      process.exit(0);
    }

  } catch (err) {
    console.error('Unexpected error during test execution:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();
