const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { Pool } = require('pg');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join('d:', 'popo live', 'docs', 'screenshots', 'phase2_prompt9');

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const pool = new Pool({
    connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  });

  // Use demo user
  let uRows = await pool.query("SELECT id, poppo_id, email, nickname FROM popolive.users WHERE poppo_id = '88992211' LIMIT 1");
  let userId = uRows.rows[0]?.id;

  if (!userId) {
    const uIns = await pool.query(`
      INSERT INTO popolive.users (
        poppo_id, email, nickname, avatar_url, gender, birthdate, country, country_code,
        bio, host_level, wealth_level, is_profile_completed, is_adult_verified, status, preferred_language
      ) VALUES (
        '88992211', 'sara.streamer@popolive.com', 'Sara Khan',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        'female', '1998-08-15', 'Pakistan', 'PK', 'Daily Top Live Streamer & Influencer', 12, 8, true, true, 'active', 'en'
      ) RETURNING id
    `);
    userId = uIns.rows[0].id;
  }

  // Ensure active session
  const token = 'account_screenshot_token_' + Date.now();
  await pool.query(`
    INSERT INTO popolive.sessions (
      user_id, session_token, device_type, browser_name, os_name, location, expires_at, is_revoked
    ) VALUES (
      $1, $2, 'desktop', 'Microsoft Edge', 'Windows 11', 'Islamabad, Pakistan', CURRENT_TIMESTAMP + INTERVAL '7 days', false
    )
  `, [userId, token]);

  // Insert a secondary mobile session
  await pool.query(`
    INSERT INTO popolive.sessions (
      user_id, session_token, device_type, browser_name, os_name, location, expires_at, is_revoked
    ) VALUES (
      $1, $2, 'mobile', 'Safari Mobile', 'iOS 17', 'Lahore, Pakistan', CURRENT_TIMESTAMP + INTERVAL '5 days', false
    )
  `, [userId, token + '_mobile']);

  // Insert security events
  await pool.query(`
    INSERT INTO popolive.security_events (user_id, event_type, description, device_info)
    VALUES
      ($1, 'login', 'Successful web login from Islamabad (Microsoft Edge)', 'Windows 11'),
      ($1, 'pin_set', 'Security PIN successfully activated', 'Windows 11'),
      ($1, 'profile_update', 'Profile updated with bio and country', 'iOS 17')
    ON CONFLICT DO NOTHING
  `, [userId]);

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
      anonymousSessionId: 'account_screenshot_anon_' + Date.now(),
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

  // Set cookies
  await page.setCookie(
    { name: 'poppo_session', value: token, domain: 'localhost', path: '/' },
    { name: 'poppo_terms_consent', value: termsValue, domain: 'localhost', path: '/' }
  );

  // 1. Mobile Web Account (matches 02_09_web_account.png)
  console.log('Capturing 01_mobile_web_account_hero.png...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/account', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '01_mobile_web_account_hero.png') });

  // 2. Desktop Web Account Dashboard
  console.log('Capturing 02_desktop_web_account_dashboard.png...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/account?tab=overview', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '02_desktop_web_account_dashboard.png') });

  // 3. Desktop Login Sessions Tab
  console.log('Capturing 03_desktop_account_sessions.png...');
  await page.goto('http://localhost:3000/account?tab=sessions', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '03_desktop_account_sessions.png') });

  // 4. Mobile Security & Password Change Tab
  console.log('Capturing 04_mobile_account_security.png...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/account?tab=security', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '04_mobile_account_security.png') });

  // 5. Mobile Account Activity & Audit Log Tab
  console.log('Capturing 05_mobile_account_activity.png...');
  await page.goto('http://localhost:3000/account?tab=activity', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '05_mobile_account_activity.png') });

  // 6. Mobile Edit Profile Tab
  console.log('Capturing 06_mobile_account_edit.png...');
  await page.goto('http://localhost:3000/account?tab=edit', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '06_mobile_account_edit.png') });

  await browser.close();
  console.log('🎉 All 6 screenshots captured successfully in:', outDir);
}

main().catch((err) => {
  console.error('Screenshot script error:', err);
  process.exit(1);
});
