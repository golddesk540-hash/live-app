const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join('C:', 'Users', 'HP', '.gemini', 'antigravity', 'brain', 'd49e7e92-2cbf-4a82-b7ce-920366fb716f', 'screenshots', 'd6_p2');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('Obtaining consent cookie...');
  let termsValue = '';
  try {
    const consentRes = await fetch('http://localhost:3000/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'accept',
        termsAccepted: true,
        privacyAccepted: true,
        isAdultConfirmed: true,
        anonymousSessionId: 'disc_shot_anon_' + Date.now(),
      }),
    });
    const termsRaw = consentRes.headers.get('set-cookie')?.split(';')[0];
    termsValue = termsRaw ? termsRaw.substring('poppo_terms_consent='.length) : '';
  } catch (e) {
    console.warn('Consent fetch failed:', e.message);
  }

  console.log('Launching browser with Edge executable:', edgePath);
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900'],
  });

  try {
    const page = await browser.newPage();

    if (termsValue) {
      await page.setCookie({
        name: 'poppo_terms_consent',
        value: termsValue,
        domain: 'localhost',
        path: '/',
      });
    }

    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('poppo_terms_consent_version', 'v4.2.0');
      localStorage.setItem('poppo_terms_consent_status', 'accepted');
    });

    // 1. Desktop 1440x900 - Live Explore Home
    console.log('Capturing 01_desktop_live_discovery.png...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
    await page.goto('http://localhost:3000/live', { waitUntil: 'networkidle2' });
    await delay(1200);
    await page.screenshot({ path: path.join(outDir, '01_desktop_live_discovery.png') });

    // 2. Desktop 1440x900 - User Avatar Dropdown Open
    console.log('Capturing 02_desktop_user_dropdown.png...');
    const userMenuButton = await page.$('button[aria-label="User Profile Menu"]');
    if (userMenuButton) {
      await userMenuButton.click();
      await delay(500);
      await page.screenshot({ path: path.join(outDir, '02_desktop_user_dropdown.png') });
      await userMenuButton.click(); // Close
      await delay(300);
    }

    // 3. Desktop 1440x900 - App Download Modal Open
    console.log('Capturing 03_desktop_get_app_modal.png...');
    const getAppButton = await page.$('button[title="Popo Live Desktop Client"]');
    if (getAppButton) {
      await getAppButton.click();
      await delay(600);
      await page.screenshot({ path: path.join(outDir, '03_desktop_get_app_modal.png') });
      const closeBtn = await page.$('button[aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
      await delay(400);
    }

    // 4. Laptop 1024x768 - Live
    console.log('Capturing 04_laptop_live_view.png...');
    await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 1.5 });
    await page.goto('http://localhost:3000/live', { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(outDir, '04_laptop_live_view.png') });

    // 5. Tablet 768x1024 - Compact Rail
    console.log('Capturing 05_tablet_compact_rail.png...');
    await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 1.5 });
    await page.goto('http://localhost:3000/live', { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(outDir, '05_tablet_compact_rail.png') });

    // 6. Mobile 390x844 - Mobile Navigation Bar
    console.log('Capturing 06_mobile_bottom_nav.png...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:3000/live', { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(outDir, '06_mobile_bottom_nav.png') });

    // 7. Desktop 1440x900 - Party Discovery Tab Active
    console.log('Capturing 07_desktop_party_discovery.png...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
    await page.goto('http://localhost:3000/party', { waitUntil: 'networkidle2' });
    await delay(1200);
    await page.screenshot({ path: path.join(outDir, '07_desktop_party_discovery.png') });

    // 8. Desktop 1440x900 - Following Broadcasters Tab Active
    console.log('Capturing 08_desktop_following_feed.png...');
    await page.goto('http://localhost:3000/live/following', { waitUntil: 'networkidle2' });
    await delay(1200);
    await page.screenshot({ path: path.join(outDir, '08_desktop_following_feed.png') });

    console.log('All screenshots successfully captured in:', outDir);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Screenshot script error:', err);
  process.exit(1);
});
