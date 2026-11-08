const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { Pool } = require('pg');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join('d:', 'popo live', 'docs', 'screenshots', 'phase2_prompt10');
const brainDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const pool = new Pool({
    connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  });

  // Query or create demo user
  let uRows = await pool.query("SELECT id, poppo_id, email, nickname FROM popolive.users WHERE poppo_id = '88992211' LIMIT 1");
  let userId = uRows.rows[0]?.id;

  if (!userId) {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('DemoPass123!', 10);
    const uIns = await pool.query(`
      INSERT INTO popolive.users (
        poppo_id, email, password_hash, nickname, avatar_url, gender, birthdate, country, country_code,
        bio, host_level, wealth_level, is_profile_completed, is_adult_verified, status, preferred_language
      ) VALUES (
        '88992211', 'sara.streamer@popolive.com', $1, 'Sara Khan',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        'female', '1998-08-15', 'Pakistan', 'PK', 'Daily Top Live Streamer & Influencer', 12, 8, true, true, 'active', 'en'
      ) RETURNING id
    `, [hash]);
    userId = uIns.rows[0].id;
  }

  // Clear previous closure requests for this user so page starts clean
  await pool.query('DELETE FROM popolive.account_closure_requests WHERE user_id = $1', [userId]);

  // Insert active session
  const token = 'closure_screenshot_token_' + Date.now();
  await pool.query(`
    INSERT INTO popolive.sessions (
      user_id, session_token, device_type, browser_name, os_name, location, expires_at, is_revoked
    ) VALUES (
      $1, $2, 'mobile', 'Edge Mobile', 'Android 14', 'Islamabad, Pakistan', CURRENT_TIMESTAMP + INTERVAL '7 days', false
    )
  `, [userId, token]);

  await pool.end();

  // Obtain signed consent cookie
  const consentRes = await fetch('http://localhost:3000/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'closure_screenshot_anon_' + Date.now(),
    }),
  });
  const termsRaw = consentRes.headers.get('set-cookie')?.split(';')[0];
  const termsValue = termsRaw ? termsRaw.substring('poppo_terms_consent='.length) : '';

  console.log('Launching Edge for screenshot capture...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Set cookies
  await page.setCookie(
    { name: 'poppo_session', value: token, domain: 'localhost', path: '/' },
    { name: 'poppo_terms_consent', value: termsValue, domain: 'localhost', path: '/' }
  );

  // 1. Mobile Closure Hero (matches 02_10_account_closure.png)
  console.log('Capturing 01_mobile_closure_hero.png...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/account/close', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));
  const shot1 = path.join(outDir, '01_mobile_closure_hero.png');
  await page.screenshot({ path: shot1 });

  // 2. Desktop Closure Page
  console.log('Capturing 02_desktop_closure.png...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/account/close', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));
  const shot2 = path.join(outDir, '02_desktop_closure.png');
  await page.screenshot({ path: shot2 });

  // 3. Mobile Confirmation Modal
  console.log('Capturing 03_mobile_closure_confirm.png...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/account/close', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));
  // Click checkbox to enable button
  await page.click('input[type="checkbox"]');
  await new Promise((r) => setTimeout(r, 400));
  // Click Request Closure button
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Request Closure')) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 600));
  const shot3 = path.join(outDir, '03_mobile_closure_confirm.png');
  await page.screenshot({ path: shot3 });

  // 4. Submit closure request via API so status page has real data
  console.log('Creating demo closure request for status screenshot...');
  const pool2 = new Pool({
    connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  });
  const reqNum = 'CR-20261108-7712';
  const cRes = await pool2.query(`
    INSERT INTO popolive.account_closure_requests (
      request_number, user_id, reason, additional_explanation, status, requested_date
    ) VALUES (
      $1, $2, 'no_longer_use', 'Taking a temporary hiatus from broadcasting.', 'pending', CURRENT_TIMESTAMP
    ) RETURNING id
  `, [reqNum, userId]);
  await pool2.query(`
    INSERT INTO popolive.closure_audit_records (
      request_id, user_id, action, previous_status, new_status, user_agent
    ) VALUES (
      $1, $2, 'request_submitted', NULL, 'pending', 'Edge Mobile / Android 14'
    )
  `, [cRes.rows[0].id, userId]);
  await pool2.end();

  // 5. Mobile Status Page
  console.log('Capturing 04_mobile_closure_status.png...');
  await page.goto('http://localhost:3000/account/close/status', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));
  const shot4 = path.join(outDir, '04_mobile_closure_status.png');
  await page.screenshot({ path: shot4 });

  // 6. Mobile Urdu localized page
  console.log('Capturing 05_mobile_closure_urdu.png...');
  await page.goto('http://localhost:3000/account/close', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));
  // Click Urdu language toggle
  const langButtons = await page.$$('button');
  for (const b of langButtons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('اردو')) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 600));
  const shot5 = path.join(outDir, '05_mobile_closure_urdu.png');
  await page.screenshot({ path: shot5 });

  await browser.close();

  // Copy screenshots to brain directory for artifacts
  const files = [
    '01_mobile_closure_hero.png',
    '02_desktop_closure.png',
    '03_mobile_closure_confirm.png',
    '04_mobile_closure_status.png',
    '05_mobile_closure_urdu.png',
  ];

  for (const f of files) {
    const src = path.join(outDir, f);
    const dest = path.join(brainDir, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Copied ${f} to artifacts folder`);
    }
  }

  console.log('✅ ALL SCREENSHOTS CAPTURED AND COPIED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('💥 Screenshot capture failed:', err);
  process.exit(1);
});
