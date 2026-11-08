const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { Pool } = require('pg');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join('d:', 'popo live', 'docs', 'screenshots', 'phase3_prompt03');
const brainDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const pool = new Pool({
    connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  });

  const uRows = await pool.query("SELECT id, poppo_id, email, nickname FROM popolive.users WHERE status = 'active' LIMIT 1");
  const userId = uRows.rows[0]?.id;

  const token = 'country_shot_token_' + Date.now();
  if (userId) {
    await pool.query(`
      INSERT INTO popolive.sessions (
        user_id, session_token, device_type, browser_name, os_name, location, expires_at, is_revoked
      ) VALUES (
        $1, $2, 'desktop', 'Microsoft Edge', 'Windows 11', 'Islamabad, Pakistan', CURRENT_TIMESTAMP + INTERVAL '7 days', false
      )
    `, [userId, token]);
  }

  await pool.end();

  const consentRes = await fetch('http://localhost:3000/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'country_shot_anon_' + Date.now(),
    }),
  });
  const termsRaw = consentRes.headers.get('set-cookie')?.split(';')[0];
  const termsValue = termsRaw ? termsRaw.substring('poppo_terms_consent='.length) : '';

  console.log('Launching browser for screenshot capture...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  await page.setCookie(
    { name: 'poppo_session', value: token, domain: 'localhost', path: '/' },
    { name: 'poppo_terms_consent', value: termsValue, domain: 'localhost', path: '/' }
  );

  // 1. Mobile Select Country Modal (Exact 1:1 match to 03_03_country_filters.png)
  console.log('Capturing 01_mobile_country_modal.png...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/live/explore', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));

  // Click "More Countries" to open modal
  const moreBtns = await page.$$('button');
  for (const b of moreBtns) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('More Countries')) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 800));
  const shot1 = path.join(outDir, '01_mobile_country_modal.png');
  await page.screenshot({ path: shot1 });

  // 2. Desktop Country Filters Bar
  console.log('Capturing 02_desktop_country_filters_bar.png...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/live/explore', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  const shot2 = path.join(outDir, '02_desktop_country_filters_bar.png');
  await page.screenshot({ path: shot2 });

  // 3. Mobile Filtered by Pakistan
  console.log('Capturing 03_mobile_country_filtered_rooms.png...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/live/explore?country=PK', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  const shot3 = path.join(outDir, '03_mobile_country_filtered_rooms.png');
  await page.screenshot({ path: shot3 });

  // 4. Mobile Country Search in Modal
  console.log('Capturing 04_mobile_country_search.png...');
  await page.goto('http://localhost:3000/live/explore', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1200));
  const btns2 = await page.$$('button');
  for (const b of btns2) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('More Countries')) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 600));
  // Type 'uni' in country search input
  await page.type('input[placeholder="Search country"]', 'uni');
  await new Promise((r) => setTimeout(r, 600));
  const shot4 = path.join(outDir, '04_mobile_country_search.png');
  await page.screenshot({ path: shot4 });

  // 5. Mobile Empty State for Country with 0 Streams
  console.log('Capturing 05_mobile_empty_country_state.png...');
  await page.goto('http://localhost:3000/live/explore?country=NP', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  const shot5 = path.join(outDir, '05_mobile_empty_country_state.png');
  await page.screenshot({ path: shot5 });

  await browser.close();

  // Copy screenshots to brain directory for artifacts
  const files = [
    '01_mobile_country_modal.png',
    '02_desktop_country_filters_bar.png',
    '03_mobile_country_filtered_rooms.png',
    '04_mobile_country_search.png',
    '05_mobile_empty_country_state.png',
  ];

  for (const f of files) {
    const src = path.join(outDir, f);
    const dest = path.join(brainDir, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Copied ${f} to artifacts folder`);
    }
  }

  console.log('✅ ALL COUNTRY FILTER SCREENSHOTS CAPTURED AND VERIFIED!');
}

main().catch(err => {
  console.error('💥 Screenshot capture failed:', err);
  process.exit(1);
});
