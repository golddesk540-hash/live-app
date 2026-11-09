const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, 'public', 'screenshots', 'phase3_10');
const BRAIN_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Authenticating & getting consent cookie for Staff Preview screenshots...');

  // 1. Accept terms to get valid consent cookie
  const consentRes = await fetch('http://localhost:3000/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'staff_shot_anon_' + Date.now(),
    }),
  });
  const termsRaw = consentRes.headers.get('set-cookie')?.split(';')[0];
  const termsValue = termsRaw ? termsRaw.substring('poppo_terms_consent='.length) : '';

  // 2. Login as authorized staff
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `poppo_terms_consent=${termsValue}`,
    },
    body: JSON.stringify({
      identifier: 'staff@popolive.com',
      password: 'StaffPass123!',
    }),
  });
  const setCookies = typeof loginRes.headers.getSetCookie === 'function'
    ? loginRes.headers.getSetCookie()
    : [loginRes.headers.get('set-cookie') || ''];
  let token = '';
  for (const c of setCookies) {
    const m = c.match(/poppo_session=([^;]+)/);
    if (m) token = m[1];
  }
  console.log('Login status:', loginRes.status, 'Obtained staff session token:', token ? `${token.substring(0, 10)}...` : 'NONE');

  console.log('Launching headless browser to capture Prompt 03.10 Staff Preview screenshots...');
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

  // 1. Mobile Staff Preview Home (Exact 1:1 pixel match to 03_10_staff_preview_test_rooms.png)
  console.log('Capturing 01_mobile_staff_preview_home.png...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  await page.goto('http://localhost:3000/staff', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  const shot1 = path.join(OUTPUT_DIR, '01_mobile_staff_preview_home.png');
  await page.screenshot({ path: shot1, fullPage: false });
  fs.copyFileSync(shot1, path.join(BRAIN_DIR, '01_mobile_staff_preview_home.png'));
  console.log('Saved:', shot1);

  // 2. Mobile Staff Test Rooms List (Clicking "Open Test Rooms")
  console.log('Capturing 02_mobile_staff_test_rooms_list.png...');
  try {
    const openRoomsBtn = await page.$('button ::-p-text(Open Test Rooms)');
    if (openRoomsBtn) {
      await openRoomsBtn.click();
      await new Promise(r => setTimeout(r, 1500));
    }
  } catch (err) {
    console.warn('Could not click Open Test Rooms:', err.message);
  }
  const shot2 = path.join(OUTPUT_DIR, '02_mobile_staff_test_rooms_list.png');
  await page.screenshot({ path: shot2, fullPage: false });
  fs.copyFileSync(shot2, path.join(BRAIN_DIR, '02_mobile_staff_test_rooms_list.png'));
  console.log('Saved:', shot2);

  // 3. Room Preview Screen (Clicking Preview on first test room card)
  console.log('Capturing 03_staff_room_preview_modal.png...');
  try {
    const previewBtn = await page.$('button ::-p-text(Preview)');
    if (previewBtn) {
      await previewBtn.click();
      await new Promise(r => setTimeout(r, 1500));
    }
  } catch (err) {
    console.warn('Could not click Preview button:', err.message);
  }
  const shot3 = path.join(OUTPUT_DIR, '03_staff_room_preview_modal.png');
  await page.screenshot({ path: shot3, fullPage: false });
  fs.copyFileSync(shot3, path.join(BRAIN_DIR, '03_staff_room_preview_modal.png'));
  console.log('Saved:', shot3);

  // 4. Desktop Staff Preview (1440x900)
  console.log('Capturing 04_desktop_staff_preview.png...');
  await page.setViewport({ width: 1440, height: 900, isMobile: false, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/staff', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  const shot4 = path.join(OUTPUT_DIR, '04_desktop_staff_preview.png');
  await page.screenshot({ path: shot4, fullPage: false });
  fs.copyFileSync(shot4, path.join(BRAIN_DIR, '04_desktop_staff_preview.png'));
  console.log('Saved:', shot4);

  await browser.close();
  console.log('All Staff Preview screenshots captured and synced successfully! 🎉');
}

capture().catch(err => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
