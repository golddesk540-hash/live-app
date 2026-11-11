const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const BASE_URL = process.env.SCREENSHOT_BASE_URL || process.env.TEST_BASE_URL || process.argv[2] || 'http://127.0.0.1:3006';
const COOKIE_DOMAIN = new URL(BASE_URL).hostname;
const OUT_DIR = path.join(__dirname, 'public', 'assets', 'gifts', 'screenshots');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

function findBrowser() {
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ];
  return candidates.find((p) => fs.existsSync(p));
}

async function saveShot(page, name, fullPage = false) {
  const pubPath = path.join(OUT_DIR, name);
  const artPath = path.join(ARTIFACT_DIR, name);
  await page.screenshot({ path: pubPath, fullPage });
  fs.copyFileSync(pubPath, artPath);
  console.log(`Saved screenshot: ${name}`);
}

async function setConsentAndSignInAdmin(page) {
  const consentRes = await page.evaluate(async () => {
    const r1 = await fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'accept',
        termsAccepted: true,
        privacyAccepted: true,
        isAdultConfirmed: true,
      }),
    });
    const r2 = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'finance@popolive.com', password: 'FinancePass123!' }),
    });
    return { cStatus: r1.status, lStatus: r2.status };
  });
  console.log('Consent & Finance Admin Auth:', consentRes);
}

(async () => {
  const browserExe = findBrowser();
  if (!browserExe) throw new Error('Microsoft Edge / Chrome executable not found.');

  const browser = await puppeteer.launch({
    executablePath: browserExe,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Accept compliance Terms Gate cookie before capturing UI screenshots
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto(`${BASE_URL}/store?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.evaluate(async () => {
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          termsAccepted: true,
          privacyAccepted: true,
          isAdultConfirmed: true,
        }),
      });
    });

    // 1. Mobile Store (390x844)
    await page.goto(`${BASE_URL}/store?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('[data-testid="store-items-grid"]', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 800));
    await saveShot(page, '09_01_mobile_store_1to1.png');

    // 2. Mobile Item Detail Preview Modal
    await page.click('[data-testid="store-item-card-item_enter_royal_supercar"]');
    await page.waitForSelector('[data-testid="store-detail-modal"]', { timeout: 10000 });
    await page.click('[data-testid="store-preview-btn"]');
    await new Promise((r) => setTimeout(r, 500));
    await saveShot(page, '09_02_mobile_store_item_detail.png');

    // 3. Mobile My Inventory
    await page.goto(`${BASE_URL}/store?tab=inventory&preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('[data-testid="store-inventory-panel"]', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 700));
    await saveShot(page, '09_03_mobile_store_inventory.png');

    // 4. Mobile Store Urdu RTL
    await page.goto(`${BASE_URL}/store?lang=ur&preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('[data-testid="store-items-grid"]', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 700));
    await saveShot(page, '09_04_mobile_store_urdu_rtl.png');

    // 5. Desktop Store (1280x850)
    await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 2 });
    await page.goto(`${BASE_URL}/store?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('[data-testid="store-items-grid"]', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 700));
    await saveShot(page, '09_05_desktop_store.png');

    // 6. Desktop Admin Finance Store Tab (1280x850)
    await page.goto(`${BASE_URL}/admin/finance`, { waitUntil: 'networkidle2', timeout: 30000 });
    await setConsentAndSignInAdmin(page);
    await page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Virtual Store')
      );
      if (btn) btn.click();
    });
    await page.waitForSelector('[data-testid="admin-store-tab"]', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 900));
    await saveShot(page, '09_06_desktop_admin_store_tab.png');
  } finally {
    await browser.close();
  }
})();
