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
  console.log('🧪 RUNNING POPO LIVE PHASE 3 PROMPT 03.1 TEST SUITE');
  console.log('   App and Web Shells (Tabs) & Discovery Navigation');
  console.log('=======================================================\n');

  // Test 1: Explore tab route & HTML
  const explorePage = await request({ path: '/live/explore' });
  assert(explorePage.statusCode === 200, 'GET /live/explore returns 200 OK');
  assert(explorePage.headers['content-type']?.includes('text/html'), 'Explore route returns text/html');

  // Test 2: Following tab route & HTML
  const followingPage = await request({ path: '/live/following' });
  assert(followingPage.statusCode === 200, 'GET /live/following returns 200 OK');

  // Test 3: New tab route & HTML
  const newPage = await request({ path: '/live/new' });
  assert(newPage.statusCode === 200, 'GET /live/new returns 200 OK');

  // Test 4: PK tab route & HTML
  const pkPage = await request({ path: '/live/pk' });
  assert(pkPage.statusCode === 200, 'GET /live/pk returns 200 OK');

  // Test 5: Default /live root route
  const liveRoot = await request({ path: '/live' });
  assert(liveRoot.statusCode === 200, 'GET /live returns 200 OK');

  // Test 6: API Discovery - Explore Tab
  const apiExplore = await request({ path: '/api/live/discovery?tab=explore' });
  assert(apiExplore.statusCode === 200, 'GET /api/live/discovery?tab=explore returns 200');
  assert(apiExplore.json?.success === true, 'API returns success: true');
  assert(apiExplore.json?.tab === 'explore', 'API tab is explore');
  assert(Array.isArray(apiExplore.json?.rooms) && apiExplore.json.rooms.length > 0, 'Explore rooms list is populated');
  assert(Array.isArray(apiExplore.json?.categories) && apiExplore.json.categories.length === 4, '4 category shortcuts provided');
  assert(Array.isArray(apiExplore.json?.tabs) && apiExplore.json.tabs.length === 4, '4 main tabs metadata provided');

  // Test 7: API Discovery - Following Tab
  const apiFollowing = await request({ path: '/api/live/discovery?tab=following' });
  assert(apiFollowing.statusCode === 200, 'GET /api/live/discovery?tab=following returns 200');
  assert(apiFollowing.json?.tab === 'following', 'API tab is following');

  // Test 8: API Discovery - New Tab
  const apiNew = await request({ path: '/api/live/discovery?tab=new' });
  assert(apiNew.statusCode === 200, 'GET /api/live/discovery?tab=new returns 200');
  assert(apiNew.json?.tab === 'new', 'API tab is new');

  // Test 9: API Discovery - PK Tab
  const apiPk = await request({ path: '/api/live/discovery?tab=pk' });
  assert(apiPk.statusCode === 200, 'GET /api/live/discovery?tab=pk returns 200');
  assert(apiPk.json?.tab === 'pk', 'API tab is pk');
  assert(apiPk.json?.rooms?.every(r => r.isPk), 'All rooms in PK tab have isPk: true');

  // Test 10: Search filter
  const apiSearch = await request({ path: '/api/live/discovery?tab=explore&search=Ayla' });
  assert(apiSearch.statusCode === 200, 'GET /api/live/discovery with search returns 200');

  // Test 11: Guest User Session Check
  const guestSession = await request({ path: '/api/auth/session' });
  assert(guestSession.statusCode === 200, 'GET /api/auth/session returns 200');
  assert(guestSession.json?.authenticated === false, 'Guest user authenticated is false');
  assert(guestSession.json?.user === null, 'Guest user is null');

  // Test 12: Authenticated User Session Check
  // 12a. Accept consent
  const consentRes = await request(
    { path: '/api/consent', method: 'POST' },
    { action: 'accept', termsAccepted: true, privacyAccepted: true, isAdultConfirmed: true, anonymousSessionId: 'disc_anon_' + Date.now() }
  );
  const consentCookie = consentRes.headers['set-cookie']?.find(c => c.startsWith('poppo_terms_consent='))?.split(';')[0];
  assert(!!consentCookie, 'Terms consent cookie obtained');

  // 12b. Login with demo user
  const loginRes = await request(
    { path: '/api/auth/login', method: 'POST', headers: { 'Cookie': consentCookie } },
    { email: 'sara.streamer@popolive.com', password: 'DemoPass123!' }
  );
  assert(loginRes.statusCode === 200, 'Demo user logged in successfully');
  const sessionCookie = loginRes.headers['set-cookie']?.find(c => c.startsWith('poppo_session='))?.split(';')[0];
  assert(!!sessionCookie, 'Session cookie obtained');

  const authCookies = `${consentCookie}; ${sessionCookie}`;

  // 12c. Authenticated session check
  const authSession = await request({
    path: '/api/auth/session',
    headers: { 'Cookie': authCookies },
  });
  assert(authSession.statusCode === 200, 'Auth session endpoint returns 200');
  assert(authSession.json?.authenticated === true, 'Auth session authenticated is true');
  assert(Boolean(authSession.json?.user?.poppoId), `Auth user has valid poppoId: ${authSession.json?.user?.poppoId}`);

  // Test 13: Discovery API with Authenticated Cookie
  const authDiscovery = await request({
    path: '/api/live/discovery?tab=explore',
    headers: { 'Cookie': authCookies },
  });
  assert(authDiscovery.statusCode === 200, 'Auth discovery request returns 200');
  assert(authDiscovery.json?.authenticated === true, 'Auth discovery response has authenticated: true');
  assert(Boolean(authDiscovery.json?.currentUser?.poppoId), `Auth discovery returns current user info: ${authDiscovery.json?.currentUser?.poppoId}`);

  // Test 14: Expired Session Handling
  const expiredSession = await request({
    path: '/api/auth/session',
    headers: { 'Cookie': 'poppo_session=invalid_or_expired_token_12345' },
  });
  assert(expiredSession.statusCode === 200, 'Invalid session returns 200');
  assert(expiredSession.json?.authenticated === false, 'Invalid session authenticated is false');
  const clearCookieHeader = expiredSession.headers['set-cookie']?.[0];
  assert(clearCookieHeader?.includes('Max-Age=0') || clearCookieHeader?.includes('expires='), 'Expired cookie is cleared');

  // Test 15: Existing Connected Routes Availability
  const profileRes = await request({ path: '/profile', headers: { 'Cookie': authCookies } });
  assert(profileRes.statusCode === 200, 'Existing /profile route returns 200');

  const settingsRes = await request({ path: '/settings', headers: { 'Cookie': authCookies } });
  assert(settingsRes.statusCode === 200, 'Existing /settings route returns 200');

  const helpRes = await request({ path: '/help', headers: { 'Cookie': authCookies } });
  assert(helpRes.statusCode === 200, 'Existing /help route returns 200');

  const userProfileRes = await request({ path: '/user/88992211' });
  assert(userProfileRes.statusCode === 200, 'Existing public /user/[userId] route returns 200');

  console.log('\n=======================================================');
  console.log('🎉 ALL 24 DISCOVERY SHELL & NAVIGATION TESTS PASSED!');
  console.log('=======================================================');
}

runTests().catch((err) => {
  console.error('\n💥 TEST RUNNER FAILED:', err);
  process.exit(1);
});
