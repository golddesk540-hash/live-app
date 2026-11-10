const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EXECUTABLE_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const BRAIN_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';
const ASSETS_DIR = path.join(__dirname, 'public', 'assets', 'pk');

async function capture() {
  console.log('Starting Puppeteer for PK Real Gifts screenshots...');
  const browser = await puppeteer.launch({
    executablePath: EXECUTABLE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  const setupPage = async (width, height, scale = 2) => {
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
      const cookieHeader = consentRes.headers.get('set-cookie');
      if (cookieHeader) {
        const parts = cookieHeader.split(';')[0].split('=');
        await page.setCookie({
          name: parts[0].trim(),
          value: parts[1].trim(),
          domain: 'localhost',
          path: '/',
        });
      }
    } catch {}

    return page;
  };

  const saveScreenshots = async (page, filename) => {
    const brainPath = path.join(BRAIN_DIR, filename);
    const assetPath = path.join(ASSETS_DIR, filename);
    await page.screenshot({ path: brainPath, type: 'png' });
    try {
      fs.copyFileSync(brainPath, assetPath);
    } catch {}
    console.log(`Saved screenshot: ${filename}`);
  };

  try {
    // 1. Mobile 1-to-1 matching 06_10_hand_off_to_real_gifts.png
    console.log('1. Capturing 01_mobile_pk_real_gifts_1to1.png...');
    const p1 = await setupPage(390, 844);
    await p1.goto('http://localhost:3000/pk/gifts?preview=demo', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));
    await saveScreenshots(p1, '01_mobile_pk_real_gifts_1to1.png');
    await p1.close();

    // 2. Mobile Urdu RTL
    console.log('2. Capturing 02_mobile_pk_real_gifts_urdu.png...');
    const p2 = await setupPage(390, 844);
    await p2.goto('http://localhost:3000/pk/gifts?lang=ur&preview=demo', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));
    await saveScreenshots(p2, '02_mobile_pk_real_gifts_urdu.png');
    await p2.close();

    // 3. Mobile Host B selected as recipient
    console.log('3. Capturing 03_mobile_pk_real_gifts_host_b_selected.png...');
    const p3 = await setupPage(390, 844);
    await p3.goto('http://localhost:3000/pk/gifts?preview=demo', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    // Click Host B selector
    const hostBBtn = await p3.$('button[data-testid="recipient-host-b"]');
    if (hostBBtn) {
      await hostBBtn.click();
      await new Promise((r) => setTimeout(r, 500));
    }
    // Also select Sports Car or Castle
    const carCard = await p3.$('button[data-testid="gift-card-car"]');
    if (carCard) {
      await carCard.click();
      await new Promise((r) => setTimeout(r, 500));
    }
    await saveScreenshots(p3, '03_mobile_pk_real_gifts_host_b_selected.png');
    await p3.close();

    // 4. Mobile Sent Gift Burst Animation
    console.log('4. Capturing 04_mobile_pk_real_gifts_sent_burst.png...');
    const p4 = await setupPage(390, 844);
    await p4.goto('http://localhost:3000/pk/gifts?preview=demo', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    const sendBtn = await p4.$('button[data-testid="send-gift-btn"]');
    if (sendBtn) {
      await sendBtn.click();
      await new Promise((r) => setTimeout(r, 600)); // capture during burst animation
    }
    await saveScreenshots(p4, '04_mobile_pk_real_gifts_sent_burst.png');
    await p4.close();

    // 5. Desktop PK Real Gifts Screen
    console.log('5. Capturing 05_desktop_pk_real_gifts.png...');
    const p5 = await setupPage(1280, 800, 1.5);
    await p5.goto('http://localhost:3000/pk/gifts?preview=demo', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));
    await saveScreenshots(p5, '05_desktop_pk_real_gifts.png');
    await p5.close();

    // 6. Desktop Battle Room with Real Gifts
    console.log('6. Capturing 06_desktop_party_room_with_pk_real_gifts.png...');
    const p6 = await setupPage(1280, 800, 1.5);
    await p6.goto('http://localhost:3000/pk/battle/00000000-0000-0000-0000-000000000603/gifts?preview=demo', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));
    await saveScreenshots(p6, '06_desktop_party_room_with_pk_real_gifts.png');
    await p6.close();

    console.log('All 6 screenshots captured successfully!');
  } catch (err) {
    console.error('Screenshot error:', err);
  } finally {
    await browser.close();
  }
}

capture();
