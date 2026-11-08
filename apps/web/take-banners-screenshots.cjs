const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, 'public', 'screenshots', 'phase3_05');
const BRAIN_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Authenticating & getting consent cookie for banners screenshots...');

  // Accept terms to get valid consent cookie
  const consentRes = await fetch('http://localhost:3000/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'banner_shot_anon_' + Date.now(),
    }),
  });
  const termsRaw = consentRes.headers.get('set-cookie')?.split(';')[0];
  const termsValue = termsRaw ? termsRaw.substring('poppo_terms_consent='.length) : '';

  // Login as verified user
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'topstreamer@example.com',
      password: 'Password123!',
    }),
  });
  const loginData = await loginRes.json();
  const token = loginData.sessionToken || '';

  console.log('Launching headless browser to capture Prompt 03.5 screenshots...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  const page = await browser.newPage();

  await page.setCookie(
    { name: 'poppo_session', value: token, domain: 'localhost', path: '/' },
    { name: 'poppo_terms_consent', value: termsValue, domain: 'localhost', path: '/' }
  );

  // 1. Mobile Banners and Rank Door Feed (Exact 1:1 match to 03_05_banners_and_rank_door.png)
  console.log('Capturing 01_mobile_banners_and_rank_door.png...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  await page.goto('http://localhost:3000/live/explore', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2200));
  const file1 = path.join(OUTPUT_DIR, '01_mobile_banners_and_rank_door.png');
  await page.screenshot({ path: file1, fullPage: false });
  fs.copyFileSync(file1, path.join(BRAIN_DIR, '01_mobile_banners_and_rank_door.png'));

  // 2. Desktop Banners and Rank Door Section
  console.log('Capturing 02_desktop_banners_and_rank_door.png...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/live/explore', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2200));
  const file2 = path.join(OUTPUT_DIR, '02_desktop_banners_and_rank_door.png');
  await page.screenshot({ path: file2, fullPage: false });
  fs.copyFileSync(file2, path.join(BRAIN_DIR, '02_desktop_banners_and_rank_door.png'));

  // 3. Ranking Hub Page /ranking/host
  console.log('Capturing 03_ranking_hub_page.png...');
  await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/ranking/host', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  const file3 = path.join(OUTPUT_DIR, '03_ranking_hub_page.png');
  await page.screenshot({ path: file3, fullPage: false });
  fs.copyFileSync(file3, path.join(BRAIN_DIR, '03_ranking_hub_page.png'));

  // 4. Ranking Hub Gifts Coming Soon State
  console.log('Capturing 04_ranking_coming_soon.png...');
  await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/ranking/gifts', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  const file4 = path.join(OUTPUT_DIR, '04_ranking_coming_soon.png');
  await page.screenshot({ path: file4, fullPage: false });
  fs.copyFileSync(file4, path.join(BRAIN_DIR, '04_ranking_coming_soon.png'));

  await browser.close();
  console.log('All 4 Prompt 03.5 screenshots captured and saved to brain directory successfully!');
}

capture().catch(err => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
