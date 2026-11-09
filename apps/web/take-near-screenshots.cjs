const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, 'public', 'screenshots', 'phase3_09');
const BRAIN_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Authenticating & getting consent cookie for Near screenshots...');

  // Accept terms to get valid consent cookie
  const consentRes = await fetch('http://localhost:3000/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'near_shot_anon_' + Date.now(),
    }),
  });
  const termsRaw = consentRes.headers.get('set-cookie')?.split(';')[0];
  const termsValue = termsRaw ? termsRaw.substring('poppo_terms_consent='.length) : '';

  console.log('Launching headless browser to capture Prompt 03.9 Near screenshots...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  const page = await browser.newPage();

  await page.setCookie(
    { name: 'poppo_terms_consent', value: termsValue, domain: 'localhost', path: '/' }
  );

  // 1. Mobile Near Screen (Exact 1:1 pixel match to 03_09_near_default_off.png)
  console.log('Capturing 01_mobile_near_screen.png...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  await page.goto('http://localhost:3000/live/near', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  const shot1 = path.join(OUTPUT_DIR, '01_mobile_near_screen.png');
  await page.screenshot({ path: shot1, fullPage: false });
  fs.copyFileSync(shot1, path.join(BRAIN_DIR, '01_mobile_near_screen.png'));
  console.log('Saved:', shot1);

  // 2. Desktop Near Screen (Discovery shell with Near selected)
  console.log('Capturing 02_desktop_near_screen.png...');
  await page.setViewport({ width: 1440, height: 900, isMobile: false, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/live/near', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  const shot2 = path.join(OUTPUT_DIR, '02_desktop_near_screen.png');
  await page.screenshot({ path: shot2, fullPage: false });
  fs.copyFileSync(shot2, path.join(BRAIN_DIR, '02_desktop_near_screen.png'));
  console.log('Saved:', shot2);

  // 3. Direct route /near
  console.log('Capturing 03_direct_near_route.png...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  await page.goto('http://localhost:3000/near', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));
  const shot3 = path.join(OUTPUT_DIR, '03_direct_near_route.png');
  await page.screenshot({ path: shot3, fullPage: false });
  fs.copyFileSync(shot3, path.join(BRAIN_DIR, '03_direct_near_route.png'));
  console.log('Saved:', shot3);

  await browser.close();
  console.log('All Near screenshots captured and synced successfully! 🎉');
}

capture().catch(err => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
