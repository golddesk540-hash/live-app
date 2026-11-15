// E2E Verification Script for Phase 2 Prompt 03/10: Pre-Live Setup & Host Studio
// Tests all pre-live endpoints and validation rules against http://localhost:3000

const crypto = require('crypto');

const BASE_URL = 'http://localhost:3000';
let sessionCookie = '';
let consentCookie = '';

function generateConsentCookie() {
  const payload = {
    consentId: 'consent_' + Date.now(),
    anonymousSessionId: 'anon_' + Date.now(),
    termsVersion: 'v4.2.0',
    privacyVersion: 'v4.2.0',
    status: 'accepted',
    timestamp: Date.now(),
  };
  const SECRET_KEY = process.env.CONSENT_SECRET_KEY || 'poppo-live-secure-consent-salt-2026-v4';
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('base64url');
  return `${data}.${signature}`;
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const cookieParts = [];
  if (consentCookie) cookieParts.push(`poppo_terms_consent=${consentCookie}`);
  if (sessionCookie) cookieParts.push(`poppo_session=${sessionCookie}`);
  if (cookieParts.length > 0 && !headers['Cookie']) {
    headers['Cookie'] = cookieParts.join('; ');
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    const match = setCookie.match(/poppo_session=([^;]+)/);
    if (match) {
      sessionCookie = match[1];
    }
  }

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, ok: res.ok, data: json, headers: res.headers };
}

