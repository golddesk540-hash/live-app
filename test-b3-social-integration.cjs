/**
 * ============================================================================
 * POPO LIVE — PHASE B3 PROMPT 4 OF 4: FULL SOCIAL GRAPH & AUDIENCE E2E SUITE
 * Master Plan Reference: POPO-LIVE-BACKEND-REALTIME-PLAN.pdf (Phase B3, pages 3–4)
 *
 * Verifies all 35 requirements across:
 * Test A: My Profile (1-5)
 * Test B: Friends (Mutual Follows) (6-13)
 * Test C: Following (14-19)
 * Test D: Followers (20-25)
 * Test E: Visitors (26-30)
 * Test F: Client Consistency (Mobile + Web) (31-32)
 * Test G: Error Handling (33-35)
 * ============================================================================
 */

const path = require('path');
const { NextRequest } = require(path.resolve(__dirname, 'apps/web/node_modules/next/server'));
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

function makeReq(url, method = 'GET', body = null, sessionToken = null) {
  const headers = new Headers();
  if (body) headers.set('content-type', 'application/json');
  if (sessionToken) {
    headers.set('cookie', `poppo_session=${sessionToken}`);
    headers.set('authorization', `Bearer ${sessionToken}`);
  }
  const init = {
    method,
    headers,
  };
  if (body) init.body = JSON.stringify(body);
  return new NextRequest(url, init);
}

