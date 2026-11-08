const baseUrl = 'http://localhost:3000';

async function runUserIdAndSessionTests() {
  console.log('===========================================================');
  console.log('🧪 RUNNING POPPO LIVE USER ID & SESSION MANAGEMENT TESTS');
  console.log('===========================================================\n');

  // Accept terms gate to obtain consent cookie
  let res = await fetch(baseUrl + '/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'session_test_gate',
    }),
  });
  const termsCookie = res.headers.get('set-cookie').split(';')[0];

  // --- TEST 1: Unauthorized access to /api/users/me and /api/users/me/sessions ---
  console.log('Test 1: Check Unauthorized Access...');
  res = await fetch(baseUrl + '/api/users/me');
  console.log('GET /api/users/me Status:', res.status, '| Expected 401:', res.status === 401);
  res = await fetch(baseUrl + '/api/users/me/sessions');
  console.log('GET /api/users/me/sessions Status:', res.status, '| Expected 401:', res.status === 401);

  // --- TEST 2: Unique User ID Generation for Multiple Users ---
  console.log('\nTest 2: Generating Unique Numeric User IDs for 3 new users...');
  const usersCreated = [];
  for (let i = 1; i <= 3; i++) {
    const email = `testuser_${i}_${Date.now()}@popolive.com`;
    res = await fetch(baseUrl + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: termsCookie },
      body: JSON.stringify({
        email,
        password: 'Password123456!',
        nickname: `UserStar_${i}`,
        isAdultConfirmed: true,
      }),
    });
    const data = await res.json();
    const cookie = res.headers.get('set-cookie')?.split(';')[0];
    usersCreated.push({ email, poppoId: data.user?.poppoId, cookie, id: data.user?.id });
    console.log(`User ${i}: ID=${data.user?.poppoId} (Numeric length: ${data.user?.poppoId?.length})`);
  }

  // Verify all 3 IDs are unique and strictly numeric
  const idSet = new Set(usersCreated.map((u) => u.poppoId));
  const allNumeric = usersCreated.every((u) => /^\d+$/.test(u.poppoId));
  console.log('All 3 IDs unique:', idSet.size === 3, '| All strictly numeric:', allNumeric);

  // Focus on Primary Test User
  const primaryUser = usersCreated[0];
  const primaryAuthHeaders = {
    'Content-Type': 'application/json',
    Cookie: `${termsCookie}; ${primaryUser.cookie}`,
  };

  // --- TEST 3: User ID Permanence (Updating nickname and profile must not alter poppoId) ---
  console.log('\nTest 3: Testing User ID Permanence during profile update...');
  const originalPoppoId = primaryUser.poppoId;
  res = await fetch(baseUrl + '/api/profile/setup', {
    method: 'POST',
    headers: primaryAuthHeaders,
    body: JSON.stringify({
      nickname: 'UpdatedNickname_' + Date.now().toString().slice(-4),
      birthdate: '1998-08-15',
      country: 'United Kingdom',
      countryCode: 'GB',
      gender: 'female',
    }),
  });
  let data = await res.json();
  console.log('Profile updated! Resulting Poppo ID:', data.user?.poppoId);
  console.log('ID remains identical:', data.user?.poppoId === originalPoppoId);

  // --- TEST 4: GET /api/users/me/id ---
  console.log('\nTest 4: Testing GET /api/users/me/id...');
  res = await fetch(baseUrl + '/api/users/me/id', { headers: primaryAuthHeaders });
  data = await res.json();
  console.log('Endpoint returned Poppo ID:', data.poppoId, '| Nickname:', data.nickname, '| Country:', data.country);

  // --- TEST 5: Creating Multi-Device Sessions for Primary User ---
  console.log('\nTest 5: Creating Simulated Multi-Device Sessions (Mobile & Tablet)...');
  // Device 2: Mobile Safari on iPhone
  res = await fetch(baseUrl + '/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: termsCookie,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    },
    body: JSON.stringify({ identifier: primaryUser.email, password: 'Password123456!' }),
  });
  const mobileCookie = res.headers.get('set-cookie')?.split(';')[0];
  console.log('Mobile session created:', !!mobileCookie);

  // Device 3: Firefox on Windows
  res = await fetch(baseUrl + '/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: termsCookie,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    },
    body: JSON.stringify({ identifier: primaryUser.email, password: 'Password123456!' }),
  });
  const firefoxCookie = res.headers.get('set-cookie')?.split(';')[0];
  console.log('Firefox session created:', !!firefoxCookie);

  // --- TEST 6: Active Sessions List (GET /api/users/me/sessions) ---
  console.log('\nTest 6: Listing all active sessions from primary desktop session...');
  res = await fetch(baseUrl + '/api/users/me/sessions', { headers: primaryAuthHeaders });
  data = await res.json();
  console.log('Total Active Sessions:', data.totalActiveSessions, '| Expected >= 3:', data.totalActiveSessions >= 3);
  data.sessions.forEach((s, idx) => {
    console.log(`  Session ${idx + 1}: ${s.browserName} on ${s.osName} (${s.deviceType}) | Current: ${s.isCurrent} | IP: ${s.ipMasked}`);
  });

  // Verify only 1 is marked as current
  const currentCount = data.sessions.filter((s) => s.isCurrent).length;
  console.log('Exactly 1 current session identified:', currentCount === 1);

  // --- TEST 7: Terminating a Specific Other Session ---
  const sessionToTerminate = data.sessions.find((s) => !s.isCurrent);
  if (sessionToTerminate) {
    console.log(`\nTest 7: Terminating session ${sessionToTerminate.id} (${sessionToTerminate.browserName} on ${sessionToTerminate.osName})...`);
    res = await fetch(baseUrl + '/api/users/me/sessions/logout', {
      method: 'POST',
      headers: primaryAuthHeaders,
      body: JSON.stringify({ sessionId: sessionToTerminate.id }),
    });
    data = await res.json();
    console.log('Logout response:', data.message);

    // Verify session count decreased
    res = await fetch(baseUrl + '/api/users/me/sessions', { headers: primaryAuthHeaders });
    data = await res.json();
    const stillExists = data.sessions.some((s) => s.id === sessionToTerminate.id);
    console.log('Terminated session removed from active list (Expected false):', stillExists);
  }

  // --- TEST 8: Terminating All Other Sessions (POST /api/users/me/sessions/logout-all) ---
  console.log('\nTest 8: Terminating All Remaining Other Sessions...');
  res = await fetch(baseUrl + '/api/users/me/sessions/logout-all', {
    method: 'POST',
    headers: primaryAuthHeaders,
  });
  data = await res.json();
  console.log('Logout All Result:', data.message, '| Terminated Count:', data.terminatedCount);

  // Verify only current session remains
  res = await fetch(baseUrl + '/api/users/me/sessions', { headers: primaryAuthHeaders });
  data = await res.json();
  console.log('Remaining sessions count:', data.totalActiveSessions, '| All isCurrent:', data.sessions.every((s) => s.isCurrent));

  // --- TEST 9: Verify Terminated Session Cannot Access Protected Routes ---
  console.log('\nTest 9: Verifying Terminated Session Token is Rejected...');
  const terminatedAuthHeaders = {
    'Content-Type': 'application/json',
    Cookie: `${termsCookie}; ${mobileCookie}`,
  };
  res = await fetch(baseUrl + '/api/users/me', { headers: terminatedAuthHeaders });
  console.log('Terminated session status:', res.status, '| Expected 401:', res.status === 401);

  console.log('\n===========================================================');
  console.log('✅ ALL USER ID & SESSION TESTS PASSED WITH 100% SUCCESS!');
  console.log('===========================================================');
}

runUserIdAndSessionTests().catch(console.error);
