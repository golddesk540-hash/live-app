const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EXECUTABLE_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const BRAIN_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';
const ASSETS_DIR = path.join(__dirname, 'public', 'assets', 'wallet');

async function capture() {
  console.log('Starting Puppeteer for Module 7.1 Coins & Points screenshots...');
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  fs.mkdirSync(BRAIN_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EXECUTABLE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  const setupPage = async (width, height, withFinanceAdminSession = false, scale = 2) => {
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

      if (withFinanceAdminSession) {
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
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
    fs.copyFileSync(brainPath, assetPath);
    console.log(`Saved ${filename} -> brain & public/assets/wallet`);
  };

  try {
    // 1. Mobile Wallet 1:1 (EN, 390x844)
    const p1 = await setupPage(390, 844);
    await p1.goto('http://localhost:3000/wallet?preview=demo&lang=en', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    await saveScreenshots(p1, '01_mobile_wallet_1to1.png');
    await p1.close();

    // 2. Mobile Wallet Urdu RTL (UR, 390x844)
    const p2 = await setupPage(390, 844);
    await p2.goto('http://localhost:3000/wallet?preview=demo&lang=ur', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    await saveScreenshots(p2, '02_mobile_wallet_urdu.png');
    await p2.close();

    // 3. Mobile Coin History (390x844)
    const p3 = await setupPage(390, 844);
    await p3.goto('http://localhost:3000/wallet/coin-history?preview=demo&lang=en', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    await saveScreenshots(p3, '03_mobile_coin_history.png');
    await p3.close();

    // 4. Mobile Points History (390x844)
    const p4 = await setupPage(390, 844);
    await p4.goto('http://localhost:3000/wallet/points-history?preview=demo&lang=en', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    await saveScreenshots(p4, '04_mobile_points_history.png');
    await p4.close();

    // 5. Desktop Wallet (1440x900)
    const p5 = await setupPage(1440, 900);
    await p5.goto('http://localhost:3000/wallet?preview=demo&lang=en', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    await saveScreenshots(p5, '05_desktop_wallet.png');
    await p5.close();

    // 6. Desktop Admin Finance Controls (Authenticated finance_admin, 1440x900)
    const p6 = await setupPage(1440, 900, true);
    await p6.goto('http://localhost:3000/admin/finance', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));
    await saveScreenshots(p6, '06_desktop_admin_finance.png');
    await p6.close();
  } finally {
    await browser.close();
    console.log('Done capturing Module 7.1 screenshots!');
  }
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
