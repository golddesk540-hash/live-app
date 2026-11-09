const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const ROOM_ID = '7001';
const BRAIN_DIR = 'C:/Users/HP/.gemini/antigravity/brain/d49e7e92-2cbf-4a82-b7ce-920366fb716f';
const ASSETS_DIR = path.resolve(__dirname, 'public/assets/party');

async function captureScreenshots() {
  console.log('Starting screenshot captures for Module 5.9 Limits that Protect the Room...');
  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('poppo_terms_consent_status', 'accepted');
    localStorage.setItem('poppo_terms_consent_version', 'v4.2.0');
  });

  // Set consent cookie
  try {
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
    const cookieHeader = consentRes.headers.get('set-cookie');
    if (cookieHeader) {
      const parts = cookieHeader.split(';')[0].split('=');
      await page.setCookie({
        name: parts[0].trim(),
        value: parts[1].trim(),
        domain: 'localhost',
        path: '/',
      });
    }
  } catch (e) {}

  // -------------------------------------------------------------------------
  // 1. Mobile 1:1 Match (05_09_limits_that_protect_the_room.png Reference)
  // -------------------------------------------------------------------------
  console.log('Capturing 01_mobile_room_limits_1to1.png...');
  await page.goto(`${BASE_URL}/party/limits?preview=demo&roomId=${ROOM_ID}`, {
    waitUntil: 'networkidle2',
  });
  await new Promise((r) => setTimeout(r, 600));

  const screen1 = await page.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(BRAIN_DIR, '01_mobile_room_limits_1to1.png'), screen1);
  fs.writeFileSync(path.join(ASSETS_DIR, '01_mobile_room_limits_1to1.png'), screen1);
  console.log('  Saved 01_mobile_room_limits_1to1.png');

  // -------------------------------------------------------------------------
  // 2. Mobile Max Seats Dropdown Open (9 3x3, 6 2x3, 4 2x2)
  // -------------------------------------------------------------------------
  console.log('Capturing 02_mobile_max_seats_dropdown_open.png...');
  await page.evaluate(() => {
    const btn = document.querySelector('[data-action="toggle-seats-dropdown"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const screen2 = await page.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(BRAIN_DIR, '02_mobile_max_seats_dropdown_open.png'), screen2);
  fs.writeFileSync(path.join(ASSETS_DIR, '02_mobile_max_seats_dropdown_open.png'), screen2);
  console.log('  Saved 02_mobile_max_seats_dropdown_open.png');

  // -------------------------------------------------------------------------
  // 3. Mobile Audience Limit Dropdown Open (200, 500, 1000, 2000, 5000)
  // -------------------------------------------------------------------------
  console.log('Capturing 03_mobile_audience_limit_dropdown_open.png...');
  // Close seats dropdown and open audience dropdown
  await page.evaluate(() => {
    const audBtn = document.querySelector('[data-action="toggle-audience-dropdown"]');
    if (audBtn) audBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const screen3 = await page.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(BRAIN_DIR, '03_mobile_audience_limit_dropdown_open.png'), screen3);
  fs.writeFileSync(path.join(ASSETS_DIR, '03_mobile_audience_limit_dropdown_open.png'), screen3);
  console.log('  Saved 03_mobile_audience_limit_dropdown_open.png');

  // -------------------------------------------------------------------------
  // 4. Mobile Interactive Toggles (Lock Room / Invite Only with Toast)
  // -------------------------------------------------------------------------
  console.log('Capturing 04_mobile_room_limits_toggles_interactive.png...');
  // Close dropdown by picking 1000
  await page.evaluate(() => {
    const opt = document.querySelector('[data-testid="option-audience-1000"]');
    if (opt) opt.click();
  });
  await new Promise((r) => setTimeout(r, 300));

  // Toggle Invite Only
  await page.evaluate(() => {
    const toggle = document.querySelector('[data-action="toggle-invite-only"]');
    if (toggle) toggle.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  const screen4 = await page.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(BRAIN_DIR, '04_mobile_room_limits_toggles_interactive.png'), screen4);
  fs.writeFileSync(path.join(ASSETS_DIR, '04_mobile_room_limits_toggles_interactive.png'), screen4);
  console.log('  Saved 04_mobile_room_limits_toggles_interactive.png');

  // Reset Invite Only to OFF to match canonical reference
  await page.evaluate(() => {
    const toggle = document.querySelector('[data-action="toggle-invite-only"]');
    if (toggle) toggle.click();
  });
  await new Promise((r) => setTimeout(r, 300));

  // -------------------------------------------------------------------------
  // 5. Desktop Party Room with Room Limits Modal Open
  // -------------------------------------------------------------------------
  console.log('Capturing 05_desktop_party_room_limits_modal.png...');
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1280, height: 800 });

  await desktopPage.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, {
    waitUntil: 'networkidle2',
  });
  await new Promise((r) => setTimeout(r, 600));

  // Open Limits modal via header limits button
  await desktopPage.evaluate(() => {
    const btn = document.querySelector('[data-action="open-room-limits"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  const screen5 = await desktopPage.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(BRAIN_DIR, '05_desktop_party_room_limits_modal.png'), screen5);
  fs.writeFileSync(path.join(ASSETS_DIR, '05_desktop_party_room_limits_modal.png'), screen5);
  console.log('  Saved 05_desktop_party_room_limits_modal.png');

  await browser.close();
  console.log('All 5 Module 5.9 screenshots captured successfully!');
}

captureScreenshots().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
