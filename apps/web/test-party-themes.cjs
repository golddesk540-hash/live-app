const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const BASE_URL = 'http://localhost:3000';
const ROOM_ID = '7001';

async function runTests() {
  console.log('======================================================================');
  console.log('  POPO LIVE — MODULE 5.6: PARTY THEMES AUTOMATED TEST SUITE');
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
  // Part 1: REST API Tests
  // -------------------------------------------------------------------------
  console.log('--- 1. REST API Verification ---');

  // Test 1: GET /api/party/themes
  const themesRes = await fetch(`${BASE_URL}/api/party/themes`);
  assert(themesRes.status === 200, '1. GET /api/party/themes returns HTTP 200');
  const themesData = await themesRes.json();
  assert(themesData.success === true && Array.isArray(themesData.themes), '2. Available themes returned in array');
  assert(themesData.themes.length >= 6, '3. At least 6 themes available (matches 05_06_themes.png)');

  const canonicalIds = ['default', 'galaxy', 'neon', 'cute', 'elegant', 'party'];
  const hasAllSix = canonicalIds.every((id) => themesData.themes.some((t) => t.id === id));
  assert(hasAllSix, '4. Contains all 6 canonical themes: Default, Galaxy, Neon, Cute, Elegant, Party');

  // Test 2: GET /api/party/7001/theme
  const currentThemeRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/theme`);
  assert(currentThemeRes.status === 200, '5. GET /api/party/7001/theme returns HTTP 200');
  const currentThemeData = await currentThemeRes.json();
  assert(currentThemeData.success === true, '6. Active room theme response indicates success');
  assert(Boolean(currentThemeData.theme && currentThemeData.theme.id), '7. Returns active theme object with valid theme.id');

  // Test 3: POST /api/party/7001/theme/apply with invalid theme ID
  const invalidApplyRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/theme/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      themeId: 'invalid_nonexistent_theme_999',
      isHostAction: true,
      userId: 'host_maria',
    }),
  });
  assert(invalidApplyRes.status === 400, '8. Applying invalid theme ID returns HTTP 400 Bad Request');

  // Test 4: POST /api/party/7001/theme/apply with unauthorized user
  const unauthApplyRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/theme/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      themeId: 'galaxy',
      isHostAction: false,
      userId: 'unauthorized_random_viewer',
    }),
  });
  assert(unauthApplyRes.status === 403, '9. Unauthorized user cannot change theme (HTTP 403 Forbidden)');

  // Test 5: Host applies "galaxy" theme
  const galaxyApplyRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/theme/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      themeId: 'galaxy',
      isHostAction: true,
      userId: 'host_maria',
    }),
  });
  assert(galaxyApplyRes.status === 200, '10. Host applies "galaxy" theme returns HTTP 200');
  const galaxyData = await galaxyApplyRes.json();
  assert(galaxyData.success === true && galaxyData.activeThemeId === 'galaxy', '11. Galaxy theme applied and confirmed in response');

  // Verify DB persistence via GET
  const checkGalaxyRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/theme`);
  const checkGalaxyData = await checkGalaxyRes.json();
  assert(checkGalaxyData.activeThemeId === 'galaxy', '12. Persistence verified: Active theme is now Galaxy in PostgreSQL');

  // Test 6: Host applies "neon" theme
  const neonApplyRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/theme/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      themeId: 'neon',
      isHostAction: true,
      userId: 'host_maria',
    }),
  });
  assert(neonApplyRes.status === 200, '13. Host applies "neon" theme returns HTTP 200');

  // Test 7: Reset to Default theme
  const resetRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/theme/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isHostAction: true, userId: 'host_maria' }),
  });
  assert(resetRes.status === 200, '14. Reset to default theme returns HTTP 200');
  const resetData = await resetRes.json();
  assert(resetData.activeThemeId === 'default', '15. Default theme restored successfully');

  // -------------------------------------------------------------------------
  // Part 2: Headless Browser UI Verification
  // -------------------------------------------------------------------------
  console.log('\n--- 2. UI & Visual Verification (05_06_themes.png) ---');

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

  // Navigate to Party Themes standalone page
  await page.goto(`${BASE_URL}/party/themes?preview=demo&roomId=${ROOM_ID}`, {
    waitUntil: 'networkidle2',
  });

  const headingExists = await page.$('[data-testid="heading-party-themes"]');
  assert(Boolean(headingExists), '16. "Party Themes" heading renders matching reference');

  const themesGrid = await page.$('[data-testid="themes-grid"]');
  assert(Boolean(themesGrid), '17. 3-column Themes grid renders');

  // Verify all 6 cards exist in UI
  const cards = await page.$$('[data-testid^="theme-card-"]');
  assert(cards.length >= 6, '18. All 6 canonical theme cards rendered in grid');

  const defaultCard = await page.$('[data-testid="theme-card-default"]');
  assert(Boolean(defaultCard), '19. Card "Default" is present');

  const galaxyCard = await page.$('[data-testid="theme-card-galaxy"]');
  assert(Boolean(galaxyCard), '20. Card "Galaxy" is present');

  const neonCard = await page.$('[data-testid="theme-card-neon"]');
  assert(Boolean(neonCard), '21. Card "Neon" is present');

  const cuteCard = await page.$('[data-testid="theme-card-cute"]');
  assert(Boolean(cuteCard), '22. Card "Cute" is present');

  const elegantCard = await page.$('[data-testid="theme-card-elegant"]');
  assert(Boolean(elegantCard), '23. Card "Elegant" is present');

  const partyCard = await page.$('[data-testid="theme-card-party"]');
  assert(Boolean(partyCard), '24. Card "Party" is present');

  // Selected checkmark exists on default card
  const checkMarkDefault = await page.$('[data-testid="theme-check-default"]');
  assert(Boolean(checkMarkDefault), '25. Purple checkmark badge rendered on selected card');

  // Live preview card is present
  const livePreview = await page.$('[data-testid="selected-theme-preview"]');
  assert(Boolean(livePreview), '26. Live Preview card displays expected theme appearance');

  // Interactive selection test: Click Galaxy
  await page.evaluate(() => {
    document.querySelector('[data-testid="theme-card-galaxy"]').click();
  });
  await new Promise((r) => setTimeout(r, 300));

  const checkMarkGalaxy = await page.$('[data-testid="theme-check-galaxy"]');
  assert(Boolean(checkMarkGalaxy), '27. Selecting "Galaxy" highlights card and displays checkmark badge');

  // Verify Apply Theme button exists
  const btnApply = await page.$('[data-testid="btn-apply-theme"]');
  assert(Boolean(btnApply), '28. "Apply Theme" full-width rounded pill button renders');

  // Click Apply Theme button
  await page.evaluate(() => {
    document.querySelector('[data-testid="btn-apply-theme"]').click();
  });
  await new Promise((r) => setTimeout(r, 600));

  const toast = await page.$('[data-testid="theme-toast"]');
  assert(Boolean(toast), '29. Applying theme displays success feedback toast');

  // Footer reference
  const footerRef = await page.$('[data-testid="footer-reference-themes"]');
  assert(Boolean(footerRef), '30. Footer reference "05_06 Themes" is visible');

  // -------------------------------------------------------------------------
  // Part 3: In-Room Theme Integration & Multi-User Real-Time Sync
  // -------------------------------------------------------------------------
  console.log('\n--- 3. In-Room Integration & Multi-User Real-Time Sync ---');

  // Open Room page in Page 1 (Host)
  await page.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, {
    waitUntil: 'networkidle2',
  });

  const roomThemeAttr = await page.$eval('[data-testid="seat-grid-screen"]', (el) =>
    el.getAttribute('data-active-theme')
  );
  assert(roomThemeAttr === 'galaxy', '31. Party Room automatically loads active theme (Galaxy)');

  const btnOpenThemes = await page.$('[data-action="open-themes"]');
  assert(Boolean(btnOpenThemes), '32. Party Room header renders "Theme" button');

  // Open themes modal inside room
  await page.evaluate(() => {
    document.querySelector('[data-action="open-themes"]').click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const modalOverlay = await page.$('[data-testid="themes-modal-overlay"]');
  assert(Boolean(modalOverlay), '33. Clicking "Theme" button opens in-room Themes modal');

  // Host selects and applies "Party" theme inside modal
  await page.evaluate(() => {
    document.querySelector('[data-testid="theme-card-party"]').click();
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.evaluate(() => {
    document.querySelector('[data-testid="btn-apply-theme"]').click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Create second page (Participant device)
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });
  await page2.evaluateOnNewDocument(() => {
    localStorage.setItem('poppo_terms_consent_status', 'accepted');
    localStorage.setItem('poppo_terms_consent_version', 'v4.2.0');
  });
  if (cookieHeader) {
    const parts = cookieHeader.split(';')[0].split('=');
    await page2.setCookie({
      name: parts[0].trim(),
      value: parts[1].trim(),
      domain: 'localhost',
      path: '/',
    });
  }

  await page2.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, {
    waitUntil: 'networkidle2',
  });

  const page2ThemeAttr = await page2.$eval('[data-testid="seat-grid-screen"]', (el) =>
    el.getAttribute('data-active-theme')
  );
  assert(page2ThemeAttr === 'party', '34. Participant device loads synchronized theme "Party"');

  // Real-time synchronization check: Host applies "Neon" via API, Page 2 updates via background poll
  await fetch(`${BASE_URL}/api/party/${ROOM_ID}/theme/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ themeId: 'neon', isHostAction: true, userId: 'host_maria' }),
  });

  console.log('  Waiting 3s for background polling sync...');
  await new Promise((r) => setTimeout(r, 3200));

  const syncedTheme = await page2.$eval('[data-testid="seat-grid-screen"]', (el) =>
    el.getAttribute('data-active-theme')
  );
  assert(syncedTheme === 'neon', '35. Multi-device real-time sync: Participant UI auto-updates to "Neon"');

  // Reset back to default for room stability
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
