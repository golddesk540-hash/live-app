const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, 'public', 'screenshots', 'phase4_04');
const BRAIN_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Authenticating & setting up viewer room conditions...');

  // 1. Consent
  const consentRes = await fetch('http://localhost:3000/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'viewer_shot_anon_' + Date.now(),
    }),
  });
  const termsRaw = consentRes.headers.get('set-cookie')?.split(';')[0];
  const termsValue = termsRaw ? termsRaw.substring('poppo_terms_consent='.length) : 'accepted';

  // 2. Login as viewer
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `poppo_terms_consent=${termsValue}`,
    },
    body: JSON.stringify({
      email: 'sara.streamer@popolive.com',
      password: 'DemoPass123!',
    }),
  });
  const sessionRaw = loginRes.headers.get('set-cookie')?.split(';')[0];
  const sessionValue = sessionRaw ? sessionRaw.substring('poppo_session='.length) : '';

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setCookie(
    { name: 'poppo_terms_consent', value: termsValue, domain: 'localhost' },
    { name: 'poppo_session', value: sessionValue, domain: 'localhost' }
  );

  // 1. Mobile 1:1 Reference Match (390 x 844)
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/live/room/880219?preview=demo', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));

  const shot1 = path.join(OUTPUT_DIR, '01_mobile_viewer_room_1to1.png');
  await page.screenshot({ path: shot1 });
  fs.copyFileSync(shot1, path.join(BRAIN_DIR, '01_mobile_viewer_room_1to1.png'));
  console.log('Saved 01_mobile_viewer_room_1to1.png');

  // 2. Following Host State
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Follow'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  const shot2 = path.join(OUTPUT_DIR, '02_mobile_viewer_room_following.png');
  await page.screenshot({ path: shot2 });
  fs.copyFileSync(shot2, path.join(BRAIN_DIR, '02_mobile_viewer_room_following.png'));
  console.log('Saved 02_mobile_viewer_room_following.png');

  // 3. Chat Active with Reaction
  await page.type('input[placeholder*="Say something"]', 'You are amazing Zara! ❤️');
  await page.keyboard.press('Enter');
  await page.evaluate(() => {
    const giftBtn = document.querySelector('button[title*="Gift"]');
    if (giftBtn) giftBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  const shot3 = path.join(OUTPUT_DIR, '03_mobile_viewer_room_chat_active.png');
  await page.screenshot({ path: shot3 });
  fs.copyFileSync(shot3, path.join(BRAIN_DIR, '03_mobile_viewer_room_chat_active.png'));
  console.log('Saved 03_mobile_viewer_room_chat_active.png');

  // 4. Stream Info Popover
  await page.evaluate(() => {
    const infoBtn = document.querySelector('div[title*="Viewer Count"]');
    if (infoBtn) infoBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  const shot4 = path.join(OUTPUT_DIR, '04_mobile_viewer_room_stream_info.png');
  await page.screenshot({ path: shot4 });
  fs.copyFileSync(shot4, path.join(BRAIN_DIR, '04_mobile_viewer_room_stream_info.png'));
  console.log('Saved 04_mobile_viewer_room_stream_info.png');

  // 5. Desktop Studio View (1280 x 900)
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://localhost:3000/live/room/880219?preview=demo', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));
  const shot5 = path.join(OUTPUT_DIR, '05_desktop_viewer_room_view.png');
  await page.screenshot({ path: shot5 });
  fs.copyFileSync(shot5, path.join(BRAIN_DIR, '05_desktop_viewer_room_view.png'));
  console.log('Saved 05_desktop_viewer_room_view.png');

  await browser.close();
  console.log('All 5 screenshots captured and mirrored to brain successfully!');
}

capture().catch((e) => {
  console.error(e);
  process.exit(1);
});
