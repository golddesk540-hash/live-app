const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const ROOM_ID = '7001';
const BRAIN_DIR = 'C:/Users/HP/.gemini/antigravity/brain/d49e7e92-2cbf-4a82-b7ce-920366fb716f';
const ASSETS_DIR = path.resolve(__dirname, 'public/assets/party');

async function captureScreenshots() {
  console.log('Starting screenshot captures for Module 5.5 Audience and Chat...');
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

  // Get consent cookie
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

  // 1. Mobile 1:1 Audience & Chat View matching 05_05_audience_and_chat.png
  await page.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));

  const p1 = path.join(ASSETS_DIR, '01_mobile_audience_and_chat_1to1.png');
  const b1 = path.join(BRAIN_DIR, '01_mobile_audience_and_chat_1to1.png');
  await page.screenshot({ path: p1 });
  fs.copyFileSync(p1, b1);
  console.log('Saved 01_mobile_audience_and_chat_1to1.png');

  // 2. Audience Tab View
  await page.evaluate(() => {
    const tab = document.querySelector('[data-testid="tab-audience"]');
    if (tab) tab.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const p2 = path.join(ASSETS_DIR, '02_mobile_audience_list_tab.png');
  const b2 = path.join(BRAIN_DIR, '02_mobile_audience_list_tab.png');
  await page.screenshot({ path: p2 });
  fs.copyFileSync(p2, b2);
  console.log('Saved 02_mobile_audience_list_tab.png');

  // 3. Switch back to Chat & Send a new message
  await page.evaluate(() => {
    const tab = document.querySelector('[data-testid="tab-chat"]');
    if (tab) tab.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.type('[data-testid="chat-input"]', 'Real-time party vibes! 🎉🔥');
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="chat-send-btn"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  const p3 = path.join(ASSETS_DIR, '03_mobile_new_message_sent.png');
  const b3 = path.join(BRAIN_DIR, '03_mobile_new_message_sent.png');
  await page.screenshot({ path: p3 });
  fs.copyFileSync(p3, b3);
  console.log('Saved 03_mobile_new_message_sent.png');

  // 4. Toggle to 9-Seat Grid
  await page.evaluate(() => {
    const btn = document.querySelector('[data-action="toggle-view-mode"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const p4 = path.join(ASSETS_DIR, '04_mobile_seat_grid_toggle_view.png');
  const b4 = path.join(BRAIN_DIR, '04_mobile_seat_grid_toggle_view.png');
  await page.screenshot({ path: p4 });
  fs.copyFileSync(p4, b4);
  console.log('Saved 04_mobile_seat_grid_toggle_view.png');

  // 5. Desktop Audience & Chat View
  await page.setViewport({ width: 1280, height: 850, isMobile: false });
  await page.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  const p5 = path.join(ASSETS_DIR, '05_desktop_audience_chat_view.png');
  const b5 = path.join(BRAIN_DIR, '05_desktop_audience_chat_view.png');
  await page.screenshot({ path: p5 });
  fs.copyFileSync(p5, b5);
  console.log('Saved 05_desktop_audience_chat_view.png');

  await browser.close();
  console.log('All 5 screenshots captured successfully for Module 5.5!');
}

captureScreenshots().catch(console.error);
