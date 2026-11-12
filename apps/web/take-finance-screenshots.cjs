const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const BASE_URL =
  process.env.SCREENSHOT_BASE_URL || process.env.TEST_BASE_URL || process.argv[2] || 'http://127.0.0.1:3006';
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

async function acceptConsentAndOptionallySignInAdmin(page, signInAdmin = false) {
  await page.evaluate(async (doAdmin) => {
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
    if (doAdmin) {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'finance@popolive.com', password: 'FinancePass123!' }),
      });
    }
  }, signInAdmin);
}

(async () => {
  const browserExe = findBrowser();
  if (!browserExe) throw new Error('Edge / Chrome executable not found.');

  const browser = await puppeteer.launch({
    executablePath: browserExe,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // 1. Mobile Receipts & History (390x844)
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto(`${BASE_URL}/finance?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await acceptConsentAndOptionallySignInAdmin(page, false);
    await page.goto(`${BASE_URL}/finance?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('[data-testid="finance-history-list"]', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 800));
    await saveShot(page, '10_01_mobile_finance_1to1.png');

    // 2. Mobile Receipt Detail Modal
    const firstReceiptBtn = await page.$('[data-testid^="open-receipt-"]');
    if (firstReceiptBtn) {
      await firstReceiptBtn.click();
      await page.waitForSelector('[data-testid="receipt-detail-card"]', { timeout: 10000 });
      await new Promise((r) => setTimeout(r, 500));
      await saveShot(page, '10_02_mobile_receipt_detail.png');
    }

    // 3. Mobile Export / PDF Receipts Tab
    await page.goto(`${BASE_URL}/finance?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('[data-testid="tab-export"]', { timeout: 10000 });
    await page.click('[data-testid="tab-export"]');
    await new Promise((r) => setTimeout(r, 700));
    await saveShot(page, '10_03_mobile_finance_export_tab.png');

    // 4. Mobile Urdu RTL View
    await page.click('[data-testid="tab-receipts"]');
    await page.click('[data-testid="finance-lang-toggle"]');
    await new Promise((r) => setTimeout(r, 700));
    await saveShot(page, '10_04_mobile_finance_urdu_rtl.png');

    // 5. Desktop Finance Screen (1280x800)
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
    await page.goto(`${BASE_URL}/finance?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('[data-testid="finance-history-list"]', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 700));
    await saveShot(page, '10_05_desktop_finance.png');

    // 6. Desktop Admin Finance Reports & Export Tab
    await acceptConsentAndOptionallySignInAdmin(page, true);
    await page.goto(`${BASE_URL}/admin/finance?tab=reports`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('[data-testid="admin-reports-export-tab"]', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1200));
    await saveShot(page, '10_06_desktop_admin_reports_export.png');
  } finally {
    await browser.close();
  }
})();
