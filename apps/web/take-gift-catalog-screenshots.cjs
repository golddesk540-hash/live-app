const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EXECUTABLE_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const BRAIN_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';
const ASSETS_DIR = path.join(__dirname, 'public', 'assets', 'gifts', 'screenshots');

async function capture() {
  console.log('Starting Puppeteer for Module 7.2 Virtual Gift Catalog screenshots...');
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  fs.mkdirSync(BRAIN_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EXECUTABLE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  const setupPage = async (width, height, withAdminSession = false, scale = 2) => {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: scale });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('poppo_terms_consent_status', 'accepted');
      localStorage.setItem('poppo_terms_consent_version', 'v4.2.0');
    });

    try {
      const consentRes = await fetch('http://localhost:3000/api/consent', {
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
          await page.setCookie({ name, value, domain: 'localhost', path: '/' });
        }
      }

      if (withAdminSession) {
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
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
        const loginCookies = loginRes.headers.getSetCookie
          ? loginRes.headers.getSetCookie()
          : loginRes.headers.get('set-cookie')
          ? [loginRes.headers.get('set-cookie')]
          : [];
        for (const sc of loginCookies) {
          if (!sc) continue;
          const first = sc.split(';')[0];
          const eqIdx = first.indexOf('=');
          if (eqIdx > 0) {
            const name = first.slice(0, eqIdx).trim();
            const value = first.slice(eqIdx + 1).trim();
            await page.setCookie({ name, value, domain: 'localhost', path: '/' });
          }
        }
      }
    } catch (err) {
      console.warn('Cookie setup warning:', err.message);
    }

    return page;
  };

  const saveScreenshots = async (page, filename) => {
    const brainPath = path.join(BRAIN_DIR, filename);
    const assetPath = path.join(ASSETS_DIR, filename);
    await page.screenshot({ path: brainPath, fullPage: false });
    await page.screenshot({ path: assetPath, fullPage: false });
    console.log(`  📸 Saved ${filename}`);
  };

  try {
    // 1. Mobile Gift Catalog 1:1 Reference Match (EN)
    const p1 = await setupPage(390, 844);
    await p1.goto('http://localhost:3000/gifts?preview=demo', { waitUntil: 'networkidle2' });
    await p1.waitForSelector('[data-testid="gift-card-gift_rose"]', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 900));
    await saveScreenshots(p1, '01_mobile_gift_catalog_1to1.png');
    await p1.close();

    // 2. Mobile Gift Catalog (Urdu RTL)
    const p2 = await setupPage(390, 844);
    await p2.goto('http://localhost:3000/gifts?preview=demo&lang=ur', { waitUntil: 'networkidle2' });
    await p2.waitForSelector('[data-testid="gift-card-gift_rose"]', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 900));
    await saveScreenshots(p2, '02_mobile_gift_catalog_urdu.png');
    await p2.close();

    // 3. Mobile Gift Detail Preview Modal (Castle 10,000 coins + Lottie preview)
    const p3 = await setupPage(390, 844);
    await p3.goto('http://localhost:3000/gifts?preview=demo', { waitUntil: 'networkidle2' });
    await p3.waitForSelector('[data-testid="gift-card-gift_castle"]', { timeout: 10000 });
    await p3.click('[data-testid="gift-card-gift_castle"]');
    await p3.waitForSelector('[data-testid="gift-detail-modal"]', { timeout: 8000 });
    await new Promise((r) => setTimeout(r, 900));
    await saveScreenshots(p3, '03_mobile_gift_detail_preview.png');
    await p3.close();

    // 4. Mobile Search / Luxury Filter View
    const p4 = await setupPage(390, 844);
    await p4.goto('http://localhost:3000/gifts?preview=demo&category=luxury', { waitUntil: 'networkidle2' });
    await p4.waitForSelector('[data-testid="category-tab-luxury"]', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 800));
    await saveScreenshots(p4, '04_mobile_gift_luxury_filtered.png');
    await p4.close();

    // 5. Desktop Gift Catalog (1440x900)
    const p5 = await setupPage(1440, 900, false, 1);
    await p5.goto('http://localhost:3000/gifts?preview=demo', { waitUntil: 'networkidle2' });
    await p5.waitForSelector('[data-testid="gift-card-gift_rose"]', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 900));
    await saveScreenshots(p5, '05_desktop_gift_catalog.png');
    await p5.close();

    // 6. Desktop Admin Gift Catalog Console (1440x900)
    const p6 = await setupPage(1440, 900, true, 1);
    await p6.goto('http://localhost:3000/admin/gifts', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));
    await saveScreenshots(p6, '06_desktop_admin_gifts.png');
    await p6.close();

    console.log('✅ All 6 Module 7.2 screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

capture().catch((err) => {
  console.error('❌ Screenshot capture failed:', err);
  process.exit(1);
});
