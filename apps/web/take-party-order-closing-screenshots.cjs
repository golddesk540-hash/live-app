const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const ROOM_ID = '7001';
const BRAIN_DIR = 'C:/Users/HP/.gemini/antigravity/brain/d49e7e92-2cbf-4a82-b7ce-920366fb716f';
const ASSETS_DIR = path.resolve(__dirname, 'public/assets/party');

async function captureScreenshots() {
  console.log('Starting screenshot captures for Module 5.8 Order and Closing...');
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
  // 1. Mobile 1:1 Match (05_08_order_and_closing.png Reference)
  // -------------------------------------------------------------------------
  console.log('Capturing 01_mobile_order_and_closing_1to1.png...');
  await page.goto(`${BASE_URL}/party/order-closing?preview=demo&roomId=${ROOM_ID}`, {
    waitUntil: 'networkidle2',
  });
  await new Promise((r) => setTimeout(r, 600));

  const screen1 = await page.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(BRAIN_DIR, '01_mobile_order_and_closing_1to1.png'), screen1);
  fs.writeFileSync(path.join(ASSETS_DIR, '01_mobile_order_and_closing_1to1.png'), screen1);
  console.log('  Saved 01_mobile_order_and_closing_1to1.png');

  // -------------------------------------------------------------------------
  // 2. Mobile Seat Order Reordering View (Seats 1-9, Host Protected, Swap Selection)
  // -------------------------------------------------------------------------
  console.log('Capturing 02_mobile_seat_order_reorder_view.png...');
  await page.evaluate(() => {
    const row = document.querySelector('[data-action="open-seat-order"]');
    if (row) row.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // Select Seat 2 as source
  await page.evaluate(() => {
    const seat2 = document.querySelector('[data-testid="seat-order-item-2"]');
    if (seat2) seat2.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const screen2 = await page.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(BRAIN_DIR, '02_mobile_seat_order_reorder_view.png'), screen2);
  fs.writeFileSync(path.join(ASSETS_DIR, '02_mobile_seat_order_reorder_view.png'), screen2);
  console.log('  Saved 02_mobile_seat_order_reorder_view.png');

  // -------------------------------------------------------------------------
  // 3. Mobile Close Party Confirmation Modal ("End Party?" Warning Dialog)
  // -------------------------------------------------------------------------
  console.log('Capturing 03_mobile_close_party_confirmation_modal.png...');
  // Go back to menu
  await page.evaluate(() => {
    const backBtn = document.querySelector('[data-action="order-back-to-menu"]');
    if (backBtn) backBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // Open Close Party confirmation
  await page.evaluate(() => {
    const closeRow = document.querySelector('[data-action="open-close-party"]');
    if (closeRow) closeRow.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const screen3 = await page.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(BRAIN_DIR, '03_mobile_close_party_confirmation_modal.png'), screen3);
  fs.writeFileSync(path.join(ASSETS_DIR, '03_mobile_close_party_confirmation_modal.png'), screen3);
  console.log('  Saved 03_mobile_close_party_confirmation_modal.png');

  // -------------------------------------------------------------------------
  // 4. Mobile Post-Close Summary View ("Party Ended" with stats)
  // -------------------------------------------------------------------------
  console.log('Capturing 04_mobile_party_ended_summary_view.png...');
  // Click End Party Now
  await page.evaluate(() => {
    const confirmBtn = document.querySelector('[data-action="confirm-close-party"]');
    if (confirmBtn) confirmBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const screen4 = await page.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(BRAIN_DIR, '04_mobile_party_ended_summary_view.png'), screen4);
  fs.writeFileSync(path.join(ASSETS_DIR, '04_mobile_party_ended_summary_view.png'), screen4);
  console.log('  Saved 04_mobile_party_ended_summary_view.png');

  // -------------------------------------------------------------------------
  // 5. Desktop Party Room with Room Controls In-Room Modal
  // -------------------------------------------------------------------------
  console.log('Capturing 05_desktop_party_room_room_controls.png...');
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1280, height: 800 });

  await desktopPage.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, {
    waitUntil: 'networkidle2',
  });
  await new Promise((r) => setTimeout(r, 600));

  // Open Room Controls modal via header controls button
  await desktopPage.evaluate(() => {
    const btn = document.querySelector('[data-action="open-room-controls"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  const screen5 = await desktopPage.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(BRAIN_DIR, '05_desktop_party_room_room_controls.png'), screen5);
  fs.writeFileSync(path.join(ASSETS_DIR, '05_desktop_party_room_room_controls.png'), screen5);
  console.log('  Saved 05_desktop_party_room_room_controls.png');

  await browser.close();
  console.log('All 5 Module 5.8 screenshots captured successfully!');
}

captureScreenshots().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
