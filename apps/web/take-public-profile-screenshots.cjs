const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { Pool } = require('pg');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join('d:', 'popo live', 'docs', 'screenshots', 'phase2_prompt6');

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const pool = new Pool({
    connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  });
  await pool.query('DELETE FROM popolive.rate_limits');

  // Setup "Anaya Live" matching 02_06_public_profile.png
  const streamerEmail = 'anaya.live@popolive.com';
  let sRows = await pool.query('SELECT id, poppo_id FROM popolive.users WHERE email = $1', [streamerEmail]);
  let streamerId;
  let poppoId = '123666789';

  if (sRows.rows.length === 0) {
    const sIns = await pool.query(`
      INSERT INTO popolive.users (
        poppo_id, email, nickname, avatar_url, gender, birthdate, country, country_code, bio, host_level, wealth_level, is_profile_completed, is_adult_verified, status
      ) VALUES (
        $1, $2, 'Anaya Live', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
        'female', '1999-04-12', 'Pakistan', 'PK',
        '✨ Top PK Champion & Daily Streamer! Welcome to Anaya Live stream family! Daily 8 PM PKT 💖 Let’s rank together!',
        15, 9, true, true, 'active'
      ) RETURNING id, poppo_id
    `, [poppoId, streamerEmail]);
    streamerId = sIns.rows[0].id;
  } else {
    streamerId = sRows.rows[0].id;
    await pool.query(`
      UPDATE popolive.users SET
        poppo_id = '123666789',
        nickname = 'Anaya Live',
        avatar_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
        gender = 'female',
        birthdate = '1999-04-12',
        country = 'Pakistan',
        country_code = 'PK',
        bio = '✨ Top PK Champion & Daily Streamer! Welcome to Anaya Live stream family! Daily 8 PM PKT 💖 Let’s rank together!',
        host_level = 15,
        wealth_level = 9
      WHERE id = $1
    `, [streamerId]);
  }

  // Setup viewer user
  const viewerEmail = 'viewer.screenshots@popolive.com';
  let vRows = await pool.query('SELECT id FROM popolive.users WHERE email = $1', [viewerEmail]);
  let viewerId;
  if (vRows.rows.length === 0) {
    const vIns = await pool.query(`
      INSERT INTO popolive.users (
        poppo_id, email, nickname, avatar_url, gender, birthdate, country, country_code, bio, host_level, wealth_level, is_profile_completed, is_adult_verified, status
      ) VALUES (
        '77889911', $1, 'Sara Khan', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
        'female', '1998-08-15', 'Pakistan', 'PK', 'Viewer & Streamer', 12, 8, true, true, 'active'
      ) RETURNING id
    `, [viewerEmail]);
    viewerId = vIns.rows[0].id;
  } else {
    viewerId = vRows.rows[0].id;
  }

  // Create follow relationship: viewer follows streamer
  await pool.query(`
    INSERT INTO popolive.user_follows (follower_id, following_id)
    VALUES ($1, $2) ON CONFLICT DO NOTHING
  `, [viewerId, streamerId]);

  // Create session token for viewer
  const crypto = require('crypto');
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await pool.query(`
    INSERT INTO popolive.sessions (
      user_id, session_token, user_agent, ip_hash, expires_at, device_type, browser_name, os_name, location, last_active_at, is_revoked
    ) VALUES (
      $1, $2, 'Edge Headless Automation', 'hash123', $3, 'desktop', 'Edge', 'Windows', 'Pakistan', CURRENT_TIMESTAMP, false
    )
  `, [viewerId, sessionToken, expiresAt]);

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
      anonymousSessionId: 'screenshot_anon_6',
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

  // 1. Mobile - Public Profile Live Tab (430x932)
  console.log('Capturing Mobile /user/123666789 (Live tab)...');
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/user/123666789', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '01_mobile_public_profile_live.png'), fullPage: true });

  // 2. Mobile - About Tab
  console.log('Capturing Mobile /user/123666789 (About tab)...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const aboutBtn = buttons.find((b) => b.textContent.includes('About') || b.textContent.includes('معلومات'));
    if (aboutBtn) aboutBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '02_mobile_public_profile_about.png'), fullPage: true });

  // 3. Desktop - Public Profile (1440x950)
  console.log('Capturing Desktop /user/123666789...');
  await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
  await page.goto('http://localhost:3000/user/123666789', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '03_desktop_public_profile.png') });

  // 4. Mobile - Followers Page
  console.log('Capturing Mobile /user/123666789/followers...');
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/user/123666789/followers', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '04_mobile_followers.png'), fullPage: true });

  // 5. Mobile - Following Page
  console.log('Capturing Mobile /user/123666789/following...');
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/user/123666789/following', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '05_mobile_following.png'), fullPage: true });

  await browser.close();
  console.log('All screenshots saved successfully in:', outDir);
}

main().catch((err) => {
  console.error('Screenshot script failed:', err);
  process.exit(1);
});
