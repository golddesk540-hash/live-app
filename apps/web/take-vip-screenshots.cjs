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
    // 1. Mobile 1:1 VIP Membership Showcase (390x844)
    const mPage = await setupPage(390, 844, false, 2);
    await mPage.goto(`${BASE_URL}/vip?preview=demo`, { waitUntil: 'domcontentloaded' });
    await mPage.waitForSelector('[data-testid="vip-plan-card-vip_gold"]', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1100));
    await saveShot(mPage, '07_01_mobile_vip_membership_1to1.png');

    // 2. Compare Matrix + Payment Providers + Upgrade Button
    await mPage.click('[data-testid="vip-compare-toggle"]');
    await mPage.waitForSelector('[data-testid="vip-comparison-matrix"]', { timeout: 8000 });
    await mPage.evaluate(() => window.scrollTo(0, 560));
    await new Promise((r) => setTimeout(r, 600));
    await saveShot(mPage, '07_02_mobile_vip_compare_providers.png');

    // 3. Sandbox Checkout Verification Modal (fail/dismiss cleanly after shot)
    await mPage.evaluate(() => window.scrollTo(0, 920));
    await new Promise((r) => setTimeout(r, 350));
    await mPage.click('[data-testid="vip-upgrade-btn"]');
    await mPage.waitForSelector('[data-testid="vip-sandbox-modal"]', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 500));
    await saveShot(mPage, '07_03_mobile_vip_sandbox_modal.png');

    await mPage.click('[data-testid="vip-sandbox-fail-btn"]');
    await new Promise((r) => setTimeout(r, 500));

    // 4. Urdu RTL View (then reset back to EN)
    await mPage.evaluate(() => window.scrollTo(0, 0));
    await mPage.click('[data-testid="vip-lang-toggle"]');
    await new Promise((r) => setTimeout(r, 500));
    await saveShot(mPage, '07_04_mobile_vip_urdu_rtl.png');
    await mPage.click('[data-testid="vip-lang-toggle"]');
    await new Promise((r) => setTimeout(r, 250));
    await mPage.close();

    // 5. Mobile VIP History Screen
    const histPage = await setupPage(390, 844, false, 2);
    await histPage.goto(`${BASE_URL}/vip/history?preview=demo`, { waitUntil: 'domcontentloaded' });
    await histPage.waitForSelector('[data-testid="vip-history-screen"]', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 900));
    await saveShot(histPage, '07_05_mobile_vip_history.png');
    await histPage.close();

    // 6. Desktop VIP Screen
    const dPage = await setupPage(1280, 900, false, 1);
    await dPage.goto(`${BASE_URL}/vip?preview=demo`, { waitUntil: 'domcontentloaded' });
    await dPage.waitForSelector('[data-testid="vip-plan-card-vip_gold"]', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1100));
    await saveShot(dPage, '07_06_desktop_vip_membership.png');
    await dPage.close();

    // 7. Desktop Admin Finance -> VIP Memberships Tab
    const adminPage = await setupPage(1280, 900, true, 1);
    await adminPage.goto(`${BASE_URL}/admin/finance`, { waitUntil: 'domcontentloaded' });
    await adminPage.waitForSelector('button', { timeout: 15000 });
    await adminPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('VIP Memberships')
      );
      if (btn) btn.click();
    });
    await adminPage.waitForSelector('[data-testid="admin-vip-tab-panel"]', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1200));
    await saveShot(adminPage, '07_07_desktop_admin_finance_vip_tab.png');
    await adminPage.close();
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Module 7.7 screenshot capture failed:', err);
  process.exit(1);
});
