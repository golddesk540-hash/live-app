const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EXECUTABLE_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const BRAIN_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';
const ASSETS_DIR = path.join(__dirname, 'public', 'assets', 'gifts', 'screenshots');
const BASE_URL = (process.argv[2] || 'http://127.0.0.1:3006').trim();
const COOKIE_DOMAIN = new URL(BASE_URL).hostname;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function capture() {
  console.log('Starting Puppeteer for Module 7.3 Real-Time Gift Sending screenshots...');
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  fs.mkdirSync(BRAIN_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EXECUTABLE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  let financeCookies = '';

  const setupPage = async (width, height, withAdminSession = false, scale = 2) => {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: scale });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('poppo_terms_consent_status', 'accepted');
      localStorage.setItem('poppo_terms_consent_version', 'v4.2.0');
    });

    try {
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
            cookiePairs.push(`${name}=${value}`);
            await page.setCookie({ name, value, domain: COOKIE_DOMAIN, path: '/' });
          }
        }
        financeCookies = cookiePairs.join('; ');
      }
    } catch (e) {
      console.warn('Cookie setup warning:', e.message);
    }

    return page;
  };

  const saveShot = async (page, filename) => {
    const brainOut = path.join(BRAIN_DIR, filename);
    const assetOut = path.join(ASSETS_DIR, filename);
    await page.screenshot({ path: brainOut, fullPage: false });
    fs.copyFileSync(brainOut, assetOut);
    console.log(`Captured ${filename}`);
  };

  let sentGiftTxIdForCleanup = null;

  try {
    // 1. Mobile 1:1 with 07_03_sending_a_gift.png (390x844)
    const p1 = await setupPage(390, 844, false);
    await p1.goto(`${BASE_URL}/gifts/send?pkBattleId=00000000-0000-0000-0000-000000000603&preview=demo`, {
      waitUntil: 'networkidle2',
    });
    await p1.waitForSelector('[data-testid="open-confirm-gift-btn"]');
    await sleep(900);
    await saveShot(p1, '01_mobile_sending_a_gift_1to1.png');

    // 2. Open Confirmation Modal
    await p1.click('[data-testid="open-confirm-gift-btn"]');
    await p1.waitForSelector('[data-testid="gift-confirmation-modal"]');
    await sleep(700);
    await saveShot(p1, '02_mobile_gift_confirmation_modal.png');

    // 3. Confirm Send & capture non-blocking Live Animation Overlay
    const sendResponsePromise = p1.waitForResponse(
      (r) => r.url().includes('/api/gifts/send') && r.request().method() === 'POST'
    );
    await p1.click('[data-testid="confirm-send-gift-btn"]');
    const sendResp = await sendResponsePromise;
    try {
      const json = await sendResp.json();
      sentGiftTxIdForCleanup = json?.transaction?.giftTransactionId || null;
    } catch {}
    await sleep(1100);
    await saveShot(p1, '03_mobile_gift_sent_animation.png');

    // 4. Urdu RTL view on /gifts/send
    await p1.click('[data-testid="lang-toggle"]');
    await sleep(600);
    await saveShot(p1, '05_mobile_gift_sending_urdu.png');
    await p1.close();

    // 5. Integrated Live Streaming Room Gift Drawer (/live/room/880219?preview=demo)
    const pRoom = await setupPage(390, 844, false);
    await pRoom.goto(`${BASE_URL}/live/room/880219?preview=demo`, {
      waitUntil: 'networkidle2',
    });
    await pRoom.waitForSelector('[data-testid="live-room-open-gift-btn"]');
    await sleep(900);
    await pRoom.click('[data-testid="live-room-open-gift-btn"]');
    await pRoom.waitForSelector('[data-testid="live-room-gift-drawer"]');
    await sleep(900);
    await saveShot(pRoom, '04_mobile_live_room_gift_drawer.png');
    await pRoom.close();

    // 6. Desktop Admin Finance Panel -> Gift Transactions tab (1440x900)
    const pAdmin = await setupPage(1440, 900, true, 1);
    await pAdmin.goto(`${BASE_URL}/admin/finance`, { waitUntil: 'networkidle2' });
    await sleep(900);
    const tabs = await pAdmin.$$('button');
    for (const btn of tabs) {
      const txt = await pAdmin.evaluate((el) => el.textContent || '', btn);
      if (txt.includes('Gift Transactions')) {
        await btn.click();
        break;
      }
    }
    await sleep(1100);
    await saveShot(pAdmin, '06_desktop_admin_gift_transactions.png');
    await pAdmin.close();
  } finally {
    await browser.close();
  }

  // Restore canonical demo wallet 12,500 coins if UI screenshot sent a gift
  if (sentGiftTxIdForCleanup && financeCookies) {
    try {
      const revRes = await fetch(
        `${BASE_URL}/api/admin/gifts/transactions/${encodeURIComponent(sentGiftTxIdForCleanup)}/reverse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: financeCookies },
          body: JSON.stringify({ reason: 'Restore canonical demo wallet after UI screenshot capture' }),
        }
      );
      const revData = await revRes.json();
      console.log('Restored demo wallet via reversal:', revData.success, sentGiftTxIdForCleanup);
    } catch (err) {
      console.warn('Could not clean up screenshot gift tx:', err.message);
    }
  }

  console.log('All 6 Module 7.3 screenshots captured cleanly.');
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
