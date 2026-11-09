const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const ROOM_ID = '7001';

const ARTIFACT_DIR = path.resolve('C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f');
const PUBLIC_DIR = path.resolve(__dirname, 'public', 'assets', 'party');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

async function capture() {
  console.log('Starting Taking a Seat (Module 5.3) screenshot capture...');

  // Ensure demo request exists in DB for visual recreation of 05_03
  try {
    await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/request?preview=demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seatNumber: 2,
        userId: 'user_kenji_7001',
        userName: 'Kenji R',
        userAvatar: '/assets/studio/user_avatar_1.png',
        preview: 'demo',
      }),
    });
  } catch {}

  // Obtain official consent token
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
  const rawCookie = consentRes.headers.get('set-cookie') || '';
  const token = rawCookie.split(';')[0]?.split('=')[1] || '';

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  if (token) {
    await page.setCookie({
      name: 'poppo_terms_consent',
      value: token,
      domain: 'localhost',
      path: '/',
    });
  }

  async function saveShot(filename) {
    const pubPath = path.join(PUBLIC_DIR, filename);
    const brainPath = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: pubPath, fullPage: false });
    fs.copyFileSync(pubPath, brainPath);
    console.log(`Saved screenshot: ${filename}`);
  }

  try {
    // 1. MOBILE 1:1 TAKING A SEAT (390 x 844 iPhone 14) matching 05_03_taking_a_seat_request_invite.png
    console.log('1. Capturing Mobile 1:1 Taking a Seat matching 05_03...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1200));
    await saveShot('01_mobile_taking_seat_1to1.png');

    // 2. MOBILE REQUEST SEAT DRAWER (Tapping Seat 3)
    console.log('2. Opening Request Seat drawer for Seat 3...');
    await page.click('[data-testid="seat-3-empty"]');
    await new Promise((r) => setTimeout(r, 600));
    await saveShot('02_mobile_request_seat_drawer.png');

    // Close modal
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 400));

    // 3. MOBILE INVITE AUDIENCE TAB
    console.log('3. Switching to Invite Audience tab...');
    await page.click('[data-action="tab-invite"]');
    await new Promise((r) => setTimeout(r, 600));
    await saveShot('03_mobile_invite_audience_tab.png');

    // Switch back to requests tab and accept Kenji R's request
    console.log('4. Accepting seat request and capturing occupied grid...');
    await page.click('[data-action="tab-requests"]');
    await new Promise((r) => setTimeout(r, 400));
    const acceptBtn = await page.$('[data-action="accept-request"]');
    if (acceptBtn) {
      await acceptBtn.click();
      await new Promise((r) => setTimeout(r, 1200));
    }
    await saveShot('04_mobile_seat_request_accepted.png');

    // Clean up Seat 2
    try {
      await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/vacate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatNumber: 2, preview: true, isHostAction: true }),
      });
    } catch {}

    // 5. DESKTOP VIEW (1440 x 900)
    console.log('5. Capturing Desktop responsive view...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1200));
    await saveShot('05_desktop_taking_seat_view.png');

    console.log('All 5 screenshots captured successfully!');
  } catch (err) {
    console.error('Screenshot capture error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

capture().catch((err) => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
