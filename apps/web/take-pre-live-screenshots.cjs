const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, 'public', 'screenshots', 'phase4_02');
const BRAIN_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Authenticating & setting up pre-live conditions...');

  // 1. Consent
  const consentRes = await fetch('http://localhost:3000/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'prelive_shot_anon_' + Date.now(),
    }),
  });
  const termsRaw = consentRes.headers.get('set-cookie')?.split(';')[0];
  const termsValue = termsRaw ? termsRaw.substring('poppo_terms_consent='.length) : '';

  // 2. Login
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

  const setCookies = typeof loginRes.headers.getSetCookie === 'function'
    ? loginRes.headers.getSetCookie()
    : [loginRes.headers.get('set-cookie') || ''];
  let token = '';
  for (const c of setCookies) {
    const m = c.match(/poppo_session=([^;]+)/);
    if (m) token = m[1];
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Cookie: `poppo_terms_consent=${termsValue}; poppo_session=${token}`,
  };

  // Configure user to have 1:1 match with 04_02 reference
  await fetch('http://localhost:3000/api/live/gates/verify-eligibility', {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ wealthLevel: 12 }),
  });
  await fetch('http://localhost:3000/api/live/gates/face-verify', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ imageSnapshot: 'sample' }),
  });

  // Stage setup: title = 'Come and chat with me 💕', category = 'live_chat', cover = sample model
  await fetch('http://localhost:3000/api/live/pre-live/setup', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Come and chat with me 💕',
      categoryId: 'live_chat',
      coverUrl: '/assets/pre-live/sample_cover_model.png',
    }),
  });

  console.log('Launching Edge to capture Module 4.2 Pre-Live screenshots...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  const page = await browser.newPage();

  await page.setCookie(
    { name: 'poppo_terms_consent', value: termsValue, domain: 'localhost', path: '/' },
    { name: 'poppo_session', value: token, domain: 'localhost', path: '/' }
  );

  // Screenshot 1: Mobile Pre-Live Screen (1:1 with 04_02_pre_live_title_category.png)
  console.log('Capturing Screenshot 1: Mobile Pre-Live Screen (1:1 Match)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/live/setup/pre-live', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  const shot1 = path.join(OUTPUT_DIR, '01_mobile_pre_live_screen_1to1.png');
  await page.screenshot({ path: shot1, fullPage: false });
  fs.copyFileSync(shot1, path.join(BRAIN_DIR, '01_mobile_pre_live_screen_1to1.png'));
  console.log('Saved Screenshot 1.');

  // Screenshot 2: Category Selector Drawer
  console.log('Capturing Screenshot 2: Category Selector Drawer...');
  const categoryCard = await page.$('div[role="button"]:last-of-type');
  if (categoryCard) {
    await categoryCard.click();
    await new Promise(r => setTimeout(r, 800));
  }
  const shot2 = path.join(OUTPUT_DIR, '02_mobile_pre_live_category_drawer.png');
  await page.screenshot({ path: shot2, fullPage: false });
  fs.copyFileSync(shot2, path.join(BRAIN_DIR, '02_mobile_pre_live_category_drawer.png'));
  console.log('Saved Screenshot 2.');

  // Close drawer
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 500));

  // Screenshot 3: Edit Cover Modal
  console.log('Capturing Screenshot 3: Edit Cover Modal...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const editBtn = buttons.find(b => b.textContent && b.textContent.includes('Edit Cover'));
    if (editBtn) editBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  const shot3 = path.join(OUTPUT_DIR, '03_mobile_pre_live_cover_edit_modal.png');
  await page.screenshot({ path: shot3, fullPage: false });
  fs.copyFileSync(shot3, path.join(BRAIN_DIR, '03_mobile_pre_live_cover_edit_modal.png'));
  console.log('Saved Screenshot 3.');

  // Screenshot 4: Desktop View
  console.log('Capturing Screenshot 4: Desktop Pre-Live Setup...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:3000/live/setup/pre-live', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  const shot4 = path.join(OUTPUT_DIR, '04_desktop_pre_live_setup.png');
  await page.screenshot({ path: shot4, fullPage: false });
  fs.copyFileSync(shot4, path.join(BRAIN_DIR, '04_desktop_pre_live_setup.png'));
  console.log('Saved Screenshot 4.');

  await browser.close();
  console.log('All 4 Phase 4 Module 4.2 screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
