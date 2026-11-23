/**
 * ============================================================================
 * POPO LIVE — B2 PROMPT 2 REAL USER REGISTRATION & 18+ AGE VERIFICATION SUITE
 * Master Plan Reference: POPO-LIVE-BACKEND-REALTIME-PLAN.pdf (Phase B2, page 3)
 *
 * Exhaustive Verification Across 15 Core Requirements:
 *  1. Valid adult registration (PostgreSQL persistence)
 *  2. Under-18 registration rejection (HTTP 400 + UNDER_18_RESTRICTION)
 *  3. Invalid birthdate rejection (HTTP 400 + INVALID_BIRTHDATE)
 *  4. Duplicate account protection (HTTP 409 + EMAIL_EXISTS / PHONE_EXISTS)
 *  5. Invalid registration fields rejection (Missing identifier, weak password)
 *  6. Password hash storage in PostgreSQL (Bcrypt hash verified)
 *  7. Password hash never exposed in API response
 *  8. Database constraint & error resiliency
 *  9. Flutter registration client compatibility
 * 10. Web registration client compatibility
 * 11. Cross-client PostgreSQL user visibility
 * 12. Under-18 Go Live restriction enforcement
 * 13. Under-18 Builder Center access rejection (HTTP 403 AGE_RESTRICTION_18_PLUS)
 * 14. Adult user session validation
 * 15. Wealth Level 5 Go Live restriction preserved
 * ============================================================================
 */

const path = require('path');
const { Pool } = require(path.resolve(__dirname, 'apps/web/node_modules/pg'));
const bcrypt = require(path.resolve(__dirname, 'apps/web/node_modules/bcryptjs'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public',
});

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

let testsPassed = 0;
let testsFailed = 0;
const testUserIds = [];

