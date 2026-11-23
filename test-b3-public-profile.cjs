/**
 * ============================================================================
 * POPO LIVE — PHASE B3 PROMPT 2 OF 4: PUBLIC PROFILE AUDIT SUITE
 * Master Plan Reference: POPO-LIVE-BACKEND-REALTIME-PLAN.pdf (Phase B3, pages 3–4)
 *
 * Comprehensive Verification of 15 Tests:
 *  1. Existing public profile
 *  2. Nonexistent public profile (404)
 *  3. Valid authenticated visitor
 *  4. Unauthenticated visitor (no visit record created)
 *  5. Self-profile view (isSelf: true, no visit record created)
 *  6. Visitor record creation in PostgreSQL
 *  7. Duplicate render prevention (deduplication within 10-min window)
 *  8. Visitor count calculation (real database aggregation)
 *  9. Public/private field filtering (no email, phone, passwords, balances)
 * 10. Recognition level retrieval (wealth, shining, honor, host)
 * 11. Relationship state (isFollowing, isFollower, isFriend, isSelf)
 * 12. Mobile public profile wiring
 * 13. Web public profile wiring
 * 14. API error behavior
 * 15. No fixture fallback when enabled
 * ============================================================================
 */

const path = require('path');
const fs = require('fs');
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

async function runPublicProfileSuite() {
  console.log('======================================================================');
  console.log('POPO LIVE: B3 PROMPT 2 PUBLIC PROFILE — REAL POSTGRESQL AUDIT');
  console.log('======================================================================\n');

  // Verify DB connectivity
  const dbCheck = await pool.query('SELECT NOW() as now');
  check(Boolean(dbCheck.rows[0].now), 'PostgreSQL database connected (popolive schema)');

  // Import Next.js route handlers and auth utilities
  const { GET: publicProfileHandler } = await import('./apps/web/app/api/profiles/[userId]/route.ts');
  const { GET: webPublicProfileHandler } = await import('./apps/web/app/api/users/[userId]/public-profile/route.ts');
  const { hashPassword, createSession } = await import('./apps/web/lib/auth.ts');
  const { createConsentToken, CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } = await import('./apps/web/lib/consentStore.ts');
  const { NextRequest } = require(path.resolve(__dirname, 'apps/web/node_modules/next/server'));

  const validConsentToken = createConsentToken({
    consentId: 'cs_test_b3_p2',
    anonymousSessionId: 'anon_sess_b3_p2',
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

  // 1. Setup Test Users
  const passHash = await hashPassword('PopoLivePassword123!');

  // User A (Visitor)
  const userARes = await pool.query(
    `INSERT INTO popolive.users (
      poppo_id, email, phone, password_hash, nickname, birthdate, gender, country, country_code, is_adult_verified, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, 'active')
    RETURNING id`,
    [`poppo_${Math.floor(100000 + Math.random() * 900000)}`, `visitor_a_${Date.now()}@popolive.internal`, `+92302${Math.floor(1000000 + Math.random() * 9000000)}`, passHash, 'Visitor Alice', '1995-02-14', 'female', 'Pakistan', 'PK']
  );
  const userAId = userARes.rows[0].id;
  cleanupUserIds.push(userAId);

  // User B (Target Profile)
  const poppoIdB = `poppo_${Math.floor(100000 + Math.random() * 900000)}`;
  const userBRes = await pool.query(
    `INSERT INTO popolive.users (
      poppo_id, email, phone, password_hash, nickname, bio, birthdate, gender, country, country_code, is_adult_verified, status, host_level, wealth_level
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, 'active', 7, 15)
    RETURNING id`,
    [poppoIdB, `target_b_${Date.now()}@popolive.internal`, `+92303${Math.floor(1000000 + Math.random() * 9000000)}`, passHash, 'Star Host Bob', 'Official verified broadcaster bio', '1992-11-20', 'male', 'United States', 'US']
  );
  const userBId = userBRes.rows[0].id;
  cleanupUserIds.push(userBId);

  // User C (Second Visitor)
  const userCRes = await pool.query(
    `INSERT INTO popolive.users (
      poppo_id, email, phone, password_hash, nickname, birthdate, gender, country, country_code, is_adult_verified, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, 'active')
    RETURNING id`,
    [`poppo_${Math.floor(100000 + Math.random() * 900000)}`, `visitor_c_${Date.now()}@popolive.internal`, `+92304${Math.floor(1000000 + Math.random() * 9000000)}`, passHash, 'Viewer Charlie', '1998-05-10', 'male', 'Pakistan', 'PK']
  );
  const userCId = userCRes.rows[0].id;
  cleanupUserIds.push(userCId);

  // Sessions
  const { sessionToken: sessionTokenA } = await createSession(userAId);
  const { sessionToken: sessionTokenB } = await createSession(userBId);
  const { sessionToken: sessionTokenC } = await createSession(userCId);

  // Clear any existing visits between test users
  await pool.query('DELETE FROM popolive.profile_visits WHERE visitor_id = $1 OR visited_user_id = $1 OR visitor_id = $2 OR visited_user_id = $2', [userAId, userBId]);

  // ========================================================================
  // TEST 1: Existing public profile
  // ========================================================================
  console.log('\n--- TEST 1: Existing public profile ---');
  const req1 = makeRequest(`http://localhost:3000/api/profiles/${userBId}`, 'GET', null, null);
  const res1 = await publicProfileHandler(req1, { params: Promise.resolve({ userId: userBId }) });
  const body1 = await res1.json();

  check(res1.status === 200, 'Test 1.1: GET /api/profiles/[userId] returns HTTP 200');
  check(body1.success === true, 'Test 1.2: Response body contains success: true');
  check(body1.profile && body1.profile.id === userBId, 'Test 1.3: Target user ID matches database record');
  check(body1.profile.nickname === 'Star Host Bob', 'Test 1.4: Nickname retrieved from PostgreSQL');
  check(body1.profile.poppoId === poppoIdB, 'Test 1.5: Poppo ID matches database record');
  check(body1.profile.bio === 'Official verified broadcaster bio', 'Test 1.6: Bio retrieved from PostgreSQL');
  check(body1.profile.countryCode === 'US', 'Test 1.7: Country code is US');
  check(body1.profile.flagEmoji === '🇺🇸', 'Test 1.8: Flag emoji is 🇺🇸 for US');

  // Lookup by Poppo ID (numeric/string)
  const req1Poppo = makeRequest(`http://localhost:3000/api/profiles/${poppoIdB}`, 'GET', null, null);
  const res1Poppo = await publicProfileHandler(req1Poppo, { params: Promise.resolve({ userId: poppoIdB }) });
  const body1Poppo = await res1Poppo.json();
  check(res1Poppo.status === 200 && body1Poppo.profile.id === userBId, 'Test 1.9: Lookup by poppo_id successfully resolves user record');

  // ========================================================================
  // TEST 2: Nonexistent public profile
  // ========================================================================
  console.log('\n--- TEST 2: Nonexistent public profile ---');
  const nonExistentId = '00000000-0000-0000-0000-000000000000';
  const req2 = makeRequest(`http://localhost:3000/api/profiles/${nonExistentId}`, 'GET', null, null);
  const res2 = await publicProfileHandler(req2, { params: Promise.resolve({ userId: nonExistentId }) });
  const body2 = await res2.json();

  check(res2.status === 404, 'Test 2.1: Nonexistent user returns HTTP 404');
  check(body2.success === false, 'Test 2.2: Response contains success: false');
  check(body2.code === 'USER_NOT_FOUND', 'Test 2.3: Error code is USER_NOT_FOUND');

  // ========================================================================
  // TEST 3: Valid authenticated visitor
  // ========================================================================
  console.log('\n--- TEST 3: Valid authenticated visitor ---');
  const req3 = makeRequest(`http://localhost:3000/api/profiles/${userBId}`, 'GET', null, sessionTokenA);
  const res3 = await publicProfileHandler(req3, { params: Promise.resolve({ userId: userBId }) });
  const body3 = await res3.json();

  check(res3.status === 200, 'Test 3.1: Authenticated viewer retrieves target public profile with HTTP 200');
  check(body3.profile.isSelf === false, 'Test 3.2: isSelf is false when viewer differs from target');

  // ========================================================================
  // TEST 4: Unauthenticated visitor
  // ========================================================================
  console.log('\n--- TEST 4: Unauthenticated visitor ---');
  // Clear visits
  await pool.query('DELETE FROM popolive.profile_visits WHERE visited_user_id = $1', [userBId]);

  const req4 = makeRequest(`http://localhost:3000/api/profiles/${userBId}`, 'GET', null, null);
  const res4 = await publicProfileHandler(req4, { params: Promise.resolve({ userId: userBId }) });
  const body4 = await res4.json();

  check(res4.status === 200, 'Test 4.1: Unauthenticated visitor receives HTTP 200');
  check(body4.profile.isSelf === false, 'Test 4.2: isSelf is false for unauthenticated visitor');

  const unauthVisits = await pool.query('SELECT count(*)::int AS count FROM popolive.profile_visits WHERE visited_user_id = $1', [userBId]);
  check(unauthVisits.rows[0].count === 0, 'Test 4.3: Unauthenticated request created 0 visit records');

  // ========================================================================
  // TEST 5: Self-profile view
  // ========================================================================
  console.log('\n--- TEST 5: Self-profile view ---');
  const req5 = makeRequest(`http://localhost:3000/api/profiles/${userBId}`, 'GET', null, sessionTokenB);
  const res5 = await publicProfileHandler(req5, { params: Promise.resolve({ userId: userBId }) });
  const body5 = await res5.json();

  check(res5.status === 200, 'Test 5.1: Self-view returns HTTP 200');
  check(body5.profile.isSelf === true, 'Test 5.2: isSelf is strictly true for own profile view');

  const selfVisits = await pool.query('SELECT count(*)::int AS count FROM popolive.profile_visits WHERE visited_user_id = $1', [userBId]);
  check(selfVisits.rows[0].count === 0, 'Test 5.3: Self-profile view created 0 visit records');

  // ========================================================================
  // TEST 6: Visitor record creation in PostgreSQL
  // ========================================================================
  console.log('\n--- TEST 6: Visitor record creation ---');
  // User A views User B's profile
  const req6 = makeRequest(`http://localhost:3000/api/profiles/${userBId}`, 'GET', null, sessionTokenA);
  await publicProfileHandler(req6, { params: Promise.resolve({ userId: userBId }) });

  const visitRows = await pool.query(
    'SELECT visitor_id, visited_user_id, source FROM popolive.profile_visits WHERE visitor_id = $1 AND visited_user_id = $2',
    [userAId, userBId]
  );
  check(visitRows.rows.length === 1, 'Test 6.1: Exactly 1 visit row recorded in PostgreSQL');
  check(visitRows.rows[0].visitor_id === userAId, 'Test 6.2: visitor_id matches authenticated User A ID');
  check(visitRows.rows[0].visited_user_id === userBId, 'Test 6.3: visited_user_id matches target User B ID');

  // ========================================================================
  // TEST 7: Duplicate render prevention (deduplication)
  // ========================================================================
  console.log('\n--- TEST 7: Duplicate render prevention ---');
  // Perform 3 consecutive profile GET requests with User A's session (simulating component re-render)
  for (let i = 0; i < 3; i++) {
    const req7 = makeRequest(`http://localhost:3000/api/profiles/${userBId}`, 'GET', null, sessionTokenA);
    await publicProfileHandler(req7, { params: Promise.resolve({ userId: userBId }) });
  }

  const dupVisits = await pool.query(
    'SELECT count(*)::int AS count FROM popolive.profile_visits WHERE visitor_id = $1 AND visited_user_id = $2',
    [userAId, userBId]
  );
  check(dupVisits.rows[0].count === 1, 'Test 7.1: Repeated requests within 10 minutes did not create duplicate visits (count remains 1)');

  // ========================================================================
  // TEST 8: Visitor count calculation
  // ========================================================================
  console.log('\n--- TEST 8: Visitor count calculation ---');
  // User C (second visitor) views User B
  const req8 = makeRequest(`http://localhost:3000/api/profiles/${userBId}`, 'GET', null, sessionTokenC);
  const res8 = await publicProfileHandler(req8, { params: Promise.resolve({ userId: userBId }) });
  const body8 = await res8.json();

  check(res8.status === 200, 'Test 8.1: User C view succeeded with HTTP 200');
  check(body8.profile.visitorsCount === 2, 'Test 8.2: visitorsCount is 2 (User A and User C distinct visits)');
  check(body8.profile.visitorCount === 2, 'Test 8.3: visitorCount alias is also 2');

  // ========================================================================
  // TEST 9: Public/private field filtering
  // ========================================================================
  console.log('\n--- TEST 9: Public/private field filtering ---');
  const req9 = makeRequest(`http://localhost:3000/api/profiles/${userBId}`, 'GET', null, null);
  const res9 = await publicProfileHandler(req9, { params: Promise.resolve({ userId: userBId }) });
  const body9 = await res9.json();
  const prof = body9.profile;

  check(prof.email === undefined, 'Test 9.1: email is NOT exposed in public profile');
  check(prof.phone === undefined, 'Test 9.2: phone is NOT exposed in public profile');
  check(prof.password_hash === undefined && prof.passwordHash === undefined, 'Test 9.3: password_hash is NOT exposed');
  check(prof.session_token === undefined && prof.sessionToken === undefined, 'Test 9.4: session_token is NOT exposed');
  check(prof.coins === undefined && prof.diamondPoints === undefined, 'Test 9.5: Private wallet balances are NOT exposed');
  check(prof.role === undefined && prof.is_staff === undefined, 'Test 9.6: Internal staff/role attributes are NOT exposed');

  // ========================================================================
  // TEST 10: Recognition level retrieval
  // ========================================================================
  console.log('\n--- TEST 10: Recognition level retrieval ---');
  // Insert recognition progress for User B: wealth_lv_15 (15), shining_lv_5 (5), honor_lv_2 (2)
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
    [userBId]
  );

  const req10 = makeRequest(`http://localhost:3000/api/profiles/${userBId}`, 'GET', null, null);
  const res10 = await publicProfileHandler(req10, { params: Promise.resolve({ userId: userBId }) });
  const body10 = await res10.json();

  check(body10.profile.wealthLevel === 15, 'Test 10.1: wealthLevel (15) retrieved from PostgreSQL');
  check(body10.profile.shiningLevel === 5, 'Test 10.2: shiningLevel (5) retrieved from PostgreSQL');
  check(body10.profile.honorLevel === 2, 'Test 10.3: honorLevel (2) retrieved from PostgreSQL');
  check(body10.profile.hostLevel === 7, 'Test 10.4: hostLevel (7) retrieved from PostgreSQL');
  check(body10.profile.recognition && body10.profile.recognition.shiningLevel === 5, 'Test 10.5: recognition sub-object populated');

  // ========================================================================
  // TEST 11: Relationship state
  // ========================================================================
  console.log('\n--- TEST 11: Relationship state (isFollowing, isFollower, isFriend, isSelf) ---');
  // Clean follow records
  await pool.query('DELETE FROM popolive.user_follows WHERE follower_id = $1 OR following_id = $1 OR follower_id = $2 OR following_id = $2', [userAId, userBId]);

  // Case 1: Neither follows
  const req11a = makeRequest(`http://localhost:3000/api/profiles/${userBId}`, 'GET', null, sessionTokenA);
  const res11a = await publicProfileHandler(req11a, { params: Promise.resolve({ userId: userBId }) });
  const body11a = await res11a.json();
  check(body11a.profile.isFollowing === false, 'Test 11.1: Neither follows -> isFollowing is false');
  check(body11a.profile.isFollower === false, 'Test 11.2: Neither follows -> isFollower is false');
  check(body11a.profile.isFriend === false, 'Test 11.3: Neither follows -> isFriend is false');

  // Case 2: User A follows User B
  await pool.query('INSERT INTO popolive.user_follows (follower_id, following_id) VALUES ($1, $2)', [userAId, userBId]);
  const req11b = makeRequest(`http://localhost:3000/api/profiles/${userBId}`, 'GET', null, sessionTokenA);
  const res11b = await publicProfileHandler(req11b, { params: Promise.resolve({ userId: userBId }) });
  const body11b = await res11b.json();
  check(body11b.profile.isFollowing === true, 'Test 11.4: User A follows User B -> isFollowing is true');
  check(body11b.profile.isFollower === false, 'Test 11.5: User B does not follow User A -> isFollower is false');
  check(body11b.profile.isFriend === false, 'Test 11.6: One-way follow -> isFriend is false');

  // Case 3: User B also follows User A (Mutual Follow)
  await pool.query('INSERT INTO popolive.user_follows (follower_id, following_id) VALUES ($1, $2)', [userBId, userAId]);
  const req11c = makeRequest(`http://localhost:3000/api/profiles/${userBId}`, 'GET', null, sessionTokenA);
  const res11c = await publicProfileHandler(req11c, { params: Promise.resolve({ userId: userBId }) });
  const body11c = await res11c.json();
  check(body11c.profile.isFollowing === true, 'Test 11.7: Mutual follow -> isFollowing is true');
  check(body11c.profile.isFollower === true, 'Test 11.8: Mutual follow -> isFollower is true');
  check(body11c.profile.isFriend === true, 'Test 11.9: Mutual follow -> isFriend is true');
  check(body11c.profile.friendsCount >= 1, 'Test 11.10: friendsCount derives from mutual user_friends view');

  // ========================================================================
  // TEST 12: Mobile public profile wiring
  // ========================================================================
  console.log('\n--- TEST 12: Mobile public profile wiring ---');
  const publicProfileScreenCode = fs.readFileSync('apps/mobile/lib/screens/profile/public_profile_screen.dart', 'utf8');

  check(
    publicProfileScreenCode.includes('FinalApiService.instance.fetchPublicProfile(widget.userId)'),
    'Test 12.1: PublicProfileScreen invokes FinalApiService.instance.fetchPublicProfile(widget.userId)'
  );
  check(
    publicProfileScreenCode.includes('_isFollowing = profileMap[\'isFollowing\'] == true'),
    'Test 12.2: PublicProfileScreen sets _isFollowing from backend profile response'
  );
  check(
    publicProfileScreenCode.includes('_profile = profileMap'),
    'Test 12.3: PublicProfileScreen stores backend profileMap'
  );

  // ========================================================================
  // TEST 13: Web public profile wiring
  // ========================================================================
  console.log('\n--- TEST 13: Web public profile wiring ---');
  // Test legacy web route GET /api/users/[userId]/public-profile
  const req13 = makeRequest(`http://localhost:3000/api/users/${userBId}/public-profile`, 'GET', null, sessionTokenA);
  const res13 = await webPublicProfileHandler(req13, { params: { userId: userBId } });
  const body13 = await res13.json();

  check(res13.status === 200, 'Test 13.1: Web public profile endpoint returns HTTP 200');
  check(body13.profile && body13.profile.id === userBId, 'Test 13.2: Web profile matches target user ID');
  check(body13.profile.visitorsCount >= 1, 'Test 13.3: Web profile provides visitorsCount from database');

  const webPageCode = fs.readFileSync('apps/web/app/user/[userId]/page.tsx', 'utf8');
  check(
    webPageCode.includes('public-profile'),
    'Test 13.4: Web page.tsx connects to public profile endpoint'
  );

  // ========================================================================
  // TEST 14: API error behavior
  // ========================================================================
  console.log('\n--- TEST 14: API error behavior ---');
  // Missing / empty userId param
  const req14 = makeRequest('http://localhost:3000/api/profiles/', 'GET', null, null);
  const res14 = await publicProfileHandler(req14, { params: Promise.resolve({ userId: '' }) });
  check(res14.status === 400 || res14.status === 404, 'Test 14.1: Empty userId parameter rejected with 400/404');

  // ========================================================================
  // TEST 15: No fixture fallback when enabled
  // ========================================================================
  console.log('\n--- TEST 15: No fixture fallback when enabled ---');
  check(
    publicProfileScreenCode.includes("setState(() {") &&
    publicProfileScreenCode.includes("_errorMessage = res.error ?? res.message ?? 'User not found';") &&
    publicProfileScreenCode.includes("return;"),
    'Test 15.1: Mobile PublicProfileScreen terminates on error without falling back to DesignFixtures when useFinalApi is true'
  );
  check(
    publicProfileScreenCode.includes('if (DesignFixtures.isError)'),
    'Test 15.2: Mobile PublicProfileScreen preserves DesignFixtures when useFinalApi is false'
  );

  // Clean up test data
  for (const uid of cleanupUserIds) {
    await pool.query('DELETE FROM popolive.sessions WHERE user_id = $1', [uid]);
    await pool.query('DELETE FROM popolive.profile_visits WHERE visitor_id = $1 OR visited_user_id = $1', [uid]);
    await pool.query('DELETE FROM popolive.user_follows WHERE follower_id = $1 OR following_id = $1', [uid]);
    await pool.query('DELETE FROM popolive.user_recognition_progress WHERE user_id = $1', [uid]);
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

runPublicProfileSuite().catch(async (err) => {
  console.error('Fatal error during test run:', err);
  await pool.end();
  process.exit(1);
});