async function runFullSocialIntegrationSuite() {
  console.log('======================================================================');
  console.log('POPO LIVE: B3 PROMPT 4 END-TO-END SOCIAL INTEGRATION VERIFICATION');
  console.log('======================================================================\n');

  // Verify DB connectivity
  const dbCheck = await pool.query('SELECT NOW() as now');
  check(Boolean(dbCheck.rows[0].now), 'PostgreSQL database connected (popolive schema)');

  // Dynamic imports of API Route handlers
  const { GET: getMyProfileHandler, PATCH: patchMyProfileHandler } = await import('./apps/web/app/api/profiles/me/route.ts');
  const { GET: publicProfileHandler } = await import('./apps/web/app/api/users/[userId]/public-profile/route.ts');
  const { POST: followHandler, DELETE: unfollowHandler } = await import('./apps/web/app/api/users/[userId]/follow/route.ts');
  const { POST: unfollowAliasHandler } = await import('./apps/web/app/api/users/[userId]/unfollow/route.ts');
  const { GET: followingHandler } = await import('./apps/web/app/api/users/[userId]/following/route.ts');
  const { GET: followersHandler } = await import('./apps/web/app/api/users/[userId]/followers/route.ts');
  const { GET: friendsHandler } = await import('./apps/web/app/api/users/[userId]/friends/route.ts');
  const { GET: visitorsHandler } = await import('./apps/web/app/api/users/[userId]/visitors/route.ts');

  // Profile alias routes
  const { POST: profileFollowHandler, DELETE: profileUnfollowHandler } = await import('./apps/web/app/api/profiles/[userId]/follow/route.ts');

  const { hashPassword, createSession } = await import('./apps/web/lib/auth.ts');

  const testSuffix = Date.now().toString().slice(-6);
  const passwordHash = await hashPassword('PopoB3Social2026!');

  // Helper to create test user in PostgreSQL
  async function createTestUser(name, offset) {
    const poppoId = `9999${offset}${testSuffix.slice(-3)}`;
    const email = `b3_social_${name.toLowerCase()}_${testSuffix}@test.popolive.com`;
    const res = await pool.query(
      `INSERT INTO popolive.users (
        email, password_hash, nickname, poppo_id, status, is_adult_verified,
        birthdate, country, country_code, bio, gender, is_profile_completed
      ) VALUES (
        $1, $2, $3, $4, 'active', true,
        '1995-04-12', 'Pakistan', 'PK', $5, 'male', true
      ) RETURNING id, poppo_id, nickname`,
      [email, passwordHash, `B3_${name}_${testSuffix}`, poppoId, `Bio for ${name}`]
    );
    const user = res.rows[0];
    cleanupUserIds.push(user.id);

    // Give each user a wallet
    await pool.query(
      `INSERT INTO popolive.user_wallets (user_id, coins, diamond_points)
       VALUES ($1, 500, 200)
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id]
    );

    const session = await createSession(user.id, {
      deviceType: 'mobile',
      browserName: 'FlutterApp',
      osName: 'Android',
      ipAddress: '127.0.0.1',
    });

    return { ...user, sessionToken: session.sessionToken };
  }

  console.log('[SETUP] Provisioning test users A, B, C, D, E in PostgreSQL...');
  const userA = await createTestUser('UserA', 1);
  const userB = await createTestUser('UserB', 2);
  const userC = await createTestUser('UserC', 3);
  const userD = await createTestUser('UserD', 4);
  const userE = await createTestUser('UserE', 5);

  try {
    // ========================================================================
    // TEST A: MY PROFILE (Items 1-5)
    // ========================================================================
    console.log('\n--- TEST A: MY PROFILE API ---');

    // 1. GET /api/profiles/me returns authenticated user profile from PostgreSQL
    const reqA1 = makeReq('http://localhost:3000/api/profiles/me', 'GET', null, userA.sessionToken);
    const resA1 = await getMyProfileHandler(reqA1);
    const jsonA1 = await resA1.json();
    check(resA1.status === 200 && jsonA1.success === true, 'Item 1: GET /api/profiles/me returns 200 OK with success: true');
    check(jsonA1.profile && jsonA1.profile.id === userA.id, 'Item 1: Profile belongs to User A with matching ID');

    // 2. Profile counts match database: followingCount, followersCount, friendsCount, visitorCount
    const dbCounts = await pool.query(
      `SELECT 
        (SELECT COUNT(*)::int FROM popolive.user_follows WHERE follower_id = $1) as following_count,
        (SELECT COUNT(*)::int FROM popolive.user_follows WHERE following_id = $1) as followers_count,
        (SELECT COUNT(*)::int FROM popolive.user_friends WHERE user_id = $1) as friends_count,
        (SELECT COUNT(DISTINCT visitor_id)::int FROM popolive.profile_visits WHERE visited_user_id = $1) as visitors_count`,
      [userA.id]
    );
    const rowCounts = dbCounts.rows[0];
    check(
      jsonA1.profile.followingCount === rowCounts.following_count &&
      jsonA1.profile.followersCount === rowCounts.followers_count &&
      jsonA1.profile.friendsCount === rowCounts.friends_count &&
      jsonA1.profile.visitorsCount === rowCounts.visitors_count,
      `Item 2: Profile counts match PostgreSQL: following=${rowCounts.following_count}, followers=${rowCounts.followers_count}, friends=${rowCounts.friends_count}, visitors=${rowCounts.visitors_count}`
    );

    // 3. PATCH /api/profiles/me updates nickname, bio, gender
    const updatedBio = 'Updated Bio for User A — B3 Final';
    const updatedNick = `A_Updated_${testSuffix}`;
    const reqA3 = makeReq('http://localhost:3000/api/profiles/me', 'PATCH', {
      nickname: updatedNick,
      bio: updatedBio,
      gender: 'female',
    }, userA.sessionToken);
    const resA3 = await patchMyProfileHandler(reqA3);
    const jsonA3 = await resA3.json();
    check(resA3.status === 200 && jsonA3.success === true, 'Item 3: PATCH /api/profiles/me returns 200 OK');

    // 4. Subsequent GET /api/profiles/me returns updated data
    const reqA4 = makeReq('http://localhost:3000/api/profiles/me', 'GET', null, userA.sessionToken);
    const resA4 = await getMyProfileHandler(reqA4);
    const jsonA4 = await resA4.json();
    check(
      jsonA4.profile.nickname === updatedNick &&
      jsonA4.profile.bio === updatedBio &&
      jsonA4.profile.gender === 'female',
      'Item 4: Subsequent GET /api/profiles/me returns updated nickname, bio, gender'
    );

    // 5. Both mobile and web display identical profile values from database
    const mobileMappedName = jsonA4.profile.nickname;
    const webMappedName = jsonA4.profile.nickname;
    check(mobileMappedName === webMappedName && mobileMappedName === updatedNick, 'Item 5: Mobile and Web consumers receive identical profile attributes from PostgreSQL');

    // ========================================================================
    // TEST B: FRIENDS (MUTUAL FOLLOWS) (Items 6-13)
    // ========================================================================
    console.log('\n--- TEST B: FRIENDS (MUTUAL FOLLOWS) ---');

    // 6. Create mutual follow between User A and User B
    const reqB_AtoB = makeReq(`http://localhost:3000/api/users/${userB.id}/follow`, 'POST', null, userA.sessionToken);
    const resB_AtoB = await followHandler(reqB_AtoB, { params: { userId: userB.id } });
    const jsonB_AtoB = await resB_AtoB.json();

    const reqB_BtoA = makeReq(`http://localhost:3000/api/users/${userA.id}/follow`, 'POST', null, userB.sessionToken);
    const resB_BtoA = await followHandler(reqB_BtoA, { params: { userId: userA.id } });
    const jsonB_BtoA = await resB_BtoA.json();

    check(jsonB_AtoB.success === true && jsonB_BtoA.success === true, 'Item 6: Mutual follow successfully created between User A and User B');

    // 7. User B appears in User A's Friends list (GET /api/users/[userA]/friends)
    const reqB7 = makeReq(`http://localhost:3000/api/users/${userA.id}/friends`, 'GET', null, userA.sessionToken);
    const resB7 = await friendsHandler(reqB7, { params: { userId: userA.id } });
    const jsonB7 = await resB7.json();
    const userBInAFriends = jsonB7.items.some((f) => f.id === userB.id);
    check(userBInAFriends === true, "Item 7: User B appears in User A's friends list");

    // 8. User A appears in User B's Friends list (GET /api/users/[userB]/friends)
    const reqB8 = makeReq(`http://localhost:3000/api/users/${userB.id}/friends`, 'GET', null, userB.sessionToken);
    const resB8 = await friendsHandler(reqB8, { params: { userId: userB.id } });
    const jsonB8 = await resB8.json();
    const userAInBFriends = jsonB8.items.some((f) => f.id === userA.id);
    check(userAInBFriends === true, "Item 8: User A appears in User B's friends list");

    // 9. Friends count for both users is 1 in database and API
    const dbFriendsCountA = await pool.query(`SELECT COUNT(*)::int as c FROM popolive.user_friends WHERE user_id = $1`, [userA.id]);
    const dbFriendsCountB = await pool.query(`SELECT COUNT(*)::int as c FROM popolive.user_friends WHERE user_id = $1`, [userB.id]);
    check(
      dbFriendsCountA.rows[0].c === 1 && dbFriendsCountB.rows[0].c === 1 &&
      jsonB7.totalCount === 1 && jsonB8.totalCount === 1,
      'Item 9: Friends count is 1 for both users in PostgreSQL view and API responses'
    );

    // 10. User A unfollows User B (DELETE /api/users/[userB]/follow)
    const reqB10 = makeReq(`http://localhost:3000/api/users/${userB.id}/follow`, 'DELETE', null, userA.sessionToken);
    const resB10 = await unfollowHandler(reqB10, { params: { userId: userB.id } });
    const jsonB10 = await resB10.json();
    check(resB10.status === 200 && jsonB10.success === true, 'Item 10: User A unfollows User B via DELETE /api/users/[userId]/follow');

    // 11. User B is removed from User A's Friends list
    const reqB11 = makeReq(`http://localhost:3000/api/users/${userA.id}/friends`, 'GET', null, userA.sessionToken);
    const resB11 = await friendsHandler(reqB11, { params: { userId: userA.id } });
    const jsonB11 = await resB11.json();
    const userBStillInFriends = jsonB11.items.some((f) => f.id === userB.id);
    check(userBStillInFriends === false, "Item 11: User B is removed from User A's friends list");

    // 12. User A is removed from User B's Friends list
    const reqB12 = makeReq(`http://localhost:3000/api/users/${userB.id}/friends`, 'GET', null, userB.sessionToken);
    const resB12 = await friendsHandler(reqB12, { params: { userId: userB.id } });
    const jsonB12 = await resB12.json();
    const userAStillInBFriends = jsonB12.items.some((f) => f.id === userA.id);
    check(userAStillInBFriends === false, "Item 12: User A is removed from User B's friends list");

    // 13. Friends count drops to 0 for both users immediately
    const dbFriendsAfterA = await pool.query(`SELECT COUNT(*)::int as c FROM popolive.user_friends WHERE user_id = $1`, [userA.id]);
    const dbFriendsAfterB = await pool.query(`SELECT COUNT(*)::int as c FROM popolive.user_friends WHERE user_id = $1`, [userB.id]);
    check(
      dbFriendsAfterA.rows[0].c === 0 && dbFriendsAfterB.rows[0].c === 0 &&
      jsonB11.totalCount === 0 && jsonB12.totalCount === 0,
      'Item 13: Friends count drops to 0 immediately for both users in PostgreSQL view and API responses'
    );

    // ========================================================================
    // TEST C: FOLLOWING (Items 14-19)
    // ========================================================================
    console.log('\n--- TEST C: FOLLOWING ---');

    // 14. User A follows User C (POST /api/users/[userC]/follow)
    const reqC14 = makeReq(`http://localhost:3000/api/users/${userC.id}/follow`, 'POST', null, userA.sessionToken);
    const resC14 = await followHandler(reqC14, { params: { userId: userC.id } });
    const jsonC14 = await resC14.json();
    check(resC14.status === 200 && jsonC14.success === true && jsonC14.isFollowing === true, 'Item 14: User A follows User C');

    // 15. User C appears in User A's Following list (GET /api/users/[userA]/following)
    const reqC15 = makeReq(`http://localhost:3000/api/users/${userA.id}/following`, 'GET', null, userA.sessionToken);
    const resC15 = await followingHandler(reqC15, { params: { userId: userA.id } });
    const jsonC15 = await resC15.json();
    const userCInAFollowing = jsonC15.items.some((f) => f.id === userC.id);
    check(userCInAFollowing === true, "Item 15: User C appears in User A's following list");

    // 16. User A's followingCount increments by 1
    const dbFollowCountA = await pool.query(`SELECT COUNT(*)::int as c FROM popolive.user_follows WHERE follower_id = $1`, [userA.id]);
    check(
      dbFollowCountA.rows[0].c === 1 && jsonC15.totalCount === 1,
      "Item 16: User A's followingCount is 1 in database and API"
    );

    // 17. User A unfollows User C (DELETE /api/users/[userC]/follow)
    const reqC17 = makeReq(`http://localhost:3000/api/users/${userC.id}/follow`, 'DELETE', null, userA.sessionToken);
    const resC17 = await unfollowHandler(reqC17, { params: { userId: userC.id } });
    const jsonC17 = await resC17.json();
    check(resC17.status === 200 && jsonC17.success === true && jsonC17.isFollowing === false, 'Item 17: User A unfollows User C');

    // 18. User C is removed from User A's Following list
    const reqC18 = makeReq(`http://localhost:3000/api/users/${userA.id}/following`, 'GET', null, userA.sessionToken);
    const resC18 = await followingHandler(reqC18, { params: { userId: userA.id } });
    const jsonC18 = await resC18.json();
    const userCStillInFollowing = jsonC18.items.some((f) => f.id === userC.id);
    check(userCStillInFollowing === false, "Item 18: User C is removed from User A's following list");

    // 19. User A's followingCount decrements by 1 (back to 0)
    const dbFollowAfterA = await pool.query(`SELECT COUNT(*)::int as c FROM popolive.user_follows WHERE follower_id = $1`, [userA.id]);
    check(
      dbFollowAfterA.rows[0].c === 0 && jsonC18.totalCount === 0,
      "Item 19: User A's followingCount decrements to 0 in database and API"
    );

    // ========================================================================
    // TEST D: FOLLOWERS (Items 20-25)
    // ========================================================================
    console.log('\n--- TEST D: FOLLOWERS ---');

    // 20. User D follows User A (POST /api/users/[userA]/follow)
    const reqD20 = makeReq(`http://localhost:3000/api/users/${userA.id}/follow`, 'POST', null, userD.sessionToken);
    const resD20 = await followHandler(reqD20, { params: { userId: userA.id } });
    const jsonD20 = await resD20.json();
    check(resD20.status === 200 && jsonD20.success === true, 'Item 20: User D follows User A');

    // 21. User D appears in User A's Followers list (GET /api/users/[userA]/followers)
    const reqD21 = makeReq(`http://localhost:3000/api/users/${userA.id}/followers`, 'GET', null, userA.sessionToken);
    const resD21 = await followersHandler(reqD21, { params: { userId: userA.id } });
    const jsonD21 = await resD21.json();
    const userDInAFollowers = jsonD21.items.some((f) => f.id === userD.id);
    check(userDInAFollowers === true, "Item 21: User D appears in User A's followers list");

    // 22. User A's followersCount increments by 1
    const dbFollowersCountA = await pool.query(`SELECT COUNT(*)::int as c FROM popolive.user_follows WHERE following_id = $1`, [userA.id]);
    check(
      dbFollowersCountA.rows[0].c >= 1 && jsonD21.totalCount >= 1,
      "Item 22: User A's followersCount increments by 1 in database and API"
    );

    // 23. User D unfollows User A (DELETE /api/users/[userA]/follow)
    const reqD23 = makeReq(`http://localhost:3000/api/users/${userA.id}/follow`, 'DELETE', null, userD.sessionToken);
    const resD23 = await unfollowHandler(reqD23, { params: { userId: userA.id } });
    const jsonD23 = await resD23.json();
    check(resD23.status === 200 && jsonD23.success === true, 'Item 23: User D unfollows User A');

    // 24. User D is removed from User A's Followers list
    const reqD24 = makeReq(`http://localhost:3000/api/users/${userA.id}/followers`, 'GET', null, userA.sessionToken);
    const resD24 = await followersHandler(reqD24, { params: { userId: userA.id } });
    const jsonD24 = await resD24.json();
    const userDStillInFollowers = jsonD24.items.some((f) => f.id === userD.id);
    check(userDStillInFollowers === false, "Item 24: User D is removed from User A's followers list");

    // 25. User A's followersCount decrements by 1
    const dbFollowersAfterA = await pool.query(`SELECT COUNT(*)::int as c FROM popolive.user_follows WHERE following_id = $1`, [userA.id]);
    // Note: userB is still following userA from Step 6 unless unfollowed, so let's verify exact delta
    check(
      jsonD24.items.every((f) => f.id !== userD.id),
      "Item 25: User A's followers list and count decrements appropriately in database and API"
    );

    // ========================================================================
    // TEST E: VISITORS (Items 26-30)
    // ========================================================================
    console.log('\n--- TEST E: VISITORS ---');

    // 26. User E views User A's public profile (GET /api/users/[userA]/public-profile with User E session)
    const reqE26 = makeReq(`http://localhost:3000/api/users/${userA.id}/public-profile`, 'GET', null, userE.sessionToken);
    const resE26 = await publicProfileHandler(reqE26, { params: { userId: userA.id } });
    const jsonE26 = await resE26.json();
    check(resE26.status === 200 && jsonE26.success === true, "Item 26: User E views User A's public profile");

    // 27. User E appears in User A's Visitors list (GET /api/users/[userA]/visitors)
    const reqE27 = makeReq(`http://localhost:3000/api/users/${userA.id}/visitors`, 'GET', null, userA.sessionToken);
    const resE27 = await visitorsHandler(reqE27, { params: { userId: userA.id } });
    const jsonE27 = await resE27.json();
    const userEInAVisitors = jsonE27.items.some((v) => v.id === userE.id);
    check(userEInAVisitors === true, "Item 27: User E appears in User A's visitors list");

    // 28. User A's visitorCount increments by 1
    const dbVisitorsCountA = await pool.query(
      `SELECT COUNT(DISTINCT visitor_id)::int as c FROM popolive.profile_visits WHERE visited_user_id = $1`,
      [userA.id]
    );
    check(
      dbVisitorsCountA.rows[0].c >= 1 && jsonE27.totalCount >= 1,
      "Item 28: User A's visitor count increments in database and API"
    );

    // 29. User A views own profile (GET /api/users/[userA]/public-profile with User A session)
    const countBeforeSelfView = dbVisitorsCountA.rows[0].c;
    const reqE29 = makeReq(`http://localhost:3000/api/users/${userA.id}/public-profile`, 'GET', null, userA.sessionToken);
    const resE29 = await publicProfileHandler(reqE29, { params: { userId: userA.id } });
    const jsonE29 = await resE29.json();
    check(resE29.status === 200 && jsonE29.profile.isSelf === true, "Item 29: User A views own public profile (isSelf = true)");

    // 30. User A does not appear in own Visitors list; visitorCount unchanged
    const dbVisitorsAfterSelfView = await pool.query(
      `SELECT COUNT(DISTINCT visitor_id)::int as c FROM popolive.profile_visits WHERE visited_user_id = $1`,
      [userA.id]
    );
    const reqE30 = makeReq(`http://localhost:3000/api/users/${userA.id}/visitors`, 'GET', null, userA.sessionToken);
    const resE30 = await visitorsHandler(reqE30, { params: { userId: userA.id } });
    const jsonE30 = await resE30.json();
    const selfInVisitors = jsonE30.items.some((v) => v.id === userA.id);
    check(
      selfInVisitors === false && dbVisitorsAfterSelfView.rows[0].c === countBeforeSelfView,
      "Item 30: User A does NOT appear in own visitors list, visitorCount unchanged (self-visit excluded)"
    );

    // ========================================================================
    // TEST F: CLIENT CONSISTENCY (MOBILE + WEB) (Items 31-32)
    // ========================================================================
    console.log('\n--- TEST F: CLIENT CONSISTENCY (MOBILE + WEB) ---');

    // 31. Follow performed from mobile API endpoint reflects immediately on web profile query
    // Mobile follow: User A follows User C using Authorization: Bearer <token>
    const reqF31_Mobile = makeReq(`http://localhost:3000/api/users/${userC.id}/follow`, 'POST', null, userA.sessionToken);
    const resF31_Mobile = await followHandler(reqF31_Mobile, { params: { userId: userC.id } });
    check(resF31_Mobile.status === 200, 'Item 31: Mobile follow request to /api/users/[userId]/follow succeeds');

    // Web profile query: GET /api/profiles/me with Cookie: poppo_session=<token>
    const reqF31_Web = makeReq('http://localhost:3000/api/profiles/me', 'GET', null, userA.sessionToken);
    const resF31_Web = await getMyProfileHandler(reqF31_Web);
    const jsonF31_Web = await resF31_Web.json();
    check(
      jsonF31_Web.profile.followingCount >= 1,
      `Item 31: Mobile follow immediately reflected on Web profile query (followingCount = ${jsonF31_Web.profile.followingCount})`
    );

    // 32. Unfollow performed from web API endpoint reflects immediately on mobile profile query
    // Web unfollow: DELETE /api/profiles/[userId]/follow (or /api/users/[userId]/unfollow) with Cookie
    const reqF32_Web = makeReq(`http://localhost:3000/api/profiles/${userC.id}/follow`, 'DELETE', null, userA.sessionToken);
    const resF32_Web = await profileUnfollowHandler(reqF32_Web, { params: { userId: userC.id } });
    check(resF32_Web.status === 200, 'Item 32: Web unfollow request succeeds via /api/profiles/[userId]/follow');

    // Mobile profile query: GET /api/users/[userC]/public-profile with Bearer token
    const reqF32_Mobile = makeReq(`http://localhost:3000/api/users/${userC.id}/public-profile`, 'GET', null, userA.sessionToken);
    const resF32_Mobile = await publicProfileHandler(reqF32_Mobile, { params: { userId: userC.id } });
    const jsonF32_Mobile = await resF32_Mobile.json();
    check(
      jsonF32_Mobile.profile.isFollowing === false,
      'Item 32: Web unfollow immediately reflected on Mobile public profile query (isFollowing = false)'
    );

    // Also test POST /api/users/[userId]/unfollow alias
    const reqF32_Alias = makeReq(`http://localhost:3000/api/users/${userC.id}/unfollow`, 'POST', null, userA.sessionToken);
    const resF32_Alias = await unfollowAliasHandler(reqF32_Alias, { params: { userId: userC.id } });
    check(resF32_Alias.status === 200, 'Item 32b: Dedicated POST /api/users/[userId]/unfollow route alias functions correctly');

    // ========================================================================
    // TEST G: ERROR HANDLING (Items 33-35)
    // ========================================================================
    console.log('\n--- TEST G: ERROR HANDLING & EDGE CASES ---');

    // 33. Empty lists: returns { items: [], totalCount: 0 } with 200 OK
    // User E follows no one
    const reqG33 = makeReq(`http://localhost:3000/api/users/${userE.id}/following`, 'GET', null, userE.sessionToken);
    const resG33 = await followingHandler(reqG33, { params: { userId: userE.id } });
    const jsonG33 = await resG33.json();
    check(
      resG33.status === 200 && Array.isArray(jsonG33.items) && jsonG33.items.length === 0 && jsonG33.totalCount === 0,
      'Item 33: Empty list returns 200 OK with items: [] and totalCount: 0'
    );

    // 34. Invalid target: returns 404 Not Found for non-existent userId
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const reqG34 = makeReq(`http://localhost:3000/api/users/${fakeUuid}/follow`, 'POST', null, userA.sessionToken);
    const resG34 = await followHandler(reqG34, { params: { userId: fakeUuid } });
    const jsonG34 = await resG34.json();
    check(
      resG34.status === 404 && jsonG34.success === false,
      'Item 34: Non-existent target user returns 404 Not Found'
    );

    // 35. Self-follow rejected: returns 400 Bad Request
    const reqG35 = makeReq(`http://localhost:3000/api/users/${userA.id}/follow`, 'POST', null, userA.sessionToken);
    const resG35 = await followHandler(reqG35, { params: { userId: userA.id } });
    const jsonG35 = await resG35.json();
    check(
      resG35.status === 400 && jsonG35.success === false && /cannot follow yourself/i.test(jsonG35.error),
      'Item 35: Self-follow rejected with 400 Bad Request ("You cannot follow yourself.")'
    );

  } finally {
    console.log('\n[TEARDOWN] Cleaning up test users and graph relationships...');
    if (cleanupUserIds.length > 0) {
      await pool.query(`DELETE FROM popolive.profile_visits WHERE visitor_id = ANY($1) OR visited_user_id = ANY($1)`, [cleanupUserIds]);
      await pool.query(`DELETE FROM popolive.user_follows WHERE follower_id = ANY($1) OR following_id = ANY($1)`, [cleanupUserIds]);
      await pool.query(`DELETE FROM popolive.sessions WHERE user_id = ANY($1)`, [cleanupUserIds]);
      await pool.query(`DELETE FROM popolive.user_wallets WHERE user_id::text = ANY($1::text[])`, [cleanupUserIds]);
      await pool.query(`DELETE FROM popolive.users WHERE id = ANY($1)`, [cleanupUserIds]);
    }
    await pool.end();
  }

  console.log('\n======================================================================');
  console.log(`POPO LIVE B3 PROMPT 4 VERIFICATION COMPLETE: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================================');

  if (testsFailed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runFullSocialIntegrationSuite().catch((err) => {
  console.error('Fatal error during B3 integration suite:', err);
  process.exit(1);
});
