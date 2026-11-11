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

  const setupPage = async (width, height, withAdminSession = false, scale = 2) => {
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

    if (withAdminSession) {
      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookiePairs.join('; '),
        },
        body: JSON.stringify({
          email: 'ordinaryadmin@popolive.com',
          password: 'AdminPass123!',
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
    const page = await setupPage(390, 844, false, 2);

    // 1. Mobile 1:1 matching 07_04_animations_and_entrances.png (390x844)
    await page.goto(`${BASE_URL}/animations?preview=demo`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="animation-stage-overlay"]', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1200));
    await saveShot(page, '01_mobile_animations_entrances_1to1.png');

    // 2. VIP Host Entrance Banner + Luxury Castle Overlay on Stage
    await page.click('[data-testid="trigger-entrance-vip"]');
    await page.waitForSelector('[data-testid="host-entrance-banner"]', { timeout: 10000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 450));
    await saveShot(page, '02_mobile_vip_host_entrance_banner.png');

    // 3. Open User Animation & Sound Accessibility Modal
    await page.click('[data-testid="open-settings-btn"]');
    await page.waitForSelector('[data-testid="animation-settings-modal"]', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 400));
    await saveShot(page, '03_mobile_animation_settings_modal.png');

    // Save reduced settings & close modal, then switch to Urdu RTL
    await page.click('[data-testid="toggle-reduce-animations"]');
    await page.click('[data-testid="save-animation-settings-btn"]');
    await new Promise((r) => setTimeout(r, 600));
    await page.click('[data-testid="toggle-language-btn"]');
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 450));
    await saveShot(page, '04_mobile_animations_urdu_reduced.png');

    // Restore normal English defaults via modal
    await page.click('[data-testid="toggle-language-btn"]');
    await page.click('[data-testid="open-settings-btn"]');
    await new Promise((r) => setTimeout(r, 350));
    await page.click('[data-testid="toggle-reduce-animations"]');
    await page.click('[data-testid="save-animation-settings-btn"]');
    await new Promise((r) => setTimeout(r, 400));
    await page.close();

    // 4. Desktop Admin Panel -> Animations & Entrances Tab
    const adminPage = await setupPage(1280, 860, true, 1);
    await adminPage.goto(`${BASE_URL}/admin/gifts`, { waitUntil: 'domcontentloaded' });
    await adminPage.waitForSelector('[data-testid="admin-tab-animations"]', { timeout: 15000 });
    await adminPage.click('[data-testid="admin-tab-animations"]');
    await adminPage.waitForSelector('[data-testid="admin-animations-tab"]', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1100));
    await saveShot(adminPage, '05_desktop_admin_animations_tab.png');
    await adminPage.close();
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
