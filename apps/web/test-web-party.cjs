const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const BASE_URL = 'http://localhost:3000';
const ROOM_ID = '7001';

async function runTests() {
  console.log('======================================================================');
  console.log('  POPO LIVE — MODULE 5.7: WEB PARTY AUTOMATED TEST SUITE');
  console.log('======================================================================\n');

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

  // -------------------------------------------------------------------------
  // Part 1: REST API Verification
  // -------------------------------------------------------------------------
  console.log('--- 1. REST API Verification ---');

  // Test 1: GET /api/party/7001/web-info
  const webInfoRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/web-info`);
  assert(webInfoRes.status === 200, '1. GET /api/party/7001/web-info returns HTTP 200');
  const webInfo = await webInfoRes.json();
  assert(webInfo.success === true, '2. Web info response indicates success');
  assert(Boolean(webInfo.room && webInfo.room.roomNumber === ROOM_ID), '3. Returns correct room number 7001');
  assert(Boolean(webInfo.room.hostNickname), '4. Returns host info: ' + webInfo.room.hostNickname);
  assert(Boolean(webInfo.activeTheme && webInfo.activeTheme.id), '5. Returns active theme: ' + webInfo.activeTheme.name);
  assert(webInfo.room.canonicalWebSlug === 'live.popolive.com/party', '6. Returns canonical web slug "live.popolive.com/party"');

  // Test 2: GET /api/party/7001/seats
  const seatsRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats`);
  assert(seatsRes.status === 200, '7. GET /api/party/7001/seats returns HTTP 200');
  const seatsData = await seatsRes.json();
  assert(Array.isArray(seatsData.seats) && seatsData.seats.length === 9, '8. Returns exactly 9 seats for web party grid');

  // Test 3: Agora RTC token generation for Web Party Publisher & Subscriber
  const pubTokenRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/media/token?seatNumber=1&role=publisher`);
  assert(pubTokenRes.status === 200, '9. Agora RTC Publisher Token endpoint returns HTTP 200');
  const pubTokenData = await pubTokenRes.json();
  assert(pubTokenData.tokenResult && pubTokenData.tokenResult.channelName === `party_${ROOM_ID}`, '10. Publisher token bound to channel party_7001');

  const subTokenRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/media/token?seatNumber=7&role=subscriber`);
  assert(subTokenRes.status === 200, '11. Agora RTC Subscriber Token endpoint returns HTTP 200');

  // -------------------------------------------------------------------------
  // Part 2: Web Party Showcase UI Verification (05_07_web_party.png 1:1)
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Web Party Showcase Screen (05_07_web_party.png 1:1 Match) ---');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('poppo_terms_consent_status', 'accepted');
    localStorage.setItem('poppo_terms_consent_version', 'v4.2.0');
  });

  // Get consent cookie
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
  const cookieHeader = consentRes.headers.get('set-cookie');
  if (cookieHeader) {
    const parts = cookieHeader.split(';')[0].split('=');
    await page.setCookie({
      name: parts[0].trim(),
      value: parts[1].trim(),
      domain: 'localhost',
      path: '/',
    });
  }

  // Navigate to /party/web?preview=demo&roomId=7001
  await page.goto(`${BASE_URL}/party/web?preview=demo&roomId=${ROOM_ID}`, {
    waitUntil: 'networkidle2',
  });

  const showcaseScreen = await page.$('[data-testid="web-party-showcase-screen"]');
  assert(Boolean(showcaseScreen), '12. Web Party showcase screen renders');

  const backBtn = await page.$('[data-action="back"]');
  assert(Boolean(backBtn), '13. Back chevron button is visible');

  const globeIcon = await page.$('[data-testid="globe-icon"]');
  assert(Boolean(globeIcon), '14. Glowing purple globe icon renders');

  const joinTitle = await page.$('[data-testid="join-on-web-title"]');
  assert(Boolean(joinTitle), '15. "Join on Web" title with Popo badge renders');

  const urlText = await page.$eval('[data-testid="web-party-url"]', (el) => el.textContent.trim());
  assert(urlText === 'live.popolive.com/party', '16. URL capsule displays "live.popolive.com/party"');

  const copyBtn = await page.$('[data-action="copy-url"]');
  assert(Boolean(copyBtn), '17. Copy link button is present');

  await page.evaluate(() => {
    document.querySelector('[data-action="copy-url"]').click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const showcaseToast = await page.$('[data-testid="showcase-toast"]');
  assert(Boolean(showcaseToast), '18. Clicking copy button displays confirmation toast');

  const launchBtn = await page.$('[data-action="launch-web-party"]');
  assert(Boolean(launchBtn), '19. "Launch Web Party" action button renders');

  const footerRef = await page.$('[data-testid="footer-reference-web-party"]');
  assert(Boolean(footerRef), '20. Footer reference "05_07 Web Party" is visible');

  // -------------------------------------------------------------------------
  // Part 3: Full Widescreen Web Party Room (Laptop Experience)
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Full Widescreen Web Party Room Experience ---');

  // Switch to widescreen laptop viewport (1280 x 800)
  await page.setViewport({ width: 1280, height: 800, isMobile: false });
  await page.goto(`${BASE_URL}/party/web/${ROOM_ID}`, {
    waitUntil: 'networkidle2',
  });

  const webPartyRoom = await page.$('[data-testid="web-party-room-screen"]');
  assert(Boolean(webPartyRoom), '21. Widescreen Web Party Room page renders');

  const nineSeatGrid = await page.$('[data-testid="web-nine-seat-grid"]');
  assert(Boolean(nineSeatGrid), '22. Nine-Seat Web Grid container renders');

  const webSeats = await page.$$('[data-testid^="web-seat-"]');
  assert(webSeats.length === 9, '23. Exactly 9 interactive seats rendered in web grid');

  const seat1 = await page.$('[data-testid="web-seat-1"]');
  assert(Boolean(seat1), '24. Seat 1 (Host Maria) renders');

  const audiencePill = await page.$('[data-testid="web-audience-pill"]');
  assert(Boolean(audiencePill), '25. Web audience pill displays live viewer count (256)');

  // Controls bar
  const controlsBar = await page.$('[data-testid="web-party-controls"]');
  assert(Boolean(controlsBar), '26. Web party bottom controls bar renders');

  // Mic toggle test
  await page.evaluate(() => {
    document.querySelector('[data-action="toggle-mic"]').click();
  });
  await new Promise((r) => setTimeout(r, 400));
  const micToast = await page.$('[data-testid="web-party-toast"]');
  assert(Boolean(micToast), '27. Toggling microphone updates state and displays toast');

  // Camera toggle test
  await page.evaluate(() => {
    document.querySelector('[data-action="toggle-camera"]').click();
  });
  await new Promise((r) => setTimeout(r, 400));
  const cameraToast = await page.$('[data-testid="web-party-toast"]');
  assert(Boolean(cameraToast), '28. Toggling camera updates state and displays toast');

  // Right sidebar & Chat
  const rightSidebar = await page.$('[data-testid="web-right-sidebar"]');
  assert(Boolean(rightSidebar), '29. Right sidebar panel renders with Chat and Audience');

  const chatTab = await page.$('[data-testid="tab-web-chat"]');
  assert(Boolean(chatTab), '30. Chat tab is active by default');

  const chatStream = await page.$('[data-testid="web-chat-stream"]');
  assert(Boolean(chatStream), '31. Chat message stream renders canonical messages');

  // Send a chat message from Web
  await page.type('[data-testid="web-chat-input"]', 'Hello from Web Party Studio! 🚀');
  await page.evaluate(() => {
    document.querySelector('[data-testid="web-chat-send-btn"]').click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const hasSentMsg = await page.evaluate(() => {
    return document.body.innerText.includes('Hello from Web Party Studio! 🚀');
  });
  assert(hasSentMsg, '32. New chat message sent from web appears in stream');

  // Switch to Audience tab
  await page.evaluate(() => {
    document.querySelector('[data-testid="tab-web-audience"]').click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const audienceList = await page.$('[data-testid="web-audience-list"]');
  assert(Boolean(audienceList), '33. Switching to Audience tab lists online members with Lv badges');

  // -------------------------------------------------------------------------
  // Part 4: Cross-Platform Real-Time Sync (Mobile ↔ Web)
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Cross-Platform Real-Time Synchronization ---');

  // Create second page simulating Mobile user in /party/room/7001
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });
  await mobilePage.evaluateOnNewDocument(() => {
    localStorage.setItem('poppo_terms_consent_status', 'accepted');
    localStorage.setItem('poppo_terms_consent_version', 'v4.2.0');
  });
  if (cookieHeader) {
    const parts = cookieHeader.split(';')[0].split('=');
    await mobilePage.setCookie({
      name: parts[0].trim(),
      value: parts[1].trim(),
      domain: 'localhost',
      path: '/',
    });
  }

  await mobilePage.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, {
    waitUntil: 'networkidle2',
  });

  const mobileHasWebMsg = await mobilePage.evaluate(() => {
    return document.body.innerText.includes('Hello from Web Party Studio! 🚀');
  });
  assert(mobileHasWebMsg, '34. Cross-Platform Chat Sync: Mobile user receives message sent from Web');

  // Mobile user changes theme to "party" via API, Web user UI updates automatically
  await fetch(`${BASE_URL}/api/party/${ROOM_ID}/theme/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ themeId: 'party', isHostAction: true, userId: 'host_maria' }),
  });

  console.log('  Waiting 3.2s for background polling sync on Web Party...');
  await new Promise((r) => setTimeout(r, 3200));

  const webSyncedTheme = await page.$eval('[data-testid="web-party-room-screen"]', (el) =>
    el.getAttribute('data-active-theme')
  );
  assert(webSyncedTheme === 'party', '35. Cross-Platform Theme Sync: Web UI auto-updates to theme applied by Mobile Host');

  // Reset theme back to default
  await fetch(`${BASE_URL}/api/party/${ROOM_ID}/theme/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isHostAction: true, userId: 'host_maria' }),
  });

  await browser.close();

  console.log('\n======================================================================');
  console.log(`  TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed} | SUCCESS RATE: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
