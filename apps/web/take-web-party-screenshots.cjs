const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const ROOM_ID = '7001';
const BRAIN_DIR = 'C:/Users/HP/.gemini/antigravity/brain/d49e7e92-2cbf-4a82-b7ce-920366fb716f';
const ASSETS_DIR = path.resolve(__dirname, 'public/assets/party');

async function captureScreenshots() {
  console.log('Starting screenshot captures for Module 5.7 Web Party...');
  fs.mkdirSync(ASSETS_DIR, { recursive: true });

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

  // 1. Mobile 1:1 Match (05_07_web_party.png Showcase)
  console.log('Capturing 01_mobile_web_party_showcase_1to1.png...');
  await page.goto(`${BASE_URL}/party/web?preview=demo&roomId=${ROOM_ID}`, {
    waitUntil: 'networkidle2',
  });
  await new Promise((r) => setTimeout(r, 600));

  const screen1 = await page.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(BRAIN_DIR, '01_mobile_web_party_showcase_1to1.png'), screen1);
  fs.writeFileSync(path.join(ASSETS_DIR, '01_mobile_web_party_showcase_1to1.png'), screen1);

  // 2. Copy URL Toast Feedback
  console.log('Capturing 02_mobile_web_party_copy_url_toast.png...');
  await page.evaluate(() => {
    document.querySelector('[data-action="copy-url"]').click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const screen2 = await page.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(BRAIN_DIR, '02_mobile_web_party_copy_url_toast.png'), screen2);
  fs.writeFileSync(path.join(ASSETS_DIR, '02_mobile_web_party_copy_url_toast.png'), screen2);

  // 3. Desktop Widescreen Web Party Room (Laptop Experience)
  console.log('Capturing 03_desktop_web_party_room_widescreen.png...');
  await page.setViewport({ width: 1366, height: 768, isMobile: false });
  await page.goto(`${BASE_URL}/party/web/${ROOM_ID}`, {
    waitUntil: 'networkidle2',
  });
  await new Promise((r) => setTimeout(r, 1000));

  const screen3 = await page.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(BRAIN_DIR, '03_desktop_web_party_room_widescreen.png'), screen3);
  fs.writeFileSync(path.join(ASSETS_DIR, '03_desktop_web_party_room_widescreen.png'), screen3);

  // 4. Desktop Web Party Audience Tab
  console.log('Capturing 04_desktop_web_party_audience_panel.png...');
  await page.evaluate(() => {
    document.querySelector('[data-testid="tab-web-audience"]').click();
  });
  await new Promise((r) => setTimeout(r, 500));

  const screen4 = await page.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(BRAIN_DIR, '04_desktop_web_party_audience_panel.png'), screen4);
  fs.writeFileSync(path.join(ASSETS_DIR, '04_desktop_web_party_audience_panel.png'), screen4);

  // 5. Mobile In-Room Web Shortcut
  console.log('Capturing 05_mobile_inroom_web_shortcut.png...');
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });
  await page.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, {
    waitUntil: 'networkidle2',
  });
  await new Promise((r) => setTimeout(r, 800));

  const screen5 = await page.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(BRAIN_DIR, '05_mobile_inroom_web_shortcut.png'), screen5);
  fs.writeFileSync(path.join(ASSETS_DIR, '05_mobile_inroom_web_shortcut.png'), screen5);

  await browser.close();
  console.log('All 5 screenshots captured and saved successfully!');
}

captureScreenshots().catch(console.error);
