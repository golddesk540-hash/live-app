const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const ARTIFACT_DIR = path.resolve('C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f');
const PUBLIC_DIR = path.resolve(__dirname, 'public', 'assets', 'end-screen');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

async function capture() {
  console.log('Starting End Screen & Live Center screenshot capture...');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  async function saveShot(filename) {
    const pubPath = path.join(PUBLIC_DIR, filename);
    const brainPath = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: pubPath, fullPage: false });
    fs.copyFileSync(pubPath, brainPath);
    console.log(`Saved screenshot: ${filename}`);
  }

  try {
    // 1. MOBILE 1:1 END SCREEN (390 x 844 iPhone 14)
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/live/end-screen?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    // Dismiss consent banner if present
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText && x.innerText.includes('Accept'));
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await saveShot('01_mobile_end_screen_1to1.png');

    // 2. MOBILE LIVE CENTER VIEW
    await page.evaluate(() => {
      const btn = document.querySelector('button[data-action="live-center"]');
      if (btn) btn.click();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));
    await saveShot('02_mobile_live_center_view.png');

    // 3. MOBILE LIVE CENTER FILTERED THIS WEEK
    await page.evaluate(() => {
      const weekBtn = document.querySelector('button[data-filter="week"]');
      if (weekBtn) weekBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await saveShot('03_mobile_live_center_filtered_week.png');

    // 4. DESKTOP END SCREEN (1440 x 900)
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(`${BASE_URL}/live/end-screen?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));
    await saveShot('04_desktop_end_screen_view.png');

    // 5. DESKTOP LIVE CENTER (1440 x 900)
    await page.goto(`${BASE_URL}/live/center?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));
    await saveShot('05_desktop_live_center_view.png');

    console.log('All 5 screenshots captured successfully!');
  } catch (err) {
    console.error('Screenshot error:', err);
  } finally {
    await browser.close();
  }
}

capture();
