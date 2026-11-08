const http = require('http');

const BASE_URL = 'http://localhost:3000';

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
  console.log('🧪 RUNNING POPO LIVE PHASE 2 PROMPT 09 TEST SUITE');
  console.log('=======================================================\n');

  let passed = 0;

  // 1. Check Frontend Page Route
  console.log('--- TEST GROUP 1: WEB ACCOUNT PAGE ---');
  const pageRes = await request({ path: '/account' });
  assert(pageRes.statusCode === 200, 'Page /account returns HTTP 200 OK');
  passed++;

  // 2. Unauthorized Checks
  console.log('\n--- TEST GROUP 2: UNAUTHORIZED ACCESS PROTECTION ---');
  const unauthAccount = await request({ path: '/api/account' });
  assert(unauthAccount.statusCode === 401, 'GET /api/account without auth returns 401');

  const unauthSecurity = await request({ path: '/api/account/security' });
  assert(unauthSecurity.statusCode === 401, 'GET /api/account/security without auth returns 401');

  const unauthSessions = await request({ path: '/api/account/sessions' });
  assert(unauthSessions.statusCode === 401, 'GET /api/account/sessions without auth returns 401');
  passed += 3;

  // 3. User Setup (Consent + Registration)
  console.log('\n--- TEST GROUP 3: AUTHENTICATED USER SESSION ---');
  const consentRes = await request(
    { path: '/api/consent', method: 'POST' },
    {
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'web_account_test_' + Date.now(),
    }
  );
  const termsCookie = consentRes.headers['set-cookie']?.find(c => c.startsWith('poppo_terms_consent='))?.split(';')[0];
  assert(Boolean(termsCookie), 'Consent cookie obtained');

  const now = Date.now();
  const testEmail = `web_account_${now}@popolive.com`;
  const initialPassword = 'InitialPassword123!';
  const regRes = await request(
    {
      path: '/api/auth/register',
      method: 'POST',
      headers: { Cookie: termsCookie },
    },
    {
      email: testEmail,
      password: initialPassword,
      nickname: 'WebStar_' + String(now).slice(-4),
      isAdultConfirmed: true,
    }
  );
  assert(regRes.statusCode === 200, 'Test user registered');
  const authCookie = regRes.headers['set-cookie']?.find(c => c.startsWith('poppo_session='))?.split(';')[0];
  assert(Boolean(authCookie), 'Session cookie obtained');

  const authHeader = { Cookie: `${termsCookie}; ${authCookie}` };
  const user = regRes.json?.user;
  passed += 3;

  // 4. GET /api/account
  console.log('\n--- TEST GROUP 4: ACCOUNT OVERVIEW API ---');
  const accountRes = await request({ path: '/api/account', headers: authHeader });
  assert(accountRes.statusCode === 200, 'GET /api/account returns 200 OK');
  assert(accountRes.json?.account?.poppoId === user.poppoId, 'Permanent numeric User ID matches database');
  assert(accountRes.json?.account?.nickname === user.nickname, 'User nickname matches database');
  assert(accountRes.json?.verification?.isEmailVerified === true, 'Email verification flag present');
  assert(typeof accountRes.json?.account?.profileCompletionPercent === 'number', 'Profile completion percentage calculated');
  passed += 5;

  // 5. PATCH /api/account (Update Profile Info)
  console.log('\n--- TEST GROUP 5: UPDATE ACCOUNT INFORMATION ---');
  const updatedNick = 'NewNick_' + String(now).slice(-4);
  const updateRes = await request(
    { path: '/api/account', method: 'PATCH', headers: authHeader },
    {
      nickname: updatedNick,
      bio: 'Professional Web Streamer & Content Creator',
      country: 'Pakistan',
      gender: 'female',
    }
  );
  assert(updateRes.statusCode === 200, 'PATCH /api/account returns 200 OK');
  assert(updateRes.json?.user?.nickname === updatedNick, 'Updated nickname saved in database');
  assert(updateRes.json?.user?.bio?.includes('Professional Web Streamer'), 'Updated bio saved in database');

  // First register or pick an existing nickname to test collision
  const collisionNick = 'UniqueUser_' + String(now).slice(-4);
  await request(
    { path: '/api/account', method: 'PATCH', headers: authHeader },
    { nickname: collisionNick }
  );

  // Validate duplicate nickname check or validation error
  const duplicateRes = await request(
    { path: '/api/account', method: 'PATCH', headers: authHeader },
    { nickname: 'invalid nickname with spaces' }
  );
  assert(duplicateRes.statusCode === 400 || duplicateRes.statusCode === 409, 'Nickname validation or collision handled (got ' + duplicateRes.statusCode + ')');
  passed += 4;

  // 6. Security Overview & Password Change
  console.log('\n--- TEST GROUP 6: SECURITY MANAGEMENT & PASSWORD CHANGE ---');
  const secRes = await request({ path: '/api/account/security', headers: authHeader });
  assert(secRes.statusCode === 200, 'GET /api/account/security returns 200 OK');
  assert(secRes.json?.security?.hasPassword === true, 'User has password flag is true');

  // Change password with wrong old password
  const badPassRes = await request(
    { path: '/api/account/password/change', method: 'POST', headers: authHeader },
    { currentPassword: 'WrongPassword999!', newPassword: 'BrandNewPassword123!' }
  );
  assert(badPassRes.statusCode === 400, 'Incorrect current password rejected with 400');

  // Change password with correct old password
  const goodPassRes = await request(
    { path: '/api/account/password/change', method: 'POST', headers: authHeader },
    { currentPassword: initialPassword, newPassword: 'BrandNewPassword123!' }
  );
  assert(goodPassRes.statusCode === 200, 'Password changed successfully with 200 OK');
  passed += 4;

  // 7. Verification Status
  console.log('\n--- TEST GROUP 7: ACCOUNT VERIFICATION STATUS ---');
  const verifRes = await request({ path: '/api/account/verification', headers: authHeader });
  assert(verifRes.statusCode === 200, 'GET /api/account/verification returns 200 OK');
  assert(Boolean(verifRes.json?.email?.isVerified), 'Email verification reported correctly');
  assert(Boolean(verifRes.json?.identity?.isAdultVerified), '18+ adult compliance status verified');
  passed += 3;

  // 8. Account Preferences (Timezone, Language, Stream Quality)
  console.log('\n--- TEST GROUP 8: ACCOUNT PREFERENCES ---');
  const prefRes = await request(
    { path: '/api/account/preferences', method: 'PATCH', headers: authHeader },
    {
      timezone: 'Asia/Karachi (UTC+5)',
      displayTheme: 'dark',
      streamQuality: '1080p',
      language: 'ur',
    }
  );
  assert(prefRes.statusCode === 200, 'PATCH /api/account/preferences returns 200 OK');

  // Switch back to 'en'
  await request(
    { path: '/api/account/preferences', method: 'PATCH', headers: authHeader },
    { language: 'en' }
  );
  passed += 1;

  // 9. Active Sessions & Logout All
  console.log('\n--- TEST GROUP 9: ACTIVE SESSIONS & REVOCATION ---');
  const sessRes = await request({ path: '/api/account/sessions', headers: authHeader });
  assert(sessRes.statusCode === 200, 'GET /api/account/sessions returns 200 OK');
  assert(Array.isArray(sessRes.json?.sessions), 'Active sessions array returned');
  assert(sessRes.json.sessions.some(s => s.isCurrent === true), 'Current session highlighted');

  const logoutAllRes = await request({ path: '/api/account/logout-all', method: 'POST', headers: authHeader });
  assert(logoutAllRes.statusCode === 200, 'POST /api/account/logout-all returns 200 OK');
  passed += 4;

  // 10. Account Activity Audit Log
  console.log('\n--- TEST GROUP 10: ACCOUNT ACTIVITY AUDIT LOG ---');
  const actRes = await request({ path: '/api/account/activity', headers: authHeader });
  assert(actRes.statusCode === 200, 'GET /api/account/activity returns 200 OK');
  assert(Array.isArray(actRes.json?.activities), 'Activities timeline array returned');
  assert(actRes.json.activities.length > 0, 'Security events and login actions recorded in activity timeline');
  passed += 3;

  // 11. Current Session Logout
  console.log('\n--- TEST GROUP 11: SESSION LOGOUT ---');
  const logoutRes = await request({ path: '/api/account/logout', method: 'POST', headers: authHeader });
  assert(logoutRes.statusCode === 200, 'POST /api/account/logout returns 200 OK');

  // Verify that former session is now rejected
  const revokedAccess = await request({ path: '/api/account', headers: authHeader });
  assert(revokedAccess.statusCode === 401, 'Logged out session cookie is rejected with 401');
  passed += 2;

  console.log('\n=======================================================');
  console.log(`🎉 ALL ${passed} AUTOMATED VERIFICATION TESTS PASSED SUCCESSFULLY!`);
  console.log('=======================================================');
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed with exception:', err);
  process.exit(1);
});
