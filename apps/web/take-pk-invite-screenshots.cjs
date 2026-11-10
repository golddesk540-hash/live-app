const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EXECUTABLE_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const BRAIN_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';
const ASSETS_DIR = path.join(__dirname, 'public', 'assets', 'pk');

async function capture() {
  console.log('Starting Puppeteer for PK Starting Battle screenshots...');
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

  // 1. Mobile 1:1 Match (Invite Tab) matching 06_02_starting_a_battle_invite_random.png
  {
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/start?preview=demo', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-watermark="6.2-invite-random"]', { timeout: 10000 });
    await page.waitForSelector('[data-action="invite-host"]', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1200));

    const file1 = '01_mobile_pk_invite_1to1.png';
    await page.screenshot({ path: path.join(BRAIN_DIR, file1) });
    await page.screenshot({ path: path.join(ASSETS_DIR, file1) });
    console.log(`✅ Captured: ${file1}`);
    await page.close();
  }

  // 2. Mobile Search Filtered (Filtering by "Ayesha")
  {
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/start?preview=demo', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-input="host-search"]', { timeout: 10000 });
    await page.type('[data-input="host-search"]', 'Ayesha');
    await new Promise(r => setTimeout(r, 1000));

    const file2 = '02_mobile_pk_invite_search.png';
    await page.screenshot({ path: path.join(BRAIN_DIR, file2) });
    await page.screenshot({ path: path.join(ASSETS_DIR, file2) });
    console.log(`✅ Captured: ${file2}`);
    await page.close();
  }

  // 3. Outgoing Invitation Waiting Modal (with 30s countdown and pulse)
  {
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/start?preview=demo', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-action="invite-host"]', { timeout: 10000 });
    await page.click('[data-action="invite-host"]');
    await new Promise(r => setTimeout(r, 1500));

    const file3 = '03_mobile_pk_invite_waiting_modal.png';
    await page.screenshot({ path: path.join(BRAIN_DIR, file3) });
    await page.screenshot({ path: path.join(ASSETS_DIR, file3) });
    console.log(`✅ Captured: ${file3}`);
    await page.close();
  }

  // 4. Random Matchmaking Tab (with pulsing sphere & radar visualizer)
  {
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/start?preview=demo', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-tab="random"]', { timeout: 10000 });
    await page.click('[data-tab="random"]');
    await new Promise(r => setTimeout(r, 800));
    await page.waitForSelector('[data-action="start-random-match"]', { timeout: 5000 });
    await page.click('[data-action="start-random-match"]');
    await new Promise(r => setTimeout(r, 1500));

    const file4 = '04_mobile_pk_random_matchmaking.png';
    await page.screenshot({ path: path.join(BRAIN_DIR, file4) });
    await page.screenshot({ path: path.join(ASSETS_DIR, file4) });
    console.log(`✅ Captured: ${file4}`);
    await page.close();
  }

  // 5. Mobile Urdu Localization (RTL Layout)
  {
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/start?preview=demo', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-action="invite-host"]', { timeout: 10000 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const urduBtn = btns.find(b => b.textContent && b.textContent.includes('اردو'));
      if (urduBtn) urduBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    const file5 = '05_mobile_pk_invite_urdu.png';
    await page.screenshot({ path: path.join(BRAIN_DIR, file5) });
    await page.screenshot({ path: path.join(ASSETS_DIR, file5) });
    console.log(`✅ Captured: ${file5}`);
    await page.close();
  }

  // 6. Desktop In-Room Party Drawer with PK Flow
  {
    const page = await setupPage(1440, 900, 1);
    await page.goto('http://localhost:3000/party/room/7001?preview=demo', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-action="open-pk-battle"]', { timeout: 10000 });
    await page.click('[data-action="open-pk-battle"]');
    await new Promise(r => setTimeout(r, 1200));

    const file6 = '06_desktop_party_room_pk_flow.png';
    await page.screenshot({ path: path.join(BRAIN_DIR, file6) });
    await page.screenshot({ path: path.join(ASSETS_DIR, file6) });
    console.log(`✅ Captured: ${file6}`);
    await page.close();
  }

  await browser.close();
  console.log('All 6 screenshots captured successfully!');
}

capture().catch(console.error);
