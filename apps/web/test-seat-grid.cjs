const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const ROOM_ID = '7001';

async function runTests() {
  console.log('====================================================');
  console.log('POPO LIVE — PHASE 5 MODULE 5.2 (SEAT GRID) TEST SUITE');
  console.log('====================================================\n');

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
  console.log('--- GROUP 1: REST API VERIFICATION ---');

  // Test 1.1: GET /api/party/7001/seats returns 9 seats with host in Seat 1
  try {
    const res = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats`);
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'GET /api/party/7001/seats returns 200 OK');
    assert(Array.isArray(data.seats) && data.seats.length === 9, 'Returns exactly 9 seats (Seat 1 to 9)');
    
    const seat1 = data.seats.find((s) => s.seatNumber === 1);
    assert(seat1 && seat1.isHost === true && seat1.status === 'occupied', 'Seat 1 is occupied by Host (Maria Live)');
    assert(seat1.participantName === 'Maria Live', `Host name is "${seat1?.participantName}"`);

    const participantSeats = data.seats.filter((s) => s.seatNumber >= 2 && s.seatNumber <= 9);
    assert(participantSeats.length === 8, 'Seats 2 through 9 are participant seats');
  } catch (err) {
    assert(false, `GET /api/party/7001/seats failed: ${err.message}`);
  }

  // Test 1.2: POST /api/party/7001/seats/occupy for Seat 2
  try {
    const res = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/occupy?preview=demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seatNumber: 2,
        participantId: 'user_test_2',
        participantName: 'Alex Star',
        participantAvatar: '/assets/studio/user_avatar_1.png',
        preview: 'demo',
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'POST /api/party/7001/seats/occupy occupies Seat 2 successfully');
    assert(data.seat && data.seat.seat_number === 2 && data.seat.status === 'occupied', 'Seat 2 status is updated to occupied');
    assert(data.seat.participant_name === 'Alex Star', 'Seat 2 occupant name is Alex Star');
  } catch (err) {
    assert(false, `POST occupy Seat 2 failed: ${err.message}`);
  }

  // Test 1.3: Prevent duplicate occupation of Seat 2 (409 Conflict)
  try {
    const res = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/occupy?preview=demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seatNumber: 2,
        participantId: 'user_different',
        participantName: 'Another User',
        preview: 'demo',
      }),
    });
    const data = await res.json();
    assert(res.status === 409 && data.success === false, 'Cannot occupy an already occupied seat (returns 409 Conflict)');
  } catch (err) {
    assert(false, `Duplicate seat occupation test failed: ${err.message}`);
  }

  // Test 1.4: Prevent non-host from occupying Seat 1 (403 Forbidden)
  try {
    const res = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/occupy?preview=demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seatNumber: 1,
        participantId: 'intruder_user',
        participantName: 'Intruder',
        preview: 'demo',
      }),
    });
    const data = await res.json();
    assert(res.status === 403 && data.success === false, 'Non-host cannot occupy Seat 1 (returns 403 Forbidden)');
  } catch (err) {
    assert(false, `Host seat protection test failed: ${err.message}`);
  }

  // Test 1.5: Prevent same user from occupying 2 seats simultaneously
  try {
    const res = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/occupy?preview=demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seatNumber: 3,
        participantId: 'user_test_2', // same user already on seat 2
        participantName: 'Alex Star',
        preview: 'demo',
      }),
    });
    const data = await res.json();
    assert(res.status === 400 && data.success === false, 'Same participant cannot occupy multiple seats (returns 400)');
  } catch (err) {
    assert(false, `Duplicate participant occupation test failed: ${err.message}`);
  }

  // Test 1.6: POST /api/party/7001/seats/vacate Seat 2
  try {
    const res = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/vacate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seatNumber: 2,
        participantId: 'user_test_2',
        preview: true,
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'POST vacate Seat 2 succeeds');
    assert(data.seat && data.seat.status === 'available', 'Seat 2 is now available');
  } catch (err) {
    assert(false, `Vacate Seat 2 failed: ${err.message}`);
  }

  // Test 1.7: Prevent vacating Host Seat 1 (403 Forbidden)
  try {
    const res = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/vacate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seatNumber: 1,
        preview: true,
      }),
    });
    const data = await res.json();
    assert(res.status === 403 && data.success === false, 'Host Seat 1 cannot be vacated (returns 403 Forbidden)');
  } catch (err) {
    assert(false, `Host vacate protection test failed: ${err.message}`);
  }

  // Test 1.8: GET /api/party/7001/seats/status (Real-time polling sync endpoint)
  try {
    const res = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/status`);
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'GET /api/party/7001/seats/status returns 200 OK');
    assert(typeof data.timestamp === 'number', 'Status endpoint returns server timestamp');
    assert(Array.isArray(data.seats) && data.seats.length === 9, 'Status endpoint returns 9 seats state');
  } catch (err) {
    assert(false, `Status polling test failed: ${err.message}`);
  }

  // ==========================================
  // GROUP 2: BROWSER UI VERIFICATION (1:1 05_02)
  // ==========================================
  console.log('\n--- GROUP 2: BROWSER UI VERIFICATION (1:1 05_02) ---');

  // Obtain official consent token to bypass compliance gate
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

    // Test 2.2: Host & Room Info Bar
    const hostName = await page.$eval('[data-testid="host-name"]', (el) => el.innerText.trim());
    assert(hostName === 'Maria Live', `Host name displays "${hostName}" (Maria Live)`);

    const hasCrown = await page.evaluate(() => document.body.innerText.includes('👑') || !!document.querySelector('.lucide-crown'));
    assert(hasCrown, 'Golden crown badge 👑 displayed next to host');

    const audienceCount = await page.$eval('[data-testid="audience-count"]', (el) => el.innerText.trim());
    assert(Number(audienceCount) >= 200, `Live audience pill displays "${audienceCount}" viewers`);

    // Test 2.3: 9-Seat Grid Structure
    const seatGrid = await page.$('[data-testid="nine-seat-grid"]');
    assert(seatGrid !== null, 'Nine-seat 3x3 grid container exists');

    const seat1Host = await page.$('[data-testid="seat-1-host"]');
    assert(seat1Host !== null, 'Seat 1 (Host) is rendered with host styling');

    const hostBadge = await page.evaluate(() => {
      const seat = document.querySelector('[data-testid="seat-1-host"]');
      return seat ? seat.innerText.includes('HOST') : false;
    });
    assert(hostBadge, 'Seat 1 displays "HOST" overlay badge');

    // Test 2.4: Seats 2 to 9 Empty State Indicators
    let emptyCount = 0;
    for (let i = 2; i <= 9; i++) {
      const emptySeat = await page.$(`[data-testid="seat-${i}-empty"]`);
      if (emptySeat) emptyCount++;
    }
    assert(emptyCount === 8, `All 8 participant seats (Seats 2-9) initially render available with "+" button`);

    // Test 2.5: Bottom Control Bar
    const controlBar = await page.$('[data-testid="bottom-control-bar"]');
    assert(controlBar !== null, 'Bottom control bar container exists');

    const micBtn = await page.$('[data-testid="control-mic"]');
    const camBtn = await page.$('[data-testid="control-camera"]');
    const audBtn = await page.$('[data-testid="control-audience"]');
    const chatBtn = await page.$('[data-testid="control-chat"]');
    const emoteBtn = await page.$('[data-testid="control-emotes"]');
    const giftBtn = await page.$('[data-testid="control-gift"]');

    assert(micBtn && camBtn && audBtn && chatBtn && emoteBtn && giftBtn, 'All 6 bottom circular control buttons are present');

    // Test 2.6: Control Interactions
    await micBtn.click();
    await new Promise((r) => setTimeout(r, 300));
    const toastAfterMic = await page.evaluate(() => document.body.innerText.includes('Microphone'));
    assert(toastAfterMic, 'Toggling mic button triggers response toast');

    await emoteBtn.click();
    await new Promise((r) => setTimeout(r, 300));
    const toastAfterEmote = await page.evaluate(() => document.body.innerText.includes('Reaction sent'));
    assert(toastAfterEmote, 'Toggling reaction button triggers response toast');

    // Test 2.7: Footer Reference Banner
    const footerBanner = await page.$eval('[data-testid="footer-reference-banner"]', (el) => el.innerText.trim());
    assert(footerBanner.includes('05_02 Seat Grid'), `Footer reference banner displays "${footerBanner}"`);

    // ==========================================
    // GROUP 3: MULTI-DEVICE & INTERACTIVE SEAT ACTIONS
    // ==========================================
    console.log('\n--- GROUP 3: MULTI-DEVICE & INTERACTIVE SEAT ACTIONS ---');

    // Step 1: Click Seat 4 empty seat
    console.log('  Tapping Seat 4...');
    await page.click('[data-testid="seat-4-empty"]');
    await new Promise((r) => setTimeout(r, 600));

    const modalOpen = await page.$('[data-testid="seat-modal"]');
    assert(modalOpen !== null, 'Seat action modal opens upon tapping empty seat');

    // Step 2: Confirm Take Seat #4
    await page.click('[data-action="confirm-take-seat"]');
    await new Promise((r) => setTimeout(r, 1200));

    const seat4Occupied = await page.$('[data-testid="seat-4-occupied"]');
    assert(seat4Occupied !== null, 'Seat 4 immediately transitions to Occupied state on client');

    // Step 3: Open second browser page (Device 2) and verify real-time sync
    console.log('  Opening simulated Device 2 page...');
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

    const dev2Seat4Occupied = await page2.$('[data-testid="seat-4-occupied"]');
    assert(dev2Seat4Occupied !== null, 'Device 2 synchronizes and displays Seat 4 as Occupied');

    // Step 4: Device 1 vacates Seat 4
    console.log('  Device 1 vacating Seat 4...');
    await page.bringToFront();
    await page.waitForSelector('[data-testid="seat-4-occupied"]', { timeout: 5000 });
    await page.click('[data-testid="seat-4-occupied"]');
    await page.waitForSelector('[data-action="confirm-vacate-seat"]', { timeout: 5000 });
    await page.click('[data-action="confirm-vacate-seat"]');
    await new Promise((r) => setTimeout(r, 1500));

    const seat4EmptyAgain = await page.$('[data-testid="seat-4-empty"]');
    assert(seat4EmptyAgain !== null, 'Device 1 updates Seat 4 to Available state');

    // Wait for polling sync on Device 2 (up to 3.5s)
    console.log('  Waiting for polling sync on Device 2...');
    await page2.bringToFront();
    await new Promise((r) => setTimeout(r, 3200));
    const dev2Seat4EmptyAgain = await page2.$('[data-testid="seat-4-empty"]');
    assert(dev2Seat4EmptyAgain !== null, 'Device 2 receives synced update and displays Seat 4 as Available');

    await page2.close();

    // Step 5: Navigation check (Back button takes user to /party/create)
    console.log('  Checking Back navigation...');
    await page.bringToFront();
    await page.click('[data-action="back"]');
    await new Promise((r) => setTimeout(r, 1500));
    const currentUrl = page.url();
    assert(currentUrl.includes('/party/create'), `Back navigation returns to /party/create (Current: ${currentUrl})`);

  } catch (err) {
    assert(false, `Browser test encountered error: ${err.message}`);
  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