function check(condition, desc) {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${desc}`);
    testsFailed++;
  }
}

async function runB2Tests() {
  console.log('======================================================================');
  console.log('POPO LIVE: B2 PROMPT 2 REAL REGISTRATION & 18+ AUDIT SUITE');
  console.log('======================================================================\n');

  // Verify DB connectivity
  const dbCheck = await pool.query('SELECT NOW() as now');
  check(Boolean(dbCheck.rows[0].now), 'PostgreSQL database connected (popolive schema)');

  // Clear rate limits for clean test environment
  await pool.query("DELETE FROM popolive.rate_limits WHERE key LIKE 'reg_%' OR key LIKE 'login_%'");

  // ------------------------------------------------------------------------
  // 1. Valid Adult Registration (Full Fields)
  // ------------------------------------------------------------------------
  console.log('\n--- Test 1: Valid Adult User Registration ---');
  const adultEmail = `adult_${Date.now()}@popolive.internal`;
  const adultPhone = `+92300${Math.floor(1000000 + Math.random() * 9000000)}`;
  const adultPassword = 'SuperSecurePassword2026!';
  const adultBirthdate = '1995-06-15'; // 31 years old

  // We test the Next.js API route directly using tsx/import or Next.js fetch if server is running,
  // or invoking the route handler directly.
  const { POST: registerHandler } = await import('./apps/web/app/api/auth/register/route.ts');
  const { GET: sessionHandler } = await import('./apps/web/app/api/auth/session/route.ts');
  const { GET: goLiveHandler } = await import('./apps/web/app/api/streamer/go-live-eligibility/route.ts');
  const { GET: builderAgencyHandler } = await import('./apps/web/app/api/builder/agency/route.ts');

  // Helper to simulate NextRequest
  const { NextRequest } = require(path.resolve(__dirname, 'apps/web/node_modules/next/server'));
  function makeRequest(url, body, headers = {}) {
    const reqHeaders = new Headers({
      'Content-Type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      ...headers,
    });
    return new NextRequest(new URL(url, 'http://localhost:3000'), {
      method: body ? 'POST' : 'GET',
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  const regReq = makeRequest('http://localhost:3000/api/auth/register', {
    email: adultEmail,
    phone: adultPhone,
    password: adultPassword,
    nickname: 'Adult Host Tester',
    birthdate: adultBirthdate,
    gender: 'female',
    country: 'Pakistan',
    countryCode: 'PK',
    isAdultConfirmed: true,
  });

  const regRes = await registerHandler(regReq);
  const regData = await regRes.json();

  check(regRes.status === 200, `Adult registration returns HTTP 200 (Got: ${regRes.status})`);
  check(regData.success === true, 'Adult registration payload success is true');
  check(Boolean(regData.user?.id), `Registered user assigned UUID: ${regData.user?.id}`);
  check(Boolean(regData.sessionToken), `Session token generated (${regData.sessionToken?.length} chars)`);
  check(regData.user?.isAdultVerified === true, 'User isAdultVerified is true');
  check(regData.user?.birthdate === adultBirthdate, `Birthdate stored: ${regData.user?.birthdate}`);

  const adultUserId = regData.user?.id;
  const adultSessionToken = regData.sessionToken;
  if (adultUserId) testUserIds.push(adultUserId);

  // ------------------------------------------------------------------------
  // 2. Under-18 Registration Rejection
  // ------------------------------------------------------------------------
  console.log('\n--- Test 2: Under-18 User Registration Rejection ---');
  const minorEmail = `minor_${Date.now()}@popolive.internal`;
  const minorBirthdate = '2015-01-01'; // 11 years old

  const minorReq = makeRequest('http://localhost:3000/api/auth/register', {
    email: minorEmail,
    password: adultPassword,
    nickname: 'Minor User',
    birthdate: minorBirthdate,
    isAdultConfirmed: true,
  });

  const minorRes = await registerHandler(minorReq);
  const minorData = await minorRes.json();

  check(minorRes.status === 400, `Under-18 registration returns HTTP 400 (Got: ${minorRes.status})`);
  check(minorData.code === 'UNDER_18_RESTRICTION', `Error code is UNDER_18_RESTRICTION (Got: ${minorData.code})`);
  check(minorData.error?.includes('minimum age of 18 years'), 'Error specifies minimum age requirement');

  // Verify minor was NOT inserted into DB
  const minorDbCheck = await pool.query('SELECT id FROM popolive.users WHERE email = $1', [minorEmail]);
  check(minorDbCheck.rows.length === 0, 'Under-18 user record is NOT created in database');

  // Also test isAdultConfirmed: false
  const unconfirmedReq = makeRequest('http://localhost:3000/api/auth/register', {
    email: `unconfirmed_${Date.now()}@popolive.internal`,
    password: adultPassword,
    isAdultConfirmed: false,
  });
  const unconfirmedRes = await registerHandler(unconfirmedReq);
  const unconfirmedData = await unconfirmedRes.json();
  check(unconfirmedRes.status === 400, `isAdultConfirmed: false rejected with HTTP 400 (Got: ${unconfirmedRes.status})`);
  check(unconfirmedData.code === 'UNDER_18_RESTRICTION', 'Error code is UNDER_18_RESTRICTION');

  // ------------------------------------------------------------------------
  // 3. Invalid Birthdate Format & Future Dates Rejection
  // ------------------------------------------------------------------------
  console.log('\n--- Test 3: Invalid Birthdate Rejection ---');
  const futureReq = makeRequest('http://localhost:3000/api/auth/register', {
    email: `future_${Date.now()}@popolive.internal`,
    password: adultPassword,
    birthdate: '2099-01-01',
    isAdultConfirmed: true,
  });
  const futureRes = await registerHandler(futureReq);
  const futureData = await futureRes.json();
  check(futureRes.status === 400, `Future birthdate rejected with HTTP 400 (Got: ${futureRes.status})`);
  check(futureData.code === 'INVALID_BIRTHDATE', `Error code is INVALID_BIRTHDATE (Got: ${futureData.code})`);

  const malformedReq = makeRequest('http://localhost:3000/api/auth/register', {
    email: `malformed_${Date.now()}@popolive.internal`,
    password: adultPassword,
    birthdate: 'not-a-date',
    isAdultConfirmed: true,
  });
  const malformedRes = await registerHandler(malformedReq);
  const malformedData = await malformedRes.json();
  check(malformedRes.status === 400, `Malformed birthdate rejected with HTTP 400 (Got: ${malformedRes.status})`);
  check(malformedData.code === 'INVALID_BIRTHDATE', 'Error code is INVALID_BIRTHDATE');

  // ------------------------------------------------------------------------
  // 4. Duplicate Account Protection (Email & Phone)
  // ------------------------------------------------------------------------
  console.log('\n--- Test 4: Duplicate Account Protection ---');
  const dupEmailReq = makeRequest('http://localhost:3000/api/auth/register', {
    email: adultEmail, // Same email as Test 1
    password: 'AnotherPassword2026!',
    isAdultConfirmed: true,
  });
  const dupEmailRes = await registerHandler(dupEmailReq);
  const dupEmailData = await dupEmailRes.json();
  check(dupEmailRes.status === 409, `Duplicate email returns HTTP 409 Conflict (Got: ${dupEmailRes.status})`);
  check(dupEmailData.code === 'EMAIL_EXISTS', `Error code is EMAIL_EXISTS (Got: ${dupEmailData.code})`);

  const dupPhoneReq = makeRequest('http://localhost:3000/api/auth/register', {
    phone: adultPhone, // Same phone as Test 1
    password: 'AnotherPassword2026!',
    isAdultConfirmed: true,
  });
  const dupPhoneRes = await registerHandler(dupPhoneReq);
  const dupPhoneData = await dupPhoneRes.json();
  check(dupPhoneRes.status === 409, `Duplicate phone returns HTTP 409 Conflict (Got: ${dupPhoneRes.status})`);
  check(dupPhoneData.code === 'PHONE_EXISTS', `Error code is PHONE_EXISTS (Got: ${dupPhoneData.code})`);

  // ------------------------------------------------------------------------
  // 5. Invalid Registration Fields Rejection
  // ------------------------------------------------------------------------
  console.log('\n--- Test 5: Invalid Registration Fields Rejection ---');
  // Missing both email and phone
  const missingIdReq = makeRequest('http://localhost:3000/api/auth/register', {
    password: adultPassword,
    isAdultConfirmed: true,
  });
  const missingIdRes = await registerHandler(missingIdReq);
  const missingIdData = await missingIdRes.json();
  check(missingIdRes.status === 400, `Missing identifiers rejected with HTTP 400 (Got: ${missingIdRes.status})`);
  check(missingIdData.code === 'MISSING_IDENTIFIER', 'Error code is MISSING_IDENTIFIER');

  // Weak password (< 8 chars)
  const weakPassReq = makeRequest('http://localhost:3000/api/auth/register', {
    email: `weak_${Date.now()}@popolive.internal`,
    password: 'short',
    isAdultConfirmed: true,
  });
  const weakPassRes = await registerHandler(weakPassReq);
  const weakPassData = await weakPassRes.json();
  check(weakPassRes.status === 400, `Short password (<8 chars) rejected with HTTP 400 (Got: ${weakPassRes.status})`);
  check(weakPassData.code === 'WEAK_PASSWORD', 'Error code is WEAK_PASSWORD');

  // Invalid email format
  const badEmailReq = makeRequest('http://localhost:3000/api/auth/register', {
    email: 'not-an-email',
    password: adultPassword,
    isAdultConfirmed: true,
  });
  const badEmailRes = await registerHandler(badEmailReq);
  const badEmailData = await badEmailRes.json();
  check(badEmailRes.status === 400, `Invalid email format rejected with HTTP 400 (Got: ${badEmailRes.status})`);
  check(badEmailData.code === 'INVALID_EMAIL', 'Error code is INVALID_EMAIL');

  // ------------------------------------------------------------------------
  // 6. Password Hash Storage in PostgreSQL
  // ------------------------------------------------------------------------
  console.log('\n--- Test 6: Secure Password Hashing in Database ---');
  const dbUserRes = await pool.query(
    'SELECT password_hash, poppo_id, email, is_adult_verified FROM popolive.users WHERE id = $1',
    [adultUserId]
  );
  check(dbUserRes.rows.length === 1, 'Adult user found in PostgreSQL popolive.users');
  const storedHash = dbUserRes.rows[0].password_hash;
  check(storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$'), `Password hash is bcrypt formatted: ${storedHash.substring(0, 15)}...`);
  const bcryptMatch = await bcrypt.compare(adultPassword, storedHash);
  check(bcryptMatch === true, 'Bcrypt compare confirms stored hash matches plain password');
  const bcryptWrong = await bcrypt.compare('WrongPassword123!', storedHash);
  check(bcryptWrong === false, 'Bcrypt compare rejects wrong password against stored hash');

  // ------------------------------------------------------------------------
  // 7. Password Hash Never Exposed in API Response
  // ------------------------------------------------------------------------
  console.log('\n--- Test 7: Zero Password Hash Exposure ---');
  check(regData.user?.password === undefined, 'regData.user.password is undefined');
  check(regData.user?.password_hash === undefined, 'regData.user.password_hash is undefined');
  check(regData.user?.passwordHash === undefined, 'regData.user.passwordHash is undefined');
  check(!JSON.stringify(regData).includes(storedHash), 'Full response JSON does NOT contain password hash');

  // ------------------------------------------------------------------------
  // 8. Database Constraint & Error Resiliency
  // ------------------------------------------------------------------------
  console.log('\n--- Test 8: Database Constraint & Error Resiliency ---');
  // Attempt raw duplicate insert on unique constraint
  let dbDuplicateCaught = false;
  try {
    await pool.query(
      `INSERT INTO popolive.users (poppo_id, email, password_hash, nickname)
       VALUES ('9999999', $1, 'fake_hash', 'Dup User')`,
      [adultEmail]
    );
  } catch (err) {
    dbDuplicateCaught = true;
    check(err.code === '23505', `PostgreSQL throws error 23505 for unique violation (${err.constraint})`);
  }
  check(dbDuplicateCaught, 'Unique constraint enforces data integrity on database level');

  // ------------------------------------------------------------------------
  // 9. Flutter Registration Pattern Compatibility
  // ------------------------------------------------------------------------
  console.log('\n--- Test 9: Flutter Mobile Registration Compatibility ---');
  const mobileEmail = `flutter_${Date.now()}@popolive.internal`;
  const mobileReq = makeRequest('http://localhost:3000/api/auth/register', {
    nickname: 'Flutter Streamer',
    email: mobileEmail,
    password: adultPassword,
    gender: 'female',
    isAdultConfirmed: true,
  });
  const mobileRes = await registerHandler(mobileReq);
  const mobileData = await mobileRes.json();
  check(mobileRes.status === 200, `Mobile pattern registration returns HTTP 200 (Got: ${mobileRes.status})`);
  check(Boolean(mobileData.user?.id), `Mobile user registered with ID: ${mobileData.user?.id}`);
  check(mobileData.user?.gender === 'female', 'Mobile user gender stored correctly');
  if (mobileData.user?.id) testUserIds.push(mobileData.user.id);

  // ------------------------------------------------------------------------
  // 10. Web Registration Pattern Compatibility
  // ------------------------------------------------------------------------
  console.log('\n--- Test 10: Web Signup Registration Compatibility ---');
  const webEmail = `web_${Date.now()}@popolive.internal`;
  const webReq = makeRequest('http://localhost:3000/api/auth/register', {
    nickname: 'Web Streamer',
    email: webEmail,
    phone: `+92312${Math.floor(1000000 + Math.random() * 9000000)}`,
    password: adultPassword,
    birthdate: '1992-12-05',
    country: 'Pakistan',
    countryCode: 'PK',
    isAdultConfirmed: true,
  });
  const webRes = await registerHandler(webReq);
  const webData = await webRes.json();
  check(webRes.status === 200, `Web pattern registration returns HTTP 200 (Got: ${webRes.status})`);
  check(webData.user?.country === 'Pakistan', `Web user country stored: ${webData.user?.country}`);
  if (webData.user?.id) testUserIds.push(webData.user.id);

  // ------------------------------------------------------------------------
  // 11. Cross-Client PostgreSQL User Visibility
  // ------------------------------------------------------------------------
  console.log('\n--- Test 11: Cross-Client PostgreSQL User Visibility ---');
  const crossCheck = await pool.query(
    'SELECT id, poppo_id, email, nickname FROM popolive.users WHERE id = $1',
    [mobileData.user?.id]
  );
  check(crossCheck.rows.length === 1, 'Mobile-registered user immediately visible in PostgreSQL');
  check(crossCheck.rows[0].email === mobileEmail, 'PostgreSQL record matches mobile registration email');

  // ------------------------------------------------------------------------
  // 12. Under-18 Go Live Restriction Enforcement
  // ------------------------------------------------------------------------
  console.log('\n--- Test 12: Under-18 Go Live Restriction Enforcement ---');
  // Create an explicit under-18 user directly in DB to verify session isolation
  const minorUserRes = await pool.query(
    `INSERT INTO popolive.users (
      poppo_id, email, password_hash, nickname, birthdate, is_adult_verified, status, wealth_level, go_live_eligible
    ) VALUES (
      '7777001', 'minor_db_user@popolive.internal', $1, 'Minor DB User', '2012-05-10', false, 'active', 1, false
    ) RETURNING id`,
    [storedHash]
  );
  const minorDbUserId = minorUserRes.rows[0].id;
  testUserIds.push(minorDbUserId);

  // Create session for minor
  const minorSessionToken = 'test_minor_session_token_' + Date.now();
  await pool.query(
    `INSERT INTO popolive.sessions (user_id, session_token, expires_at, is_revoked)
     VALUES ($1, $2, NOW() + INTERVAL '7 days', false)`,
    [minorDbUserId, minorSessionToken]
  );

  // Check Go Live eligibility for minor
  const minorGoLiveReq = makeRequest(
    'http://localhost:3000/api/streamer/go-live-eligibility',
    null,
    { Cookie: `poppo_session=${minorSessionToken}` }
  );
  const minorGoLiveRes = await goLiveHandler(minorGoLiveReq);
  const minorGoLiveData = await minorGoLiveRes.json();

  check(minorGoLiveData.eligible === false, 'Minor user eligible is FALSE for Go Live');
  check(minorGoLiveData.isAdult === false, 'Minor user isAdult is FALSE');
  check(
    minorGoLiveData.reasons?.some((r) => r.includes('18 years old')),
    `Rejection reason contains 18+ requirement: "${minorGoLiveData.reasons?.[0]}"`
  );

  // ------------------------------------------------------------------------
  // 13. Under-18 Builder Center Restriction (HTTP 403)
  // ------------------------------------------------------------------------
  console.log('\n--- Test 13: Under-18 Builder Center Restriction ---');
  const minorBuilderReq = makeRequest(
    'http://localhost:3000/api/builder/agency',
    null,
    { Cookie: `poppo_session=${minorSessionToken}` }
  );
  const minorBuilderRes = await builderAgencyHandler(minorBuilderReq);
  const minorBuilderData = await minorBuilderRes.json();

  check(minorBuilderRes.status === 403, `Builder Center returns HTTP 403 Forbidden for minor (Got: ${minorBuilderRes.status})`);
  check(minorBuilderData.code === 'AGE_RESTRICTION_18_PLUS', `Error code is AGE_RESTRICTION_18_PLUS (Got: ${minorBuilderData.code})`);
  check(minorBuilderData.error?.includes('18 years old'), 'Error message specifies 18+ age restriction');

  // ------------------------------------------------------------------------
  // 14. Adult User Session Validation
  // ------------------------------------------------------------------------
  console.log('\n--- Test 14: Adult User Session Validation ---');
  const adultSessionReq = makeRequest(
    'http://localhost:3000/api/auth/session',
    null,
    { Cookie: `poppo_session=${adultSessionToken}` }
  );
  const adultSessionRes = await sessionHandler(adultSessionReq);
  const adultSessionData = await adultSessionRes.json();

  check(adultSessionData.authenticated === true, 'Adult session restores: authenticated is true');
  check(adultSessionData.user?.id === adultUserId, 'Session user ID matches adult user ID');
  check(adultSessionData.user?.isAdultVerified === true, 'Session user isAdultVerified is true');
  check(adultSessionData.user?.goLiveEligible === false, 'New user goLiveEligible is false by default');

  // ------------------------------------------------------------------------
  // 15. Wealth Level 5 Restriction Preserved
  // ------------------------------------------------------------------------
  console.log('\n--- Test 15: Wealth Level 5 Restriction Preserved ---');
  const adultGoLiveReq = makeRequest(
    'http://localhost:3000/api/streamer/go-live-eligibility',
    null,
    { Cookie: `poppo_session=${adultSessionToken}` }
  );
  const adultGoLiveRes = await goLiveHandler(adultGoLiveReq);
  const adultGoLiveData = await adultGoLiveRes.json();

  check(adultGoLiveData.isAdult === true, 'Adult user isAdult is TRUE');
  check(adultGoLiveData.wealthLevel === 1, 'Adult user wealthLevel is 1 (<5)');
  check(adultGoLiveData.eligible === false, 'Adult user without Wealth Level 5 is NOT eligible to go live');
  check(
    adultGoLiveData.reasons?.some((r) => r.includes('Wealth Level 5')),
    `Rejection reason contains Wealth Level 5 requirement: "${adultGoLiveData.reasons?.[0]}"`
  );

  // Now simulate Wealth Level 5 promotion in DB
  await pool.query('UPDATE popolive.users SET wealth_level = 5 WHERE id = $1', [adultUserId]);
  const adultPromotedReq = makeRequest(
    'http://localhost:3000/api/streamer/go-live-eligibility',
    null,
    { Cookie: `poppo_session=${adultSessionToken}` }
  );
  const adultPromotedRes = await goLiveHandler(adultPromotedReq);
  const adultPromotedData = await adultPromotedRes.json();

  check(adultPromotedData.wealthLevel === 5, 'After promotion, wealthLevel is 5');
  check(adultPromotedData.eligible === true, 'Adult user with Wealth Level 5 is ELIGIBLE to go live!');

  // ------------------------------------------------------------------------
  // CLEANUP TEST USERS
  // ------------------------------------------------------------------------
  console.log('\n--- Cleanup: Purging Test Users ---');
  for (const uid of testUserIds) {
    await pool.query('DELETE FROM popolive.sessions WHERE user_id = $1', [uid]);
    await pool.query('DELETE FROM popolive.users WHERE id = $1', [uid]);
  }
  console.log(`Cleaned up ${testUserIds.length} test user records safely from PostgreSQL.`);

  // ------------------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`B2 PROMPT 2 TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================================\n');

  await pool.end();

  if (testsFailed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runB2Tests().catch((err) => {
  console.error('Test execution failed:', err);
  pool.end();
  process.exit(1);
});
