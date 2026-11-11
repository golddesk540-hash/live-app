const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const BASE_URL = process.env.SCREENSHOT_BASE_URL || process.env.TEST_BASE_URL || process.argv[2] || 'http://127.0.0.1:3006';
const COOKIE_DOMAIN = new URL(BASE_URL).hostname;
const OUT_DIR = path.join(__dirname, 'public', 'assets', 'gifts', 'screenshots');
const ARTIFACT_DIR =
  'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';

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
  console.log(`Saved ${name}`);
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
    // 1. Mobile Wealth Tab (matches 07_08_wealth_shining_and_honor.png 1:1)
    const mob = await setupPage(430, 900, false, 2);
    await mob.goto(`${BASE_URL}/recognition?preview=demo`, { waitUntil: 'networkidle2' });
    await mob.waitForSelector('[data-testid="wing-showcase-card"]');
    await new Promise((r) => setTimeout(r, 700));
    await saveShot(mob, '08_01_mobile_wealth_1to1.png', true);

    // 2. Mobile Shining Tab + Leaderboard Subtab
    await mob.click('[data-testid="tab-recognition-shining"]');
    await mob.click('[data-testid="subtab-leaderboard"]');
    await new Promise((r) => setTimeout(r, 700));
    await saveShot(mob, '08_02_mobile_shining_leaderboard.png', true);

    // 3. Mobile Honor Tab
    await mob.click('[data-testid="tab-recognition-honor"]');
    await mob.click('[data-testid="subtab-overview"]');
    await new Promise((r) => setTimeout(r, 700));
    await saveShot(mob, '08_03_mobile_honor_overview.png', true);

    // 4. Mobile Urdu RTL View
    await mob.click('[data-testid="toggle-lang-recognition"]');
    await new Promise((r) => setTimeout(r, 600));
    await saveShot(mob, '08_04_mobile_recognition_urdu_rtl.png', true);
    // Restore English cleanly before Desktop screenshots
    await mob.click('[data-testid="toggle-lang-recognition"]');
    await new Promise((r) => setTimeout(r, 300));
    await mob.close();

    // 5. Desktop Recognition Screen (1280x900)
    const desk = await setupPage(1280, 900, false, 1);
    await desk.goto(`${BASE_URL}/recognition?preview=demo`, { waitUntil: 'networkidle2' });
    await desk.waitForSelector('[data-testid="wing-showcase-card"]');
    await new Promise((r) => setTimeout(r, 700));
    await saveShot(desk, '08_05_desktop_recognition_center.png', true);
    await desk.close();

    // 6. Desktop Admin Finance Panel -> Wealth / Shining / Honor Tab
    const adm = await setupPage(1400, 950, true, 1);
    await adm.goto(`${BASE_URL}/admin/finance`, { waitUntil: 'domcontentloaded' });
    await adm.waitForSelector('button', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 900));
    await adm.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const recBtn = buttons.find((b) => (b.textContent || '').includes('Wealth / Shining / Honor'));
      if (recBtn) recBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));
    await saveShot(adm, '08_06_desktop_admin_recognition_tab.png', true);
    await adm.close();
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
