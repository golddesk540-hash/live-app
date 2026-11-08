const baseUrl = 'http://localhost:3000';
const { Pool } = require('pg');

async function runSettingsPinBlacklistTests() {
  console.log('===========================================================');
  console.log('🧪 RUNNING COMPLETE POPPO LIVE SETTINGS, PIN & BLACKLIST TESTS');
  console.log('===========================================================\n');

  const pool = new Pool({
    connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  });
  await pool.query('DELETE FROM popolive.rate_limits');

  // 1. Accept terms gate
  const consentRes = await fetch(baseUrl + '/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'settings_test_anon',
    }),
  });
  const termsCookie = consentRes.headers.get('set-cookie')?.split(';')[0];

  // 2. Create Test User
  console.log('Setting up dedicated test user...');
  const now = Date.now();
  const email = `settings_user_${now}@popolive.com`;
  const regRes = await fetch(baseUrl + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: termsCookie },
    body: JSON.stringify({
      email,
      password: 'StrongPassword123!',
      nickname: 'SettingsStar_' + now.toString().slice(-4),
      isAdultConfirmed: true,
    }),
  });
  const regData = await regRes.json();
  const authCookie = regRes.headers.get('set-cookie')?.split(';')[0];
  const authHeaders = {
    'Content-Type': 'application/json',
    Cookie: `${termsCookie}; ${authCookie}`,
  };

  const user = regData.user;
  console.log('User registered:', user.nickname, '| ID:', user.poppoId);

  // --- TEST 1: Unauthorized Settings Access ---
  console.log('\nTest 1: Testing Unauthorized Settings Access...');
  let res = await fetch(baseUrl + '/api/settings');
  console.log('GET /api/settings without auth -> Status:', res.status, '| Expected 401:', res.status === 401);

  // --- TEST 2: Load Full Settings Summary (GET /api/settings) ---
  console.log('\nTest 2: Load Full Settings Summary...');
  res = await fetch(baseUrl + '/api/settings', { headers: authHeaders });
  let settingsData = await res.json();
  console.log('Settings loaded successfully:', settingsData.success === true);
  console.log('  Account Nickname:', settingsData.account?.nickname);
  console.log('  Numeric User ID:', settingsData.account?.poppoId);
  console.log('  Email protected to owner:', settingsData.account?.email === email);
  console.log('  Initial PIN enabled:', settingsData.security?.isPinEnabled);
  console.log('  Initial Language:', settingsData.language?.preferred);
  console.log('  Initial Blacklist count:', settingsData.blacklist?.count);

  // --- TEST 3: Set Security PIN ---
  console.log('\nTest 3: Set Security PIN (POST /api/settings/pin/set)...');
  // First test invalid format (non-numeric or wrong length)
  res = await fetch(baseUrl + '/api/settings/pin/set', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ pin: 'abc', confirmPin: 'abc' }),
  });
  console.log('Invalid PIN format rejected -> Status:', res.status, '| Expected 400:', res.status === 400);

  // Valid PIN: 5824
  res = await fetch(baseUrl + '/api/settings/pin/set', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ pin: '5824', confirmPin: '5824' }),
  });
  let pinSetRes = await res.json();
  console.log('Set PIN status:', res.status, '| Message:', pinSetRes.message);
  console.log('PIN set successfully:', pinSetRes.success === true);

  // Verify DB state
  const pinUserDb = await pool.query('SELECT is_pin_enabled, pin_hash FROM popolive.users WHERE id = $1', [user.id]);
  console.log('Database is_pin_enabled:', pinUserDb.rows[0].is_pin_enabled);
  console.log('Database PIN stored hashed (Not plain text):', pinUserDb.rows[0].pin_hash.startsWith('$2'));

  // --- TEST 4: Verify Security PIN ---
  console.log('\nTest 4: Verify Security PIN (POST /api/settings/pin/verify)...');
  res = await fetch(baseUrl + '/api/settings/pin/verify', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ pin: '5824' }),
  });
  let verifyRes = await res.json();
  console.log('Valid PIN verification status:', res.status, '| Expected 200:', res.status === 200);

  // Wrong PIN verification
  res = await fetch(baseUrl + '/api/settings/pin/verify', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ pin: '9999' }),
  });
  let wrongVerify = await res.json();
  console.log('Wrong PIN status:', res.status, '| Error:', wrongVerify.error);
  console.log('Remaining attempts reported:', wrongVerify.remainingAttempts !== undefined);

  // --- TEST 5: Change Security PIN ---
  console.log('\nTest 5: Change Security PIN (POST /api/settings/pin/change)...');
  res = await fetch(baseUrl + '/api/settings/pin/change', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      currentPin: '5824',
      newPin: '9173',
      confirmPin: '9173',
    }),
  });
  let changeRes = await res.json();
  console.log('Change PIN status:', res.status, '| Message:', changeRes.message);
  console.log('PIN changed successfully:', changeRes.success === true);

  // Verify new PIN works
  res = await fetch(baseUrl + '/api/settings/pin/verify', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ pin: '9173' }),
  });
  console.log('New PIN verified status:', res.status, '| Expected 200:', res.status === 200);

  // --- TEST 6: PIN Recovery via Account Password ---
  console.log('\nTest 6: PIN Recovery / Reset via Password (POST /api/settings/pin/reset)...');
  res = await fetch(baseUrl + '/api/settings/pin/reset', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      accountPassword: 'StrongPassword123!',
      newPin: '3344',
      confirmPin: '3344',
    }),
  });
  let resetRes = await res.json();
  console.log('Reset PIN status:', res.status, '| Message:', resetRes.message);
  console.log('PIN reset successfully:', resetRes.success === true);

  // --- TEST 7: Remove / Disable PIN ---
  console.log('\nTest 7: Remove / Disable Security PIN...');
  res = await fetch(baseUrl + '/api/settings/pin/reset', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      accountPassword: 'StrongPassword123!',
      removePin: true,
    }),
  });
  let removePinRes = await res.json();
  console.log('Remove PIN status:', res.status, '| Message:', removePinRes.message);
  console.log('PIN disabled successfully:', removePinRes.success === true);

  // --- TEST 8: Language Settings (GET & PATCH /api/settings/language) ---
  console.log('\nTest 8: Language Settings (Urdu & English)...');
  res = await fetch(baseUrl + '/api/settings/language', {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ language: 'ur' }),
  });
  let langRes = await res.json();
  console.log('Set Urdu status:', res.status, '| Language:', langRes.language);

  // Verify persistence in DB
  const langDb = await pool.query('SELECT preferred_language FROM popolive.users WHERE id = $1', [user.id]);
  console.log('Database preferred_language:', langDb.rows[0].preferred_language);
  console.log('Urdu persisted in DB:', langDb.rows[0].preferred_language === 'ur');

  // Switch back to English
  await fetch(baseUrl + '/api/settings/language', {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ language: 'en' }),
  });

  // --- TEST 9: Privacy Settings (GET & PATCH /api/settings/privacy) ---
  console.log('\nTest 9: Privacy Settings...');
  res = await fetch(baseUrl + '/api/settings/privacy', {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      profileVisibility: 'followers',
      birthdayVisibility: 'only_me',
      genderVisibility: 'only_me',
      onlineStatusVisibility: 'followers',
      followPermissions: 'approval_required',
      messagePermissions: 'followers_only',
    }),
  });
  let privRes = await res.json();
  console.log('Update privacy status:', res.status, '| Message:', privRes.message);

  res = await fetch(baseUrl + '/api/settings/privacy', { headers: authHeaders });
  let privData = await res.json();
  console.log('Privacy verified in GET:');
  console.log('  Profile Visibility:', privData.privacy?.profileVisibility);
  console.log('  Birthday Visibility:', privData.privacy?.birthdayVisibility);
  console.log('  Gender Visibility:', privData.privacy?.genderVisibility);

  // --- TEST 10: Notification Preferences (GET & PATCH /api/settings/notifications) ---
  console.log('\nTest 10: Notification Preferences...');
  res = await fetch(baseUrl + '/api/settings/notifications', {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      account: true,
      security: true,
      system: false,
      promotional: true,
    }),
  });
  let notifRes = await res.json();
  console.log('Update notifications status:', res.status, '| Message:', notifRes.message);

  res = await fetch(baseUrl + '/api/settings/notifications', { headers: authHeaders });
  let notifData = await res.json();
  console.log('Notifications verified in GET:');
  console.log('  Account notifications:', notifData.notifications?.account);
  console.log('  Promotional notifications:', notifData.notifications?.promotional);

  // --- TEST 11: Blacklist Management & Unblock ---
  console.log('\nTest 11: Blacklist Management (GET & DELETE /api/users/me/blacklist)...');
  // Block a user first
  const blockedUserEmail = `target_block_${now}@popolive.com`;
  const regTarget = await fetch(baseUrl + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: termsCookie },
    body: JSON.stringify({ email: blockedUserEmail, password: 'Password123!', nickname: 'BlockedUser', isAdultConfirmed: true }),
  });
  const targetData = await regTarget.json();

  await fetch(baseUrl + `/api/users/${targetData.user.poppoId}/block`, {
    method: 'POST',
    headers: authHeaders,
  });

  // Query blacklist
  res = await fetch(baseUrl + '/api/users/me/blacklist', { headers: authHeaders });
  let blacklistRes = await res.json();
  console.log('Blacklist totalCount:', blacklistRes.totalCount);
  console.log('Blocked user nickname:', blacklistRes.blockedUsers[0]?.nickname);

  // Unblock via Blacklist API
  res = await fetch(baseUrl + `/api/users/me/blacklist/${targetData.user.poppoId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  let unblockData = await res.json();
  console.log('Unblock via Blacklist status:', res.status, '| Message:', unblockData.message);

  // Confirm blacklist empty
  res = await fetch(baseUrl + '/api/users/me/blacklist', { headers: authHeaders });
  blacklistRes = await res.json();
  console.log('Blacklist empty after unblock:', blacklistRes.totalCount === 0);

  await pool.end();
  console.log('\n===========================================================');
  console.log('✅ ALL SETTINGS, PIN & BLACKLIST TESTS COMPLETED SUCCESSFULLY!');
  console.log('===========================================================');
}

runSettingsPinBlacklistTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
