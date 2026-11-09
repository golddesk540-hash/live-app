const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const ROOM_ID = '7001';
const BRAIN_DIR = 'C:/Users/HP/.gemini/antigravity/brain/d49e7e92-2cbf-4a82-b7ce-920366fb716f';
const ASSETS_DIR = path.resolve(__dirname, 'public/assets/party');

async function captureScreenshots() {
  console.log('Starting screenshot captures for Module 5.6 Party Themes...');
  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=412,915'],
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

  // 1. Mobile 1:1 Match (Default theme selected)
  console.log('Capturing 01_mobile_party_themes_1to1.png...');
  await page.goto(`${BASE_URL}/party/themes?preview=demo&roomId=${ROOM_ID}`, {
    waitUntil: 'networkidle2',
  });
  await new Promise((r) => setTimeout(r, 600));

  const screen1 = await page.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(BRAIN_DIR, '01_mobile_party_themes_1to1.png'), screen1);
  fs.writeFileSync(path.join(ASSETS_DIR, '01_mobile_party_themes_1to1.png'), screen1);

  // 2. Galaxy theme selected with Live Preview
  console.log('Capturing 02_mobile_party_themes_galaxy_selected.png...');
  await page.evaluate(() => {
    document.querySelector('[data-testid="theme-card-galaxy"]').click();
  });
  await new Promise((r) => setTimeout(r, 500));

  const screen2 = await page.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(BRAIN_DIR, '02_mobile_party_themes_galaxy_selected.png'), screen2);
  fs.writeFileSync(path.join(ASSETS_DIR, '02_mobile_party_themes_galaxy_selected.png'), screen2);

  // 3. Apply Theme clicked (Toast notification)
  console.log('Capturing 03_mobile_party_themes_applied_toast.png...');
  await page.evaluate(() => {
    document.querySelector('[data-testid="btn-apply-theme"]').click();
  });
  await new Promise((r) => setTimeout(r, 500));

  const screen3 = await page.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(BRAIN_DIR, '03_mobile_party_themes_applied_toast.png'), screen3);
  fs.writeFileSync(path.join(ASSETS_DIR, '03_mobile_party_themes_applied_toast.png'), screen3);

  // 4. In-Room Custom Themed Party View
  console.log('Capturing 04_mobile_party_room_themed_view.png...');
  await page.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, {
    waitUntil: 'networkidle2',
  });
  await new Promise((r) => setTimeout(r, 800));

  const screen4 = await page.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(BRAIN_DIR, '04_mobile_party_room_themed_view.png'), screen4);
  fs.writeFileSync(path.join(ASSETS_DIR, '04_mobile_party_room_themed_view.png'), screen4);

  // 5. Desktop View
  console.log('Capturing 05_desktop_party_themes_view.png...');
  await page.setViewport({ width: 1440, height: 900, isMobile: false });
  await page.goto(`${BASE_URL}/party/themes?preview=demo&roomId=${ROOM_ID}`, {
    waitUntil: 'networkidle2',
  });
  await new Promise((r) => setTimeout(r, 600));

  const screen5 = await page.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(BRAIN_DIR, '05_desktop_party_themes_view.png'), screen5);
  fs.writeFileSync(path.join(ASSETS_DIR, '05_desktop_party_themes_view.png'), screen5);

  await browser.close();
  console.log('All 5 screenshots captured and saved successfully!');
}

captureScreenshots().catch(console.error);
