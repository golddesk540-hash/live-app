/**
 * POPO LIVE — PHASE 4 MODULE 4.2 AUTOMATED TEST SUITE
 * Pre-Live Title and Category Selection
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
  console.log('🧪 Starting Pre-Live Title & Category (Module 4.2) Automated Tests...\n');

  try {
    // 1. Assets check
    const sampleCover = await request({ path: '/assets/pre-live/sample_cover_model.png' });
    assert(sampleCover.statusCode === 200, 'Sample cover image asset returns 200 OK');

    // 2. Unauthenticated check
    const unauthConfig = await request({ path: '/api/live/pre-live/config' });
    assert(unauthConfig.statusCode === 401, 'GET /api/live/pre-live/config without auth returns 401');

    const demoConfig = await request({ path: '/api/live/pre-live/config?preview=demo' });
    assert(demoConfig.statusCode === 200 && demoConfig.json?.isDemo === true, 'GET /api/live/pre-live/config?preview=demo allows demo inspection');
    assert(demoConfig.json.categories.length === 7, 'Demo config returns all 7 official broadcast categories');
    assert(demoConfig.json.savedSetup.title === 'Come and chat with me 💕', 'Default title matches reference: "Come and chat with me 💕"');
    assert(demoConfig.json.savedSetup.categoryId === 'live_chat', 'Default category matches reference: "Live Chat"');

    // 3. User login flow for authenticated testing
    const consentRes = await request({
      path: '/api/consent',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'prelive_test_anon_' + Date.now(),
    });
    const termsCookie = consentRes.headers['set-cookie']?.find(c => c.startsWith('poppo_terms_consent='))?.split(';')[0] || '';

    const loginRes = await request({
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': termsCookie },
    }, {
      email: 'sara.streamer@popolive.com',
      password: 'DemoPass123!',
    });
    const sessionCookie = loginRes.headers['set-cookie']?.find(c => c.startsWith('poppo_session='))?.split(';')[0] || '';
    assert(loginRes.statusCode === 200 && sessionCookie.length > 0, 'Broadcaster login successful');

    const authHeaders = {
      'Cookie': `${termsCookie}; ${sessionCookie}`,
    };

    // 4. Test when Module 4.1 Gates are incomplete:
    // Temporarily reset user wealth level to 1
    await request({ path: '/api/live/gates/verify-eligibility', method: 'PUT', headers: authHeaders }, { wealthLevel: 1 });

    const blockedSetup = await request({
      path: '/api/live/pre-live/setup',
      method: 'POST',
      headers: authHeaders,
    }, {
      title: 'Night Chat & Vibes',
      categoryId: 'live_chat',
    });
    assert(blockedSetup.statusCode === 403, 'Pre-live setup strictly blocks continuation if Wealth Level < 5 (HTTP 403)');
    assert(blockedSetup.json.missingGates.includes('wealth_level'), 'Identifies missing wealth_level gate');

    // 5. Restore full eligibility (Wealth Level = 12, Face Verified, Cover Uploaded)
    await request({ path: '/api/live/gates/verify-eligibility', method: 'PUT', headers: authHeaders }, { wealthLevel: 12 });
    await request({ path: '/api/live/gates/face-verify', method: 'POST', headers: authHeaders }, { imageSnapshot: 'sample' });
    await request({
      path: '/api/live/gates/cover-upload',
      method: 'POST',
      headers: authHeaders,
    }, {
      imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
    });

    const eligibleConfig = await request({ path: '/api/live/pre-live/config', headers: authHeaders });
    assert(eligibleConfig.statusCode === 200 && eligibleConfig.json.gates.isEligible === true, 'User is fully eligible for pre-live broadcasting');

    // 6. Test Title validation: Empty title rejection
    const emptyTitle = await request({
      path: '/api/live/pre-live/setup',
      method: 'POST',
      headers: authHeaders,
    }, {
      title: '   ',
      categoryId: 'live_chat',
    });
    assert(emptyTitle.statusCode === 400, 'Rejects empty or whitespace-only live title with HTTP 400');

    // 7. Test Title validation: Character limit (> 60 chars)
    const longTitle = await request({
      path: '/api/live/pre-live/setup',
      method: 'POST',
      headers: authHeaders,
    }, {
      title: 'A'.repeat(61),
      categoryId: 'live_chat',
    });
    assert(longTitle.statusCode === 400, 'Rejects title exceeding 60 characters with HTTP 400');

    // 8. Test Category validation: Invalid category rejection
    const invalidCat = await request({
      path: '/api/live/pre-live/setup',
      method: 'POST',
      headers: authHeaders,
    }, {
      title: 'Valid Live Title',
      categoryId: 'non_existent_category_xyz',
    });
    assert(invalidCat.statusCode === 400, 'Rejects non-existent category with HTTP 400');

    // 9. Test Valid Pre-Live Setup Submission
    const validSetup = await request({
      path: '/api/live/pre-live/setup',
      method: 'POST',
      headers: authHeaders,
    }, {
      title: 'Come and chat with me 💕',
      categoryId: 'live_chat',
    });
    assert(validSetup.statusCode === 200 && validSetup.json.success === true, 'POST /api/live/pre-live/setup returns HTTP 200 and success: true');
    assert(validSetup.json.session.title === 'Come and chat with me 💕', 'Configured title saved correctly');
    assert(validSetup.json.session.category === 'Live Chat', 'Configured category saved as "Live Chat"');
    assert(validSetup.json.session.status === 'setup', 'Session status staged as "setup"');
    assert(validSetup.json.nextStep.startsWith('/live/studio/'), 'Provides nextStep hook to Module 4.3 Host Studio');

    // 10. Test Switching Category (e.g. to Music)
    const musicSetup = await request({
      path: '/api/live/pre-live/setup',
      method: 'POST',
      headers: authHeaders,
    }, {
      title: 'Acoustic Guitar & Vocals 🎸',
      categoryId: 'music',
    });
    assert(musicSetup.statusCode === 200, 'Successfully switched category to Music');
    assert(musicSetup.json.session.category === 'Music', 'Updated category verified as "Music"');

    // 11. Test UI Routes
    const preLivePage = await request({ path: '/live/setup/pre-live' });
    assert(preLivePage.statusCode === 200, 'GET /live/setup/pre-live returns 200 OK');
    assert(preLivePage.data.includes('Go Live'), 'Page contains "Go Live" heading');

    const directPreLive = await request({ path: '/live/pre-live' });
    assert(directPreLive.statusCode === 200, 'GET /live/pre-live direct route returns 200 OK');

    // 12. Preserve Previous Modules (Phase 1-3 & 4.1)
    const gates = await request({ path: '/live/setup' });
    assert(gates.statusCode === 200, 'Preserve Module 4.1 Go-Live Gates (200 OK)');

    const explore = await request({ path: '/live/explore' });
    assert(explore.statusCode === 200, 'Preserve Module 3.1 Explore Tab (200 OK)');

    const party = await request({ path: '/live/party' });
    assert(party.statusCode === 200, 'Preserve Module 3.6 Party Tab (200 OK)');

    const staff = await request({ path: '/staff?preview=demo' });
    assert(staff.statusCode === 200, 'Preserve Module 3.10 Staff Preview (200 OK)');

    console.log('\n===========================================');
    console.log('Pre-Live Title & Category (4.2) Results: ALL PASSED!');
    console.log('===========================================');
  } catch (err) {
    console.error('\n❌ Test suite failed:', err);
    process.exit(1);
  }
}

runTests();
