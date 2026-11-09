const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const ROOM_ID = '7001';
const BRAIN_DIR = 'C:/Users/HP/.gemini/antigravity/brain/d49e7e92-2cbf-4a82-b7ce-920366fb716f';
const ASSETS_DIR = path.resolve(__dirname, 'public/assets/party');

async function captureScreenshots() {
  console.log('Starting screenshot captures for Module 5.10 Party Rules...');
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

  // --- SCREENSHOT 1: Mobile Party Rules 1:1 Match ---
  console.log('Navigating to /party/rules?preview=demo...');
  await page.goto(`${BASE_URL}/party/rules?preview=demo`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 1200));

  const buf1 = await page.screenshot({ fullPage: false });
  saveBoth('01_mobile_party_rules_1to1.png', buf1);

  // --- SCREENSHOT 2: Expanded Guidelines Details ---
  console.log('Toggling expanded guidelines details...');
  const expandBtn = await page.$('button::-p-text(View All Guidelines & Policies)');
  if (expandBtn) {
    await expandBtn.click();
    await new Promise((r) => setTimeout(r, 600));
  }
  const buf2 = await page.screenshot({ fullPage: false });
  saveBoth('02_mobile_party_rules_details_expanded.png', buf2);

  // --- SCREENSHOT 3: Host Custom Guideline Modal ---
  console.log('Navigating with isHost=true to show custom guideline modal...');
  await page.goto(`${BASE_URL}/party/rules?preview=demo&isHost=true`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 1000));
  const expandBtnHost = await page.$('button::-p-text(View All Guidelines & Policies)');
  if (expandBtnHost) {
    await expandBtnHost.click();
    await new Promise((r) => setTimeout(r, 500));
  }
  const addCustomBtn = await page.$('button::-p-text(Add Custom Guideline)');
  if (addCustomBtn) {
    await addCustomBtn.click();
    await new Promise((r) => setTimeout(r, 600));
  }
  const buf3 = await page.screenshot({ fullPage: false });
  saveBoth('03_mobile_party_rules_add_custom_modal.png', buf3);

  // --- SCREENSHOT 4: Interactive I Agree Click & Toast ---
  console.log('Testing "I Agree" button submission...');
  await page.goto(`${BASE_URL}/party/rules?preview=demo&userId=screenshot_user_1`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 1000));
  const agreeBtn = await page.$('[data-action="agree-rules"]');
  if (agreeBtn) {
    await agreeBtn.click();
    await new Promise((r) => setTimeout(r, 800));
  }
  const buf4 = await page.screenshot({ fullPage: false });
  saveBoth('04_mobile_party_rules_agreed_success.png', buf4);

  // --- SCREENSHOT 5: Desktop In-Room Rules Modal Drawer ---
  console.log('Testing Desktop In-Room Rules Modal...');
  await page.setViewport({ width: 1280, height: 800, isMobile: false });
  await page.goto(`${BASE_URL}/party/room/${ROOM_ID}`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 1500));

  const rulesHeaderBtn = await page.$('[data-action="open-party-rules"]');
  if (rulesHeaderBtn) {
    await rulesHeaderBtn.click();
    await new Promise((r) => setTimeout(r, 800));
  }
  const buf5 = await page.screenshot({ fullPage: false });
  saveBoth('05_desktop_party_room_rules_modal.png', buf5);

  await browser.close();
  console.log('All 5 screenshots captured successfully! 📸');
}

captureScreenshots().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
