const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { Pool } = require('pg');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join('d:', 'popo live', 'docs', 'screenshots', 'phase2_prompt7');

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const pool = new Pool({
    connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  });
  await pool.query('DELETE FROM popolive.rate_limits');

  // Setup user matching reference (PIN enabled, 12 blocked users count, etc.)
  const email = 'settings.demo@popolive.com';
  let uRows = await pool.query('SELECT id FROM popolive.users WHERE email = $1', [email]);
  let userId;

  if (uRows.rows.length === 0) {
    const uIns = await pool.query(`
      INSERT INTO popolive.users (
        poppo_id, email, nickname, avatar_url, gender, birthdate, country, country_code,
        bio, host_level, wealth_level, is_profile_completed, is_adult_verified, status,
        is_pin_enabled, pin_hash, preferred_language
      ) VALUES (
        '88992211', $1, 'Sara Khan', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        'female', '1998-08-15', 'Pakistan', 'PK', 'Daily Streamer', 12, 8, true, true, 'active',
        true, '$2a$10$wK2V6P5Y4uU3rB9cW3h5E.Q1p2s3t4u5v6w7x8y9z0', 'en'
      ) RETURNING id
    `, [email]);
    userId = uIns.rows[0].id;
  } else {
    userId = uRows.rows[0].id;
    await pool.query(`
      UPDATE popolive.users SET
        nickname = 'Sara Khan',
        is_pin_enabled = true,
        preferred_language = 'en'
      WHERE id = $1
    `, [userId]);
  }

  // Ensure 12 blocked users exist for this user so Blacklist count says "12" matching reference 02_07!
  await pool.query('DELETE FROM popolive.user_blocks WHERE blocker_id = $1', [userId]);

  for (let i = 1; i <= 12; i++) {
    const dummyEmail = `blocked_${i}_${Date.now()}@dummy.com`;
    const dummyNick = `Spammer_${i}`;
    const dummyPoppo = `400010${i < 10 ? '0' + i : i}`;

    const dIns = await pool.query(`
      INSERT INTO popolive.users (poppo_id, email, nickname, avatar_url, country, status)
      VALUES ($1, $2, $3, '/avatars/default.png', 'Pakistan', 'active')
      ON CONFLICT (poppo_id) DO UPDATE SET nickname = EXCLUDED.nickname
      RETURNING id
    `, [dummyPoppo, dummyEmail, dummyNick]);

    await pool.query(`
      INSERT INTO popolive.user_blocks (blocker_id, blocked_id)
      VALUES ($1, $2) ON CONFLICT DO NOTHING
    `, [userId, dIns.rows[0].id]);
  }

  // Create session token
  const crypto = require('crypto');
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await pool.query(`
    INSERT INTO popolive.sessions (
      user_id, session_token, user_agent, ip_hash, expires_at, device_type, browser_name, os_name, location, last_active_at, is_revoked
    ) VALUES (
      $1, $2, 'Edge Headless Automation', 'hash123', $3, 'desktop', 'Edge', 'Windows', 'Pakistan', CURRENT_TIMESTAMP, false
    )
  `, [userId, sessionToken, expiresAt]);

  await pool.end();

  // Obtain consent cookie
  const consentRes = await fetch('http://localhost:3000/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'screenshot_anon_7',
    }),
  });
  const termsRaw = consentRes.headers.get('set-cookie')?.split(';')[0];
  const termsValue = termsRaw?.split('=')[1];

  console.log('Launching headless Edge...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setCookie(
    { name: 'poppo_terms_consent', value: termsValue, domain: 'localhost', path: '/' },
    { name: 'poppo_session', value: sessionToken, domain: 'localhost', path: '/' }
  );

  // 1. Mobile - Settings Page (430x932, matches 02_07_settings_pin_blacklist.png)
  console.log('Capturing Mobile /settings...');
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '01_mobile_settings.png'), fullPage: true });

  // 2. Mobile - Blacklist Page (with 12 blocked users)
  console.log('Capturing Mobile /settings/blacklist...');
  await page.goto('http://localhost:3000/settings/blacklist', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '02_mobile_blacklist.png'), fullPage: true });

  // 3. Desktop - Settings Page (1440x950)
  console.log('Capturing Desktop /settings...');
  await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
  await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '03_desktop_settings.png') });

  // 4. Mobile - Privacy Settings Modal
  console.log('Capturing Mobile /settings with Privacy Modal...');
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const privBtn = buttons.find((b) => b.textContent.includes('Privacy') || b.textContent.includes('رازداری'));
    if (privBtn) privBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '04_mobile_privacy_modal.png') });

  // 5. Mobile - Account Information Modal
  console.log('Capturing Mobile /settings with Account Modal...');
  await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const accBtn = buttons.find((b) => b.textContent.includes('Account & Security') || b.textContent.includes('اکاؤنٹ'));
    if (accBtn) accBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '05_mobile_account_modal.png') });

  await browser.close();
  console.log('All screenshots saved successfully in:', outDir);
}

main().catch((err) => {
  console.error('Screenshot script failed:', err);
  process.exit(1);
});
