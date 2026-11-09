const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, 'public', 'screenshots', 'phase4_01');
const BRAIN_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Authenticating & setting up conditions for Go-Live Gates screenshots...');

  // 1. Accept terms
  const consentRes = await fetch('http://localhost:3000/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'gates_shot_anon_' + Date.now(),
    }),
  });
  const termsRaw = consentRes.headers.get('set-cookie')?.split(';')[0];
  const termsValue = termsRaw ? termsRaw.substring('poppo_terms_consent='.length) : '';

  // 2. Login as broadcaster (sara.streamer@popolive.com)
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
  console.log('Login status:', loginRes.status, 'Session token obtained:', token ? `${token.substring(0, 10)}...` : 'NONE');

  const authHeaders = {
    'Content-Type': 'application/json',
    Cookie: `poppo_terms_consent=${termsValue}; poppo_session=${token}`,
  };

  // Configure user to have ALL 3 GATES PASSED (1:1 with 04_01_go_live_gates.png)
  await fetch('http://localhost:3000/api/live/gates/face-verify', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ imageSnapshot: 'data:image/jpeg;base64,sample' }),
  });

  await fetch('http://localhost:3000/api/live/gates/cover-upload', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
    }),
  });

  await fetch('http://localhost:3000/api/live/gates/verify-eligibility', {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ wealthLevel: 12 }),
  });

  console.log('Launching Edge to capture Phase 4 Module 4.1 Go-Live Gates screenshots...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  const page = await browser.newPage();

  // Set cookies for authentication
  await page.setCookie(
    { name: 'poppo_terms_consent', value: termsValue, domain: 'localhost', path: '/' },
    { name: 'poppo_session', value: token, domain: 'localhost', path: '/' }
  );

  // Screenshot 1: Mobile Go-Live Gates (1:1 Reference Match - All Gates Passed)
  console.log('Capturing Screenshot 1: Mobile Go-Live Gates (1:1 Match)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/live/setup', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  const shot1 = path.join(OUTPUT_DIR, '01_mobile_go_live_gates_all_passed.png');
  await page.screenshot({ path: shot1, fullPage: false });
  fs.copyFileSync(shot1, path.join(BRAIN_DIR, '01_mobile_go_live_gates_all_passed.png'));
  console.log('Saved Screenshot 1.');

  // Screenshot 2: Open Face Verification Biometric Modal
  console.log('Capturing Screenshot 2: Face Check Biometric Modal...');
  const faceCard = await page.$('div[role="button"]:first-of-type');
  if (faceCard) {
    await faceCard.click();
    await new Promise(r => setTimeout(r, 800));
  }
  const shot2 = path.join(OUTPUT_DIR, '02_face_check_biometric_modal.png');
  await page.screenshot({ path: shot2, fullPage: false });
  fs.copyFileSync(shot2, path.join(BRAIN_DIR, '02_face_check_biometric_modal.png'));
  console.log('Saved Screenshot 2.');

  // Close modal
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 500));

  // Screenshot 3: Mobile View with Level < 5 Incomplete State
  console.log('Setting wealthLevel = 1 to capture Incomplete / Locked Gate state...');
  await fetch('http://localhost:3000/api/live/gates/verify-eligibility', {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ wealthLevel: 1 }),
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  const shot3 = path.join(OUTPUT_DIR, '03_mobile_go_live_gates_incomplete.png');
  await page.screenshot({ path: shot3, fullPage: false });
  fs.copyFileSync(shot3, path.join(BRAIN_DIR, '03_mobile_go_live_gates_incomplete.png'));
  console.log('Saved Screenshot 3.');

  // Reset back to Level 12 for clean state
  await fetch('http://localhost:3000/api/live/gates/verify-eligibility', {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ wealthLevel: 12 }),
  });

  // Screenshot 4: Desktop View
  console.log('Capturing Screenshot 4: Desktop View of Go-Live Setup...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:3000/live/setup', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  const shot4 = path.join(OUTPUT_DIR, '04_desktop_go_live_setup.png');
  await page.screenshot({ path: shot4, fullPage: false });
  fs.copyFileSync(shot4, path.join(BRAIN_DIR, '04_desktop_go_live_setup.png'));
  console.log('Saved Screenshot 4.');

  await browser.close();
  console.log('All 4 Phase 4 Module 4.1 screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
