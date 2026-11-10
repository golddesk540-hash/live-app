const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EXECUTABLE_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const BRAIN_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';
const ASSETS_DIR = path.join(__dirname, 'public', 'assets', 'pk');

async function capture() {
  console.log('Starting Puppeteer for PK Reactions screenshots...');
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

  // 1. Mobile 1:1 Match to 06_08_reactions.png
  {
    console.log('Capturing 01_mobile_pk_reactions_1to1.png...');
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/reactions', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 2200)); // wait for ambient reactions & timer
    await saveScreenshots(page, '01_mobile_pk_reactions_1to1.png');
    await page.close();
  }

  // 2. Mobile Urdu RTL Layout
  {
    console.log('Capturing 02_mobile_pk_reactions_urdu.png...');
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/reactions?lang=ur', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 2200));
    await saveScreenshots(page, '02_mobile_pk_reactions_urdu.png');
    await page.close();
  }

  // 3. Mobile Reaction Panel Open (10 Approved Catalog Reactions)
  {
    console.log('Capturing 03_mobile_pk_reactions_panel_open.png...');
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/reactions', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));

    // Click the "..." button to open the reaction panel
    const moreBtn = await page.$('button[title="Reactions"]');
    if (moreBtn) {
      await moreBtn.click();
      await new Promise((r) => setTimeout(r, 800));
    }
    await saveScreenshots(page, '03_mobile_pk_reactions_panel_open.png');
    await page.close();
  }

  // 4. Mobile Targeted Reaction (Host A / Sara Selected & Reacting)
  {
    console.log('Capturing 04_mobile_pk_reactions_host_side_target.png...');
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/reactions', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));

    // Open panel
    const moreBtn = await page.$('button[title="Reactions"]');
    if (moreBtn) {
      await moreBtn.click();
      await new Promise((r) => setTimeout(r, 600));

      // Click "Sara" (Host A target)
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await page.evaluate((el) => el.textContent, btn);
        if (text && text.trim() === 'Sara') {
          await btn.click();
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 400));

      // Click Heart reaction button
      const allButtons = await page.$$('div.grid button');
      if (allButtons.length > 0) {
        await allButtons[0].click();
      }
      await new Promise((r) => setTimeout(r, 900));
    }
    await saveScreenshots(page, '04_mobile_pk_reactions_host_side_target.png');
    await page.close();
  }

  // 5. Desktop PK Reactions View
  {
    console.log('Capturing 05_desktop_pk_reactions.png...');
    const page = await setupPage(1280, 800, 1.5);
    await page.goto('http://localhost:3000/pk/reactions', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 2200));
    await saveScreenshots(page, '05_desktop_pk_reactions.png');
    await page.close();
  }

  // 6. Desktop Party Room / PK Battle with Reactions View
  {
    console.log('Capturing 06_desktop_party_room_with_pk_reactions.png...');
    const page = await setupPage(1280, 800, 1.5);
    await page.goto('http://localhost:3000/pk/battle/00000000-0000-0000-0000-000000000603/reactions', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 2200));
    await saveScreenshots(page, '06_desktop_party_room_with_pk_reactions.png');
    await page.close();
  }

  await browser.close();
  console.log('All 6 PK Reactions screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
