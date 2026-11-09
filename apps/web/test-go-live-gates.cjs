/**
 * POPO LIVE — PHASE 4 MODULE 4.1 AUTOMATED TEST SUITE
 * Go-Live Gates (Face Check + Cover Image + Wealth Level)
 */

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
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(message);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

async function runTests() {
  console.log('🧪 Starting Go-Live Gates (Module 4.1) Automated Tests...\n');

  try {
    // 1. Assets verification
    const icon1 = await request({ path: '/assets/go-live/icon_face_check.png' });
    assert(icon1.statusCode === 200, 'Face check icon asset returns 200 OK');

    const icon2 = await request({ path: '/assets/go-live/icon_cover_image.png' });
    assert(icon2.statusCode === 200, 'Cover image icon asset returns 200 OK');

    const icon3 = await request({ path: '/assets/go-live/icon_wealth_level.png' });
    assert(icon3.statusCode === 200, 'Wealth level crown icon asset returns 200 OK');

    // 2. Unauthenticated access behavior
    const unauthStatus = await request({ path: '/api/live/gates/status' });
    assert(unauthStatus.statusCode === 401, 'GET /api/live/gates/status without auth returns 401 Unauthorized');

    const demoStatus = await request({ path: '/api/live/gates/status?preview=demo' });
    assert(demoStatus.statusCode === 200 && demoStatus.json?.isDemo === true, 'GET /api/live/gates/status?preview=demo allows demo inspection without security bypass');
    assert(demoStatus.json.isEligible === false, 'Demo user correctly reports isEligible=false');

    // 3. User login flow for authenticated testing
    // First, accept terms to get valid consent cookie
    const consentRes = await request({
      path: '/api/consent',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'gates_test_anon_' + Date.now(),
    });
    assert(consentRes.statusCode === 200, 'Terms consent obtained');

    const consentCookies = consentRes.headers['set-cookie'] || [];
    const consentCookie = consentCookies.find(c => c.startsWith('poppo_terms_consent='));
    const termsCookieHeader = consentCookie ? consentCookie.split(';')[0] : '';

    // Login as streamer (sara.streamer@popolive.com)
    const loginRes = await request({
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': termsCookieHeader,
      },
    }, {
      email: 'sara.streamer@popolive.com',
      password: 'DemoPass123!',
    });

    let sessionCookie = '';
    const setCookies = loginRes.headers['set-cookie'] || [];
    for (const c of setCookies) {
      if (c.startsWith('poppo_session=')) {
        sessionCookie = c.split(';')[0];
        break;
      }
    }

    assert(loginRes.statusCode === 200 && sessionCookie.length > 0, 'Broadcaster login successful, session cookie obtained');

    const authHeaders = {
      'Cookie': `${termsCookieHeader}; ${sessionCookie}`,
    };

    // Reset previous gates for clean testing
    await request({ path: '/api/live/gates/face-verify', method: 'DELETE', headers: authHeaders });
    await request({ path: '/api/live/gates/cover-upload', method: 'DELETE', headers: authHeaders });
    await request({ path: '/api/live/gates/verify-eligibility', method: 'PUT', headers: authHeaders }, { wealthLevel: 1 });

    // 4. Test initial state: User at Level 1, no face check, no cover
    const freshStatus = await request({ path: '/api/live/gates/status', headers: authHeaders });
    assert(freshStatus.statusCode === 200, 'GET /api/live/gates/status authenticated returns 200');
    assert(freshStatus.json.gates.wealthLevel.current === 1, 'Current wealth level is 1 (< 5)');
    assert(freshStatus.json.gates.wealthLevel.passed === false, 'Wealth level check fails for Level 1');
    assert(freshStatus.json.gates.faceCheck.verified === false, 'Face check initially unverified');
    assert(freshStatus.json.gates.coverImage.uploaded === false, 'Cover image initially unuploaded');
    assert(freshStatus.json.isEligible === false, 'Overall eligibility is false');

    // 5. Test Backend eligibility rejection (Direct POST)
    const rejectRes = await request({
      path: '/api/live/gates/verify-eligibility',
      method: 'POST',
      headers: authHeaders,
    });
    assert(rejectRes.statusCode === 403, 'POST /api/live/gates/verify-eligibility rejects incomplete requirements with 403');
    assert(rejectRes.json.missingGates.includes('wealth_level'), 'Rejection identifies wealth_level requirement');
    assert(rejectRes.json.missingGates.includes('face_check'), 'Rejection identifies face_check requirement');
    assert(rejectRes.json.missingGates.includes('cover_image'), 'Rejection identifies cover_image requirement');

    // 6. Test Face Verification Failure Simulation & Retry
    const failFace = await request({
      path: '/api/live/gates/face-verify',
      method: 'POST',
      headers: authHeaders,
    }, { simulateFailure: true, reason: 'Face lighting too dark' });
    assert(failFace.statusCode === 422, 'Simulated face verification failure returns 422');
    assert(failFace.json.retryAllowed === true, 'Failed verification returns retryAllowed: true');

    // 7. Test Face Verification Success
    const passFace = await request({
      path: '/api/live/gates/face-verify',
      method: 'POST',
      headers: authHeaders,
    }, { imageSnapshot: 'data:image/jpeg;base64,sample' });
    assert(passFace.statusCode === 200 && passFace.json.status === 'verified', 'Face verification succeeds with high confidence score');
    assert(passFace.json.confidenceScore >= 95, 'Biometric confidence score is >= 95%');

    // 8. Test Cover Image Upload
    const coverUpload = await request({
      path: '/api/live/gates/cover-upload',
      method: 'POST',
      headers: authHeaders,
    }, {
      // 1x1 transparent PNG base64 for testing
      imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
    });
    assert(coverUpload.statusCode === 200 && coverUpload.json.success === true, 'Cover image uploads and returns stored URL');
    assert(coverUpload.json.coverUrl.startsWith('/uploads/covers/'), 'Cover URL stored under /uploads/covers/');

    // 9. Test Wealth Level Gate (< 5 still blocked even with Face & Cover complete)
    const midGateRes = await request({
      path: '/api/live/gates/verify-eligibility',
      method: 'POST',
      headers: authHeaders,
    });
    assert(midGateRes.statusCode === 403, 'Still blocked when wealth level is below 5 (Level 1)');
    assert(midGateRes.json.missingGates.length === 1 && midGateRes.json.missingGates[0] === 'wealth_level', 'Only wealth_level is missing now');

    // 10. Update user wealth level to exact Level 5 (Required minimum)
    const setLvl5 = await request({
      path: '/api/live/gates/verify-eligibility',
      method: 'PUT',
      headers: authHeaders,
    }, { wealthLevel: 5 });
    assert(setLvl5.statusCode === 200 && setLvl5.json.wealthLevel === 5, 'User wealth level updated to Level 5');

    // 11. Test All 3 Gates Passed!
    const allPassRes = await request({
      path: '/api/live/gates/verify-eligibility',
      method: 'POST',
      headers: authHeaders,
    });
    assert(allPassRes.statusCode === 200, 'POST /api/live/gates/verify-eligibility passes with HTTP 200');
    assert(allPassRes.json.eligible === true, 'Response confirms eligible=true');
    assert(allPassRes.json.nextStep === '/live/setup/pre-live', 'Provides nextStep hook for Module 4.2');

    // 12. Test User above Level 5 (Level 12)
    await request({ path: '/api/live/gates/verify-eligibility', method: 'PUT', headers: authHeaders }, { wealthLevel: 12 });
    const abovePass = await request({ path: '/api/live/gates/verify-eligibility', method: 'POST', headers: authHeaders });
    assert(abovePass.statusCode === 200 && abovePass.json.eligible === true, 'User above Level 5 (Level 12) passes Go-Live eligibility');

    // 13. Test UI Routes (/live/setup and /go-live)
    const uiSetup = await request({ path: '/live/setup' });
    assert(uiSetup.statusCode === 200, 'GET /live/setup returns 200 OK');
    assert(uiSetup.data.includes('Go Live Setup'), 'Setup page contains Go Live Setup heading');

    const uiGoLive = await request({ path: '/go-live' });
    assert(uiGoLive.statusCode === 200, 'GET /go-live returns 200 OK');

    // 14. Preserve Modules 3.1 to 3.10
    const explore = await request({ path: '/live/explore' });
    assert(explore.statusCode === 200, 'Preserve Module 3.1 Explore Tab (200 OK)');

    const party = await request({ path: '/live/party' });
    assert(party.statusCode === 200, 'Preserve Module 3.6 Party Tab (200 OK)');

    const following = await request({ path: '/live/following' });
    assert(following.statusCode === 200, 'Preserve Module 3.8 Following Tab (200 OK)');

    const search = await request({ path: '/search' });
    assert(search.statusCode === 200, 'Preserve Module 3.7 Search (200 OK)');

    const near = await request({ path: '/live/near' });
    assert(near.statusCode === 200, 'Preserve Module 3.9 Near Tab (200 OK)');

    const staff = await request({ path: '/staff?preview=demo' });
    assert(staff.statusCode === 200, 'Preserve Module 3.10 Staff Preview (200 OK)');

    console.log('\n===========================================');
    console.log('Go-Live Gates (4.1) Test Results: ALL PASSED!');
    console.log('===========================================');
  } catch (err) {
    console.error('\n❌ Test suite failed:', err);
    process.exit(1);
  }
}

runTests();
