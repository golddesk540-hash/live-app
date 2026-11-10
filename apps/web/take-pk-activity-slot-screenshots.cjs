const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EXECUTABLE_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const BRAIN_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';
const ASSETS_DIR = path.join(__dirname, 'public', 'assets', 'pk');

async function capture() {
  console.log('Starting Puppeteer for PK Activity Slot screenshots...');
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

  // 1. Mobile 1:1 Match to 06_07_activity_slot.png
  {
    console.log('Capturing 01_mobile_pk_activity_slot_1to1.png...');
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/activity-slot', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1500));

    const file1 = '01_mobile_pk_activity_slot_1to1.png';
    await page.screenshot({ path: path.join(BRAIN_DIR, file1) });
    await page.screenshot({ path: path.join(ASSETS_DIR, file1) });
    console.log(`✅ Captured: ${file1}`);
    await page.close();
  }

  // 2. Mobile Urdu (RTL View)
  {
    console.log('Capturing 02_mobile_pk_activity_slot_urdu.png...');
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/activity-slot', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));

    // Toggle language to Urdu
    await page.evaluate(() => {
      const langBtn = document.querySelector('button[title="Toggle Language"]');
      if (langBtn) langBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const file2 = '02_mobile_pk_activity_slot_urdu.png';
    await page.screenshot({ path: path.join(BRAIN_DIR, file2) });
    await page.screenshot({ path: path.join(ASSETS_DIR, file2) });
    console.log(`✅ Captured: ${file2}`);
    await page.close();
  }

  // 3. Mobile Details Modal with Linked Battles
  {
    console.log('Capturing 03_mobile_pk_activity_slot_details_modal.png...');
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/activity-slot', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));

    // Click "View Activity Details & Linked Battles"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const detailsBtn = buttons.find((b) => b.textContent && b.textContent.includes('View Activity Details'));
      if (detailsBtn) detailsBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const file3 = '03_mobile_pk_activity_slot_details_modal.png';
    await page.screenshot({ path: path.join(BRAIN_DIR, file3) });
    await page.screenshot({ path: path.join(ASSETS_DIR, file3) });
    console.log(`✅ Captured: ${file3}`);
    await page.close();
  }

  // 4. Mobile Joined & Progress Updated State
  {
    console.log('Capturing 04_mobile_pk_activity_slot_joined_progress.png...');
    const page = await setupPage(390, 844, 2);
    await page.goto('http://localhost:3000/pk/activity/00000000-0000-0000-0000-000000000608', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));

    const file4 = '04_mobile_pk_activity_slot_joined_progress.png';
    await page.screenshot({ path: path.join(BRAIN_DIR, file4) });
    await page.screenshot({ path: path.join(ASSETS_DIR, file4) });
    console.log(`✅ Captured: ${file4}`);
    await page.close();
  }

  // 5. Desktop PK Activity Slot View
  {
    console.log('Capturing 05_desktop_pk_activity_slot.png...');
    const page = await setupPage(1440, 900, 1.5);
    await page.goto('http://localhost:3000/pk/activity-slot', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1500));

    const file5 = '05_desktop_pk_activity_slot.png';
    await page.screenshot({ path: path.join(BRAIN_DIR, file5) });
    await page.screenshot({ path: path.join(ASSETS_DIR, file5) });
    console.log(`✅ Captured: ${file5}`);
    await page.close();
  }

  // 6. Desktop PK Discovery Tab with Integrated Activity Slot Banner
  {
    console.log('Capturing 06_desktop_pk_discovery_with_activity_slot.png...');
    const page = await setupPage(1440, 900, 1.5);
    await page.goto('http://localhost:3000/pk', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1500));

    const file6 = '06_desktop_pk_discovery_with_activity_slot.png';
    await page.screenshot({ path: path.join(BRAIN_DIR, file6) });
    await page.screenshot({ path: path.join(ASSETS_DIR, file6) });
    console.log(`✅ Captured: ${file6}`);
    await page.close();
  }

  await browser.close();
  console.log('🎉 All 6 Module 6.7 screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Puppeteer capture error:', err);
  process.exit(1);
});
