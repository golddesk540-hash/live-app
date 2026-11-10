const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const ROOM_ID = '7001';
const BRAIN_DIR = 'C:/Users/HP/.gemini/antigravity/brain/d49e7e92-2cbf-4a82-b7ce-920366fb716f';
const ASSETS_DIR = path.resolve(__dirname, 'public/assets/pk');

async function captureScreenshots() {
  console.log('Starting screenshot captures for Module 6.1 PK Battle Types...');
  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('poppo_terms_consent_status', 'accepted');
    localStorage.setItem('poppo_terms_consent_version', 'v4.2.0');
  });

  // Set consent cookie
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
  } catch (e) {
    console.log('Consent cookie bypass:', e.message);
  }

  const saveBoth = (filename, buffer) => {
    const brainPath = path.join(BRAIN_DIR, filename);
    const assetPath = path.join(ASSETS_DIR, filename);
    fs.writeFileSync(brainPath, buffer);
    fs.writeFileSync(assetPath, buffer);
    console.log(`Saved screenshot: ${filename} (${buffer.length} bytes)`);
  };

  // --- SCREENSHOT 1: Mobile PK Battle Types 1:1 Match (English) ---
  console.log('Navigating to /pk/battle-types?preview=demo...');
  await page.goto(`${BASE_URL}/pk/battle-types?preview=demo`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 1200));

  const buf1 = await page.screenshot({ fullPage: false });
  saveBoth('01_mobile_pk_battle_types_1to1.png', buf1);

  // --- SCREENSHOT 2: Urdu Localization View ---
  console.log('Toggling language to Urdu...');
  const langBtn = await page.$('[data-action="toggle-language"]');
  if (langBtn) {
    await langBtn.click();
    await new Promise((r) => setTimeout(r, 800));
  }
  const buf2 = await page.screenshot({ fullPage: false });
  saveBoth('02_mobile_pk_battle_types_urdu.png', buf2);

  // Reset to English
  if (langBtn) {
    await langBtn.click();
    await new Promise((r) => setTimeout(r, 400));
  }

  // --- SCREENSHOT 3: Locked 4-Host Attempt Toast ---
  console.log('Clicking locked 4-Host card to test locked toast...');
  const lockedCard = await page.$('[data-battle-type="4_host"]');
  if (lockedCard) {
    await lockedCard.click();
    await new Promise((r) => setTimeout(r, 800));
  }
  const buf3 = await page.screenshot({ fullPage: false });
  saveBoth('03_mobile_pk_battle_types_locked_toast.png', buf3);

  // --- SCREENSHOT 4: Continue 1v1 Submitted Success Toast ---
  console.log('Clicking Continue button to select 1v1 battle type...');
  const continueBtn = await page.$('[data-action="continue"]');
  if (continueBtn) {
    await continueBtn.click();
    await new Promise((r) => setTimeout(r, 800));
  }
  const buf4 = await page.screenshot({ fullPage: false });
  saveBoth('04_mobile_pk_battle_types_continue_submitted.png', buf4);

  // --- SCREENSHOT 5: Desktop In-Room PK Battle Modal Drawer ---
  console.log('Testing Desktop In-Room PK Modal...');
  await page.setViewport({ width: 1280, height: 800, isMobile: false });
  await page.goto(`${BASE_URL}/party/room/${ROOM_ID}`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 1500));

  const pkHeaderBtn = await page.$('[data-action="open-pk-battle"]');
  if (pkHeaderBtn) {
    await pkHeaderBtn.click();
    await new Promise((r) => setTimeout(r, 800));
  }
  const buf5 = await page.screenshot({ fullPage: false });
  saveBoth('05_desktop_party_room_pk_modal.png', buf5);

  await browser.close();
  console.log('All 5 screenshots captured successfully! 📸');
}

captureScreenshots().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
