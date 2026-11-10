const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EXECUTABLE_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const BRAIN_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';
const ASSETS_DIR = path.join(__dirname, 'public', 'assets', 'pk');

async function capture() {
  console.log('Starting Puppeteer for PK Score & Timer screenshots...');
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

  // 1. Mobile 1:1 Match matching 06_03_score_and_timer.png
  {
    console.log('Capturing 01_mobile_pk_score_timer_normal.png...');
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/score-timer', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));

    const file1 = '01_mobile_pk_score_timer_normal.png';
    await page.screenshot({ path: path.join(BRAIN_DIR, file1) });
    await page.screenshot({ path: path.join(ASSETS_DIR, file1) });
    console.log(`✅ Captured: ${file1}`);
    await page.close();
  }

  // 2. Mobile Quick Gift Modal open
  {
    console.log('Capturing 02_mobile_pk_score_timer_quick_gift.png...');
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/score-timer', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1200));

    // Click gift button
    await page.evaluate(() => {
      const giftBtn = document.querySelector('button[title="Send Points / Gift"]');
      if (giftBtn) giftBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const file2 = '02_mobile_pk_score_timer_quick_gift.png';
    await page.screenshot({ path: path.join(BRAIN_DIR, file2) });
    await page.screenshot({ path: path.join(ASSETS_DIR, file2) });
    console.log(`✅ Captured: ${file2}`);
    await page.close();
  }

  // 3. Mobile Score Animation / Floating Points Active
  {
    console.log('Capturing 03_mobile_pk_score_timer_floating_points.png...');
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/score-timer', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));

    // Send points to trigger animation
    await page.evaluate(() => {
      const giftBtn = document.querySelector('button[title="Send Points / Gift"]');
      if (giftBtn) giftBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    await page.evaluate(() => {
      const starBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('+500'));
      if (starBtn) starBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));

    const file3 = '03_mobile_pk_score_timer_floating_points.png';
    await page.screenshot({ path: path.join(BRAIN_DIR, file3) });
    await page.screenshot({ path: path.join(ASSETS_DIR, file3) });
    console.log(`✅ Captured: ${file3}`);
    await page.close();
  }

  // 4. Mobile Urdu (RTL layout)
  {
    console.log('Capturing 04_mobile_pk_score_timer_urdu.png...');
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/score-timer', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));

    // Toggle language
    await page.evaluate(() => {
      const langBtn = document.querySelector('button[title="Toggle Language"]');
      if (langBtn) langBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const file4 = '04_mobile_pk_score_timer_urdu.png';
    await page.screenshot({ path: path.join(BRAIN_DIR, file4) });
    await page.screenshot({ path: path.join(ASSETS_DIR, file4) });
    console.log(`✅ Captured: ${file4}`);
    await page.close();
  }

  // 5. Desktop PK Score & Timer View
  {
    console.log('Capturing 05_desktop_pk_score_timer.png...');
    const page = await setupPage(1440, 900, 1.5);
    await page.goto('http://localhost:3000/pk/score-timer', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1200));

    const file5 = '05_desktop_pk_score_timer.png';
    await page.screenshot({ path: path.join(BRAIN_DIR, file5) });
    await page.screenshot({ path: path.join(ASSETS_DIR, file5) });
    console.log(`✅ Captured: ${file5}`);
    await page.close();
  }

  // 6. Desktop Live Stream / Party Room with PK Score Split
  {
    console.log('Capturing 06_desktop_party_room_with_pk_split.png...');
    const page = await setupPage(1440, 900, 1.5);
    await page.goto('http://localhost:3000/party/room/7001', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));

    const file6 = '06_desktop_party_room_with_pk_split.png';
    await page.screenshot({ path: path.join(BRAIN_DIR, file6) });
    await page.screenshot({ path: path.join(ASSETS_DIR, file6) });
    console.log(`✅ Captured: ${file6}`);
    await page.close();
  }

  await browser.close();
  console.log('🎉 All 6 Module 6.3 screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Puppeteer capture error:', err);
  process.exit(1);
});
