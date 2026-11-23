/**
 * ============================================================================
 * POPO LIVE — PHASE B3 PROMPT 1 OF 4: MY PROFILE API AUDIT SUITE
 * Master Plan Reference: POPO-LIVE-BACKEND-REALTIME-PLAN.pdf (Phase B3, pages 3–4)
 *
 * Comprehensive Verification of 15 Tests:
 *  1. GET profile with valid session
 *  2. GET profile without authentication (401)
 *  3. GET profile with expired session (401)
 *  4. GET profile with revoked session (401)
 *  5. PATCH valid profile fields (nickname, bio, country, gender)
 *  6. PATCH invalid profile fields (short nickname, long bio, invalid gender, minor birthdate)
 *  7. Attempt to modify another user's profile (403)
 *  8. Attempt to modify restricted fields (400)
 *  9. Recognition level retrieval (wealth, shining, honor, host)
 * 10. Wallet count retrieval (coins, diamond_points)
 * 11. Database-derived profile counts (friends, following, followers, visitors)
 * 12. Mobile profile loading wiring
 * 13. Web profile loading wiring
 * 14. No fixture fallback when enabled
 * 15. Fixture behavior when profile flag is OFF
 * ============================================================================
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Pool } = require(path.resolve(__dirname, 'apps/web/node_modules/pg'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public',
});

let testsPassed = 0;
let testsFailed = 0;
const cleanupUserIds = [];

function check(condition, desc) {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${desc}`);
    testsFailed++;
  }
}

async function runProfileSuite() {
  console.log('======================================================================');
  console.log('POPO LIVE: B3 PROMPT 1 MY PROFILE API — GET/PATCH DATABASE AUDIT');
  console.log('======================================================================\n');

  // Verify DB connectivity
  const dbCheck = await pool.query('SELECT NOW() as now');
  check(Boolean(dbCheck.rows[0].now), 'PostgreSQL database connected (popolive schema)');

  // Import Next.js route handlers and auth utilities
  const { GET: getProfileHandler, PATCH: patchProfileHandler } = await import('./apps/web/app/api/profiles/me/route.ts');
  const { hashPassword, createSession, destroySession } = await import('./apps/web/lib/auth.ts');
  const { createConsentToken, CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } = await import('./apps/web/lib/consentStore.ts');
  const { NextRequest } = require(path.resolve(__dirname, 'apps/web/node_modules/next/server'));

  const validConsentToken = createConsentToken({
    consentId: 'cs_test_b3_p1',
    anonymousSessionId: 'anon_sess_b3_p1',
    termsVersion: CURRENT_TERMS_VERSION,
    privacyVersion: CURRENT_PRIVACY_VERSION,
    status: 'accepted',
    timestamp: Date.now(),
  });

  function makeRequest(url, method = 'GET', body = null, token = null) {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
    });
    const cookies = {
      poppo_terms_consent: validConsentToken,
    };
    if (token) {
      cookies['poppo_session'] = token;
      headers.set('authorization', `Bearer ${token}`);
    }
    const cookiePairs = Object.entries(cookies).map(([k, v]) => `${k}=${v}`);
    headers.set('cookie', cookiePairs.join('; '));

    return new NextRequest(new URL(url, 'http://localhost:3000'), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // 1. Setup Test Users in Database
  const testEmailA = `b3_profile_a_${Date.now()}@popolive.internal`;
  const testPhoneA = `+92301${Math.floor(1000000 + Math.random() * 9000000)}`;
  const poppoIdA = `poppo_${Math.floor(100000 + Math.random() * 900000)}`;
  const passHash = await hashPassword('PopoLivePassword123!');

  const userARes = await pool.query(
    `INSERT INTO popolive.users (
      poppo_id, email, phone, password_hash, nickname, birthdate, gender, country, country_code, is_adult_verified, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
    RETURNING id`,
    [poppoIdA, testEmailA, testPhoneA, passHash, 'Original Nickname', '1996-06-15', 'male', 'Pakistan', 'PK', true]
  );
  const userAId = userARes.rows[0].id;
  cleanupUserIds.push(userAId);

  const testEmailB = `b3_profile_b_${Date.now()}@popolive.internal`;
  const testPhoneB = `+92301${Math.floor(1000000 + Math.random() * 9000000)}`;
  const poppoIdB = `poppo_${Math.floor(100000 + Math.random() * 900000)}`;
  const userBRes = await pool.query(
    `INSERT INTO popolive.users (
      poppo_id, email, phone, password_hash, nickname, birthdate, gender, country, country_code, is_adult_verified, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
    RETURNING id`,
    [poppoIdB, testEmailB, testPhoneB, passHash, 'Friend User B', '1998-08-20', 'female', 'Pakistan', 'PK', true]
  );
  const userBId = userBRes.rows[0].id;
  cleanupUserIds.push(userBId);

  // Setup valid session for User A
  const { sessionToken: sessionTokenA } = await createSession(userAId);

  // ========================================================================
  // TEST 1: GET profile with valid session
  // ========================================================================
  console.log('\n--- TEST 1: GET profile with valid session ---');
  const req1 = makeRequest('http://localhost:3000/api/profiles/me', 'GET', null, sessionTokenA);
  const res1 = await getProfileHandler(req1);
  const body1 = await res1.json();
  if (res1.status !== 200) {
    console.log('TEST 1 FAILED! status:', res1.status, 'body:', body1);
  }

  check(res1.status === 200, 'Test 1.1: GET /api/profiles/me returns HTTP 200 with valid session');
  check(body1.success === true, 'Test 1.2: Response body contains success: true');
  check(body1.profile && body1.profile.id === userAId, 'Test 1.3: Profile belongs to authenticated user ID');
  check(body1.profile.nickname === 'Original Nickname', 'Test 1.4: Correct nickname retrieved from database');
  check(body1.profile.poppoId === poppoIdA, 'Test 1.5: Correct poppoId retrieved from database');

  // ========================================================================
  // TEST 2: GET profile without authentication (401)
  // ========================================================================
  console.log('\n--- TEST 2: GET profile without authentication ---');
  const req2 = makeRequest('http://localhost:3000/api/profiles/me', 'GET', null, null);
  const res2 = await getProfileHandler(req2);
  const body2 = await res2.json();

  check(res2.status === 401, 'Test 2.1: GET /api/profiles/me without auth returns HTTP 401');
  check(body2.success === false, 'Test 2.2: Response indicates success: false');
  check(body2.code === 'UNAUTHORIZED', 'Test 2.3: Error code is UNAUTHORIZED');

  // ========================================================================
  // TEST 3: GET profile with expired session (401)
  // ========================================================================
  console.log('\n--- TEST 3: GET profile with expired session ---');
  const expiredToken = crypto.randomBytes(32).toString('hex');
  await pool.query(
    `INSERT INTO popolive.sessions (user_id, session_token, expires_at, is_revoked)
     VALUES ($1, $2, NOW() - INTERVAL '1 day', false)`,
    [userAId, expiredToken]
  );
  const req3 = makeRequest('http://localhost:3000/api/profiles/me', 'GET', null, expiredToken);
  const res3 = await getProfileHandler(req3);
  const body3 = await res3.json();

  check(res3.status === 401, 'Test 3.1: Expired session returns HTTP 401');
  check(body3.code === 'UNAUTHORIZED', 'Test 3.2: Error code is UNAUTHORIZED');

  // ========================================================================
  // TEST 4: GET profile with revoked session (401)
  // ========================================================================
  console.log('\n--- TEST 4: GET profile with revoked session ---');
  const { sessionToken: revokedToken } = await createSession(userAId);
  await destroySession(revokedToken); // revokes in DB
  const req4 = makeRequest('http://localhost:3000/api/profiles/me', 'GET', null, revokedToken);
  const res4 = await getProfileHandler(req4);
  const body4 = await res4.json();

  check(res4.status === 401, 'Test 4.1: Revoked session returns HTTP 401');
  check(body4.code === 'UNAUTHORIZED', 'Test 4.2: Revoked session error code is UNAUTHORIZED');

  // ========================================================================
  // TEST 5: PATCH valid profile fields (nickname, bio, country, gender)
  // ========================================================================
  console.log('\n--- TEST 5: PATCH valid profile fields ---');
  const patchPayload = {
    nickname: 'Updated Pro Host',
    bio: 'Official live streamer bio for verification testing.',
    gender: 'female',
    country: 'United States',
    countryCode: 'US',
  };
  const req5 = makeRequest('http://localhost:3000/api/profiles/me', 'PATCH', patchPayload, sessionTokenA);
  const res5 = await patchProfileHandler(req5);
  const body5 = await res5.json();

  check(res5.status === 200, 'Test 5.1: PATCH /api/profiles/me with valid fields returns HTTP 200');
  check(body5.success === true, 'Test 5.2: Success true returned');
  check(body5.profile.nickname === 'Updated Pro Host', 'Test 5.3: Profile nickname updated in database');
  check(body5.profile.bio === 'Official live streamer bio for verification testing.', 'Test 5.4: Profile bio updated');
  check(body5.profile.gender === 'female', 'Test 5.5: Profile gender updated');
  check(body5.profile.countryCode === 'US', 'Test 5.6: Country code updated to US');
  check(body5.profile.flagEmoji === '🇺🇸', 'Test 5.7: Flag emoji updated to 🇺🇸 for US');

  // Verify directly from PostgreSQL
  const dbUserA = await pool.query('SELECT nickname, bio, gender, country_code FROM popolive.users WHERE id = $1', [userAId]);
  check(dbUserA.rows[0].nickname === 'Updated Pro Host', 'Test 5.8: PostgreSQL row reflects nickname update');
  check(dbUserA.rows[0].bio.includes('Official live streamer bio'), 'Test 5.9: PostgreSQL row reflects bio update');

  // ========================================================================
  // TEST 6: PATCH invalid profile fields
  // ========================================================================
  console.log('\n--- TEST 6: PATCH invalid profile fields ---');
  // 6.1 Short nickname (< 3 chars)
  const req6a = makeRequest('http://localhost:3000/api/profiles/me', 'PATCH', { nickname: 'Hi' }, sessionTokenA);
  const res6a = await patchProfileHandler(req6a);
  const body6a = await res6a.json();
  check(res6a.status === 400 && body6a.code === 'INVALID_NICKNAME', 'Test 6.1: Nickname < 3 chars rejected with 400 INVALID_NICKNAME');

  // 6.2 Long bio (> 500 chars)
  const longBio = 'x'.repeat(501);
  const req6b = makeRequest('http://localhost:3000/api/profiles/me', 'PATCH', { bio: longBio }, sessionTokenA);
  const res6b = await patchProfileHandler(req6b);
  const body6b = await res6b.json();
  check(res6b.status === 400 && body6b.code === 'INVALID_BIO', 'Test 6.2: Bio > 500 chars rejected with 400 INVALID_BIO');

  // 6.3 Invalid gender
  const req6c = makeRequest('http://localhost:3000/api/profiles/me', 'PATCH', { gender: 'alien_cyborg' }, sessionTokenA);
  const res6c = await patchProfileHandler(req6c);
  const body6c = await res6c.json();
  check(res6c.status === 400 && body6c.code === 'INVALID_GENDER', 'Test 6.3: Invalid gender rejected with 400 INVALID_GENDER');

  // 6.4 Minor birthdate (< 18 years old)
  const minorBirthdate = new Date(Date.now() - 15 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const req6d = makeRequest('http://localhost:3000/api/profiles/me', 'PATCH', { birthdate: minorBirthdate }, sessionTokenA);
  const res6d = await patchProfileHandler(req6d);
  const body6d = await res6d.json();
  check(res6d.status === 400 && body6d.code === 'UNDERAGE', 'Test 6.4: Underage birthdate rejected with 400 UNDERAGE');

  // ========================================================================
  // TEST 7: Attempt to modify another user's profile (403)
  // ========================================================================
  console.log('\n--- TEST 7: Attempt to modify another user profile ---');
  const req7 = makeRequest('http://localhost:3000/api/profiles/me', 'PATCH', { id: userBId, nickname: 'Hacked Name' }, sessionTokenA);
  const res7 = await patchProfileHandler(req7);
  const body7 = await res7.json();

  check(res7.status === 403, 'Test 7.1: Mismatched user id in body rejected with HTTP 403');
  check(body7.code === 'FORBIDDEN', 'Test 7.2: Error code is FORBIDDEN');

  // ========================================================================
  // TEST 8: Attempt to modify restricted fields (400)
  // ========================================================================
  console.log('\n--- TEST 8: Attempt to modify restricted fields ---');
  const restrictedPayloads = [
    { role: 'admin' },
    { wealth_level: 99 },
    { host_level: 50 },
    { coins: 1000000 },
    { diamond_points: 500000 },
    { is_adult_verified: false },
    { status: 'banned' },
    { poppo_id: 'spoofed_id' },
  ];

  let restrictedPassed = 0;
  for (const payload of restrictedPayloads) {
    const key = Object.keys(payload)[0];
    const req8 = makeRequest('http://localhost:3000/api/profiles/me', 'PATCH', payload, sessionTokenA);
    const res8 = await patchProfileHandler(req8);
    const body8 = await res8.json();
    if (res8.status === 400 && body8.code === 'RESTRICTED_FIELD') {
      restrictedPassed++;
    }
  }
  check(restrictedPassed === restrictedPayloads.length, `Test 8.1: All ${restrictedPayloads.length} restricted fields rejected with 400 RESTRICTED_FIELD`);

  // ========================================================================
  // TEST 9: Recognition level retrieval (wealth, shining, honor, host)
  // ========================================================================
  console.log('\n--- TEST 9: Recognition level retrieval ---');
  // Seed recognition progress into database with valid foreign key level IDs
  await pool.query(
    `INSERT INTO popolive.user_recognition_progress (
       user_id, category, current_score, current_level_id, current_level_number,
       highest_level_number, progress_percent, activated_at, updated_at
     ) VALUES
       ($1, 'wealth', 85000, 'wealth_lv_15', 15, 15, 50.0, NOW(), NOW()),
       ($1, 'shining', 120000, 'shining_lv_5', 5, 5, 50.0, NOW(), NOW()),
       ($1, 'honor', 60000, 'honor_lv_2', 2, 2, 50.0, NOW(), NOW())
     ON CONFLICT (user_id, category) DO UPDATE
     SET current_level_number = EXCLUDED.current_level_number,
         current_score = EXCLUDED.current_score,
         current_level_id = EXCLUDED.current_level_id`,
    [userAId]
  );
  await pool.query('UPDATE popolive.users SET host_level = 4, wealth_level = 15 WHERE id = $1', [userAId]);

  const req9 = makeRequest('http://localhost:3000/api/profiles/me', 'GET', null, sessionTokenA);
  const res9 = await getProfileHandler(req9);
  const body9 = await res9.json();

  check(body9.profile.wealthLevel === 15, 'Test 9.1: wealthLevel (15) retrieved from PostgreSQL');
  check(body9.profile.shiningLevel === 5, 'Test 9.2: shiningLevel (5) retrieved from PostgreSQL');
  check(body9.profile.honorLevel === 2, 'Test 9.3: honorLevel (2) retrieved from PostgreSQL');
  check(body9.profile.hostLevel === 4, 'Test 9.4: hostLevel (4) retrieved from PostgreSQL');
  check(body9.profile.recognition && body9.profile.recognition.wealthLevel === 15, 'Test 9.5: recognition sub-object accurately structured');

  // ========================================================================
  // TEST 10: Wallet count retrieval (coins, diamond_points)
  // ========================================================================
  console.log('\n--- TEST 10: Wallet count retrieval ---');
  await pool.query(
    `INSERT INTO popolive.user_wallets (user_id, coins, diamond_points, total_spent_coins, total_received_points)
     VALUES ($1, 77777, 55555, 10000, 20000)
     ON CONFLICT (user_id) DO UPDATE
     SET coins = EXCLUDED.coins, diamond_points = EXCLUDED.diamond_points`,
    [userAId]
  );

  const req10 = makeRequest('http://localhost:3000/api/profiles/me', 'GET', null, sessionTokenA);
  const res10 = await getProfileHandler(req10);
  const body10 = await res10.json();

  check(body10.profile.coins === 77777, 'Test 10.1: coins (77777) accurately fetched from user_wallets');
  check(body10.profile.diamondPoints === 55555, 'Test 10.2: diamondPoints (55555) accurately fetched from user_wallets');
  check(body10.profile.wallet && body10.profile.wallet.coins === 77777, 'Test 10.3: wallet sub-object populated');

  // ========================================================================
  // TEST 11: Database-derived profile counts (friends, following, followers, visitors)
  // ========================================================================
  console.log('\n--- TEST 11: Real profile relationships and counts ---');
  // Clear any previous follows/visits for clean counting
  await pool.query('DELETE FROM popolive.user_follows WHERE follower_id = $1 OR following_id = $1', [userAId]);
  await pool.query('DELETE FROM popolive.profile_visits WHERE visited_user_id = $1 OR visitor_id = $1', [userAId]);

  // Insert mutual follow (User A follows User B, and User B follows User A)
  await pool.query('INSERT INTO popolive.user_follows (follower_id, following_id) VALUES ($1, $2)', [userAId, userBId]);
  await pool.query('INSERT INTO popolive.user_follows (follower_id, following_id) VALUES ($1, $2)', [userBId, userAId]);

  // Insert profile visit (User B visits User A)
  await pool.query('INSERT INTO popolive.profile_visits (visited_user_id, visitor_id) VALUES ($1, $2)', [userAId, userBId]);

  const req11 = makeRequest('http://localhost:3000/api/profiles/me', 'GET', null, sessionTokenA);
  const res11 = await getProfileHandler(req11);
  const body11 = await res11.json();

  check(body11.profile.followingCount === 1, 'Test 11.1: followingCount is 1 (User A follows User B)');
  check(body11.profile.followersCount === 1, 'Test 11.2: followersCount is 1 (User B follows User A)');
  check(body11.profile.friendsCount === 1, 'Test 11.3: friendsCount is 1 (Mutual follows in user_friends view)');
  check(body11.profile.visitorsCount === 1, 'Test 11.4: visitorsCount is 1 (Recorded visit in profile_visits)');

  // ========================================================================
  // TEST 12: Mobile profile loading wiring
  // ========================================================================
  console.log('\n--- TEST 12: Mobile profile loading wiring ---');
  const meScreenCode = fs.readFileSync('apps/mobile/lib/screens/profile/me_screen.dart', 'utf8');
  const designFixturesCode = fs.readFileSync('apps/mobile/lib/design/design_fixtures.dart', 'utf8');

  check(
    meScreenCode.includes('FinalApiService.instance.fetchMyProfile()'),
    'Test 12.1: MeScreen invokes FinalApiService.instance.fetchMyProfile()'
  );
  check(
    meScreenCode.includes('FixtureUserProfile.fromMap(profileMap)'),
    'Test 12.2: MeScreen parses response with FixtureUserProfile.fromMap'
  );
  check(
    designFixturesCode.includes('factory FixtureUserProfile.fromMap'),
    'Test 12.3: FixtureUserProfile provides fromMap factory constructor'
  );

  // ========================================================================
  // TEST 13: Web profile loading wiring
  // ========================================================================
  console.log('\n--- TEST 13: Web profile loading wiring ---');
  const webPanelCode = fs.readFileSync('apps/web/components/discovery/WebProfilePanel.tsx', 'utf8');

  check(
    webPanelCode.includes("fetch('/api/profiles/me')"),
    'Test 13.1: WebProfilePanel fetches /api/profiles/me when USE_FINAL_API is enabled'
  );
  check(
    webPanelCode.includes('setLiveUser(mappedUser)'),
    'Test 13.2: WebProfilePanel sets liveUser state from real API response'
  );
  check(
    webPanelCode.includes('data-testid="profile-loading-state"'),
    'Test 13.3: WebProfilePanel renders live loading state spinner'
  );

  // ========================================================================
  // TEST 14: No fixture fallback when enabled
  // ========================================================================
  console.log('\n--- TEST 14: No fixture fallback when enabled ---');
  check(
    meScreenCode.includes("title: 'Profile Error'") && meScreenCode.includes('onRetry: _loadLiveProfile'),
    'Test 14.1: Mobile renders PopoErrorState without silent fallback when API fails under useFinalApi'
  );
  check(
    webPanelCode.includes('data-testid="profile-error-state"') && webPanelCode.includes('profileError || !user'),
    'Test 14.2: WebProfilePanel renders error state banner without silent fixture fallback'
  );

  // ========================================================================
  // TEST 15: Fixture behavior when profile flag is OFF
  // ========================================================================
  console.log('\n--- TEST 15: Fixture behavior when profile flag is OFF ---');
  check(
    meScreenCode.includes('!ApiConfig.useFinalApi && DesignFixtures.isError'),
    'Test 15.1: Mobile respects DesignFixtures when useFinalApi is false'
  );
  check(
    webPanelCode.includes('DesignFixtures.currentUserProfile'),
    'Test 15.2: WebProfilePanel preserves DesignFixtures when USE_FINAL_API is false'
  );

  // Clean up test data
  for (const uid of cleanupUserIds) {
    await pool.query('DELETE FROM popolive.sessions WHERE user_id = $1', [uid]);
    await pool.query('DELETE FROM popolive.user_wallets WHERE user_id = $1', [uid]);
    await pool.query('DELETE FROM popolive.user_recognition_progress WHERE user_id = $1', [uid]);
    await pool.query('DELETE FROM popolive.user_follows WHERE follower_id = $1 OR following_id = $1', [uid]);
    await pool.query('DELETE FROM popolive.profile_visits WHERE visited_user_id = $1 OR visitor_id = $1', [uid]);
    await pool.query('DELETE FROM popolive.users WHERE id = $1', [uid]);
  }

  console.log('\n======================================================================');
  console.log(`TOTAL AUDIT RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================================');

  await pool.end();
  if (testsFailed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runProfileSuite().catch(async (err) => {
  console.error('Fatal error during test run:', err);
  await pool.end();
  process.exit(1);
});
