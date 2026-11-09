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
  console.log('Starting Seat Grid (Module 5.2) screenshot capture...');

  // Obtain official consent token to bypass compliance gate
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
    // 1. MOBILE 1:1 SEAT GRID (390 x 844 iPhone 14) matching 05_02_seat_grid.png
    console.log('1. Capturing Mobile 1:1 Seat Grid matching 05_02...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1200));
    await saveShot('01_mobile_seat_grid_1to1.png');

    // 2. MOBILE WITH SEAT MODAL OPEN (Tapping Seat 3)
    console.log('2. Opening Seat 3 takeover drawer...');
    await page.click('[data-testid="seat-3-empty"]');
    await new Promise((r) => setTimeout(r, 600));
    await saveShot('02_mobile_seat_grid_modal_open.png');

    // 3. MOBILE WITH OCCUPIED SEATS
    console.log('3. Occupying Seat 3 and Seat 5 for visual variety...');
    await page.click('[data-action="confirm-take-seat"]');
    await new Promise((r) => setTimeout(r, 1200));

    // Occupy Seat 5 as well
    await page.click('[data-testid="seat-5-empty"]');
    await new Promise((r) => setTimeout(r, 600));
    await page.click('[data-action="confirm-take-seat"]');
    await new Promise((r) => setTimeout(r, 1200));
    await saveShot('03_mobile_seat_grid_occupied_seats.png');

    // 4. MOBILE CONTROLS ACTIVE (Mic toggled, reaction toast)
    console.log('4. Triggering bottom controls...');
    await page.click('[data-testid="control-mic"]');
    await new Promise((r) => setTimeout(r, 400));
    await page.click('[data-testid="control-emotes"]');
    await new Promise((r) => setTimeout(r, 500));
    await saveShot('04_mobile_seat_grid_controls_active.png');

    // Clean up occupied seats 3 and 5 so room is reset
    try {
      await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/vacate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatNumber: 3, preview: true, isHostAction: true }),
      });
      await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/vacate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatNumber: 5, preview: true, isHostAction: true }),
      });
    } catch {}

    // 5. DESKTOP VIEW (1440 x 900)
    console.log('5. Capturing Desktop responsive view...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1200));
    await saveShot('05_desktop_seat_grid_view.png');

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
