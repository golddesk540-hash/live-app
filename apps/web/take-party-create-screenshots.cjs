const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const ARTIFACT_DIR = path.resolve('C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f');
const PUBLIC_DIR = path.resolve(__dirname, 'public', 'assets', 'party');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

async function capture() {
  console.log('Starting Create a Party (Module 5.1) screenshot capture...');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  async function dismissConsent() {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((x) => x.innerText && x.innerText.includes('Accept'));
      if (b) b.click();
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
    // 1. MOBILE 1:1 CREATE A PARTY (390 x 844 iPhone 14) matching 05_01_create_a_party.png
    console.log('1. Capturing Mobile 1:1 Create a Party matching 05_01...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/party/create?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await dismissConsent();
    await new Promise((r) => setTimeout(r, 1000));
    await saveShot('01_mobile_create_a_party_1to1.png');

    // 2. MOBILE WITH CATEGORY DROPDOWN OPEN
    console.log('2. Opening Category dropdown menu...');
    await page.evaluate(() => {
      document.querySelector('[data-testid="category-selector"]').click();
    });
    await new Promise((r) => setTimeout(r, 600));
    await saveShot('02_mobile_party_category_dropdown.png');

    // 3. MOBILE WITH PRIVATE ROOM SELECTED
    console.log('3. Selecting Private Room option...');
    await page.evaluate(() => {
      // Close dropdown if open
      const item = document.querySelector('[data-category-id="music"]');
      if (item) item.click();
      // Select Private
      document.querySelector('[data-room-type="private"]').click();
    });
    await new Promise((r) => setTimeout(r, 600));
    await saveShot('03_mobile_party_private_selected.png');

    // 4. MOBILE CREATED PARTY ROOM (Module 5.2 Seat Grid Ready)
    console.log('4. Submitting Create Party & capturing Room landing...');
    await page.evaluate(() => {
      document.querySelector('[data-action="create-party"]').click();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1200));
    await saveShot('04_mobile_party_room_seat_grid_ready.png');

    // 5. DESKTOP VIEW (1440 x 900)
    console.log('5. Capturing Desktop Create a Party view...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(`${BASE_URL}/party/create?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await dismissConsent();
    await new Promise((r) => setTimeout(r, 1000));
    await saveShot('05_desktop_create_party_view.png');

    console.log('All 5 Module 5.1 screenshots captured and saved successfully!');
  } catch (err) {
    console.error('Screenshot capture error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

capture();
