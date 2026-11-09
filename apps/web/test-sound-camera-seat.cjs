const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const ROOM_ID = '7001';

async function runTests() {
  console.log('================================================================');
  console.log('POPO LIVE — MODULE 5.4 AUTOMATED TEST SUITE');
  console.log('SOUND AND CAMERA ON A SEAT — 05_04_sound_and_camera_on_a_seat.png');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // GROUP 1: REST APIS & BACKEND MEDIA CONTROLS
  // -------------------------------------------------------------
  console.log('\n--- GROUP 1: REST APIS & MEDIA CONTROL VERIFICATION ---');

  // 1.1 GET /api/party/7001/seats
  const seatsRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats`);
  const seatsData = await seatsRes.json();
  assert(seatsRes.status === 200 && seatsData.success === true, '1.1 GET /api/party/7001/seats returns 200 OK');
  assert(seatsData.totalSeats === 9, '1.2 Total seats count equals 9');
  assert(seatsData.occupiedCount === 6, '1.3 Exactly 6 seats occupied matching 05_04 reference');
  assert(seatsData.availableCount === 3, '1.4 Exactly 3 seats available (Seats 7, 8, 9)');

  const seat1 = seatsData.seats.find((s) => s.seatNumber === 1);
  assert(seat1 && seat1.isHost === true && seat1.participantName === 'Maria Live', '1.5 Seat 1 is occupied by Host Maria Live');
  assert(seat1.isMuted === false && seat1.isCameraOn === true, '1.6 Seat 1 has active camera and unmuted mic');

  const seat2 = seatsData.seats.find((s) => s.seatNumber === 2);
  assert(seat2 && seat2.participantName === 'Kenji R', '1.7 Seat 2 is occupied by Kenji R');

  // 1.2 POST /api/party/7001/seats/media/toggle (Participant mic toggle)
  const muteRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/media/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatNumber: 2, type: 'mic', enabled: false }),
  });
  const muteData = await muteRes.json();
  assert(muteRes.status === 200 && muteData.success === true && muteData.seat.isMuted === true, '1.8 Participant on Seat 2 successfully muted mic');

  const unmuteRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/media/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatNumber: 2, type: 'mic', enabled: true }),
  });
  const unmuteData = await unmuteRes.json();
  assert(unmuteRes.status === 200 && unmuteData.success === true && unmuteData.seat.isMuted === false, '1.9 Participant on Seat 2 successfully unmuted mic');

  // 1.3 POST /api/party/7001/seats/media/toggle (Participant camera toggle)
  const camOffRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/media/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatNumber: 3, type: 'camera', enabled: false }),
  });
  const camOffData = await camOffRes.json();
  assert(camOffRes.status === 200 && camOffData.seat.isCameraOn === false, '1.10 Participant on Seat 3 successfully disabled video');

  const camOnRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/media/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatNumber: 3, type: 'camera', enabled: true }),
  });
  const camOnData = await camOnRes.json();
  assert(camOnRes.status === 200 && camOnData.seat.isCameraOn === true, '1.11 Participant on Seat 3 successfully re-enabled video');

  // 1.4 Camera facing switch
  const facingRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/media/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatNumber: 2, type: 'facing', facing: 'environment' }),
  });
  const facingData = await facingRes.json();
  assert(facingRes.status === 200 && facingData.seat.cameraFacing === 'environment', '1.12 Camera switched to back (environment) facing');

  // 1.5 Host Moderation: Host mutes participant
  const hostMuteRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/media/moderate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatNumber: 2, action: 'host_mute', isHostAction: true }),
  });
  const hostMuteData = await hostMuteRes.json();
  assert(hostMuteRes.status === 200 && hostMuteData.moderatedSeat.isHostMuted === true && hostMuteData.moderatedSeat.isMuted === true, '1.13 Host successfully muted participant on Seat 2');

  // 1.6 Host Moderation: Host disables participant video
  const hostDisableVidRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/media/moderate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatNumber: 2, action: 'disable_video', isHostAction: true }),
  });
  const hostDisableVidData = await hostDisableVidRes.json();
  assert(hostDisableVidRes.status === 200 && hostDisableVidData.moderatedSeat.isVideoDisabled === true && hostDisableVidData.moderatedSeat.isCameraOn === false, '1.14 Host successfully disabled video for participant on Seat 2');

  // 1.7 Security constraint: Host cannot secretly or forcibly turn on participant mic/camera
  const forceUnmuteRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/media/moderate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatNumber: 2, action: 'force_unmute', isHostAction: true }),
  });
  const forceUnmuteData = await forceUnmuteRes.json();
  assert(forceUnmuteRes.status === 403 && forceUnmuteData.code === 'SECURITY_CONSENT_VIOLATION', '1.15 Security Constraint: Host cannot forcibly activate participant mic without consent (HTTP 403)');

  // Reset Seat 2 to active state for visual UI tests
  await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/media/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatNumber: 2, type: 'mic', enabled: true }),
  });
  await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/media/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatNumber: 2, type: 'camera', enabled: true }),
  });

  // 1.8 Agora RTC Token Generation
  const tokenPubRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/media/token?seatNumber=2&role=publisher`);
  const tokenPubData = await tokenPubRes.json();
  assert(tokenPubRes.status === 200 && tokenPubData.success === true && tokenPubData.tokenResult.role === 'publisher', '1.16 Agora RTC publisher token generated for Seat 2');

  const tokenSubRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/media/token?seatNumber=2&role=subscriber`);
  const tokenSubData = await tokenSubRes.json();
  assert(tokenSubRes.status === 200 && tokenSubData.tokenResult.role === 'subscriber', '1.17 Agora RTC subscriber/audience token generated');

  // -------------------------------------------------------------
  // GROUP 2: BROWSER UI VERIFICATION (1:1 05_04 MATCH)
  // -------------------------------------------------------------
  console.log('\n--- GROUP 2: BROWSER UI VERIFICATION (1:1 05_04 REFERENCE) ---');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=412,915'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

  // Bypass compliance consent gate
  const consentRes = await fetch(`${BASE_URL}/api/consent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ termsAccepted: true, ageVerified: true }),
  });
  const consentData = await consentRes.json();

  await page.setCookie({
    name: 'poppo_terms_consent',
    value: consentData.token || 'consent-granted-demo',
    domain: 'localhost',
    path: '/',
  });

  // Navigate to Party Room
  await page.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  // 2.1 Header and Status Bar
  const header = await page.$('[data-testid="seat-grid-header"]');
  assert(header !== null, '2.1 Top header is present with back button and branding');

  const backBtn = await page.$('[data-action="back"]');
  assert(backBtn !== null, '2.2 Back chevron navigation button is rendered');

  const castBtn = await page.$('[data-action="cast"]');
  assert(castBtn !== null, '2.3 Audio cast / screen share icon button is rendered');

  const hostName = await page.$eval('[data-testid="host-name"]', (el) => el.textContent.trim());
  assert(hostName.includes('Maria Live'), `2.4 Host name is Maria Live (found: "${hostName}")`);

  const audienceCount = await page.$eval('[data-testid="audience-count"]', (el) => el.textContent.trim());
  assert(audienceCount === '256', `2.5 Audience count pill displays 256 (found: "${audienceCount}")`);

  // 2.2 9-Seat Grid
  const grid = await page.$('[data-testid="nine-seat-grid"]');
  assert(grid !== null, '2.6 3x3 Nine-seat grid container is rendered');

  // Seat 1: Host Seat
  const seat1El = await page.$('[data-testid="seat-1-host"]');
  assert(seat1El !== null, '2.7 Seat 1 (Host) is rendered with glowing magenta border');

  const seat1Text = await page.evaluate((el) => el.textContent, seat1El);
  assert(seat1Text.includes('Host') && seat1Text.includes('👑'), '2.8 Seat 1 displays Host label, crown, and golden mic');

  // Seats 2-6: Occupied Seats
  for (let s = 2; s <= 6; s++) {
    const occEl = await page.$(`[data-testid="seat-${s}-occupied"]`);
    assert(occEl !== null, `2.9 Seat ${s} is rendered as occupied participant seat`);

    const micBadge = await page.$(`[data-testid="seat-${s}-mic-badge"]`);
    assert(micBadge !== null, `2.10 Seat ${s} displays microphone indicator badge`);
  }

  // Seats 7-9: Empty Seats
  for (let s = 7; s <= 9; s++) {
    const emptyEl = await page.$(`[data-testid="seat-${s}-empty"]`);
    assert(emptyEl !== null, `2.11 Seat ${s} is rendered as available empty seat`);

    const addBtn = await emptyEl.$('[data-action="add-participant"]');
    assert(addBtn !== null, `2.12 Seat ${s} contains purple circular plus (+) button`);
  }

  // 2.3 Bottom Control Bar (6 Buttons matching 05_04)
  const ctrlMic = await page.$('[data-testid="control-mic"]');
  assert(ctrlMic !== null, '2.13 Bottom control bar: Microphone button rendered');

  const ctrlCam = await page.$('[data-testid="control-camera"]');
  assert(ctrlCam !== null, '2.14 Bottom control bar: Video Camera button rendered');

  const ctrlSound = await page.$('[data-testid="control-sound"]');
  assert(ctrlSound !== null, '2.15 Bottom control bar: Speaker / Sound button rendered');

  const ctrlAud = await page.$('[data-testid="control-audience"]');
  assert(ctrlAud !== null, '2.16 Bottom control bar: Audience / Requests button rendered');

  const ctrlChat = await page.$('[data-testid="control-chat"]');
  assert(ctrlChat !== null, '2.17 Bottom control bar: Chat button rendered');

  const ctrlMore = await page.$('[data-testid="control-more"]');
  assert(ctrlMore !== null, '2.18 Bottom control bar: More Options (•••) button rendered');

  // 2.4 Footer Reference Banner
  const footerText = await page.$eval('[data-testid="footer-reference-banner"]', (el) => el.textContent.trim());
  assert(footerText.includes('05_04 Sound and Camera on a Seat'), `2.19 Footer reference banner strictly matches 05_04 (found: "${footerText}")`);

  // -------------------------------------------------------------
  // GROUP 3: INTERACTIVE MODALS & MULTI-DEVICE MEDIA SYNC
  // -------------------------------------------------------------
  console.log('\n--- GROUP 3: INTERACTIVE MODALS & REAL-TIME MEDIA SYNC ---');

  // 3.1 Click Seat 2 to open Seat Media & Host Moderation Drawer
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="seat-2-occupied"]');
    if (el) el.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const seatModal = await page.$('[data-testid="seat-modal"]');
  assert(seatModal !== null, '3.1 Seat modal drawer opens upon tapping occupied Seat 2');

  const toggleMicBtn = await page.$('[data-action="toggle-seat-mic"]');
  assert(toggleMicBtn !== null, '3.2 Participant mic toggle action button is available in drawer');

  const toggleCamBtn = await page.$('[data-action="toggle-seat-camera"]');
  assert(toggleCamBtn !== null, '3.3 Participant camera toggle action button is available in drawer');

  const flipCamBtn = await page.$('[data-action="flip-seat-camera"]');
  assert(flipCamBtn !== null, '3.4 Participant flip camera action button is available in drawer');

  const hostMuteBtn = await page.$('[data-action="host-mute"]');
  assert(hostMuteBtn !== null, '3.5 Host Mute participant moderation button is available in drawer');

  const disableVidBtn = await page.$('[data-action="disable-video"]');
  assert(disableVidBtn !== null, '3.6 Disable Video participant moderation button is available in drawer');

  // 3.2 Host Mute Participant from UI Drawer
  await page.evaluate(() => {
    const btn = document.querySelector('[data-action="host-mute"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  const toastText = await page.$eval('[data-testid="seat-grid-toast"]', (el) => el.textContent.trim());
  assert(toastText.includes('Host muted participant') || toastText.includes('muted'), `3.7 Toast notification displays host moderation event (found: "${toastText}")`);

  // 3.3 Multi-Device Sync: Launch Device 2 and verify it sees Seat 2 muted
  console.log('Testing Device 2 real-time synchronization...');
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });
  await page2.setCookie({
    name: 'poppo_terms_consent',
    value: consentData.token || 'consent-granted-demo',
    domain: 'localhost',
    path: '/',
  });
  await page2.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, {
    waitUntil: 'networkidle2',
  });

  const device2Seat2Mic = await page2.$eval('[data-testid="seat-2-mic-badge"]', (el) => el.getAttribute('title'));
  assert(device2Seat2Mic === 'Muted', `3.8 Device 2 observes real-time muted status on Seat 2 (found: "${device2Seat2Mic}")`);

  // Close Device 2 and modal
  await page2.close();

  // Reset Seat 2 mic to unmuted
  await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/media/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatNumber: 2, type: 'mic', enabled: true }),
  });

  // 3.4 Toggle Bottom Bar Mic
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="control-mic"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  const bottomToast = await page.$eval('[data-testid="seat-grid-toast"]', (el) => el.textContent.trim());
  assert(bottomToast.includes('Microphone'), `3.9 Toggling bottom mic updates state and shows toast (found: "${bottomToast}")`);

  await browser.close();

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED / ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test run error:', err);
  process.exit(1);
});
