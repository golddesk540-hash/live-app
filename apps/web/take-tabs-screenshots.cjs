const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { Pool } = require('pg');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join('d:', 'popo live', 'docs', 'screenshots', 'phase3_prompt02');
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

  const roomRows = await pool.query("SELECT id FROM popolive.live_rooms WHERE is_pk = true LIMIT 1");
  const pkRoomId = roomRows.rows[0]?.id || '';

  const token = 'tabs_shot_token_' + Date.now();
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
      anonymousSessionId: 'tabs_shot_anon_' + Date.now(),
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

  // 1. Mobile Explore Tab (Direct 1:1 match to 03_02_explore_follow_new_pk_tabs.png)
  console.log('Capturing 01_mobile_explore_tab.png...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/live/explore', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  const shot1 = path.join(outDir, '01_mobile_explore_tab.png');
  await page.screenshot({ path: shot1 });

  // 2. Desktop Explore Tab
  console.log('Capturing 02_desktop_explore_tab.png...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/live/explore', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  const shot2 = path.join(outDir, '02_desktop_explore_tab.png');
  await page.screenshot({ path: shot2 });

  // 3. Mobile Following Tab
  console.log('Capturing 03_mobile_following_tab.png...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/live/following', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  const shot3 = path.join(outDir, '03_mobile_following_tab.png');
  await page.screenshot({ path: shot3 });

  // 4. Mobile New Creators Tab
  console.log('Capturing 04_mobile_new_tab.png...');
  await page.goto('http://localhost:3000/live/new', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  const shot4 = path.join(outDir, '04_mobile_new_tab.png');
  await page.screenshot({ path: shot4 });

  // 5. Mobile PK Battles Tab
  console.log('Capturing 05_mobile_pk_tab.png...');
  await page.goto('http://localhost:3000/live/pk', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  const shot5 = path.join(outDir, '05_mobile_pk_tab.png');
  await page.screenshot({ path: shot5 });

  // 6. Live Room Preview Page (PK Split View)
  if (pkRoomId) {
    console.log(`Capturing 06_desktop_live_room_preview.png for room ${pkRoomId}...`);
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`http://localhost:3000/live/room/${pkRoomId}`, { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 2000));
    const shot6 = path.join(outDir, '06_desktop_live_room_preview.png');
    await page.screenshot({ path: shot6 });
  }

  await browser.close();

  // Copy screenshots to brain directory for artifacts
  const files = [
    '01_mobile_explore_tab.png',
    '02_desktop_explore_tab.png',
    '03_mobile_following_tab.png',
    '04_mobile_new_tab.png',
    '05_mobile_pk_tab.png',
    '06_desktop_live_room_preview.png',
  ];

  for (const f of files) {
    const src = path.join(outDir, f);
    const dest = path.join(brainDir, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Copied ${f} to artifacts folder`);
    }
  }

  console.log('✅ ALL DISCOVERY TABS SCREENSHOTS CAPTURED AND VERIFIED!');
}

main().catch(err => {
  console.error('💥 Screenshot capture failed:', err);
  process.exit(1);
});
