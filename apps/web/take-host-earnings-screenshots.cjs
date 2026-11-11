const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_BASE_URL || process.argv[2] || 'http://127.0.0.1:3006';
const COOKIE_DOMAIN = new URL(BASE_URL).hostname;
const OUT_DIR = path.join(__dirname, 'public', 'assets', 'gifts', 'screenshots');
const BRAIN_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';

fs.mkdirSync(OUT_DIR, { recursive: true });
if (fs.existsSync(BRAIN_DIR)) {
  fs.mkdirSync(BRAIN_DIR, { recursive: true });
}

function findBrowser() {
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ];
  return candidates.find((p) => fs.existsSync(p));
}

async function saveShot(page, name) {
  const fileA = path.join(OUT_DIR, name);
  await page.screenshot({ path: fileA, fullPage: false });
  if (fs.existsSync(BRAIN_DIR)) {
    fs.copyFileSync(fileA, path.join(BRAIN_DIR, name));
  }
  console.log('Saved screenshot:', name);
}

async function run() {
  const exePath = findBrowser();
  if (!exePath) throw new Error('Chrome/Edge executable not found on Windows.');

  const browser = await puppeteer.launch({
    executablePath: exePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const setupPage = async (width, height, withFinanceAdmin = false, scale = 2) => {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: scale });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('poppo_terms_consent_status', 'accepted');
      localStorage.setItem('poppo_terms_consent_version', 'v4.2.0');
    });

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
    const setCookies = consentRes.headers.getSetCookie
      ? consentRes.headers.getSetCookie()
      : consentRes.headers.get('set-cookie')
      ? [consentRes.headers.get('set-cookie')]
      : [];
    const cookiePairs = [];
    for (const sc of setCookies) {
      if (!sc) continue;
      const first = sc.split(';')[0];
      const eqIdx = first.indexOf('=');
      if (eqIdx > 0) {
        const name = first.slice(0, eqIdx).trim();
        const value = first.slice(eqIdx + 1).trim();
        cookiePairs.push(`${name}=${value}`);
        await page.setCookie({ name, value, domain: COOKIE_DOMAIN, path: '/' });
      }
    }

    if (withFinanceAdmin) {
      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookiePairs.join('; '),
        },
        body: JSON.stringify({
          email: 'finance@popolive.com',
          password: 'FinancePass123!',
        }),
      });
      const adminCookies = loginRes.headers.getSetCookie
        ? loginRes.headers.getSetCookie()
        : loginRes.headers.get('set-cookie')
        ? [loginRes.headers.get('set-cookie')]
        : [];
      for (const sc of adminCookies) {
        if (!sc) continue;
        const first = sc.split(';')[0];
        const eqIdx = first.indexOf('=');
        if (eqIdx > 0) {
          const name = first.slice(0, eqIdx).trim();
          const value = first.slice(eqIdx + 1).trim();
          await page.setCookie({ name, value, domain: COOKIE_DOMAIN, path: '/' });
        }
      }
    }
    return page;
  };

  try {
    // 1. Mobile 1:1 Host Points Share Hero Screen
    const mPage = await setupPage(390, 844, false, 2);
    await mPage.goto(`${BASE_URL}/earnings?preview=demo`, { waitUntil: 'domcontentloaded' });
    await mPage.waitForSelector('[data-testid="hero-share-flow-card"]', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1200));
    await saveShot(mPage, '01_mobile_host_earnings_1to1.png');

    // 2. Scrolled down to KPIs, 7-day chart & history
    await mPage.evaluate(() => window.scrollTo(0, 560));
    await new Promise((r) => setTimeout(r, 500));
    await saveShot(mPage, '02_mobile_host_earnings_charts_history.png');

    // 3. Urdu RTL top view
    await mPage.evaluate(() => window.scrollTo(0, 0));
    await mPage.click('[data-testid="earnings-lang-toggle"]');
    await new Promise((r) => setTimeout(r, 500));
    await saveShot(mPage, '03_mobile_host_earnings_urdu.png');
    await mPage.close();

    // 4. Desktop Full Host Earnings Dashboard
    const dPage = await setupPage(1280, 900, false, 1);
    await dPage.goto(`${BASE_URL}/earnings?preview=demo`, { waitUntil: 'domcontentloaded' });
    await dPage.waitForSelector('[data-testid="daily-earnings-chart"]', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1200));
    await saveShot(dPage, '04_desktop_host_earnings_dashboard.png');
    await dPage.close();

    // 5. Desktop Admin Finance -> Host Shares (70/30) Tab
    const adminPage = await setupPage(1280, 900, true, 1);
    await adminPage.goto(`${BASE_URL}/admin/finance`, { waitUntil: 'domcontentloaded' });
    await adminPage.waitForSelector('button', { timeout: 15000 });
    await adminPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Host Shares (70/30)')
      );
      if (btn) btn.click();
    });
    await adminPage.waitForSelector('[data-testid="admin-host-earnings-tab"]', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1200));
    await saveShot(adminPage, '05_desktop_admin_finance_shares_tab.png');
    await adminPage.close();
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Module 7.5 screenshot capture failed:', err);
  process.exit(1);
});
