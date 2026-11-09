const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const ARTIFACT_DIR = path.resolve('C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f');
const PUBLIC_DIR = path.resolve(__dirname, 'public', 'assets', 'host-rules');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

async function capture() {
  console.log('Starting Host Rules on Screen screenshot capture...');

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
    // 1. MOBILE 1:1 HOST RULES (390 x 844 iPhone 14) matching 04_10_host_rules_on_screen.png
    console.log('1. Capturing Mobile 1:1 Host Rules matching 04_10...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/live/rules?preview=demo&hostId=screenshot-host-1`, { waitUntil: 'networkidle2', timeout: 30000 });
    await dismissConsent();
    await new Promise((r) => setTimeout(r, 1000));
    await saveShot('01_mobile_host_rules_1to1.png');

    // 2. MOBILE WITH ACKNOWLEDGEMENT COMPLETED
    console.log('2. Submitting I Understand acknowledgement...');
    await page.evaluate(() => {
      const btn = document.querySelector('[data-action="i-understand"]');
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    await saveShot('02_mobile_host_rules_acknowledged.png');

    // 3. MOBILE WITH EXPANDED RULE POLICY DRAWER
    console.log('3. Expanding Rule 1 policy drawer...');
    await page.evaluate(() => {
      const el = document.querySelector('[data-rule-id="rule_nudity"]');
      if (el) el.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    await saveShot('03_mobile_host_rules_details_drawer.png');

    // 4. MOBILE HOST STUDIO WITH LIVE SAFETY REMINDER BANNER
    console.log('4. Capturing Host Studio with Live Safety Reminder...');
    await page.goto(`${BASE_URL}/live/studio/880219?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await dismissConsent();
    await new Promise((r) => setTimeout(r, 1200));
    await saveShot('04_mobile_host_studio_safety_reminder.png');

    // 5. DESKTOP VIEW (1440 x 900)
    console.log('5. Capturing Desktop Host Rules view...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(`${BASE_URL}/live/rules?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await dismissConsent();
    await new Promise((r) => setTimeout(r, 1000));
    await saveShot('05_desktop_host_rules_view.png');

    console.log('All 5 Host Rules screenshots captured and saved successfully!');
  } catch (err) {
    console.error('Screenshot capture error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

capture();
