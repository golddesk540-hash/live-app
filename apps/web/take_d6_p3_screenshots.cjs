const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join('C:', 'Users', 'HP', '.gemini', 'antigravity', 'brain', 'd49e7e92-2cbf-4a82-b7ce-920366fb716f', 'screenshots', 'd6_p3');

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
        anonymousSessionId: 'disc_shot_p3_' + Date.now(),
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
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--allow-running-insecure-content',
      '--window-size=1440,1100'
    ],
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

    // 1a. Desktop 1440x1000 - Live Discovery Page Top (Chips + Carousel)
    console.log('Capturing 01b_live_discovery_page_top.png...');
    await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1.5 });
    await page.goto('http://localhost:3000/live', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await delay(1200);
    await page.screenshot({ path: path.join(outDir, '01b_live_discovery_page_top.png') });

    // 1. Desktop 1440x1000 - Live Discovery All Countries (scrolled to Live Now grid)
    console.log('Capturing 01_live_discovery_all_countries.png...');
    // Scroll to the Live Now section so all cards are in view
    await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Live Now') || h.textContent.includes('لائیو'));
      if (heading) {
        heading.scrollIntoView({ behavior: 'instant', block: 'start' });
      } else {
        window.scrollTo(0, 500);
      }
    });
    await delay(800);
    await page.screenshot({ path: path.join(outDir, '01_live_discovery_all_countries.png') });

    // 2. Desktop 1440x1000 - Country Filter: Pakistan (PK) Active
    console.log('Capturing 02_live_discovery_country_filter_pk.png...');
    // Scroll back to top to click PK
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(400);

    const pkButtons = await page.$$('button');
    for (const btn of pkButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Pakistan')) {
        await btn.click();
        break;
      }
    }
    await delay(600);
    // Scroll down to cards to see filtered list
    await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Live Now') || h.textContent.includes('لائیو'));
      if (heading) heading.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await delay(600);
    await page.screenshot({ path: path.join(outDir, '02_live_discovery_country_filter_pk.png') });

    // 3. Desktop 1440x1000 - Country Filter: Philippines (PH) Empty State
    console.log('Capturing 03_live_discovery_country_filter_empty.png...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(400);

    const phButtons = await page.$$('button');
    for (const btn of phButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Philippines')) {
        await btn.click();
        break;
      }
    }
    await delay(600);
    // Scroll down to see empty state
    await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Live Now') || h.textContent.includes('لائیو'));
      if (heading) heading.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await delay(600);
    await page.screenshot({ path: path.join(outDir, '03_live_discovery_country_filter_empty.png') });

    // 4. Desktop 1440x1000 - More Countries Modal Open
    console.log('Capturing 04_live_discovery_more_countries_modal.png...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(400);

    const moreCountriesBtn = await page.$$('button');
    for (const btn of moreCountriesBtn) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('More Countries')) {
        await btn.click();
        break;
      }
    }
    await delay(600);
    await page.screenshot({ path: path.join(outDir, '04_live_discovery_more_countries_modal.png') });

    // Close modal
    const closeBtn = await page.$('button[title="Close"]');
    if (closeBtn) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await delay(400);

    // 5. Desktop 1440x1000 - Room Card 3-Dots Action Menu Open
    console.log('Capturing 05_room_card_hover_and_menu.png...');
    // Reset to Popular / All
    await page.goto('http://localhost:3000/live', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await delay(1000);
    await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Live Now') || h.textContent.includes('لائیو'));
      if (heading) heading.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await delay(600);

    const actionButtons = await page.$$('button[aria-label="Room actions"]');
    if (actionButtons.length > 0) {
      await actionButtons[0].click();
      await delay(500);
      await page.screenshot({ path: path.join(outDir, '05_room_card_hover_and_menu.png') });
    }

    // 6. Desktop 1440x1000 - Live Room Viewer via Card Click (/live/room/room_001)
    console.log('Capturing 06_viewer_room_from_card_click.png...');
    await page.goto('http://localhost:3000/live/room/room_001', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await delay(1800);
    await page.screenshot({ path: path.join(outDir, '06_viewer_room_from_card_click.png') });

    // 7. Mobile 390x844 - Responsive 2-Column Live Discovery
    console.log('Capturing 07_responsive_mobile_live_discovery.png...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:3000/live', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await delay(1000);
    await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Live Now') || h.textContent.includes('لائیو'));
      if (heading) heading.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await delay(800);
    await page.screenshot({ path: path.join(outDir, '07_responsive_mobile_live_discovery.png') });

    console.log('All 7 D6-P3 screenshots captured successfully in:', outDir);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Screenshot script failed:', err);
  process.exit(1);
});
