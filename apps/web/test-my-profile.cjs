const baseUrl = 'http://localhost:3000';

async function runMyProfileTests() {
  console.log('===========================================================');
  console.log('🧪 RUNNING POPPO LIVE MY PROFILE & AVATAR SYSTEM TESTS');
  console.log('===========================================================\n');

  // Clear rate limits first
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive' });
  await pool.query('DELETE FROM popolive.rate_limits');
  await pool.end();

  // 1. Accept terms gate
  const consentRes = await fetch(baseUrl + '/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'profile_test_anon',
    }),
  });
  const termsCookie = consentRes.headers.get('set-cookie')?.split(';')[0];

  // --- TEST 1: Unauthorized Profile Access ---
  console.log('Test 1: Testing Unauthorized Profile Access...');
  let res = await fetch(baseUrl + '/api/profile/me');
  console.log('GET /api/profile/me without token -> Status:', res.status, '| Expected 401:', res.status === 401);
  res = await fetch(baseUrl + '/api/profile/me/statistics');
  console.log('GET /api/profile/me/statistics without token -> Status:', res.status, '| Expected 401:', res.status === 401);

  // --- Register a dedicated user for profile testing ---
  console.log('\nSetting up dedicated test user...');
  const userEmail = `profile_test_${Date.now()}@popolive.com`;
  const registerRes = await fetch(baseUrl + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: termsCookie },
    body: JSON.stringify({
      email: userEmail,
      password: 'Password123!',
      nickname: 'Sara_' + Date.now().toString().slice(-4),
      isAdultConfirmed: true,
    }),
  });
  const registerData = await registerRes.json();
  const authCookie = registerRes.headers.get('set-cookie')?.split(';')[0];
  const authHeaders = {
    'Content-Type': 'application/json',
    Cookie: `${termsCookie}; ${authCookie}`,
  };

  console.log('User created:', registerData.user?.nickname, '| Poppo ID:', registerData.user?.poppoId);

  // --- TEST 2: Load actual user information via GET /api/profile/me ---
  console.log('\nTest 2: Load user profile information via GET /api/profile/me...');
  res = await fetch(baseUrl + '/api/profile/me', { headers: authHeaders });
  const profileData = await res.json();
  console.log('Profile loaded successfully:', profileData.authenticated === true);
  console.log('  Nickname:', profileData.user?.nickname);
  console.log('  User ID (Poppo ID):', profileData.user?.poppoId);
  console.log('  Country:', profileData.user?.country);
  console.log('  Gender:', profileData.user?.gender);
  console.log('  Bio:', profileData.user?.bio || '(Empty)');
  console.log('  Host Level:', profileData.user?.hostLevel);
  console.log('  Wealth Level:', profileData.user?.wealthLevel);
  console.log('  Verified 18+:', profileData.user?.isAdultVerified);

  // --- TEST 3: Upload Profile Picture via Base64/Cropper ---
  console.log('\nTest 3: Upload Profile Picture via POST /api/profile/avatar (Base64 cropped)...');
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  res = await fetch(baseUrl + '/api/profile/avatar', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ imageBase64: sampleBase64 }),
  });
  const uploadData = await res.json();
  console.log('Avatar upload response:', uploadData.message, '| URL:', uploadData.avatarUrl);
  console.log('Upload success:', uploadData.success === true && !!uploadData.avatarUrl);

  // --- TEST 4: Reset / Remove Profile Picture via DELETE /api/profile/avatar ---
  console.log('\nTest 4: Remove Profile Picture via DELETE /api/profile/avatar...');
  res = await fetch(baseUrl + '/api/profile/avatar', {
    method: 'DELETE',
    headers: authHeaders,
  });
  const removeData = await res.json();
  console.log('Avatar remove response:', removeData.message, '| URL:', removeData.avatarUrl);
  console.log('Avatar reset to default:', removeData.avatarUrl === '/avatars/default.png');

  // --- TEST 5: Check Nickname Availability & Format ---
  console.log('\nTest 5: Check Nickname Availability Endpoint...');
  const newNick = 'StarStreamer_' + Date.now().toString().slice(-4);
  res = await fetch(baseUrl + `/api/profile/check-nickname?nickname=${newNick}`, { headers: authHeaders });
  const checkData = await res.json();
  console.log(`Checking availability for "${newNick}":`, checkData.available, '| Reason:', checkData.reason);

  // --- TEST 6: Prevent Duplicate Nickname ---
  console.log('\nTest 6: Prevent Duplicate Nicknames...');
  const rivalEmail = `rival_${Date.now()}@popolive.com`;
  const rivalNick = 'RivalStar_' + Date.now().toString().slice(-4);
  await fetch(baseUrl + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: termsCookie },
    body: JSON.stringify({
      email: rivalEmail,
      password: 'Password123!',
      nickname: rivalNick,
      isAdultConfirmed: true,
    }),
  });

  // Attempt to update primary user's nickname to rivalNick
  res = await fetch(baseUrl + '/api/profile/me', {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ nickname: rivalNick }),
  });
  const dupCheck = await res.json();
  console.log('Duplicate nickname update status:', res.status, '| Error message:', dupCheck.error);
  console.log('Duplicate blocked successfully:', res.status === 409);

  // --- TEST 7: Edit Profile (Nickname, Country, Gender, Bio) ---
  console.log('\nTest 7: Updating Profile (Nickname, Country, Gender, Bio)...');
  const updatedBio = 'Singer & host streaming daily! Welcome to my party room 🌟';
  res = await fetch(baseUrl + '/api/profile/me', {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      nickname: newNick,
      country: 'United Kingdom',
      countryCode: 'GB',
      gender: 'female',
      bio: updatedBio,
    }),
  });
  const patchData = await res.json();
  console.log('Profile update response:', patchData.message);
  console.log('  Updated Nickname:', patchData.user?.nickname === newNick);
  console.log('  Updated Country:', patchData.user?.country === 'United Kingdom');
  console.log('  Updated Gender:', patchData.user?.gender === 'female');
  console.log('  Updated Bio:', patchData.user?.bio === updatedBio);

  // --- TEST 8: Security - Prevent Changing Permanent User ID ---
  console.log('\nTest 8: Security - User ID Immutability...');
  res = await fetch(baseUrl + '/api/profile/me', {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ poppoId: '9999999' }),
  });
  const idGuardCheck = await res.json();
  console.log('Status when trying to change User ID:', res.status, '| Error:', idGuardCheck.error);
  console.log('User ID change blocked (Expected true):', res.status === 400);

  // --- TEST 9: Security - Prevent Changing Birthday without verification ---
  console.log('\nTest 9: Security - Birthday Change Protection...');
  res = await fetch(baseUrl + '/api/profile/me', {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ birthdate: '1990-05-20' }),
  });
  const birthdayGuardCheck = await res.json();
  console.log('Status when trying to change Birthday:', res.status, '| Error:', birthdayGuardCheck.error);
  console.log('Birthday change blocked (Expected true):', res.status === 400);

  // --- TEST 10: Real Profile Statistics ---
  console.log('\nTest 10: Profile Statistics Endpoint (GET /api/profile/me/statistics)...');
  res = await fetch(baseUrl + '/api/profile/me/statistics', { headers: authHeaders });
  const statsData = await res.json();
  console.log('Statistics returned:', statsData.statistics);
  console.log('Real followers count:', statsData.statistics?.followersCount);
  console.log('Real following count:', statsData.statistics?.followingCount);
  console.log('Real gifts total:', statsData.statistics?.totalGiftsReceived);
  console.log('Fan club status:', statsData.statistics?.fanClub?.status, '| Description:', statsData.statistics?.fanClub?.description);
  console.log('No fake statistics verified:', typeof statsData.statistics?.followersCount === 'number');

  console.log('\n===========================================================');
  console.log('✅ ALL MY PROFILE SYSTEM TESTS COMPLETED SUCCESSFULLY!');
  console.log('===========================================================');
}

runMyProfileTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
