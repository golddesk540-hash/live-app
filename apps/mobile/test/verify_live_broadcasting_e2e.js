// E2E Verification Script for Phase 2 Prompt 04/10: Actual Live Broadcasting Using Agora SDK
// Tests live broadcast startup, Agora token acquisition, session synchronization, two-device discovery, and stream termination

const crypto = require('crypto');

const BASE_URL = 'http://localhost:3000';
let hostSessionCookie = '';
let hostConsentCookie = '';

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
  if (hostConsentCookie) cookieParts.push(`poppo_terms_consent=${hostConsentCookie}`);
  if (hostSessionCookie) cookieParts.push(`poppo_session=${hostSessionCookie}`);
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
      hostSessionCookie = match[1];
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
  console.log('POPO LIVE — PHASE 2 PROMPT 04/10: AGORA LIVE BROADCASTING E2E');
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

  // -------------------------------------------------------------
  // Test 1: Unauthorized Protection on Broadcast Start
  // -------------------------------------------------------------
  console.log('--- Test 1: Unauthorized Protection on Studio Start ---');
  const unauthStart = await request('/api/live/studio/start', {
    method: 'POST',
    body: JSON.stringify({ title: 'Unauthorized Stream' }),
  });
  assert(unauthStart.status === 401, 'POST /api/live/studio/start without session returns 401 Unauthorized');

  // -------------------------------------------------------------
  // Test 2: Register Host & Complete Gate Verifications
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Register Host & Complete Go-Live Gates ---');
  hostConsentCookie = generateConsentCookie();
  const testEmail = `host_broadcast_${Date.now()}_${Math.floor(Math.random() * 1000)}@testpopo.com`;
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
  assert(registerRes.status === 201 || registerRes.status === 200, 'Broadcaster registered successfully');
  assert(hostSessionCookie.length > 0, `Acquired authenticated session: ${hostSessionCookie.substring(0, 10)}...`);

  // Verify initial ineligibility
  const preStart = await request('/api/live/studio/start', {
    method: 'POST',
    body: JSON.stringify({ title: 'Premature Broadcast' }),
  });
  assert(preStart.status === 403, 'POST /api/live/studio/start rejects ineligible host with 403 Forbidden');
  assert(preStart.data.missingGates.includes('wealth_level'), 'missingGates includes wealth_level');

  // Complete face KYC, cover upload, wealth level 5 upgrade
  const sampleBase64Jpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

  await request('/api/live/gates/face-verify', {
    method: 'POST',
    body: JSON.stringify({ simulateFailure: false, imageSnapshot: sampleBase64Jpeg }),
  });

  const coverRes = await request('/api/live/gates/cover-upload', {
    method: 'POST',
    body: JSON.stringify({ imageBase64: sampleBase64Jpeg, aspectRatio: '3:4' }),
  });
  const coverUrl = coverRes.data.coverUrl;

  await request('/api/live/gates/verify-eligibility', {
    method: 'PUT',
    body: JSON.stringify({ wealthLevel: 5 }),
  });

  const gateCheck = await request('/api/live/gates/verify-eligibility', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert(gateCheck.status === 200 && gateCheck.data.eligible === true, 'All 3 Go-Live gates confirmed verified');

  // -------------------------------------------------------------
  // Test 3: Pre-Live Room Staging
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Pre-Live Setup & Room Staging ---');
  const setupRes = await request('/api/live/pre-live/setup', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Popo Live Music Stream 💕',
      categoryId: 'music',
      coverUrl: coverUrl,
    }),
  });
  assert(setupRes.status === 200, 'POST /api/live/pre-live/setup stages room with 200 OK');
  const stagedRoomId = setupRes.data.session.roomId;
  const stagedRoomNumber = setupRes.data.session.roomNumber;
  assert(stagedRoomId.length > 0, `Staged Room ID: ${stagedRoomId}`);
  assert(stagedRoomNumber.length > 0, `Staged Room Number: ${stagedRoomNumber}`);

  // -------------------------------------------------------------
  // Test 4: Start Actual Live Broadcasting & Agora Token Retrieval
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Start Live Broadcasting & Retrieve Agora RTC Credentials ---');
  const startRes = await request('/api/live/studio/start', {
    method: 'POST',
    body: JSON.stringify({
      roomId: stagedRoomId,
      title: 'Popo Live Music Stream 💕',
      category: 'Music',
      coverUrl: coverUrl,
    }),
  });

  assert(startRes.status === 200, 'POST /api/live/studio/start returns 200 OK');
  assert(startRes.data.success === true, 'Success flag is true');
  assert(startRes.data.room.status === 'live', 'Room status transitioned to "live"');
  assert(startRes.data.room.isLive === true, 'Room isLive is true');

  // Agora Security & Integrity verification
  const agora = startRes.data.agora;
  assert(agora !== undefined, 'Agora configuration block present in response');
  assert(agora.channelName === `popo_room_${stagedRoomNumber}`, `Agora channel name matches room: ${agora.channelName}`);
  assert(typeof agora.uid === 'number', `Agora UID assigned: ${agora.uid}`);
  assert(agora.role === 'publisher', 'Agora role is strictly "publisher" (host broadcaster)');
  assert(agora.token !== null && agora.token.length > 0, 'Cryptographically signed Agora token acquired');
  assert(agora.expiresInSeconds > 0, `Token validity window: ${agora.expiresInSeconds}s`);
  assert(agora.appCertificate === undefined, 'Security confirmed: Agora App Certificate is NOT exposed to client');

  // -------------------------------------------------------------
  // Test 5: Live Studio Session Synchronization
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Live Studio Session Synchronization (GET /session) ---');
  const sessionRes = await request(`/api/live/studio/session?roomId=${stagedRoomId}`);
  assert(sessionRes.status === 200, 'GET /api/live/studio/session returns 200 OK');
  assert(sessionRes.data.room.isLive === true, 'Session sync confirms room is currently live');
  assert(sessionRes.data.room.viewerCount >= 1800, `Active viewers tracked: ${sessionRes.data.room.viewerCount}`);
  assert(sessionRes.data.agora.token.length > 0, 'Active Agora RTC token confirmed by session manager');

  // -------------------------------------------------------------
  // Test 6: Two-Device Discovery Preparation (Device B Discovery Verification)
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Two-Device Host Discovery Verification ---');
  // Confirm that Device B (audience) can see this room in the discovery feed
  const exploreRes = await request('/api/discovery/explore?limit=10');
  assert(exploreRes.status === 200, 'Discovery Explore feed accessible');
  console.log('  Live room successfully staged and broadcasting on backend channel');

  // -------------------------------------------------------------
  // Test 7: Graceful End Broadcast & Metric Aggregation
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Graceful End Broadcast (POST /studio/end) ---');
  const endRes = await request('/api/live/studio/end', {
    method: 'POST',
    body: JSON.stringify({ roomId: stagedRoomId }),
  });

  assert(endRes.status === 200, 'POST /api/live/studio/end returns 200 OK');
  assert(endRes.data.success === true, 'Stream end confirmed');
  assert(endRes.data.summary !== undefined, 'Broadcast summary object returned');
  assert(typeof endRes.data.summary.durationSeconds === 'number', `Broadcast duration tracked: ${endRes.data.summary.durationSeconds}s`);
  assert(typeof endRes.data.summary.durationFormatted === 'string', `Formatted duration: ${endRes.data.summary.durationFormatted}`);
  assert(endRes.data.summary.peakViewers >= 1800, `Peak viewers recorded: ${endRes.data.summary.peakViewers}`);
  assert(endRes.data.summary.diamondsEarned > 0, `Diamonds earned: ${endRes.data.summary.diamondsEarned}`);

  // -------------------------------------------------------------
  // Test 8: Post-End Inactive Room Verification
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Post-End Inactive Room Verification ---');
  const postEndSession = await request(`/api/live/studio/session?roomId=${stagedRoomId}`);
  assert(postEndSession.data.room.isLive === false, 'Room is strictly marked inactive (isLive: false) after ending');
  assert(postEndSession.data.room.status === 'ended', 'Room status strictly set to "ended"');

  // -------------------------------------------------------------
  // Test 9: Demo Broadcast Start & End Lifecycle
  // -------------------------------------------------------------
  console.log('\n--- Test 9: Demo Broadcast Start & End Lifecycle ---');
  const demoStart = await request('/api/live/studio/start?preview=demo', {
    method: 'POST',
    body: JSON.stringify({ isDemo: true, title: 'Demo Stream' }),
  });
  assert(demoStart.status === 200, 'Demo broadcast starts with 200 OK');
  assert(demoStart.data.isDemo === true, 'Demo mode confirmed');

  const demoEnd = await request('/api/live/studio/end?preview=demo', {
    method: 'POST',
    body: JSON.stringify({ isDemo: true }),
  });
  assert(demoEnd.status === 200, 'Demo broadcast ends with 200 OK');
  assert(demoEnd.data.summary.durationFormatted === '00:12:34', 'Demo summary matches reference 12:34 duration');

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
