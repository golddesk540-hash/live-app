const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const ARTIFACT_DIR = path.resolve('C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f');
const PUBLIC_DIR = path.resolve(__dirname, 'public', 'assets', 'quality-guard');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

async function capture() {
  console.log('Starting Quality and Cost Guard screenshot capture...');

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
    // 1. MOBILE 1:1 QUALITY & COST GUARD (390 x 844 iPhone 14) matching 04_09_quality_cost_guard.png
    console.log('1. Capturing Mobile 1:1 Quality & Cost Guard matching 04_09...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/live/quality?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1200));
    await saveShot('01_mobile_quality_cost_guard_1to1.png');

    // 2. MOBILE WITH 1080p SELECTED
    console.log('2. Selecting 1080p option...');
    await page.click('[data-quality="1080p"]');
    await new Promise((r) => setTimeout(r, 600));
    await saveShot('02_mobile_quality_1080p_selected.png');

    // 3. MOBILE WITH COST GUARD TOGGLED OFF
    console.log('3. Toggling Cost Guard switch to OFF...');
    await page.click('[data-action="toggle-cost-guard"]');
    await new Promise((r) => setTimeout(r, 600));
    await saveShot('03_mobile_cost_guard_toggled_off.png');

    // 4. MOBILE WITH WEAK NETWORK WARNING SIMULATION
    console.log('4. Capturing Mobile with weak network simulation...');
    await page.goto(`${BASE_URL}/live/quality?preview=demo&simulate=weak`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1200));
    await saveShot('04_mobile_weak_network_warning.png');

    // 5. DESKTOP VIEW (1440 x 900)
    console.log('5. Capturing Desktop Quality & Cost Guard view...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(`${BASE_URL}/live/quality?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1200));
    await saveShot('05_desktop_quality_guard_view.png');

    console.log('All 5 screenshots captured and saved successfully!');
  } catch (err) {
    console.error('Screenshot error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

capture();
