const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EXECUTABLE_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const BRAIN_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';
const ASSETS_DIR = path.join(__dirname, 'public', 'assets', 'pk');

async function capture() {
  console.log('Starting Puppeteer for PK Fair Play screenshots...');
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

  // 1. Mobile 1:1 Match to 06_09_fair_play_basics.png
  {
    console.log('Capturing 01_mobile_pk_fair_play_1to1.png...');
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/fair-play', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1500));
    await saveScreenshots(page, '01_mobile_pk_fair_play_1to1.png');
    await page.close();
  }

  // 2. Mobile Urdu RTL Layout
  {
    console.log('Capturing 02_mobile_pk_fair_play_urdu.png...');
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/fair-play?lang=ur', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1500));
    await saveScreenshots(page, '02_mobile_pk_fair_play_urdu.png');
    await page.close();
  }

  // 3. Mobile Abuse Report Modal Open
  {
    console.log('Capturing 03_mobile_pk_fair_play_report_modal.png...');
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/fair-play', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));

    // Click "Report violations" card
    const cards = await page.$$('div.group');
    if (cards.length >= 4) {
      await cards[3].click();
      await new Promise((r) => setTimeout(r, 800));
    }
    await saveScreenshots(page, '03_mobile_pk_fair_play_report_modal.png');
    await page.close();
  }

  // 4. Mobile Rule Card Expanded Details
  {
    console.log('Capturing 04_mobile_pk_fair_play_rule_details.png...');
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/fair-play', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));

    // Click "No fake traffic" card to expand
    const cards = await page.$$('div.group');
    if (cards.length > 0) {
      await cards[0].click();
      await new Promise((r) => setTimeout(r, 600));
    }
    await saveScreenshots(page, '04_mobile_pk_fair_play_rule_details.png');
    await page.close();
  }

  // 5. Desktop View
  {
    console.log('Capturing 05_desktop_pk_fair_play.png...');
    const page = await setupPage(1280, 800, 1.5);
    await page.goto('http://localhost:3000/pk/fair-play', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1500));
    await saveScreenshots(page, '05_desktop_pk_fair_play.png');
    await page.close();
  }

  // 6. Desktop Battle Room with Fair Play
  {
    console.log('Capturing 06_desktop_party_room_with_pk_fair_play.png...');
    const page = await setupPage(1280, 800, 1.5);
    await page.goto('http://localhost:3000/pk/battle/00000000-0000-0000-0000-000000000603/fair-play', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1500));
    await saveScreenshots(page, '06_desktop_party_room_with_pk_fair_play.png');
    await page.close();
  }

  await browser.close();
  console.log('All 6 PK Fair Play screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
