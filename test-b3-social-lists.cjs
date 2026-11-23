/**
 * ============================================================================
 * POPO LIVE — PHASE B3 PROMPT 3 OF 4: SOCIAL GRAPH & AUDIENCE LISTS AUDIT
 * Master Plan Reference: POPO-LIVE-BACKEND-REALTIME-PLAN.pdf (Phase B3, pages 3–4)
 *
 * Comprehensive Verification of 22 Audit Items:
 * Following:
 *  1. 1-way follow in list
 *  2. Unrelated user excluded from following
 *  3. Empty following list returns empty items and 0 count
 * Followers:
 *  4. 1-way follower in list
 *  5. Count accurate
 *  6. Empty followers list returns empty items and 0 count
 * Friends:
 *  7. Mutual follows appear in friends list
 *  8. 1-way follows excluded from friends list
 *  9. No duplicates in friends list
 * 10. Count matches actual mutual follows
 * Visitors:
 * 11. Authenticated view appears in visitors list
 * 12. Sorted by latest visit
 * 13. Count accurate
 * 14. Self-visits excluded
 * 15. Empty visitors list returns empty items and 0 count
 * API & Security:
 * 16. Invalid user ID / format handling
 * 17. Nonexistent user returns 404
 * 18. Pagination: page and limit work correctly
 * 19. Pagination: hasMore and totalPages accurate
 * 20. Unauthenticated request handling
 * 21. No fixture fallback when real API is active
 * 22. Zero duplicate rows across all lists
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

async function runSocialListsSuite() {
  console.log('======================================================================');
  console.log('POPO LIVE: B3 PROMPT 3 SOCIAL GRAPH & AUDIENCE LISTS AUDIT');
  console.log('======================================================================\n');

  // Verify DB connectivity
  const dbCheck = await pool.query('SELECT NOW() as now');
  check(Boolean(dbCheck.rows[0].now), 'PostgreSQL database connected (popolive schema)');

  // Import Next.js route handlers and auth utilities
  const { GET: followingHandler } = await import('./apps/web/app/api/users/[userId]/following/route.ts');
  const { GET: followersHandler } = await import('./apps/web/app/api/users/[userId]/followers/route.ts');
  const { GET: friendsHandler } = await import('./apps/web/app/api/users/[userId]/friends/route.ts');
  const { GET: visitorsHandler } = await import('./apps/web/app/api/users/[userId]/visitors/route.ts');

  // Alias profile route handlers
  const { GET: profileFollowingHandler } = await import('./apps/web/app/api/profiles/[userId]/following/route.ts');
  const { GET: profileFollowersHandler } = await import('./apps/web/app/api/profiles/[userId]/followers/route.ts');
  const { GET: profileFriendsHandler } = await import('./apps/web/app/api/profiles/[userId]/friends/route.ts');
  const { GET: profileVisitorsHandler } = await import('./apps/web/app/api/profiles/[userId]/visitors/route.ts');

  const { hashPassword, createSession } = await import('./apps/web/lib/auth.ts');
  const {
    getUserFollowing,
    getUserFollowers,
    getUserFriends,
    getUserVisitors,
  } = await import('./apps/web/lib/finalApiService.ts');

  const testSuffix = Date.now().toString().slice(-6);
  const passwordHash = await hashPassword('TestSocial2026!');

  // Helper to insert test user
  async function createTestUser(role, offset, status = 'active') {
    const poppoId = `8888${offset}${testSuffix.slice(-3)}`;
    const email = `social_${role}_${testSuffix}@test.popolive.com`;
    const res = await pool.query(
      `INSERT INTO popolive.users (
        email, password_hash, nickname, poppo_id, status, is_adult_verified,
        birthdate, country, country_code, bio, host_level, wealth_level, is_profile_completed
      ) VALUES (
        $1, $2, $3, $4, $5, true,
        '1996-05-15', 'Pakistan', 'PK', $6, $7, $8, true
      ) RETURNING id, poppo_id, nickname`,
      [email, passwordHash, `Social_${role}_${testSuffix}`, poppoId, status, `Bio of ${role}`, offset, offset * 2]
    );
    cleanupUserIds.push(res.rows[0].id);
    return res.rows[0];
  }

  console.log('\n[SETUP] Creating controlled test social graph in PostgreSQL...');

  // 1. Alice (Target user)
  const alice = await createTestUser('Alice', 1);
  // 2. Bob (Follower only: Bob -> Alice)
  const bob = await createTestUser('Bob', 2);
  // 3. Charlie (Following only: Alice -> Charlie)
  const charlie = await createTestUser('Charlie', 3);
  // 4. David (Mutual friend: Alice <-> David)
  const david = await createTestUser('David', 4);
  // 5. Eve (Unrelated: no follows, but visits profile)
  const eve = await createTestUser('Eve', 5);
  // 6. Frank (Inactive / banned: Alice follows Frank, but Frank is inactive)
  const frank = await createTestUser('Frank', 6, 'banned');
  // 7. Grace (Isolated: 0 follows, 0 followers, 0 friends, 0 visits)
  const grace = await createTestUser('Grace', 7);

  console.log(`  Target Alice: ${alice.id} (poppo: ${alice.poppo_id})`);
  console.log(`  Bob (Follower only): ${bob.id}`);
  console.log(`  Charlie (Following only): ${charlie.id}`);
  console.log(`  David (Mutual friend): ${david.id}`);
  console.log(`  Eve (Visitor): ${eve.id}`);
  console.log(`  Frank (Banned): ${frank.id}`);
  console.log(`  Grace (Empty): ${grace.id}`);

  // Create follow relationships
  // Bob follows Alice (1-way follower)
  await pool.query(
    `INSERT INTO popolive.user_follows (follower_id, following_id, created_at)
     VALUES ($1, $2, NOW() - INTERVAL '4 hours')`,
    [bob.id, alice.id]
  );

  // Alice follows Charlie (1-way following)
  await pool.query(
    `INSERT INTO popolive.user_follows (follower_id, following_id, created_at)
     VALUES ($1, $2, NOW() - INTERVAL '3 hours')`,
    [alice.id, charlie.id]
  );

  // Alice and David follow each other (mutual friends)
  await pool.query(
    `INSERT INTO popolive.user_follows (follower_id, following_id, created_at)
     VALUES ($1, $2, NOW() - INTERVAL '2 hours')`,
    [alice.id, david.id]
  );
  await pool.query(
    `INSERT INTO popolive.user_follows (follower_id, following_id, created_at)
     VALUES ($1, $2, NOW() - INTERVAL '1 hour')`,
    [david.id, alice.id]
  );

  // Alice follows Frank (banned user)
  await pool.query(
    `INSERT INTO popolive.user_follows (follower_id, following_id, created_at)
     VALUES ($1, $2, NOW() - INTERVAL '5 hours')`,
    [alice.id, frank.id]
  );

  // Create visits
  // Bob visits Alice 30 min ago and 5 min ago
  await pool.query(
    `INSERT INTO popolive.profile_visits (visitor_id, visited_user_id, visited_at, source)
     VALUES ($1, $2, NOW() - INTERVAL '30 minutes', 'profile_card')`,
    [bob.id, alice.id]
  );
  await pool.query(
    `INSERT INTO popolive.profile_visits (visitor_id, visited_user_id, visited_at, source)
     VALUES ($1, $2, NOW() - INTERVAL '5 minutes', 'live_room')`,
    [bob.id, alice.id]
  );

  // Eve visits Alice 15 min ago
  await pool.query(
    `INSERT INTO popolive.profile_visits (visitor_id, visited_user_id, visited_at, source)
     VALUES ($1, $2, NOW() - INTERVAL '15 minutes', 'square_post')`,
    [eve.id, alice.id]
  );

  // Sessions for authenticated testing
  const aliceSession = await createSession(alice.id);
  const bobSession = await createSession(bob.id);

  const { NextRequest } = require(path.resolve(__dirname, 'apps/web/node_modules/next/server'));

  function makeRequest(url, token = null) {
    const headers = new Headers();
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
      headers.set('cookie', `poppo_session=${token}`);
    }
    return new NextRequest(new URL(url, 'http://localhost:3000'), { method: 'GET', headers });
  }

  console.log('\n======================================================================');
  console.log('AUDIT ITEM 1, 2, 3: FOLLOWING LIST API');
  console.log('======================================================================');

  // Request Alice's following list (unauthenticated)
  const reqFollowing = makeRequest(`http://localhost:3000/api/users/${alice.id}/following`);
  const resFollowing = await followingHandler(reqFollowing, { params: { userId: alice.id } });
  const dataFollowing = await resFollowing.json();

  check(resFollowing.status === 200, 'GET /api/users/[userId]/following returns 200 OK');
  check(dataFollowing.success === true, 'Response contains success: true');
  check(dataFollowing.targetUser.id === alice.id, 'Target user matches Alice');
  check(Array.isArray(dataFollowing.items), 'data.items is an array');
  check(Array.isArray(dataFollowing.following), 'data.following is an array');

  // Item 1: 1-way follow in list (Charlie & David in list)
  const followingIds = dataFollowing.items.map((i) => i.id);
  check(followingIds.includes(charlie.id), 'Audit Item 1: 1-way follow Charlie appears in following list');
  check(followingIds.includes(david.id), 'Mutual follow David appears in following list');

  // Item 2: Unrelated user excluded from following
  check(!followingIds.includes(bob.id), 'Audit Item 2: Follower Bob is excluded from following list');
  check(!followingIds.includes(eve.id), 'Unrelated Eve is excluded from following list');
  check(!followingIds.includes(frank.id), 'Inactive/banned Frank is excluded from following list');
  check(dataFollowing.totalCount === 2, `Total count matches active followed users (expected 2, got ${dataFollowing.totalCount})`);

  // Item 3: Empty following list
  const reqGraceFollowing = makeRequest(`http://localhost:3000/api/users/${grace.id}/following`);
  const resGraceFollowing = await followingHandler(reqGraceFollowing, { params: { userId: grace.id } });
  const dataGraceFollowing = await resGraceFollowing.json();
  check(resGraceFollowing.status === 200, 'Grace following returns 200 OK');
  check(dataGraceFollowing.totalCount === 0, 'Audit Item 3: Empty following list totalCount is 0');
  check(dataGraceFollowing.items.length === 0, 'Empty following list items array is empty');

  // Test profile alias route /api/profiles/[userId]/following
  const reqProfileFollowing = makeRequest(`http://localhost:3000/api/profiles/${alice.id}/following`);
  const resProfileFollowing = await profileFollowingHandler(reqProfileFollowing, { params: { userId: alice.id } });
  const dataProfileFollowing = await resProfileFollowing.json();
  check(resProfileFollowing.status === 200, 'Alias /api/profiles/[userId]/following returns 200 OK');
  check(dataProfileFollowing.totalCount === 2, 'Alias route returns same following totalCount (2)');

  console.log('\n======================================================================');
  console.log('AUDIT ITEM 4, 5, 6: FOLLOWERS LIST API');
  console.log('======================================================================');

  // Request Alice's followers list
  const reqFollowers = makeRequest(`http://localhost:3000/api/users/${alice.id}/followers`);
  const resFollowers = await followersHandler(reqFollowers, { params: { userId: alice.id } });
  const dataFollowers = await resFollowers.json();

  check(resFollowers.status === 200, 'GET /api/users/[userId]/followers returns 200 OK');
  check(dataFollowers.success === true, 'Followers response contains success: true');
  check(Array.isArray(dataFollowers.followers), 'data.followers is an array');

  // Item 4: 1-way follower in list
  const followerIds = dataFollowers.items.map((i) => i.id);
  check(followerIds.includes(bob.id), 'Audit Item 4: 1-way follower Bob appears in followers list');
  check(followerIds.includes(david.id), 'Mutual friend David appears in followers list');
  check(!followerIds.includes(charlie.id), 'Following-only Charlie is excluded from followers list');
  check(!followerIds.includes(eve.id), 'Unrelated Eve is excluded from followers list');

  // Item 5: Count accurate
  check(dataFollowers.totalCount === 2, `Audit Item 5: Followers count accurate (expected 2, got ${dataFollowers.totalCount})`);

  // Item 6: Empty followers list
  const reqGraceFollowers = makeRequest(`http://localhost:3000/api/users/${grace.id}/followers`);
  const resGraceFollowers = await followersHandler(reqGraceFollowers, { params: { userId: grace.id } });
  const dataGraceFollowers = await resGraceFollowers.json();
  check(resGraceFollowers.status === 200, 'Grace followers returns 200 OK');
  check(dataGraceFollowers.totalCount === 0, 'Audit Item 6: Empty followers list totalCount is 0');
  check(dataGraceFollowers.items.length === 0, 'Empty followers list items array is empty');

  // Test alias /api/profiles/[userId]/followers
  const reqProfileFollowers = makeRequest(`http://localhost:3000/api/profiles/${alice.id}/followers`);
  const resProfileFollowers = await profileFollowersHandler(reqProfileFollowers, { params: { userId: alice.id } });
  const dataProfileFollowers = await resProfileFollowers.json();
  check(resProfileFollowers.status === 200, 'Alias /api/profiles/[userId]/followers returns 200 OK');
  check(dataProfileFollowers.totalCount === 2, 'Alias route followers totalCount matches (2)');

  console.log('\n======================================================================');
  console.log('AUDIT ITEM 7, 8, 9, 10: FRIENDS LIST API');
  console.log('======================================================================');

  // Request Alice's friends list
  const reqFriends = makeRequest(`http://localhost:3000/api/users/${alice.id}/friends`);
  const resFriends = await friendsHandler(reqFriends, { params: { userId: alice.id } });
  const dataFriends = await resFriends.json();

  check(resFriends.status === 200, 'GET /api/users/[userId]/friends returns 200 OK');
  check(dataFriends.success === true, 'Friends response contains success: true');
  check(Array.isArray(dataFriends.friends), 'data.friends is an array');

  // Item 7: Mutual follows appear in friends list
  const friendIds = dataFriends.items.map((i) => i.id);
  check(friendIds.includes(david.id), 'Audit Item 7: Mutual follow David appears in friends list');

  // Item 8: 1-way follows excluded from friends list
  check(!friendIds.includes(bob.id), 'Audit Item 8: 1-way follower Bob excluded from friends list');
  check(!friendIds.includes(charlie.id), '1-way following Charlie excluded from friends list');
  check(!friendIds.includes(eve.id), 'Unrelated Eve excluded from friends list');

  // Item 9: No duplicates in friends list
  const uniqueFriendIds = new Set(friendIds);
  check(uniqueFriendIds.size === friendIds.length, 'Audit Item 9: Zero duplicates in friends list');

  // Item 10: Count matches actual mutual follows
  check(dataFriends.totalCount === 1, `Audit Item 10: Count matches actual mutual follows (expected 1, got ${dataFriends.totalCount})`);
  check(dataFriends.items[0].establishedAt !== undefined, 'Friend item includes establishedAt timestamp');

  // Grace empty friends list
  const reqGraceFriends = makeRequest(`http://localhost:3000/api/users/${grace.id}/friends`);
  const resGraceFriends = await friendsHandler(reqGraceFriends, { params: { userId: grace.id } });
  const dataGraceFriends = await resGraceFriends.json();
  check(dataGraceFriends.totalCount === 0, 'Grace friends totalCount is 0');
  check(dataGraceFriends.items.length === 0, 'Grace friends items array is empty');

  // Test alias /api/profiles/[userId]/friends
  const reqProfileFriends = makeRequest(`http://localhost:3000/api/profiles/${alice.id}/friends`);
  const resProfileFriends = await profileFriendsHandler(reqProfileFriends, { params: { userId: alice.id } });
  const dataProfileFriends = await resProfileFriends.json();
  check(resProfileFriends.status === 200, 'Alias /api/profiles/[userId]/friends returns 200 OK');
  check(dataProfileFriends.totalCount === 1, 'Alias route friends totalCount matches (1)');

  console.log('\n======================================================================');
  console.log('AUDIT ITEM 11, 12, 13, 14, 15: VISITORS LIST API');
  console.log('======================================================================');

  // Request Alice's visitors list
  const reqVisitors = makeRequest(`http://localhost:3000/api/users/${alice.id}/visitors`);
  const resVisitors = await visitorsHandler(reqVisitors, { params: { userId: alice.id } });
  const dataVisitors = await resVisitors.json();

  check(resVisitors.status === 200, 'GET /api/users/[userId]/visitors returns 200 OK');
  check(dataVisitors.success === true, 'Visitors response contains success: true');
  check(Array.isArray(dataVisitors.visitors), 'data.visitors is an array');

  // Item 11: Authenticated view appears in visitors list
  const visitorIds = dataVisitors.items.map((i) => i.id);
  check(visitorIds.includes(bob.id), 'Audit Item 11: Visitor Bob appears in visitors list');
  check(visitorIds.includes(eve.id), 'Visitor Eve appears in visitors list');

  // Item 12: Sorted by latest visit
  // Bob visited 5 min ago; Eve visited 15 min ago. Bob must be index 0, Eve index 1.
  check(visitorIds[0] === bob.id, 'Audit Item 12: Visitor list sorted by latest visit (Bob 5m ago is 1st)');
  check(visitorIds[1] === eve.id, 'Visitor Eve (15m ago) is 2nd');
  const bobVisitTime = new Date(dataVisitors.items[0].visitedAt).getTime();
  const eveVisitTime = new Date(dataVisitors.items[1].visitedAt).getTime();
  check(bobVisitTime > eveVisitTime, 'Latest visit timestamp order verified (Bob > Eve)');

  // Item 13: Count accurate
  check(dataVisitors.totalCount === 2, `Audit Item 13: Distinct visitors count accurate (expected 2, got ${dataVisitors.totalCount})`);

  // Item 14: Self-visits excluded
  check(!visitorIds.includes(alice.id), 'Audit Item 14: Self-visits excluded from visitors list');

  // Item 15: Empty visitors list
  const reqGraceVisitors = makeRequest(`http://localhost:3000/api/users/${grace.id}/visitors`);
  const resGraceVisitors = await visitorsHandler(reqGraceVisitors, { params: { userId: grace.id } });
  const dataGraceVisitors = await resGraceVisitors.json();
  check(resGraceVisitors.status === 200, 'Grace visitors returns 200 OK');
  check(dataGraceVisitors.totalCount === 0, 'Audit Item 15: Empty visitors list totalCount is 0');
  check(dataGraceVisitors.items.length === 0, 'Empty visitors list items array is empty');

  // Test alias /api/profiles/[userId]/visitors
  const reqProfileVisitors = makeRequest(`http://localhost:3000/api/profiles/${alice.id}/visitors`);
  const resProfileVisitors = await profileVisitorsHandler(reqProfileVisitors, { params: { userId: alice.id } });
  const dataProfileVisitors = await resProfileVisitors.json();
  check(resProfileVisitors.status === 200, 'Alias /api/profiles/[userId]/visitors returns 200 OK');
  check(dataProfileVisitors.totalCount === 2, 'Alias route visitors totalCount matches (2)');

  console.log('\n======================================================================');
  console.log('AUDIT ITEM 16-22: API INTEGRITY, PAGINATION, SECURITY & METRICS');
  console.log('======================================================================');

  // Item 16: Invalid user ID / format handling
  const reqInvalid = makeRequest('http://localhost:3000/api/users/not-a-valid-user-999999/followers');
  const resInvalid = await followersHandler(reqInvalid, { params: { userId: 'not-a-valid-user-999999' } });
  check(resInvalid.status === 404, 'Audit Item 16: Nonexistent/invalid user ID returns 404');

  // Item 17: Nonexistent UUID returns 404
  const reqNonexistent = makeRequest('http://localhost:3000/api/users/00000000-0000-0000-0000-000000000000/following');
  const resNonexistent = await followingHandler(reqNonexistent, { params: { userId: '00000000-0000-0000-0000-000000000000' } });
  check(resNonexistent.status === 404, 'Audit Item 17: Nonexistent UUID returns 404');

  // Item 18: Pagination: page and limit
  const reqPage1 = makeRequest(`http://localhost:3000/api/users/${alice.id}/following?page=1&limit=1`);
  const resPage1 = await followingHandler(reqPage1, { params: { userId: alice.id } });
  const dataPage1 = await resPage1.json();
  check(dataPage1.items.length === 1, 'Audit Item 18: Pagination page=1 limit=1 returns 1 item');
  check(dataPage1.page === 1, 'Response page is 1');
  check(dataPage1.limit === 1, 'Response limit is 1');

  const reqPage2 = makeRequest(`http://localhost:3000/api/users/${alice.id}/following?page=2&limit=1`);
  const resPage2 = await followingHandler(reqPage2, { params: { userId: alice.id } });
  const dataPage2 = await resPage2.json();
  check(dataPage2.items.length === 1, 'Pagination page=2 limit=1 returns 1 item');
  check(dataPage2.items[0].id !== dataPage1.items[0].id, 'Page 2 item is distinct from Page 1 item');

  // Item 19: hasMore and totalPages
  check(dataPage1.totalPages === 2, `Audit Item 19: totalPages accurate (expected 2, got ${dataPage1.totalPages})`);
  check(dataPage1.hasMore === true, 'hasMore is true for page 1 of 2');
  check(dataPage2.hasMore === false, 'hasMore is false for page 2 of 2');

  // Item 20: Unauthenticated request handling & relationship flags
  // Unauthenticated request
  const unauthItem = dataFollowing.items[0];
  check(unauthItem.isFollowing === false, 'Audit Item 20: Unauthenticated viewer isFollowing defaults to false');
  check(unauthItem.isFollower === false, 'Unauthenticated viewer isFollower defaults to false');
  check(unauthItem.isFriend === false, 'Unauthenticated viewer isFriend defaults to false');
  check(unauthItem.isSelf === false, 'Unauthenticated viewer isSelf defaults to false');

  // Authenticated request with Bob as viewer
  const reqAuth = makeRequest(`http://localhost:3000/api/users/${alice.id}/followers`, bobSession.sessionToken);
  const resAuth = await followersHandler(reqAuth, { params: { userId: alice.id } });
  const dataAuth = await resAuth.json();
  const bobItemInFollowers = dataAuth.items.find((i) => i.id === bob.id);
  check(Boolean(bobItemInFollowers), 'Bob found in Alice followers list');
  if (bobItemInFollowers) {
    check(bobItemInFollowers.isSelf === true, 'Bob isSelf is true when Bob is the authenticated viewer');
  }

  // Authenticated request with Alice as viewer looking at followers
  const reqAliceAuth = makeRequest(`http://localhost:3000/api/users/${alice.id}/followers`, aliceSession.sessionToken);
  const resAliceAuth = await followersHandler(reqAliceAuth, { params: { userId: alice.id } });
  const dataAliceAuth = await resAliceAuth.json();
  const davidInAliceFollowers = dataAliceAuth.items.find((i) => i.id === david.id);
  check(Boolean(davidInAliceFollowers), 'David found in Alice followers list');
  if (davidInAliceFollowers) {
    check(davidInAliceFollowers.isFriend === true, 'David isFriend is true for Alice viewer');
    check(davidInAliceFollowers.isFollowing === true, 'David isFollowing is true for Alice viewer');
  }

  // Item 21: No fixture fallback when real API is active
  check(dataFollowing.items[0].id.includes('-'), 'Audit Item 21: Item ID is a real PostgreSQL UUID');
  check(dataFollowing.items[0].poppoId.startsWith('8888'), 'Item poppoId is real PostgreSQL data, not fixture data');

  // Item 22: Zero duplicate rows across all lists
  const allFollowingIds = dataFollowing.items.map((i) => i.id);
  const allFollowersIds = dataFollowers.items.map((i) => i.id);
  const allVisitorsIds = dataVisitors.items.map((i) => i.id);
  check(new Set(allFollowingIds).size === allFollowingIds.length, 'Audit Item 22: Zero duplicate rows in following list');
  check(new Set(allFollowersIds).size === allFollowersIds.length, 'Zero duplicate rows in followers list');
  check(new Set(allVisitorsIds).size === allVisitorsIds.length, 'Zero duplicate rows in visitors list');

  // Search filtering test
  const reqSearch = makeRequest(`http://localhost:3000/api/users/${alice.id}/following?search=David`);
  const resSearch = await followingHandler(reqSearch, { params: { userId: alice.id } });
  const dataSearch = await resSearch.json();
  check(dataSearch.totalCount === 1, `Search query 'David' returns exactly 1 item (got ${dataSearch.totalCount})`);
  check(dataSearch.items[0].id === david.id, 'Search result matches David');

  // Numeric Poppo ID target lookup test
  const reqNumericLookup = makeRequest(`http://localhost:3000/api/users/${alice.poppo_id}/friends`);
  const resNumericLookup = await friendsHandler(reqNumericLookup, { params: { userId: alice.poppo_id } });
  const dataNumericLookup = await resNumericLookup.json();
  check(resNumericLookup.status === 200, 'Target resolution via numeric Poppo ID works');
  check(dataNumericLookup.targetUser.id === alice.id, 'Numeric Poppo ID resolves to Alice');

  // Cleanup test records
  console.log('\n[TEARDOWN] Cleaning up test records...');
  try {
    if (cleanupUserIds.length > 0) {
      await pool.query('DELETE FROM popolive.profile_visits WHERE visitor_id = ANY($1) OR visited_user_id = ANY($1)', [cleanupUserIds]);
      await pool.query('DELETE FROM popolive.user_follows WHERE follower_id = ANY($1) OR following_id = ANY($1)', [cleanupUserIds]);
      await pool.query('DELETE FROM popolive.sessions WHERE user_id = ANY($1)', [cleanupUserIds]);
      await pool.query('DELETE FROM popolive.users WHERE id = ANY($1)', [cleanupUserIds]);
      console.log(`  Cleaned up ${cleanupUserIds.length} test users and relations.`);
    }
  } catch (cleanErr) {
    console.error('  Cleanup warning:', cleanErr.message);
  }

  await pool.end();

  console.log('\n======================================================================');
  console.log(`AUDIT COMPLETE: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================================');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runSocialListsSuite().catch((err) => {
  console.error('\nFATAL ERROR running social lists audit suite:', err);
  process.exit(1);
});
