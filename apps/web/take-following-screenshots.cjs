const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, 'public', 'screenshots', 'phase3_08');
const BRAIN_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Authenticating & getting consent cookie for following screenshots...');

  // Accept terms to get valid consent cookie
  const consentRes = await fetch('http://localhost:3000/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'following_shot_anon_' + Date.now(),
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

  console.log('Launching headless browser to capture Prompt 03.8 Following screenshots...');
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

  // 1. Mobile Following Screen (Exact 1:1 pixel match to 03_08_following.png)
  console.log('Capturing 01_mobile_following_screen.png...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  await page.goto('http://localhost:3000/live/following', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  const shot1 = path.join(OUTPUT_DIR, '01_mobile_following_screen.png');
  await page.screenshot({ path: shot1, fullPage: false });
  fs.copyFileSync(shot1, path.join(BRAIN_DIR, '01_mobile_following_screen.png'));
  console.log('Saved:', shot1);

  // 2. Bell Notification Toggle Interaction
  console.log('Capturing 03_bell_notification_toggle.png (clicking bell icon)...');
  try {
    const bellBtn = await page.$('button[aria-label="Disable live alerts"], button[title*="notifications"]');
    if (bellBtn) {
      await bellBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }
  } catch (err) {
    console.warn('Could not click bell icon:', err.message);
  }
  const shot3 = path.join(OUTPUT_DIR, '03_bell_notification_toggle.png');
  await page.screenshot({ path: shot3, fullPage: false });
  fs.copyFileSync(shot3, path.join(BRAIN_DIR, '03_bell_notification_toggle.png'));
  console.log('Saved:', shot3);

  // 3. Desktop Following Screen
  console.log('Capturing 02_desktop_following_screen.png...');
  await page.setViewport({ width: 1440, height: 900, isMobile: false, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/live/following', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  const shot2 = path.join(OUTPUT_DIR, '02_desktop_following_screen.png');
  await page.screenshot({ path: shot2, fullPage: false });
  fs.copyFileSync(shot2, path.join(BRAIN_DIR, '02_desktop_following_screen.png'));
  console.log('Saved:', shot2);

  await browser.close();
  console.log('All Following screenshots captured and synced successfully! 🎉');
}

capture().catch(err => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