async function runTests() {
  console.log('================================================================');
  console.log('POPO LIVE — PHASE 2 PROMPT 03/10: PRE-LIVE & HOST STUDIO E2E');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Unauthenticated & Demo config
  console.log('--- Test 1: Pre-Live Config Endpoint (Demo & Unauthorized) ---');
  const demoConfig = await request('/api/live/pre-live/config?demo=true');
  assert(demoConfig.status === 200, 'GET /api/live/pre-live/config?demo=true returns 200');
  assert(demoConfig.data.success === true, 'Demo config success is true');
  assert(Array.isArray(demoConfig.data.categories), 'Categories array is present');
  assert(demoConfig.data.categories.length >= 5, `Found ${demoConfig.data.categories.length} active categories`);
  assert(demoConfig.data.categories.some(c => c.id === 'live_chat'), 'Contains live_chat category');
  assert(demoConfig.data.categories.some(c => c.id === 'music'), 'Contains music category');
  assert(demoConfig.data.categories.some(c => c.id === 'gaming'), 'Contains gaming category');

  const unauthConfig = await request('/api/live/pre-live/config');
  assert(unauthConfig.status === 401, 'GET /api/live/pre-live/config without session returns 401 Unauthorized');

  // 2. Setup Authenticated User
  console.log('\n--- Setup: Register New Host & Complete Gates ---');
  consentCookie = generateConsentCookie();
  const testEmail = `host_prelive_${Date.now()}_${Math.floor(Math.random() * 1000)}@testpopo.com`;
  const registerRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      nickname: 'host_' + Math.floor(Math.random() * 10000),
      email: testEmail,
      password: 'SecurePassword123!',
      isAdultConfirmed: true,
      gender: 'female',
    }),
  });
  assert(registerRes.status === 201 || registerRes.status === 200, 'Host registration succeeds');
  assert(sessionCookie.length > 0, `Session token acquired: ${sessionCookie.substring(0, 10)}...`);

  // 3. Authenticated Config Check
  console.log('\n--- Test 3: Authenticated Pre-Live Config Check ---');
  const userConfig = await request('/api/live/pre-live/config');
  assert(userConfig.status === 200, 'GET /api/live/pre-live/config returns 200 for authenticated user');
  assert(userConfig.data.user !== undefined, 'User data present');
  assert(userConfig.data.gates.isEligible === false, 'Fresh user starts as ineligible');

  // 4. Ineligible User Rejection on Setup
  console.log('\n--- Test 4: Ineligible User Rejection on Pre-Live Setup ---');
  const ineligSetup = await request('/api/live/pre-live/setup', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Valid Title Here',
      categoryId: 'live_chat',
    }),
  });
  assert(ineligSetup.status === 403, 'POST /api/live/pre-live/setup rejects with 403 when gates incomplete');
  assert(ineligSetup.data.missingGates.includes('wealth_level'), 'missingGates specifies wealth_level');
  assert(ineligSetup.data.missingGates.includes('face_check'), 'missingGates specifies face_check');

  // 5. Complete Gates: Face Verify, Cover Upload, Upgrade Wealth Level to 5
  console.log('\n--- Completing Gates (Face KYC, Cover, Wealth Level 5) ---');
  const sampleBase64Jpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

  const faceRes = await request('/api/live/gates/face-verify', {
    method: 'POST',
    body: JSON.stringify({ simulateFailure: false, imageSnapshot: sampleBase64Jpeg }),
  });
  assert(faceRes.status === 200, 'Face verification completed');

  const coverRes = await request('/api/live/gates/cover-upload', {
    method: 'POST',
    body: JSON.stringify({ imageBase64: sampleBase64Jpeg, aspectRatio: '3:4' }),
  });
  assert(coverRes.status === 200, 'Cover photo uploaded');
  const uploadedCoverUrl = coverRes.data.coverUrl;

  const wealthRes = await request('/api/live/gates/verify-eligibility', {
    method: 'PUT',
    body: JSON.stringify({ wealthLevel: 5 }),
  });
  assert(wealthRes.status === 200, 'Wealth level upgraded to 5');

  const eligibilityRes = await request('/api/live/gates/verify-eligibility', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert(eligibilityRes.status === 200 && eligibilityRes.data.eligible === true, 'All 3 gates approved');

  // 6. Title Validations
  console.log('\n--- Test 6: Title Validations ---');
  const emptyTitle = await request('/api/live/pre-live/setup', {
    method: 'POST',
    body: JSON.stringify({ title: '', categoryId: 'live_chat', coverUrl: uploadedCoverUrl }),
  });
  assert(emptyTitle.status === 400, 'Empty title rejected with 400');
  assert(emptyTitle.data.error.includes('Live title is required'), 'Error mentions title is required');

  const spacesTitle = await request('/api/live/pre-live/setup', {
    method: 'POST',
    body: JSON.stringify({ title: '     ', categoryId: 'live_chat', coverUrl: uploadedCoverUrl }),
  });
  assert(spacesTitle.status === 400, 'Whitespace title rejected with 400');
  assert(spacesTitle.data.error.includes('cannot be empty or only spaces'), 'Error mentions whitespace');

  const longTitle = await request('/api/live/pre-live/setup', {
    method: 'POST',
    body: JSON.stringify({ title: 'A'.repeat(61), categoryId: 'live_chat', coverUrl: uploadedCoverUrl }),
  });
  assert(longTitle.status === 400, '61-character title rejected with 400 (exceeds 60 limit)');
  assert(longTitle.data.error.includes('exceeds maximum 60 characters'), 'Error mentions 60-character limit');

  // 7. Category Validations
  console.log('\n--- Test 7: Category Validations ---');
  const missingCat = await request('/api/live/pre-live/setup', {
    method: 'POST',
    body: JSON.stringify({ title: 'Good Title', coverUrl: uploadedCoverUrl }),
  });
  assert(missingCat.status === 400, 'Missing category rejected with 400');

  const invalidCat = await request('/api/live/pre-live/setup', {
    method: 'POST',
    body: JSON.stringify({ title: 'Good Title', categoryId: 'non_existent_category_xyz', coverUrl: uploadedCoverUrl }),
  });
  assert(invalidCat.status === 400, 'Non-existent category ID rejected with 400');
  assert(invalidCat.data.error.includes('Invalid category selected'), 'Error mentions invalid category');

  // 8. Successful Pre-Live Setup
  console.log('\n--- Test 8: Successful Pre-Live Setup Submission ---');
  const validSetup = await request('/api/live/pre-live/setup', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Popo Friday Night Live Music 💕',
      categoryId: 'music',
      coverUrl: uploadedCoverUrl,
    }),
  });
  assert(validSetup.status === 200, 'POST /api/live/pre-live/setup succeeds with 200 OK');
  assert(validSetup.data.success === true, 'Success is true');
  assert(validSetup.data.session !== undefined, 'Session object returned');
  assert(validSetup.data.session.title === 'Popo Friday Night Live Music 💕', 'Session title matches input');
  assert(validSetup.data.session.category === 'Music', 'Category name resolved to Music');
  assert(validSetup.data.session.status === 'setup', 'Room status set to "setup"');
  assert(typeof validSetup.data.session.roomNumber === 'string', `Room number created: ${validSetup.data.session.roomNumber}`);
  assert(validSetup.data.nextStep.startsWith('/live/studio/'), `nextStep points to studio: ${validSetup.data.nextStep}`);

  // 9. Verify Config Persistence
  console.log('\n--- Test 9: Verify Saved Config Persistence ---');
  const updatedConfig = await request('/api/live/pre-live/config');
  assert(updatedConfig.status === 200, 'GET /api/live/pre-live/config returns 200');
  assert(updatedConfig.data.savedSetup.title === 'Popo Friday Night Live Music 💕', 'Saved title persisted in database');
  assert(updatedConfig.data.savedSetup.categoryName === 'Music', 'Saved category persisted in database');

  // 10. Start Broadcast Demo Readiness Check
  console.log('\n--- Test 10: Host Studio Readiness Check ---');
  const studioStart = await request('/api/live/studio/start?preview=demo', {
    method: 'POST',
    body: JSON.stringify({ isDemo: true }),
  });
  assert(studioStart.status === 200, 'POST /api/live/studio/start in demo mode returns 200');
  assert(studioStart.data.success === true, 'Studio start readiness confirmed');

  console.log('\n================================================================');
  console.log(`TOTAL RESULTS: ${passed} passed, ${failed} failed`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
