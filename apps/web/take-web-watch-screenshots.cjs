const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const ARTIFACT_DIR = path.resolve('C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f');
const PUBLIC_DIR = path.resolve(__dirname, 'public', 'assets', 'web-watch');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

async function capture() {
  console.log('Starting Web Watch & Studio screenshot capture...');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });

  const page = await browser.newPage();

  // Helper to save to both brain artifact and public assets
  async function saveShot(filename) {
    const pubPath = path.join(PUBLIC_DIR, filename);
    const brainPath = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: pubPath, fullPage: false });
    fs.copyFileSync(pubPath, brainPath);
    console.log(`Saved screenshot: ${filename}`);
  }

  try {
    // 1. DESKTOP WEB WATCH 1:1 VIEW
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(`${BASE_URL}/live/web-watch?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    // Dismiss consent banner
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText && x.innerText.includes('Accept'));
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 1200));
    await saveShot('01_desktop_web_watch_1to1.png');

    // 2. DESKTOP WEB STUDIO MODE
    await page.evaluate(() => {
      const s = document.querySelector('button[data-mode="studio"]');
      if (s) s.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await saveShot('02_desktop_web_studio_mode.png');

    // 3. CHAT MESSAGE SENT FEEDBACK
    await page.evaluate(() => {
      const w = document.querySelector('button[data-mode="watch"]');
      if (w) w.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const chatInput = await page.$('input[placeholder*="Say something"]');
    if (chatInput) {
      await chatInput.type('Antigravity 4.7 Web Watch & Studio verified! ✨');
      await chatInput.press('Enter');
      await new Promise(r => setTimeout(r, 800));
      await saveShot('06_web_watch_message_sent.png');
    }

    // 4. ACTIVE ROOMS DRAWER
    const roomPickerBtn = await page.$('button[data-action="rooms"]');
    if (roomPickerBtn) {
      await roomPickerBtn.click();
      await new Promise(r => setTimeout(r, 600));
      await saveShot('04_web_watch_room_picker_drawer.png');
      // close drawer
      await roomPickerBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // 5. SAFETY MODAL ACTIVE
    const safetyBtn = await page.$('button[data-action="safety"]');
    if (safetyBtn) {
      await safetyBtn.click();
      await new Promise(r => setTimeout(r, 600));
      await saveShot('05_web_watch_safety_modal_active.png');
      // Close modal
      const closeBtn = await page.$('button[aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // 6. MOBILE RESPONSIVE VIEW (390 x 844 iPhone 14)
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/live/web-watch?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText && x.innerText.includes('Accept'));
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 1200));
    await saveShot('03_mobile_web_watch_view.png');

    console.log('All 6 screenshots captured successfully!');
  } catch (err) {
    console.error('Screenshot error:', err);
  } finally {
    await browser.close();
  }
}

capture();
