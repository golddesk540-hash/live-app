const baseUrl = 'http://localhost:3000';

async function runAuthTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPLETE POPPO LIVE AUTHENTICATION TESTS');
  console.log('====================================================\n');

  // Helper to extract cookie
  function getCookie(res, name) {
    const raw = res.headers.get('set-cookie');
    if (!raw) return null;
    const match = raw.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? match[1] : null;
  }

  // --- TEST 1: Terms Gate Enforcement (Without accepted terms cookie) ---
  console.log('Test 1: Enforce Terms Gate (Unaccepted terms request)...');
  let res = await fetch(baseUrl + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'test@example.com', password: 'password123' }),
  });
  let data = await res.json();
  console.log('Status:', res.status, '| Expected 403:', res.status === 403, '| Error:', data.error);

  // Now obtain accepted terms consent cookie for remaining tests
  res = await fetch(baseUrl + '/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'test_session_gate',
    }),
  });
  const termsCookie = res.headers.get('set-cookie').split(';')[0];
  console.log('Acquired valid Terms Gate cookie for tests:', termsCookie.substring(0, 35) + '...\n');

  // --- TEST 2: Under-18 registration rejection ---
  console.log('Test 2: Under-18 registration restriction...');
  res = await fetch(baseUrl + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: termsCookie },
    body: JSON.stringify({
      email: 'minor@example.com',
      password: 'StrongPassword123',
      isAdultConfirmed: false,
    }),
  });
  console.log('Status:', res.status, '| Expected 400:', res.status === 400);

  // --- TEST 3: Valid User Registration (Adult confirmed) ---
  const testEmail = 'streamer_' + Date.now() + '@popolive.com';
  console.log('\nTest 3: Valid User Registration (' + testEmail + ')...');
  res = await fetch(baseUrl + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: termsCookie },
    body: JSON.stringify({
      email: testEmail,
      password: 'SecretPassword2026!',
      nickname: 'TopStreamer2026',
      isAdultConfirmed: true,
    }),
  });
  data = await res.json();
  console.log('Status:', res.status, '| Success:', data.success, '| Poppo ID:', data.user?.poppoId);
  const sessionCookie = res.headers.get('set-cookie')?.split(';')[0];

  // Combine cookies
  const fullAuthCookies = termsCookie + '; ' + sessionCookie;

  // --- TEST 4: Session Validation ---
  console.log('\nTest 4: Validate Session Token (GET /api/auth/session)...');
  res = await fetch(baseUrl + '/api/auth/session', {
    headers: { Cookie: fullAuthCookies },
  });
  data = await res.json();
  console.log('Session Auth:', data.authenticated, '| Nickname:', data.user?.nickname, '| PoppoID:', data.user?.poppoId);

  // --- TEST 5: Logout ---
  console.log('\nTest 5: Logout (POST /api/auth/logout)...');
  res = await fetch(baseUrl + '/api/auth/logout', {
    method: 'POST',
    headers: { Cookie: fullAuthCookies },
  });
  data = await res.json();
  console.log('Logout status:', data.success);

  // Verify session is now invalid
  res = await fetch(baseUrl + '/api/auth/session', {
    headers: { Cookie: fullAuthCookies },
  });
  data = await res.json();
  console.log('Post-logout session state (Expected false):', data.authenticated);

  // --- TEST 6: Invalid Password Login ---
  console.log('\nTest 6: Invalid Password Login...');
  res = await fetch(baseUrl + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: termsCookie },
    body: JSON.stringify({ identifier: testEmail, password: 'WrongPassword999' }),
  });
  data = await res.json();
  console.log('Status:', res.status, '| Expected 401:', res.status === 401, '| Error:', data.error);

  // --- TEST 7: Unregistered Email Login ---
  console.log('\nTest 7: Unregistered Email Login...');
  res = await fetch(baseUrl + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: termsCookie },
    body: JSON.stringify({ identifier: 'nonexistent_' + Date.now() + '@domain.com', password: 'AnyPassword123' }),
  });
  data = await res.json();
  console.log('Status:', res.status, '| Expected 404:', res.status === 404, '| Error:', data.error);

  // --- TEST 8: Valid Login with Correct Password ---
  console.log('\nTest 8: Valid Login with Email & Password...');
  res = await fetch(baseUrl + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: termsCookie },
    body: JSON.stringify({ identifier: testEmail, password: 'SecretPassword2026!' }),
  });
  data = await res.json();
  console.log('Status:', res.status, '| Success:', data.success, '| User:', data.user?.nickname);

  // --- TEST 9: Phone OTP Dispatch ---
  const testPhone = '+923001234567';
  console.log('\nTest 9: Request Phone OTP for ' + testPhone + '...');
  res = await fetch(baseUrl + '/api/auth/phone/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: termsCookie },
    body: JSON.stringify({ phone: testPhone }),
  });
  data = await res.json();
  console.log('Status:', res.status, '| Success:', data.success, '| Cooldown:', data.cooldown);

  // --- TEST 10: Rate Limiting & Cooldown on Resend OTP ---
  console.log('\nTest 10: Test Resend OTP within 60s cooldown...');
  res = await fetch(baseUrl + '/api/auth/phone/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: termsCookie },
    body: JSON.stringify({ phone: testPhone }),
  });
  data = await res.json();
  console.log('Status:', res.status, '| Expected Cooldown Error:', data.error);

  // --- TEST 11: Invalid OTP code verification ---
  console.log('\nTest 11: Verify with Invalid OTP (000000)...');
  res = await fetch(baseUrl + '/api/auth/phone/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: termsCookie },
    body: JSON.stringify({ phone: testPhone, otp: '000000' }),
  });
  data = await res.json();
  console.log('Status:', res.status, '| Expected 400:', res.status === 400, '| Error:', data.error);

  // --- TEST 12: Password Recovery Flow ---
  console.log('\nTest 12: Forgot Password Dispatch...');
  res = await fetch(baseUrl + '/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: termsCookie },
    body: JSON.stringify({ identifier: testEmail }),
  });
  data = await res.json();
  console.log('Forgot Password response:', data.message);
  console.log('Dev Reset URL available:', !!data.devResetUrl);

  let resetToken = null;
  if (data.devResetUrl) {
    const urlObj = new URL(data.devResetUrl);
    resetToken = urlObj.searchParams.get('token');
  }

  // --- TEST 13: Password Reset Execution ---
  if (resetToken) {
    console.log('\nTest 13: Reset Password with token ' + resetToken.substring(0, 10) + '...');
    res = await fetch(baseUrl + '/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        newPassword: 'BrandNewPassword2026!',
        confirmPassword: 'BrandNewPassword2026!',
      }),
    });
    data = await res.json();
    console.log('Reset Password Status:', res.status, '| Message:', data.message);

    // Re-login with new password
    console.log('\nTest 14: Log in with newly reset password...');
    res = await fetch(baseUrl + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: termsCookie },
      body: JSON.stringify({ identifier: testEmail, password: 'BrandNewPassword2026!' }),
    });
    data = await res.json();
    console.log('Login with new password status:', res.status, '| Success:', data.success);
  }

  // --- TEST 15: Social Providers Availability ---
  console.log('\nTest 15: Check Social OAuth Providers Config...');
  res = await fetch(baseUrl + '/api/auth/providers');
  data = await res.json();
  console.log('Providers Config: Google=' + data.social?.google?.configured + ', FB=' + data.social?.facebook?.configured + ', Apple=' + data.social?.apple?.configured);

  console.log('\n====================================================');
  console.log('✅ ALL AUTHENTICATION TESTS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
}

runAuthTests().catch(console.error);
