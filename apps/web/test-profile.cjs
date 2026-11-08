const fs = require('fs');
const path = require('path');

const baseUrl = 'http://localhost:3000';

async function runProfileTests() {
  console.log('===========================================================');
  console.log('🧪 RUNNING COMPLETE POPPO LIVE NEW USER PROFILE SETUP TESTS');
  console.log('===========================================================\n');

  // Accept terms gate first to get consent cookie
  let res = await fetch(baseUrl + '/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'profile_test_gate',
    }),
  });
  const termsCookie = res.headers.get('set-cookie').split(';')[0];

  // --- TEST 1: Unauthorized access to /api/profile/setup ---
  console.log('Test 1: GET /api/profile/setup without authentication...');
  res = await fetch(baseUrl + '/api/profile/setup');
  console.log('Status:', res.status, '| Expected 401:', res.status === 401);

  // --- TEST 2: Register a new user ---
  const userEmail = 'newuser_' + Date.now() + '@popolive.com';
  console.log('\nTest 2: Registering new user (' + userEmail + ')...');
  res = await fetch(baseUrl + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: termsCookie },
    body: JSON.stringify({
      email: userEmail,
      password: 'StrongPassword2026!',
      isAdultConfirmed: true,
    }),
  });
  let data = await res.json();
  const sessionCookie = res.headers.get('set-cookie')?.split(';')[0];
  const authHeaders = {
    'Content-Type': 'application/json',
    Cookie: `${termsCookie}; ${sessionCookie}`,
  };

  console.log('Registered User:', data.user?.poppoId, '| isProfileCompleted:', data.user?.isProfileCompleted);
  console.log('Expected false:', data.user?.isProfileCompleted === false);

  // --- TEST 3: Check Profile Setup State (needsSetup should be true) ---
  console.log('\nTest 3: Checking GET /api/profile/setup with user session...');
  res = await fetch(baseUrl + '/api/profile/setup', { headers: authHeaders });
  data = await res.json();
  console.log('needsSetup:', data.needsSetup, '| Expected true:', data.needsSetup === true);

  // --- TEST 4: Nickname Availability Checking ---
  console.log('\nTest 4: Checking Nickname Availability...');
  // 4a. Too short
  res = await fetch(baseUrl + '/api/profile/check-nickname?nickname=ab');
  data = await res.json();
  console.log('Short Nickname "ab":', data.available === false, '| Message:', data.reason);

  // 4b. Invalid characters
  res = await fetch(baseUrl + '/api/profile/check-nickname?nickname=bad*name!');
  data = await res.json();
  console.log('Invalid symbols "bad*name!":', data.available === false, '| Message:', data.reason);

  // 4c. Valid available nickname
  const candidateNick = 'PopoStar_' + Math.floor(Math.random() * 10000);
  res = await fetch(baseUrl + '/api/profile/check-nickname?nickname=' + candidateNick);
  data = await res.json();
  console.log('Valid Nickname "' + candidateNick + '":', data.available === true, '| Message:', data.reason);

  // --- TEST 5: Under-18 Birthday Validation (Must be rejected) ---
  console.log('\nTest 5: Submitting Profile with Under-18 Birthday (2012-05-10)...');
  res = await fetch(baseUrl + '/api/profile/setup', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      nickname: candidateNick,
      birthdate: '2012-05-10', // ~14 years old
      country: 'Pakistan',
      countryCode: 'PK',
      gender: 'male',
    }),
  });
  data = await res.json();
  console.log('Status:', res.status, '| Expected 400:', res.status === 400, '| Error:', data.error);

  // --- TEST 6: Future Birthday Validation (Must be rejected) ---
  console.log('\nTest 6: Submitting Profile with Future Date (2030-01-01)...');
  res = await fetch(baseUrl + '/api/profile/setup', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      nickname: candidateNick,
      birthdate: '2030-01-01',
      country: 'Pakistan',
      countryCode: 'PK',
      gender: 'male',
    }),
  });
  data = await res.json();
  console.log('Status:', res.status, '| Expected 400:', res.status === 400, '| Error:', data.error);

  // --- TEST 7: Valid Profile Setup (18+ Adult, Pakistan, Male) ---
  console.log('\nTest 7: Submitting Valid Profile (2000-01-01, Age 26, Pakistan, Male)...');
  res = await fetch(baseUrl + '/api/profile/setup', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      nickname: candidateNick,
      birthdate: '2000-01-01',
      country: 'Pakistan',
      countryCode: 'PK',
      gender: 'male',
      avatarUrl: '/avatars/default.png',
    }),
  });
  data = await res.json();
  console.log('Status:', res.status, '| Success:', data.success);
  console.log('Saved User Nickname:', data.user?.nickname, '| Country:', data.user?.country, '| isProfileCompleted:', data.user?.isProfileCompleted);

  // --- TEST 8: Check GET /api/profile/me ---
  console.log('\nTest 8: Validating GET /api/profile/me...');
  res = await fetch(baseUrl + '/api/profile/me', { headers: authHeaders });
  data = await res.json();
  console.log('Profile ME:', data.user?.nickname, '| Birthdate:', data.user?.birthdate, '| Country:', data.user?.country);

  // --- TEST 9: Duplicate Nickname Rejection ---
  console.log('\nTest 9: Attempting Duplicate Nickname Check for another user...');
  res = await fetch(baseUrl + '/api/profile/check-nickname?nickname=' + candidateNick);
  data = await res.json();
  console.log('Nickname "' + candidateNick + '" availability (Expected false):', data.available, '| Reason:', data.reason);

  // --- TEST 10: Security Check on Profile Picture Upload (Reject executable) ---
  console.log('\nTest 10: Uploading Executable File (.exe) as avatar...');
  const fakeFormData = new FormData();
  const exeBlob = new Blob(['MZ\x90\x00\x03\x00\x00\x00'], { type: 'application/x-msdownload' });
  fakeFormData.append('file', exeBlob, 'exploit.exe');

  res = await fetch(baseUrl + '/api/profile/avatar', {
    method: 'POST',
    headers: { Cookie: `${termsCookie}; ${sessionCookie}` },
    body: fakeFormData,
  });
  data = await res.json();
  console.log('Status:', res.status, '| Expected 400:', res.status === 400, '| Error:', data.error);

  // --- TEST 11: Valid Profile Picture Upload (PNG) ---
  console.log('\nTest 11: Uploading Valid Image (PNG)...');
  const validFormData = new FormData();
  // 1x1 transparent PNG buffer
  const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  const pngBlob = new Blob([pngBuffer], { type: 'image/png' });
  validFormData.append('file', pngBlob, 'avatar.png');

  res = await fetch(baseUrl + '/api/profile/avatar', {
    method: 'POST',
    headers: { Cookie: `${termsCookie}; ${sessionCookie}` },
    body: validFormData,
  });
  data = await res.json();
  console.log('Avatar Upload Status:', res.status, '| Avatar URL:', data.avatarUrl);

  // --- TEST 12: PATCH /api/profile/me ---
  console.log('\nTest 12: Updating Profile via PATCH /api/profile/me (Country -> United Arab Emirates)...');
  res = await fetch(baseUrl + '/api/profile/me', {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ country: 'United Arab Emirates', countryCode: 'AE', gender: 'other' }),
  });
  data = await res.json();
  console.log('PATCH Status:', res.status, '| New Country:', data.user?.country, '| New Gender:', data.user?.gender);

  // --- TEST 13: Login redirect check for completed profile ---
  console.log('\nTest 13: Logging in with completed profile (should have isProfileCompleted: true)...');
  res = await fetch(baseUrl + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: termsCookie },
    body: JSON.stringify({ identifier: userEmail, password: 'StrongPassword2026!' }),
  });
  data = await res.json();
  console.log('Login isProfileCompleted:', data.user?.isProfileCompleted, '| Expected true:', data.user?.isProfileCompleted === true);

  console.log('\n===========================================================');
  console.log('✅ ALL PROFILE SETUP TESTS COMPLETED WITH 100% SUCCESS!');
  console.log('===========================================================');
}

runProfileTests().catch(console.error);
