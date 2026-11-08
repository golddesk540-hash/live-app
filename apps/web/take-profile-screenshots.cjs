const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { Pool } = require('pg');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join('d:', 'popo live', 'docs', 'screenshots', 'phase2_prompt5');

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Ensure a user matching the reference "Sara Khan" exists with ID 98765432
  const pool = new Pool({ connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive' });
  await pool.query('DELETE FROM popolive.rate_limits');

  const email = 'sara.khan@popolive.com';
  // Check if user exists or create
  let userRows = await pool.query('SELECT id, poppo_id FROM popolive.users WHERE email = $1', [email]);
  let userId;
  let poppoId;

  if (userRows.rows.length === 0) {
    const insertRes = await pool.query(`
      INSERT INTO popolive.users (
        poppo_id, email, nickname, avatar_url, gender, birthdate, country, country_code, bio, host_level, wealth_level, is_profile_completed, is_adult_verified, status
      ) VALUES (
        '98765432', $1, 'Sara Khan', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        'female', '1998-08-15', 'Pakistan', 'PK',
        '🎙️ Solo Singer | Daily Live 9PM PKT | Let’s hit Level 40 together! ✨ Welcome to my stream community 🌟',
        12, 8, true, true, 'active'
      ) RETURNING id, poppo_id
    `, [email]);
    userId = insertRes.rows[0].id;
    poppoId = insertRes.rows[0].poppo_id;
  } else {
    userId = userRows.rows[0].id;
    poppoId = userRows.rows[0].poppo_id;
    await pool.query(`
      UPDATE popolive.users SET
        nickname = 'Sara Khan',
        avatar_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        gender = 'female',
        birthdate = '1998-08-15',
        country = 'Pakistan',
        country_code = 'PK',
        bio = '🎙️ Solo Singer | Daily Live 9PM PKT | Let’s hit Level 40 together! ✨ Welcome to my stream community 🌟',
        host_level = 12,
        wealth_level = 8
      WHERE id = $1
    `, [userId]);
  }

  // Create an active session token
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
      anonymousSessionId: 'screenshot_anon',
    }),
  });
  const termsRaw = consentRes.headers.get('set-cookie')?.split(';')[0];
  const termsValue = termsRaw?.split('=')[1];

  console.log('User setup complete. Launching headless browser...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Set cookies
  await page.setCookie(
    { name: 'poppo_terms_consent', value: termsValue, domain: 'localhost', path: '/' },
    { name: 'poppo_session', value: sessionToken, domain: 'localhost', path: '/' }
  );

  // 1. Mobile - Posts Tab (iPhone 14/15 size: 430x932)
  console.log('Capturing Mobile /profile (Posts tab)...');
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '01_mobile_profile_posts.png'), fullPage: true });

  // 2. Mobile - About Tab
  console.log('Capturing Mobile /profile (About tab)...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const aboutBtn = buttons.find((b) => b.textContent.includes('About') || b.textContent.includes('معلومات'));
    if (aboutBtn) aboutBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '02_mobile_profile_about.png'), fullPage: true });

  // 3. Desktop - 1440x900 Viewport
  console.log('Capturing Desktop /profile...');
  await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
  await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '03_desktop_profile.png') });

  // 4. Mobile - Edit Profile Page
  console.log('Capturing Mobile /profile/edit...');
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/profile/edit', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '04_mobile_profile_edit.png'), fullPage: true });

  // 5. Desktop - Edit Profile Page
  console.log('Capturing Desktop /profile/edit...');
  await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
  await page.goto('http://localhost:3000/profile/edit', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '05_desktop_profile_edit.png') });

  await browser.close();
  console.log('All screenshots saved successfully in:', outDir);
}

main().catch((err) => {
  console.error('Screenshot script failed:', err);
  process.exit(1);
});
