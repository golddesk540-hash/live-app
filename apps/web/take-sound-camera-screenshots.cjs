const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const ROOM_ID = '7001';
const BRAIN_DIR = 'C:/Users/HP/.gemini/antigravity/brain/d49e7e92-2cbf-4a82-b7ce-920366fb716f';
const ASSETS_DIR = path.resolve(__dirname, 'public/assets/party');

async function captureScreenshots() {
  console.log('Starting screenshot captures for Module 5.4 Sound and Camera on a Seat...');
  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=412,915'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('poppo_terms_consent_status', 'accepted');
    localStorage.setItem('poppo_terms_consent_version', 'v4.2.0');
  });

  // Get valid signed cryptographic consent cookie
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
  const setCookieHeader = consentRes.headers.get('set-cookie') || '';
  const tokenMatch = setCookieHeader.match(/poppo_terms_consent=([^;]+)/);
  const cookieValue = tokenMatch ? tokenMatch[1] : '';

  await page.setCookie({
    name: 'poppo_terms_consent',
    value: cookieValue,
    domain: 'localhost',
    path: '/',
  });

  // Ensure Seat 2 is unmuted initially
  await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/media/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatNumber: 2, type: 'mic', enabled: true }),
  });
  await fetch(`${BASE_URL}/api/party/${ROOM_ID}/seats/media/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatNumber: 2, type: 'camera', enabled: true }),
  });

  // 1. Mobile 1:1 Sound & Camera View
  await page.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));

  const p1 = path.join(ASSETS_DIR, '01_mobile_sound_camera_1to1.png');
  const b1 = path.join(BRAIN_DIR, '01_mobile_sound_camera_1to1.png');
  await page.screenshot({ path: p1 });
  fs.copyFileSync(p1, b1);
  console.log('Saved 01_mobile_sound_camera_1to1.png');

  // 2. Close-up on 9-Seat Grid with Camera feeds
  const gridEl = await page.$('[data-testid="nine-seat-grid"]');
  if (gridEl) {
    const p2 = path.join(ASSETS_DIR, '02_mobile_camera_on_seat_view.png');
    const b2 = path.join(BRAIN_DIR, '02_mobile_camera_on_seat_view.png');
    await gridEl.screenshot({ path: p2 });
    fs.copyFileSync(p2, b2);
    console.log('Saved 02_mobile_camera_on_seat_view.png');
  }

  // 3. Open Seat 2 Host Moderation Drawer
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="seat-2-occupied"]');
    if (el) el.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const p3 = path.join(ASSETS_DIR, '03_mobile_host_moderation_drawer.png');
  const b3 = path.join(BRAIN_DIR, '03_mobile_host_moderation_drawer.png');
  await page.screenshot({ path: p3 });
  fs.copyFileSync(p3, b3);
  console.log('Saved 03_mobile_host_moderation_drawer.png');

  // 4. Click Host Mute button
  await page.evaluate(() => {
    const btn = document.querySelector('[data-action="host-mute"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const p4 = path.join(ASSETS_DIR, '04_mobile_mic_muted_state.png');
  const b4 = path.join(BRAIN_DIR, '04_mobile_mic_muted_state.png');
  await page.screenshot({ path: p4 });
  fs.copyFileSync(p4, b4);
  console.log('Saved 04_mobile_mic_muted_state.png');

  // 5. Desktop Sound & Camera View
  await page.setViewport({ width: 1280, height: 850, isMobile: false });
  await page.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  const p5 = path.join(ASSETS_DIR, '05_desktop_sound_camera_view.png');
  const b5 = path.join(BRAIN_DIR, '05_desktop_sound_camera_view.png');
  await page.screenshot({ path: p5 });
  fs.copyFileSync(p5, b5);
  console.log('Saved 05_desktop_sound_camera_view.png');

  await browser.close();
  console.log('All 5 screenshots captured successfully!');
}

captureScreenshots().catch(console.error);
