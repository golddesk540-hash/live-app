const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const ROOM_ID = '7001';

async function runTests() {
  console.log('================================================================');
  console.log('POPO LIVE — PHASE 5 MODULE 5.3 (TAKING A SEAT) TEST SUITE');
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

  // ==========================================
  // GROUP 1: REST API VERIFICATION
  // ==========================================
  console.log('--- GROUP 1: REST API VERIFICATION (REQUEST & INVITE) ---');

  let testRequestId = '';
  let testInviteId = '';

  // Test 1.1: Submit Seat Request for Seat 3
  try {
    const res = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/request?preview=demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seatNumber: 3,
        userId: 'user_luna_test',
        userName: 'Luna Glow',
        userAvatar: '/assets/studio/user_avatar_1.png',
        preview: 'demo',
      }),
    });
    const data = await res.json();
    assert(res.status === 201 && data.success === true, 'POST /api/party/7001/seats/request submits request for Seat 3');
    assert(data.request && data.request.status === 'pending', 'Submitted request status is "pending"');
    testRequestId = data.request?.id;
  } catch (err) {
    assert(false, `POST seat request failed: ${err.message}`);
  }

  // Test 1.2: Reject requesting Seat 1 (Host seat is protected)
  try {
    const res = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/request?preview=demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seatNumber: 1,
        userId: 'user_intruder',
        userName: 'Intruder',
        preview: 'demo',
      }),
    });
    const data = await res.json();
    assert(res.status === 400 && data.success === false, 'Cannot request Seat 1 (Host seat is protected, returns 400)');
  } catch (err) {
    assert(false, `Request Seat 1 protection test failed: ${err.message}`);
  }

  // Test 1.3: Reject duplicate active pending request from same user
  try {
    const res = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/request?preview=demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seatNumber: 4,
        userId: 'user_luna_test', // already requested seat 3
        userName: 'Luna Glow',
        preview: 'demo',
      }),
    });
    const data = await res.json();
    assert(res.status === 400 && data.success === false, 'Prevents duplicate pending requests from same user (returns 400)');
  } catch (err) {
    assert(false, `Duplicate pending request test failed: ${err.message}`);
  }

  // Test 1.4: GET /api/party/7001/seats/requests returns pending requests
  try {
    const res = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/requests`);
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'GET /api/party/7001/seats/requests returns 200 OK');
    assert(Array.isArray(data.requests) && data.requests.length >= 1, 'Returns list of active pending requests');
    const hasLuna = data.requests.some((r) => r.userId === 'user_luna_test' && r.seatNumber === 3);
    assert(hasLuna, 'Pending request list includes Luna Glow for Seat 3');
  } catch (err) {
    assert(false, `GET seat requests failed: ${err.message}`);
  }

  // Test 1.5: Host Rejects Seat Request for Seat 3
  try {
    const res = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/requests/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: testRequestId,
        action: 'reject',
        isHostAction: true,
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'Host successfully rejects seat request');
    assert(data.status === 'rejected', 'Request status transitioned to "rejected"');

    // Confirm Seat 3 remains available
    const seatsRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats`);
    const seatsData = await seatsRes.json();
    const seat3 = seatsData.seats.find((s) => s.seatNumber === 3);
    assert(seat3 && seat3.status === 'available', 'Seat 3 remains available after rejection');
  } catch (err) {
    assert(false, `Reject seat request failed: ${err.message}`);
  }

  // Test 1.6: Submit new request and Host Accepts
  try {
    const reqRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/request?preview=demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seatNumber: 5,
        userId: 'user_sammy_test',
        userName: 'Sammy VIP',
        userAvatar: '/assets/studio/user_avatar_3.png',
        preview: 'demo',
      }),
    });
    const reqData = await reqRes.json();
    const acceptReqId = reqData.request?.id;

    const acceptRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/requests/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: acceptReqId,
        action: 'accept',
        isHostAction: true,
      }),
    });
    const acceptData = await acceptRes.json();
    assert(acceptRes.status === 200 && acceptData.success === true, 'Host successfully accepts seat request for Seat 5');
    assert(acceptData.status === 'accepted', 'Request status transitioned to "accepted"');

    // Verify Seat 5 is now occupied in database
    const seat5 = acceptData.seats.find((s) => s.seat_number === 5 || s.seatNumber === 5);
    assert(seat5 && seat5.status === 'occupied', 'Seat 5 is now occupied in database');
    assert((seat5.participant_name || seat5.participantName) === 'Sammy VIP', 'Seat 5 occupant is Sammy VIP');
  } catch (err) {
    assert(false, `Accept seat request failed: ${err.message}`);
  }

  // Test 1.7: Host sends invitation for Seat 6
  try {
    const res = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seatNumber: 6,
        invitedUserId: 'user_chloe_test',
        invitedUserName: 'Chloe Pop',
        invitedUserAvatar: '/assets/studio/user_avatar_2.png',
      }),
    });
    const data = await res.json();
    assert(res.status === 201 && data.success === true, 'Host successfully sends invitation for Seat 6');
    assert(data.invitation && data.invitation.status === 'pending', 'Invitation status is "pending"');
    testInviteId = data.invitation?.id;
  } catch (err) {
    assert(false, `Send seat invitation failed: ${err.message}`);
  }

  // Test 1.8: Viewer declines invitation for Seat 6
  try {
    const res = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/invite/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitationId: testInviteId,
        action: 'decline',
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'Viewer declines seat invitation');
    assert(data.status === 'declined', 'Invitation status transitioned to "declined"');
  } catch (err) {
    assert(false, `Decline invitation failed: ${err.message}`);
  }

  // Clean up Seat 5 occupied during test
  try {
    await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/vacate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seatNumber: 5, preview: true, isHostAction: true }),
    });
  } catch {}

  // ==========================================
  // GROUP 2: BROWSER UI VERIFICATION (1:1 05_03)
  // ==========================================
  console.log('\n--- GROUP 2: BROWSER UI VERIFICATION (1:1 05_03) ---');

  // Obtain official consent token
  const consentRes = await fetch(`${BASE_URL}/api/consent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
    }),
  });
  const rawCookie = consentRes.headers.get('set-cookie') || '';
  const token = rawCookie.split(';')[0]?.split('=')[1] || '';

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  if (token) {
    await page.setCookie({
      name: 'poppo_terms_consent',
      value: token,
      domain: 'localhost',
      path: '/',
    });
  }

  try {
    await page.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1200));

    // Test 2.1: Header elements
    const hasHeader = await page.$('[data-testid="seat-grid-header"]');
    assert(hasHeader !== null, 'Header container exists');

    const backButton = await page.$('[data-action="back"]');
    assert(backButton !== null, 'Back button < exists with data-action="back"');

    const brandText = await page.evaluate(() => document.body.innerText.includes('Popo Live'));
    assert(brandText, 'Popo Live branding visible in header');

    // Test 2.2: Host Info
    const hostName = await page.$eval('[data-testid="host-name"]', (el) => el.innerText.trim());
    assert(hostName === 'Maria Live', `Host name displays "${hostName}" (Maria Live)`);

    const hasCrown = await page.evaluate(() => document.body.innerText.includes('👑') || !!document.querySelector('.lucide-crown'));
    assert(hasCrown, 'Golden crown badge 👑 displayed next to host');

    // Test 2.3: 9-Seat Grid
    const seatGrid = await page.$('[data-testid="nine-seat-grid"]');
    assert(seatGrid !== null, 'Nine-seat grid container exists');

    const seat1Host = await page.$('[data-testid="seat-1-host"]');
    assert(seat1Host !== null, 'Seat 1 (Host) renders with host styling');

    // Test 2.4: Incoming Seat Request Panel matching 05_03
    const requestPanel = await page.$('[data-testid="seat-request-panel"]');
    assert(requestPanel !== null, 'Incoming Seat Request panel is mounted and visible');

    const tabRequests = await page.$('[data-action="tab-requests"]');
    const tabInvite = await page.$('[data-action="tab-invite"]');
    assert(tabRequests && tabInvite, '"Seat Requests" and "Invite Audience" tabs are present in panel');

    // Check if initial request seeded in DB (Kenji R requesting Seat 2) is visible
    const hasRequestItem = await page.$('[data-action="accept-request"]');
    assert(hasRequestItem !== null, 'Incoming request item renders Accept button');

    const hasRejectBtn = await page.$('[data-action="reject-request"]');
    assert(hasRejectBtn !== null, 'Incoming request item renders Reject button');

    // Test 2.5: Bottom Control Bar
    const controlBar = await page.$('[data-testid="bottom-control-bar"]');
    assert(controlBar !== null, 'Bottom control bar exists with 6 circular buttons');

    // Test 2.6: Footer Reference Banner
    const footerBanner = await page.$eval('[data-testid="footer-reference-banner"]', (el) => el.innerText.trim());
    assert(footerBanner.includes('05_03 Taking a Seat'), `Footer reference banner displays "${footerBanner}"`);

    // ==========================================
    // GROUP 3: MULTI-USER INTERACTION & ACCEPT FLOW
    // ==========================================
    console.log('\n--- GROUP 3: MULTI-USER INTERACTION & ACCEPT FLOW ---');

    // Step 1: Host accepts the pending request
    console.log('  Host clicking Accept request...');
    await page.click('[data-action="accept-request"]');
    await new Promise((r) => setTimeout(r, 1500));

    // Confirm Seat 2 is now occupied
    const seat2Occupied = await page.$('[data-testid="seat-2-occupied"]');
    assert(seat2Occupied !== null, 'Accepting request updates Seat 2 to Occupied state on grid');

    // Step 2: Open Device 2 to verify real-time sync
    console.log('  Opening simulated Device 2...');
    const page2 = await browser.newPage();
    await page2.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
    if (token) {
      await page2.setCookie({
        name: 'poppo_terms_consent',
        value: token,
        domain: 'localhost',
        path: '/',
      });
    }
    await page2.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));

    const dev2Seat2Occupied = await page2.$('[data-testid="seat-2-occupied"]');
    assert(dev2Seat2Occupied !== null, 'Device 2 synchronizes and displays Seat 2 as Occupied');

    // Step 3: Device 2 (Viewer) requests Seat 4
    console.log('  Device 2 requesting Seat 4...');
    await page2.click('[data-testid="seat-4-empty"]');
    await new Promise((r) => setTimeout(r, 600));

    const requestSeatBtn = await page2.$('[data-action="request-seat"]');
    assert(requestSeatBtn !== null, 'Seat drawer displays "Request Seat #4" action button');

    await page2.click('[data-action="request-seat"]');
    await new Promise((r) => setTimeout(r, 1200));

    // Device 1 (Host) receives incoming request via polling sync
    console.log('  Waiting for polling sync on Host (Device 1)...');
    await page.bringToFront();
    await new Promise((r) => setTimeout(r, 3200));

    const hostSawNewRequest = await page.$('[data-action="accept-request"]');
    assert(hostSawNewRequest !== null, 'Host receives new incoming seat request from Device 2');

    // Host accepts Device 2's request
    await page.click('[data-action="accept-request"]');
    await new Promise((r) => setTimeout(r, 1500));

    const seat4Occupied = await page.$('[data-testid="seat-4-occupied"]');
    assert(seat4Occupied !== null, 'Seat 4 becomes occupied after host accepts Device 2 request');

    // Clean up occupied seats 2 and 4
    try {
      await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/vacate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatNumber: 2, preview: true, isHostAction: true }),
      });
      await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/vacate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatNumber: 4, preview: true, isHostAction: true }),
      });
    } catch {}

    await page2.close();

    // Step 4: Back navigation test
    console.log('  Testing Back navigation...');
    await page.click('[data-action="back"]');
    await new Promise((r) => setTimeout(r, 1500));
    const currentUrl = page.url();
    assert(currentUrl.includes('/party/create'), `Back button returns to /party/create (Current: ${currentUrl})`);

  } catch (err) {
    assert(false, `Browser test encountered error: ${err.message}`);
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
